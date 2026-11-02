import { COMPETITIONS } from '../../../lib/competitions';

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

const LEAGUES = Object.fromEntries(Object.entries(COMPETITIONS).map(([code, item]) => [code, { name: item.ar, fotmobId: item.fotmobId }]));

// ==========================================
// General helpers
// ==========================================

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

function number(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'string') {
    const clean = value.trim().replace(/,/g, '');

    if (/^-?\d+(?:\.\d+)?$/.test(clean)) {
      const parsed = Number(clean);
      return Number.isFinite(parsed) ? parsed : null;
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

function jsonResponse(
  data: unknown,
  status = 200
) {
  return NextResponse.json(data, {
    status,
    headers: {
      'Content-Type':
        'application/json; charset=utf-8',
      'Cache-Control':
        'no-store, no-cache, must-revalidate',
    },
  });
}

// ==========================================
// Season validation
// ==========================================

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

function seasonStart(
  value: string
): number | null {
  const match = value.match(/^(\d{4})/);

  return match ? Number(match[1]) : null;
}

function seasonsMatch(
  requested: string,
  returned: string
): boolean {
  const requestedYear = seasonStart(requested);
  const returnedYear = seasonStart(returned);

  return (
    requestedYear !== null &&
    returnedYear !== null &&
    requestedYear === returnedYear
  );
}

// ==========================================
// Diagnostic logging
// ==========================================

function diagnostic(
  source: string,
  league: string,
  message: string,
  details?: RecordData
) {
  console.info(
    `[AiFBall Standings] ${source} | ${league} | ${message}`,
    details || {}
  );
}

function errorDetails(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }

  return String(error);
}

// ==========================================
// Row validation
// ==========================================

function isNonNegativeInteger(
  value: number | null
): boolean {
  return (
    value === null ||
    (Number.isInteger(value) && value >= 0)
  );
}

function isValidRow(row: StandingRow): boolean {
  if (!row.id || !row.name) {
    return false;
  }

  if (
    row.pos !== null &&
    (!Number.isInteger(row.pos) || row.pos < 1)
  ) {
    return false;
  }

  if (
    ![
      row.played,
      row.won,
      row.draw,
      row.lost,
      row.gf,
      row.ga,
    ].every(isNonNegativeInteger)
  ) {
    return false;
  }

  if (
    row.gd !== null &&
    !Number.isInteger(row.gd)
  ) {
    return false;
  }

  if (
    row.pts !== null &&
    !Number.isFinite(row.pts)
  ) {
    return false;
  }

  if (
    row.played !== null &&
    row.won !== null &&
    row.draw !== null &&
    row.lost !== null &&
    row.won + row.draw + row.lost !== row.played
  ) {
    return false;
  }

  if (
    row.gf !== null &&
    row.ga !== null &&
    row.gd !== null &&
    row.gf - row.ga !== row.gd
  ) {
    return false;
  }

  return true;
}

function validateRows(
  rows: StandingRow[],
  source: string,
  league: string
): StandingRow[] {
  const ids = new Set<string>();
  const positions = new Set<number>();

  const validRows: StandingRow[] = [];

  for (const row of rows) {
    if (!isValidRow(row)) {
      diagnostic(source, league, 'INVALID_ROW', {
        team: row.name,
        id: row.id,
      });
      continue;
    }

    if (ids.has(row.id)) {
      diagnostic(source, league, 'DUPLICATE_TEAM', {
        id: row.id,
      });
      continue;
    }

    if (
      row.pos !== null &&
      positions.has(row.pos)
    ) {
      diagnostic(
        source,
        league,
        'DUPLICATE_POSITION',
        {
          team: row.name,
          position: row.pos,
        }
      );
      continue;
    }

    ids.add(row.id);

    if (row.pos !== null) {
      positions.add(row.pos);
    }

    validRows.push(row);
  }

  return validRows;
}

function sortRows(
  rows: StandingRow[]
): StandingRow[] {
  return rows
    .map((row, index) => ({ row, index }))
    .sort((a, b) => {
      if (
        a.row.pos === null &&
        b.row.pos === null
      ) {
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

// ==========================================
// ESPN statistics
// ==========================================

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

      const value =
        number(stat.value) ??
        number(stat.displayValue);

      if (value !== null) {
        return value;
      }
    }
  }

  return null;
}

// ==========================================
// ESPN row normalization
// ==========================================

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
      number(entry.rank) ??
      number(team.rank),

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

    draw: espnStat(entry, [
      'ties',
      'draws',
    ]),

    lost: espnStat(entry, ['losses']),

    gf,
    ga,
    gd,

    pts: espnStat(entry, ['points']),
  };
}

// ==========================================
// ESPN groups
// ==========================================

function normalizeESPNGroup(
  raw: unknown,
  index: number,
  league: string
): StandingGroup | null {
  const group = record(raw);

  if (!group) return null;

  const standings = record(group.standings);

  const entries = array(
    standings?.entries ?? group.entries
  );

  const parsedRows = entries
    .map(normalizeESPNRow)
    .filter(
      (row): row is StandingRow =>
        row !== null
    );

  const rows = sortRows(
    validateRows(parsedRows, 'ESPN', league)
  );

  if (!rows.length) {
    diagnostic(
      'ESPN',
      league,
      'EMPTY_OR_INVALID_GROUP',
      {
        group: text(group.id),
        entries: entries.length,
      }
    );
    return null;
  }

  return {
    id:
      text(group.id) ||
      `group-${index + 1}`,

    name:
      text(
        first(group, [
          'name',
          'displayName',
          'abbreviation',
        ])
      ) || 'الترتيب العام',

    rows,
  };
}

function collectESPNGroups(
  payload: RecordData,
  league: string
): StandingGroup[] {
  const groups: StandingGroup[] = [];
  const visit = (node: RecordData, ancestors: string[]) => {
    const label = text(first(node, ['name', 'displayName', 'abbreviation']));
    const children = array(node.children).map(record).filter((child): child is RecordData => child !== null);
    if (children.length) {
      for (const child of children) visit(child, label ? [...ancestors, label] : ancestors);
      return;
    }
    const group = normalizeESPNGroup(node, groups.length, league);
    if (!group) return;
    // Stable unique paths retain independent regions / groups in nested payloads.
    group.id = [...ancestors, label || group.id].join(' / ');
    group.name = ancestors.length > 1 ? [...ancestors.slice(1), group.name].join(' / ') : group.name;
    groups.push(group);
  };
  visit(payload, []);
  return groups;
}

// ==========================================
// ESPN season extraction
// ==========================================

function extractESPNSeason(
  payload: RecordData
): {
  season: string | null;
  seasonName: string | null;
} {
  const rootSeason = record(payload.season);

  const children = array(payload.children);

  const firstChild = children
    .map(record)
    .find((child) => child !== null);

  const childSeason = record(
    firstChild?.season
  );

  const season =
    text(rootSeason?.year) ||
    text(rootSeason?.startYear) ||
    text(payload.season) ||
    text(childSeason?.year) ||
    text(childSeason?.startYear) ||
    text(firstChild?.season) ||
    null;

  const seasonName =
    text(rootSeason?.displayName) ||
    text(rootSeason?.name) ||
    text(payload.seasonDisplayName) ||
    text(childSeason?.displayName) ||
    text(childSeason?.name) ||
    text(firstChild?.seasonDisplayName) ||
    text(firstChild?.name) ||
    season;

  return {
    season,
    seasonName,
  };
}

// ==========================================
// FotMob row normalization
// ==========================================

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
      first(item, [
        'pos',
        'position',
        'rank',
      ])
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

// ==========================================
// FotMob normalization
// ==========================================

function normalizeFotMob(
  raw: unknown,
  league: string,
  requestedSeason: string | null
): StandingsData | null {
  const payload = record(raw);

  if (!payload) return null;

  const returnedSeason = text(payload.season);

  if (requestedSeason) {
    if (
      !returnedSeason ||
      !seasonsMatch(
        requestedSeason,
        returnedSeason
      )
    ) {
      diagnostic(
        'FotMob',
        league,
        'SEASON_MISMATCH',
        {
          requestedSeason,
          returnedSeason,
        }
      );
      return null;
    }
  }

  const groups = array(payload.groups)
    .map((rawGroup, index) => {
      const group = record(rawGroup);

      if (!group) return null;

      const parsedRows = array(group.rows)
        .map(normalizeFotMobRow)
        .filter(
          (row): row is StandingRow =>
            row !== null
        );

      const rows = sortRows(
        validateRows(
          parsedRows,
          'FotMob',
          league
        )
      );

      if (!rows.length) return null;

      return {
        id:
          text(group.id) ||
          `group-${index + 1}`,

        name:
          text(group.name) ||
          `المجموعة ${index + 1}`,

        rows,
      };
    })
    .filter(
      (group): group is StandingGroup =>
        group !== null
    );

  if (!groups.length) {
    diagnostic(
      'FotMob',
      league,
      'NO_VALID_GROUPS'
    );
    return null;
  }

  return {
    source: 'FotMob',
    league,

    leagueName:
      LEAGUES[league]?.name ||
      text(payload.leagueName) ||
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

// ==========================================
// HTTP helper
// ==========================================

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

    const contentType =
      response.headers.get('content-type') ||
      '';

    if (
      !contentType.toLowerCase().includes(
        'json'
      )
    ) {
      throw new Error(
        'UPSTREAM_INVALID_CONTENT_TYPE'
      );
    }

    try {
      return await response.json();
    } catch {
      throw new Error(
        'UPSTREAM_INVALID_JSON'
      );
    }
  } finally {
    clearTimeout(timer);
  }
}

// ==========================================
// ESPN primary source
// ==========================================

function matchesESPNSeason(league: string, requested: string, actual: { season: string | null; seasonName: string | null }): boolean {
  if (COMPETITIONS[league]?.kind === 'national' && /^\d{4}$/.test(requested) && actual.seasonName) {
    return new RegExp(`\\b${requested}\\b`).test(actual.seasonName);
  }
  return Boolean(actual.season && seasonsMatch(requested, actual.season));
}

async function getESPN(
  league: string,
  requestedSeason: string | null,
  useCurrentSeason = false
): Promise<StandingsData | null> {
  const url = new URL(
    `${ESPN_BASE}/${encodeURIComponent(
      league
    )}/standings`
  );

  if (requestedSeason && !useCurrentSeason) {
    const year = seasonStart(
      requestedSeason
    );

    if (year !== null) {
      url.searchParams.set(
        'season',
        String(year)
      );
    }
  }

  diagnostic(
    'ESPN',
    league,
    'REQUEST_STARTED',
    {
      requestedSeason,
    }
  );

  const raw = await fetchJSON(
    url.toString(),
    ESPN_TIMEOUT
  );

  const payload = record(raw);

  if (!payload) {
    diagnostic(
      'ESPN',
      league,
      'INVALID_RESPONSE'
    );
    return null;
  }

  const seasonInfo =
    extractESPNSeason(payload);

  diagnostic(
    'ESPN',
    league,
    'RESPONSE_RECEIVED',
    {
      returnedSeason: seasonInfo.season,
      seasonName: seasonInfo.seasonName,
      childCount: array(
        payload.children
      ).length,
    }
  );

  if (requestedSeason) {
    if (
      !matchesESPNSeason(league, requestedSeason, seasonInfo)
    ) {
      diagnostic(
        'ESPN',
        league,
        'SEASON_MISMATCH',
        {
          requestedSeason,
          returnedSeason:
            seasonInfo.season,
        }
      );
      return null;
    }
  }

  const groups = collectESPNGroups(
    payload,
    league
  );

  if (!groups.length) {
    diagnostic(
      'ESPN',
      league,
      'NO_VALID_GROUPS',
      {
        childCount: array(
          payload.children
        ).length,
      }
    );
    return null;
  }

  diagnostic(
    'ESPN',
    league,
    'SUCCESS',
    {
      groups: groups.length,
      rows: groups.reduce(
        (total, group) =>
          total + group.rows.length,
        0
      ),
    }
  );

  return {
    source: 'ESPN',
    league,

    leagueName:
      LEAGUES[league]?.name ||
      null,

    season: seasonInfo.season,

    seasonName: seasonInfo.seasonName,

    groups,

    // Compatibility with existing LeagueDashboard.
    rows: groups[0].rows,

    groupCount: groups.length,

    updatedAt: new Date().toISOString(),
  };
}

// ==========================================
// FotMob fallback
// ==========================================

async function getFotMob(
  league: string,
  requestedSeason: string | null
): Promise<StandingsData | null> {
  const config = LEAGUES[league];

  if (!config?.fotmobId) {
    diagnostic(
      'FotMob',
      league,
      'NOT_CONFIGURED'
    );
    return null;
  }

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

  diagnostic(
    'FotMob',
    league,
    'REQUEST_STARTED',
    {
      requestedSeason,
    }
  );

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

// ==========================================
// Error response
// ==========================================

function errorResponse(
  message: string,
  status: number,
  code: string
) {
  return jsonResponse(
    {
      error: message,
      code,
      groups: [],
      rows: [],
    },
    status
  );
}

// ==========================================
// GET /api/standings
// ==========================================

export async function GET(request: Request) {
  const { searchParams } = new URL(
    request.url
  );

  const league = (
    searchParams.get('league') ||
    'ksa.1'
  )
    .trim()
    .toLowerCase();

  if (
    !Object.prototype.hasOwnProperty.call(
      LEAGUES,
      league
    )
  ) {
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

  diagnostic(
    'API',
    league,
    'STANDINGS_REQUEST',
    {
      season,
    }
  );

  // Primary source: ESPN
  try {
    const data = await getESPN(
      league,
      season
    );

    if (data) {
      return jsonResponse(data);
    }
  } catch (error) {
    console.warn(
      '[AiFBall Standings] ESPN_FAILED',
      {
        league,
        season,
        error: errorDetails(error),
      }
    );
  }

  if (season && COMPETITIONS[league]?.kind === 'national') {
    try {
      const data = await getESPN(league, season, true);
      if (data) return jsonResponse(data);
    } catch (error) {
      console.warn('[AiFBall Standings] ESPN_EDITION_LOOKUP_FAILED', errorDetails(error));
    }
  }

  // Fallback source: FotMob
  try {
    const data = await getFotMob(
      league,
      season
    );

    if (data) {
      return jsonResponse(data);
    }
  } catch (error) {
    console.warn(
      '[AiFBall Standings] FOTMOB_FAILED',
      {
        league,
        season,
        error: errorDetails(error),
      }
    );
  }

  diagnostic(
    'API',
    league,
    'ALL_SOURCES_UNAVAILABLE',
    {
      season,
    }
  );

  return errorResponse(
    'لم تتوفر بيانات ترتيب مؤكدة لهذه البطولة والموسم من المصادر المتاحة.',
    404,
    'STANDINGS_NOT_AVAILABLE'
  );
}
