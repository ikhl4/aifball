import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const subjects: Array<[RegExp, string]> = [
  [/كريستيانو\s+رونالدو|cristiano\s+ronaldo/i, 'Cristiano Ronaldo'],
  [/ليونيل\s+ميسي|lionel\s+messi/i, 'Lionel Messi'],
  [/كيليان\s+مبابي|kylian\s+mbapp/i, 'Kylian Mbappé'],
  [/لامين\s+يامال|lamine\s+yamal/i, 'Lamine Yamal'],
  [/محمد\s+صلاح|mohamed\s+salah/i, 'Mohamed Salah'],
  [/كريم\s+بنزيما|karim\s+benzema/i, 'Karim Benzema'],
  [/نيمار|neymar/i, 'Neymar'],
];

export async function GET(req: NextRequest) {
  const question = (new URL(req.url).searchParams.get('q') || '').slice(0, 350);
  const knownSubject = subjects.find(([pattern]) => pattern.test(question))?.[1];
  const topic = question
    .replace(/(?:من هو|من هي|ما هي|ما هو|حدثني عن|تكلم عن|أعطني|اعطني|اشرح|أريد|اريد|صورة|صور|قصة|تاريخ|مسيرة|ملعب|نادي|اللاعب|الملعب|عن|في|لـ|the|tell me about|show me|photo|picture|history|story|stadium|player|club)/gi, ' ')
    .replace(/[؟?!،.,:;()]/g, ' ')
    .replace(/\\s+/g, ' ')
    .trim()
    .slice(0, 90);
  const subject = knownSubject || topic;
  if (!subject || subject.length < 3) return NextResponse.json({ image: null });

  try {
    // Search the topic at request time; never invent an image or use a generic placeholder.
    for (const language of knownSubject ? ['en'] : ['ar', 'en']) {
      const endpoint = new URL(`https://${language}.wikipedia.org/w/api.php`);
      endpoint.searchParams.set('action', 'query');
      endpoint.searchParams.set('format', 'json');
      endpoint.searchParams.set('generator', 'search');
      endpoint.searchParams.set('gsrsearch', subject);
      endpoint.searchParams.set('gsrlimit', '4');
      endpoint.searchParams.set('prop', 'pageimages');
      endpoint.searchParams.set('pithumbsize', '960');
      const response = await fetch(endpoint, {
        signal: AbortSignal.timeout(5000),
        headers: { 'User-Agent': 'AiFBall/1.0 (football image attribution)' },
        cache: 'no-store',
      });
      if (!response.ok) continue;
      const data = await response.json();
      const pages = Object.values(data?.query?.pages || {}) as Array<{ index?: number; thumbnail?: { source?: string }; title?: string }>;
      pages.sort((a, b) => (a.index || 99) - (b.index || 99));
      const page = pages.find(item => item.thumbnail?.source?.startsWith('https://upload.wikimedia.org/'));
      if (!page?.thumbnail?.source) continue;
      return NextResponse.json({
        image: page.thumbnail.source,
        alt: page.title || subject,
        caption: `صورة تعريفية: ${page.title || subject} — المصدر: ويكيبيديا/ويكيميديا، وقد لا تكون من الحدث المذكور`,
        source: `https://${language}.wikipedia.org/wiki/${encodeURIComponent((page.title || subject).replace(/ /g, '_'))}`,
      });
    }
    return NextResponse.json({ image: null });
  } catch {
    return NextResponse.json({ image: null });
  }
}
