import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Only explicitly recognized football entities may receive an automatic image.
// Never use Wikipedia full-text search to choose a photo for a news story.
const entities: Array<{ match: RegExp; title: string; kind: 'club' | 'player' }> = [
  { match: /(?:الهلال|al[ -]?hilal)/i, title: 'Al Hilal SFC', kind: 'club' },
  { match: /(?:الاتحاد|al[ -]?ittihad)/i, title: 'Al-Ittihad Club (Jeddah)', kind: 'club' },
  { match: /(?:النصر|al[ -]?nassr)/i, title: 'Al Nassr FC', kind: 'club' },
  { match: /(?:الأهلي السعودي|al[ -]?ahli saudi)/i, title: 'Al-Ahli Saudi FC', kind: 'club' },
  { match: /(?:كريستيانو\s+رونالدو|cristiano\s+ronaldo)/i, title: 'Cristiano Ronaldo', kind: 'player' },
  { match: /(?:ليونيل\s+ميسي|lionel\s+messi)/i, title: 'Lionel Messi', kind: 'player' },
  { match: /(?:كيليان\s+مبابي|kylian\s+mbapp)/i, title: 'Kylian Mbappé', kind: 'player' },
  { match: /(?:لامين\s+يامال|lamine\s+yamal)/i, title: 'Lamine Yamal', kind: 'player' },
  { match: /(?:محمد\s+صلاح|mohamed\s+salah)/i, title: 'Mohamed Salah', kind: 'player' },
  { match: /(?:كريم\s+بنزيما|karim\s+benzema)/i, title: 'Karim Benzema', kind: 'player' },
];

export async function GET(req: NextRequest) {
  const question = (new URL(req.url).searchParams.get('q') || '').slice(0, 350);
  const matches = entities.filter(entity => entity.match.test(question));
  // Ambiguous stories about multiple teams/players must not get an unrelated image.
  if (matches.length !== 1) return NextResponse.json({ image: null });
  const entity = matches[0];

  try {
    const endpoint = new URL('https://en.wikipedia.org/w/api.php');
    endpoint.searchParams.set('action', 'query');
    endpoint.searchParams.set('format', 'json');
    endpoint.searchParams.set('titles', entity.title);
    endpoint.searchParams.set('prop', 'pageimages');
    endpoint.searchParams.set('pithumbsize', '640');
    endpoint.searchParams.set('redirects', '1');
    const response = await fetch(endpoint, {
      signal: AbortSignal.timeout(4000),
      headers: { 'User-Agent': 'AiFBall/1.0 (football entity images)' },
      cache: 'no-store',
    });
    if (!response.ok) return NextResponse.json({ image: null });
    const data = await response.json();
    const pages = Object.values(data?.query?.pages || {}) as Array<{ missing?: boolean; thumbnail?: { source?: string }; title?: string }>;
    const page = pages.find(item => !item.missing && item.thumbnail?.source?.startsWith('https://upload.wikimedia.org/'));
    if (!page?.thumbnail?.source) return NextResponse.json({ image: null });
    return NextResponse.json({
      image: page.thumbnail.source,
      alt: entity.kind === 'club' ? 'شعار ' + entity.title : 'صورة ' + entity.title,
      caption: entity.kind === 'club' ? 'شعار النادي — صورة تعريفية وليست صورة الحدث' : 'صورة تعريفية للاعب وليست صورة الحدث',
      source: 'https://en.wikipedia.org/wiki/' + encodeURIComponent(entity.title.replace(/ /g, '_')),
    });
  } catch {
    return NextResponse.json({ image: null });
  }
}
