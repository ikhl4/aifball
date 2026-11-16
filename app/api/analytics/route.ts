import { NextResponse } from 'next/server';
import { ANALYTICS_LEAGUES, FEATURED_ANALYTICS_LEAGUES, isFeaturedAnalyticsEvent, aggregateAnalytics, normalizeAnalyticsEvent } from '../../../lib/analytics-core';

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
  const league = params.get('league') || 'all';
  const days = Number(params.get('days') || '1');
  const date = params.get('date');
  const liveOnly = params.get('live') === '1';
  const picked = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? new Date(date+'T00:00:00Z') : null;
  if (date && (!picked || !Number.isFinite(picked.getTime()) || picked.toISOString().slice(0,10)!==date)) {
    return NextResponse.json({ error:'تاريخ المباراة غير صالح.' }, { status:400 });
  }
  if (!(league === 'all' || ANALYTICS_LEAGUES.some(x => x.id === league)) || ![1, 7, 14, 30, 90].includes(days)) {
    return NextResponse.json({ error: 'الدوري أو الفترة غير مدعومين.' }, { status: 400 });
  }
  const chosenDay = date?.replace(/-/g,'');
  const dates = liveOnly ? windowDates(1) : chosenDay ? { from:chosenDay, to:chosenDay } : windowDates(days);
  const singleDay = dates.from === dates.to;
  const selected = ANALYTICS_LEAGUES.filter(x => league === 'all' ? FEATURED_ANALYTICS_LEAGUES.has(x.id) : x.id === league);
  const first = new Date(Date.UTC(Number(dates.from.slice(0, 4)), Number(dates.from.slice(4, 6)) - 1, 1));
  const last = new Date(Date.UTC(Number(dates.to.slice(0, 4)), Number(dates.to.slice(4, 6)) - 1, 1));
  const months: string[] = [];
  for (let month = first; month <= last; month = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 1))) {
    months.push(String(month.getUTCFullYear()) + String(month.getUTCMonth() + 1).padStart(2, '0'));
  }
  const currentDay = new Date(Date.UTC(Number(dates.to.slice(0,4)), Number(dates.to.slice(4,6))-1, Number(dates.to.slice(6,8))));
  const previousDay = new Date(currentDay.getTime()-86_400_000).toISOString().slice(0,10).replace(/-/g,'');
  const responses = await Promise.allSettled(selected.map(async ({ id, label }) => {
    const root = `https://site.api.espn.com/apis/site/v2/sports/soccer/${id}/scoreboard`;
    const fetchScoreboard = async (interval: string) => {
      const response = await fetch(root + '?dates=' + interval + '&limit=500', {
        ...(singleDay ? { next:{ revalidate:25 } } : { cache:'no-store' as const }),
        signal: AbortSignal.timeout(12000),
        headers: { 'User-Agent': 'Mozilla/5.0' },
      });
      if (!response.ok) throw new Error('ESPN HTTP ' + response.status);
      const data = await response.json();
      if (!Array.isArray(data?.events)) throw new Error('Invalid scoreboard');
      return data.events as any[];
    };
    // Early Riyadh fixtures can start on the preceding UTC date.
    const intervals = singleDay ? [dates.to, previousDay] : months;
    const boardResponses = await Promise.allSettled(intervals.map(fetchScoreboard));
    const succeeded = boardResponses.filter((item): item is PromiseFulfilledResult<any[]> => item.status === 'fulfilled');
    if (!succeeded.length) throw new Error('All ESPN requests failed');
    const events = succeeded.flatMap(item => item.value);
    const selectedEvents = league === 'all' ? events.filter(event => isFeaturedAnalyticsEvent(event,id)) : events;
    const normalized = selectedEvents.map((event: any) => normalizeAnalyticsEvent(event, id, label)).filter((event): event is NonNullable<typeof event> => event !== null);
    const from = dates.from, to = dates.to;
    const matches = normalized.filter(m => {
      const day = riyadhDay(new Date(m.date));
      const liveNow = m.state === 'in' && (day === to || day === previousDay);
      if (liveOnly) return liveNow;
      return (day >= from && day <= to) || (!chosenDay && singleDay && liveNow);
    });
    return { matches, partial: succeeded.length !== boardResponses.length };
  }));
  const failed = selected.filter((_, index) => responses[index].status === 'rejected' || (responses[index].status === 'fulfilled' && responses[index].value.partial)).map(x => x.label);
  const matches = responses.flatMap(result => result.status === 'fulfilled' ? result.value.matches : []);
  if (responses.every(result => result.status === 'rejected')) return NextResponse.json({ error: 'تعذّر الحصول على بيانات مؤكدة من المصدر.' }, { status: 502 });
  const seen = new Set<string>();
  const unique = matches.filter(m => {
    if (seen.has(m.id)) return false;
    seen.add(m.id);
    return true;
  })
    .sort((a,b) => singleDay
      ? Number(b.state === 'in') - Number(a.state === 'in') || Date.parse(a.date) - Date.parse(b.date)
      : Date.parse(b.date) - Date.parse(a.date));
  return NextResponse.json({
    source: 'ESPN', fetchedAt: new Date().toISOString(), period: { days:singleDay ? 1 : days, ...dates }, league,
    partial: failed.length > 0, failed, ...aggregateAnalytics(unique), matches: singleDay ? unique : unique.slice(0, 600),
  }, { headers: { 'Cache-Control': 'no-store' } });
}
