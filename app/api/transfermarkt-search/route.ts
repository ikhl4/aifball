import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
type SearchHit = { title: string; url: string; snippet: string; source: 'Transfermarkt'; status: 'search_result_unverified' };

function clean(value: string) {
 return value.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();
}
async function rssFallback(term:string):Promise<SearchHit[]>{
 const rss='https://news.google.com/rss/search?q='+encodeURIComponent(term+' football transfers when:30d')+'&hl=en-US&gl=US&ceid=US:en';
 const response=await fetch(rss,{signal:AbortSignal.timeout(6500),cache:'no-store'});
 if(!response.ok)return [];
 const xml=await response.text();
 const results:SearchHit[]=[];
 for(const item of xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)){
  const field=(name:string)=>item[1].match(new RegExp('<'+name+'[^>]*>([\\s\\S]*?)</'+name+'>','i'))?.[1]||'';
  const title=clean(field('title'));
  const url=clean(field('link'));
  const date=Date.parse(clean(field('pubDate')));
  if(!title||!url.startsWith('https://news.google.com/')||!Number.isFinite(date)||Date.now()-date>30*86400000)continue;
  results.push({title,url,snippet:'خبر انتقالات منشور حديثاً',source:clean(field('source'))||'News',status:'search_result_unverified'});
  if(results.length>=8)break;
 }
 return results;
}
export async function GET(request: NextRequest) {
 const term = (request.nextUrl.searchParams.get('q') || '').trim();
 if (term.length < 2 || term.length > 80) return NextResponse.json({error:'query_length',results:[]},{status:400});
 const search = 'site:transfermarkt.com ' + term;
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
   if (hits.length >= 18) break;
  }
  const results=hits.length?hits:await rssFallback(term);
  return NextResponse.json({provider:hits.length?'duckduckgo':'news_fallback',results,verified:false},{headers:{'Cache-Control':'no-store'}});
 }catch{
  try {const results=await rssFallback(term);return NextResponse.json({provider:'news_fallback',results,verified:false},{headers:{'Cache-Control':'no-store'}});}catch{return NextResponse.json({results:[],status:'unavailable'},{headers:{'Cache-Control':'no-store'}});}
 }
}
