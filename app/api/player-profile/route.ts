import { loadPlayerData, currentFootballSeason } from '../../../lib/player-profile-data';
import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export const maxDuration = 20;
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const name = (params.get('name') || '').trim(), season = params.get('season') || currentFootballSeason();
  if (name.length < 3 || name.length > 100 || !/^[\p{L}\p{M}\s.'’()-]+$/u.test(name) ||
    !/^(?:19|20)\d{2}(?:-(?:19|20)\d{2})?$/.test(season) || (season.includes('-') && Number(season.slice(5)) !== Number(season.slice(0,4)) + 1)) {
    return NextResponse.json({ error: 'Invalid player or season' }, { status: 400 });
  }
  return NextResponse.json(await loadPlayerData(name, season), { headers: { 'Cache-Control': 'private, no-store' } });
}
