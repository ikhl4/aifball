import { NextResponse } from 'next/server';
import { parsePosterEvent, POSTER_LEAGUES, posterIntent, requestedPosterState, selectPosterMatch } from '../../../lib/match-card-data';
export const dynamic = 'force-dynamic';
export async function GET(req: Request) {
  const query = new URL(req.url).searchParams.get('query')?.trim() || '';
  if (query.length < 6 || query.length > 300 || !posterIntent(query)) return NextResponse.json({ error: 'طلب تصميم مباراة غير صالح.' }, { status: 400 });
  const now = new Date();
  const shift = requestedPosterState(query) === 'finished' ? -35 : -7;
  const start = new Date(now.getTime() + shift * 86400000);
  const end = new Date(now.getTime() + (requestedPosterState(query) === 'finished' ? 1 : 35) * 86400000);
  const dates = [start, end].map(date => date.toISOString().slice(0,10).replace(/-/g, '')).join('-');
  const results = await Promise.allSettled(POSTER_LEAGUES.map(async ([code, label]) => {
    const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${code}/scoreboard?dates=${dates}&limit=300`;
    const response = await fetch(url, { signal: AbortSignal.timeout(11000), cache: 'no-store' });
    if (!response.ok) throw new Error('source unavailable');
    const body = await response.json();
    if (!Array.isArray(body?.events)) throw new Error('invalid payload');
    return body.events.map((event: unknown) => parsePosterEvent(event, code, label)).filter(Boolean);
  }));
  const matches = results.flatMap(result => result.status === 'fulfilled' ? result.value : []);
  const match = selectPosterMatch(query, matches);
  if (!match) return NextResponse.json({ error: 'لم أجد مباراة مؤكدة تطابق الطلب ضمن البطولات والفترة المتاحة. حدّد الفريقين أو البطولة والتاريخ.' }, { status: 404 });
  return NextResponse.json({ match, provider: 'ESPN', fetchedAt: new Date().toISOString() }, { headers: { 'Cache-Control': 'no-store' } });
}
