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
  const subject = subjects.find(([pattern]) => pattern.test(question))?.[1];
  if (!subject) return NextResponse.json({ image: null });
  try {
    const endpoint = new URL('https://en.wikipedia.org/w/api.php');
    endpoint.searchParams.set('action', 'query');
    endpoint.searchParams.set('format', 'json');
    endpoint.searchParams.set('titles', subject);
    endpoint.searchParams.set('prop', 'pageimages');
    endpoint.searchParams.set('pithumbsize', '960');
    endpoint.searchParams.set('redirects', '1');
    const response = await fetch(endpoint, {
      signal: AbortSignal.timeout(5000),
      headers: { 'User-Agent': 'AiFBall/1.0 (football image attribution)' },
      next: { revalidate: 86400 },
    });
    if (!response.ok) return NextResponse.json({ image: null });
    const data = await response.json();
    const page = Object.values(data?.query?.pages || {})[0] as { thumbnail?: { source?: string }; title?: string } | undefined;
    const image = page?.thumbnail?.source;
    if (!image || !image.startsWith('https://upload.wikimedia.org/')) return NextResponse.json({ image: null });
    return NextResponse.json({
      image,
      alt: subject,
      caption: 'صورة تعريفية للاعب — ليست بالضرورة من الحدث المذكور',
      source: 'https://en.wikipedia.org/wiki/' + encodeURIComponent((page?.title || subject).replace(/ /g, '_')),
    });
  } catch {
    return NextResponse.json({ image: null });
  }
}
