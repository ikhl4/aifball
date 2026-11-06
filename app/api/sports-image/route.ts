import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

type Json = Record<string, any>;
const API = 'https://www.wikidata.org/w/api.php';
const COMMONS = 'https://commons.wikimedia.org/w/api.php';
const normalize = (value: string) => value.normalize('NFKC').trim().toLocaleLowerCase().replace(/\s+/g, ' ');

async function get(url: string): Promise<Json> {
  const response = await fetch(url, { signal: AbortSignal.timeout(7000), next: { revalidate: 86400 }, headers: { 'Accept': 'application/json' } });
  if (!response.ok) throw new Error('SOURCE_UNAVAILABLE');
  return response.json();
}
function urlFor(base: string, params: Record<string, string>) {
  const u = new URL(base);
  Object.entries(params).forEach(([k, v]) => u.searchParams.set(k, v));
  return u.href;
}
function safeHttps(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  try {
    const url = new URL(input);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}

/** Independently licensed photos only. No DuckDuckGo thumbnail hotlinking,
 * unapproved X/Instagram scraping or assumptions about search result rights. */
export async function GET(req: Request) {
  const subject = new URL(req.url).searchParams.get('subject')?.trim() || '';
  if (subject.length < 3 || subject.length > 90 || !/^[\p{L}\p{M}\s.'’\-]+$/u.test(subject)) {
    return NextResponse.json({ image: null }, { status: 400 });
  }
  try {
    // Wikidata search is for identity only: a single exact entity label
    // or alias is mandatory. Ambiguous names never yield a photo.
    const language = /[\u0600-\u06ff]/.test(subject) ? 'ar' : 'en';
    const data = await get(urlFor(API, { action: 'wbsearchentities', format: 'json', type: 'item', search: subject, language, limit: '12' }));
    const candidates = (Array.isArray(data.search) ? data.search : []).filter((candidate: Json) => {
      const labels = [candidate.label, candidate.match?.text].filter((v): v is string => typeof v === 'string');
      return labels.some(label => normalize(label) === normalize(subject));
    });
    if (candidates.length !== 1 || !/^Q\d+$/.test(candidates[0].id)) {
      return NextResponse.json({ image: null, reason: 'identity_not_unique' });
    }
    const id = candidates[0].id as string;
    const entities = await get(urlFor(API, { action: 'wbgetentities', format: 'json', ids: id, props: 'claims', languages: language }));
    const entity = entities.entities?.[id];
    const file = entity?.claims?.P18?.[0]?.mainsnak?.datavalue?.value;
    if (typeof file !== 'string' || !/\.(?:jpg|jpeg|png|webp)$/i.test(file)) {
      return NextResponse.json({ image: null, reason: 'no_identity_photo' });
    }

    const commons = await get(urlFor(COMMONS, { action: 'query', format: 'json', prop: 'imageinfo', iiprop: 'url|extmetadata', titles: `File:${file}` }));
    const pages = Object.values(commons.query?.pages || {}) as Json[];
    const info = pages[0]?.imageinfo?.[0];
    const license = String(info?.extmetadata?.LicenseShortName?.value || '').trim();
    const canonicalLicense = /^CC0(?: 1\.0)?$/i.test(license) ? 'CC0' :
      /^CC BY-SA \d\.\d$/i.test(license) ? license :
      /^CC BY \d\.\d$/i.test(license) ? license :
      /^(?:Public domain|PD)$/i.test(license) ? 'Public Domain' : '';
    const artist = String(info?.extmetadata?.Artist?.value || '')
      .replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
      .replace(/\s+/g, ' ').trim().slice(0, 160);
    const imageUrl = safeHttps(info?.url);
    const sourceUrl = safeHttps(info?.descriptionurl);
    if (!canonicalLicense || !imageUrl || !sourceUrl || !new URL(sourceUrl).hostname.endsWith('wikimedia.org') || (!artist && canonicalLicense !== 'CC0' && canonicalLicense !== 'Public Domain')) {
      return NextResponse.json({ image: null, reason: 'license_not_verified' });
    }
    return NextResponse.json({
      image: { url: imageUrl, sourceUrl, sourceName: 'Wikimedia Commons', license: canonicalLicense, artist, alt: `صورة تعريفية لـ ${subject} — ليست صورة الحدث الحالي` },
      wikidataId: id,
    }, { headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200' } });
  } catch {
    return NextResponse.json({ image: null, reason: 'source_unavailable' });
  }
}
