import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  // الرابط الافتراضي هو الدوري السعودي (sau.1)
  const league = searchParams.get('league') || 'sau.1'; 
  
  try {
    const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/scoreboard`, {
      next: { revalidate: 60 } // تحديث كل 60 ثانية
    });

    if (!res.ok) throw new Error('Failed to fetch from ESPN');

    const data = await res.json();
    return NextResponse.json(data);
    
  } catch (error: any) {
    return NextResponse.json({ error: 'فشل جلب البيانات من ESPN' }, { status: 500 });
  }
}
