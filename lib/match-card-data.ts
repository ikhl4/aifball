import { footballNameInArabic } from './football-names-ar';
import { normalizeMatchSearch } from './live-match-filters';

export const POSTER_LEAGUES = [
  ['ksa.1', 'دوري روشن السعودي'], ['eng.1', 'الدوري الإنجليزي'], ['esp.1', 'الدوري الإسباني'],
  ['ita.1', 'الدوري الإيطالي'], ['ger.1', 'الدوري الألماني'], ['fra.1', 'الدوري الفرنسي'],
  ['uefa.champions', 'دوري أبطال أوروبا'], ['afc.champions', 'دوري أبطال آسيا للنخبة'],
  ['usa.1', 'الدوري الأمريكي'], ['fifa.world', 'كأس العالم'],
] as const;

export type PosterTeam = { id: string; name: string; logo: string | null; color: string | null };
export type PosterMatch = {
  id: string; league: string; competition: string; home: PosterTeam; away: PosterTeam;
  status: 'upcoming' | 'live' | 'finished'; score: { home: string; away: string } | null;
  date: string; venue: string | null; round: string | null; statusDetail: string | null; source: string | null;
};
const normal = (s: string) => normalizeMatchSearch(s).replace(/\b(al|fc|sc|club)\b/g, '').trim();
const aliases: Record<string, string[]> = {
  'الاتحاد': ['الاتحاد', 'ittihad', 'al ittihad'], 'الهلال': ['الهلال', 'hilal', 'al hilal'],
  'النصر': ['النصر', 'nassr', 'al nassr'], 'الأهلي': ['الأهلي', 'الاهلي', 'ahli', 'al ahli'],
  'الشباب': ['الشباب', 'shabab'], 'القادسية': ['القادسية', 'qadsiah'],
  'الاتفاق': ['الاتفاق', 'ettifaq'], 'التعاون': ['التعاون', 'taawoun'],
  'برشلونة': ['برشلونة', 'barcelona'], 'ريال مدريد': ['ريال مدريد', 'real madrid'],
  'مانشستر سيتي': ['مانشستر سيتي', 'manchester city', 'man city'],
  'ليفربول': ['ليفربول', 'liverpool'], 'أرسنال': ['ارسنال', 'arsenal'],
};
export function posterIntent(query: string): boolean {
  return /(?:صمم|صمّم|تصميم|بوستر|ملصق|بطاق[ةه]|poster|design|match\s*card)/i.test(query)
    && /(?:مبارا[ةه]|مواجه[ةه]|نتيج[ةه]|القادم[ةه]|الأخير[ةه]|اخر|نهائي|match|fixture|score|vs|ضد|بين)/i.test(query);
}
export function requestedPosterState(query: string): 'upcoming' | 'finished' | 'live' | 'any' {
  if (/مباشر|live|الآن/i.test(query)) return 'live';
  if (/نتيج[ةه]|الأخير[ةه]|اخر|السابقة|انتهت|result/i.test(query)) return 'finished';
  if (/القادم[ةه]|المقبل[ةه]|القادمه|المقبلة|upcoming|next/i.test(query)) return 'upcoming';
  return 'any';
}
function teamNames(team: PosterTeam): string[] {
  const translated = footballNameInArabic(team.name) || '';
  const canonical = normal(translated);
  return [team.name, translated, ...(aliases[translated] || []), ...(aliases[canonical] || [])].filter(Boolean).map(normal);
}
function mentionsTeam(query: string, team: PosterTeam): boolean {
  const q = ' ' + normal(query) + ' ';
  return teamNames(team).some(name => name.length > 2 && q.includes(' ' + name + ' '));
}
function mapTeam(competitor: any): PosterTeam {
  const t = competitor.team;
  const raw = String(t?.displayName || t?.shortDisplayName || t?.name || '');
  const logos = Array.isArray(t?.logos) ? t.logos : [];
  const logo = logos.find((l: any) => typeof l?.href === 'string' && /^https:\/\//.test(l.href))?.href;
  return { id: String(t?.id || ''), name: footballNameInArabic(raw) || raw, logo: logo || null,
    color: typeof t?.color === 'string' && /^[0-9a-f]{6}$/i.test(t.color) ? '#' + t.color : null };
}
function validSource(s: unknown): string | null {
  if (typeof s !== 'string') return null;
  try { const u = new URL(s); return u.protocol === 'https:' && /(^|\.)espn\.com$/.test(u.hostname) ? u.href : null; } catch { return null; }
}
export function parsePosterEvent(raw: any, league: string, label: string): PosterMatch | null {
  const c = raw?.competitions?.[0];
  const competitors = c?.competitors;
  if (!Array.isArray(competitors)) return null;
  const home = competitors.find((p: any) => p.homeAway === 'home');
  const away = competitors.find((p: any) => p.homeAway === 'away');
  if (!home?.team || !away?.team || !raw?.date || !Number.isFinite(Date.parse(raw.date))) return null;
  const state = raw?.status?.type?.state;
  const name = String(raw?.status?.type?.name || '');
  if (!['pre', 'in', 'post'].includes(state) || /POSTPONED|CANCELED|CANCELLED|ABANDONED/i.test(name)) return null;
  const status = state === 'pre' ? 'upcoming' : state === 'post' ? 'finished' : 'live';
  const venue = c?.venue?.fullName || raw?.venue?.fullName || null;
  return { id: String(raw.id), league, competition: label, home: mapTeam(home), away: mapTeam(away),
    status, score: status === 'upcoming' ? null : { home: String(home.score ?? '—'), away: String(away.score ?? '—') },
    date: raw.date, venue: typeof venue === 'string' ? venue : null,
    round: typeof raw?.season?.displayName === 'string' ? null : (c?.notes?.[0]?.headline || null),
    statusDetail: status === 'live' ? String(raw?.status?.displayClock || raw?.status?.type?.detail || 'مباشر') : null,
    source: validSource(raw?.links?.[0]?.href) || validSource(c?.links?.[0]?.href) };
}
export function selectPosterMatch(query: string, matches: PosterMatch[], now = Date.now()): PosterMatch | null {
  const state = requestedPosterState(query);
  const mentioned = matches.map(m => ({ m, count: Number(mentionsTeam(query, m.home)) + Number(mentionsTeam(query, m.away)) }));
  const max = Math.max(0, ...mentioned.map(x => x.count));
  if (!max) return null; // Never choose a random event for an unidentified team.
  const relevant = mentioned.filter(x => x.count === max && (max < 2 || x.count === 2)).map(x => x.m);
  const filtered = relevant.filter(m => state === 'any' || m.status === state);
  const candidates = filtered.length ? filtered : (state === 'any' ? relevant : []);
  if (!candidates.length) return null;
  const ordered = candidates.sort((a,b) => {
    const rank = (m: PosterMatch) => state !== 'any' ? 0 : m.status === 'live' ? -2 : m.status === 'upcoming' ? -1 : 0;
    if (rank(a) !== rank(b)) return rank(a) - rank(b);
    const da = Date.parse(a.date), db = Date.parse(b.date);
    if (state === 'finished' || (state === 'any' && a.status === 'finished' && b.status === 'finished')) return db - da;
    return Math.abs(da-now) - Math.abs(db-now);
  });
  return ordered[0] || null;
}
