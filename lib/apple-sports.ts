import { footballNameInArabic } from './football-names-ar';
import { appleCompetitions, appleCompetitionNames, type AppleMatch, type AppleSchedule, type AppleSide, type AppleSport, type AppleStat, type AppleStanding, type AppleStatus } from './apple-sports-types';

const manifestUrl = 'https://api.sports.apple.com/v3/';
const dataUrl = 'https://api-sports.cdn-apple.com/v3/query/';
export const appleEventId = /^umc\.cse\.[a-z0-9]{8,40}$/;
const leagueId = /^umc\.csl\.[a-z0-9]{8,40}$/;
const cdnId = /^[a-f0-9]{32}$/;

type Statistic = { statisticType?: { name?: string }; value?: number };
type Metadata = { metadataType?: { name?: string }; value?: string };
type Competitor = {
  canonicalId?: string; displayName?: string; name?: string; position?: string; localizedName?: { locale: string; text: string }[];
  statistics?: Statistic[]; metadata?: Metadata[]; members?: Competitor[];
};
type Event = {
  canonicalId?: string; shortName?: string; localizedShortName?: { locale: string; text: string }[];
  league?: { abbreviation?: string }; sport?: { name?: string }; progressStatus?: string;
  schedule?: { duration?: { start?: number }; isTba?: boolean; eventTimeInfo?: string };
  clock?: { current?: { minutes?: number; seconds?: number; period?: { type?: string; index?: number } } };
  competitors?: { competitor?: Competitor; winOutcome?: string; score?: { scoreEntries?: Statistic[]; lineScore?: { period?: { index?: number }; score?: Statistic[] }[] } }[];
  venues?: { name?: string; localizedName?: { locale: string; text: string }[] }[];
};
type Manifest = {
  groups: Record<string, { canonical_id: string; cdn_id: string; abbr: string }>;
  teams: Record<string, { name?: string }>;
};
type ScheduleDocument = { content?: { events?: Event[] } };
type EventDocument = { content?: { event?: Event } };
type StandingsDocument = { content?: { league?: { members?: Competitor[] } } };

async function appleJson<T>(url: string, revalidate: number): Promise<T> {
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    next: { revalidate },
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error(`Apple Sports HTTP ${response.status}`);
  return response.json();
}

const getManifest = (locale = 'ar-sa') => appleJson<Manifest>(manifestUrl + locale + '/manifest/3.0.0', 1800);

function stats(rows: Statistic[] = []): AppleStat[] {
  return rows.flatMap(({ statisticType, value }) =>
    statisticType?.name && typeof value === 'number' && Number.isFinite(value)
      ? [{ name: statisticType.name, value }]
      : []);
}
const statValue = (rows: Statistic[] = [], key = 'Score') => {
  const value = rows.find(row => row.statisticType?.name === key)?.value;
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
};
const metaValue = (rows: Metadata[] | undefined, name: string) =>
  rows?.find(row => row.metadataType?.name === name)?.value;

function eventStatus(status?: string): AppleStatus {
  switch (status?.toLowerCase()) {
    case 'pregame': case 'scheduled': case 'notstarted': return 'scheduled';
    case 'ingame': case 'inprogress': case 'live': case 'halftime': case 'intermission': return 'live';
    case 'final': case 'completed': case 'postgame': return 'final';
    default: return 'other';
  }
}

const eventLabels: Record<string, string> = {
  'First Round': 'الجولة الأولى', 'Second Round': 'الجولة الثانية', 'Third Round': 'الجولة الثالثة',
  'Final Round': 'الجولة النهائية', 'São Paulo': 'ساو باولو', 'Las Vegas': 'لاس فيغاس',
  'NASCAR Cup Series Championship Race': 'السباق الختامي لكأس ناسكار',
  Pegula: 'بيغولا', Noskova: 'نوسكوفا', Muchova: 'موخوفا', Andreeva: 'أندريفا',
};
const localName = (value: string) => eventLabels[value] || footballNameInArabic(value) || value;
const arabicName = (values?: { locale: string; text: string }[]) =>
  values?.find(value => /^ar(?:-|$)/i.test(value.locale))?.text;

function normalizeEvent(event: Event, manifest: Manifest, includeDetails: boolean, englishManifest?: Manifest): AppleMatch | null {
  const id = event.canonicalId;
  const start = event.schedule?.duration?.start;
  if (!id || !appleEventId.test(id) || typeof start !== 'number' || !Number.isFinite(start) || start < 1 || start > 10_000_000_000) return null;
  const status = eventStatus(event.progressStatus);
  const originalName = event.shortName || '';
  const name = arabicName(event.localizedShortName) || localName(originalName);
  const format = ({ tennis: 'tennis', golf: 'golf', motor: 'race', mma: 'fight' } as const)[event.sport?.name as 'tennis' | 'golf' | 'motor' | 'mma'];
  const names = originalName.split(/\s+(?:vs\.?|at)\s+/i);
  const current = event.clock?.current;
  const sides: AppleSide[] = (event.competitors ?? []).map(({ competitor, winOutcome, score }, index) => {
    const carNumber = format === 'race' ? metaValue(competitor?.metadata, 'CarNumber') : undefined;
    const starter = (player: Competitor) => metaValue(player.metadata, 'GameStarter');
    return {
      englishName: englishManifest?.teams[competitor?.canonicalId ?? '']?.name || competitor?.displayName || competitor?.name || (names.length === 2 ? names[index] : '') || (carNumber ? `Car ${carNumber}` : 'Name unavailable'),
      name: localName(manifest.teams[competitor?.canonicalId ?? '']?.name || arabicName(competitor?.localizedName) || competitor?.displayName || competitor?.name || (names.length === 2 ? names[index] : '') || (carNumber ? `السيارة رقم ${carNumber}` : 'الاسم غير متاح')),
      score: format === 'golf' ? statValue(score?.scoreEntries, 'Total')
        : status === 'scheduled' || format ? null : statValue(score?.scoreEntries),
      rank: statValue(score?.scoreEntries, 'Position') ?? undefined,
      winner: winOutcome === 'Win' || undefined,
      periods: status === 'scheduled' ? [] : (score?.lineScore ?? []).flatMap(({ period, score }) => {
        const value = statValue(score);
        return period?.index && value !== null ? [{ index: period.index, score: value }] : [];
      }).sort((a, b) => a.index - b.index),
      formation: includeDetails ? metaValue(competitor?.metadata, 'TeamFormation') : undefined,
      stats: includeDetails ? stats([...(competitor?.statistics ?? []), ...(format === 'fight' ? score?.scoreEntries ?? [] : [])]) : [],
      players: includeDetails ? (competitor?.members ?? []).flatMap(player =>
        player.canonicalId && player.displayName ? [{
          id: player.canonicalId, name: localName(player.displayName), englishName: player.displayName, position: player.position,
          starter: starter(player) === undefined ? undefined : starter(player) === 'true',
          stats: stats(player.statistics),
        }] : []) : [],
    };
  });
  const period = current?.period;
  return {
    id, name, englishName: originalName, format, start: new Date(start * 1000).toISOString(), status,
    competition: event.league?.abbreviation ?? '',
    timeTbd: Boolean(event.schedule?.isTba),
    statusLabel: ({ postponed: 'مؤجلة', canceled: 'ملغاة', cancelled: 'ملغاة', suspended: 'متوقفة', interrupted: 'متوقفة' } as Record<string, string>)[event.progressStatus?.toLowerCase() ?? ''],
    period: period?.type && period.index ? { type: period.type, index: period.index } : undefined,
    clock: status === 'live' && typeof current?.minutes === 'number' && typeof current.seconds === 'number'
      ? `${current.minutes}:${String(current.seconds).padStart(2, '0')}` : undefined,
    englishVenue: includeDetails ? event.venues?.[0]?.name : undefined,
    venue: includeDetails ? arabicName(event.venues?.[0]?.localizedName) || event.venues?.[0]?.name : undefined,
    sides: format === 'golf' || format === 'race'
      ? sides.filter(side => side.rank !== undefined && side.name !== 'الاسم غير متاح').sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0)).slice(0, includeDetails ? 20 : 3)
      : sides,
  };
}

function riyadhDate(value: Date) {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Riyadh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(value);
}

export async function appleSchedule(sport: AppleSport, offset: number, english = false): Promise<AppleSchedule> {
  const manifest = await getManifest(english ? 'en-us' : 'ar-sa');
  const date = riyadhDate(new Date(Date.now() + offset * 86_400_000));
  const groups = new Map(Object.values(manifest.groups).map(group => [group.abbr, group]));
  const results = await Promise.allSettled(appleCompetitions[sport].map(async code => {
    const group = groups.get(code);
    if (!group || !cdnId.test(group.cdn_id)) throw new Error('Missing schedule');
    const data = await appleJson<ScheduleDocument>(dataUrl + group.cdn_id, 30);
    if (!Array.isArray(data.content?.events)) throw new Error('Invalid schedule');
    return data.content.events.flatMap(event => {
      const match = normalizeEvent(event, manifest, false, english ? manifest : undefined);
      return match && (riyadhDate(new Date(match.start)) === date || (offset === 0 && match.status === 'live'))
        ? [{ ...match, competition: code }] : [];
    });
  }));
  const failed: string[] = [];
  const matches = new Map<string, AppleMatch>();
  results.forEach((result, index) => {
    if (result.status === 'rejected') failed.push(appleCompetitionNames[appleCompetitions[sport][index]]);
    else result.value.forEach(match => matches.set(match.id, match));
  });
  if (failed.length === results.length) throw new Error('All schedules unavailable');
  return { matches: [...matches.values()].sort((a, b) => a.start.localeCompare(b.start)), failed };
}

export async function appleMatch(id: string, english = false) {
  const [manifest, data] = await Promise.all([getManifest(english ? 'en-us' : 'ar-sa'), appleJson<EventDocument>(dataUrl + id, 30)]);
  return data.content?.event?.canonicalId === id ? normalizeEvent(data.content.event, manifest, true, english ? manifest : undefined) : null;
}

export async function appleStandings(code: string): Promise<AppleStanding[]> {
  const manifest = await getManifest();
  const group = Object.values(manifest.groups).find(item => item.abbr === code);
  if (!group || !leagueId.test(group.canonical_id)) throw new Error('Missing league');
  const data = await appleJson<StandingsDocument>(dataUrl + group.canonical_id, 300);
  if (!Array.isArray(data.content?.league?.members)) throw new Error('Invalid standings');
  return data.content.league.members.flatMap(team => team.canonicalId ? [{
    id: team.canonicalId,
    name: manifest.teams[team.canonicalId]?.name || team.displayName || team.name || team.canonicalId,
    stats: stats(team.statistics),
  }] : []);
}
