import { NextResponse } from 'next/server';
import { ANALYTICS_LEAGUES, aggregateAnalytics, normalizeAnalyticsEvent } from '../../../lib/analytics-core';

export const dynamic = 'force-dynamic';
const riyadhDay = (date: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Riyadh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date).replace(/-/g, '');
const windowDates = (days: number) => {
  const today = new Date(); const start = new Date(today.getTime() - (days - 1) * 86400000);
  return { from: riyadhDay(start), to: riyadhDay(today) };
};
export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const league = params.get('league') || 'ksa.1';
  const days = Number(params.get('days') || '7');
  if (!(league === 'all' || ANALYTICS_LEAGUES.some(x => x.id === league)) || ![7, 14, 30].includes(days)) {
    return NextResponse.json({ error: 'الدوري أو الفترة غير مدعومين.' }, { status: 400 });
  }
  const dates = windowDates(days);
  const selected = league === 'all' ? ANALYTICS_LEAGUES : ANALYTICS_LEAGUES.filter(x => x.id === league);
  const responses = await Promise.allSettled(selected.map(async ({ id, label }) => {
    const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${id}/scoreboard?dates=${dates.from}-${dates.to}&limit=500`;
    const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(12000), headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!response.ok) throw new Error('ESPN HTTP ' + response.status);
    const data = await response.json();
    if (!Array.isArray(data?.events)) throw new Error('Invalid scoreboard');
    return data.events.map((event: any) => normalizeAnalyticsEvent(event, id, label)).filter(Boolean);
  }));
  const failed = selected.filter((_, index) => responses[index].status === 'rejected').map(x => x.label);
  const matches = responses.flatMap(result => result.status === 'fulfilled' ? result.value : []);
  if (failed.length === selected.length) return NextResponse.json({ error: 'تعذّر الحصول على بيانات مؤكدة من المصدر.' }, { status: 502 });
  const unique = [...new Map(matches.map(m => [m.league + ':' + m.id, m])).values()].sort((a,b) => Date.parse(b.date) - Date.parse(a.date));
  return NextResponse.json({
    source: 'ESPN', fetchedAt: new Date().toISOString(), period: { days, ...dates }, league,
    partial: failed.length > 0, failed, ...aggregateAnalytics(unique), matches: unique.slice(0, 600),
  }, { headers: { 'Cache-Control': 'no-store' } });
}
