type EspnCompetitor = {
  homeAway?: string;
  team?: { displayName?: string; name?: string; abbreviation?: string };
  score?: string;
};
type EspnEvent = {
  id?: string;
  date?: string;
  name?: string;
  status?: { type?: { completed?: boolean; state?: string } };
  competitions?: Array<{ competitors?: EspnCompetitor[]; details?: Array<any> }>;
};
type Match = {
  league: string;
  leagueName: string;
  date: string;
  home: string;
  away: string;
  homeScore: string;
  awayScore: string;
  eventId: string;
  slug: string;
  goals: string[];
};

const COMPETITIONS = [
  { slug: 'eng.1', name: 'الدوري الإنجليزي الممتاز' },
  { slug: 'esp.1', name: 'الدوري الإسباني' },
  { slug: 'ita.1', name: 'الدوري الإيطالي' },
  { slug: 'ger.1', name: 'الدوري الألماني' },
  { slug: 'fra.1', name: 'الدوري الفرنسي' },
  { slug: 'ksa.1', name: 'دوري روشن السعودي' },
  { slug: 'uefa.champions', name: 'دوري أبطال أوروبا' },
  { slug: 'afc.champions', name: 'دوري أبطال آسيا للنخبة' },
  { slug: 'uefa.europa', name: 'الدوري الأوروبي' },
  { slug: 'uefa.europa.conf', name: 'دوري المؤتمر الأوروبي' },
] as const;

const TRUSTED_CHANNEL_HINTS = [
  'bein', 'be in', 'thmanyah', 'ثمانية', 'tod', 'serie a', 'laliga',
  'la liga', 'mls', 'abu dhabi', 'أبوظبي', 'alkass', 'الكأس', 'stc',
];

function normalize(value: string): string {
  return value.toLocaleLowerCase().normalize('NFKD')
    .replace(/[\u0300-\u036f\u064b-\u065f\u0670ـ]/g, '')
    .replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي')
    .replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}
function dateInRiyadh(value: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Riyadh', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date(value));
}
function targetDate(query: string, now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Riyadh', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now);
  const get = (key: string) => Number(parts.find(part => part.type === key)?.value);
  const date = new Date(Date.UTC(get('year'), get('month') - 1, get('day')));
  if (/الأمس|امس|مباراة امس|yesterday/i.test(query)) date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}
function parseGoals(payload: any, event: EspnEvent): string[] {
  const details = [
    ...(Array.isArray(payload?.scoringPlays) ? payload.scoringPlays : []),
    ...(Array.isArray(payload?.header?.competitions?.[0]?.details) ? payload.header.competitions[0].details : []),
    ...(Array.isArray(event.competitions?.[0]?.details) ? event.competitions[0].details : []),
  ];
  const seen = new Set<string>();
  return details.flatMap((item: any) => {
    const text = String(item?.text || item?.type?.text || item?.shortText || '');
    const scoring = item?.scoringPlay === true || /goal/i.test(text) || (item?.scoreValue > 0 && /penalty/i.test(text));
    if (!scoring) return [];
    const minute = String(item?.clock?.displayValue || item?.clock?.value || item?.time || '').trim();
    const scorer = item?.participants?.map((p: any) =>
      p?.athlete?.displayName || p?.athlete?.fullName || p?.name
    ).filter(Boolean).join(', ') || '';
    const team = item?.team?.displayName || '';
    const line = [scorer, team, minute ? `(${minute})` : ''].filter(Boolean).join(' — ');
    if (!line || seen.has(line)) return [];
    seen.add(line);
    return [line];
  });
}
function escapeAttribute(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
    .replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function eventTeams(event: EspnEvent) {
  const competitors = event.competitions?.[0]?.competitors || [];
  const home = competitors.find(item => item.homeAway === 'home') || competitors[0];
  const away = competitors.find(item => item.homeAway === 'away') || competitors[1];
  return { home, away };
}
async function fetchJson(url: string, timeoutMs = 10000): Promise<any> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { cache: 'no-store', signal: controller.signal, headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!response.ok) throw new Error(`Upstream HTTP ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}
async function getScoreboard(slug: string, date: string): Promise<EspnEvent[]> {
  const data = await fetchJson(`https://site.api.espn.com/apis/site/v2/sports/soccer/${slug}/scoreboard?dates=${date.replace(/-/g, '')}`);
  return Array.isArray(data?.events) ? data.events : [];
}
async function getEventSummary(slug: string, id: string): Promise<any> {
  try {
    return await fetchJson(`https://site.api.espn.com/apis/site/v2/sports/soccer/${slug}/summary?event=${encodeURIComponent(id)}`, 6000);
  } catch { return null; }
}
async function findVideo(match: Match): Promise<string> {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return '';
  const q = `${match.home} ${match.away} ${match.leagueName} highlights ${match.date}`;
  try {
    const data = await fetchJson(`https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoEmbeddable=true&safeSearch=strict&maxResults=10&q=${encodeURIComponent(q)}&key=${encodeURIComponent(key)}`, 8000);
    const homeTokens = normalize(match.home).split(' ').filter(token => token.length > 3);
    const awayTokens = normalize(match.away).split(' ').filter(token => token.length > 3);
    for (const item of data?.items || []) {
      const title = normalize(String(item?.snippet?.title || ''));
      const channel = normalize(String(item?.snippet?.channelTitle || ''));
      const confirmsTeams = homeTokens.some(token => title.includes(token)) && awayTokens.some(token => title.includes(token));
      const trustedChannel = TRUSTED_CHANNEL_HINTS.some(token => channel.includes(normalize(token)));
      const videoId = item?.id?.videoId;
      if (confirmsTeams && trustedChannel && /^[\w-]{11}$/.test(videoId || '')) {
        return `https://www.youtube.com/watch?v=${videoId}`;
      }
    }
  } catch { /* The confirmed written result is still useful without a video. */ }
  return '';
}
export function isDailyHighlightsRequest(query: string): boolean {
  const normalized = normalize(query);
  const summary = /ملخص|هايلايت|أبرز اللقطات|highlights?|recaps?|summar(?:y|ies)/i.test(query);
  const date = /اليوم|today|tonight|الامس|امس|yesterday/i.test(normalized);
  const plural = /ملخصات|ملخصs+مباريات|highlights|recaps|summaries/i.test(query);
  return summary && date && plural;
}

export async function buildDailyHighlights(query: string): Promise<string | null> {
  if (!isDailyHighlightsRequest(query)) return null;
  const date = targetDate(query);
  const dateKey = date.replace(/-/g, '');
  const lists = await Promise.allSettled(COMPETITIONS.map(item => getScoreboard(item.slug, dateKey)));
  const matches: Match[] = [];
  lists.forEach((result, index) => {
    if (result.status !== 'fulfilled') return;
    const competition = COMPETITIONS[index];
    for (const event of result.value) {
      if (!event?.id || !event.status?.type?.completed || (event.date && dateInRiyadh(event.date) !== date)) continue;
      const { home, away } = eventTeams(event);
      const homeName = home?.team?.displayName || home?.team?.name;
      const awayName = away?.team?.displayName || away?.team?.name;
      if (!homeName || !awayName || home?.score == null || away?.score == null) continue;
      matches.push({
        league: competition.slug, leagueName: competition.name, date,
        home: homeName, away: awayName, homeScore: String(home.score), awayScore: String(away.score),
        eventId: String(event.id), slug: competition.slug, goals: [],
      });
    }
  });
  if (!matches.length) return null;

  const capped = matches.slice(0, 40);
  await Promise.all(capped.map(async match => {
    const [summary, video] = await Promise.all([
      getEventSummary(match.slug, match.eventId),
      findVideo(match),
    ]);
    match.goals = parseGoals(summary, { id: match.eventId });
    (match as Match & { videoUrl?: string }).videoUrl = video;
  }));
  const grouped = new Map<string, Match[]>();
  for (const match of capped) grouped.set(match.leagueName, [...(grouped.get(match.leagueName) || []), match]);
  const dateLabel = new Intl.DateTimeFormat('ar-SA', { calendar: 'gregory', timeZone: 'Asia/Riyadh', year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }).format(new Date(`${date}T12:00:00+03:00`));
  const parts = [`ملخصات مباريات ${/الأمس|امس|yesterday/i.test(query) ? 'الأمس' : 'اليوم'} — ${dateLabel} (توقيت الرياض)`];
  for (const [league, items] of grouped) {
    parts.push(`## ${league}`);
    for (const match of items) {
      const score = `${match.home} ${match.homeScore}–${match.awayScore} ${match.away}`;
      const goals = match.goals.length
        ? `الأهداف المؤكدة حسب سجل أحداث ESPN: ${match.goals.join('؛ ')}.`
        : 'لم يتوفر سجل موثوق لتفاصيل مسجلي الأهداف ودقائقها.';
      const summary = `${match.homeScore === match.awayScore ? 'انتهت المباراة بالتعادل' : `انتهت بفوز ${Number(match.homeScore) > Number(match.awayScore) ? match.home : match.away}`} بنتيجة ${match.homeScore}–${match.awayScore}. ${goals}`;
      const videoUrl = (match as Match & { videoUrl?: string }).videoUrl || '';
      parts.push(`<aifball-summary order="video-first" competition="${escapeAttribute(league)}" match="${escapeAttribute(score)}" date="${date}" summary="${escapeAttribute(summary)}"${videoUrl ? ` video_url="${escapeAttribute(videoUrl)}"` : ''} />`);
    }
  }
  return parts.join('\n\n');
}
