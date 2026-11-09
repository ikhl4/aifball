import { NextRequest, NextResponse } from 'next/server';
import { activeNewsSources, xNewsSearchQuery, type NewsCategory } from '../../../lib/football-news-sources';

export const dynamic = 'force-dynamic';

type XPost = { id: string; text: string; author_id?: string; created_at?: string; attachments?: { media_keys?: string[] } };
type XUser = { id: string; username: string; name?: string };
type XMedia = { media_key: string; type: string; url?: string; preview_image_url?: string };
type XResponse = { data?: XPost[]; includes?: { users?: XUser[]; media?: XMedia[] }; errors?: unknown[]; detail?: string };

export async function GET(req: NextRequest) {
  const categoryParam = req.nextUrl.searchParams.get('category');
  if (categoryParam && categoryParam !== 'general' && categoryParam !== 'transfers') {
    return NextResponse.json({ error: 'invalid_category' }, { status: 400 });
  }
  const category = (categoryParam || undefined) as NewsCategory | undefined;
  const sources = activeNewsSources(category);
  const mode = req.nextUrl.searchParams.get('provider') || 'duckduckgo';
  if (mode !== 'duckduckgo' && mode !== 'x') return NextResponse.json({ error: 'invalid_provider' }, { status: 400 });
  if (mode === 'duckduckgo') {
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
    const posts = (payload.data || []).flatMap(post => {
      const user = users.get(post.author_id || '');
      if (!user || !allowed.has(user.username.toLowerCase()) || !post.created_at) return [];
      const images = (post.attachments?.media_keys || []).map(key => media.get(key)).filter((item): item is XMedia => Boolean(item)).map(item => item.url || item.preview_image_url).filter((value): value is string => Boolean(value));
      return [{ id: post.id, text: post.text, author: user.username, authorName: user.name || user.username, publishedAt: post.created_at, url: 'https://x.com/' + user.username + '/status/' + post.id, images, classification: 'unverified_report' as const }];
    }).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
    return NextResponse.json({ status: 'ok', source: 'X', posts, accounts: sources.map(source => source.handle), note: 'Account posts are not necessarily official confirmations.' }, { headers: { 'Cache-Control': 'private, max-age=0, s-maxage=120' } });
  } catch {
    return NextResponse.json({ status: 'upstream_unavailable', posts: [], message: 'X API could not be reached.' }, { status: 502, headers: { 'Cache-Control': 'no-store' } });
  }
}
