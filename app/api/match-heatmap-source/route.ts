import { NextResponse } from 'next/server';
import { resolveHeatmapSource } from '../../../lib/match-heatmap-source';

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const home = params.get('home')?.trim() ?? '';
  const away = params.get('away')?.trim() ?? '';
  const date = params.get('date') ?? '';
  const kickoff = Date.parse(date);
  if (!home || !away || home.length > 120 || away.length > 120 || home === away ||
      date.length > 40 || !Number.isFinite(kickoff)) {
    return NextResponse.json({ error: 'هوية المباراة غير صالحة.' }, { status: 400 });
  }

  const isoDay = new Date(kickoff).toISOString().slice(0, 10);
  const providerDate = isoDay.split('-').reverse().join('/');
  const feed = new URL('https://webws.365scores.com/web/games/');
  feed.search = new URLSearchParams({
    appTypeId: '5', langId: '1', timezoneName: 'UTC', userCountryId: '1',
    sports: '1', startDate: providerDate, endDate: providerDate,
  }).toString();

  try {
    const result = await fetch(feed, { next: { revalidate: 90 }, signal: AbortSignal.timeout(8000) });
    if (!result.ok) throw new Error('Football calendar unavailable');
    const matchUrl = resolveHeatmapSource(await result.json(), { home, away, date });
    return NextResponse.json({ matchUrl }, { headers: { 'Cache-Control': 'private, max-age=60' } });
  } catch {
    return NextResponse.json({ error: 'تعذر الاتصال بمصدر الخرائط.' }, { status: 502 });
  }
}
