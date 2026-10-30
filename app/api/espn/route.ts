import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const league = searchParams.get('league') || 'ksa.1'; 
  const dateQuery = searchParams.get('date') || 'today'; 

  // دالة مساعدة لتنسيق التاريخ بصيغة ESPN (YYYYMMDD)
  const formatDate = (date: Date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}${mm}${dd}`;
  };

  let targetDate = new Date();

  // تحديد التاريخ بناءً على طلب المستخدم
  if (dateQuery === 'yesterday') {
    targetDate.setDate(targetDate.getDate() - 1);
  } else if (dateQuery === 'tomorrow') {
    targetDate.setDate(targetDate.getDate() + 1);
  } 
  // 'today' سيبقى تاريخ اليوم الحالي

  const dateParam = `?dates=${formatDate(targetDate)}`;

  try {
    // نمرر التاريخ الإجباري لـ ESPN لكي لا يجلب مباريات الأيام القادمة
    const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/scoreboard${dateParam}`, {
      cache: 'no-store', 
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!res.ok) throw new Error(`ESPN API responded with status: ${res.status}`);

    const data = await res.json();
    return NextResponse.json(data);
    
  } catch (error: any) {
    console.error("ESPN Fetch Error:", error.message);
    return NextResponse.json({ error: 'فشل جلب البيانات من ESPN', details: error.message }, { status: 500 });
  }
}
