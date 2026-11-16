import { NextResponse } from 'next/server';
import { matchFilterState } from '../../../lib/live-match-filters';
import { footballLeagues, type FootballEvent } from '../../../lib/football-scoreboard';

export const maxDuration = 20;

const headers = { 'Cache-Control': 'public, max-age=0, s-maxage=25, stale-while-revalidate=25' };

async function scoreboard(league: string, date: string) {
  const response = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/scoreboard?dates=${date}&limit=300`, {
    next: { revalidate: 25 }, signal: AbortSignal.timeout(8500),
  });
  if (!response.ok) throw new Error(`ESPN status ${response.status}`);
  const data = await response.json();
  if (!Array.isArray(data?.events)) throw new Error('Invalid scoreboard');
  return data;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const league = searchParams.get('league') || 'ksa.1';
  const dateQuery = searchParams.get('date') || 'today';
  const combined = league === 'all' && searchParams.get('grouped') === '1';
  if (league.length > 100 || !/^(?:all|[a-z]+(?:\.[a-z0-9_]+)+)$/i.test(league) ||
      !['now', 'today', 'yesterday', 'tomorrow'].includes(dateQuery)) {
    return NextResponse.json({ error: 'الدوري أو التاريخ غير صالح' }, { status: 400 });
  }

  const riyadh = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Riyadh', year: 'numeric', month: '2-digit', day: '2-digit' });
  const today = new Date(riyadh.format(new Date()) + 'T00:00:00Z');
  today.setUTCDate(today.getUTCDate() + (dateQuery === 'yesterday' ? -1 : dateQuery === 'tomorrow' ? 1 : 0));
  const day = today.toISOString().slice(0, 10);
  const date = day.replace(/-/g, '');
  const liveOnly = dateQuery === 'now';
  const current = liveOnly || dateQuery === 'today';
  const previousDate = new Date(today.getTime() - 86_400_000).toISOString().slice(0, 10);
  const previous = previousDate.replace(/-/g, '');
  const include = (event: FootballEvent) => {
    const start = new Date(event.date);
    if (!event.id || !Number.isFinite(start.getTime())) return false;
    const kickoff = riyadh.format(start);
    const live = current && (kickoff === day || kickoff === previousDate) && matchFilterState(event) === 'live';
    return liveOnly ? live : kickoff === day || live;
  };
  if (combined) {
    // Include previous-day kickoffs still in progress after midnight in Riyadh.
    const codes = footballLeagues.map(([id]) => id);
    const results = await Promise.allSettled(codes.map(async code => {
      if (!current && code !== 'all') return { events: (await scoreboard(code, date)).events as FootballEvent[], partial: false };
      const days = await Promise.allSettled([scoreboard(code, date), scoreboard(code, previous)]);
      if (days.every(result => result.status === 'rejected')) throw new Error('Scoreboard unavailable');
      return {
        events: days.flatMap(result => result.status === 'fulfilled' ? result.value.events as FootballEvent[] : []),
        partial: days.some(result => result.status === 'rejected'),
      };
    }));
    if (results.every(result => result.status === 'rejected')) return NextResponse.json({ error: 'تعذّر جلب النتائج' }, { status: 502 });
    const seen = new Set<string>();
    const matches: Record<string, FootballEvent[]> = {};
    results.forEach((result, index) => {
      if (result.status !== 'fulfilled') return;
      matches[codes[index]] = result.value.events.filter(event => {
        if (!include(event) || seen.has(event.id)) return false;
        seen.add(event.id);
        return true;
      });
    });
    return NextResponse.json({ matches, failed: results.filter(result => result.status === 'rejected' || result.value.partial).length }, { headers });
  }

  try {
    if (!liveOnly) return NextResponse.json(await scoreboard(league, date), { headers });
    const days = await Promise.allSettled([scoreboard(league, date), scoreboard(league, previous)]);
    const boards = days.flatMap(result => result.status === 'fulfilled' ? [result.value] : []);
    if (!boards.length) throw new Error('Scoreboard unavailable');
    const events = new Map<string, FootballEvent>();
    for (const board of boards) {
      for (const event of board.events as FootballEvent[]) {
        if (!events.has(event.id)) events.set(event.id, event);
      }
    }
    return NextResponse.json({ ...boards[0], events: [...events.values()].filter(include) }, { headers });
  } catch {
    return NextResponse.json({ error: 'تعذّر جلب النتائج' }, { status: 502 });
  }
}
