
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ESPN_BASE =
  'https://site.api.espn.com/apis/v2/sports/soccer';

const REQUEST_TIMEOUT_MS = 12000;

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

function record(value: unknown): JsonRecord | null {
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value)
  ) {
    return null;
  }

  return value as JsonRecord;
}

function array(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function stringValue(value: unknown): string {
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

function numberValue(value: unknown): number | null {
  if (
    typeof value === 'number' &&
    Number.isFinite(value)
  ) {
    return value;
  }

  if (
    typeof value === 'string' &&
    value.trim() !== ''
  ) {
    const normalized = value.trim();

    if (/^-?\d+(?:\.\d+)?$/.test(normalized)) {
      const result = Number(normalized);
      return Number.isFinite(result) ? result : null;
    }
  }

  return null;
}

function first(
  obj: JsonRecord | null,
  keys: string[]
): unknown {
  if (!obj) return null;

  for (const key of keys) {
    const value = obj[key];

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

function getStat(
  entry: JsonRecord,
  names: string[]
): number | null {
  const stats = array(entry.stats);

  for (const name of names) {
    const match = stats
      .map(record)
      .find(
        (stat) =>
          stat &&
          (stat.name === name || stat.type === name)
      );

    if (match) {
      const value = numberValue(match.value);

      if (value !== null) {
        return value;
      }

      const displayValue = numberValue(
        match.displayValue
      );

      if (displayValue !== null) {
        return displayValue;
      }
    }
  }

  return null;
}

function getLogo(value: unknown): string | null {
  const team = record(value);

  if (!team) return null;

  const logos = array(team.logos);

  const logo = record(logos[0]);

  const raw = stringValue(
    first(logo, ['href', 'url'])
  );

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

function normalizeEntry(
  value: unknown
): StandingRow | null {
  const entry = record(value);

  if (!entry) return null;

  const team = record(entry.team);

  if (!team) return null;

  const name = stringValue(
    first(team, [
      'shortDisplayName',
      'displayName',
      'name',
    ])
  );

  if (!name) return null;

  const gf = getStat(entry, [
    'pointsFor',
    'goalsFor',
  ]);

  const ga = getStat(entry, [
    'pointsAgainst',
    'goalsAgainst',
  ]);

  const reportedDifference = getStat(entry, [
    'pointDifferential',
    'goalDifference',
  ]);

  const gd =
    reportedDifference ??
    (gf !== null && ga !== null
      ? gf - ga
      : null);

  const position =
    getStat(entry, [
      'rank',
      'playoffSeed',
    ]) ??
    numberValue(entry.rank);

  return {
    id:
      stringValue(team.id) ||
      name,
    pos: position,
    name,
    logo: getLogo(team),
    played: getStat(entry, [
      'gamesPlayed',
      'matchesPlayed',
    ]),
    won: getStat(entry, ['wins']),
    draw: getStat(entry, ['ties', 'draws']),
    lost: getStat(entry, ['losses']),
    gf,
    ga,
    gd,
    pts: getStat(entry, ['points']),
  };
}

function normalizeGroup(
  value: unknown,
  index: number
): StandingGroup | null {
  const group = record(value);

  if (!group) return null;

  const standings = record(group.standings);

  const entries = array(
    standings?.entries ?? group.entries
  );

  if (entries.length === 0) return null;

  const rows = entries
    .map(normalizeEntry)
    .filter(
      (row): row is StandingRow => row !== null
    );

  if (rows.length === 0) return null;

  // نحافظ على ترتيب ESPN الأصلي.
  // إذا وفر المصدر المركز الرسمي، نرتب بناءً عليه.
  // لا نعيد حساب الترتيب من النقاط.
  if (rows.every((row) => row.pos !== null)) {
    rows.sort(
      (a, b) =>
        (a.pos as number) - (b.pos as number)
    );
  }

  return {
    id:
      stringValue(group.id) ||
      `group-${index + 1}`,
    name:
      stringValue(
        first(group, [
          'name',
          'displayName',
          'abbreviation',
        ])
      ) ||
      `المجموعة ${index + 1}`,
    rows,
  };
}

function collectGroups(payload: JsonRecord): StandingGroup[] {
  const children = array(payload.children);

  const groups = children
    .map(normalizeGroup)
    .filter(
      (group): group is StandingGroup =>
        group !== null
    );

  if (groups.length > 0) {
    return groups;
  }

  // بعض البطولات قد تعيد standings مباشرة.
  const direct = normalizeGroup(
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

function parseSeason(
  input: string | null
): number | null {
  if (!input) return null;

  const value = input.trim();

  if (!/^\d{4}(?:-\d{4})?$/.test(value)) {
    throw new Error('INVALID_SEASON');
  }

  const parts = value.split('-');

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

  return start;
}

function jsonError(
  message: string,
  status: number,
  code: string
) {
  return NextResponse.json(
    {
      error: message,
      code,
      rows: [],
      groups: [],
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

  // يقبل أكواد ESPN لأي بطولة دون حصرها.
  if (
    !/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/i.test(league) ||
    league.length > 80
  ) {
    return jsonError(
      'معرف الدوري غير صالح.',
      400,
      'INVALID_LEAGUE'
    );
  }

  let requestedSeason: number | null;

  try {
    requestedSeason = parseSeason(
      searchParams.get('season')
    );
  } catch {
    return jsonError(
      'صيغة الموسم غير صحيحة.',
      400,
      'INVALID_SEASON'
    );
  }

  const url = new URL(
    `${ESPN_BASE}/${encodeURIComponent(league)}/standings`
  );

  if (requestedSeason !== null) {
    url.searchParams.set(
      'season',
      String(requestedSeason)
    );
  }

  const controller = new AbortController();

  const timeout = setTimeout(
    () => controller.abort(),
    REQUEST_TIMEOUT_MS
  );

  const onClientAbort = () => controller.abort();

  request.signal.addEventListener(
    'abort',
    onClientAbort,
    { once: true }
  );

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      signal: controller.signal,
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      console.error(
        '[AiFBall Standings] ESPN status:',
        response.status,
        'League:',
        league
      );

      return jsonError(
        response.status === 404
          ? 'لم يتم العثور على هذه البطولة في مصدر ESPN.'
          : 'تعذر جلب ترتيب الدوري من ESPN.',
        response.status === 404 ? 404 : 502,
        'ESPN_REQUEST_FAILED'
      );
    }

    const contentType =
      response.headers.get('content-type') || '';

    if (!contentType.includes('application/json')) {
      return jsonError(
        'استجابة المصدر ليست JSON.',
        502,
        'INVALID_CONTENT_TYPE'
      );
    }

    const payload: unknown = await response.json();

    const data = record(payload);

    if (!data) {
      return jsonError(
        'بيانات الترتيب غير صالحة.',
        502,
        'INVALID_RESPONSE'
      );
    }

    const seasonInfo = record(data.season);

    const returnedSeason = numberValue(
      seasonInfo?.year
    );

    // لا نعرض ترتيب موسم مختلف باعتباره
    // ترتيب الموسم المطلوب.
    if (
      requestedSeason !== null &&
      returnedSeason !== null &&
      returnedSeason !== requestedSeason
    ) {
      return jsonError(
        'المصدر أعاد ترتيب موسم مختلف عن الموسم المطلوب.',
        404,
        'SEASON_MISMATCH'
      );
    }

    const groups = collectGroups(data);

    if (groups.length === 0) {
      return jsonError(
        'لا توجد بيانات ترتيب مؤكدة لهذه البطولة في ESPN.',
        404,
        'STANDINGS_NOT_AVAILABLE'
      );
    }

    // للحفاظ على التوافق مع LeagueDashboard
    // الحالي، نعيد rows من أول مجموعة فقط.
    // كما نعيد جميع المجموعات بصورة مستقلة
    // لتطوير واجهة البطولات متعددة المجموعات.
    const rows = groups[0].rows;

    return NextResponse.json(
      {
        source: 'ESPN',
        league,
        season:
          returnedSeason ??
          requestedSeason,
        seasonName:
          stringValue(
            seasonInfo?.displayName
          ) || null,
        groups,
        rows,
        groupCount: groups.length,
        updatedAt: new Date().toISOString(),
      },
      {
        status: 200,
        headers: {
          'Cache-Control':
            'no-store, max-age=0',
        },
      }
    );
  } catch (error) {
    if (request.signal.aborted) {
      return jsonError(
        'تم إلغاء الطلب.',
        499,
        'CLIENT_ABORTED'
      );
    }

    if (controller.signal.aborted) {
      return jsonError(
        'انتهت مهلة الاتصال بمصدر الترتيب.',
        504,
        'ESPN_TIMEOUT'
      );
    }

    console.error(
      '[AiFBall Standings Error]',
      error
    );

    return jsonError(
      'فشل الاتصال بمصدر ترتيب الدوريات.',
      502,
      'ESPN_CONNECTION_ERROR'
    );
  } finally {
    clearTimeout(timeout);

    request.signal.removeEventListener(
      'abort',
      onClientAbort
    );
  }
}
