'use client';

import { useEffect, useMemo, useState } from 'react';

type Hit = { title: string; url: string; snippet: string; source: string };
type Story = Hit & { section: string; league: string; id: string };
type Section = 'winter' | 'summer' | 'clubs';
const sections: Record<Section, { label: string; intro: string; topics: { title: string; league: string; q: string }[] }> = {
 winter: { label: 'يناير 2027', intro: 'أخبار واهتمامات سوق الشتاء القادم — ليست صفقات مكتملة حتى يثبت الإعلان الرسمي.', topics: [
  {title:'برشلونة',league:'الإسباني',q:'Barcelona January 2027 transfer rumours news'},
  {title:'ريال مدريد',league:'الإسباني',q:'Real Madrid January 2027 transfer rumours'},
  {title:'الدوري الإسباني',league:'الإسباني',q:'La Liga winter 2027 transfer rumours'},
  {title:'بايرن ميونخ',league:'الألماني',q:'Bayern Munich January 2027 transfer rumours'},
  {title:'الدوري الألماني',league:'الألماني',q:'Bundesliga winter 2027 transfer rumours'},
  {title:'الدوري الإنجليزي',league:'الإنجليزي',q:'Premier League January 2027 transfer rumours'},
  {title:'الدوري السعودي',league:'السعودي',q:'Saudi Pro League January 2027 transfer rumours'},
  {title:'إيطاليا وفرنسا',league:'الإيطالي',q:'Serie A Ligue 1 January 2027 transfer rumours'}
 ]},
 summer: {label:'أبرز صفقات الصيف',intro:'أرشيف صيف 2026 حسب الدوريات. النتائج روابط للمراجعة، ولا تعني أن كل رابط يؤكد صفقة.',topics:[
  {title:'صفقات روشن',league:'السعودي',q:'Saudi Pro League transfers 2026 2027 arrivals'},
  {title:'صفقات برشلونة',league:'الإسباني',q:'FC Barcelona transfers 2026 2027'},
  {title:'صفقات ريال مدريد',league:'الإسباني',q:'Real Madrid transfers 2026 2027'},
  {title:'أبرز صفقات إسبانيا',league:'الإسباني',q:'La Liga top transfers summer 2026'},
  {title:'أبرز صفقات ألمانيا',league:'الألماني',q:'Bundesliga top transfers summer 2026'},
  {title:'أبرز صفقات إنجلترا',league:'الإنجليزي',q:'Premier League top transfers summer 2026'},
  {title:'أبرز صفقات إيطاليا',league:'الإيطالي',q:'Serie A top transfers summer 2026'},
  {title:'أبرز صفقات فرنسا',league:'الفرنسي',q:'Ligue 1 top transfers summer 2026'}
 ]},
 clubs: {label:'الأندية واللاعبون',intro:'استكشف مستجدات النادي واللاعب عبر فهرس ترانسفير ماركت، مع الرجوع للمصدر قبل اعتماد التفاصيل.',topics:[
  {title:'برشلونة',league:'الإسباني',q:'Barcelona latest transfer news 2026'},
  {title:'ريال مدريد',league:'الإسباني',q:'Real Madrid latest transfer news 2026'},
  {title:'أتلتيكو مدريد',league:'الإسباني',q:'Atletico Madrid latest transfers 2026'},
  {title:'بايرن ميونخ',league:'الألماني',q:'Bayern Munich latest transfers 2026'},
  {title:'بوروسيا دورتموند',league:'الألماني',q:'Borussia Dortmund latest transfers 2026'},
  {title:'الاتحاد',league:'السعودي',q:'Al Ittihad Jeddah latest transfers 2026'},
  {title:'الهلال',league:'السعودي',q:'Al Hilal Riyadh latest transfers 2026'},
  {title:'أرسنال',league:'الإنجليزي',q:'Arsenal latest transfers 2026'}
 ]}
};
const leagues = ['الكل','السعودي','الإنجليزي','الإسباني','الألماني','الإيطالي','الفرنسي'];
const perPage = 8;
function normalize(value:string){return value.toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();}
export default function TransfersPreview(){
 const [section,setSection]=useState<Section>('winter');
 const [league,setLeague]=useState('الكل');
 const [query,setQuery]=useState('');
 const [page,setPage]=useState(1);
 const [stories,setStories]=useState<Story[]>([]);
 const [loading,setLoading]=useState(false);
 const [failed,setFailed]=useState(0);
 const [refresh,setRefresh]=useState(0);
 useEffect(()=>{
  const controller=new AbortController();
  const timer=setTimeout(async()=>{
   setLoading(true);setStories([]);setFailed(0);
   const topics=query.trim().length>1
    ? [{title:'نتائج البحث',league:'الكل',q:query.trim()+' transfer 2026 2027'}]
    : sections[section].topics;
   const responses=await Promise.allSettled(topics.map(async topic=>{
    const response=await fetch('/api/transfermarkt-search?q='+encodeURIComponent(topic.q),{signal:controller.signal,cache:'no-store'});
    if(!response.ok)throw Error('search unavailable');
    const data=await response.json() as {results?:Hit[]};
    return (data.results||[]).slice(0,query.trim()?18:5).map(hit=>({...hit,section:topic.title,league:topic.league,id:hit.url}));
   }));
   if(controller.signal.aborted)return;
   const unique=new Map<string,Story>();
   for(const result of responses)if(result.status==='fulfilled')for(const story of result.value){
    const key=story.url.split('?')[0];
    if(!unique.has(key))unique.set(key,story);
   }
   setStories([...unique.values()]);
   setFailed(responses.filter(result=>result.status==='rejected').length);
   setLoading(false);
  },query.trim()?500:100);
  return()=>{clearTimeout(timer);controller.abort();};
 },[section,query,refresh]);
 const filtered=useMemo(()=>stories.filter(story=>league==='الكل'||story.league===league||story.league==='الكل'),[stories,league]);
 const pages=Math.max(1,Math.ceil(filtered.length/perPage));
 const shown=filtered.slice((page-1)*perPage,page*perPage);
 const switchSection=(next:Section)=>{setSection(next);setLeague('الكل');setQuery('');setPage(1);};
 return <main dir="rtl" className="min-h-screen bg-[#07140e] text-white" style={{fontFamily:"'Cairo',sans-serif"}}>
  <div className="mx-auto max-w-6xl px-4 sm:px-6 py-7 sm:py-12">
   <header className="flex items-center justify-between gap-3 border-b border-emerald-300/15 pb-5">
    <a href="/" className="text-emerald-300 font-bold text-sm">AiFBall · فوتبلاي</a>
    <a href="/" className="rounded-xl border border-emerald-300/30 px-3 py-2 text-sm">العودة للرئيسية</a>
   </header>
   <div className="pt-9 pb-7">
    <span className="text-sm font-bold text-lime-300">مركز الانتقالات العالمي · موسم 2026/27</span>
    <h1 className="text-3xl sm:text-5xl font-black mt-3 leading-tight">سوق الانتقالات، <span className="text-lime-300">بصورة أشمل.</span></h1>
    <p className="mt-3 text-emerald-100/75 max-w-2xl text-sm sm:text-base leading-8">ملفات الأندية، أبرز صفقات الصيف، واستعدادات يناير. روابط من ترانسفير ماركت عبر DuckDuckGo، مع تمييز واضح بين البحث والتحقق من الصفقات.</p>
   </div>
   <nav aria-label="أقسام الانتقالات" className="grid grid-cols-3 gap-2 mb-6">
    {(Object.keys(sections) as Section[]).map(key=><button key={key} onClick={()=>switchSection(key)} className={'rounded-xl border px-2 py-3 font-bold text-xs sm:text-base '+(section===key?'bg-lime-300 text-emerald-950 border-lime-300':'bg-emerald-950/60 border-white/15 text-white')}>{sections[key].label}</button>)}
   </nav>
   <section className="rounded-2xl bg-emerald-900/30 border border-emerald-300/15 p-4 sm:p-6 mb-6">
    <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
     <div><h2 className="text-xl sm:text-2xl font-black">{sections[section].label}</h2><p className="text-sm text-emerald-100/70 mt-1">{sections[section].intro}</p></div>
     <button className="rounded-lg border border-emerald-300/40 px-3 py-2 text-sm text-emerald-200" onClick={()=>{setPage(1);setRefresh(n=>n+1);}}>تحديث النتائج</button>
    </div>
    <label htmlFor="transfer-search" className="block text-sm mb-2 font-bold">ابحث عن لاعب أو نادٍ</label>
    <input id="transfer-search" type="search" value={query} onChange={e=>{setQuery(e.target.value);setPage(1);}} placeholder="برشلونة، الاتحاد، بايرن ميونخ، اسم لاعب..." className="w-full bg-[#0a2118] border border-emerald-300/25 rounded-xl p-3.5 text-white placeholder:text-emerald-100/50 outline-none focus:border-lime-300"/>
    <div className="flex gap-2 overflow-x-auto py-4" aria-label="فلترة حسب الدوري">{leagues.map(item=><button key={item} onClick={()=>{setLeague(item);setPage(1);}} className={'shrink-0 rounded-full border px-3 py-1.5 text-xs '+(league===item?'bg-emerald-300 text-emerald-950 border-emerald-300':'border-white/20 text-emerald-100')}>{item}</button>)}</div>
    <div className="flex flex-wrap justify-between gap-2 text-xs text-emerald-100/65"><span>{loading?'جارٍ البحث...':filtered.length+' نتيجة مفهرسة'} · {failed?'بعض المصادر لم تستجب':''}</span><span>المصدر: فهرس DuckDuckGo لصفحات Transfermarkt</span></div>
   </section>
   <section aria-live="polite">
    {loading?<div className="rounded-xl border border-white/10 p-10 text-center">جارٍ جلب نتائج الانتقالات…</div>:shown.length?<div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
     {shown.map((story,index)=><article key={story.id} className="rounded-2xl border border-emerald-300/15 bg-[#10231a] p-4 sm:p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2"><span className="text-xs text-lime-300 font-bold">{story.section}</span><span className="text-xs text-emerald-100/60">{story.league}</span></div>
      <h3 className="text-base sm:text-lg font-bold leading-8 break-words" dir="auto">{story.title}</h3>
      <p className="text-xs text-amber-200/90">نتيجة بحث · حالة الصفقة وقيمتها غير متحققتين</p>
      <a href={story.url} target="_blank" rel="noopener noreferrer" className="mt-auto text-sm text-emerald-300 font-bold underline underline-offset-4">عرض المصدر في ترانسفير ماركت ↗</a>
     </article>)}
    </div>:<div className="rounded-xl border border-white/10 p-8 text-center text-emerald-100/80">لا توجد نتائج مفهرسة مطابقة حالياً. جرّب اسماً آخر أو تحديث النتائج.</div>}
    {!loading&&pages>1&&<div className="flex items-center justify-center flex-wrap gap-3 mt-7">
     <button disabled={page===1} onClick={()=>setPage(n=>Math.max(1,n-1))} className="rounded-lg border border-white/20 px-4 py-2 disabled:opacity-30">السابق</button>
     <span className="text-sm">صفحة {page} من {pages}</span>
     <button disabled={page>=pages} onClick={()=>setPage(n=>Math.min(pages,n+1))} className="rounded-lg border border-white/20 px-4 py-2 disabled:opacity-30">التالي</button>
    </div>}
   </section>
   <footer className="border-t border-white/10 mt-12 pt-5 text-xs leading-7 text-emerald-100/65">هذه واجهة اكتشاف أخبار وصفحات انتقالات وليست قاعدة صفقات رسمية. فهرسة DuckDuckGo لا تؤكد توقيت الخبر أو إتمام الانتقال، ولا تُستخدم لاختلاق رسوم انتقال أو صور لاعبين. التحقق النهائي من إعلان النادي أو رابطة الدوري أو مصدر موثوق.</footer>
  </div>
 </main>;
}
