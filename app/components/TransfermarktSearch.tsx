'use client';
import { useEffect, useState } from 'react';
type Hit={title:string;url:string;snippet:string;source:string};
export default function TransfermarktSearch({query}:{query:string}){
 const [results,setResults]=useState<Hit[]>([]);
 const [status,setStatus]=useState<'idle'|'loading'|'ready'|'error'>('idle');
 useEffect(()=>{
  const term=query.trim();
  if(term.length<2){setResults([]);setStatus('idle');return;}
  const controller=new AbortController();
  const timer=setTimeout(()=>{
   setStatus('loading');
   fetch('/api/transfermarkt-search?q='+encodeURIComponent(term),{signal:controller.signal,cache:'no-store'})
    .then(async response=>{if(!response.ok)throw new Error('search unavailable');return response.json() as Promise<{results?:Hit[]}>;})
    .then(data=>{if(!controller.signal.aborted){setResults(data.results||[]);setStatus('ready');}})
    .catch(()=>{if(!controller.signal.aborted){setResults([]);setStatus('error');}});
  },450);
  return()=>{clearTimeout(timer);controller.abort();};
 },[query]);
 if(status==='idle')return <p className="text-sm text-emerald-100/70">اكتب اسم لاعب أو نادٍ للبحث في صفحات ترانسفير ماركت المفهرسة بواسطة DuckDuckGo.</p>;
 return <section dir="rtl" className="mt-4 rounded-2xl border border-emerald-400/25 bg-emerald-950/60 p-4" style={{fontFamily:"'Cairo',sans-serif"}}>
  <h3 className="font-bold text-lg text-white">نتائج ترانسفير ماركت عبر DuckDuckGo</h3>
  <p className="text-xs text-emerald-100/70 mt-1 mb-3">هذه روابط بحث وليست بيانات صفقات مؤكدة. لا نستنتج منها قيمة الانتقال أو إتمامه.</p>
  {status==='loading'&&<p className="text-sm text-white">جارٍ البحث…</p>}
  {status==='error'&&<p className="text-sm text-amber-200">تعذر جلب النتائج الآن. جرّب لاحقاً.</p>}
  {status==='ready'&&!results.length&&<p className="text-sm text-white">لم تظهر نتائج مفهرسة لهذا البحث.</p>}
  <div className="grid gap-2">{results.map(hit=><a key={hit.url} href={hit.url} target="_blank" rel="noopener noreferrer" className="block rounded-xl border border-white/10 p-3 text-white hover:border-emerald-400/60">
   <b className="text-sm break-words">{hit.title}</b><span className="block text-xs text-emerald-300 mt-1">فتح صفحة ترانسفير ماركت ↗</span>
  </a>)}</div>
 </section>;
}
