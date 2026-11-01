
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const ESPN_BASE =
  'https://site.api.espn.com/apis/v2/sports/soccer';

const PYTHON_API = (
  process.env.LANUS_API_URL ||
  'https://aifball-python-api.onrender.com'
).replace(/\/+$/, '');

const API_SECRET = process.env.LANUS_API_SECRET || '';

const ESPN_TIMEOUT_MS = 12000;
const FOTMOB_TIMEOUT_MS = 25000;

type JsonRecord = Record<string, unknown>;

interface StandingRow {
  id: string;
  pos: number | null;
  name: string;
  logo: string | null;
  played: number | null;
  won: number | null;
  draw: number | null;
  lost: number | null;
  gf: number | null;
  ga: number | null;
  gd: number | null;
  pts: number | null;
}

interface StandingGroup {
  id: string;
  name: string;
  rows: StandingRow[];
}

interface StandingsData {
  source: 'ESPN' | 'FotMob';
  league: string;
  leagueName: string | null;
  season: string | number | null;
  seasonName: string | null;
  groups: StandingGroup[];
  rows: StandingRow[];
  groupCount: number;
  updatedAt: string;
}

const LEAGUE_ALIASES: Record<string, string[]> = {
  'ksa.1': [
    'Saudi Pro League',
    'Saudi Professional League',
    'دوري روشن السعودي',
  ],
  'egy.1': [
    'Egyptian Premier League',
    'الدوري المصري الممتاز',
  ],
  'uae.1': [
    'UAE Pro League',
    'Adnoc Pro League',
    'الدوري الإماراتي',
  ],
  'qat.1': [
    'Qatar Stars League',
    'الدوري القطري',
  ],
  'kuw.1': [
    'Kuwait Premier League',
    'الدوري الكويتي',
  ],
  'bhr.1': [
    'Bahraini Premier League',
    'الدوري البحريني',
  ],
  'oma.1': [
    'Oman Professional League',
    'الدوري العماني',
  ],
  'irq.1': [
    'Iraq Stars League',
    'الدوري العراقي',
  ],
  'eng.1': ['Premier League'],
  'esp.1': ['LaLiga', 'La Liga'],
  'ita.1': ['Serie A'],
  'ger.1': ['Bundesliga'],
  'fra.1': ['Ligue 1'],
  'por.1': ['Liga Portugal'],
  'ned.1': ['Eredivisie'],
  'tur.1': ['Super Lig', 'Süper Lig'],
  'bra.1': ['Brasileirao', 'Brasileirão'],
  'arg.1': ['Liga Profesional Argentina'],
  'usa.1': ['Major League Soccer', 'MLS'],
  'mex.1': ['Liga MX'],
  'jpn.1': ['J1 League'],
  'kor.1': ['K League 1'],
  'uefa.champions': ['Champions League'],
};

const KNOWN_FOTMOB_IDS: Record<string, number> = {
  'ksa.1': 536,
  'eng.1': 47,
  'esp.1': 87,
  'ita.1': 55,
  'ger.1': 54,
  'fra.1': 53,
  'uefa.champions': 42,
};

function asRecord(value: unknown): JsonRecord | null {
  if (
    value === null ||
    typeof value !== 'object' ||
    Array.isArray(value)
  ) {
    return null;
  }

  return value as JsonRecord;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asText(value: unknown): string {
  if (typeof value === 'string') {
    return value.trim();
  }

  if (
    typeof value === 'number' &&
    Number.isFinite(value)
  ) {
    return String(value);
  }

  return '';
}

function asNumber(value: unknown): number | null {
  if (
    typeof value === 'number' &&
    Number.isFinite(value)
  ) {
    return value;
  }

  if (
    typeof value === 'string' &&
    /^-?\d+(?:\.\d+)?$/.test(value.trim())
  ) {
    const result = Number(value);
    return Number.isFinite(result) ? result : null;
  }

  return null;
}

function firstValue(
  obj: JsonRecord | null,
  keys: string[]
): unknown {
  if (!obj) return null;

  for (const key of keys) {
    const value = obj[key];

    if (
      value !== undefined &&
      value !== null &&
      value !== ''
    ) {
      return value;
    }
  }

  return null;
}

function safeLogo(value: unknown): string | null {
  const raw = asText(value);

  if (!raw) return null;

  try {
    const url = new URL(raw);
    return url.protocol === 'https:'
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

function normalizeText(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u064b-\u065f]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

function getESPNStat(
  entry: JsonRecord,
  names: string[]
): number | null {
  const stats = asArray(entry.stats);

  for (const name of names) {
    const found = stats
      .map(asRecord)
      .find(
        (stat) =>
          stat &&
          (stat.name === name || stat.type === name)
      );

    if (!found) continue;

    const value =
      asNumber(found.value) ??
      asNumber(found.displayValue);

    if (value !== null) return value;
  }

  return null;
}

function normalizeESPNEntry(
  raw: unknown
): StandingRow | null {
  const entry = asRecord(raw);
  const team = asRecord(entry?.team);

  if (!entry || !team) return null;

  const name = asText(
    firstValue(team, [
      'shortDisplayName',
      'displayName',
      'name',
    ])
  );

  if (!name) return null;

  const logos = asArray(team.logos);
  const logoData = asRecord(logos[0]);

  const gf = getESPNStat(entry, [
    'pointsFor',
    'goalsFor',
  ]);

  const ga = getESPNStat(entry, [
    'pointsAgainst',
    'goalsAgainst',
  ]);

  const gd =
    getESPNStat(entry, [
      'pointDifferential',
      'goalDifference',
    ]) ??
    (gf !== null && ga !== null
      ? gf - ga
      : null);

  return {
    id: asText(team.id) || name,
    pos:
      getESPNStat(entry, ['rank']) ??
      asNumber(entry.rank),
    name,
    logo: safeLogo(
      firstValue(logoData, ['href', 'url'])
    ),
    played: getESPNStat(entry, [
      'gamesPlayed',
      'matchesPlayed',
    ]),
    won: getESPNStat(entry, ['wins']),
    draw: getESPNStat(entry, ['ties', 'draws']),
    lost: getESPNStat(entry, ['losses']),
    gf,
    ga,
    gd,
    pts: getESPNStat(entry, ['points']),
  };
}

function normalizeESPNGroup(
  raw: unknown,
  index: number
): StandingGroup | null {
  const group = asRecord(raw);

  if (!group) return null;

  const standings = asRecord(group.standings);

  const entries = asArray(
    standings?.entries ?? group.entries
  );

  const rows = entries
    .map(normalizeESPNEntry)
    .filter(
      (row): row is StandingRow => row !== null
    );

  if (!rows.length) return null;

  if (rows.every((row) => row.pos !== null)) {
    rows.sort(
      (a, b) =>
        (a.pos as number) - (b.pos as number)
    );
  }

  return {
    id:
      asText(group.id) ||
      `group-${index + 1}`,
    name:
      asText(
        firstValue(group, [
          'name',
          'displayName',
          'abbreviation',
        ])
      ) || `المجموعة ${index + 1}`,
    rows,
  };
}

function collectESPNGroups(
  payload: JsonRecord
): StandingGroup[] {
  const groups = asArray(payload.children)
    .map(normalizeESPNGroup)
    .filter(
      (group): group is StandingGroup =>
        group !== null
    );

  if (groups.length) return groups;

  const direct = normalizeESPNGroup(
    {
      id: 'main',
      name: 'الترتيب العام',
      standings: payload.standings,
      entries: payload.entries,
    },
    0
  );

  return direct ? [direct] : [];
}

function normalizeFotMobRow(
  raw: unknown
): StandingRow | null {
  const row = asRecord(raw);

  if (!row) return null;

  const name = asText(row.name);

  if (!name) return null;

  const gf = asNumber(
    firstValue(row, ['gf', 'goalsFor'])
  );

  const ga = asNumber(
    firstValue(row, ['ga', 'goalsAgainst'])
  );

  return {
    id: asText(row.id) || name,
    pos: asNumber(
      firstValue(row, ['pos', 'position', 'rank'])
    ),
    name,
    logo: safeLogo(row.logo),
    played: asNumber(row.played),
    won: asNumber(row.won),
    draw: asNumber(row.draw),
    lost: asNumber(row.lost),
    gf,
    ga,
    gd:
      asNumber(row.gd) ??
      (gf !== null && ga !== null
        ? gf - ga
        : null),
    pts: asNumber(
      firstValue(row, ['pts', 'points'])
    ),
  };
}

function normalizeFotMobResponse(
  raw: unknown,
  league: string,
  requestedSeason: string | null
): StandingsData | null {
  const payload = asRecord(raw);

  if (!payload) return null;

  const rawGroups = asArray(payload.groups);

  const groups = rawGroups
    .map((value, index) => {
      const group = asRecord(value);

      if (!group) return null;

      const rows = asArray(group.rows)
        .map(normalizeFotMobRow)
        .filter(
          (row): row is StandingRow => row !== null
        );

      if (!rows.length) return null;

      return {
        id:
          asText(group.id) ||
          `group-${index + 1}`,
        name:
          asText(group.name) ||
          `المجموعة ${index + 1}`,
        rows,
      };
    })
    .filter(
      (group): group is StandingGroup =>
        group !== null
    );

  if (!groups.length) return null;

  const returnedSeason = asText(payload.season);

  if (
    requestedSeason &&
    returnedSeason &&
    !seasonsMatch(requestedSeason, returnedSeason)
  ) {
    return null;
  }

  return {
    source: 'FotMob',
    league,
    leagueName:
      asText(payload.leagueName) || null,
    season:
      returnedSeason ||
      requestedSeason,
    seasonName:
      asText(payload.seasonName) ||
      returnedSeason ||
      null,
    groups,
    rows: groups[0].rows,
    groupCount: groups.length,
    updatedAt: new Date().toISOString(),
  };
}

function parseSeason(
  input: string | null
): string | null {
  if (!input) return null;

  const season = input.trim();

  if (!/^\d{4}(?:[-/]\d{4})?$/.test(season)) {
    throw new Error('INVALID_SEASON');
  }

  const parts = season.split(/[-/]/);

  const start = Number(parts[0]);

  if (start < 1990 || start > 2100) {
    throw new Error('INVALID_SEASON');
  }

  if (
    parts.length === 2 &&
    Number(parts[1]) !== start + 1
  ) {
    throw new Error('INVALID_SEASON');
  }

  return season;
}

function seasonsMatch(
  requested: string,
  returned: string
): boolean {
  const requestedStart = Number(
    requested.split(/[-/]/)[0]
  );

  const returnedStart = Number(
    returned.split(/[-/]/)[0]
  );

  return (
    Number.isFinite(requestedStart) &&
    Number.isFinite(returnedStart) &&
    requestedStart === returnedStart
  );
}

function formatFotMobSeason(
  season: string | null
): string | null {
  if (!season) return null;

  if (season.includes('-')) {
    return season.replace('-', '/');
  }

  // لا نفترض أن جميع البطولات تستخدم
  // موسمًا يمتد على سنتين.
  return season;
}

async function fetchJSON(
  url: string,
  timeoutMs: number,
  headers?: HeadersInit
): Promise<unknown> {
  const controller = new AbortController();

  const timeout = setTimeout(
    () => controller.abort(),
    timeoutMs
  );

  try {
    const response = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...headers,
      },
    });

    if (!response.ok) {
      throw new Error(
        `UPSTREAM_HTTP_${response.status}`
      );
    }

    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function getESPNStandings(
  league: string,
  season: string | null
): Promise<StandingsData | null> {
  const url = new URL(
    `${ESPN_BASE}/${encodeURIComponent(league)}/standings`
  );

  if (season) {
    url.searchParams.set(
      'season',
      season.split(/[-/]/)[0]
    );
  }

  const raw = await fetchJSON(
    url.toString(),
    ESPN_TIMEOUT_MS
  );

  const payload = asRecord(raw);

  if (!payload) return null;

  const seasonInfo = asRecord(payload.season);

  const returnedSeason = asText(
    seasonInfo?.year
  );

  if (
    season &&
    returnedSeason &&
    !seasonsMatch(season, returnedSeason)
  ) {
    return null;
  }

  const groups = collectESPNGroups(payload);

  if (!groups.length) return null;

  return {
    source: 'ESPN',
    league,
    leagueName: null,
    season:
      returnedSeason ||
      season,
    seasonName:
      asText(seasonInfo?.displayName) ||
      null,
    groups,
    rows: groups[0].rows,
    groupCount: groups.length,
    updatedAt: new Date().toISOString(),
  };
}

function exactLeagueMatch(
  item: JsonRecord,
  league: string
): boolean {
  const candidates =
    LEAGUE_ALIASES[league] || [];

  const names = [
    asText(item.name),
    asText(item.localizedName),
  ];

  return names.some((name) =>
    candidates.some(
      (candidate) =>
        normalizeText(name) ===
        normalizeText(candidate)
    )
  );
}

async function resolveFotMobLeague(
  league: string
): Promise<number | null> {
  const known = KNOWN_FOTMOB_IDS[league];

  if (known) return known;

  if (/^\d+$/.test(league)) {
    const id = Number(league);

    return Number.isSafeInteger(id) && id > 0
      ? id
      : null;
  }

  const aliases = LEAGUE_ALIASES[league];

  if (!aliases?.length) return null;

  const matches = new Map<number, JsonRecord>();

  for (const alias of aliases.slice(0, 3)) {
    const url = new URL(
      `${PYTHON_API}/leagues/search`
    );

    url.searchParams.set('q', alias);
    url.searchParams.set('limit', '100');

    try {
      const raw = await fetchJSON(
        url.toString(),
        FOTMOB_TIMEOUT_MS,
        API_SECRET
          ? { 'x-api-key': API_SECRET }
          : undefined
      );

      const payload = asRecord(raw);

      for (const value of asArray(payload?.results)) {
        const item = asRecord(value);

        if (!item) continue;

        const id = asNumber(item.id);

        if (
          id !== null &&
          Number.isSafeInteger(id) &&
          exactLeagueMatch(item, league)
        ) {
          matches.set(id, item);
        }
      }
    } catch (error) {
      console.warn(
        '[AiFBall] FotMob league discovery:',
        league,
        error
      );
    }
  }

  // إذا ظهرت أكثر من بطولة مطابقة،
  // لا نخمن أي واحدة هي المقصودة.
  return matches.size === 1
    ? [...matches.keys()][0]
    : null;
}

async function getFotMobStandings(
  league: string,
  season: string | null
): Promise<StandingsData | null> {
  const fotmobId = await resolveFotMobLeague(
    league
  );

  if (fotmobId === null) return null;

  const url = new URL(
    `${PYTHON_API}/fotmob/standings`
  );

  url.searchParams.set(
    'league',
    String(fotmobId)
  );

  const formattedSeason = formatFotMobSeason(
    season
  );

  if (formattedSeason) {
    url.searchParams.set(
      'season',
      formattedSeason
    );
  }

  const raw = await fetchJSON(
    url.toString(),
    FOTMOB_TIMEOUT_MS,
    API_SECRET
      ? { 'x-api-key': API_SECRET }
      : undefined
  );

  return normalizeFotMobResponse(
    raw,
    league,
    season
  );
}

function errorResponse(
  error: string,
  status: number,
  code: string
) {
  return NextResponse.json(
    {
      error,
      code,
      groups: [],
      rows: [],
    },
    {
      status,
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  );
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const league = (
    searchParams.get('league') || 'ksa.1'
  )
    .trim()
    .toLowerCase();

  if (
    !/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/.test(league) ||
    league.length > 80
  ) {
    return errorResponse(
      'معرف البطولة غير صالح.',
      400,
      'INVALID_LEAGUE'
    );
  }

  let season: string | null;

  try {
    season = parseSeason(
      searchParams.get('season')
    );
  } catch {
    return errorResponse(
      'صيغة الموسم غير صحيحة.',
      400,
      'INVALID_SEASON'
    );
  }

  // 1. المصدر الأساسي: ESPN
  try {
    const espn = await getESPNStandings(
      league,
      season
    );

    if (espn) {
      return NextResponse.json(espn, {
        headers: {
          'Cache-Control': 'no-store',
        },
      });
    }
  } catch (error) {
    console.warn(
      '[AiFBall] ESPN unavailable:',
      league,
      error
    );
  }

  // 2. المصدر الاحتياطي: FotMob
  try {
    const fotmob = await getFotMobStandings(
      league,
      season
    );

    if (fotmob) {
      return NextResponse.json(fotmob, {
        headers: {
          'Cache-Control': 'no-store',
        },
      });
    }
  } catch (error) {
    console.warn(
      '[AiFBall] FotMob unavailable:',
      league,
      error
    );
  }

  // لا نرجع ترتيب بطولة أخرى أو موسم آخر.
  return errorResponse(
    'لم تتوفر بيانات ترتيب مؤكدة لهذه البطولة والموسم من المصادر المتاحة.',
    404,
    'STANDINGS_NOT_AVAILABLE'
  );
}
