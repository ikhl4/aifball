import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  if (!query) {
    return NextResponse.json({ error: 'نص البحث مفقود' }, { status: 400 });
  }

  try {
    // تصحيح رابط يوتيوب وإضافة البحث
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query + ' beIN SPORTS')}&key=${process.env.YOUTUBE_API_KEY}&maxResults=1&type=video&videoEmbeddable=true`
    );
    
    const data = await res.json();
    const videoId = data.items?.[0]?.id?.videoId;

    if (videoId) {
      // تصحيح رابط الفيديو ليفتح مباشرة
      return NextResponse.json({ videoUrl: `https://www.youtube.com/watch?v=${videoId}` });
    }
    
    return NextResponse.json({ error: 'لم يتم العثور على ملخص رسمي للمباراة' }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ error: 'خطأ في الاتصال بخوادم يوتيوب' }, { status: 500 });
  }
}
