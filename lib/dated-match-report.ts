import { COMPETITIONS } from './competitions';
import { footballNameInArabic } from './football-names-ar';
import { normalizeReport, type DetailedMatchReport } from './match-report';

const riyadhDay = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Asia/Riyadh', year: 'numeric', month: '2-digit', day: '2-digit',
});

function normalize(text: string) {
  return text.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '')
    .replace(/ø/g, 'o').replace(/ى/g, 'ي').replace(/ة/g, 'ه')
    .replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

function containsName(query: string, name: string) {
  const normalized = normalize(name);
  if (normalized.length < 3) return false;
  return query.includes(' ' + normalized + ' ') || query.includes(' و' + normalized + ' ');
}

type ScoreboardEvent = {
  id: string;
  date: string;
  status?: { type?: { state?: string; name?: string } };
  competitions?: { competitors?: { team?: { displayName?: string; shortDisplayName?: string; name?: string } }[] }[];
};

export async function resolveDatedMatchReport(query: string, signal?: AbortSignal, fetcher: typeof fetch = fetch) {
  const date = query.match(/\b\d{4}-\d{2}-\d{2}\b/)?.[0];
  if (!date) return null;
  const start = new Date(date + 'T00:00:00+03:00');
  if (!Number.isFinite(start.getTime()) || riyadhDay.format(start) !== date || start.getTime() > Date.now()) return null;

  const normalized = ' ' + normalize(query) + ' ';
  const competitions = Object.entries(COMPETITIONS).flatMap(([id, competition]) => {
    if (competition.searchOnly) return [];
    const score = Math.max(0, ...[competition.ar, competition.en, ...competition.aliases]
      .filter(name => containsName(normalized, name)).map(name => normalize(name).length));
    return score ? [{ id, score }] : [];
  }).sort((a, b) => b.score - a.score);
  const best = competitions[0];
  if (!best || best.score === competitions[1]?.score) return null;

  const timeLimit = AbortSignal.timeout(9000);
  const abortSignal = signal ? AbortSignal.any([signal, timeLimit]) : timeLimit;
  const utcDay = (time: number) => new Date(time).toISOString().slice(0, 10).replace(/-/g, '');
  const days = [utcDay(start.getTime()), utcDay(start.getTime() + 86399999)];
  const base = 'https://site.api.espn.com/apis/site/v2/sports/soccer/' + best.id;
  const get = async (path: string, revalidate: number) => {
    const response = await fetcher(base + path, { signal: abortSignal, next: { revalidate } });
    if (!response.ok) throw new Error('MATCH_SOURCE_UNAVAILABLE');
    return response.json();
  };

  try {
    const boards = await Promise.all(days.map(day => get('/scoreboard?dates=' + day + '&limit=300', 120)));
    if (boards.some(board => !Array.isArray(board.events))) return null;
    const candidates = new Map<string, ScoreboardEvent>();
    for (const board of boards) for (const event of board.events as ScoreboardEvent[]) candidates.set(event.id, event);
    const events = [...candidates.values()].filter(event => {
      const time = Date.parse(event.date);
      const type = event.status?.type;
      if (!/^\d{1,12}$/.test(event.id) || !Number.isFinite(time) || riyadhDay.format(time) !== date) return false;
      if (!['in', 'post'].includes(type?.state || '') || /CANCEL|POSTPON|ABANDON/i.test(type?.name || '')) return false;
      const teams = event.competitions?.[0]?.competitors;
      return teams?.length === 2 && teams.every(({ team }) => team && [team.displayName, team.shortDisplayName, team.name]
        .some(name => name && (containsName(normalized, name) || containsName(normalized, footballNameInArabic(name) || ''))));
    });
    if (events.length !== 1) return null;
    const id = events[0].id;
    const raw = await get('/summary?event=' + id, events[0].status?.type?.state === 'in' ? 20 : 300);
    return { report: normalizeReport(raw, id, best.id), raw };
  } catch {
    return null;
  }
}

const playerAliases: Record<string, string[]> = {
  'pierre emile hojbjerg': ['هويبيرغ', 'هويبيرج', 'هويبييرغ'],
};

export function requestedReportPlayer(report: DetailedMatchReport, query: string): string | undefined {
  const normalized = ' ' + normalize(query) + ' ';
  const players = [...report.home.players, ...report.away.players].filter(player =>
    [player.name, ...(playerAliases[normalize(player.name)] || [])].some(name => containsName(normalized, name)));
  return players.length === 1 ? players[0].name : undefined;
}
