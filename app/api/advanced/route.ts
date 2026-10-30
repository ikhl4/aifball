import { NextResponse } from 'next/server';

// ضعنا رابط سيرفر Render الخاص بك هنا
const LANUS_API = 'https://aifball-python-api.onrender.com';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const source = searchParams.get('source'); // '365', 'sofascore', 'fotmob', 'fbref', 'tm'
  const action = searchParams.get('action'); // 'shotmap', 'heatmap', 'table', 'stats', 'match', 'value', 'transfers'
  
  let endpoint = '';

  // 1. 365Scores
  if (source === '365' && action === 'shotmap') {
    endpoint = `${LANUS_API}/365scores/shotmap?match_url=${encodeURIComponent(searchParams.get('matchUrl') || '')}`;
  } else if (source === '365' && action === 'heatmap') {
    endpoint = `${LANUS_API}/365scores/heatmap?match_url=${encodeURIComponent(searchParams.get('matchUrl') || '')}&player_name=${encodeURIComponent(searchParams.get('playerName') || '')}`;
  
  // 2. SofaScore
  } else if (source === 'sofascore' && action === 'shotmap') {
    endpoint = `${LANUS_API}/sofascore/shotmap?match_url=${encodeURIComponent(searchParams.get('matchUrl') || '')}`;
  } else if (source === 'sofascore' && action === 'heatmap') {
    endpoint = `${LANUS_API}/sofascore/heatmap?match_url=${encodeURIComponent(searchParams.get('matchUrl') || '')}&player_name=${encodeURIComponent(searchParams.get('playerName') || '')}`;
  
  // 3. FotMob
  } else if (source === 'fotmob' && action === 'table') {
    endpoint = `${LANUS_API}/fotmob/table?league=${encodeURIComponent(searchParams.get('league') || '')}&season=${encodeURIComponent(searchParams.get('season') || '')}`;
  } else if (source === 'fotmob' && action === 'match') {
    endpoint = `${LANUS_API}/fotmob/match?match_url=${encodeURIComponent(searchParams.get('matchUrl') || '')}`;

  // 4. FBRef
  } else if (source === 'fbref' && action === 'team-stats') {
    endpoint = `${LANUS_API}/fbref/team-stats?stat_type=${encodeURIComponent(searchParams.get('statType') || '')}&league=${encodeURIComponent(searchParams.get('league') || '')}&season=${encodeURIComponent(searchParams.get('season') || '')}`;
  } else if (source === 'fbref' && action === 'player-stats') {
    endpoint = `${LANUS_API}/fbref/player-stats?stat_type=${encodeURIComponent(searchParams.get('statType') || '')}&league=${encodeURIComponent(searchParams.get('league') || '')}&season=${encodeURIComponent(searchParams.get('season') || '')}`;

  // 5. Transfermarkt
  } else if (source === 'tm' && action === 'value') {
    endpoint = `${LANUS_API}/transfermarkt/player-value?player_name=${encodeURIComponent(searchParams.get('playerName') || '')}`;
  } else if (source === 'tm' && action === 'transfers') {
    endpoint = `${LANUS_API}/transfermarkt/team-transfers?team_name=${encodeURIComponent(searchParams.get('teamName') || '')}&season=${encodeURIComponent(searchParams.get('season') || '')}`;
  
  // إذا لم يتم التعرف على الطلب
  } else {
    return NextResponse.json({ error: 'طلب غير صالح (Invalid request)' }, { status: 400 });
  }

  try {
    // نرسل الطلب إلى سيرفر Render
    const res = await fetch(endpoint, {
        // ملاحظة هامة: الخطة المجانية في Render تنام بعد 15 دقيقة من الخمول
        // أول طلب قد يستغرق 50 ثانية ليستيقظ السيرفر
        next: { revalidate: 0 } 
    });
    
    if (!res.ok) {
        throw new Error(`Render API responded with status: ${res.status}`);
    }

    const data = await res.json();
    return NextResponse.json(data);
    
  } catch (error: any) {
    console.error("API Route Error:", error);
    return NextResponse.json({ error: 'فشل في جلب البيانات من السيرفر', details: error.message }, { status: 500 });
  }
}
