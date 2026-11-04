import { NextResponse } from 'next/server';
import { ANALYTICS_LEAGUES, aggregateAnalytics, normalizeAnalyticsEvent } from '../../../lib/analytics-core';

export const dynamic = 'force-dynamic';
const riyadhDay = (date: Date) => {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Riyadh', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  const part = (kind: string) => parts.find(item => item.type === kind)?.value || '';
  return part('year') + part('month') + part('day');
};
const windowDates = (days: number) => {
  const today = new Date(); const start = new Date(today.getTime() - (days - 1) * 86400000);
  return { from: riyadhDay(start), to: riyadhDay(today) };
};
export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const league = params.get('league') || 'ksa.1';
  const days = Number(params.get('days') || '30');
  if (!(league === 'all' || ANALYTICS_LEAGUES.some(x => x.id === league)) || ![7, 14, 30, 90].includes(days)) {
    return NextResponse.json({ error: 'الدوري أو الفترة غير مدعومين.' }, { status: 400 });
  }
  const dates = windowDates(days);
  const selected = league === 'all' ? ANALYTICS_LEAGUES : ANALYTICS_LEAGUES.filter(x => x.id === league);
  const responses = await Promise.allSettled(selected.map(async ({ id, label }) => {
    const root = `https://site.api.espn.com/apis/site/v2/sports/soccer/${id}/scoreboard`;
    const fetchMonth = async (yearMonth: string) => {
      const response = await fetch(root + '?dates=' + yearMonth + '&limit=500', {
        cache: 'no-store',
        signal: AbortSignal.timeout(12000),
        headers: { 'User-Agent': 'Mozilla/5.0' },
      });
      if (!response.ok) throw new Error('ESPN HTTP ' + response.status);
      const data = await response.json();
      if (!Array.isArray(data?.events)) throw new Error('Invalid scoreboard');
      return data.events as any[];
    };
    // ESPN may reject YYYYMMDD-YYYYMMDD ranges. Query individual calendar months,
    // then filter events to the exact Riyadh-day interval requested.
    const months: string[] = [];
    const first = new Date(Date.UTC(Number(dates.from.slice(0, 4)), Number(dates.from.slice(4, 6)) - 1, 1));
    const last = new Date(Date.UTC(Number(dates.to.slice(0, 4)), Number(dates.to.slice(4, 6)) - 1, 1));
    for (let month = first; month <= last; month = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 1))) {
      months.push(String(month.getUTCFullYear()) + String(month.getUTCMonth() + 1).padStart(2, '0'));
    }
    const monthResponses = await Promise.allSettled(months.map(fetchMonth));
    const succeeded = monthResponses.filter((item): item is PromiseFulfilledResult<any[]> => item.status === 'fulfilled');
    if (!succeeded.length) throw new Error('All monthly ESPN requests failed');
    const events = succeeded.flatMap(item => item.value);
    const normalized = events.map((event: any) => normalizeAnalyticsEvent(event, id, label)).filter((event): event is NonNullable<typeof event> => event !== null);
    const from = dates.from, to = dates.to;
    return normalized.filter(m => {
      const day = riyadhDay(new Date(m.date));
      return day >= from && day <= to;
    });
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
