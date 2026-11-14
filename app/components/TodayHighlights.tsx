'use client';

import { useEffect, useMemo, useState } from 'react';
import { appleCompetitionNames, type AppleMatch, type AppleSchedule } from '../../lib/apple-sports-types';
import type { AppLanguage } from '../../lib/app-language';

const leaguePriority: Record<string,number> = {
  SPL: 105, UEFA_CHM: 100, EPL: 95, UEFA_EU: 85, UECL: 75,
  LA_LIGA: 90, ITSA: 78, BUND: 82, FXL1: 77, MLS: 65,
};
const notable = /(?:الاتحاد|الهلال|النصر|الأهلي|ريال مدريد|برشلونة|مانشستر|ليفربول|أرسنال|تشيلسي|باريس|بايرن|دورتموند|يوفنتوس|ميلان|إنتر|أتلتيكو|al ittihad|al hilal|al nassr|al ahli|real madrid|barcelona|manchester|liverpool|arsenal|chelsea|paris|bayern|dortmund|juventus|milan|inter|atletico)/i;

function timeInRiyadh(value:string,language:AppLanguage):string {
  const d=new Date(value);
  return Number.isNaN(d.getTime())?'—':new Intl.DateTimeFormat(language==='ar'?'ar-SA':'en-GB',{
    timeZone:'Asia/Riyadh',hour:'2-digit',minute:'2-digit'
  }).format(d);
}
function todayRiyadh(d:Date):string {
  return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Riyadh',year:'numeric',month:'2-digit',day:'2-digit'}).format(d);
}
function scoreValue(match:AppleMatch):string {
  if(match.status!=='final'&&match.status!=='live')return '—';
  const scores=match.sides.slice(0,2).map(s=>s.score);
  return scores.length===2&&scores.every(x=>typeof x==='number')?scores.join(' - '):'—';
}
function matchLabel(match:AppleMatch,language:AppLanguage):string {
  const sides=match.sides.slice(0,2).map(s=>language==='ar'?s.name:(s.englishName||s.name));
  if(sides.length===2&&sides.every(Boolean))return sides.join(language==='ar'?' × ':' vs ');
  return (language==='ar'?match.name:(match.englishName||match.name))||'';
}
export default function TodayHighlights({
  language='ar',isDark=true,onRequest,disabled=false,
}:{
  language?:AppLanguage;isDark?:boolean;onRequest:(query:string)=>void;disabled?:boolean;
}) {
  const t=(ar:string,en:string)=>language==='ar'?ar:en;
  const [matches,setMatches]=useState<AppleMatch[]>([]);
  const [status,setStatus]=useState<'loading'|'ready'|'unavailable'>('loading');
  const [failed,setFailed]=useState<string[]>([]);
  const [date,setDate]=useState<string>('');
  useEffect(()=>{
    const controller=new AbortController();
    const reload=()=>{
      const localDate=todayRiyadh(new Date());
      fetch('/api/apple-sports?sport=football&date=0&lang='+language,{signal:controller.signal})
        .then(async r=>{if(!r.ok)throw Error('Schedule unavailable');return r.json() as Promise<AppleSchedule>;})
        .then(data=>{
          if(controller.signal.aborted)return;
          const list=Array.isArray(data.matches)?data.matches:[];
          setDate(localDate);
          setMatches(list.filter(m=>todayRiyadh(new Date(m.start))===localDate&&m.sides.length>=2));
          setFailed(Array.isArray(data.failed)?data.failed:[]);
          setStatus('ready');
        }).catch(()=>{if(!controller.signal.aborted)setStatus('unavailable')});
    };
    reload();
    const timer=window.setInterval(reload,180000);
    return ()=>{controller.abort();window.clearInterval(timer)};
  },[language]);
  const picks=useMemo(()=>matches
    .map(m=>{
      const teams=m.sides.map(s=>(s.name||'')+' '+(s.englishName||'')).join(' ');
      const importance=(leaguePriority[m.competition]||0)+(notable.test(teams)?35:0)+(m.status==='final'?8:m.status==='live'?12:0);
      return {match:m,importance};
    })
    .sort((a,b)=>b.importance-a.importance||a.match.start.localeCompare(b.match.start))
    .slice(0,4).map(x=>x.match),[matches]);
  const request=(match:AppleMatch)=>{
    const fixture=matchLabel(match,language);
    const competition=language==='ar'?(appleCompetitionNames[match.competition]||match.competition):match.competition;
    // Include the provider's match date to prevent wrong-season highlight results.
    const matchDate=todayRiyadh(new Date(match.start));
    const prompt=language==='ar'
      ? `ابحث الآن عن ملخص فيديو مباراة ${fixture} في ${competition} بتاريخ ${matchDate}. تحقق أولًا من النتيجة وحالة انتهاء المباراة. إذا انتهت، ابحث في يوتيوب والقنوات الرسمية (مثل ثمانية وbeIN SPORTS والقنوات المعتمدة) عن ملخص هذه المباراة بالتحديد، وقدم ملخصًا كتابيًا قصيرًا ثم اعرض الفيديو داخل الشات إذا توفر رابط موثق قابل للتشغيل. إذا لم ينشر الملخص، لا تختلق فيديو أو رابطًا ولا تستخدم ملخص مباراة أخرى. وإذا المباراة لم تنته، وضح ذلك وأعطني متابعة مختصرة بدل ادعاء توفر فيديو.`
      : `Find the official video highlights of ${fixture} in ${competition} on ${matchDate}. Verify the final score and that the match has ended. Search YouTube and official broadcaster channels for the exact game. Give a short text recap and show an inline video when a verified playable one exists. Never invent a video or show highlights from another match. If the match is not over, say so and give a brief live/upcoming update.`;
    onRequest(prompt);
  };
  return (
    <section dir={language==='ar'?'rtl':'ltr'} aria-label={t('مباريات اليوم وملخصاتها','Today matches and highlights')}
      className={`mb-5 rounded-2xl border p-3 sm:p-4 ${isDark?'border-emerald-500/35 bg-emerald-950/45 text-white':'border-emerald-700/20 bg-white/60 text-slate-900'}`}>
      <div className="mb-3 flex items-start justify-between gap-2">
        <div><h2 className="text-sm font-extrabold sm:text-base">🎬 {t('مباريات اليوم وملخصاتها','Today’s matches & highlights')}</h2>
          <p className="mt-1 text-[11px] opacity-75">{t('اختر المباراة للبحث عن ملخصها في الشات','Tap a fixture to search its highlights in chat')}</p>
        </div>
        <span className="shrink-0 rounded-lg bg-emerald-700/20 px-2 py-1 text-[10px] font-bold">{date||t('اليوم','Today')}</span>
      </div>
      {status==='loading'&&<p role="status" className="py-2 text-xs">{t('جارٍ جلب مباريات اليوم…','Loading today’s fixtures…')}</p>}
      {status==='unavailable'&&<p role="status" className="py-2 text-xs">{t('تعذر تحديث مباريات اليوم من المصدر الرياضي.','Today’s fixtures are unavailable from the provider.')}</p>}
      {status==='ready'&&!picks.length&&<p role="status" className="py-2 text-xs">{t('لا توجد مباريات مؤكدة ضمن الدوريات المغطاة اليوم.','No confirmed matches in covered competitions today.')}</p>}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {picks.map(match=><button type="button" key={match.id} disabled={disabled} onClick={()=>request(match)}
          className={`w-full min-w-0 rounded-xl border px-3 py-2.5 text-start transition disabled:opacity-50 ${isDark?'border-emerald-600/30 bg-[#0d241b] hover:bg-emerald-900/70':'border-emerald-700/15 bg-white hover:bg-emerald-50'}`}>
          <div className="flex justify-between gap-2 text-[10px] opacity-75"><span className="truncate">{language==='ar'?appleCompetitionNames[match.competition]||match.competition:match.competition}</span>
            <span className="shrink-0">{match.status==='final'?t('انتهت','FT'):match.status==='live'?t('مباشر','Live'):timeInRiyadh(match.start,language)}</span>
          </div>
          <div className="mt-1.5 flex items-center justify-between gap-2">
            <bdi dir="auto" className="min-w-0 flex-1 text-xs font-bold leading-5">{matchLabel(match,language)}</bdi>
            <span dir="ltr" className="shrink-0 text-xs font-extrabold tabular-nums">{scoreValue(match)}</span>
          </div>
          <p className="mt-2 text-[11px] font-bold text-emerald-400">{match.status==='final'?t('▶ ابحث عن ملخص المباراة','▶ Find highlights'):match.status==='live'?t('● تابع المباراة ثم الملخص','● Match update & highlights'):t('◷ تفاصيل المباراة والملخص عند توفره','◷ Fixture and highlights when available')}</p>
        </button>)}
      </div>
      {status==='ready'&&failed.length>0&&<p className="mt-2 text-[10px] opacity-60">{t('قد لا تظهر بعض المباريات لتعذر تحديث بطولاتها.','Some competitions could not be refreshed.')}</p>}
    </section>
  );
}
