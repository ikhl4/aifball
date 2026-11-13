'use client';
import { useEffect, useState } from 'react';
import type { AppLanguage } from '../../lib/app-language';

type Entry = {rank:number; name:string; value:string; secondary?:string; logo?:string};
type Ranking = {title:string; metric:string; source:string; season?:string; entries:Entry[]};
const categories = [
  {id:'tennis', ar:'🎾 التنس', en:'🎾 Tennis', options:[['ATP','تصنيف الرجال ATP','ATP men'],['WTA','تصنيف السيدات WTA','WTA women']]},
  {id:'basketball', ar:'🏀 كرة السلة', en:'🏀 Basketball', options:[['NBA','الدوري الأمريكي NBA','NBA'],['WNBA','دوري السيدات WNBA','WNBA'],['CBK','دوري الجامعات','College basketball']]},
  {id:'motorsport', ar:'🏎️ سباقات السيارات', en:'🏎️ Motorsport', options:[['F1_DRIVERS','ترتيب السائقين','Driver standings'],['F1_TEAMS','ترتيب الفرق','Constructor standings']]},
  {id:'americanFootball', ar:'🏈 كرة القدم الأمريكية', en:'🏈 American football', options:[['NFL','دوري NFL','NFL'],['CFB','دوري الجامعات','College football']]},
  {id:'baseball', ar:'⚾ البيسبول', en:'⚾ Baseball', options:[['MLB','دوري MLB','MLB']]},
  {id:'hockey', ar:'🏒 هوكي الجليد', en:'🏒 Ice hockey', options:[['NHL','دوري NHL','NHL']]},
] as const;

export default function OtherSportsRankings({language='ar'}:{language?:AppLanguage}) {
  const tr=(ar:string,en:string)=>language==='ar'?ar:en;
  const [sport,setSport]=useState<string>('tennis');
  const current=categories.find(c=>c.id===sport)||categories[0];
  const [code,setCode]=useState<string>('ATP');
  const [ranking,setRanking]=useState<Ranking|null>(null);
  const [status,setStatus]=useState<'loading'|'ready'|'unavailable'>('loading');
  const [full,setFull]=useState(false);
  useEffect(()=>{
    const controller=new AbortController();
    setRanking(null);setFull(false);setStatus('loading');
    fetch('/api/other-sports-rankings?code='+encodeURIComponent(code),{signal:controller.signal})
      .then(async r=>{if(!r.ok)throw Error('Unavailable');return r.json() as Promise<Ranking>})
      .then(data=>{if(!controller.signal.aborted){setRanking(data);setStatus(data.entries?.length?'ready':'unavailable')}})
      .catch(()=>{if(!controller.signal.aborted)setStatus('unavailable')});
    return ()=>controller.abort();
  },[code]);
  const selectSport=(id:string)=>{
    setSport(id);
    const selected=categories.find(s=>s.id===id);
    if(selected)setCode(selected.options[0][0]);
  };
  return <section dir={language==='ar'?'rtl':'ltr'} className="space-y-3 font-cairo">
    <header><h3 className="text-lg font-extrabold">{tr('جداول وتصنيفات الرياضات الأخرى','Other sports standings & rankings')}</h3>
      <p className="mt-1 text-xs opacity-70">{tr('اختر الرياضة والبطولة لعرض الترتيب المتاح بالعربية. النتائج من مصادر خارجية.','Select a sport and competition for available rankings.')}</p></header>
    <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-3" role="group" aria-label={tr('الرياضة','Sport')}>
      {categories.map(s=><button key={s.id} type="button" aria-pressed={sport===s.id} onClick={()=>selectSport(s.id)}
        className={`min-h-10 rounded-lg border px-1 py-2 text-[11px] font-bold leading-tight sm:text-sm ${sport===s.id?'border-emerald-600 bg-emerald-700 text-white':'border-emerald-700/30 hover:bg-emerald-500/10'}`}>{tr(s.ar,s.en)}</button>)}
    </div>
    <label className="block text-sm font-semibold">{tr('اختر التصنيف أو الدوري','Competition / ranking')}
      <select value={code} onChange={e=>setCode(e.target.value)} className="mt-1.5 w-full rounded-lg border border-emerald-600/30 bg-white px-3 py-2 text-sm text-gray-900 dark:bg-[#16261e] dark:text-white">
        {current.options.map(([id,ar,en])=><option key={id} value={id}>{tr(ar,en)}</option>)}
      </select>
    </label>
    <div className="overflow-hidden rounded-2xl border border-emerald-700/25">
      {status==='loading'&&<p role="status" className="p-4 text-sm">{tr('جارٍ جلب التصنيف من المصدر…','Loading rankings…')}</p>}
      {status==='unavailable'&&<p role="status" className="p-4 text-sm">{tr('التصنيف غير متاح من المصدر حاليًا. لا نعرض جداول تقديرية أو وهمية.','This ranking is currently unavailable from the provider. No fabricated data is shown.')}</p>}
      {status==='ready'&&ranking&&<>
        <div className="flex flex-wrap items-center justify-between gap-2 bg-emerald-700/10 p-3">
          <div><h4 className="font-bold">{tr(ranking.title, current.options.find(o=>o[0]===code)?.[2]||code)}</h4><p className="text-xs opacity-70">{tr('المصدر: ','Source: ')}{ranking.source} {ranking.season?'· '+ranking.season:''}</p></div>
          <span className="text-xs font-bold">{tr(ranking.metric,code==='ATP'||code==='WTA'||code.startsWith('F1_')?'Points':'W-L')}</span>
        </div>
        <div className="grid grid-cols-[24px_minmax(0,1fr)_auto] gap-1.5 bg-emerald-900/10 px-2 py-1.5 text-[11px] font-bold">
          <span>#</span><span>{tr('الاسم / الفريق','Name / team')}</span><span>{tr(ranking.metric,'Value')}</span>
        </div>
        {(full?ranking.entries:ranking.entries.slice(0,10)).map(item=><div key={item.rank+'-'+item.name} className="grid grid-cols-[24px_minmax(0,1fr)_auto] items-center gap-1.5 border-t border-emerald-700/15 px-2 py-2 text-xs sm:text-sm">
          <bdi className="font-bold text-emerald-500">{item.rank}</bdi>
          <div className="flex min-w-0 items-center gap-2">{item.logo&&<img alt="" src={item.logo} className="h-5 w-5 shrink-0 object-contain"/>}
            <span className="min-w-0"><span dir="auto" className="block truncate font-semibold">{item.name}</span>{item.secondary&&<span dir="auto" className="block truncate text-[11px] opacity-60">{item.secondary}</span>}</span>
          </div>
          <bdi dir="ltr" className="whitespace-nowrap font-bold tabular-nums">{item.value}</bdi>
        </div>)}
        {ranking.entries.length>10&&<button type="button" className="w-full border-t border-emerald-700/15 px-2 py-2 text-xs font-bold text-emerald-500" onClick={()=>setFull(!full)}>{full?tr('عرض أقل','Show less'):tr('عرض الجدول كامل','Show full table')}</button>}
      </>}
    </div>
  </section>;
}
