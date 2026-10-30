import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const league = searchParams.get('league') || 'sau.1'; 
  const dateQuery = searchParams.get('date'); // 'today', 'yesterday', or YYYYMMDD

  let dateParam = '';
  if (dateQuery === 'yesterday') {
    // حساب تاريخ الأمس بصيغة ESPN (YYYYMMDD)
    const yesterday = new Date(Date.now() - 86400000);
    const yyyy = yesterday.getFullYear();
    const mm = String(yesterday.getMonth() + 1).padStart(2, '0');
    const dd = String(yesterday.getDate()).padStart(2, '0');
    dateParam = `?dates=${yyyy}${mm}${dd}`;
  } else if (dateQuery && dateQuery !== 'today') {
    dateParam = `?dates=${dateQuery}`;
  }
  
  try {
    const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/scoreboard${dateParam}`, {
      next: { revalidate: 60 }
    });

    if (!res.ok) throw new Error('Failed to fetch from ESPN');

    const data = await res.json();
    return NextResponse.json(data);
    
  } catch (error: any) {
    return NextResponse.json({ error: 'فشل جلب البيانات من ESPN' }, { status: 500 });
  }
}
