import { NextResponse } from 'next/server';

const leagues: Record<string, number> = {
  'ksa.1': 307, 'eng.1': 39, 'esp.1': 140, 'ita.1': 135,
  'ger.1': 78, 'fra.1': 61, 'usa.1': 253,
};
type Leader = { id: number; name: string; team: string; photo: string | null; logo: string | null; value: number };

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
  if (!apiSportsKey && !rapidKey) {
    return NextResponse.json({ error: 'Leader statistics provider is not configured', players: [] }, { status: 503 });
  }
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
    const response = await fetch(url, {
      headers: direct
        ? { 'x-apisports-key': apiSportsKey! }
        : { 'x-rapidapi-key': rapidKey!, 'x-rapidapi-host': 'api-football-v1.p.rapidapi.com' },
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(9000),
    });
    if (!response.ok) {
      console.error('[Football leaders] provider HTTP status', response.status, { league, kind, provider: direct ? 'api-sports' : 'rapidapi' });
      return NextResponse.json({
        error: response.status === 403 || response.status === 401
          ? 'Football leaders provider subscription or authorization is unavailable'
          : 'Football leaders provider request failed',
        code: response.status === 403 || response.status === 401 ? 'PROVIDER_ACCESS' : 'PROVIDER_HTTP',
        players: [],
      }, { status: 502 });
    }
    const raw: unknown = await response.json();
    const data = raw as { response?: unknown[]; errors?: unknown };
    if (!Array.isArray(data.response) || (data.errors && Object.keys(data.errors).length)) {
      console.error('[Football leaders] provider returned errors', { league, kind, provider: direct ? 'api-sports' : 'rapidapi', keys: Object.keys(data.errors || {}) });
      return NextResponse.json({ error: 'The provider returned no usable leaderboard data', code: 'PROVIDER_DATA', players: [] }, { status: 502 });
    }
    const players: Leader[] = data.response.flatMap((entry) => {
      const item = entry as { player?: { id?: number; name?: string; photo?: string }; statistics?: { goals?: { total?: number | null; assists?: number | null }; team?: { name?: string; logo?: string } }[] };
      const stat = item.statistics?.[0];
      const value = kind === 'goals' ? stat?.goals?.total : stat?.goals?.assists;
      if (typeof value !== 'number' || !Number.isFinite(value) || !item.player?.name || !item.player.id) return [];
      const safe = (s?: string) => s && /^https:\/\//.test(s) ? s : null;
      return [{ id: item.player.id, name: item.player.name, team: stat?.team?.name || '', photo: safe(item.player.photo), logo: safe(stat?.team?.logo), value }];
    }).sort((a, b) => b.value - a.value).slice(0, 20);
    return NextResponse.json({ players, season, source: 'API-Football', league, kind });
  } catch (error) {
    console.error('[Football leaders] fetch failed', { league, kind, reason: error instanceof Error ? error.name : 'unknown' });
    return NextResponse.json({ error: 'Verified leader data unavailable', code: 'PROVIDER_NETWORK', players: [] }, { status: 502 });
  }
}
