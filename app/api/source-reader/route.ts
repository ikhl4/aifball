import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// Public official football sources only. Never accept arbitrary destinations.
const allowedHosts = new Set([
  'saff.com.sa', 'www.saff.com.sa', 'saffplus.sa', 'www.saffplus.sa',
  'spl.com.sa', 'www.spl.com.sa', 'the-afc.com', 'www.the-afc.com',
  'uefa.com', 'www.uefa.com', 'fifa.com', 'www.fifa.com',
]);
const maxBytes = 1_500_000;
function permitted(raw: string): URL | null {
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:' || !allowedHosts.has(url.hostname.toLowerCase())) return null;
    if (url.username || url.password || url.port) return null;
    return url;
  } catch { return null; }
}
function decodeEntities(text: string): string {
  return text.replace(/&(?:nbsp|amp|lt|gt|quot|apos|#39|#x27);/gi, m => ({
    '&nbsp;':' ', '&amp;':'&', '&lt;':'<', '&gt;':'>', '&quot;':'"', '&apos;':"'", '&#39;':"'", '&#x27;':"'"
  } as Record<string,string>)[m.toLowerCase()] || m)
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Math.min(1114111, Number(n))))
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(Math.min(1114111, parseInt(n,16))));
}
function extract(html: string): {title:string;text:string} {
  const title = decodeEntities((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '').replace(/<[^>]+>/g,'')).trim();
  const stripped = html.replace(/<(script|style|noscript|svg|template)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, ' ')
    .replace(/<\/(?:p|div|h[1-6]|tr|li|section|article|table)>/gi, '\n')
    .replace(/<t[dh]\b[^>]*>/gi, ' | ')
    .replace(/<[^>]*>/g, ' ');
  return {title, text:decodeEntities(stripped).replace(/[ \t]+/g,' ').replace(/\n\s*\n+/g,'\n').trim().slice(0,30000)};
}
export async function GET(request: NextRequest) {
  const url = permitted(request.nextUrl.searchParams.get('url') || '');
  if (!url) return NextResponse.json({error:'المصدر غير مسموح؛ يلزم رابط HTTPS رسمي معتمد.'},{status:400});
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    // No redirects: redirects can escape the official-source allowlist.
    const response = await fetch(url.toString(), {redirect:'manual', signal:controller.signal,
      cache:'no-store', headers:{Accept:'text/html,application/xhtml+xml'}});
    if (!response.ok) return NextResponse.json({error:'تعذر فتح المصدر الرسمي.',status:response.status},{status:502});
    const type = response.headers.get('content-type') || '';
    if (!/text\/html|application\/xhtml\+xml/i.test(type))
      return NextResponse.json({error:'نوع المصدر غير مدعوم بعد؛ ملفات PDF تحتاج قارئاً مستقلاً.',contentType:type},{status:415});
    const reader = response.body?.getReader();
    if (!reader) throw new Error('EMPTY_BODY');
    const chunks: Uint8Array[] = []; let total = 0;
    while (true) {
      const {done,value} = await reader.read(); if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {await reader.cancel(); return NextResponse.json({error:'الصفحة أكبر من الحد المسموح.'},{status:413});}
      chunks.push(value);
    }
    const bytes = new Uint8Array(total); let offset=0;
    for (const chunk of chunks) {bytes.set(chunk,offset);offset+=chunk.byteLength;}
    const html = new TextDecoder('utf-8').decode(bytes);
    const {title,text} = extract(html);
    return NextResponse.json({source_url:url.toString(),title,text,
      extracted_chars:text.length, verified:false,
      note:'النص مستخرج من الصفحة؛ صحة الوقائع تتطلب مطابقة التاريخ والموسم والفئة والمصدر.'},
      {headers:{'Cache-Control':'no-store'}});
  } catch {
    return NextResponse.json({error:'تعذر قراءة الصفحة ضمن المهلة المحددة.'},{status:502});
  } finally {clearTimeout(timer);}
}
