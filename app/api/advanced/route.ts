
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const DEFAULT_API_URL =
  'https://aifball-python-api.onrender.com';

const LANUS_API =
  process.env.LANUS_API_URL ||
  DEFAULT_API_URL;

const API_SECRET =
  process.env.LANUS_API_SECRET || '';

const REQUEST_TIMEOUT_MS = 55000;

const ALLOWED_SOURCES = [
  '365',
  'sofascore',
  'fotmob',
  'fbref',
  'tm',
] as const;

const SUPPORTED_LEAGUES = [
  'ksa.1',
  'eng.1',
  'esp.1',
  'ita.1',
  'ger.1',
  'fra.1',
  'uefa.champions',
] as const;

type RouteConfig = {
  path: string;
  params: Record<string, string>;
};

function jsonError(
  message: string,
  status: number,
  extra: Record<string, unknown> = {}
) {
  return NextResponse.json(
    {
      success: false,
      error: message,
      ...extra,
    },
    {
      status,
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  );
}

function getParam(
  params: URLSearchParams,
  name: string,
  fallback = ''
): string {
  return (
    params.get(name)?.trim() ||
    fallback
  );
}

function requireParam(
  params: URLSearchParams,
  name: string
): string {
  const value = getParam(params, name);

  if (!value) {
    throw new Error(
      `MISSING_PARAMETER:${name}`
    );
  }

  return value;
}

function isAllowedMatchUrl(
  value: string,
  provider: '365' | 'sofascore' | 'fotmob'
): boolean {
  try {
    const url = new URL(value);

    if (
      url.protocol !== 'https:' &&
      url.protocol !== 'http:'
    ) {
      return false;
    }

    if (
      url.username ||
      url.password
    ) {
      return false;
    }

    const hostname =
      url.hostname.toLowerCase();

    const allowedDomains: Record<
      typeof provider,
      string[]
    > = {
      '365': [
        '365scores.com',
      ],
      sofascore: [
        'sofascore.com',
      ],
      fotmob: [
        'fotmob.com',
      ],
    };

    return allowedDomains[
      provider
    ].some(
      (domain) =>
        hostname === domain ||
        hostname.endsWith(
          `.${domain}`
        )
    );
  } catch {
    return false;
  }
}

function requireMatchUrl(
  params: URLSearchParams,
  provider: '365' | 'sofascore' | 'fotmob'
): string {
  const value = requireParam(
    params,
    'matchUrl'
  );

  if (
    !isAllowedMatchUrl(
      value,
      provider
    )
  ) {
    throw new Error(
      'INVALID_MATCH_URL'
    );
  }

  return value;
}

function validateSeason(
  season: string
): string {
  if (
    !/^\d{4}(?:-\d{4})?$/.test(
      season
    )
  ) {
    throw new Error(
      'INVALID_SEASON'
    );
  }

  return season;
}

function validateLeague(
  league: string
): string {
  if (
    !SUPPORTED_LEAGUES.includes(
      league as (typeof SUPPORTED_LEAGUES)[number]
    )
  ) {
    throw new Error(
      'UNSUPPORTED_LEAGUE'
    );
  }

  return league;
}

function buildRoute(
  source: string,
  action: string,
  params: URLSearchParams
): RouteConfig {
  const key = `${source}:${action}`;

  switch (key) {
    case '365:shotmap':
      return {
        path: '/365scores/shotmap',
        params: {
          match_url:
            requireMatchUrl(
              params,
              '365'
            ),
        },
      };

    case '365:heatmap':
      return {
        path: '/365scores/heatmap',
        params: {
          match_url:
            requireMatchUrl(
              params,
              '365'
            ),
          player_name:
            requireParam(
              params,
              'playerName'
            ),
        },
      };

    case '365:lineup':
      return {
        path: '/365scores/lineup',
        params: {
          match_url:
            requireMatchUrl(
              params,
              '365'
            ),
        },
      };

    case 'sofascore:analysis':
      return {path:'/sofascore/match-analysis',params:{match_url:requireMatchUrl(params,'sofascore')}};
    case 'sofascore:player-points': {
      const playerId=requireParam(params,'playerId');
      if(!/^\d{1,12}$/.test(playerId))throw new Error('INVALID_MATCH_URL');
      return {path:'/sofascore/player-points',params:{match_url:requireMatchUrl(params,'sofascore'),player_id:playerId}};
    }
    case 'sofascore:shotmap':
      return {
        path: '/sofascore/shotmap',
        params: {
          match_url:
            requireMatchUrl(
              params,
              'sofascore'
            ),
        },
      };

    case 'sofascore:heatmap':
      return {
        path: '/sofascore/heatmap',
        params: {
          match_url:
            requireMatchUrl(
              params,
              'sofascore'
            ),
          player_name:
            requireParam(
              params,
              'playerName'
            ),
        },
      };

    case 'fotmob:table':
      return {
        path: '/fotmob/table',
        params: {
          league:
            validateLeague(
              getParam(
                params,
                'league',
                'ksa.1'
              )
            ),
          season:
            validateSeason(
              getParam(
                params,
                'season',
                '2026'
              )
            ),
          stat:
            getParam(
              params,
              'stat',
              'xg'
            ),
        },
      };

    case 'fotmob:match':
      return {
        path: '/fotmob/match',
        params: {
          match_url:
            requireMatchUrl(
              params,
              'fotmob'
            ),
        },
      };

    case 'fbref:team-stats':
      return {
        path: '/fbref/team-stats',
        params: {
          stat_type:
            getParam(
              params,
              'statType',
              'stats'
            ),
          league:
            getParam(
              params,
              'league',
              'Big 5 European Leagues'
            ),
          season:
            validateSeason(
              getParam(
                params,
                'season',
                '2026-2027'
              )
            ),
        },
      };

    case 'fbref:player-stats':
      return {
        path: '/fbref/player-stats',
        params: {
          stat_type:
            getParam(
              params,
              'statType',
              'stats'
            ),
          league:
            getParam(
              params,
              'league',
              'Big 5 European Leagues'
            ),
          season:
            validateSeason(
              getParam(
                params,
                'season',
                '2026-2027'
              )
            ),
          player_name:
            requireParam(
              params,
              'playerName'
            ),
        },
      };

    case 'tm:value':
      return {
        path:
          '/transfermarkt/player-value',
        params: {
          player_name:
            requireParam(
              params,
              'playerName'
            ),
        },
      };

    case 'tm:transfers':
      return {
        path:
          '/transfermarkt/team-transfers',
        params: {
          team_name:
            requireParam(
              params,
              'teamName'
            ),
          season:
            validateSeason(
              getParam(
                params,
                'season',
                '2026'
              )
            ),
        },
      };

    default:
      throw new Error(
        'UNSUPPORTED_ACTION'
      );
  }
}

function buildBackendUrl(
  config: RouteConfig
): URL {
  const base = new URL(LANUS_API);

  if (
    base.protocol !== 'https:' &&
    base.protocol !== 'http:'
  ) {
    throw new Error(
      'INVALID_BACKEND_URL'
    );
  }

  const url = new URL(
    config.path,
    base
  );

  Object.entries(
    config.params
  ).forEach(
    ([key, value]) => {
      url.searchParams.set(
        key,
        value
      );
    }
  );

  return url;
}

function normalizeBackendData(
  data: unknown
): unknown {
  if (
    data === null ||
    data === undefined
  ) {
    return [];
  }

  return data;
}

export async function GET(
  request: Request
) {
  const requestUrl = new URL(
    request.url
  );

  const searchParams =
    requestUrl.searchParams;

  const source =
    getParam(
      searchParams,
      'source'
    ).toLowerCase();

  const action =
    getParam(
      searchParams,
      'action'
    ).toLowerCase();

  if (
    !source ||
    !action
  ) {
    return jsonError(
      'يجب تحديد مصدر البيانات ونوع الطلب.',
      400,
      {
        code:
          'MISSING_SOURCE_OR_ACTION',
      }
    );
  }

  if (
    !ALLOWED_SOURCES.includes(
      source as (typeof ALLOWED_SOURCES)[number]
    )
  ) {
    return jsonError(
      'مصدر البيانات غير مدعوم.',
      400,
      {
        code:
          'UNSUPPORTED_SOURCE',
      }
    );
  }

  let config: RouteConfig;

  try {
    config = buildRoute(
      source,
      action,
      searchParams
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'INVALID_REQUEST';

    if (
      message.startsWith(
        'MISSING_PARAMETER:'
      )
    ) {
      const param =
        message.split(':')[1];

      return jsonError(
        `المعامل المطلوب غير موجود: ${param}`,
        400,
        {
          code:
            'MISSING_PARAMETER',
          parameter: param,
        }
      );
    }

    if (
      message ===
      'INVALID_MATCH_URL'
    ) {
      return jsonError(
        'رابط المباراة غير صالح أو لا ينتمي إلى المصدر المحدد.',
        400,
        {
          code:
            'INVALID_MATCH_URL',
        }
      );
    }

    if (
      message ===
      'INVALID_SEASON'
    ) {
      return jsonError(
        'صيغة الموسم غير صحيحة.',
        400,
        {
          code:
            'INVALID_SEASON',
        }
      );
    }

    if (
      message ===
      'UNSUPPORTED_LEAGUE'
    ) {
      return jsonError(
        'كود الدوري غير مدعوم.',
        400,
        {
          code:
            'UNSUPPORTED_LEAGUE',
        }
      );
    }

    return jsonError(
      'العملية المطلوبة غير مدعومة.',
      400,
      {
        code:
          'UNSUPPORTED_ACTION',
      }
    );
  }

  let backendUrl: URL;

  try {
    backendUrl =
      buildBackendUrl(
        config
      );
  } catch {
    return jsonError(
      'إعدادات خادم البيانات غير صحيحة.',
      500,
      {
        code:
          'BACKEND_CONFIGURATION_ERROR',
      }
    );
  }

  const controller =
    new AbortController();

  const timeoutId =
    setTimeout(
      () =>
        controller.abort(),
      REQUEST_TIMEOUT_MS
    );

  const abortOnClientClose = () => {
    controller.abort();
  };

  request.signal.addEventListener(
    'abort',
    abortOnClientClose,
    { once: true }
  );

  try {
    const headers: HeadersInit = {
      Accept:
        'application/json',
    };

    if (API_SECRET) {
      headers['x-api-key'] =
        API_SECRET;
    }

    const response =
      await fetch(
        backendUrl.toString(),
        {
          method: 'GET',
          headers,
          cache: 'no-store',
          signal:
            controller.signal,
        }
      );

    if (!response.ok) {
      const detail =
        await response
          .text()
          .catch(() => '');

      console.error(
        '[AiFBall Advanced API]',
        {
          source,
          action,
          status:
            response.status,
          detail:
            detail.slice(
              0,
              300
            ),
        }
      );

      if (
        response.status ===
        404
      ) {
        return jsonError(
          'لم يتم العثور على البيانات المطلوبة.',
          404,
          {
            code:
              'DATA_NOT_FOUND',
            source,
            action,
          }
        );
      }

      return jsonError(
        'تعذر جلب البيانات من المصدر الرياضي.',
        502,
        {
          code:
            'UPSTREAM_ERROR',
          source,
          action,
          upstreamStatus:
            response.status,
        }
      );
    }

    const contentType =
      response.headers.get(
        'content-type'
      ) || '';

    if (
      !contentType.includes(
        'application/json'
      )
    ) {
      return jsonError(
        'خادم البيانات أعاد استجابة غير متوقعة.',
        502,
        {
          code:
            'INVALID_UPSTREAM_CONTENT_TYPE',
        }
      );
    }

    let data: unknown;

    try {
      data =
        await response.json();
    } catch {
      return jsonError(
        'تعذر قراءة البيانات الرياضية.',
        502,
        {
          code:
            'INVALID_UPSTREAM_JSON',
        }
      );
    }

    const normalized =
      normalizeBackendData(
        data
      );

    return NextResponse.json(
      normalized,
      {
        status: 200,
        headers: {
          'Cache-Control':
            'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (error) {
    const timedOut =
      controller.signal.aborted &&
      !request.signal.aborted;

    console.error(
      '[AiFBall Advanced API Connection]',
      {
        source,
        action,
        message:
          error instanceof Error
            ? error.message
            : 'Unknown error',
      }
    );

    if (
      request.signal.aborted
    ) {
      return jsonError(
        'تم إلغاء الطلب.',
        499,
        {
          code:
            'CLIENT_ABORTED',
        }
      );
    }

    if (timedOut) {
      return jsonError(
        'تأخر خادم البيانات في الاستجابة. حاول مرة أخرى.',
        504,
        {
          code:
            'UPSTREAM_TIMEOUT',
        }
      );
    }

    return jsonError(
      'فشل الاتصال بخادم البيانات الرياضية.',
      502,
      {
        code:
          'UPSTREAM_CONNECTION_ERROR',
      }
    );
  } finally {
    clearTimeout(
      timeoutId
    );

    request.signal.removeEventListener(
      'abort',
      abortOnClientClose
    );
  }
}
