'use client';
import {matchNameInArabic, matchNumberInArabic, matchDateInArabic} from '../../lib/match-display-ar';
import {footballLeagues} from '../../lib/football-scoreboard';
import { matchNarrative,uniquePlayer } from '../../lib/match-narrative';
import { sofaMatchId } from '../../lib/spatial-report';
import Scores365Report from './Scores365Report';
import MatchVisualReport, { visualFromEspn } from './MatchVisualReport';
import {scores365Identity} from '../../lib/scores365-report';
import AdvancedMatchData from './AdvancedMatchData';
import React,{useEffect,useRef,useState} from 'react';
import { COMPETITIONS } from '../../lib/competitions';
import XPostEmbed from './XPostEmbed';
import MatchPlayerHeatmap from './MatchPlayerHeatmap';
import MatchStatisticsBoard from './MatchStatisticsBoard';
import FootballTeamBadge from './FootballTeamBadge';
import { reportIdentity,type DetailedMatchReport } from '../../lib/match-report';
const leagues=[...new Map([...footballLeagues.map(([id,ar])=>[id,ar] as [string,string]),...Object.entries(COMPETITIONS).map(([id,c])=>[id,c.ar] as [string,string])])];
type MatchReportProps = {
 matchName:string; isDark?:boolean; autoMatchUrl?:string; eventId?:string; leagueCode?:string;
 homeLogo?:string|null; awayLogo?:string|null; playerName?:string; clipUrl?:string; embedded?:boolean; refresh?:boolean; initialView?:'analysis'|'overview';
};
export default function MatchReport(props: MatchReportProps){
 let report:React.ReactNode;
 if(props.autoMatchUrl&&scores365Identity(props.autoMatchUrl))report=<Scores365Report matchUrl={props.autoMatchUrl} playerName={props.playerName} isDark={props.isDark}/>;
 else if(props.autoMatchUrl&&/^https:\/\/(?:www\.)?365scores\.com\//i.test(props.autoMatchUrl))report=<p className="my-4 text-amber-500">يلزم رابط مباراة 365Scores محددة يتضمن معرّفها؛ لم نعرض مواجهة بديلة.</p>;
 else if(props.autoMatchUrl&&sofaMatchId(props.autoMatchUrl))report=<AdvancedMatchData autoMatchUrl={props.autoMatchUrl} playerName={props.playerName} isDark={props.isDark}/>;
 else report=<EspnMatchReport {...props}/>;
 return <>{report}{props.clipUrl&&props.playerName&&<XPostEmbed url={props.clipUrl} playerName={props.playerName} isDark={props.isDark}/>}</>;
}
function EspnMatchReport({matchName,isDark=true,autoMatchUrl,eventId,leagueCode,homeLogo,awayLogo,playerName,embedded=false,refresh=false,initialView='overview'}:MatchReportProps){
 const identity=autoMatchUrl?reportIdentity(autoMatchUrl):null;
 const [league,setLeague]=useState(leagueCode||identity?.league||'esp.1'),[date,setDate]=useState(''),[event,setEvent]=useState(eventId||identity?.event||'');
 const [sourceData,setData]=useState<DetailedMatchReport|null>(null),[loading,setLoading]=useState(false),[error,setError]=useState(''),[choices,setChoices]=useState<{event:string;league:string;name:string;date:string|null}[]|null>(null),[tab,setTab]=useState(initialView as string),[player,setPlayer]=useState<string|null>(null);
 const active=useRef<AbortController|null>(null),generation=useRef(0);
 useEffect(()=>{setEvent(eventId||identity?.event||'');setLeague(leagueCode||identity?.league||'esp.1');setData(null);setChoices(null);setPlayer(null);setError('');},[matchName,autoMatchUrl,eventId,leagueCode,playerName]);
 const load=async(search:boolean,chosenEvent=event,chosenLeague=league,searchDate=date,background=false)=>{
 if(background && active.current)return;
 active.current?.abort();const c=new AbortController();active.current=c;const id=++generation.current;
 if(!background){setLoading(true);setError('');setData(null);setPlayer(null);if(search)setChoices(null);}
 try{const params=new URLSearchParams({league:chosenLeague,...(search?{action:'search',date:searchDate}:{event:chosenEvent})});const r=await fetch('/api/match-report?'+params,{signal:c.signal});const d=await r.json();if(!r.ok)throw Error(d.error||'تعذر الجلب');if(id!==generation.current)return;if(search)setChoices(d.matches);else{setData(d);setError('');if(background)return;setChoices(null);const players=[...d.home.players.map((p:any)=>({...p,teamId:d.home.id})),...d.away.players.map((p:any)=>({...p,teamId:d.away.id}))];const picked=uniquePlayer(players,playerName);setPlayer(picked?`${picked.teamId}:${picked.id}`:null);setTab(picked?'lineup':initialView);}}
 catch(e){if(!c.signal.aborted&&id===generation.current)setError(e instanceof Error?e.message:'تعذر الاتصال');}finally{if(id===generation.current){active.current=null;setLoading(false);}}
 };
 useEffect(()=>{
  active.current?.abort();
  active.current=null;
  generation.current++;
  setLoading(false);
  setData(null);
  const targetEvent=eventId||identity?.event;
  const targetLeague=leagueCode||identity?.league;
  if(targetEvent&&targetLeague)void load(false,targetEvent,targetLeague);
  const timer=refresh&&targetEvent&&targetLeague
   ? window.setInterval(()=>void load(false,targetEvent,targetLeague,'',true),30000)
   : undefined;
  return()=>{active.current?.abort();active.current=null;generation.current++;window.clearInterval(timer);};
 },[matchName,autoMatchUrl,eventId,leagueCode,playerName,refresh,initialView]);
 const theme=isDark?'bg-[#091812] text-gray-100 border-emerald-900/60':'bg-white text-gray-900 border-emerald-200';
 const button='px-4 py-2 rounded-xl border border-emerald-600/40 text-sm disabled:opacity-40';
 const data=sourceData&&{...sourceData,home:{...sourceData.home,name:matchNameInArabic(sourceData.home.name)},away:{...sourceData.away,name:matchNameInArabic(sourceData.away.name)}};
 const allPlayers=data?[...data.home.players.map(p=>({...p,team:data.home.name,teamId:data.home.id})),...data.away.players.map(p=>({...p,team:data.away.name,teamId:data.away.id}))]:[];
 const selected=allPlayers.find(p=>`${p.teamId}:${p.id}`===player);
 const selectedSide=selected?.teamId===data?.away.id?'away':'home';
 const localCompetition=data&&(COMPETITIONS[data.league]?.ar||footballLeagues.find(([id])=>id===data.league)?.[1]||matchNameInArabic(data.competition||'البطولة غير متاحة'));
 return <section dir="rtl" aria-label="تقرير المباراة التفصيلي" className={`my-5 w-full rounded-3xl border overflow-hidden ${theme}`}>
 <header className={`border-b border-emerald-600/25 p-4 sm:p-5 ${isDark ? "bg-[#102d22]" : "bg-emerald-50"}`}><h2 className="font-black text-lg sm:text-xl">{matchName}</h2></header>
 {!embedded&&<details className="m-4"><summary className="text-xs cursor-pointer text-emerald-500">اختيار مباراة أخرى بالتاريخ (اختياري)</summary><form className="p-4 flex flex-wrap gap-3" onSubmit={e=>{e.preventDefault();const selectedDate=String(new FormData(e.currentTarget).get('matchDate')||'');void load(true,event,league,selectedDate);}}><label className="text-xs">البطولة<select aria-label="بطولة التقرير" className={`block p-2 rounded-lg border mt-1 ${theme}`} value={league} onChange={e=>{active.current?.abort();generation.current++;setLoading(false);setData(null);setLeague(e.target.value);setEvent('');setChoices(null);}}>{leagues.map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label><label className="text-xs">تاريخ المباراة<input name="matchDate" aria-label="تاريخ المباراة" required type="date" defaultValue="" onChange={e=>{active.current?.abort();generation.current++;setLoading(false);setChoices(null);setDate(e.target.value);}} className={`block p-2 rounded-lg border mt-1 ${theme}`}/></label><button className={button} disabled={loading} type="submit">البحث عن المباراة</button></form></details>}
 {identity?.event&&!leagueCode&&!identity.league&&<div className="px-4 pb-3"><p className="text-xs mb-2">الرابط يحدد المباراة؛ حدد بطولتها ثم افتح التقرير.</p><button className={button} disabled={loading} onClick={()=>void load(false)}>فتح المباراة المرتبطة</button></div>}
 {loading&&<p role="status" className="p-5 text-emerald-500">جارٍ التحقق من المباراة وجلب التقرير…</p>}{error&&<p role="alert" className="p-4 text-amber-500">{error}</p>}
 {choices&&<div className="p-4 space-y-2"><p className="text-xs opacity-70">اختر المواجهة المقصودة؛ لا يتم اختيار أول نتيجة تلقائياً.</p>{choices.length===0&&<p>لا توجد مباريات لهذا التاريخ في استجابة المصدر.</p>}{choices.map(c=><button key={c.event} className={button+' w-full text-right'} onClick={()=>{setEvent(c.event);void load(false,c.event,c.league);}}>{matchNameInArabic(c.name)} · {matchDateInArabic(c.date)}</button>)}</div>}
 {!loading&&!data&&!choices&&!error&&<p className="p-5 text-sm leading-8">لم تصل هوية مباراة مؤكدة للعرض البصري. يمكنك متابعة السؤال داخل الشات لتحديد المواجهة.</p>}
 {data&&playerName&&!uniquePlayer(allPlayers,playerName)&&<p role="status" className="p-4 text-amber-500">لم يتطابق اسم اللاعب مع قائمة المباراة بشكل فريد؛ لم نختر لاعباً آخر.</p>}
 {data&&<><div className={`p-4 sm:p-6 text-center ${isDark ? "bg-gradient-to-bl from-[#164835] to-[#0c241b]" : "bg-gradient-to-bl from-emerald-100 to-white"}`}>
  <p className="text-xs opacity-70">{localCompetition} · {matchDateInArabic(data.date)} · {data.state==='post'?'انتهت':data.state==='in'?'جارية':data.state==='pre'?'لم تبدأ':'حالة المباراة غير متاحة'}</p>
  <div className="mt-4 grid grid-cols-3 items-center gap-2 text-center font-black">
   <div className="flex min-w-0 flex-col items-center gap-1.5"><FootballTeamBadge name={data.home.name} logo={homeLogo||data.home.logo} size={44}/><p>{data.home.name}</p></div>
   <div aria-label="النتيجة" className="flex justify-center gap-2 text-3xl text-emerald-600 dark:text-emerald-400"><bdi>{matchNumberInArabic(data.home.score)}</bdi><span aria-hidden="true">–</span><bdi>{matchNumberInArabic(data.away.score)}</bdi></div>
   <div className="flex min-w-0 flex-col items-center gap-1.5"><FootballTeamBadge name={data.away.name} logo={awayLogo||data.away.logo} size={44}/><p>{data.away.name}</p></div>
  </div>
  {data.venue&&<p className="text-xs mt-3 opacity-70">{matchNameInArabic(data.venue)}</p>}
 </div>
 <nav aria-label="أقسام التقرير" data-statistics-scroll className="flex gap-2 overflow-x-auto border-y border-emerald-600/20 p-3">{[['overview','الإحصائيات'],['shots','خريطة التسديدات'],['heat','الخرائط الحرارية'],['lineup','التشكيلة واللاعبون'],['events','الأحداث'],['analysis','التحليل'],['coverage','المصادر والتغطية']].map(([id,title])=><button key={id} aria-pressed={tab===id} className={button+' shrink-0'+(tab===id?' bg-emerald-600 text-white':'')} onClick={()=>{setTab(id);setPlayer(null);}}>{title}</button>)}</nav>
 {tab==='analysis'&&<>
 <div aria-label="شرح إحصائيات المباراة" className="p-5 space-y-2 text-sm leading-8"><h3 className="font-bold text-emerald-500">قراءة الأرقام</h3>{matchNarrative(data.home.name,data.away.name,data.statistics).map(line=><p key={line}>{matchNumberInArabic(line)}</p>)}{!data.statistics.length&&<p>لم يوفر المصدر إحصائيات تفصيلية لهذه المباراة.</p>}<p className="text-xs opacity-70">هذه مقارنة للأرقام المتاحة؛ لا تكفي وحدها لإثبات أسلوب اللعب أو تحركات اللاعبين.</p></div>
 <MatchVisualReport key={data.eventId} data={visualFromEspn(data)} isDark={isDark}/>
 </>}
 {(tab==='overview'||tab==='shots')&&<MatchStatisticsBoard key={data.eventId} data={sourceData!} isDark={isDark} view={tab} homeLogo={homeLogo||data.home.logo} awayLogo={awayLogo||data.away.logo}/>}
 {tab==='heat'&&<div className="p-4 sm:p-5">
  <label className="block font-bold">اختر لاعبًا من المباراة
   <select className={`mt-2 block w-full rounded-xl border border-emerald-600/40 p-2 text-sm ${theme}`} value={player??''} onChange={e=>setPlayer(e.target.value||null)}>
    <option value="">اختر اللاعب</option>
    {allPlayers.filter(p=>p.id).map(p=><option key={p.teamId+':'+p.id} value={p.teamId+':'+p.id}>{matchNameInArabic(p.name)} · {p.team}</option>)}
   </select>
  </label>
  {!allPlayers.length&&<p className="mt-3 text-sm opacity-75">لم يوفر المصدر قائمة اللاعبين لهذه المباراة.</p>}
  {selected&&sourceData&&<MatchPlayerHeatmap home={sourceData.home.name} away={sourceData.away.name} date={sourceData.date??''}
    side={selectedSide} player={selected.name} started={sourceData.state==='in'||sourceData.state==='post'} live={sourceData.state==='in'} />}
 </div>}
 {tab==='lineup'&&<div className="p-4">{selected?<article aria-label="بطاقة أداء اللاعب" className="rounded-2xl border border-emerald-600/40 p-5"><button className={button} onClick={()=>setPlayer(null)}>العودة للتشكيلتين</button><p className="text-emerald-500 text-xs mt-5">أداء اللاعب في هذه المباراة</p><h3 className="text-2xl font-black mt-2">{matchNameInArabic(selected.name)}</h3><p className="text-xs mt-2 opacity-70">{selected.team} · {selected.position||'المركز غير متاح'} · الرقم {matchNumberInArabic(selected.jersey)}</p><p className="text-sm leading-8 mt-4">{selected.statistics.length?selected.statistics.map(s=>`${s.label}: ${s.value}`).join("، ")+".":"الأرقام التفصيلية غير متاحة في المصدر."}</p><div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-5">{selected.statistics.map(s=><div key={s.key} className="rounded-xl p-4 border border-emerald-700/30"><p className="text-2xl font-bold">{matchNumberInArabic(s.value)}</p><p className="text-xs mt-2 opacity-70">{s.label}</p></div>)}</div>{!selected.statistics.length&&<p className="mt-4">لم يوفر المصدر أرقاماً تفصيلية لهذا اللاعب.</p>}{sourceData&&<MatchPlayerHeatmap home={sourceData.home.name} away={sourceData.away.name} date={sourceData.date??''} side={selectedSide} player={selected.name} started={sourceData.state==='in'||sourceData.state==='post'} live={sourceData.state==='in'} />}</article>:<div className="grid sm:grid-cols-2 gap-4">{[data.home,data.away].map(t=><section key={t.id} className="rounded-2xl border border-emerald-700/30 p-4"><h3 className="font-bold">{t.name}</h3><p className="text-xs my-2 text-emerald-500">الخطة: {t.formation?<bdi dir="ltr">{matchNumberInArabic(t.formation)}</bdi>:'غير متاحة'}</p>{[[true,'الأساسيون'],[false,'البدلاء'],[null,'حالة المشاركة غير محددة']].map(([starter,title])=><div key={String(starter)}><h4 className="text-xs opacity-60 mt-4 mb-2">{title}</h4>{t.players.filter(p=>p.starter===starter).map((p,i)=><button disabled={!p.id} key={p.id||i} className="w-full flex justify-between text-right rounded-lg px-3 py-3 hover:bg-emerald-600/10 border-b border-emerald-700/20" onClick={()=>setPlayer(`${t.id}:${p.id}`)}><span><b className="text-emerald-500 ml-2">{matchNumberInArabic(p.jersey)}</b>{' '}{matchNameInArabic(p.name)}</span><small className="opacity-60">{p.position} ←</small></button>)}</div>)}{!t.players.length&&<p>التشكيلة غير متاحة.</p>}</section>)}</div>}</div>}
 {tab==='events'&&<ol className="p-5 space-y-3">{data.events.map(e=><li key={e.id} className="rounded-xl p-3 border border-emerald-700/20"><b className="text-emerald-500 ml-3">{matchNumberInArabic(e.minute)}</b>{e.label} · {e.players.map(matchNameInArabic).join('، ')||'الاسم غير متاح'}{e.shootout?' · ترجيح':''}</li>)}{!data.events.length&&<li>الأحداث غير متاحة.</li>}</ol>}
 {tab==='coverage'&&<div className="p-5 text-sm leading-8"><h3 className="font-bold">ما الذي يغطيه هذا التقرير؟</h3><p>إحصائيات وتشكيلات وأحداث المباراة بحسب سجل إي إس بي إن. أي أرقام معروضة تخص المباراة المختارة فقط.</p><p>تظهر خريطة التسديدات عند توفر إحداثياتها في سجل المباراة. الأهداف المتوقعة والخرائط الحرارية تُعرض حسب تغطية المصدر.</p><p>دقة التمرير أو التحركات السابقة أو إجماليات المسيرة لا تُقدّر لملء الحقول الغائبة.</p></div>}
 <footer className="p-4 border-t border-emerald-700/30 text-xs leading-7 opacity-70"><a className="text-emerald-500 underline" href={data.sourceUrl} target="_blank" rel="noopener noreferrer">المصدر: إي إس بي إن · فتح المباراة ↗</a><p>{data.scope}</p><p>وقت الجلب: {matchDateInArabic(data.fetchedAt,true)} بتوقيت الرياض</p></footer></>}
 </section>;
}

