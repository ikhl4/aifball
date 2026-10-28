import { NextResponse } from 'next/server';

// المفاتيح تُقرأ بأمان من إعدادات Vercel (Environment Variables)
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

const BASE_URL = 'https://v3.football.api-sports.io';

const apiHeaders = {
  'x-rapidapi-key': RAPIDAPI_KEY || '',
  'x-rapidapi-host': 'v3.football.api-sports.io'
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action'); // standings, livescores, video

  // 1️⃣ جلب ترتيب الدوري
  if (action === 'standings') {
    const league = searchParams.get('league');
    const season = searchParams.get('season');

    if (!league || !season) {
      return NextResponse.json({ error: 'الرجاء تحديد رقم الدوري والسنة' }, { status: 400 });
    }

    try {
      const res = await fetch(`${BASE_URL}/standings?league=${league}&season=${season}`, {
        headers: apiHeaders,
        next: { revalidate: 3600 } // كاش لمدة ساعة لتخفيف الضغط على الـ API
      });
      const data = await res.json();
      const standings = data.response?.[0]?.league?.standings?.[0] || [];
      
      return NextResponse.json({ standings });
    } catch (error) {
      return NextResponse.json({ error: 'فشل جلب جدول الترتيب' }, { status: 500 });
    }
  }

  // 2️⃣ جلب المباريات الحية
  if (action === 'livescores') {
    try {
      const res = await fetch(`${BASE_URL}/fixtures?live=all`, {
        headers: apiHeaders,
        cache: 'no-store' // النتائج الحية تحتاج تحديث مستمر بدون كاش
      });
      const data = await res.json();
      
      return NextResponse.json({ matches: data.response });
    } catch (error) {
      return NextResponse.json({ error: 'فشل جلب النتائج المباشرة' }, { status: 500 });
    }
  }

  // 3️⃣ البحث عن فيديو يوتيوب
  if (action === 'video') {
    const query = searchParams.get('query');
    if (!query) {
      return NextResponse.json({ error: 'الرجاء تحديد نص البحث' }, { status: 400 });
    }

    try {
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query + ' beIN SPORTS')}&key=${YOUTUBE_API_KEY}&maxResults=1&type=video&videoEmbeddable=true`
      );
      const data = await res.json();
      const videoId = data.items?.[0]?.id?.videoId;

      if (videoId) {
        return NextResponse.json({ videoUrl: `https://www.youtube.com/watch?v=${videoId}` });
      } else {
        return NextResponse.json({ error: 'لم يتم العثور على ملخص رسمي' }, { status: 404 });
      }
    } catch (error) {
      return NextResponse.json({ error: 'فشل جلب الفيديو من يوتيوب' }, { status: 500 });
    }
  }

  // إذا لم يتم تحديد action صحيح
  return NextResponse.json({ error: 'طلب غير صالح. يرجى تحديد action (standings, livescores, video)' }, { status: 400 });
}
