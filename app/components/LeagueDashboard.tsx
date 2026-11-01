
'use client';

import {
  useCallback,
  useEffect,
  useState,
} from 'react';

interface LeagueDashboardProps {
  leagueName?: string;
  leagueCode?: string;
  season?: string;
  isDark?: boolean;
}

interface StandingTeam {
  id: string;
  position: number | null;
  name: string;
  logo: string | null;
  played: number | null;
  won: number | null;
  draw: number | null;
  lost: number | null;
  goalsFor: number | null;
  goalsAgainst: number | null;
  goalDifference: number | null;
  points: number | null;
}

const LEAGUE_NAMES: Record<string, string> = {
  'ksa.1': 'دوري روشن السعودي',
  'eng.1': 'الدوري الإنجليزي الممتاز',
  'esp.1': 'الدوري الإسباني',
  'ita.1': 'الدوري الإيطالي',
  'ger.1': 'الدوري الألماني',
  'fra.1': 'الدوري الفرنسي',
};

function asRecord(
  value: unknown
): Record<string, unknown> | null {
  if (
    value === null ||
    typeof value !== 'object' ||
    Array.isArray(value)
  ) {
    return null;
  }

  return value as Record<string, unknown>;
}

function firstValue(
  obj: Record<string, unknown>,
  keys: string[]
): unknown {
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

function numberValue(
  value: unknown
): number | null {
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
    const normalized = value
      .replace(/,/g, '')
      .trim();

    if (
      /^[-+]?\d+(\.\d+)?$/.test(
        normalized
      )
    ) {
      const parsed = Number(
        normalized
      );

      return Number.isFinite(parsed)
        ? parsed
        : null;
    }
  }

  return null;
}

function textValue(
  value: unknown
): string {
  if (
    typeof value === 'string'
  ) {
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

function safeImageUrl(
  value: unknown
): string | null {
  if (
    typeof value !== 'string' ||
    !value.trim()
  ) {
    return null;
  }

  try {
    const url = new URL(
      value.trim()
    );

    if (
      url.protocol === 'https:' ||
      url.protocol === 'http:'
    ) {
      return url.href;
    }
  } catch {
    return null;
  }

  return null;
}

function normalizeTeam(
  raw: unknown,
  index: number
): StandingTeam | null {
  const item = asRecord(raw);

  if (!item) {
    return null;
  }

  const nestedTeam =
    asRecord(item.team) ||
    asRecord(item.club) ||
    {};

  const name =
    textValue(
      firstValue(item, [
        'name',
        'teamName',
        'title',
        'displayName',
      ])
    ) ||
    textValue(
      firstValue(nestedTeam, [
        'name',
        'displayName',
        'shortDisplayName',
      ])
    );

  // لا ننشئ فريقًا وهميًا
  if (!name) {
    return null;
  }

  const position = numberValue(
    firstValue(item, [
      'rank',
      'position',
      'pos',
      'place',
    ])
  );

  const played = numberValue(
    firstValue(item, [
      'played',
      'matchesPlayed',
      'gamesPlayed',
      'p',
    ])
  );

  const won = numberValue(
    firstValue(item, [
      'won',
      'wins',
      'w',
    ])
  );

  const draw = numberValue(
    firstValue(item, [
      'draw',
      'draws',
      'ties',
      'd',
    ])
  );

  const lost = numberValue(
    firstValue(item, [
      'lost',
      'losses',
      'l',
    ])
  );

  const goalsFor = numberValue(
    firstValue(item, [
      'goalsFor',
      'pointsFor',
      'gf',
      'goals_for',
    ])
  );

  const goalsAgainst = numberValue(
    firstValue(item, [
      'goalsAgainst',
      'pointsAgainst',
      'ga',
      'goals_against',
    ])
  );

  const suppliedDifference =
    numberValue(
      firstValue(item, [
        'goalDifference',
        'differential',
        'gd',
        'goal_difference',
      ])
    );

  const goalDifference =
    suppliedDifference ??
    (goalsFor !== null &&
    goalsAgainst !== null
      ? goalsFor - goalsAgainst
      : null);

  const points = numberValue(
    firstValue(item, [
      'points',
      'pts',
    ])
  );

  const logo = safeImageUrl(
    firstValue(item, [
      'logo',
      'logoUrl',
      'badge',
      'image',
    ]) ??
    firstValue(nestedTeam, [
      'logo',
      'logoUrl',
      'badge',
    ])
  );

  const id =
    textValue(
      firstValue(item, [
        'id',
        'teamId',
      ])
    ) ||
    textValue(
      firstValue(nestedTeam, [
        'id',
      ])
    ) ||
    `${name}-${index}`;

  return {
    id,
    position,
    name,
    logo,
    played,
    won,
    draw,
    lost,
    goalsFor,
    goalsAgainst,
    goalDifference,
    points,
  };
}

function extractStandings(
  payload: unknown
): unknown[] {
  if (
    Array.isArray(payload)
  ) {
    return payload;
  }

  const root = asRecord(
    payload
  );

  if (!root) {
    return [];
  }

  const directKeys = [
    'rows',
    'teams',
    'standings',
    'table',
    'data',
  ];

  for (const key of directKeys) {
    const value = root[key];

    if (
      Array.isArray(value)
    ) {
      return value;
    }

    const nested = asRecord(
      value
    );

    if (nested) {
      for (const nestedKey of directKeys) {
        if (
          Array.isArray(
            nested[nestedKey]
          )
        ) {
          return nested[
            nestedKey
          ] as unknown[];
        }
      }
    }
  }

  return [];
}

function displayNumber(
  value: number | null
): string {
  return value === null
    ? '—'
    : String(value);
}

function displayDifference(
  value: number | null
): string {
  if (value === null) {
    return '—';
  }

  if (value > 0) {
    return `+${value}`;
  }

  return String(value);
}

export default function LeagueDashboard({
  leagueName,
  leagueCode = 'ksa.1',
  season = '2026',
  isDark = true,
}: LeagueDashboardProps) {
  const [teams, setTeams] =
    useState<StandingTeam[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [lastUpdated, setLastUpdated] =
    useState<Date | null>(null);

  const [reloadKey, setReloadKey] =
    useState(0);

  const displayLeagueName =
    leagueName ||
    LEAGUE_NAMES[leagueCode] ||
    'جدول ترتيب الدوري';

  const loadStandings = useCallback(
    async (
      signal: AbortSignal,
      manualRefresh: boolean
    ) => {
      if (manualRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
        setTeams([]);
      }

      setError(null);

      try {
        const params =
          new URLSearchParams({
            league: leagueCode,
            season,
          });

        const response =
          await fetch(
            `/api/standings?${params.toString()}`,
            {
              method: 'GET',
              cache: 'no-store',
              signal,
              headers: {
                Accept:
                  'application/json',
              },
            }
          );

        const rawText =
          await response.text();

        let payload: unknown;

        try {
          payload = rawText
            ? JSON.parse(rawText)
            : null;
        } catch {
          throw new Error(
            'استجابة خادم الترتيب ليست بصيغة JSON صحيحة.'
          );
        }

        if (!response.ok) {
          const responseObject =
            asRecord(payload);

          const message =
            textValue(
              responseObject?.error
            ) ||
            textValue(
              responseObject?.message
            ) ||
            `تعذر جلب الترتيب (HTTP ${response.status}).`;

          throw new Error(
            message
          );
        }

        const rows =
          extractStandings(
            payload
          );

        const normalized =
          rows
            .map(
              (row, index) =>
                normalizeTeam(
                  row,
                  index
                )
            )
            .filter(
              (
                row
              ): row is StandingTeam =>
                row !== null
            );

        // ترتيب حسب المركز الموثق
        normalized.sort(
          (a, b) => {
            if (
              a.position ===
              null
            ) {
              return 1;
            }

            if (
              b.position ===
              null
            ) {
              return -1;
            }

            return (
              a.position -
              b.position
            );
          }
        );

        if (
          signal.aborted
        ) {
          return;
        }

        setTeams(
          normalized
        );

        setLastUpdated(
          new Date()
        );
      } catch (err) {
        if (
          signal.aborted
        ) {
          return;
        }

        console.error(
          '[AiFBall Standings]',
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : 'تعذر تحميل جدول الترتيب.'
        );
      } finally {
        if (
          !signal.aborted
        ) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [leagueCode, season]
  );

  useEffect(() => {
    const controller =
      new AbortController();

    loadStandings(
      controller.signal,
      false
    );

    return () => {
      controller.abort();
    };
  }, [
    loadStandings,
    reloadKey,
  ]);

  const refresh = () => {
    if (
      loading ||
      refreshing
    ) {
      return;
    }

    setReloadKey(
      (value) => value + 1
    );
  };

  return (
    <div
      dir="rtl"
      className={`w-full rounded-3xl border shadow-xl overflow-hidden font-saudi ${
        isDark
          ? 'bg-[#1a1c1e] border-gray-800 text-white'
          : 'bg-white border-gray-200 text-gray-900'
      }`}
    >
      {/* Header */}
      <div
        className={`p-5 sm:p-6 border-b ${
          isDark
            ? 'border-gray-800'
            : 'border-gray-200'
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 ${
                isDark
                  ? 'bg-emerald-900/30'
                  : 'bg-emerald-50'
              }`}
            >
              🏆
            </div>

            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-extrabold truncate">
                {displayLeagueName}
              </h2>

              <p
                className={`text-[11px] sm:text-xs mt-1 ${
                  isDark
                    ? 'text-gray-400'
                    : 'text-gray-500'
                }`}
              >
                جدول الترتيب • موسم{' '}
                {season}
              </p>
            </div>
          </div>

          <button
            onClick={refresh}
            disabled={
              loading ||
              refreshing
            }
            title="تحديث الترتيب"
            className={`flex-shrink-0 px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 transition disabled:opacity-50 ${
              isDark
                ? 'bg-white/5 border-white/10 hover:bg-white/10 text-emerald-400'
                : 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100 text-emerald-700'
            }`}
          >
            <span
              className={
                refreshing
                  ? 'inline-block animate-spin'
                  : ''
              }
            >
              ↻
            </span>

            <span className="hidden sm:inline">
              تحديث
            </span>
          </button>
        </div>

        <div className="flex items-center justify-between gap-2 mt-4">
          <span
            className={`text-[10px] sm:text-xs ${
              isDark
                ? 'text-gray-500'
                : 'text-gray-500'
            }`}
          >
            المصدر: خدمة ترتيب
            الدوريات
          </span>

          {lastUpdated && (
            <span
              className={`text-[10px] sm:text-xs ${
                isDark
                  ? 'text-gray-500'
                  : 'text-gray-500'
              }`}
            >
              آخر جلب:{' '}
              {lastUpdated.toLocaleTimeString(
                'ar-SA',
                {
                  hour: '2-digit',
                  minute: '2-digit',
                }
              )}
            </span>
          )}
        </div>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="w-9 h-9 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />

          <p className="text-emerald-500 font-bold text-xs sm:text-sm">
            جاري جلب ترتيب الدوري...
          </p>

          <p
            className={`text-xs mt-2 ${
              isDark
                ? 'text-gray-500'
                : 'text-gray-400'
            }`}
          >
            يتم الاتصال بخادم
            البيانات الرياضية
          </p>
        </div>
      ) : error ? (
        <div className="p-8 text-center">
          <div className="text-3xl mb-3">
            ⚠️
          </div>

          <p className="text-red-500 font-bold text-sm mb-2">
            تعذر تحميل جدول
            الترتيب
          </p>

          <p
            className={`text-xs mb-5 ${
              isDark
                ? 'text-gray-400'
                : 'text-gray-600'
            }`}
          >
            {error}
          </p>

          <button
            onClick={refresh}
            className="px-5 py-2.5 rounded-xl bg-[#1D6B35] hover:bg-emerald-700 text-white text-xs font-bold transition"
          >
            إعادة المحاولة
          </button>
        </div>
      ) : teams.length === 0 ? (
        <div className="p-10 text-center">
          <div className="text-3xl mb-3">
            📊
          </div>

          <p className="font-bold text-sm">
            لا توجد بيانات ترتيب
            مؤكدة لهذا الدوري
            حاليًا.
          </p>

          <p
            className={`text-xs mt-2 ${
              isDark
                ? 'text-gray-500'
                : 'text-gray-400'
            }`}
          >
            لن يتم عرض فرق أو
            نقاط افتراضية.
          </p>

          <button
            onClick={refresh}
            className="mt-5 px-5 py-2.5 rounded-xl bg-[#1D6B35] text-white text-xs font-bold"
          >
            إعادة المحاولة
          </button>
        </div>
      ) : (
        <>
          {/* Standings */}
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full min-w-[650px] text-center text-xs sm:text-sm whitespace-nowrap">
              <thead
                className={`border-b ${
                  isDark
                    ? 'bg-[#15171a] text-gray-400 border-gray-800'
                    : 'bg-gray-100 text-gray-600 border-gray-200'
                }`}
              >
                <tr>
                  <th className="py-3 px-2">
                    #
                  </th>

                  <th className="py-3 px-4 text-right">
                    الفريق
                  </th>

                  <th className="py-3 px-2">
                    لعب
                  </th>

                  <th className="py-3 px-2 text-emerald-500">
                    فاز
                  </th>

                  <th className="py-3 px-2 text-yellow-500">
                    تعادل
                  </th>

                  <th className="py-3 px-2 text-red-500">
                    خسر
                  </th>

                  <th className="py-3 px-2">
                    له
                  </th>

                  <th className="py-3 px-2">
                    عليه
                  </th>

                  <th className="py-3 px-2">
                    +/-
                  </th>

                  <th className="py-3 px-2">
                    نقاط
                  </th>
                </tr>
              </thead>

              <tbody
                className={`divide-y ${
                  isDark
                    ? 'divide-gray-800/50'
                    : 'divide-gray-200'
                }`}
              >
                {teams.map(
                  (
                    team,
                    index
                  ) => (
                    <tr
                      key={
                        team.id
                      }
                      className={`transition-colors ${
                        isDark
                          ? 'hover:bg-white/5'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <td className="py-3 px-2 font-bold text-gray-500">
                        {displayNumber(
                          team.position
                        )}
                      </td>

                      <td className="py-3 px-4 text-right font-bold">
                        <div className="flex items-center gap-2.5">
                          {team.logo ? (
                            <img
                              src={
                                team.logo
                              }
                              alt=""
                              className="w-7 h-7 object-contain flex-shrink-0"
                              onError={(
                                event
                              ) => {
                                event.currentTarget.style.display =
                                  'none';
                              }}
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-emerald-600/15 border border-emerald-500/20 flex items-center justify-center text-[11px] text-emerald-400 flex-shrink-0">
                              {team.name.charAt(
                                0
                              )}
                            </div>
                          )}

                          <span className="truncate max-w-[180px]">
                            {
                              team.name
                            }
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-2 text-gray-400">
                        {displayNumber(
                          team.played
                        )}
                      </td>

                      <td className="py-3 px-2 font-bold text-emerald-500">
                        {displayNumber(
                          team.won
                        )}
                      </td>

                      <td className="py-3 px-2 font-bold text-yellow-500">
                        {displayNumber(
                          team.draw
                        )}
                      </td>

                      <td className="py-3 px-2 font-bold text-red-500">
                        {displayNumber(
                          team.lost
                        )}
                      </td>

                      <td className="py-3 px-2 text-gray-400">
                        {displayNumber(
                          team.goalsFor
                        )}
                      </td>

                      <td className="py-3 px-2 text-gray-400">
                        {displayNumber(
                          team.goalsAgainst
                        )}
                      </td>

                      <td
                        dir="ltr"
                        className={`py-3 px-2 font-bold ${
                          team.goalDifference ===
                          null
                            ? 'text-gray-500'
                            : team.goalDifference >
                                0
                              ? 'text-emerald-500'
                              : team.goalDifference <
                                  0
                                ? 'text-red-500'
                                : 'text-gray-400'
                        }`}
                      >
                        {displayDifference(
                          team.goalDifference
                        )}
                      </td>

                      <td className="py-3 px-2">
                        <span
                          className={`inline-flex items-center justify-center min-w-9 px-2 py-1 rounded-lg font-extrabold ${
                            isDark
                              ? 'bg-emerald-900/40 text-emerald-400'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {displayNumber(
                            team.points
                          )}
                        </span>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div
            className={`flex items-center justify-between gap-3 px-5 py-3 border-t text-[11px] ${
              isDark
                ? 'bg-[#15171a] border-gray-800 text-gray-500'
                : 'bg-gray-50 border-gray-200 text-gray-500'
            }`}
          >
            <span>
              عدد الفرق المعروضة:{' '}
              <strong className="text-emerald-500">
                {teams.length}
              </strong>
            </span>

            <span>
              البيانات حسب آخر
              استجابة من المصدر
            </span>
          </div>
        </>
      )}
    </div>
  );
}
