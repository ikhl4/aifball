
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

const ESPN_TIMEOUT = 12000;
const FOTMOB_TIMEOUT = 25000;

type RecordData = Record<string, unknown>;

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
  season: string | null;
  seasonName: string | null;
  groups: StandingGroup[];
  rows: StandingRow[];
  groupCount: number;
  updatedAt: string;
}

const LEAGUES: Record<
  string,
  { name: string; fotmobId?: number }
> = {
  'ksa.1': {
    name: 'دوري روشن السعودي',
    fotmobId: 536,
  },
  'eng.1': {
    name: 'الدوري الإنجليزي الممتاز',
    fotmobId: 47,
  },
  'esp.1': {
    name: 'الدوري الإسباني',
    fotmobId: 87,
  },
  'ita.1': {
    name: 'الدوري الإيطالي',
    fotmobId: 55,
  },
  'ger.1': {
    name: 'الدوري الألماني',
    fotmobId: 54,
  },
  'fra.1': {
    name: 'الدوري الفرنسي',
    fotmobId: 53,
  },
  'uefa.champions': {
    name: 'دوري أبطال أوروبا',
    fotmobId: 42,
  },
  'usa.1': {
    name: 'الدوري الأمريكي MLS',
  },
};

function record(value: unknown): RecordData | null {
  if (
    value === null ||
    typeof value !== 'object' ||
    Array.isArray(value)
  ) {
    return null;
  }

  return value as RecordData;
}

function array(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function text(value: unknown): string {
  if (typeof value === 'string') return value.trim();

  if (
    typeof value === 'number' &&
    Number.isFinite(value)
  ) {
    return String(value);
  }

  return '';
}

function number(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'string') {
    const clean = value.trim().replace(/,/g, '');

    if (/^-?\d+(?:\.\d+)?$/.test(clean)) {
      const result = Number(clean);
      return Number.isFinite(result) ? result : null;
    }
  }

  return null;
}

function first(
  item: RecordData | null,
  keys: string[]
): unknown {
  if (!item) return null;

  for (const key of keys) {
    const value = item[key];

    if (
      value !== null &&
      value !== undefined &&
      value !== ''
    ) {
      return value;
    }
  }

  return null;
}

function safeLogo(value: unknown): string | null {
  const input = text(value);

  if (!input) return null;

  try {
    const url = new URL(input);

    return url.protocol === 'https:'
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

function parseSeason(
  input: string | null
): string | null {
  if (!input?.trim()) return null;

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

function seasonStart(value: string): number | null {
  const match = value.match(/^(\d{4})/);

  return match ? Number(match[1]) : null;
}

function seasonsMatch(
  requested: string,
  returned: string
): boolean {
  const a = seasonStart(requested);
  const b = seasonStart(returned);

  return a !== null && b !== null && a === b;
}

function espnStat(
  entry: RecordData,
  names: string[]
): number | null {
  const stats = array(entry.stats);

  for (const name of names) {
    for (const raw of stats) {
      const stat = record(raw);

      if (!stat) continue;

      if (
        stat.name !== name &&
        stat.type !== name &&
        stat.abbreviation !== name
      ) {
        continue;
      }

      const result =
        number(stat.value) ??
        number(stat.displayValue);

      if (result !== null) return result;
    }
  }

  return null;
}

function normalizeESPNRow(
  raw: unknown
): StandingRow | null {
  const entry = record(raw);
  const team = record(entry?.team);

  if (!entry || !team) return null;

  const name = text(
    first(team, [
      'shortDisplayName',
      'displayName',
      'name',
    ])
  );

  if (!name) return null;

  const logos = array(team.logos);
  const firstLogo = record(logos[0]);

  const gf = espnStat(entry, [
    'pointsFor',
    'goalsFor',
  ]);

  const ga = espnStat(entry, [
    'pointsAgainst',
    'goalsAgainst',
  ]);

  const gd =
    espnStat(entry, [
      'pointDifferential',
      'goalDifference',
    ]) ??
    (gf !== null && ga !== null
      ? gf - ga
      : null);

  return {
    id: text(team.id) || name,
    pos:
      espnStat(entry, ['rank']) ??
      number(entry.rank),
    name,
    logo: safeLogo(
      first(firstLogo, ['href', 'url']) ??
        team.logo
    ),
    played: espnStat(entry, [
      'gamesPlayed',
      'matchesPlayed',
    ]),
    won: espnStat(entry, ['wins']),
    draw: espnStat(entry, ['ties', 'draws']),
    lost: espnStat(entry, ['losses']),
    gf,
    ga,
    gd,
    pts: espnStat(entry, ['points']),
  };
}

function sortRows(rows: StandingRow[]): StandingRow[] {
  return rows
    .map((row, index) => ({ row, index }))
    .sort((a, b) => {
      if (a.row.pos === null && b.row.pos === null) {
        return a.index - b.index;
      }

      if (a.row.pos === null) return 1;
      if (b.row.pos === null) return -1;

      return (
        a.row.pos - b.row.pos ||
        a.index - b.index
      );
    })
    .map(({ row }) => row);
}

function normalizeESPNGroup(
  raw: unknown,
  index: number
): StandingGroup | null {
  const group = record(raw);

  if (!group) return null;

  const standings = record(group.standings);

  const entries = array(
    standings?.entries ?? group.entries
  );

  const rows = entries
    .map(normalizeESPNRow)
    .filter(
      (row): row is StandingRow => row !== null
    );

  if (!rows.length) return null;

  return {
    id: text(group.id) || `group-${index + 1}`,
    name:
      text(
        first(group, [
          'name',
          'displayName',
          'abbreviation',
        ])
      ) || 'الترتيب العام',
    rows: sortRows(rows),
  };
}

function collectESPNGroups(
  payload: RecordData
): StandingGroup[] {
  const children = array(payload.children);

  const groups = children
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
  const item = record(raw);

  if (!item) return null;

  const name = text(item.name);

  if (!name) return null;

  const gf = number(
    first(item, ['gf', 'goalsFor'])
  );

  const ga = number(
    first(item, ['ga', 'goalsAgainst'])
  );

  return {
    id: text(item.id) || name,
    pos: number(
      first(item, ['pos', 'position', 'rank'])
    ),
    name,
    logo: safeLogo(item.logo),
    played: number(item.played),
    won: number(item.won),
    draw: number(item.draw),
    lost: number(item.lost),
    gf,
    ga,
    gd:
      number(item.gd) ??
      (gf !== null && ga !== null
        ? gf - ga
        : null),
    pts: number(
      first(item, ['pts', 'points'])
    ),
  };
}

function normalizeFotMob(
  raw: unknown,
  league: string,
  requestedSeason: string | null
): StandingsData | null {
  const payload = record(raw);

  if (!payload) return null;

  const returnedSeason = text(payload.season);

  if (requestedSeason) {
    // إذا طلب المستخدم موسمًا محددًا،
    // لا نقبل نتيجة لا تؤكد الموسم.
    if (
      !returnedSeason ||
      !seasonsMatch(
        requestedSeason,
        returnedSeason
      )
    ) {
      return null;
    }
  }

  const groups = array(payload.groups)
    .map((rawGroup, index) => {
      const group = record(rawGroup);

      if (!group) return null;

      const rows = array(group.rows)
        .map(normalizeFotMobRow)
        .filter(
          (row): row is StandingRow =>
            row !== null
        );

      if (!rows.length) return null;

      return {
        id:
          text(group.id) ||
          `group-${index + 1}`,
        name:
          text(group.name) ||
          `المجموعة ${index + 1}`,
        rows: sortRows(rows),
      };
    })
    .filter(
      (group): group is StandingGroup =>
        group !== null
    );

  if (!groups.length) return null;

  return {
    source: 'FotMob',
    league,
    leagueName:
      text(payload.leagueName) ||
      LEAGUES[league]?.name ||
      null,
    season:
      returnedSeason ||
      requestedSeason,
    seasonName:
      text(payload.seasonName) ||
      returnedSeason ||
      null,
    groups,
    rows: groups[0].rows,
    groupCount: groups.length,
    updatedAt: new Date().toISOString(),
  };
}

async function fetchJSON(
  url: string,
  timeoutMs: number,
  headers?: Record<string, string>
): Promise<unknown> {
  const controller = new AbortController();

  const timer = setTimeout(
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
    clearTimeout(timer);
  }
}

async function getESPN(
  league: string,
  requestedSeason: string | null
): Promise<StandingsData | null> {
  const url = new URL(
    `${ESPN_BASE}/${encodeURIComponent(
      league
    )}/standings`
  );

  if (requestedSeason) {
    url.searchParams.set(
      'season',
      String(seasonStart(requestedSeason))
    );
  }

  const raw = await fetchJSON(
    url.toString(),
    ESPN_TIMEOUT
  );

  const payload = record(raw);

  if (!payload) return null;

  const seasonInfo = record(payload.season);
  const returnedSeason = text(seasonInfo?.year);

  if (requestedSeason) {
    if (
      !returnedSeason ||
      !seasonsMatch(
        requestedSeason,
        returnedSeason
      )
    ) {
      return null;
    }
  }

  const groups = collectESPNGroups(payload);

  if (!groups.length) return null;

  return {
    source: 'ESPN',
    league,
    leagueName: LEAGUES[league]?.name || null,
    season: returnedSeason || null,
    seasonName:
      text(seasonInfo?.displayName) ||
      returnedSeason ||
      null,
    groups,
    rows: groups[0].rows,
    groupCount: groups.length,
    updatedAt: new Date().toISOString(),
  };
}

async function getFotMob(
  league: string,
  requestedSeason: string | null
): Promise<StandingsData | null> {
  const config = LEAGUES[league];

  // لا نخمن معرف FotMob للدوري الأمريكي
  // أو لأي بطولة غير موثقة.
  if (!config?.fotmobId) return null;

  const url = new URL(
    `${PYTHON_API}/fotmob/standings`
  );

  url.searchParams.set(
    'league',
    String(config.fotmobId)
  );

  if (requestedSeason) {
    url.searchParams.set(
      'season',
      requestedSeason.replace('-', '/')
    );
  }

  const raw = await fetchJSON(
    url.toString(),
    FOTMOB_TIMEOUT,
    API_SECRET
      ? { 'x-api-key': API_SECRET }
      : undefined
  );

  return normalizeFotMob(
    raw,
    league,
    requestedSeason
  );
}

function errorResponse(
  message: string,
  status: number,
  code: string
) {
  return NextResponse.json(
    {
      error: message,
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

  if (!Object.prototype.hasOwnProperty.call(
    LEAGUES,
    league
  )) {
    return errorResponse(
      'هذه البطولة غير مفعّلة حاليًا في فوتبلاي.',
      400,
      'UNSUPPORTED_LEAGUE'
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

  // المصدر الأول: ESPN
  try {
    const data = await getESPN(
      league,
      season
    );

    if (data) {
      return NextResponse.json(data, {
        headers: {
          'Cache-Control': 'no-store',
        },
      });
    }
  } catch (error) {
    console.warn(
      '[AiFBall] ESPN standings failed:',
      league,
      error
    );
  }

  // المصدر الثاني: FotMob
  try {
    const data = await getFotMob(
      league,
      season
    );

    if (data) {
      return NextResponse.json(data, {
        headers: {
          'Cache-Control': 'no-store',
        },
      });
    }
  } catch (error) {
    console.warn(
      '[AiFBall] FotMob standings failed:',
      league,
      error
    );
  }

  return errorResponse(
    'لم تتوفر بيانات ترتيب مؤكدة لهذه البطولة والموسم من المصادر المتاحة.',
    404,
    'STANDINGS_NOT_AVAILABLE'
  );
}
