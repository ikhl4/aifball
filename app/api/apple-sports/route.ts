import { NextResponse } from 'next/server';
import { appleEventId, appleMatch, appleSchedule, appleStandings } from '../../../lib/apple-sports';
import { appleCompetitions, type AppleSport } from '../../../lib/apple-sports-types';

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const sport = params.get('sport') ?? 'football';
  const date = params.get('date') ?? '0';
  const event = params.get('event');
  const standings = params.get('standings');
  const english = params.get('lang') === 'en';
  if (!Object.hasOwn(appleCompetitions, sport) || !['-1', '0', '1'].includes(date) ||
      (event !== null && !appleEventId.test(event)) || (event !== null && standings !== null) ||
      (standings !== null && !(appleCompetitions.football as readonly string[]).includes(standings))) {
    return NextResponse.json({ error: 'طلب غير صالح' }, { status: 400 });
  }

  try {
    const result = event !== null ? await appleMatch(event, english) : standings !== null
      ? { standings: await appleStandings(standings) }
      : await appleSchedule(sport as AppleSport, Number(date), english);
    if (!result) return NextResponse.json({ error: 'المباراة غير متاحة' }, { status: 404 });
    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'public, max-age=0, s-maxage=20, stale-while-revalidate=30' },
    });
  } catch {
    return NextResponse.json({ error: 'تعذّر جلب البيانات الرياضية' }, { status: 502 });
  }
}
