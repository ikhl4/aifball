// Official-source highlights experiment; preview branch only, not merged to production.
import { footballNameInArabic } from './football-names-ar';
import { youtubeVideoId } from './summary-presentation';

export const HIGHLIGHT_CHANNELS = ['beinsports', 'ittihadclub', 'theafchub', 'tod_bybein', 'thmanyahsports', 'beinsportsturkiye', 'seriea', 'laliga', 'mls', 'adsportstv', 'alkasstvsports', 'stctvsports'] as const;
export type HighlightMatch = { home: string; away: string; date: string; competition?: string };
export type HighlightVideo = { id: string; url: string; title: string; channel: string; publishedAt: string; embeddable: boolean };
type ChannelIndex = { channelId: string; videos: { id: string; title: string }[] };
type Result = { status: 'found'; video: HighlightVideo } | { status: 'not_found' | 'unavailable' };
const cache = new Map<string, { expires: number; value: Promise<ChannelIndex> }>();
// YouTube often uses /channel/UC... instead of a vanity handle for real publishers.
const OFFICIAL_CHANNEL_TITLES = new Set([
  'beIN SPORTS', 'beIN SPORTS العربية', 'beIN SPORTS Türkiye',
  'TOD', 'TOD by beIN', 'ثمانية', 'ثمانية رياضة', 'Thmanyah Sports',
  'Serie A', 'Serie A Enilive', 'LaLiga', 'LaLiga EA SPORTS',
  'MLS', 'Major League Soccer', 'AD Sports', 'أبوظبي الرياضية',
  'قناة نادي الاتحاد السعودي', 'نادي الاتحاد السعودي', 'Al-Ittihad Club',
  'The AFC Hub',
  'Alkass Sports Channels', 'قنوات الكأس', 'stc tv sports'
].map(name => name.toLowerCase()));
// Verified official YouTube channel IDs, used if search omits @handles.
const VERIFIED_CHANNEL_IDS: Record<string, string> = {
  UCJUCcJUeh0Cz2xyKwkw5Q1w: 'beinsports',
  UCivJETAP4VD7rXRgjdpVwNw: 'ittihadclub',
  UCnj0TjaM0wyxkAWW_nz8_1g: 'theafchub',
};
function verifiedPublisher(handle: string, channelId: string, channelName: string): boolean {
  const knownHandle = VERIFIED_CHANNEL_IDS[channelId];
  if (knownHandle) return !handle || handle === knownHandle;
  // Search metadata has to give an exact official channel handle; title
  // alone is not evidence that a similarly named account is official.
  return HIGHLIGHT_CHANNELS.includes(handle as typeof HIGHLIGHT_CHANNELS[number]);
}
const norm = (s: string) => s.normalize('NFKD').toLowerCase().replace(/[\u0300-\u036f\u064b-\u065f\u0670ـ]/g, '').replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/[^\p{L}\p{N}]+/gu, ' ').replace(/اتليتيكو/g, 'اتلتيكو').replace(/\bبايرن ميونخ\b/g, 'بايرن').replace(/\s+/g, ' ').trim();
const text = (v: any): string => v?.simpleText || v?.content || (Array.isArray(v?.runs) ? v.runs.map((r: any) => r.text || '').join('') : '');

/** Parse a public page's JSON without executing any page code. */
export function pageJson(html: string, variable: string): any {
  const marker = html.indexOf(`var ${variable} = `) >= 0 ? html.indexOf(`var ${variable} = `) : html.indexOf(`${variable} = `);
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
  if (!meta || !/^UC[\w-]{22}$/.test(meta.externalId || '')) throw Error('CHANNEL_IDENTITY');
  const actualHandle = handleOf(meta.vanityChannelUrl || '');
  if (actualHandle && actualHandle !== handle) throw Error('CHANNEL_IDENTITY');
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
    // Official highlight titles often omit city suffixes or use different Arabic spellings.
    if (aliases.some(a => /^(?:atletico madrid|atletico de madrid|اتلتيكو مدريد|اتلتيكو)$/.test(a))) aliases.push('atletico', 'atletico madrid', 'اتلتيكو');
    if (aliases.some(a => /^(?:bayern|bayern munich|fc bayern munchen|بايرن)$/.test(a))) aliases.push('bayern', 'bayern munich', 'بايرن');
    return aliases.some(name => name.length >= 3 && ((` ${value} `).includes(` ${name} `) || (/[\u0600-\u06ff]/.test(name) && (` ${value} `).includes(` و${name} `))));
  }) && /ملخص|اهداف|الأهداف|highlights?|goals|özet|resumen|sintesi/i.test(title);
}
export function videoMetadata(html: string, id: string, match: HighlightMatch, expectedChannelId?: string): HighlightVideo {
  const p = pageJson(html, 'ytInitialPlayerResponse'), d = p.videoDetails, m = p.microformat?.playerMicroformatRenderer;
  const handle = handleOf(m?.ownerProfileUrl || '');
  const publisherName = String(m?.ownerChannelName || d?.author || '').toLowerCase().trim();
  // Require an approved @handle or a separately verified channel ID;
  // a display name is insufficient because it can be imitated.
  const recognized = verifiedPublisher(handle, String(d?.channelId || ''), publisherName);
  // Keep identity checks strict, but identify precisely which one failed.
  if (!d?.videoId) throw Error('VIDEO_ID_MISSING');
  if (d.videoId !== id) throw Error('VIDEO_ID_MISMATCH');
  if (!recognized) throw Error('VIDEO_PUBLISHER_UNVERIFIED');
  if (expectedChannelId && d.channelId !== expectedChannelId) throw Error('VIDEO_CHANNEL_MISMATCH');
  if (!matchesTeams(d.title || '', match)) throw Error('VIDEO_TITLE_MISMATCH');
  const publishedAt = m?.publishDate || m?.uploadDate || '', published = Date.parse(publishedAt), played = Date.parse(match.date + 'T00:00:00+03:00');
  // Publication can cross midnight; never use a previous season's meeting.
  if (!Number.isFinite(played) || (Number.isFinite(published) && (published < played - 86400000 || published > played + 14 * 86400000))) throw Error('VIDEO_DATE');
  if (!['OK', 'UNPLAYABLE'].includes(p.playabilityStatus?.status)) throw Error('VIDEO_UNAVAILABLE');
  return { id, url: `https://www.youtube.com/watch?v=${id}`, title: d.title, channel: m.ownerChannelName || d.author, publishedAt, embeddable: p.playabilityStatus?.playableInEmbed === true };
}
async function html(url: string, signal: AbortSignal, fetcher: typeof fetch): Promise<string> {
  const r = await fetcher(url, { signal, cache: 'no-store' });
  if (!r.ok) throw Error('UPSTREAM_' + r.status);
  if (Number(r.headers.get('content-length')) > 4_000_000) throw Error('PAGE_SIZE');
  const value = await r.text(); if (value.length > 4_000_000) throw Error('PAGE_SIZE'); return value;
}
/** DuckDuckGo's lightweight HTML results can be read when YouTube blocks server-side pages. */
function decodeSearchText(value: string): string {
  return value.replace(/<[^>]+>/g, ' ').replace(/&(?:amp|quot|apos|lt|gt|nbsp);|&#(?:x[0-9a-f]+|\d+);/gi, entity => {
    const named: Record<string, string> = { '&amp;': '&', '&quot;': '"', '&apos;': "'", '&lt;': '<', '&gt;': '>', '&nbsp;': ' ' };
    if (named[entity.toLowerCase()]) return named[entity.toLowerCase()];
    const hex = entity.startsWith('&#x') || entity.startsWith('&#X');
    const point = parseInt(entity.slice(hex ? 3 : 2, -1), hex ? 16 : 10);
    return Number.isFinite(point) && point > 0 && point <= 0x10ffff ? String.fromCodePoint(point) : '';
  }).replace(/\s+/g, ' ').trim();
}
export type DuckDuckGoVideoResult = { id: string; title: string; snippet: string; url: string };
export function duckDuckGoVideos(page: string): DuckDuckGoVideoResult[] {
  const found = new Map<string, DuckDuckGoVideoResult>();
  // DuckDuckGo has two different public HTML layouts. Read result title
  // anchors in both, without depending on an exact enclosing <div>.
  const anchors = [...page.matchAll(/<a\b[^>]*class=["'][^"']*\b(?:result__a|result-link)\b[^"']*["'][^>]*>[\s\S]*?<\/a>/gi)].slice(0, 50);
  for (const anchor of anchors) {
    const link = anchor[0];
    const rawHref = link.match(/\bhref=["']([^"']+)["']/i)?.[1] || '';
    if (!rawHref) continue;
    let url = decodeSearchText(rawHref);
    if (url.startsWith('//')) url = 'https:' + url;
    try {
      const redirect = new URL(url, 'https://duckduckgo.com');
      if (redirect.hostname === 'duckduckgo.com' || redirect.hostname.endsWith('.duckduckgo.com')) {
        url = redirect.searchParams.get('uddg') || '';
      }
    } catch { continue; }
    const id = youtubeVideoId(url);
    if (!id || found.has(id)) continue;
    const title = decodeSearchText(link.replace(/^<a\b[^>]*>/i, '').replace(/<\/a>$/i, ''));
    if (!title) continue;
    // Snippets can be separated from their title by layout wrappers, so
    // inspect the following small neighborhood until the next result title.
    const tail = page.slice((anchor.index || 0) + link.length, (anchor.index || 0) + link.length + 5000);
    const nextTitle = tail.search(/<a\b[^>]*class=["'][^"']*\b(?:result__a|result-link)\b/i);
    const body = nextTitle >= 0 ? tail.slice(0, nextTitle) : tail;
    const snippet = decodeSearchText(body.match(/<(?:a|div|span|td)\b[^>]*class=["'][^"']*\b(?:result__snippet|result-snippet)\b[^"']*["'][^>]*>([\s\S]*?)<\/(?:a|div|span|td)>/i)?.[1] || '');
    if (/\bresult--ad\b|\bresult--sponsored\b/i.test(page.slice(Math.max(0, (anchor.index || 0) - 300), anchor.index || 0))) continue;
    found.set(id, { id, title, snippet, url: 'https://www.youtube.com/watch?v=' + id });
  }
  return [...found.values()];
}

function recognizedSearchPublisher(value: string): string {
  const lower = norm(value);
  const publishers = [
    ['beIN SPORTS', /(?:^|\s)bein sports(?:\s|$)/],
    ['TOD by beIN', /(?:^|\s)tod by bein(?:\s|$)/],
    ['ثمانية', /(?:^|\s)(?:ثمانيه|ثمانية|thmanyah sports)(?:\s|$)/],
    ['Serie A', /(?:^|\s)serie a(?:\s|$)/],
    ['LaLiga', /(?:^|\s)laliga(?:\s|$)/],
    ['MLS', /(?:^|\s)(?:mls|major league soccer)(?:\s|$)/],
    ['AD Sports', /(?:^|\s)(?:ad sports|abu dhabi sports|ابوظبي الرياضيه|ابوظبي الرياضية)(?:\s|$)/],
    ['Alkass', /(?:^|\s)(?:alkass|قنوات الكاس)(?:\s|$)/],
    ['STC TV Sports', /(?:^|\s)stc tv sports(?:\s|$)/],
  ] as const;
  return publishers.find(([, pattern]) => pattern.test(lower))?.[0] || '';
}
/** This is a search-verified result, not a claim YouTube confirmed embedding. */
export function trustedSearchVideo(item: DuckDuckGoVideoResult, match: HighlightMatch): HighlightVideo | null {
  if (!matchesTeams(item.title, match)) return null;
  const channel = recognizedSearchPublisher(item.snippet);
  if (!channel) return null;
  // The search result corroborates the publisher and two clubs. Without an
  // accessible watch page, do not make an unsupported embed claim.
  return { id: item.id, url: item.url, title: item.title, channel, publishedAt: '', embeddable: false };
}


type YoutubeSearchEntry = { id: string; title: string; channelId: string; handle: string; channelName: string; published: string };
export function youtubeSearchEntries(data: any): YoutubeSearchEntry[] {
  const entries: YoutubeSearchEntry[] = [];
  const visit = (node: any): void => {
    if (!node || typeof node !== 'object') return;
    const v = node.videoRenderer;
    if (/^[\w-]{11}$/.test(v?.videoId || '')) {
      const owner = v.ownerText?.runs?.[0]?.navigationEndpoint?.browseEndpoint;
      const handle = handleOf('https://www.youtube.com' + (owner?.canonicalBaseUrl || ''));
      entries.push({ id: v.videoId, title: text(v.title), channelId: String(owner?.browseId || ''),
        handle, channelName: text(v.ownerText) || '', published: text(v.publishedTimeText) });
    }
    for (const child of Object.values(node)) {
      if (Array.isArray(child)) child.forEach(visit);
      else if (child && typeof child === 'object') visit(child);
    }
  };
  visit(data?.contents);
  return [...new Map(entries.map(v => [v.id, v])).values()];
}
export function searchDateMatches(published: string, matchDate: string, now = Date.now()): boolean {
  const played = Date.parse(matchDate + 'T00:00:00+03:00');
  if (!Number.isFinite(played)) return false;
  const value = norm(published);
  let stamp: number | null = null;
  // Relative publication ages are routinely shown instead of absolute dates
  // on YouTube search result cards.
  const age = value.match(/(\d+)\s*(hours?|days?|weeks?|months?|years?|mo|[hdwy]|ساعه|ساعات|يوم|ايام|اسبوع|اسابيع|شهر|اشهر|سنه|سنوات)(?=\s|$)/i);
  if (age) {
    const n = Number(age[1]), unit = age[2].toLowerCase();
    const days = /^(h|hours?)$|ساع/.test(unit) ? n / 24
      : /^(w|weeks?)$|اسبوع/.test(unit) ? n * 7
      : /^(mo|months?)$|شهر/.test(unit) ? n * 30
      : /^(y|years?)$|سن/.test(unit) ? n * 365 : n;
    stamp = now - days * 86400000;
  }
  if (stamp === null && /(?:yesterday|امس)/.test(value)) stamp = now - 86400000;
  if (stamp === null && /(?:today|اليوم|\d+\s*minutes?|قبل دقائق)/.test(value)) stamp = now;
  // Absolute dates supplied in result metadata are more reliable than an age.
  if (stamp === null) {
    const iso = published.match(/\b(20\d{2})-(\d{1,2})-(\d{1,2})\b/);
    if (iso) stamp = Date.parse([iso[1],iso[2].padStart(2,'0'),iso[3].padStart(2,'0')].join('-')+'T12:00:00Z');
  }
  return stamp !== null && Number.isFinite(stamp)
    && stamp >= played - 86400000 && stamp <= played + 15 * 86400000;
}
export function searchPublicationReason(published: string, matchDate: string): 'matched' | 'missing' | 'outside_window' {
  if (searchDateMatches(published, matchDate)) return 'matched';
  return /(?:\d|yesterday|today|امس|اليوم)/i.test(published) ? 'outside_window' : 'missing';
}

/** Discovery starts with Dify's DDG candidates, then the selected channels' recent public uploads.
 * oEmbed failure and disabled embedding are not evidence that a video is absent. */
export async function findHighlightVideo(match: HighlightMatch, candidate = '', signal?: AbortSignal, fetcher: typeof fetch = fetch): Promise<Result> {
  if (!match.home || !match.away || !/^\d{4}-\d{2}-\d{2}$/.test(match.date)) return { status: 'unavailable' };
  const c = new AbortController(), timer = setTimeout(() => c.abort(), 24000), abort = () => c.abort();
  signal?.addEventListener('abort', abort, { once: true }); if (signal?.aborted) abort();
  let failed = false;
  // Preview-only diagnostic counters; no URLs, prompts, API keys, or snippets.
  const diagnostics = { ddgRequests: 0, ddgErrors: 0, ddgCandidates: 0, ddgMatch: 0,
    ddgPublisherRejected: 0, ddgTitleRejected: 0, youtubeSearchRequests: 0,
    youtubeSearchErrors: 0, youtubeVideoEntries: 0, youtubeMatchedTitles: 0,
    youtubeWatchRejected: 0, youtubeWatchStatusErrors: 0, channelFailures: 0,
    youtubeRejectReasons: {} as Record<string, number>, channelRejectReasons: {} as Record<string, number>,
    ddgErrorKinds: [] as string[], searchPublisherCandidates: 0,
    searchPublisherValidated: 0, searchDateRejected: 0, searchDateMissing: 0,
    searchDateOutsideWindow: 0, searchMissingIdentity: 0,
    searchPublicationExamples: [] as string[], result: 'unknown' };
  const logDiagnostic = () => {
    if (process.env.VERCEL_ENV === 'preview') {
      console.info('[AIFBALL_HIGHLIGHTS_DEBUG]', JSON.stringify({
        date: match.date, diagnostics,
      }));
    }
  };
  const check = async (id: string, channelId?: string) => videoMetadata(await html(`https://www.youtube.com/watch?v=${id}`, c.signal, fetcher), id, match, channelId);
  try {
    const candidateId = youtubeVideoId(candidate);
    if (candidateId) diagnostics.result = 'candidate_supplied';
    if (candidateId) { try { return { status: 'found', video: await check(candidateId) }; } catch { /* Try the official channel instead of declaring absence. */ } }
    const queries = [
      'site:youtube.com/watch ' + match.home + ' ' + match.away + ' highlights ' + match.date,
      'site:youtube.com/watch ' + (footballNameInArabic(match.home) || match.home) + ' ' + (footballNameInArabic(match.away) || match.away) + ' ملخص ' + match.date + ' ' + (match.competition || ''),
      'site:youtube.com/watch ' + (footballNameInArabic(match.home) || match.home) + ' ' + (footballNameInArabic(match.away) || match.away) + ' highlights ' + match.date.slice(0, 4) + ' ' + (match.competition || ''),
    ];
    // DuckDuckGo is the primary discovery source. If YouTube blocks the watch
    // page, retain an official result whose title and publisher are both
    // corroborated by the external search result.
    for (const query of [...new Set(queries)]) {
      if (c.signal.aborted) break;
      diagnostics.ddgRequests++;
      try {
        let page = '';
        try { page = await html('https://html.duckduckgo.com/html/?q=' + encodeURIComponent(query), c.signal, fetcher); }
        catch { page = await html('https://lite.duckduckgo.com/lite/?q=' + encodeURIComponent(query), c.signal, fetcher); }
        for (const item of duckDuckGoVideos(page)) {
          diagnostics.ddgCandidates++;
          if (!matchesTeams(item.title, match)) { diagnostics.ddgTitleRejected++; continue; }
          diagnostics.ddgMatch++;
          const fallback = trustedSearchVideo(item, match);
          if (!fallback) diagnostics.ddgPublisherRejected++;
          if (!fallback) continue;
          try { const video = await check(item.id); diagnostics.result = 'ddg_verified'; return { status: 'found', video }; }
          catch { /* Search snippets are discovery hints, not reliable proof
                     of the uploading channel. Confirm via YouTube's own
                     channel-linked search metadata below. */ }
        }
      } catch (err) { failed = true; diagnostics.ddgErrors++; const kind = err instanceof Error ? err.message : 'UNKNOWN';
        if (!diagnostics.ddgErrorKinds.includes(kind)) diagnostics.ddgErrorKinds.push(kind.slice(0, 40)); }
    }
    // Discover verified publishers in YouTube search, then scan official uploads.
    for (const query of [...new Set(queries.map(q => q.replace('site:youtube.com/watch ', '')))]) {
      if (c.signal.aborted) break;
      diagnostics.youtubeSearchRequests++;
      try {
        const searchPage = await html('https://www.youtube.com/results?search_query=' + encodeURIComponent(query), c.signal, fetcher);
        const data = pageJson(searchPage, 'ytInitialData');
        const videos = new Map<string, string>();
        const visit = (value: any): void => {
          if (!value || typeof value !== 'object') return;
          const entry = value.videoRenderer;
          if (/^[\w-]{11}$/.test(entry?.videoId || '')) videos.set(entry.videoId, text(entry.title));
          for (const child of Object.values(value)) {
            if (Array.isArray(child)) child.forEach(visit);
            else if (child && typeof child === 'object') visit(child);
          }
        };
        visit(data.contents);
        const searchEntries = new Map(youtubeSearchEntries(data).map(v => [v.id, v]));
        diagnostics.youtubeVideoEntries += videos.size;
        const matched = [...videos].filter(([, title]) => matchesTeams(title, match));
        diagnostics.youtubeMatchedTitles += matched.length;
        for (const [id] of matched.slice(0, 10)) {
          try { const video = await check(id); diagnostics.result = 'youtube_verified'; return { status: 'found', video }; }
          catch (err) {
            diagnostics.youtubeWatchRejected++;
            const reason = err instanceof Error ? err.message : 'UNKNOWN';
            const safeReason = /^(VIDEO_IDENTITY|VIDEO_ID_MISSING|VIDEO_ID_MISMATCH|VIDEO_PUBLISHER_UNVERIFIED|VIDEO_CHANNEL_MISMATCH|VIDEO_TITLE_MISMATCH|VIDEO_DATE|VIDEO_UNAVAILABLE|MISSING_METADATA|INVALID_METADATA|UPSTREAM_\d{3})$/.test(reason) ? reason : 'OTHER';
            diagnostics.youtubeRejectReasons[safeReason] = (diagnostics.youtubeRejectReasons[safeReason] || 0) + 1;
            if (reason.startsWith('UPSTREAM_')) diagnostics.youtubeWatchStatusErrors++;
            // YouTube search exposes the publisher's channel ID, upload age and
            // video ID. Only known official accounts can pass when watch metadata
            // is incomplete; a matching title alone is not sufficient.
            if (reason !== 'VIDEO_ID_MISSING') continue;
            const entry = searchEntries.get(id);
            if (!entry || !/^UC[\w-]{22}$/.test(entry.channelId)
              || !entry.channelName.trim() || !matchesTeams(entry.title, match)) {
              diagnostics.searchMissingIdentity++; continue;
            }
            diagnostics.searchPublisherCandidates++;
            if (!searchDateMatches(entry.published, match.date)) {
              diagnostics.searchDateRejected++;
              if (diagnostics.searchPublicationExamples.length < 5) diagnostics.searchPublicationExamples.push(entry.published.slice(0, 70));
              if (searchPublicationReason(entry.published, match.date) === 'missing') diagnostics.searchDateMissing++;
              else diagnostics.searchDateOutsideWindow++;
              continue;
            }
            diagnostics.searchPublisherValidated++;
            const searchVideo: HighlightVideo = {
              id: entry.id, url: 'https://www.youtube.com/watch?v=' + entry.id,
              title: entry.title, channel: entry.channelName,
              publishedAt: '', embeddable: false,
            };
            const official = verifiedPublisher(entry.handle, entry.channelId, entry.channelName);
            if (official) {
              diagnostics.result = 'youtube_verified_publisher_search';
              return { status: 'found', video: searchVideo };
            }
            diagnostics.searchPublisherRejected++;
          }
        }
      } catch { failed = true; diagnostics.youtubeSearchErrors++; }
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
        if (result.status === 'rejected') { failed = true; diagnostics.channelFailures++;
          const reason = result.reason instanceof Error ? result.reason.message : 'UNKNOWN';
          const safeReason = /^(CHANNEL_IDENTITY|MISSING_METADATA|INVALID_METADATA|UPSTREAM_\d{3})$/.test(reason) ? reason : 'OTHER';
          diagnostics.channelRejectReasons[safeReason] = (diagnostics.channelRejectReasons[safeReason] || 0) + 1;
          continue; }
        for (const item of result.value.videos.filter(v => matchesTeams(v.title, match)).slice(0, 3)) {
          try { return { status: 'found', video: await check(item.id, result.value.channelId) }; } catch { failed = true; }
        }
      }
    }
    diagnostics.result = failed || c.signal.aborted ? 'unavailable' : 'not_found';
    return { status: failed || c.signal.aborted ? 'unavailable' : 'not_found' };
  } finally { logDiagnostic(); clearTimeout(timer); signal?.removeEventListener('abort', abort); }
}
