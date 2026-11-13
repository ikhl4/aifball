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
  const url = new URL('https://v3.football.api-sports.io/players/' + (kind === 'goals' ? 'topscorers' : 'topassists'));
  url.searchParams.set('league', String(leagueId));
  url.searchParams.set('season', String(season));
  try {
    const response = await fetch(url, {
      headers: apiSportsKey ? { 'x-apisports-key': apiSportsKey } :
        { 'x-rapidapi-key': rapidKey || '', 'x-rapidapi-host': 'v3.football.api-sports.io' },
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(9000),
    });
    if (!response.ok) throw new Error('Upstream unavailable');
    const raw: unknown = await response.json();
    const data = raw as { response?: unknown[]; errors?: unknown };
    if (!Array.isArray(data.response) || (data.errors && Object.keys(data.errors).length)) throw new Error('No verified provider response');
    const players: Leader[] = data.response.flatMap((entry) => {
      const item = entry as { player?: { id?: number; name?: string; photo?: string }; statistics?: { goals?: { total?: number | null; assists?: number | null }; team?: { name?: string; logo?: string } }[] };
      const stat = item.statistics?.[0];
      const value = kind === 'goals' ? stat?.goals?.total : stat?.goals?.assists;
      if (typeof value !== 'number' || !Number.isFinite(value) || !item.player?.name || !item.player.id) return [];
      const safe = (s?: string) => s && /^https:\/\//.test(s) ? s : null;
      return [{ id: item.player.id, name: item.player.name, team: stat?.team?.name || '', photo: safe(item.player.photo), logo: safe(stat?.team?.logo), value }];
    }).sort((a, b) => b.value - a.value).slice(0, 20);
    return NextResponse.json({ players, season, source: 'API-Football', league, kind });
  } catch {
    return NextResponse.json({ error: 'Verified leader data unavailable', players: [] }, { status: 502 });
  }
}
