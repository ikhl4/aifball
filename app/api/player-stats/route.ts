import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

type Row = Record<string, unknown>;
const keys = {
  matches: ['matches', 'MP', 'Playing Time MP'],
  goals: ['goals', 'Gls', 'Performance Gls'],
  assists: ['assists', 'Ast', 'Performance Ast'],
} as const;

function normalize(row: Row): Row {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => {
    const match = key.match(/^\\('([^']*)', '([^']*)'\\)$/);
    return [match ? [match[1], match[2]].filter(Boolean).join(' ') : key, value];
  }));
}

function numeric(row: Row, aliases: readonly string[]): number | null {
  for (const key of aliases) {
    const raw = row[key];
    if (typeof raw !== 'number' && typeof raw !== 'string') continue;
    const value = String(raw).replace(/,/g, '').trim();
    if (!/^\\d+$/.test(value)) continue;
    const n = Number(value);
    if (Number.isSafeInteger(n) && n >= 0) return n;
  }
  return null;
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const playerName = (params.get('playerName') || '').trim();
  const season = (params.get('season') || '').trim();
  if (!playerName || playerName.length > 100 || !/^\\d{4}(?:-\\d{4})?$/.test(season)) {
    return NextResponse.json({ error: 'Invalid player or season' }, { status: 400 });
  }

  // First working adapter: existing internal FBref backend. This is LEAGUE-ONLY,
  // never an all-competitions total. More adapters can be added without changing UI.
  const origin = new URL(request.url).origin;
  const url = new URL('/api/advanced', origin);
  url.searchParams.set('source', 'fbref');
  url.searchParams.set('action', 'player-stats');
  url.searchParams.set('playerName', playerName);
  url.searchParams.set('season', season);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45000);
  try {
    const response = await fetch(url, { signal: controller.signal, cache: 'no-store' });
    if (!response.ok) return NextResponse.json({ scope: 'league', provider: 'fbref', found: false });
    const body = await response.json();
    const rows = Array.isArray(body?.data) ? body.data : [];
    const matching = rows.filter((row: unknown): row is Row => Boolean(row) && typeof row === 'object' && !Array.isArray(row))
      .map(normalize)
      .filter((row: Row) => ['player', 'Player', 'player_name'].some(key =>
        String(row[key] ?? '').trim().toLocaleLowerCase() === playerName.toLocaleLowerCase()));
    if (matching.length !== 1) return NextResponse.json({ scope: 'league', provider: 'fbref', found: false });
    const row = matching[0];
    const stats = {
      matches: numeric(row, keys.matches),
      goals: numeric(row, keys.goals),
      assists: numeric(row, keys.assists),
    };
    return NextResponse.json({
      found: Object.values(stats).some(value => value !== null),
      provider: 'fbref',
      scope: 'league',
      season,
      playerName,
      stats,
    }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch {
    return NextResponse.json({ found: false, provider: 'fbref', scope: 'league' });
  } finally {
    clearTimeout(timer);
  }
}
