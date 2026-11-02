
'use client';

import AppIcon from './AppIcon';
import { COMPETITIONS } from '../../lib/competitions';
import { footballNameInArabic, footballGroupInArabic } from '../../lib/football-names-ar';

import { useCallback, useEffect, useRef, useState } from 'react';

type ChatLanguage = 'ar' | 'en';
type DataRecord = Record<string, unknown>;
type StandingZone = 'qualification' | 'relegation' | null;

interface LeagueDashboardProps {
  leagueName?: string;
  leagueCode?: string;
  season?: string;
  isDark?: boolean;
  lang?: ChatLanguage;
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
  zone: StandingZone;
  zoneLabel: string | null;
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

const LEAGUE_NAMES = COMPETITIONS;

const SAUDI_TEAMS: Record<string, string> = {
  '929': 'الهلال',
  '22022': 'القادسية',
  '817': 'النصر',
  '2276': 'الاتحاد',
  '130899': 'نيوم',
  '8346': 'الأهلي',
  '8363': 'الاتفاق',
  '131746': 'الدرعية',
  '21829': 'الخليج',
  '793': 'الشباب',
  '22028': 'الخلود',
  '21965': 'الرياض',
  '21827': 'الفيحاء',
  '21964': 'الحزم',
  '21446': 'الفيصلي',
  '13033': 'الفتح',
  '18459': 'التعاون',
  '21833': 'أبها',
};

const TEAM_NAMES_AR: Record<string, string> = {
  'PSG': 'باريس سان جيرمان',
  'Paris Saint-Germain': 'باريس سان جيرمان',
  'Aston Villa': 'أستون فيلا',
  'Liverpool': 'ليفربول',
  'Real Madrid': 'ريال مدريد',
  'Betis': 'ريال بيتيس',
  'Real Betis': 'ريال بيتيس',
  'Stuttgart': 'شتوتغارت',
  'Arsenal': 'أرسنال',
  'Barcelona': 'برشلونة',
  'Como': 'كومو',
  'Man City': 'مانشستر سيتي',
  'Manchester City': 'مانشستر سيتي',
  'Club Brugge': 'كلوب بروج',
  'Sporting': 'سبورتينغ لشبونة',
  'Dortmund': 'بوروسيا دورتموند',
  'Bayern': 'بايرن ميونخ',
  'Bayern Munich': 'بايرن ميونخ',
  'Atlético': 'أتلتيكو مدريد',
  'Atletico Madrid': 'أتلتيكو مدريد',
  'Real Sociedad': 'ريال سوسيداد',
  'Sevilla': 'إشبيلية',
  'Athletic': 'أتلتيك بلباو',
  'Villarreal': 'فياريال',
  'Celta Vigo': 'سيلتا فيغو',
  'Alavés': 'ألافيس',
  'Rayo': 'رايو فاييكانو',
  'Getafe': 'خيتافي',
  'Deportivo': 'ديبورتيفو لاكورونيا',
  'Espanyol': 'إسبانيول',
  'Lazio': 'لاتسيو',
  'Inter Milan': 'إنتر ميلان',
  'Inter': 'إنتر ميلان',
  'AS Roma': 'روما',
  'Milan': 'ميلان',
  'Frosinone': 'فروزينوني',
  'Juventus': 'يوفنتوس',
  'Napoli': 'نابولي',
  'Bologna': 'بولونيا',
  'Torino': 'تورينو',
  'Genoa': 'جنوى',
  'Cagliari': 'كالياري',
  'Atalanta': 'أتالانتا',
  'Lecce': 'ليتشي',
  'Freiburg': 'فرايبورغ',
  'Leipzig': 'لايبزيغ',
  'Bremen': 'فيردر بريمن',
  'Leverkusen': 'باير ليفركوزن',
  'Elversberg': 'إلفيرسبيرغ',
  'Frankfurt': 'آينتراخت فرانكفورت',
  'Mainz': 'ماينتس',
  'Augsburg': 'أوغسبورغ',
  'Hoffenheim': 'هوفنهايم',
  'Cologne': 'كولن',
  'Paderborn': 'بادربورن',
  'Lille': 'ليل',
  'Lyon': 'ليون',
  'Paris FC': 'باريس إف سي',
  'Rennes': 'رين',
  'Marseille': 'مارسيليا',
  'Monaco': 'موناكو',
  'Nice': 'نيس',
  'Lens': 'لانس',
  'Lorient': 'لوريان',
  'Toulouse': 'تولوز',
  'Strasbourg': 'ستراسبورغ',
  'Auxerre': 'أوكسير',
  'Brest': 'بريست',
  'Nashville': 'ناشفيل',
  'New England': 'نيو إنجلاند',
  'Miami': 'إنتر ميامي',
  'Chicago': 'شيكاغو فاير',
  'Charlotte': 'شارلوت',
  'Philadelphia': 'فيلادلفيا يونيون',
  'Cincinnati': 'سينسيناتي',
  'Columbus': 'كولومبوس كرو',
  'Orlando': 'أورلاندو سيتي',
  'Red Bull NY': 'نيويورك ريد بولز',
  'NYCFC': 'نيويورك سيتي',
  'Toronto': 'تورونتو',
  'D.C. United': 'دي سي يونايتد',
  'Atlanta': 'أتلانتا يونايتد',
  'Vancouver': 'فانكوفر وايتكابس',
  'Dallas': 'إف سي دالاس',
  'San Jose': 'سان خوسيه إيرثكويكس',
  'St. Louis': 'سانت لويس سيتي',
  'Houston': 'هيوستن دينامو',
  'LAFC': 'لوس أنجلوس إف سي',
  'LA Galaxy': 'لوس أنجلوس غالاكسي',
  'Seattle': 'سياتل ساوندرز',
  'Portland': 'بورتلاند تيمبرز',
  'Colorado': 'كولورادو رابيدز',
  'Salt Lake': 'ريال سولت ليك',
  'Minnesota': 'مينيسوتا يونايتد',
  'Austin': 'أوستن إف سي',
  'Kansas City': 'سبورتينغ كانساس سيتي',
  'San Diego': 'سان دييغو إف سي',
  'PSV': 'آيندهوفن',
  'Feyenoord': 'فينورد',
  'Galatasaray': 'غلطة سراي',
  'Man United': 'مانشستر يونايتد',
  'Manchester United': 'مانشستر يونايتد',
  'Bodø/Glimt': 'بودو غليمت',
  'Bodo/Glimt': 'بودو غليمت',
  'LASK Linz': 'لاسك لينتس',
  'Sabah': 'صباح',
};

const GROUP_NAMES_AR: Record<string, string> = {
  'East Region': 'منطقة الشرق',
  'West Region': 'منطقة الغرب',
  'Eastern Conference': 'القسم الشرقي',
  'Western Conference': 'القسم الغربي',
  'League Phase': 'مرحلة الدوري',
  'Overall': 'الترتيب العام',
};

const GROUP_NAMES_EN: Record<string, string> = {
  'القسم الشرقي': 'Eastern Conference',
  'القسم الغربي': 'Western Conference',
  'مرحلة الدوري': 'League Phase',
  'الترتيب العام': 'Overall',
};

const UI = {
  ar: {
    standings: 'جدول الترتيب',
    season: 'موسم',
    refresh: 'تحديث',
    refreshing: 'جارٍ التحديث',
    refreshTitle: 'تحديث جدول الترتيب',
    source: 'المصدر',
    checking: 'جارٍ التحقق',
    unavailable: 'غير متاح',
    updated: 'آخر جلب',
    loading: 'جارٍ جلب ترتيب الدوري...',
    failed: 'تعذر تحميل جدول الترتيب',
    retry: 'إعادة المحاولة',
    empty: 'لا توجد بيانات ترتيب مؤكدة لهذه البطولة حاليًا.',
    noFakeData: 'لن يتم عرض فرق أو نقاط افتراضية.',
    refreshFailed: 'تعذر تحديث البيانات',
    previousData: 'يتم عرض آخر بيانات تم جلبها بنجاح.',
    updating: 'جارٍ تحديث الترتيب...',
    scroll: 'مرّر الجدول أفقيًا لعرض جميع الإحصائيات',
    team: 'الفريق',
    played: 'لعب',
    won: 'فاز',
    draw: 'تعادل',
    lost: 'خسر',
    gf: 'له',
    ga: 'عليه',
    points: 'نقاط',
    qualification: 'مركز تأهل وفق بيانات المصدر',
    relegation: 'مركز هبوط وفق بيانات المصدر',
    teamsCount: 'عدد الفرق المعروضة',
    group: 'المجموعة',
    overall: 'الترتيب العام',
    invalidJson: 'استجابة خادم الترتيب ليست JSON صحيحة.',
    fetchFailed: 'تعذر جلب الترتيب',
    loadFailed: 'تعذر تحميل جدول الترتيب.',
    noData: 'لا توجد بيانات ترتيب مؤكدة لهذه البطولة.',
  },
  en: {
    standings: 'Standings',
    season: 'Season',
    refresh: 'Refresh',
    refreshing: 'Refreshing',
    refreshTitle: 'Refresh standings',
    source: 'Source',
    checking: 'Checking',
    unavailable: 'Unavailable',
    updated: 'Last fetched',
    loading: 'Loading league standings...',
    failed: 'Unable to load standings',
    retry: 'Try again',
    empty: 'No verified standings are currently available for this competition.',
    noFakeData: 'No teams or points will be fabricated.',
    refreshFailed: 'Unable to refresh data',
    previousData: 'Showing the last successfully retrieved data.',
    updating: 'Updating standings...',
    scroll: 'Scroll horizontally to see all statistics',
    team: 'Team',
    played: 'P',
    won: 'W',
    draw: 'D',
    lost: 'L',
    gf: 'GF',
    ga: 'GA',
    points: 'Pts',
    qualification: 'Qualification position according to source data',
    relegation: 'Relegation position according to source data',
    teamsCount: 'Teams displayed',
    group: 'Group',
    overall: 'Overall',
    invalidJson: 'The standings server returned invalid JSON.',
    fetchFailed: 'Unable to fetch standings',
    loadFailed: 'Unable to load standings.',
    noData: 'No verified standings are available for this competition.',
  },
} as const;

function asRecord(value: unknown): DataRecord | null {
  return value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value)
    ? (value as DataRecord)
    : null;
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
  if (typeof value === 'string') return value.trim();

  if (
    typeof value === 'number' &&
    Number.isFinite(value)
  ) {
    return String(value);
  }

  return '';
}

function numberValue(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'string') {
    const normalized = value.replace(/,/g, '').trim();

    if (/^[-+]?\d+(?:\.\d+)?$/.test(normalized)) {
      const parsed = Number(normalized);
      return Number.isFinite(parsed) ? parsed : null;
    }
  }

  return null;
}

function safeImageUrl(value: unknown): string | null {
  const raw = textValue(value);
  if (!raw) return null;

  try {
    const url = new URL(raw);
    return url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

function cleanText(value: string): string {
  if (!/[ÃÂ]/.test(value)) return value;

  try {
    const chars = Array.from(value);

    if (chars.some((char) => char.charCodeAt(0) > 255)) {
      return value;
    }

    const bytes = new Uint8Array(
      chars.map((char) => char.charCodeAt(0))
    );

    const decoded = new TextDecoder('utf-8', {
      fatal: true,
    }).decode(bytes);

    return decoded.includes('\uFFFD') ? value : decoded;
  } catch {
    return value;
  }
}

function normalizeZone(item: DataRecord): {
  zone: StandingZone;
  zoneLabel: string | null;
} {
  const rawZone = textValue(
    firstValue(item, ['zone', 'standingZone'])
  ).toLowerCase();

  const zone: StandingZone =
    rawZone === 'qualification' || rawZone === 'qualified'
      ? 'qualification'
      : rawZone === 'relegation' || rawZone === 'relegated'
        ? 'relegation'
        : null;

  if (!zone) {
    return { zone: null, zoneLabel: null };
  }

  const suppliedLabel = cleanText(
    textValue(
      firstValue(item, ['zoneLabel', 'standingZoneLabel'])
    )
  );

  return {
    zone,
    zoneLabel: suppliedLabel || null,
  };
}

function normalizeTeam(
  raw: unknown,
  index: number
): StandingTeam | null {
  const item = asRecord(raw);
  if (!item) return null;

  const nestedTeam =
    asRecord(item.team) || asRecord(item.club);

  const rawName =
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

  const name = cleanText(rawName);
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

  return {
    id:
      textValue(firstValue(item, ['id', 'teamId'])) ||
      textValue(firstValue(nestedTeam, ['id'])) ||
      `${name}-${index}`,
    position: numberValue(
      firstValue(item, ['rank', 'position', 'pos', 'place'])
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
      firstValue(item, ['draw', 'draws', 'ties', 'd'])
    ),
    lost: numberValue(
      firstValue(item, ['lost', 'losses', 'l'])
    ),
    goalsFor,
    goalsAgainst,
    goalDifference:
      suppliedDifference ??
      (goalsFor !== null && goalsAgainst !== null
        ? goalsFor - goalsAgainst
        : null),
    points: numberValue(
      firstValue(item, ['points', 'pts'])
    ),
    ...normalizeZone(item),
  };
}

function normalizeRows(value: unknown): StandingTeam[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item, index) => normalizeTeam(item, index))
    .filter(
      (item): item is StandingTeam => item !== null
    )
    .map((team, index) => ({ team, index }))
    .sort((a, b) => {
      if (
        a.team.position === null &&
        b.team.position === null
      ) {
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

  let groups: StandingGroup[] = (
    Array.isArray(root.groups) ? root.groups : []
  )
    .map((value, index) => {
      const group = asRecord(value);
      if (!group) return null;

      const rows = normalizeRows(group.rows);
      if (!rows.length) return null;

      return {
        id: textValue(group.id) || `group-${index + 1}`,
        name: cleanText(textValue(group.name)) || `Group ${index + 1}`,
        rows,
      };
    })
    .filter(
      (group): group is StandingGroup => group !== null
    );

  if (!groups.length) {
    const rows = normalizeRows(
      root.rows ?? root.data ?? root.table
    );

    if (rows.length) {
      groups = [
        {
          id: 'main',
          name: 'Overall',
          rows,
        },
      ];
    }
  }

  return {
    groups,
    source: textValue(root.source) || null,
    season:
      root.season == null
        ? null
        : textValue(root.season),
    seasonName:
      cleanText(textValue(root.seasonName)) || null,
    updatedAt: textValue(root.updatedAt) || null,
  };
}

function displayNumber(value: number | null): string {
  return value === null ? '—' : String(value);
}

function displayDifference(
  value: number | null
): string {
  if (value === null) return '—';
  return value > 0 ? `+${value}` : String(value);
}

function formatSeason(
  season: string | null,
  fallback: string,
  leagueCode: string
): string {
  if (COMPETITIONS[leagueCode]?.seasonFormat === 'calendar') {
    const year = (season || fallback).match(/\b(\d{4})\b/);
    return year ? year[1] : season || fallback;
  }

  const input = season || fallback;
  if (!input) return '—';
  const match = input.match(
    /^(\d{4})(?:[-/](\d{2,4}))?$/
  );

  if (!match) return input;

  const start = Number(match[1]);

  if (!match[2]) {
    return `${start}–${start + 1}`;
  }

  const end =
    match[2].length === 2
      ? Math.floor(start / 100) * 100 +
        Number(match[2])
      : Number(match[2]);

  return `${start}–${end}`;
}

function displayTeamName(
  team: StandingTeam,
  leagueCode: string,
  lang: ChatLanguage
): string {
  if (lang === 'en') return team.name;

  if (
    leagueCode === 'ksa.1' &&
    SAUDI_TEAMS[team.id]
  ) {
    return SAUDI_TEAMS[team.id];
  }

  return footballNameInArabic(team.name) || TEAM_NAMES_AR[team.name] || team.name;
}

function displayGroupName(
  name: string,
  lang: ChatLanguage
): string {
  const trimmed = name.trim();

  if (lang === 'ar') {
    return GROUP_NAMES_AR[trimmed] || footballGroupInArabic(trimmed);
  }

  return GROUP_NAMES_EN[trimmed] || trimmed;
}

export default function LeagueDashboard({
  leagueName,
  leagueCode = 'ksa.1',
  season = '',
  isDark = true,
  lang = 'ar',
}: LeagueDashboardProps) {
  const t = UI[lang];
  const isArabic = lang === 'ar';

  const [result, setResult] =
    useState<StandingsResult | null>(null);

  const [selectedGroup, setSelectedGroup] =
    useState('');

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const activeRequest = useRef(0);

  const displayLeagueName =
    (isArabic ? leagueName : undefined) ||
    LEAGUE_NAMES[leagueCode]?.[lang] ||
    leagueName ||
    leagueCode;

  const loadStandings = useCallback(
    async (
      signal: AbortSignal,
      requestId: number,
      manualRefresh: boolean
    ) => {
      if (manualRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
        setResult(null);
        setSelectedGroup('');
      }

      setError(null);

      try {
        const params = new URLSearchParams({
          league: leagueCode,
        });

        if (season.trim()) {
          params.set('season', season.trim());
        }

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

        const rawText = await response.text();

        let payload: unknown;

        try {
          payload = rawText
            ? JSON.parse(rawText)
            : null;
        } catch {
          throw new Error(t.invalidJson);
        }

        if (!response.ok) {
          const details = asRecord(payload);

          throw new Error(
            textValue(details?.error) ||
              `${t.fetchFailed} (HTTP ${response.status}).`
          );
        }

        const normalized = normalizeResponse(payload);

        if (
          signal.aborted ||
          requestId !== activeRequest.current
        ) {
          return;
        }

        if (!normalized.groups.length) {
          throw new Error(t.noData);
        }

        setResult(normalized);

        setSelectedGroup((current) =>
          normalized.groups.some(
            (group) => group.id === current
          )
            ? current
            : normalized.groups[0].id
        );
      } catch (err) {
        if (
          signal.aborted ||
          requestId !== activeRequest.current
        ) {
          return;
        }

        console.error('[AiFBall Standings]', err);

        setError(
          err instanceof Error
            ? err.message
            : t.loadFailed
        );
      } finally {
        if (
          !signal.aborted &&
          requestId === activeRequest.current
        ) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [leagueCode, season, t]
  );

  useEffect(() => {
    const controller = new AbortController();
    const requestId = ++activeRequest.current;

    loadStandings(
      controller.signal,
      requestId,
      reloadKey > 0
    );

    return () => controller.abort();
  }, [loadStandings, reloadKey]);

  const refresh = () => {
    if (loading || refreshing) return;

    setReloadKey((value) => value + 1);
  };

  const groups = result?.groups || [];

  const activeGroup =
    groups.find(
      (group) => group.id === selectedGroup
    ) || groups[0];

  const teams = activeGroup?.rows || [];

  const formattedUpdatedAt = (() => {
    if (!result?.updatedAt) return null;

    const date = new Date(result.updatedAt);

    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return date.toLocaleTimeString(
      isArabic ? 'ar-SA' : 'en-GB',
      {
        hour: '2-digit',
        minute: '2-digit',
      }
    );
  })();

  const sourceSeason = result?.seasonName?.match(/\b(\d{4}(?:[-/](?:\d{4}|\d{2}))?)\b/)?.[1];
  const displayedSeason = formatSeason(
    sourceSeason || result?.season || null,
    season,
    leagueCode
  );

  const hasZones = teams.some(
    (team) => team.zone !== null
  );

  const cellBorder = isDark
    ? 'border-gray-800/50'
    : 'border-gray-200';

  const stickyBg = isDark
    ? 'bg-[#1a1c1e]'
    : 'bg-white';

  const headerBg = isDark
    ? 'bg-[#15171a]'
    : 'bg-gray-100';

  // The leading columns follow the reading direction.
  // Points remain fixed on the opposite edge.
  const rankSticky = isArabic
    ? 'right-0'
    : 'left-0';

  const teamSticky = isArabic
    ? 'right-9'
    : 'left-9';

  const pointsSticky = isArabic
    ? 'left-0'
    : 'right-0';

  const teamAlign = isArabic
    ? 'text-right'
    : 'text-left';

  const zoneBorder = (zone: StandingZone) => {
    if (zone === 'qualification') {
      return isArabic
        ? 'border-r-[3px] border-r-emerald-500'
        : 'border-l-[3px] border-l-emerald-500';
    }

    if (zone === 'relegation') {
      return isArabic
        ? 'border-r-[3px] border-r-red-500'
        : 'border-l-[3px] border-l-red-500';
    }

    return '';
  };

  return (
    <div
      dir={isArabic ? 'rtl' : 'ltr'}
      lang={lang}
      className={`w-full min-w-0 overflow-hidden rounded-3xl border shadow-xl font-cairo ${
        isDark
          ? 'bg-[#1a1c1e] border-gray-800 text-white'
          : 'bg-white border-gray-200 text-gray-900'
      }`}
    >
      <div
        className={`p-4 sm:p-6 border-b ${
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
              <AppIcon name="trophy" size={24}/>
            </div>

            <div className="min-w-0">
              <h2 className="text-base sm:text-xl font-extrabold leading-snug">
                {displayLeagueName}
              </h2>

              <p className="text-xs text-gray-500 mt-1">
                {t.standings} • {t.season}{' '}
                <bdi dir="ltr">{displayedSeason}</bdi>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={refresh}
            disabled={loading || refreshing}
            title={t.refreshTitle}
            aria-label={t.refreshTitle}
            className={`flex-shrink-0 px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 transition disabled:opacity-50 ${
              isDark
                ? 'bg-white/5 border-white/10 hover:bg-white/10 text-emerald-400'
                : 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100 text-emerald-700'
            }`}
          >
            <span
              aria-hidden="true"
              className={
                refreshing
                  ? 'inline-block animate-spin'
                  : ''
              }
            >
              ↻
            </span>

            <span className="hidden sm:inline">
              {refreshing
                ? t.refreshing
                : t.refresh}
            </span>
          </button>
        </div>

        <div className="flex items-center justify-between gap-2 mt-4 text-[11px] text-gray-500">
          <span>
            {t.source}:{' '}
            <bdi dir="ltr">
              {result?.source ||
                (loading
                  ? t.checking
                  : t.unavailable)}
            </bdi>
          </span>

          {formattedUpdatedAt && (
            <span>
              {t.updated}: {formattedUpdatedAt}
            </span>
          )}
        </div>
      </div>

      {!loading && groups.length > 1 && (
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
                onClick={() =>
                  setSelectedGroup(group.id)
                }
                aria-pressed={
                  activeGroup?.id === group.id
                }
                className={`flex-shrink-0 rounded-xl px-4 py-2 text-xs font-bold transition ${
                  activeGroup?.id === group.id
                    ? 'bg-[#1D6B35] text-white'
                    : isDark
                      ? 'bg-white/5 text-gray-300 hover:bg-white/10'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {displayGroupName(
                  group.name,
                  lang
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div
          className="flex flex-col items-center justify-center py-16 px-4"
          role="status"
        >
          <div className="w-9 h-9 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />

          <p className="text-emerald-500 font-bold text-sm">
            {t.loading}
          </p>
        </div>
      ) : !result && error ? (
        <div
          className="p-8 text-center"
          role="alert"
        >
          <div className="text-3xl mb-3">⚠️</div>

          <p className="text-red-500 font-bold text-sm mb-2">
            {t.failed}
          </p>

          <p className="text-xs text-gray-400 mb-5">
            {error}
          </p>

          <button
            type="button"
            onClick={refresh}
            disabled={refreshing}
            className="px-5 py-2.5 rounded-xl bg-[#1D6B35] hover:bg-emerald-700 text-white text-xs font-bold transition disabled:opacity-50"
          >
            {t.retry}
          </button>
        </div>
      ) : teams.length === 0 ? (
        <div className="p-10 text-center">
          <div className="text-3xl mb-3">📊</div>

          <p className="font-bold text-sm">
            {t.empty}
          </p>

          <p className="text-xs text-gray-500 mt-2">
            {t.noFakeData}
          </p>

          <button
            type="button"
            onClick={refresh}
            disabled={refreshing}
            className="mt-5 px-5 py-2.5 rounded-xl bg-[#1D6B35] text-white text-xs font-bold disabled:opacity-50"
          >
            {t.retry}
          </button>
        </div>
      ) : (
        <>
          {error && (
            <div
              role="alert"
              className={`px-5 py-3 text-xs border-b ${
                isDark
                  ? 'bg-amber-900/20 text-amber-300 border-amber-900/30'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
            >
              {t.refreshFailed}: {error}.{' '}
              {t.previousData}
            </div>
          )}

          {refreshing && (
            <p
              role="status"
              className="px-5 py-2 text-xs text-emerald-500"
            >
              {t.updating}
            </p>
          )}

          <p className="px-4 pt-2 text-[10px] text-gray-500 sm:hidden">
            {t.scroll}{' '}
            {isArabic ? '←' : '→'}
          </p>

          <div
            className="w-full overflow-x-auto custom-scrollbar"
            role="region"
            aria-label={`${t.standings}: ${displayLeagueName}`}
            tabIndex={0}
          >
            <table className="w-full min-w-[690px] border-separate border-spacing-0 text-center text-xs sm:text-sm whitespace-nowrap">
              <thead
                className={
                  isDark
                    ? 'bg-[#15171a] text-gray-400'
                    : 'bg-gray-100 text-gray-600'
                }
              >
                <tr>
                  <th
                    scope="col"
                    className={`sticky ${rankSticky} z-20 py-3 px-2 w-9 border-b ${headerBg} ${cellBorder}`}
                  >
                    #
                  </th>

                  <th
                    scope="col"
                    className={`sticky ${teamSticky} z-20 py-3 px-3 ${teamAlign} min-w-[145px] border-b ${headerBg} ${cellBorder}`}
                  >
                    {t.team}
                  </th>

                  <th
                    scope="col"
                    className={`py-3 px-2 border-b ${cellBorder}`}
                  >
                    {t.played}
                  </th>

                  <th
                    scope="col"
                    className={`py-3 px-2 text-emerald-500 border-b ${cellBorder}`}
                  >
                    {t.won}
                  </th>

                  <th
                    scope="col"
                    className={`py-3 px-2 text-yellow-500 border-b ${cellBorder}`}
                  >
                    {t.draw}
                  </th>

                  <th
                    scope="col"
                    className={`py-3 px-2 text-red-500 border-b ${cellBorder}`}
                  >
                    {t.lost}
                  </th>

                  <th
                    scope="col"
                    className={`py-3 px-2 border-b ${cellBorder}`}
                  >
                    {t.gf}
                  </th>

                  <th
                    scope="col"
                    className={`py-3 px-2 border-b ${cellBorder}`}
                  >
                    {t.ga}
                  </th>

                  <th
                    scope="col"
                    className={`py-3 px-2 border-b ${cellBorder}`}
                  >
                    +/-
                  </th>

                  <th
                    scope="col"
                    className={`sticky ${pointsSticky} z-20 py-3 px-2 min-w-[56px] border-b ${headerBg} ${cellBorder}`}
                  >
                    {t.points}
                  </th>
                </tr>
              </thead>

              <tbody>
                {teams.map((team) => {
                  const teamName = displayTeamName(
                    team,
                    leagueCode,
                    lang
                  );

                  const zoneStripe = zoneBorder(
                    team.zone
                  );

                  const zoneTitle = team.zone
                    ? team.zone === 'qualification'
                      ? t.qualification
                      : t.relegation
                    : undefined;

                  return (
                    <tr
                      key={team.id}
                      className={`transition-colors ${
                        isDark
                          ? 'hover:bg-white/5'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <td
                        title={zoneTitle}
                        className={`sticky ${rankSticky} z-10 py-3 px-2 w-9 font-bold text-gray-500 border-b ${stickyBg} ${cellBorder} ${zoneStripe}`}
                      >
                        {displayNumber(
                          team.position
                        )}
                      </td>

                      <td
                        className={`sticky ${teamSticky} z-10 py-3 px-3 ${teamAlign} font-bold border-b ${stickyBg} ${cellBorder}`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {team.logo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={team.logo}
                              alt=""
                              loading="lazy"
                              className="w-7 h-7 object-contain flex-shrink-0"
                              onError={(event) => {
                                event.currentTarget.style.display =
                                  'none';
                              }}
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-emerald-600/15 border border-emerald-500/20 flex items-center justify-center text-[11px] text-emerald-400 flex-shrink-0">
                              {teamName.charAt(0)}
                            </div>
                          )}

                          <span
                            className="truncate max-w-[135px] sm:max-w-[200px]"
                            title={teamName}
                          >
                            {teamName}
                          </span>
                        </div>
                      </td>

                      <td
                        className={`py-3 px-2 text-gray-400 border-b ${cellBorder}`}
                      >
                        {displayNumber(team.played)}
                      </td>

                      <td
                        className={`py-3 px-2 font-bold text-emerald-500 border-b ${cellBorder}`}
                      >
                        {displayNumber(team.won)}
                      </td>

                      <td
                        className={`py-3 px-2 font-bold text-yellow-500 border-b ${cellBorder}`}
                      >
                        {displayNumber(team.draw)}
                      </td>

                      <td
                        className={`py-3 px-2 font-bold text-red-500 border-b ${cellBorder}`}
                      >
                        {displayNumber(team.lost)}
                      </td>

                      <td
                        className={`py-3 px-2 text-gray-400 border-b ${cellBorder}`}
                      >
                        {displayNumber(team.goalsFor)}
                      </td>

                      <td
                        className={`py-3 px-2 text-gray-400 border-b ${cellBorder}`}
                      >
                        {displayNumber(
                          team.goalsAgainst
                        )}
                      </td>

                      <td
                        dir="ltr"
                        className={`py-3 px-2 font-bold border-b ${cellBorder} ${
                          team.goalDifference === null
                            ? 'text-gray-500'
                            : team.goalDifference > 0
                              ? 'text-emerald-500'
                              : team.goalDifference < 0
                                ? 'text-red-500'
                                : 'text-gray-400'
                        }`}
                      >
                        {displayDifference(
                          team.goalDifference
                        )}
                      </td>

                      <td
                        className={`sticky ${pointsSticky} z-10 py-3 px-2 border-b ${stickyBg} ${cellBorder}`}
                      >
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
                  );
                })}
              </tbody>
            </table>
          </div>

          {hasZones && (
            <div
              className={`flex flex-wrap gap-4 px-5 py-3 text-[11px] ${
                isDark
                  ? 'text-gray-300'
                  : 'text-gray-600'
              }`}
            >
              {teams.some(
                (team) =>
                  team.zone === 'qualification'
              ) && (
                <span className="inline-flex items-center gap-2">
                  <span className="h-3 w-1 rounded bg-emerald-500" />
                  {t.qualification}
                </span>
              )}

              {teams.some(
                (team) =>
                  team.zone === 'relegation'
              ) && (
                <span className="inline-flex items-center gap-2">
                  <span className="h-3 w-1 rounded bg-red-500" />
                  {t.relegation}
                </span>
              )}
            </div>
          )}

          <div
            className={`flex items-center justify-between gap-3 px-5 py-3 border-t text-[11px] ${
              isDark
                ? 'bg-[#15171a] border-gray-800 text-gray-500'
                : 'bg-gray-50 border-gray-200 text-gray-500'
            }`}
          >
            <span>
              {t.teamsCount}:{' '}
              <strong className="text-emerald-500">
                {teams.length}
              </strong>
            </span>

            {groups.length > 1 && (
              <span>
                {activeGroup
                  ? displayGroupName(
                      activeGroup.name,
                      lang
                    )
                  : ''}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
