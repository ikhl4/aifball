import { NextResponse } from 'next/server';

const leagues: Record<string, number> = {
  'ksa.1': 307, 'eng.1': 39, 'esp.1': 140, 'ita.1': 135,
  'ger.1': 78, 'fra.1': 61, 'usa.1': 253,
};
type Leader = { id: number; name: string; team: string; photo: string | null; logo: string | null; value: number };


// ESPN provides competition-season player leaderboards independently of Apple Sports.
// Apple currently exposes match-level player statistics but no validated season leaders endpoint.
async function espnFallback(league: string, kind: string, season: number): Promise<Leader[]> {
  const url = new URL('https://site.web.api.espn.com/apis/common/v3/sports/soccer/' + league + '/statistics/byathlete');
  url.searchParams.set('season', String(season));
  url.searchParams.set('limit', '100');
  const response = await fetch(url, { next: { revalidate: 3600 }, signal: AbortSignal.timeout(8000) });
  if (!response.ok) return [];
  const payload: any = await response.json();
  // Only accept numeric season aggregate stats explicitly identified as goals or assists.
  const aliases = kind === 'goals' ? ['goals', 'totalGoals', 'goal'] : ['assists', 'totalAssists', 'goalAssists'];
  const rows: any[] = Array.isArray(payload?.athletes) ? payload.athletes :
    Array.isArray(payload?.entries) ? payload.entries :
    Array.isArray(payload?.players) ? payload.players : [];
  return rows.flatMap((item: any) => {
    const athlete = item?.athlete || item?.player || item;
    const id = Number(athlete?.id);
    const name = athlete?.displayName || athlete?.fullName || athlete?.name;
    const summaries: any[] = Array.isArray(item?.statistics) ? item.statistics : [];
    const matched = summaries.find(stat => aliases.includes(stat?.name) || aliases.includes(stat?.type));
    const raw = aliases.map(key => item?.stats?.[key] ?? item?.statistics?.[key]).find(value => typeof value === 'number');
    const value = Number(matched?.value ?? raw);
    if (!Number.isSafeInteger(id) || id <= 0 || typeof name !== 'string' || !name.trim() ||
      !Number.isInteger(value) || value < 0) return [];
    const team = athlete?.team?.displayName || item?.team?.displayName || '';
    return [{id, name:name.trim(), team:typeof team==='string'?team:'', photo:null, logo:null, value}];
  }).sort((a: Leader,b: Leader)=>b.value-a.value).slice(0,20);
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const league = params.get('league') || 'ksa.1';
  const kind = params.get('kind');
  const leagueId = leagues[league];
  if (!leagueId || (kind !== 'goals' && kind !== 'assists')) {
    return NextResponse.json({ error: 'Unsupported competition or category', players: [] }, { status: 400 });
  }
  const apiSportsKey = process.env.API_SPORTS_KEY;
  const rapidKey = process.env.RAPIDAPI_KEY;

  const currentYear = new Date().getUTCFullYear();
  // European and Saudi leagues cross calendar years; MLS follows calendar years.
  const season = league === 'usa.1' ? currentYear : new Date().getUTCMonth() < 6 ? currentYear - 1 : currentYear;
  // RapidAPI and API-Sports use different hosts and authorization headers.
  const direct = Boolean(apiSportsKey);
  const base = direct
    ? 'https://v3.football.api-sports.io/players/'
    : 'https://api-football-v1.p.rapidapi.com/v3/players/';
  const url = new URL(base + (kind === 'goals' ? 'topscorers' : 'topassists'));
  url.searchParams.set('league', String(leagueId));
  url.searchParams.set('season', String(season));
  try {
    if (!apiSportsKey && !rapidKey) throw new Error('PRIMARY_NOT_CONFIGURED');
    const response = await fetch(url, {
      headers: direct
        ? { 'x-apisports-key': apiSportsKey! }
        : { 'x-rapidapi-key': rapidKey!, 'x-rapidapi-host': 'api-football-v1.p.rapidapi.com' },
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(9000),
    });
    if (!response.ok) {
      console.error('[Football leaders] provider HTTP status', response.status, { league, kind, provider: direct ? 'api-sports' : 'rapidapi' });
      throw new Error('PRIMARY_PROVIDER_HTTP');
    }
    const raw: unknown = await response.json();
    const data = raw as { response?: unknown[]; errors?: unknown };
    if (!Array.isArray(data.response) || (data.errors && Object.keys(data.errors).length)) {
      console.error('[Football leaders] provider returned errors', { league, kind, provider: direct ? 'api-sports' : 'rapidapi', keys: Object.keys(data.errors || {}) });
      throw new Error('PRIMARY_PROVIDER_DATA');
    }
    const players: Leader[] = data.response.flatMap((entry) => {
      const item = entry as { player?: { id?: number; name?: string; photo?: string }; statistics?: { goals?: { total?: number | null; assists?: number | null }; team?: { name?: string; logo?: string } }[] };
      const stat = item.statistics?.[0];
      const value = kind === 'goals' ? stat?.goals?.total : stat?.goals?.assists;
      if (typeof value !== 'number' || !Number.isFinite(value) || !item.player?.name || !item.player.id) return [];
      const safe = (s?: string) => s && /^https:\/\//.test(s) ? s : null;
      return [{ id: item.player.id, name: item.player.name, team: stat?.team?.name || '', photo: safe(item.player.photo), logo: safe(stat?.team?.logo), value }];
    }).sort((a, b) => b.value - a.value).slice(0, 20);
    if (players.length) return NextResponse.json({ players, season, source: 'API-Football', league, kind });
    throw new Error('PRIMARY_EMPTY');
  } catch (error) {
    console.error('[Football leaders] fetch failed', { league, kind, reason: error instanceof Error ? error.name : 'unknown' });
    try {
      const players = await espnFallback(league, kind, season);
      if (players.length) return NextResponse.json({ players, season, source: 'ESPN', league, kind });
    } catch (fallbackError) {
      console.error('[Football leaders] ESPN fallback unavailable', { league, kind, reason: fallbackError instanceof Error ? fallbackError.name : 'unknown' });
    }
    return NextResponse.json({ error: 'Verified league-wide leaderboard is not available from either provider', code: 'SOURCES_UNAVAILABLE', players: [] }, { status: 502 });
  }
}
