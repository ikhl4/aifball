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
    const match = key.match(/^\('([^']*)', '([^']*)'\)$/);
    return [match ? [match[1], match[2]].filter(Boolean).join(' ') : key, value];
  }));
}

function numeric(row: Row, aliases: readonly string[]): number | null {
  for (const key of aliases) {
    const raw = row[key];
    if (typeof raw !== 'number' && typeof raw !== 'string') continue;
    const value = String(raw).replace(/,/g, '').trim();
    if (!/^\d+$/.test(value)) continue;
    const n = Number(value);
    if (Number.isSafeInteger(n) && n >= 0) return n;
  }
  return null;
}


async function externalSeason(provider: 'sofascore' | '365scores', playerId: string, season: string) {
  const base = provider === 'sofascore' ? process.env.SOFASCORE_PLAYER_STATS_URL : process.env.SCORES365_PLAYER_STATS_URL;
  const token = provider === 'sofascore' ? process.env.SOFASCORE_PLAYER_STATS_TOKEN : process.env.SCORES365_PLAYER_STATS_TOKEN;
  if (!base || !/^[0-9]{1,12}$/.test(playerId)) return null;
  let url: URL;
  try {
    url = new URL(base);
    if (url.protocol !== 'https:') return null;
  } catch { return null; }
  url.searchParams.set('player_id', playerId);
  url.searchParams.set('season', season);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(url, { cache: 'no-store', signal: controller.signal,
      headers: token ? { Authorization: 'Bearer ' + token } : {} });
    if (!response.ok) return null;
    const data = await response.json();
    if (data?.found !== true || data?.season !== season ||
        (data?.playerId != null && String(data.playerId) !== playerId) ||
        !['all_competitions', 'competition'].includes(data?.scope) ||
        !data?.stats || typeof data.stats !== 'object' || Array.isArray(data.stats)) return null;
    const stats = {
      matches: numeric(data.stats, keys.matches),
      goals: numeric(data.stats, keys.goals),
      assists: numeric(data.stats, keys.assists),
    };
    if (Object.values(stats).every(value => value === null)) return null;
    return { stats, scope: data.scope as 'all_competitions' | 'competition' };
  } catch { return null; }
  finally { clearTimeout(timer); }
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const playerName = (params.get('playerName') || '').trim();
  const season = (params.get('season') || '').trim();
  if (!playerName || playerName.length > 100 || !/^\d{4}(?:-\d{4})?$/.test(season)) {
    return NextResponse.json({ error: 'Invalid player or season' }, { status: 400 });
  }

  const provider = (params.get('provider') || 'auto').toLowerCase();
  if (!['auto', 'fotmob', 'fbref', 'sofascore', '365scores'].includes(provider)) {
    return NextResponse.json({ error: 'Provider not connected' }, { status: 400 });
  }
  const playerId = (params.get('playerId') || '').trim();
  const diagnostics: Array<{ provider: string; status: string }> = [];
  let partial: { provider: string; scope: 'competition' | 'league'; stats: Row } | null = null;
  if ((provider === 'auto' || provider === 'fotmob') && /^\d{1,9}$/.test(playerId)) {
    const base = process.env.LANUS_API_URL || 'https://aifball-python-api.onrender.com';
    const endpoint = new URL('/fotmob/player-season', base);
    endpoint.searchParams.set('player_id', playerId);
    endpoint.searchParams.set('season', season);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch(endpoint, { signal: controller.signal, cache: 'no-store' });
      if (response.ok) {
        const payload = await response.json();
        if (payload?.found && ['all_competitions', 'competition'].includes(payload.scope) && payload.stats) {
          const stats = {
            matches: numeric(payload.stats, keys.matches),
            goals: numeric(payload.stats, keys.goals),
            assists: numeric(payload.stats, keys.assists),
          };
          if (Object.values(stats).some(value => value !== null)) {
            if (payload.scope === 'all_competitions') {
              return NextResponse.json({ found: true, provider: 'fotmob', scope: payload.scope, season, playerName, stats });
            }
            partial = { provider: 'fotmob', scope: 'competition', stats };
          }
        }
        diagnostics.push({ provider: 'fotmob', status: 'unavailable_or_unverified' });
      } else {
        diagnostics.push({ provider: 'fotmob', status: response.status === 503 ? 'disabled' : 'unavailable' });
      }
    } catch {
      diagnostics.push({ provider: 'fotmob', status: 'request_failed' });
    } finally {
      clearTimeout(timer);
    }
  } else if (provider === 'fotmob') {
    return NextResponse.json({ found: false, provider: 'fotmob', reason: 'verified_player_id_required' });
  }
  if (provider === 'fotmob') return NextResponse.json({ found: false, diagnostics });
  for (const source of ['sofascore', '365scores'] as const) {
    if (provider !== 'auto' && provider !== source) continue;
    const id = (params.get(source === 'sofascore' ? 'sofascoreId' : 'scores365Id') || '').trim();
    const resolved = await externalSeason(source, id, season);
    if (resolved) {
      if (resolved.scope === 'all_competitions') {
        return NextResponse.json({ found: true, provider: source, scope: resolved.scope,
          season, playerName, stats: resolved.stats },
          { headers: { 'Cache-Control': 'private, no-store' } });
      }
      if (!partial) partial = { provider: source, scope: 'competition', stats: resolved.stats };
    }
    diagnostics.push({ provider: source, status: id ? 'unavailable_or_unconfigured' : 'player_id_missing' });
  }
  if (provider === 'sofascore' || provider === '365scores') {
    return NextResponse.json({ found: false, diagnostics });
  }

  // A verified overall season takes priority over single-competition results.
  // First working adapter: existing internal FBref backend. This is LEAGUE-ONLY,
  // never an all-competitions total. More adapters can be added without changing UI.
  const origin = new URL(request.url).origin;
  const url = new URL('/api/advanced', origin);
  url.searchParams.set('source', 'fbref');
  url.searchParams.set('action', 'player-stats');
  url.searchParams.set('playerName', playerName);
  url.searchParams.set('season', season);
  const league = (params.get('league') || '').trim();
  if (league && league.length <= 80) url.searchParams.set('league', league);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45000);
  try {
    const response = await fetch(url, { signal: controller.signal, cache: 'no-store' });
    if (!response.ok) return NextResponse.json(partial ? { found: true, ...partial, season, playerName, diagnostics } : { scope: 'league', provider: 'fbref', found: false, diagnostics });
    const body = await response.json();
    const rows = Array.isArray(body?.data) ? body.data : (Array.isArray(body) ? body : []);
    const matching = rows.filter((row: unknown): row is Row => Boolean(row) && typeof row === 'object' && !Array.isArray(row))
      .map(normalize)
      .filter((row: Row) => ['player', 'Player', 'player_name', 'Player Name', 'Unnamed: 0 level_0 Player'].some(key =>
        String(row[key] ?? '').trim().toLocaleLowerCase() === playerName.toLocaleLowerCase()));
    if (matching.length !== 1) return NextResponse.json(partial ? { found: true, ...partial, season, playerName, diagnostics } : { scope: 'league', provider: 'fbref', found: false, diagnostics });
    const row = matching[0];
    const stats = {
      matches: numeric(row, keys.matches),
      goals: numeric(row, keys.goals),
      assists: numeric(row, keys.assists),
    };
    if (partial) return NextResponse.json({ found: true, ...partial, season, playerName, diagnostics });
    return NextResponse.json({
      found: Object.values(stats).some(value => value !== null),
      provider: 'fbref',
      scope: 'league',
      season,
      playerName,
      stats,
      diagnostics,
    }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch {
    return NextResponse.json(partial ? { found: true, ...partial, season, playerName, diagnostics } : { found: false, provider: 'fbref', scope: 'league', diagnostics });
  } finally {
    clearTimeout(timer);
  }
}
