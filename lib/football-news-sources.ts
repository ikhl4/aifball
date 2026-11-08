/** Curated football-news accounts. Add or disable accounts here without changing API logic. */
export type NewsCategory = 'general' | 'transfers';
export type NewsSource = {
  handle: string;
  label: string;
  categories: NewsCategory[];
  kind: 'journalist' | 'aggregator';
  enabled: boolean;
};
export const FOOTBALL_NEWS_SOURCES: readonly NewsSource[] = [
  { handle: '1smi_', label: '1smi_', categories: ['general'], kind: 'aggregator', enabled: true },
  { handle: 'rengo_sport', label: 'rengo_sport', categories: ['general'], kind: 'aggregator', enabled: true },
  { handle: 'trendepl', label: 'trendepl', categories: ['general'], kind: 'aggregator', enabled: true },
  { handle: 'FabrizioRomano', label: 'Fabrizio Romano', categories: ['transfers', 'general'], kind: 'journalist', enabled: true },
  { handle: 'DeadlineDayLive', label: 'Deadline Day Live', categories: ['transfers'], kind: 'aggregator', enabled: true },
];
export function activeNewsSources(category?: NewsCategory): NewsSource[] {
  return FOOTBALL_NEWS_SOURCES.filter(source => source.enabled && (!category || source.categories.includes(category)));
}
export function xNewsSearchQuery(category?: NewsCategory): string {
  return '(' + activeNewsSources(category).map(source => 'from:' + source.handle).join(' OR ') + ') -is:retweet';
}
