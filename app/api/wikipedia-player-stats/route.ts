import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const knownTitles: Record<string, string> = {
  'cristiano ronaldo': 'Cristiano_Ronaldo',
  'كريستيانو رونالدو': 'Cristiano_Ronaldo',
  'lionel messi': 'Lionel_Messi',
  'ليونيل ميسي': 'Lionel_Messi',
  'messi': 'Lionel_Messi',
  'ronaldo': 'Cristiano_Ronaldo',
};

function clean(input: string): string {
  return input.replace(/<sup\b[^>]*>[\s\S]*?<\/sup>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&ndash;|&mdash;/gi, '-')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ').trim();
}
function number(input: string): number | null {
  const value = clean(input).replace(/,/g, '').replace(/\[[^\]]*\]/g, '');
  return /^\d{1,5}$/.test(value) ? Number(value) : null;
}
function cells(row: string): string[] {
  return [...row.matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(m => clean(m[1]));
}
function extract(html: string, season: string) {
  const tables = [...html.matchAll(/<table\b[^>]*>[\s\S]*?<\/table>/gi)].map(m => m[0]);
  const start = season.slice(0, 4);
  const end = String(Number(start) + 1);
  const matches: Array<{ matches: number; goals: number; source: string }> = [];
  for (const table of tables) {
    const text = clean(table).toLowerCase();
    if (!text.includes('season') || !text.includes('total') ||
        (!text.includes('league') && !text.includes('appearances'))) continue;
    const rows = [...table.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map(m => cells(m[1]));
    const seasonRows = rows.filter(row => row.some(c => c === season || c === start + '-' + end.slice(-2) || c === start + '–' + end.slice(-2)));
    for (const row of seasonRows) {
      // Only accept a clearly labelled Total pair in a simple table.
      const totalIndex = row.findIndex(c => /^total$/i.test(c));
      if (totalIndex >= 0 && totalIndex + 2 < row.length) {
        const played = number(row[totalIndex + 1]);
        const goals = number(row[totalIndex + 2]);
        if (played !== null && goals !== null && goals <= played * 5) {
          matches.push({ matches: played, goals, source: 'explicit_total' });
        }
      }
    }
  }
  return matches.length === 1 ? matches[0] : null;
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const playerName = (params.get('playerName') || '').trim();
  const season = (params.get('season') || '').trim();
  if (!playerName || playerName.length > 100 || !/^\d{4}-\d{4}$/.test(season)) {
    return NextResponse.json({ found: false, reason: 'invalid_input' }, { status: 400 });
  }
  const title = knownTitles[playerName.toLocaleLowerCase()];
  if (!title) return NextResponse.json({ found: false, reason: 'unresolved_identity' });
  const url = 'https://en.wikipedia.org/w/rest.php/v1/page/' + encodeURIComponent(title) + '/html';
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 9000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'AiFBall/1.0 (football research; contact via aifball.com)', Accept: 'text/html' },
      next: { revalidate: 3600 },
    });
    if (!response.ok) return NextResponse.json({ found: false, reason: 'wikipedia_unavailable' });
    const html = await response.text();
    if (html.length > 3000000) return NextResponse.json({ found: false, reason: 'page_too_large' });
    const stats = extract(html, season);
    if (!stats) return NextResponse.json({ found: false, reason: 'no_unambiguous_total_row', source: 'wikipedia' });
    return NextResponse.json({ found: true, provider: 'wikipedia', scope: 'all_competitions',
      season, playerName, stats: { matches: stats.matches, goals: stats.goals, assists: null },
      source: 'https://en.wikipedia.org/wiki/' + title,
    }, { headers: { 'Cache-Control': 'public, max-age=3600' } });
  } catch {
    return NextResponse.json({ found: false, reason: 'wikipedia_request_failed' });
  } finally {
    clearTimeout(timer);
  }
}
