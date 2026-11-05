import { footballNameInArabic } from './football-names-ar';
import { youtubeVideoId } from './summary-presentation';

export const HIGHLIGHT_CHANNELS = ['beinsports', 'tod_bybein', 'thmanyahsports', 'beinsportsturkiye', 'seriea', 'laliga', 'mls', 'adsportstv', 'alkasstvsports', 'stctvsports'] as const;
export type HighlightMatch = { home: string; away: string; date: string; competition?: string };
export type HighlightVideo = { id: string; url: string; title: string; channel: string; publishedAt: string; embeddable: boolean };
type ChannelIndex = { channelId: string; videos: { id: string; title: string }[] };
type Result = { status: 'found'; video: HighlightVideo } | { status: 'not_found' | 'unavailable' };
const cache = new Map<string, { expires: number; value: Promise<ChannelIndex> }>();
const norm = (s: string) => s.normalize('NFKD').toLowerCase().replace(/[\u0300-\u036f\u064b-\u065f\u0670ـ]/g, '').replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/[^\p{L}\p{N}]+/gu, ' ').replace(/اتليتيكو/g, 'اتلتيكو').replace(/\bبايرن ميونخ\b/g, 'بايرن').replace(/\s+/g, ' ').trim();
const text = (v: any): string => v?.simpleText || v?.content || (Array.isArray(v?.runs) ? v.runs.map((r: any) => r.text || '').join('') : '');

/** Parse a public page's JSON without executing any page code. */
export function pageJson(html: string, variable: string): any {
  const marker = html.indexOf(`var ${variable} = `);
  if (marker < 0) throw Error('MISSING_METADATA');
  const start = html.indexOf('{', marker); let depth = 0, quoted = false, escaped = false;
  for (let i = start; i < html.length; i++) {
    const c = html[i];
    if (quoted) { if (escaped) escaped = false; else if (c === '\\') escaped = true; else if (c === '"') quoted = false; }
    else if (c === '"') quoted = true;
    else if (c === '{') depth++;
    else if (c === '}' && --depth === 0) return JSON.parse(html.slice(start, i + 1));
  }
  throw Error('INVALID_METADATA');
}
function handleOf(raw: string): string {
  try { const u = new URL(raw); return /^(?:www\.)?youtube\.com$/.test(u.hostname) && /^\/@[\w-]+\/?$/.test(u.pathname) ? u.pathname.slice(2).replace(/\/$/, '').toLowerCase() : ''; } catch { return ''; }
}
export function channelIndex(html: string, handle: string): ChannelIndex {
  const data = pageJson(html, 'ytInitialData'), meta = data.metadata?.channelMetadataRenderer;
  if (!meta || handleOf(meta.vanityChannelUrl || '') !== handle || !/^UC[\w-]{22}$/.test(meta.externalId || '')) throw Error('CHANNEL_IDENTITY');
  const videos = new Map<string, string>();
  const visit = (v: any) => {
    if (!v || typeof v !== 'object') return;
    const old = v.videoRenderer;
    if (old?.videoId) videos.set(old.videoId, text(old.title));
    if (v.contentType === 'LOCKUP_CONTENT_TYPE_VIDEO' && /^[\w-]{11}$/.test(v.contentId || '')) videos.set(v.contentId, text(v.metadata?.lockupMetadataViewModel?.title));
    for (const child of Object.values(v)) { if (Array.isArray(child)) child.forEach(visit); else if (child && typeof child === 'object') visit(child); }
  };
  visit(data.contents);
  return { channelId: meta.externalId, videos: [...videos].map(([id, title]) => ({ id, title })) };
}
/** Safely extract search result candidates. Result URLs are never shown until verified. */
export function searchVideoCandidates(html: string): { id: string; title: string }[] {
  const data = pageJson(html, 'ytInitialData');
  const videos = new Map<string,string>();
  const visit = (node: any) => {
    if (!node || typeof node !== 'object') return;
    const item = node.videoRenderer;
    if (item && /^[\\w-]{11}$/.test(item.videoId || '')) videos.set(item.videoId, text(item.title));
    for (const child of Object.values(node)) {
      if (Array.isArray(child)) child.forEach(visit);
      else if (child && typeof child === 'object') visit(child);
    }
  };
  visit(data.contents);
  return [...videos].map(([id,title]) => ({id,title}));
}
export function feedVideos(xml: string, channelId: string): { id: string; title: string }[] {
  if (!xml.includes(`<yt:channelId>${channelId}</yt:channelId>`)) throw Error('FEED_IDENTITY');
  const decode = (s: string) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  return [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].flatMap(m => {
    const id = m[1].match(/<yt:videoId>([\w-]{11})<\/yt:videoId>/)?.[1], title = m[1].match(/<title>([\s\S]*?)<\/title>/)?.[1];
    return id && title ? [{ id, title: decode(title) }] : [];
  });
}
export function matchesTeams(title: string, match: HighlightMatch): boolean {
  const value = norm(title);
  return [match.home, match.away].every(team => {
    const aliases = [team, footballNameInArabic(team)].filter(Boolean).map(name => norm(name!));
    if (aliases.includes('paris saint germain') || aliases.includes('باريس سان جيرمان')) aliases.push('psg', 'باريس سان جيرمان');
    // Broadcaster spellings differ from ESPN names (Lens = لانس / لونس).
    if (aliases.some(a => ['lens', 'rc lens', 'لانس', 'لونس'].includes(a))) aliases.push('lens', 'rc lens', 'لانس', 'لونس');
    if (aliases.some(a => a.includes('shabab al ahli') || a.includes('shabab al ahly') || a.includes('شباب الاهلي'))) aliases.push('شباب الاهلي', 'شباب اهلي دبي', 'شباب الأهلي دبي', 'شباب الاهلي دبي', 'shabab al ahli', 'shabab al ahly', 'shabab al ahli dubai');
    if (aliases.some(a => a.includes('aek athens') || a === 'ايك اثينا' || a === 'ايك اثينا')) aliases.push('aek', 'aek athens', 'ايك', 'ايك اثينا', 'أيك أثينا');
    if (aliases.some(a => a.includes('real madrid') || a === 'ريال مدريد')) aliases.push('real madrid', 'ريال مدريد');
    if (aliases.some(a => a.includes('al hilal') || a === 'الهلال')) aliases.push('al hilal', 'al hilal sfc', 'الهلال');
    // Official highlight titles often omit city suffixes or use different Arabic spellings.
    if (aliases.some(a => /^(?:atletico madrid|atletico de madrid|اتلتيكو مدريد|اتلتيكو)$/.test(a))) aliases.push('atletico', 'atletico madrid', 'اتلتيكو');
    if (aliases.some(a => /^(?:bayern|bayern munich|fc bayern munchen|بايرن)$/.test(a))) aliases.push('bayern', 'bayern munich', 'بايرن');
    return aliases.some(name => name.length >= 3 && ((` ${value} `).includes(` ${name} `) || (/[\u0600-\u06ff]/.test(name) && (` ${value} `).includes(` و${name} `))));
  }) && /ملخص|highlights?|özet|resumen|sintesi/i.test(title);
}
export function videoMetadata(html: string, id: string, match: HighlightMatch, expectedChannelId?: string): HighlightVideo {
  const p = pageJson(html, 'ytInitialPlayerResponse'), d = p.videoDetails, m = p.microformat?.playerMicroformatRenderer;
  const handle = handleOf(m?.ownerProfileUrl || '');
  if (d?.videoId !== id || !HIGHLIGHT_CHANNELS.includes(handle as any) || (expectedChannelId && d.channelId !== expectedChannelId) || !matchesTeams(d.title || '', match)) throw Error('VIDEO_IDENTITY');
  const publishedAt = m?.publishDate || m?.uploadDate || '', published = Date.parse(publishedAt), played = Date.parse(match.date + 'T00:00:00+03:00');
  // Publication can cross midnight; never use a previous season's meeting.
  if (!Number.isFinite(published) || !Number.isFinite(played) || published < played || published > played + 4 * 86400000) throw Error('VIDEO_DATE');
  if (!['OK', 'UNPLAYABLE'].includes(p.playabilityStatus?.status)) throw Error('VIDEO_UNAVAILABLE');
  return { id, url: `https://www.youtube.com/watch?v=${id}`, title: d.title, channel: m.ownerChannelName || d.author, publishedAt, embeddable: p.playabilityStatus?.playableInEmbed === true };
}
async function html(url: string, signal: AbortSignal, fetcher: typeof fetch): Promise<string> {
  const r = await fetcher(url, { signal, cache: 'no-store' });
  if (!r.ok) throw Error('UPSTREAM_' + r.status);
  if (Number(r.headers.get('content-length')) > 4_000_000) throw Error('PAGE_SIZE');
  const value = await r.text(); if (value.length > 4_000_000) throw Error('PAGE_SIZE'); return value;
}
/** Discovery starts with Dify's DDG candidates, then the selected channels' recent public uploads.
 * oEmbed failure and disabled embedding are not evidence that a video is absent. */
export async function findHighlightVideo(match: HighlightMatch, candidate = '', signal?: AbortSignal, fetcher: typeof fetch = fetch): Promise<Result> {
  if (!match.home || !match.away || !/^\d{4}-\d{2}-\d{2}$/.test(match.date)) return { status: 'unavailable' };
  const c = new AbortController(), timer = setTimeout(() => c.abort(), 35000), abort = () => c.abort();
  signal?.addEventListener('abort', abort, { once: true }); if (signal?.aborted) abort();
  let failed = false;
  const check = async (id: string, channelId?: string) => videoMetadata(await html(`https://www.youtube.com/watch?v=${id}`, c.signal, fetcher), id, match, channelId);
  try {
    const candidateId = youtubeVideoId(candidate);
    if (candidateId) { try { return { status: 'found', video: await check(candidateId) }; } catch { /* Try the official channel instead of declaring absence. */ } }
    // Search fixture-specific uploads first; recent channel feeds omit older clips
    // when a broadcaster publishes multiple videos daily.
    const arHome = footballNameInArabic(match.home) || match.home;
    const arAway = footballNameInArabic(match.away) || match.away;
    const queryVariants = [
      `${arHome} ${arAway} ملخص beIN SPORTS`,
      `${match.home} ${match.away} highlights`,
    ];
    for (const query of queryVariants) {
      if (c.signal.aborted) break;
      try {
        const candidates = searchVideoCandidates(await html('https://www.youtube.com/results?search_query=' + encodeURIComponent(query), c.signal, fetcher));
        for (const item of candidates.filter(v => matchesTeams(v.title, match)).slice(0, 8)) {
          try { return { status: 'found', video: await check(item.id) }; }
          catch { failed = true; }
        }
      } catch { failed = true; }
    }
    const channels = [...HIGHLIGHT_CHANNELS];
    if (/روشن|saudi|ksa/i.test(match.competition || '')) channels.sort((a, b) => Number(b === 'thmanyahsports') - Number(a === 'thmanyahsports'));
    for (let offset = 0; offset < channels.length && !c.signal.aborted; offset += 3) {
      const results = await Promise.allSettled(channels.slice(offset, offset + 3).map(async handle => {
        const existing = cache.get(handle);
        if (existing && existing.expires > Date.now()) return existing.value;
        const value = html(`https://www.youtube.com/@${handle}/videos`, c.signal, fetcher).then(async page => {
          const channel = channelIndex(page, handle);
          // The public syndication feed lists uploads independently of playback region.
          // We only read metadata; playback stays on YouTube with the publisher's restrictions.
          try {
            const feed = feedVideos(await html(`https://www.youtube.com/feeds/videos.xml?channel_id=${channel.channelId}`, c.signal, fetcher), channel.channelId);
            channel.videos = [...new Map([...feed, ...channel.videos].map(v => [v.id, v])).values()];
          } catch { /* The public videos page is still a valid discovery source. */ }
          return channel;
        });
        cache.set(handle, { expires: Date.now() + 300000, value });
        value.catch(() => { if (cache.get(handle)?.value === value) cache.delete(handle); });
        return value;
      }));
      for (const result of results) {
        if (result.status === 'rejected') { failed = true; continue; }
        for (const item of result.value.videos.filter(v => matchesTeams(v.title, match)).slice(0, 3)) {
          try { return { status: 'found', video: await check(item.id, result.value.channelId) }; } catch { failed = true; }
        }
      }
    }
    return { status: failed || c.signal.aborted ? 'unavailable' : 'not_found' };
  } finally { clearTimeout(timer); signal?.removeEventListener('abort', abort); }
}
