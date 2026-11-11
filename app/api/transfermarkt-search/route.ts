import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
type SearchHit = { title: string; url: string; snippet: string; source: 'Transfermarkt'; status: 'search_result_unverified' };

function clean(value: string) {
 return value.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();
}
export async function GET(request: NextRequest) {
 const term = (request.nextUrl.searchParams.get('q') || '').trim();
 if (term.length < 2 || term.length > 80) return NextResponse.json({error:'query_length',results:[]},{status:400});
 const search = 'site:transfermarkt.com ' + term + ' transfer 2026';
 try {
  const response = await fetch('https://html.duckduckgo.com/html/?q=' + encodeURIComponent(search),{
   headers:{'User-Agent':'Mozilla/5.0 (compatible; AiFBall/1.0)','Accept':'text/html'},
   signal:AbortSignal.timeout(9000),cache:'no-store'
  });
  if (!response.ok) throw new Error('DDG HTTP '+response.status);
  const html = await response.text();
  if (html.length > 2_000_000) throw new Error('response_too_large');
  const hits:SearchHit[]=[];
  for (const match of html.matchAll(/<a\b[^>]*class=["'][^"']*\bresult__a\b[^"']*["'][^>]*>[\s\S]*?<\/a>/gi)) {
   const raw = match[0].match(/href=["']([^"']+)["']/i)?.[1];
   if (!raw) continue;
   try {
    const redirect = new URL(clean(raw),'https://duckduckgo.com');
    const url = new URL(redirect.searchParams.get('uddg') || redirect.href);
    if (!['transfermarkt.com','www.transfermarkt.com'].includes(url.hostname.toLowerCase())) continue;
    const title = clean(match[0]);
    if (!title || hits.some(item=>item.url===url.href)) continue;
    hits.push({title,url:url.href,snippet:'نتيجة بحث من فهرس DuckDuckGo، راجع صفحة ترانسفير ماركت للتحقق من تفاصيل الصفقة وقيمتها.',source:'Transfermarkt',status:'search_result_unverified'});
   } catch { /* ignore malformed search links */ }
   if (hits.length >= 12) break;
  }
  return NextResponse.json({provider:'duckduckgo',results:hits,verified:false,note:'Search index results only. Not an official Transfermarkt API, and fees or completed transfers are not inferred.'},{headers:{'Cache-Control':'no-store'}});
 }catch{
  return NextResponse.json({provider:'duckduckgo',results:[],status:'unavailable',verified:false},{status:502,headers:{'Cache-Control':'no-store'}});
 }
}
