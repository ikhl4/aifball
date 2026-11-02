import { NextResponse } from 'next/server';
import { COMPETITIONS } from '../../../lib/competitions';
import { normalizeMatchDetails } from '../../../lib/match-details';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const league = params.get('league') || '';
  const eventId = params.get('event') || '';
  if (!(Object.prototype.hasOwnProperty.call(COMPETITIONS, league) || league === 'fifa.friendly') || !/^\d{1,12}$/.test(eventId)) return NextResponse.json({ error: 'معرّف المباراة أو البطولة غير صالح.' }, { status: 400 });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/summary?event=${eventId}`, { signal: controller.signal, cache: 'no-store' });
    if (!response.ok) return NextResponse.json({ error: 'تفاصيل المباراة غير متاحة من المصدر حالياً.' }, { status: 502 });
    return NextResponse.json(normalizeMatchDetails(await response.json(), eventId, league), { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'تعذّر التحقق من تفاصيل هذه المباراة. أعد المحاولة.' }, { status: 502 });
  } finally { clearTimeout(timeout); }
}
