import { footballNameInArabic } from './football-names-ar';

export const ANALYTICS_LEAGUES = [
  { id: 'ksa.1', label: 'دوري روشن السعودي' },
  { id: 'eng.1', label: 'الدوري الإنجليزي' },
  { id: 'esp.1', label: 'الدوري الإسباني' },
  { id: 'ita.1', label: 'الدوري الإيطالي' },
  { id: 'ger.1', label: 'الدوري الألماني' },
  { id: 'fra.1', label: 'الدوري الفرنسي' },
  { id: 'uefa.champions', label: 'دوري أبطال أوروبا' },
  { id: 'afc.champions', label: 'دوري أبطال آسيا للنخبة' },
  { id: 'usa.1', label: 'الدوري الأمريكي' },
] as const;

export type AnalyticsMatch = {
  id: string; league: string; competition: string; date: string;
  state: 'pre' | 'in' | 'post'; home: string; away: string;
  homeId: string; awayId: string; homeLogo: string | null; awayLogo: string | null;
  homeScore: number | null; awayScore: number | null; source: string | null;
};
const isSafeEspn = (url: unknown): url is string => {
  if (typeof url !== 'string') return false;
  try { const parsed = new URL(url); return parsed.protocol === 'https:' && /(^|\.)espn\.com$/.test(parsed.hostname); } catch { return false; }
};
export function normalizeAnalyticsEvent(raw: any, league: string, competition: string): AnalyticsMatch | null {
  const competitors = raw?.competitions?.[0]?.competitors;
  if (!Array.isArray(competitors)) return null;
  const home = competitors.find((c: any) => c?.homeAway === 'home');
  const away = competitors.find((c: any) => c?.homeAway === 'away');
  if (!home?.team?.id || !away?.team?.id || !raw?.id || !Number.isFinite(Date.parse(raw?.date))) return null;
  const state = raw?.status?.type?.state;
  if (!['pre', 'in', 'post'].includes(state) || /POSTPONED|CANCELED|CANCELLED|ABANDONED|SUSPENDED/i.test(raw?.status?.type?.name || '')) return null;
  const name = (item: any) => {
    const original = String(item.team?.displayName || item.team?.shortDisplayName || item.team?.name || '');
    return footballNameInArabic(original) || original;
  };
  const logo = (item: any) => {
    const value = item.team?.logos?.find((logo: any) => typeof logo?.href === 'string' && /^https:\/\//.test(logo.href))?.href;
    return typeof value === 'string' ? value : null;
  };
  const score = (item: any) => state === 'pre' || item.score == null || item.score === '' || !Number.isFinite(Number(item.score)) ? null : Number(item.score);
  const href = raw?.links?.find((link: any) => isSafeEspn(link?.href))?.href;
  return { id: String(raw.id), league, competition, date: raw.date, state,
    home: name(home), away: name(away), homeId: String(home.team.id), awayId: String(away.team.id),
    homeLogo: logo(home), awayLogo: logo(away), homeScore: score(home), awayScore: score(away),
    source: isSafeEspn(href) ? href : null };
}
export function aggregateAnalytics(matches: AnalyticsMatch[]) {
  const completed = matches.filter(m => m.state === 'post' && m.homeScore !== null && m.awayScore !== null);
  const live = matches.filter(m => m.state === 'in').length;
  const upcoming = matches.filter(m => m.state === 'pre').length;
  const goals = completed.reduce((sum, m) => sum + (m.homeScore || 0) + (m.awayScore || 0), 0);
  const sides = new Map<string, { id: string; name: string; played: number; wins: number; draws: number; losses: number; goalsFor: number; goalsAgainst: number }>();
  for (const m of completed) {
    const update = (id: string, name: string, own: number, other: number) => {
      const key = m.league + ':' + id;
      const row = sides.get(key) || { id: key, name, played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0 };
      row.played++; row.goalsFor += own; row.goalsAgainst += other;
      if (own > other) row.wins++; else if (own === other) row.draws++; else row.losses++;
      sides.set(key, row);
    };
    update(m.homeId, m.home, m.homeScore!, m.awayScore!);
    update(m.awayId, m.away, m.awayScore!, m.homeScore!);
  }
  return { games: matches.length, completed: completed.length, live, upcoming, goals,
    averageGoals: completed.length ? Number((goals / completed.length).toFixed(2)) : null,
    teams: [...sides.values()].sort((a, b) => b.goalsFor - a.goalsFor || b.wins - a.wins).slice(0, 12) };
}
