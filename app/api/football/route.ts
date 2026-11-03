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

  // 3️⃣ البحث عن ملخص قابل للتضمين من القنوات المعتمدة
  if (action === 'video') {
    const query = searchParams.get('query')?.trim();
    if (!query) {
      return NextResponse.json({ error: 'الرجاء تحديد نص البحث' }, { status: 400 });
    }
    if (!YOUTUBE_API_KEY) {
      return NextResponse.json({ error: 'YOUTUBE_API_KEY غير مهيأ في إعدادات السيرفر' }, { status: 503 });
    }

    const trustedChannels = [
      'bein', 'be in', 'thmanyah', 'ثمانية', 'tod', 'serie a', 'laliga',
      'la liga', 'abu dhabi', 'أبوظبي', 'alkass', 'الكأس', 'stc',
      'premier league', 'bundesliga', 'ligue 1', 'uefa', 'afc',
      'saudi pro league',
    ];
    const normalize = (value: string) => value.toLocaleLowerCase().normalize('NFKD')
      .replace(/[\\u0300-\\u036f\\u064b-\\u065f\\u0670ـ]/g, '')
      .replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي')
      .replace(/[^\\p{L}\\p{N}]+/gu, ' ').trim();

    try {
      const params = new URLSearchParams({
        part: 'snippet',
        type: 'video',
        videoEmbeddable: 'true',
        safeSearch: 'strict',
        maxResults: '10',
        q: query,
        key: YOUTUBE_API_KEY,
      });
      const res = await fetch(`https://www.googleapis.com/youtube/v3/search?${params.toString()}`, {
        cache: 'no-store',
        signal: AbortSignal.timeout(8000),
      });
      const data = await res.json();
      if (!res.ok || data?.error) {
        const reason = String(data?.error?.errors?.[0]?.reason || data?.error?.status || 'youtube_api_error');
        console.error('YouTube search failed:', { status: res.status, reason });
        return NextResponse.json(
          { error: 'تعذر البحث في YouTube', code: reason, status: res.status },
          { status: 502 },
        );
      }

      const item = (data.items || []).find((candidate: any) => {
        const channel = normalize(String(candidate?.snippet?.channelTitle || ''));
        const title = normalize(String(candidate?.snippet?.title || ''));
        const trusted = trustedChannels.some(name => channel.includes(normalize(name)));
        const highlight = /highlights?|ملخص|أبرز|summary|recap/i.test(String(candidate?.snippet?.title || ''));
        return trusted && highlight && /^[\\w-]{11}$/.test(candidate?.id?.videoId || '');
      });
      const videoId = item?.id?.videoId;
      if (videoId) {
        return NextResponse.json({
          videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
          channel: item.snippet.channelTitle,
          title: item.snippet.title,
        });
      }
      return NextResponse.json({ error: 'لم يتم العثور على ملخص مطابق من القنوات المعتمدة' }, { status: 404 });
    } catch (error) {
      console.error('YouTube search request failed:', error instanceof Error ? error.name : 'UnknownError');
      return NextResponse.json({ error: 'تعذر الاتصال بخدمة بحث YouTube' }, { status: 502 });
    }
  }

  // إذا لم يتم تحديد action صحيح
  return NextResponse.json({ error: 'طلب غير صالح. يرجى تحديد action (standings, livescores, video)' }, { status: 400 });
}
