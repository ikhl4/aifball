import { NextRequest, NextResponse } from 'next/server';
import { activeNewsSources, xNewsSearchQuery, type NewsCategory } from '../../../lib/football-news-sources';

export const dynamic = 'force-dynamic';

type XPost = { id: string; text: string; author_id?: string; created_at?: string; attachments?: { media_keys?: string[] } };
type XUser = { id: string; username: string; name?: string };
type XMedia = { media_key: string; type: string; url?: string; preview_image_url?: string };
type XResponse = { data?: XPost[]; includes?: { users?: XUser[]; media?: XMedia[] }; errors?: unknown[]; detail?: string };

export async function GET(req: NextRequest) {
  const categoryParam = req.nextUrl.searchParams.get('category');
  if (categoryParam && categoryParam !== 'general' && categoryParam !== 'transfers' && categoryParam !== 'world') {
    return NextResponse.json({ error: 'invalid_category' }, { status: 400 });
  }
  const category = (categoryParam || undefined) as NewsCategory | undefined;
  const sources = activeNewsSources(category === 'world' ? undefined : category);
  if (categoryParam === 'world') {
    const topics = [
      'football soccer latest news',
      'Saudi Pro League football news',
      'Premier League La Liga Serie A Bundesliga Ligue 1 football',
      'UEFA Champions League AFC Champions League football'
    ];
    const decode = (value: string) => value.replace(/<!\\[CDATA\\[|\\]\\]>/g, '').replace(/<[^>]*>/g, ' ').replace(/&(?:amp|lt|gt|quot|apos|#39);/g, m => ({'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&apos;':"'",'&#39;':"'"}[m] || m)).replace(/\\s+/g,' ').trim();
    const feeds = await Promise.allSettled(topics.map(async topic => {
      const url = 'https://news.google.com/rss/search?q=' + encodeURIComponent(topic + ' when:1d') + '&hl=en-US&gl=US&ceid=US:en';
      const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(8500), headers: { Accept: 'application/rss+xml,application/xml' } });
      if (!response.ok) throw new Error('RSS ' + response.status);
      const xml = await response.text();
      if (xml.length > 1500000) throw new Error('RSS too large');
      return [...xml.matchAll(/<item>([\\s\\S]*?)<\\/item>/gi)].slice(0, 25).flatMap(match => {
        const item = match[1];
        const field = (name: string) => item.match(new RegExp('<' + name + '(?:\\\\s[^>]*)?>([\\\\s\\\\S]*?)<\\\\/' + name + '>', 'i'))?.[1] || '';
        const title = decode(field('title'));
        const publishedAt = new Date(decode(field('pubDate'))).toISOString();
        const link = decode(field('link'));
        const publisher = decode(field('source')) || 'Google News';
        if (!title || !/^https:\/\/news\.google\.com\//.test(link) || !Number.isFinite(Date.parse(publishedAt))) return [];
        if (Date.now() - Date.parse(publishedAt) > 24*3600000 || Date.parse(publishedAt) > Date.now()+300000) return [];
        return [{ id: link, text: title, author: publisher, url: link, publishedAt, images: [] as string[], classification: 'unverified_report' as const }];
      });
    }));
    const posts = [...new Map(feeds.flatMap(result => result.status === 'fulfilled' ? result.value : []).map(post => [post.text.toLowerCase().replace(/[^\\p{L}\\p{N}]/gu,''),post])).values()].sort((a,b)=>b.publishedAt.localeCompare(a.publishedAt)).slice(0, 60);
    const failed = feeds.filter(f => f.status === 'rejected').length;
    return NextResponse.json({ status: failed === topics.length ? 'upstream_unavailable' : failed ? 'partial' : 'ok', provider: 'google_news_rss', windowHours: 24, posts, failedSearches: failed, note: 'Headlines and publisher dates from Google News RSS. Publication date is not independent verification of claims; images are omitted when not supplied.' }, { headers: { 'Cache-Control': 'no-store' } });
  }
  const mode = req.nextUrl.searchParams.get('provider') || 'auto';
  if (mode !== 'duckduckgo' && mode !== 'x' && mode !== 'auto') return NextResponse.json({ error: 'invalid_provider' }, { status: 400 });
  if (mode === 'duckduckgo' || (mode === 'auto' && !process.env.X_BEARER_TOKEN?.trim())) {
    try {
      const { searchXNewsWithDuckDuckGo } = await import('../../../lib/duckduckgo-x-news');
      const result = await searchXNewsWithDuckDuckGo(sources);
      return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
    } catch {
      return NextResponse.json({ status: 'upstream_unavailable', provider: 'duckduckgo', posts: [], message: 'DuckDuckGo search is unavailable; no posts were verified.' }, { status: 502, headers: { 'Cache-Control': 'no-store' } });
    }
  }
  const token = process.env.X_BEARER_TOKEN?.trim();
  // No token means no fake data. The list of configured sources remains inspectable.
  if (!token) return NextResponse.json({
    status: 'not_configured', source: 'X', posts: [], accounts: sources.map(({ handle, label, categories }) => ({ handle, label, categories })),
    message: 'X API access is not configured. Set X_BEARER_TOKEN server-side to retrieve verified posts.',
  }, { headers: { 'Cache-Control': 'no-store' } });
  try {
    const url = new URL('https://api.x.com/2/tweets/search/recent');
    url.searchParams.set('query', xNewsSearchQuery(category));
    url.searchParams.set('max_results', '30');
    url.searchParams.set('tweet.fields', 'created_at,author_id,attachments');
    url.searchParams.set('expansions', 'author_id,attachments.media_keys');
    url.searchParams.set('user.fields', 'username,name');
    url.searchParams.set('media.fields', 'url,preview_image_url,type');
    const response = await fetch(url, { headers: { Authorization: 'Bearer ' + token, Accept: 'application/json' }, cache: 'no-store', signal: AbortSignal.timeout(10000) });
    if (!response.ok) return NextResponse.json({ status: 'upstream_error', posts: [], message: 'X API returned HTTP ' + response.status }, { status: 502, headers: { 'Cache-Control': 'no-store' } });
    const payload = await response.json() as XResponse;
    const users = new Map((payload.includes?.users || []).map(user => [user.id, user]));
    const media = new Map((payload.includes?.media || []).map(item => [item.media_key, item]));
    const allowed = new Set(sources.map(source => source.handle.toLowerCase()));
    const cutoff = Date.now() - 72 * 60 * 60 * 1000;
    const posts = (payload.data || []).flatMap(post => {
      const user = users.get(post.author_id || '');
      if (!user || !allowed.has(user.username.toLowerCase()) || !post.created_at || !Number.isFinite(Date.parse(post.created_at)) || Date.parse(post.created_at) < cutoff || Date.parse(post.created_at) > Date.now() + 5 * 60 * 1000) return [];
      const images = (post.attachments?.media_keys || []).map(key => media.get(key)).filter((item): item is XMedia => Boolean(item) && (item.type === 'photo' || item.type === 'video')).map(item => item.url || item.preview_image_url).filter((value): value is string => Boolean(value) && /^https:\/\//i.test(value));
      return [{ id: post.id, text: post.text, author: user.username, authorName: user.name || user.username, publishedAt: post.created_at, url: 'https://x.com/' + user.username + '/status/' + post.id, images, classification: 'unverified_report' as const }];
    }).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
    return NextResponse.json({ status: 'ok', provider: 'x', source: 'X', windowHours: 72, posts, accounts: sources.map(source => source.handle), note: 'Account posts are not necessarily official confirmations.' }, { headers: { 'Cache-Control': 'private, max-age=0, s-maxage=120' } });
  } catch {
    return NextResponse.json({ status: 'upstream_unavailable', posts: [], message: 'X API could not be reached.' }, { status: 502, headers: { 'Cache-Control': 'no-store' } });
  }
}
