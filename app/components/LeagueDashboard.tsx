
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

type DataRecord = Record<string, unknown>;

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

interface StandingGroup {
  id: string;
  name: string;
  rows: StandingTeam[];
}

interface StandingsResult {
  groups: StandingGroup[];
  source: string | null;
  season: string | null;
  seasonName: string | null;
  updatedAt: string | null;
}

const LEAGUE_NAMES: Record<string, string> = {
  'ksa.1': 'دوري روشن السعودي',
  'eng.1': 'الدوري الإنجليزي الممتاز',
  'esp.1': 'الدوري الإسباني',
  'ita.1': 'الدوري الإيطالي',
  'ger.1': 'الدوري الألماني',
  'fra.1': 'الدوري الفرنسي',
  'por.1': 'الدوري البرتغالي',
  'ned.1': 'الدوري الهولندي',
  'tur.1': 'الدوري التركي',
  'egy.1': 'الدوري المصري الممتاز',
  'uae.1': 'الدوري الإماراتي',
  'qat.1': 'الدوري القطري',
  'kuw.1': 'الدوري الكويتي',
  'bhr.1': 'الدوري البحريني',
  'oma.1': 'الدوري العُماني',
  'irq.1': 'الدوري العراقي',
  'bra.1': 'الدوري البرازيلي',
  'arg.1': 'الدوري الأرجنتيني',
  'usa.1': 'الدوري الأمريكي',
  'mex.1': 'الدوري المكسيكي',
  'jpn.1': 'الدوري الياباني',
  'kor.1': 'الدوري الكوري',
  'uefa.champions': 'دوري أبطال أوروبا',
};

function asRecord(
  value: unknown
): DataRecord | null {
  if (
    value === null ||
    typeof value !== 'object' ||
    Array.isArray(value)
  ) {
    return null;
  }

  return value as DataRecord;
}

function firstValue(
  obj: DataRecord | null,
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

function textValue(value: unknown): string {
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
    const normalized = value.replace(/,/g, '').trim();

    if (/^[-+]?\d+(?:\.\d+)?$/.test(normalized)) {
      const parsed = Number(normalized);
      return Number.isFinite(parsed) ? parsed : null;
    }
  }

  return null;
}

function safeImageUrl(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) {
    return null;
  }

  try {
    const url = new URL(value.trim());

    return url.protocol === 'https:'
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

function normalizeTeam(
  raw: unknown,
  index: number
): StandingTeam | null {
  const item = asRecord(raw);

  if (!item) return null;

  const nestedTeam =
    asRecord(item.team) ||
    asRecord(item.club);

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

  if (!name) return null;

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

  const suppliedDifference = numberValue(
    firstValue(item, [
      'goalDifference',
      'differential',
      'gd',
      'goal_difference',
    ])
  );

  const goalDifference =
    suppliedDifference ??
    (goalsFor !== null && goalsAgainst !== null
      ? goalsFor - goalsAgainst
      : null);

  return {
    id:
      textValue(
        firstValue(item, ['id', 'teamId'])
      ) ||
      textValue(
        firstValue(nestedTeam, ['id'])
      ) ||
      `${name}-${index}`,

    position: numberValue(
      firstValue(item, [
        'rank',
        'position',
        'pos',
        'place',
      ])
    ),

    name,

    logo: safeImageUrl(
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
    ),

    played: numberValue(
      firstValue(item, [
        'played',
        'matchesPlayed',
        'gamesPlayed',
        'p',
      ])
    ),

    won: numberValue(
      firstValue(item, ['won', 'wins', 'w'])
    ),

    draw: numberValue(
      firstValue(item, [
        'draw',
        'draws',
        'ties',
        'd',
      ])
    ),

    lost: numberValue(
      firstValue(item, [
        'lost',
        'losses',
        'l',
      ])
    ),

    goalsFor,
    goalsAgainst,
    goalDifference,

    points: numberValue(
      firstValue(item, ['points', 'pts'])
    ),
  };
}

function normalizeRows(value: unknown): StandingTeam[] {
  if (!Array.isArray(value)) return [];

  const rows = value
    .map((item, index) => normalizeTeam(item, index))
    .filter(
      (item): item is StandingTeam => item !== null
    );

  // الترتيب الرسمي إن كان متاحًا،
  // وإلا نحافظ على ترتيب المصدر.
  return rows
    .map((team, index) => ({ team, index }))
    .sort((a, b) => {
      if (a.team.position === null && b.team.position === null) {
        return a.index - b.index;
      }

      if (a.team.position === null) return 1;
      if (b.team.position === null) return -1;

      return (
        a.team.position - b.team.position ||
        a.index - b.index
      );
    })
    .map(({ team }) => team);
}

function normalizeResponse(
  payload: unknown
): StandingsResult {
  const root = asRecord(payload);

  if (!root) {
    return {
      groups: [],
      source: null,
      season: null,
      seasonName: null,
      updatedAt: null,
    };
  }

  const rawGroups = Array.isArray(root.groups)
    ? root.groups
    : [];

  let groups: StandingGroup[] = rawGroups
    .map((value, index) => {
      const group = asRecord(value);

      if (!group) return null;

      const rows = normalizeRows(group.rows);

      if (rows.length === 0) return null;

      return {
        id:
          textValue(group.id) ||
          `group-${index + 1}`,
        name:
          textValue(group.name) ||
          `المجموعة ${index + 1}`,
        rows,
      };
    })
    .filter(
      (group): group is StandingGroup => group !== null
    );

  // توافق مع API القديم الذي يعيد rows فقط.
  if (groups.length === 0) {
    const rows = normalizeRows(
      root.rows ?? root.data ?? root.table
    );

    if (rows.length > 0) {
      groups = [
        {
          id: 'main',
          name: 'الترتيب العام',
          rows,
        },
      ];
    }
  }

  return {
    groups,
    source: textValue(root.source) || null,
    season:
      root.season === null ||
      root.season === undefined
        ? null
        : textValue(root.season),
    seasonName: textValue(root.seasonName) || null,
    updatedAt: textValue(root.updatedAt) || null,
  };
}

function displayNumber(value: number | null): string {
  return value === null ? '—' : String(value);
}

function displayDifference(value: number | null): string {
  if (value === null) return '—';
  if (value > 0) return `+${value}`;
  return String(value);
}

export default function LeagueDashboard({
  leagueName,
  leagueCode = 'ksa.1',
  season = '2026',
  isDark = true,
}: LeagueDashboardProps) {
  const [result, setResult] =
    useState<StandingsResult | null>(null);

  const [selectedGroup, setSelectedGroup] =
    useState<string>('');

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const displayLeagueName =
    leagueName ||
    LEAGUE_NAMES[leagueCode] ||
    leagueCode;

  const loadStandings = useCallback(
    async (signal: AbortSignal) => {
      setError(null);

      try {
        const params = new URLSearchParams({
          league: leagueCode,
          season,
        });

        const response = await fetch(
          `/api/standings?${params.toString()}`,
          {
            method: 'GET',
            cache: 'no-store',
            signal,
            headers: {
              Accept: 'application/json',
            },
          }
        );

        const text = await response.text();

        let payload: unknown;

        try {
          payload = text ? JSON.parse(text) : null;
        } catch {
          throw new Error(
            'استجابة خادم الترتيب غير صالحة.'
          );
        }

        if (!response.ok) {
          const details = asRecord(payload);

          throw new Error(
            textValue(details?.error) ||
            `تعذر جلب الترتيب (HTTP ${response.status}).`
          );
        }

        const normalized = normalizeResponse(payload);

        if (signal.aborted) return;

        setResult(normalized);

        setSelectedGroup(
          normalized.groups[0]?.id || ''
        );
      } catch (err) {
        if (signal.aborted) return;

        console.error('[AiFBall Standings]', err);

        setError(
          err instanceof Error
            ? err.message
            : 'تعذر تحميل ترتيب الدوري.'
        );
      } finally {
        if (!signal.aborted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [leagueCode, season]
  );

  useEffect(() => {
    const controller = new AbortController();

    setLoading(true);
    setRefreshing(false);
    setResult(null);
    setSelectedGroup('');

    loadStandings(controller.signal);

    return () => controller.abort();
  }, [loadStandings]);

  useEffect(() => {
    if (reloadKey === 0) return;

    const controller = new AbortController();

    setRefreshing(true);
    loadStandings(controller.signal);

    return () => controller.abort();
  }, [reloadKey, loadStandings]);

  const refresh = () => {
    if (loading || refreshing) return;

    setReloadKey((value) => value + 1);
  };

  const groups = result?.groups || [];

  const activeGroup =
    groups.find((group) => group.id === selectedGroup) ||
    groups[0];

  const teams = activeGroup?.rows || [];

  const formattedUpdatedAt = (() => {
    if (!result?.updatedAt) return null;

    const date = new Date(result.updatedAt);

    if (Number.isNaN(date.getTime())) return null;

    return date.toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit',
    });
  })();

  return (
    <div
      dir="rtl"
      className={`w-full overflow-hidden rounded-3xl border shadow-xl font-saudi ${
        isDark
          ? 'bg-[#1a1c1e] border-gray-800 text-white'
          : 'bg-white border-gray-200 text-gray-900'
      }`}
    >
      {/* Header */}
      <div
        className={`p-5 sm:p-6 border-b ${
          isDark ? 'border-gray-800' : 'border-gray-200'
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

              <p className="text-xs text-gray-500 mt-1">
                جدول الترتيب • موسم{' '}
                {result?.seasonName ||
                  result?.season ||
                  season}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={refresh}
            disabled={loading || refreshing}
            title="تحديث جدول الترتيب"
            className={`flex-shrink-0 px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 transition disabled:opacity-50 ${
              isDark
                ? 'bg-white/5 border-white/10 hover:bg-white/10 text-emerald-400'
                : 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100 text-emerald-700'
            }`}
          >
            <span
              className={
                refreshing ? 'inline-block animate-spin' : ''
              }
            >
              ↻
            </span>
            <span className="hidden sm:inline">
              {refreshing ? 'جارٍ التحديث' : 'تحديث'}
            </span>
          </button>
        </div>

        <div className="flex items-center justify-between gap-2 mt-4 text-[11px] text-gray-500">
          <span>
            المصدر: {result?.source || 'ESPN'}
          </span>

          {formattedUpdatedAt && (
            <span>
              آخر جلب: {formattedUpdatedAt}
            </span>
          )}
        </div>
      </div>

      {/* Groups */}
      {!loading && !error && groups.length > 1 && (
        <div
          className={`px-4 py-3 border-b ${
            isDark
              ? 'border-gray-800'
              : 'border-gray-200'
          }`}
        >
          <div className="flex gap-2 overflow-x-auto pb-1">
            {groups.map((group) => (
              <button
                type="button"
                key={group.id}
                onClick={() => setSelectedGroup(group.id)}
                className={`flex-shrink-0 rounded-xl px-4 py-2 text-xs font-bold transition ${
                  activeGroup?.id === group.id
                    ? 'bg-[#1D6B35] text-white'
                    : isDark
                    ? 'bg-white/5 text-gray-300 hover:bg-white/10'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {group.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="w-9 h-9 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />

          <p className="text-emerald-500 font-bold text-sm">
            جارٍ جلب ترتيب الدوري...
          </p>
        </div>
      ) : error ? (
        <div className="p-8 text-center">
          <div className="text-3xl mb-3">⚠️</div>

          <p className="text-red-500 font-bold text-sm mb-2">
            تعذر تحميل جدول الترتيب
          </p>

          <p className="text-xs text-gray-400 mb-5">
            {error}
          </p>

          <button
            type="button"
            onClick={refresh}
            className="px-5 py-2.5 rounded-xl bg-[#1D6B35] hover:bg-emerald-700 text-white text-xs font-bold transition"
          >
            إعادة المحاولة
          </button>
        </div>
      ) : teams.length === 0 ? (
        <div className="p-10 text-center">
          <div className="text-3xl mb-3">📊</div>

          <p className="font-bold text-sm">
            لا توجد بيانات ترتيب مؤكدة لهذه البطولة حاليًا.
          </p>

          <p className="text-xs text-gray-500 mt-2">
            لن يتم عرض فرق أو نقاط افتراضية.
          </p>

          <button
            type="button"
            onClick={refresh}
            className="mt-5 px-5 py-2.5 rounded-xl bg-[#1D6B35] text-white text-xs font-bold"
          >
            إعادة المحاولة
          </button>
        </div>
      ) : (
        <>
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
                  <th className="py-3 px-2">#</th>
                  <th className="py-3 px-4 text-right">الفريق</th>
                  <th className="py-3 px-2">لعب</th>
                  <th className="py-3 px-2 text-emerald-500">فاز</th>
                  <th className="py-3 px-2 text-yellow-500">تعادل</th>
                  <th className="py-3 px-2 text-red-500">خسر</th>
                  <th className="py-3 px-2">له</th>
                  <th className="py-3 px-2">عليه</th>
                  <th className="py-3 px-2">+/-</th>
                  <th className="py-3 px-2">نقاط</th>
                </tr>
              </thead>

              <tbody
                className={`divide-y ${
                  isDark
                    ? 'divide-gray-800/50'
                    : 'divide-gray-200'
                }`}
              >
                {teams.map((team) => (
                  <tr
                    key={team.id}
                    className={`transition-colors ${
                      isDark
                        ? 'hover:bg-white/5'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <td className="py-3 px-2 font-bold text-gray-500">
                      {displayNumber(team.position)}
                    </td>

                    <td className="py-3 px-4 text-right font-bold">
                      <div className="flex items-center gap-2.5">
                        {team.logo ? (
                          <img
                            src={team.logo}
                            alt=""
                            className="w-7 h-7 object-contain flex-shrink-0"
                            onError={(event) => {
                              event.currentTarget.style.display =
                                'none';
                            }}
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-emerald-600/15 border border-emerald-500/20 flex items-center justify-center text-[11px] text-emerald-400 flex-shrink-0">
                            {team.name.charAt(0)}
                          </div>
                        )}

                        <span className="truncate max-w-[180px]">
                          {team.name}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-2 text-gray-400">
                      {displayNumber(team.played)}
                    </td>

                    <td className="py-3 px-2 font-bold text-emerald-500">
                      {displayNumber(team.won)}
                    </td>

                    <td className="py-3 px-2 font-bold text-yellow-500">
                      {displayNumber(team.draw)}
                    </td>

                    <td className="py-3 px-2 font-bold text-red-500">
                      {displayNumber(team.lost)}
                    </td>

                    <td className="py-3 px-2 text-gray-400">
                      {displayNumber(team.goalsFor)}
                    </td>

                    <td className="py-3 px-2 text-gray-400">
                      {displayNumber(team.goalsAgainst)}
                    </td>

                    <td
                      dir="ltr"
                      className={`py-3 px-2 font-bold ${
                        team.goalDifference === null
                          ? 'text-gray-500'
                          : team.goalDifference > 0
                          ? 'text-emerald-500'
                          : team.goalDifference < 0
                          ? 'text-red-500'
                          : 'text-gray-400'
                      }`}
                    >
                      {displayDifference(team.goalDifference)}
                    </td>

                    <td className="py-3 px-2">
                      <span
                        className={`inline-flex items-center justify-center min-w-9 px-2 py-1 rounded-lg font-extrabold ${
                          isDark
                            ? 'bg-emerald-900/40 text-emerald-400'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {displayNumber(team.points)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

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

            {groups.length > 1 && (
              <span>
                {activeGroup?.name}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
