import { NextResponse } from 'next/server';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const LANUS_API = process.env.LANUS_API_URL || 'https://aifball-python-api.onrender.com';
const API_SECRET = process.env.LANUS_API_SECRET || '';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const source = searchParams.get('source');
  const action = searchParams.get('action');

  const p = (key: string, fallback = '') => encodeURIComponent(searchParams.get(key) || fallback);
  const key = `${source}:${action}`;
  let endpoint = '';

  switch (key) {
    case '365:shotmap':
      endpoint = `/365scores/shotmap?match_url=${p('matchUrl')}`; break;
    case '365:heatmap':
      endpoint = `/365scores/heatmap?match_url=${p('matchUrl')}&player_name=${p('playerName')}`; break;
    case '365:lineup':
      endpoint = `/365scores/lineup?match_url=${p('matchUrl')}`; break;
    case 'sofascore:shotmap':
      endpoint = `/sofascore/shotmap?match_url=${p('matchUrl')}`; break;
    case 'sofascore:heatmap':
      endpoint = `/sofascore/heatmap?match_url=${p('matchUrl')}&player_name=${p('playerName')}`; break;
    case 'fotmob:table':
      endpoint = `/fotmob/table?league=${p('league', 'ksa.1')}&season=${p('season', '2026')}`; break;
    case 'fotmob:match':
      endpoint = `/fotmob/match?match_url=${p('matchUrl')}`; break;
    case 'fbref:team-stats':
      endpoint = `/fbref/team-stats?stat_type=${p('statType', 'stats')}&league=${p('league', 'Big 5 European Leagues')}&season=${p('season', '2025-2026')}`; break;
    case 'fbref:player-stats':
      endpoint = `/fbref/player-stats?stat_type=${p('statType', 'stats')}&league=${p('league', 'Big 5 European Leagues')}&season=${p('season', '2025-2026')}&player_name=${p('playerName')}`; break;
    case 'tm:value':
      endpoint = `/transfermarkt/player-value?player_name=${p('playerName')}`; break;
    case 'tm:transfers':
      endpoint = `/transfermarkt/team-transfers?team_name=${p('teamName')}&season=${p('season')}`; break;
    default:
      return NextResponse.json({ error: 'طلب غير صالح (Invalid request parameters)' }, { status: 400 });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 55000);

  try {
    const res = await fetch(`${LANUS_API}${endpoint}`, {
      cache: 'no-store',
      signal: controller.signal,
      headers: API_SECRET ? { 'x-api-key': API_SECRET } : undefined,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      console.error('Python API error:', res.status, detail.slice(0, 300));
      return NextResponse.json(
        { error: 'خطأ من سيرفر البيانات', status: res.status, details: detail.slice(0, 300) },
        { status: 502 }
      );
    }

    return NextResponse.json(await res.json());
  } catch (error: any) {
    clearTimeout(timeoutId);
    const timedOut = error?.name === 'AbortError';
    console.error('API Route Error:', error);
    return NextResponse.json(
      { error: timedOut ? 'السيرفر تأخر في الاستجابة، حاول مرة أخرى' : 'فشل الاتصال بسيرفر البيانات' },
      { status: timedOut ? 504 : 502 }
    );
  }
}
