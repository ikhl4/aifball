import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const league = searchParams.get('league') || 'ksa.1';

  if (!/^[a-z0-9.]+$/i.test(league)) {
    return NextResponse.json({ error: 'دوري غير صالح' }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://site.api.espn.com/apis/v2/sports/soccer/${league}/standings`,
      { next: { revalidate: 300 } }
    );
    if (!res.ok) throw new Error(`ESPN ${res.status}`);
    const json = await res.json();

    const group = json?.children?.[0];
    const entries = group?.standings?.entries || [];
    const stat = (e: any, name: string) =>
      e.stats?.find((s: any) => s.name === name)?.value ?? 0;

    const rows = entries
      .map((e: any, i: number) => ({
        pos: stat(e, 'rank') || i + 1,
        name: e.team?.shortDisplayName || e.team?.displayName || '-',
        logo: e.team?.logos?.[0]?.href || null,
        played: stat(e, 'gamesPlayed'),
        won: stat(e, 'wins'),
        draw: stat(e, 'ties'),
        lost: stat(e, 'losses'),
        gf: stat(e, 'pointsFor'),
        ga: stat(e, 'pointsAgainst'),
        gd: stat(e, 'pointDifferential'),
        pts: stat(e, 'points'),
      }))
      .sort((a: any, b: any) => a.pos - b.pos);

    return NextResponse.json({
      season: group?.standings?.seasonDisplayName || '',
      rows,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'تعذر جلب الترتيب' }, { status: 502 });
  }
}
