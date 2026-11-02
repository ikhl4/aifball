import { footballNameInArabic } from './football-names-ar';

export type MatchFilter = 'all' | 'live' | 'scheduled' | 'finished';
export const MATCH_FILTERS: { id: MatchFilter; label: string }[] = [
  { id: 'all', label: 'الكل' }, { id: 'live', label: 'مباشر الآن' },
  { id: 'scheduled', label: 'لم تبدأ' }, { id: 'finished', label: 'انتهت' },
];

export function normalizeMatchSearch(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f\u064b-\u065f\u0670\u0640]/g, '')
    .replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه')
    .replace(/[^\p{L}\p{N}]+/gu, ' ').trim().replace(/\s+/g, ' ');
}

// Exceptional states stay in All; a postponed/cancelled game is not a normal scheduled game.
export function matchFilterState(event: any): Exclude<MatchFilter, 'all'> | 'other' {
  const status = event?.status?.type;
  if (/POSTPONED|CANCELED|CANCELLED|SUSPENDED|DELAYED|ABANDONED/i.test(status?.name || '')) return 'other';
  return ({ in: 'live', pre: 'scheduled', post: 'finished' } as const)[status?.state as 'in' | 'pre' | 'post'] || 'other';
}

export function matchesTeamSearch(event: any, query: string): boolean {
  const competitors = event?.competitions?.[0]?.competitors;
  if (!Array.isArray(competitors) || !competitors.some((c: any) => c.homeAway === 'home' && c.team) || !competitors.some((c: any) => c.homeAway === 'away' && c.team)) return false;
  const normalized = normalizeMatchSearch(query);
  if (!normalized) return true;
  return competitors.some((c: any) => {
    const names = [c.team?.displayName, c.team?.shortDisplayName, c.team?.name, c.team?.abbreviation].filter((n): n is string => typeof n === 'string');
    return names.flatMap(name => [name, footballNameInArabic(name) || '']).some(name => normalizeMatchSearch(name).includes(normalized));
  });
}

export function filterLiveMatches(matches: Record<string, any[]>, league: string, query: string, status: MatchFilter) {
  const counts: Record<MatchFilter, number> = { all: 0, live: 0, scheduled: 0, finished: 0 };
  const visible: Record<string, any[]> = {};
  for (const [id, events] of Object.entries(matches)) {
    if (league !== 'all' && league !== id) continue;
    const searched = events.filter(event => matchesTeamSearch(event, query));
    visible[id] = searched.filter(event => {
      const state = matchFilterState(event);
      counts.all++;
      if (state !== 'other') counts[state]++;
      return status === 'all' || state === status;
    });
  }
  return { visible, counts, total: Object.values(visible).reduce((sum, events) => sum + events.length, 0) };
}
