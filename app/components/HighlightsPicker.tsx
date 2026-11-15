'use client';

import { useEffect, useMemo, useState } from 'react';
import { footballLeagues, type FootballBoard, type FootballEvent } from '../../lib/football-scoreboard';
import { footballNameInArabic } from '../../lib/football-names-ar';
import type { AppLanguage } from '../../lib/app-language';

type Match = { id: string; code: string; date: string; names: string[]; englishNames: string[]; score: string; status: 'final'|'live'|'scheduled' };
const competitions = new Map<string, { ar:string; en:string }>(footballLeagues.map(([code,ar,en])=>[code,{ar,en}]));
const national = /Saudi Arabia|France|Spain|England|Portugal|Germany|Brazil|Argentina|Italy|Belgium|Netherlands|Croatia|Morocco|Türkiye|Turkey|Uruguay|Japan|South Korea|السعودية|فرنسا|اسبانيا|إنجلترا|البرتغال|ألمانيا|البرازيل|الأرجنتين|إيطاليا|بلجيكا|هولندا|كرواتيا|المغرب/i;
const bigTeams = /Real Madrid|Barcelona|Man City|Manchester|Arsenal|Liverpool|Chelsea|Bayern|PSG|Paris Saint|Juventus|Inter Milan|AC Milan|Al Hilal|Al Nassr|Al Ittihad|Al Ahli|الهلال|النصر|الاتحاد|الأهلي/i;
const importantLeagues:Record<string,number> = {'uefa.nations':145,'fifa.friendly':115,'fifa.world':155,'fifa.worldq.uefa':135,'fifa.worldq.afc':132,'uefa.champions':125,'afc.champions':110,'ksa.1':108,'eng.1':105,'esp.1':100,'ita.1':95,'ger.1':95,'fra.1':90,'uefa.europa':90,'uefa.europa.conf':85};
const dateKey=(d:Date)=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Riyadh',year:'numeric',month:'2-digit',day:'2-digit'}).format(d);
function toMatches(data: FootballBoard, day: 'today'|'yesterday'): Match[] {
  const expected=dateKey(new Date(Date.now()+(day==='today'?0:-86400000)));
  const seen=new Set<string>(), result:Match[]=[];
  for(const [code,events] of Object.entries(data.matches||{})) {
    // ESPN's 'all' feed mixes youth, women's, regional and unrelated
    // competitions without a reliable league ID. Never promote those games as
    // yesterday's biggest highlights or mislabel them as senior men's football.
    if(code === 'all' || !competitions.has(code)) continue;
    for(const e of events as FootballEvent[]) {
      if(!e.id||!e.date||dateKey(new Date(e.date))!==expected)continue;
      const sides=e.competitions?.[0]?.competitors||[];
      const teams=['home','away'].map(key=>sides.find(s=>s.homeAway===key));
      if(teams.some(x=>!x?.team))continue;
      const englishNames=teams.map(t=>t?.team?.displayName||t?.team?.name||'');
      if(englishNames.some(x=>!x))continue;
      // Only surface fixtures whose calendar day is confirmed in Riyadh.
      if(!e.date || dateKey(new Date(e.date))!==expected)continue;
      const names=englishNames.map(x=>footballNameInArabic(x)||x);
      const key=englishNames.map(n=>n.toLowerCase()).sort().join('|')+'|'+e.date;
      if(seen.has(key))continue;seen.add(key);
      const raw=e.status?.type?.state;
      const status:Match['status']=raw==='post'||/FINAL/i.test(e.status?.type?.name||'')?'final':raw==='in'?'live':'scheduled';
      if(day==='yesterday'&&status!=='final')continue;
      const score=teams.every(t=>t?.score!=null)?teams.map(t=>t?.score).join(' - '):'';
      result.push({id:e.id,code,date:e.date,names,englishNames,score,status});
    }
  }
  return result;
}
function matchWeight(m:Match):number {
  const teams=m.englishNames.join(' ');
  const powers=m.englishNames.filter(n=>national.test(n)).length;
  return (importantLeagues[m.code]||30)+powers*24+(bigTeams.test(teams)?35:0)+(m.status==='live'?8:0);
}

export default function HighlightsPicker({ language='ar', isDark=true, onRequest, onMatch, disabled=false }:{
  language?: AppLanguage;isDark?:boolean;onRequest:(query:string)=>void;onMatch?:(match:{home:string;away:string;date:string;competition:string;display:string;status:'final'|'live'|'scheduled'})=>void;disabled?:boolean;
}) {
  const t=(ar:string,en:string)=>language==='ar'?ar:en;
  const [day,setDay]=useState<'today'|'yesterday'>('today');
  const [matches,setMatches]=useState<Match[]>([]);
  const [pending,setPending]=useState(true);
  const [error,setError]=useState(false);
  const [showAll,setShowAll]=useState(false);
  const [custom,setCustom]=useState('');
  useEffect(()=>{
    const controller=new AbortController();
    let active=true;
    const load=async()=>{
      setPending(true);setError(false);setMatches([]);
      try{
        const response=await fetch('/api/espn?league=all&grouped=1&date='+day,{signal:controller.signal});
        if(!response.ok)throw Error('Schedule unavailable');
        const data:FootballBoard=await response.json();
        if(active){setMatches(toMatches(data,day));setPending(false);}
      }catch{if(active){setPending(false);setError(true);}}
    };
    void load();
    return ()=>{active=false;controller.abort();};
  },[day]);
  const sorted=useMemo(()=>[...matches].sort((a,b)=>matchWeight(b)-matchWeight(a)||a.date.localeCompare(b.date)),[matches]);
  const chosen=showAll?sorted:sorted.slice(0,6);
  const send=(m:Match)=>{
    const names=language==='ar'?m.names:m.englishNames;
    const fixture=names.join(language==='ar'?' ضد ':' vs ');
    const league=competitions.get(m.code);
    const comp=language==='ar'?league?.ar||m.code:league?.en||m.code;
    const date=dateKey(new Date(m.date));
        if(onMatch) {
      onMatch({home:m.englishNames[0],away:m.englishNames[1],date,competition:comp,
        display:language==='ar'?'ملخص '+fixture:'Highlights: '+fixture,status:m.status});
      return;
    }
    onRequest(language==='ar'?'ملخص '+fixture+' '+date:'Highlights '+fixture+' '+date);
  };
  const customSend=()=>{
    const value=custom.trim().slice(0,180);
    if(!value)return;
    onRequest(language==='ar'?'ملخص مباراة '+value:'Match highlights '+value);
  };
  return <section dir={language==='ar'?'rtl':'ltr'} className="space-y-3 p-3 sm:p-4">
    <p className="text-xs opacity-75">{t('اضغط على المباراة، وفوتبلاي يبحث عن ملخصها داخل المحادثة.','Tap a match and AiFBall will search for its highlights in chat.')}</p>
    <div role="group" aria-label={t('اختر اليوم','Choose day')} className="grid grid-cols-2 gap-2">
      {(['today','yesterday'] as const).map(value=><button type="button" key={value} onClick={()=>{setDay(value);setShowAll(false);}}
        aria-pressed={day===value} className={`rounded-xl border px-3 py-2.5 text-sm font-bold ${day===value?'border-emerald-600 bg-emerald-700 text-white':isDark?'border-emerald-600/40 text-white':'border-emerald-700/20 text-emerald-900'}`}>
        {value==='today'?t('مباريات اليوم','Today’s matches'):t('ملخصات أمس','Yesterday’s highlights')}
      </button>)}
    </div>
    {pending&&<p role="status" className="py-3 text-sm">{t('جارٍ جلب المباريات…','Loading fixtures…')}</p>}
    {error&&<p role="alert" className="py-3 text-sm">{t('تعذر جلب المباريات حاليًا، يمكنك طلب مباراة بالاسم أدناه.','Fixtures unavailable; search for a match below.')}</p>}
    {!pending&&!error&&!sorted.length&&<p className="py-3 text-sm">{t('لا توجد مباريات مؤكدة لهذا اليوم ضمن التغطية.','No verified matches for this day in the current coverage.')}</p>}
    <div className="grid gap-2 sm:grid-cols-2">
      {chosen.map(m=>{
        const league=competitions.get(m.code);
        const name=(language==='ar'?m.names:m.englishNames).join(' × ');
        return <button type="button" key={m.id+'-'+m.code} disabled={disabled} onClick={()=>send(m)}
          className={`min-w-0 rounded-xl border p-3 text-start disabled:opacity-50 ${isDark?'border-emerald-500/25 bg-emerald-950/45 text-white hover:bg-emerald-900/40':'border-emerald-600/20 bg-white text-slate-900 hover:bg-emerald-50'}`}>
          <div className="flex items-center justify-between gap-2 text-[11px] opacity-65"><span className="truncate">{language==='ar'?league?.ar||m.code:league?.en||m.code}</span><span className="shrink-0">{m.status==='final'?t('انتهت','FT'):m.status==='live'?t('مباشر','Live'):new Intl.DateTimeFormat(language==='ar'?'ar-SA':'en-GB',{timeZone:'Asia/Riyadh',hour:'numeric',minute:'2-digit'}).format(new Date(m.date))}</span></div>
          <div className="mt-1 flex items-center justify-between gap-2"><bdi dir="auto" className="min-w-0 flex-1 text-sm font-bold">{name}</bdi><bdi className="shrink-0 text-sm font-bold">{m.score}</bdi></div>
          <div className="mt-2 text-xs font-bold text-emerald-500">{m.status==='final'?t('▶ ابحث عن الملخص','▶ Search highlights'):t('▶ تفاصيل المباراة والملخص بعد انتهائها','▶ Match details; highlights after FT')}</div>
        </button>;
      })}
    </div>
    {sorted.length>6&&<button type="button" onClick={()=>setShowAll(!showAll)} className="w-full rounded-xl border border-emerald-500/25 p-2 text-sm font-bold text-emerald-500">
      {showAll?t('عرض أبرز المباريات فقط','Show featured only'):t('عرض جميع مباريات اليوم','View all matches')}
    </button>}
    <div className="space-y-2 border-t border-emerald-500/15 pt-3">
      <label htmlFor="highlight-custom-match" className="block text-sm font-bold">{t('اطلب ملخص أي مباراة','Find any match highlights')}</label>
      <div className="flex gap-2">
        <input id="highlight-custom-match" value={custom} onChange={e=>setCustom(e.target.value)} maxLength={180}
          onKeyDown={e=>{if(e.key==='Enter'&&!e.nativeEvent.isComposing){e.preventDefault();customSend();}}}
          placeholder={t('مثال: ريال مدريد ضد برشلونة أمس','e.g. Real Madrid vs Barcelona yesterday')}
          className={`min-w-0 flex-1 rounded-xl border px-3 py-2 text-sm outline-none ${isDark?'border-emerald-500/25 bg-emerald-950/50 text-white placeholder:text-gray-400':'border-emerald-700/25 bg-white text-slate-900'}`}/>
        <button type="button" disabled={disabled||!custom.trim()} onClick={customSend} className="rounded-xl bg-emerald-700 px-3 py-2 text-xs font-bold text-white disabled:opacity-40">{t('ابحث','Search')}</button>
      </div>
      <button type="button" disabled={disabled} onClick={()=>onRequest(t('ما أبرز مباراة انتهت أمس؟ تحقق من نتائج أهم المباريات ثم ابحث عن ملخصها الرسمي واعرضه إن توفر.','Which was yesterday’s biggest completed match? Verify the result and find its official highlights if available.'))}
        className="text-xs font-semibold text-emerald-500 underline disabled:opacity-50">{t('اسأل فوتبلاي عن أبرز مباراة أمس','Ask about yesterday’s biggest match')}</button>
    </div>
  </section>;
}
