import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const league = searchParams.get('league') || 'ksa.1';
  const dateQuery = searchParams.get('date') || 'today';

  if ((league.length > 100 || !/^[a-z]+(?:\.[a-z0-9]+)+$/i.test(league)) || !['today', 'yesterday', 'tomorrow'].includes(dateQuery)) {
    return NextResponse.json({ error: 'الدوري أو التاريخ غير صالح' }, { status: 400 });
  }

  // Resolve the calendar day in Riyadh, independently of the server timezone.
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Riyadh', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  const part = (type: string) => Number(parts.find(value => value.type === type)?.value);
  const targetDate = new Date(Date.UTC(part('year'), part('month') - 1, part('day')));
  targetDate.setUTCDate(targetDate.getUTCDate() + (dateQuery === 'yesterday' ? -1 : dateQuery === 'tomorrow' ? 1 : 0));
  const dateParam = targetDate.toISOString().slice(0, 10).replace(/-/g, '');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/scoreboard?dates=${dateParam}`, {
      cache: 'no-store',
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    if (!res.ok) throw new Error(`ESPN status: ${res.status}`);
    const data = await res.json();
    if (!data || !Array.isArray(data.events)) throw new Error('Invalid ESPN events payload');
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('ESPN Fetch Error:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ error: 'فشل جلب البيانات من ESPN' }, { status: 502 });
  } finally {
    clearTimeout(timeout);
  }
}
