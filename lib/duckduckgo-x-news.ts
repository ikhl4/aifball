import type { NewsSource } from './football-news-sources';

type DiscoveredPost = {
  id: string;
  author: string;
  text: string;
  url: string;
  publishedAt: null;
  images: string[];
  classification: 'unverified_search_result';
};

function decodeHtml(raw: string): string {
  return raw.replace(/<[^>]*>/g, ' ').replace(/&(?:amp|quot|apos|lt|gt|nbsp);|&#(?:x[0-9a-f]+|\d+);/gi, entity => {
    const named: Record<string, string> = { '&amp;': '&', '&quot;': '"', '&apos;': "'", '&lt;': '<', '&gt;': '>', '&nbsp;': ' ' };
    if (named[entity.toLowerCase()]) return named[entity.toLowerCase()];
    const hex = /^&#x/i.test(entity);
    const code = Number.parseInt(entity.slice(hex ? 3 : 2, -1), hex ? 16 : 10);
    return Number.isFinite(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : '';
  }).replace(/\s+/g, ' ').trim();
}

function parseResults(html: string, allowed: Set<string>): DiscoveredPost[] {
  const found = new Map<string, DiscoveredPost>();
  const anchors = [...html.matchAll(/<a\b[^>]*class=["'][^"']*\b(?:result__a|result-link)\b[^"']*["'][^>]*>[\s\S]*?<\/a>/gi)];
  for (const anchor of anchors.slice(0, 70)) {
    const raw = anchor[0].match(/\bhref=["']([^"']+)["']/i)?.[1];
    if (!raw) continue;
    let url = decodeHtml(raw);
    try {
      const redirect = new URL(url, 'https://duckduckgo.com');
      if (redirect.hostname === 'duckduckgo.com' || redirect.hostname.endsWith('.duckduckgo.com')) {
        url = redirect.searchParams.get('uddg') || '';
      }
      const target = new URL(url);
      if (!['x.com', 'www.x.com', 'twitter.com', 'www.twitter.com'].includes(target.hostname.toLowerCase())) continue;
      const match = target.pathname.match(/^\/([A-Za-z0-9_]{1,15})\/status\/(\d+)/i);
      if (!match || !allowed.has(match[1].toLowerCase())) continue;
      const canonical = 'https://x.com/' + match[1] + '/status/' + match[2];
      const title = decodeHtml(anchor[0]);
      if (!title) continue;
      found.set(match[2], { id: match[2], author: match[1], text: title, url: canonical, publishedAt: null, images: [], classification: 'unverified_search_result' });
    } catch { continue; }
  }
  return [...found.values()];
}

export async function searchXNewsWithDuckDuckGo(sources: NewsSource[]) {
  const allowed = new Set(sources.map(source => source.handle.toLowerCase()));
  const results = await Promise.allSettled(sources.map(async source => {
    const query = 'site:x.com/' + source.handle + '/status/ football OR transfer';
    const url = 'https://html.duckduckgo.com/html/?q=' + encodeURIComponent(query);
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AiFBallNews/1.0)', Accept: 'text/html' },
      signal: AbortSignal.timeout(8000), cache: 'no-store',
    });
    if (!response.ok) throw new Error('DDG_HTTP_' + response.status);
    const html = await response.text();
    if (html.length > 2_000_000) throw new Error('DDG_RESPONSE_TOO_LARGE');
    return parseResults(html, allowed).filter(post => post.author.toLowerCase() === source.handle.toLowerCase());
  }));
  const posts = [...new Map(results.flatMap(result => result.status === 'fulfilled' ? result.value : []).map(post => [post.id, post])).values()];
  const failed = results.filter(result => result.status === 'rejected').length;
  return {
    status: failed === sources.length ? 'upstream_unavailable' : failed ? 'partial' : 'ok',
    provider: 'duckduckgo',
    posts,
    accounts: sources.map(source => source.handle),
    failedSearches: failed,
    note: 'Search results are not verified X posts. Publication time and images are unknown; do not present as latest or confirmed without independent verification. No automatic sorting by recency.',
  };
}
