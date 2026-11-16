'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ANALYTICS_LEAGUES, aggregateAnalytics, type AnalyticsMatch } from '../../lib/analytics-core';
import FootballTeamBadge from './FootballTeamBadge';
import { matchDateInArabic, matchNumberInArabic } from '../../lib/match-display-ar';

const MatchReport = dynamic(() => import('./MatchReport'));
const StandingsExplorer = dynamic(() => import('./StandingsExplorer'));
type Payload = ReturnType<typeof aggregateAnalytics> & {
  matches: AnalyticsMatch[]; source: string; fetchedAt: string;
  partial: boolean; failed: string[]; period: { days: number; from: string; to: string };
};
const STATUS = { pre:'قادمة', in:'مباشر الآن', post:'انتهت' };
const periods = [1, 7, 14, 30, 90];
const stateTypes = { all:'الكل', in:'الآن', post:'النتائج', pre:'قادمة' } as const;
type FilterState = keyof typeof stateTypes;
const count = (n: number | null) => matchNumberInArabic(n);
const day = new Intl.DateTimeFormat('en-GB', {timeZone:'Asia/Riyadh',month:'2-digit',day:'2-digit'});

export default function AnalyticsDashboard({ compact = false, isDark = true }: { compact?: boolean; isDark?: boolean }) {
  const [league, setLeague] = useState('all');
  const [days, setDays] = useState(1);
  const [date, setDate] = useState('');
  const [team, setTeam] = useState('');
  const [state, setState] = useState<FilterState>('all');
  const [section, setSection] = useState<'matches' | 'numbers' | 'standings'>('matches');
  const [selected, setSelected] = useState<AnalyticsMatch | null>(null);
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const report = useRef<HTMLDivElement>(null);
  const showingStandings = section==='standings';
  const liveOnly = state==='in';
  const queryDate = liveOnly ? '' : date;
  const queryDays = liveOnly ? 1 : days;
  useEffect(() => {
    if (showingStandings) return;
    const controller = new AbortController();
    setLoading(true); setData(null); setError('');
    const params = new URLSearchParams({ league, days: String(queryDays), ...(queryDate ? { date:queryDate } : {}), ...(liveOnly ? { live:'1' } : {}) });
    let pending = false;
    async function refresh() {
      if (pending) return;
      pending = true;
      try {
        const response = await fetch('/api/analytics?'+params, { cache:'no-store', signal:controller.signal });
        if (!response.ok) throw Error('تعذّر تحميل المباريات.');
        const json = await response.json() as Payload;
        if (!controller.signal.aborted) { setData(json); setError(''); }
      } catch {
        if (!controller.signal.aborted) setError('تعذّر تحميل المباريات.');
      } finally {
        pending = false;
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void refresh();
    const timer = !queryDate && queryDays===1 ? window.setInterval(refresh, 30000) : undefined;
    return () => { controller.abort(); window.clearInterval(timer); };
  }, [league, queryDays, queryDate, liveOnly, retry, showingStandings]);

  const matches = data?.matches;
  const teams = useMemo(() => [...new Set((matches || []).flatMap(m => [m.home, m.away]))].sort((a,b)=>a.localeCompare(b,'ar')), [matches]);
  const visible = useMemo(() => (matches || []).filter(m => (!team || m.home===team || m.away===team) && (state==='all' || m.state===state)), [matches, team, state]);
  const totals = useMemo(() => aggregateAnalytics(visible), [visible]);
  const chart = useMemo(() => {
    const rows = new Map<string, number>();
    for(const m of visible){
      if(m.state!=='post'||m.homeScore===null||m.awayScore===null)continue;
      const label=day.format(new Date(m.date));
      rows.set(label, (rows.get(label)??0)+m.homeScore+m.awayScore);
    }
    return [...rows].reverse().map(([label,goals])=>({label,goals}));
  }, [visible]);
  const panel = isDark ? 'bg-[#102b21] border-emerald-500/25' : 'bg-white border-emerald-800/20';
  const field = `min-w-0 w-full rounded-lg border px-2 py-2 ${isDark?'bg-[#173d2e] border-emerald-500/30':'bg-white border-emerald-700/25'}`;
  const chip = (active:boolean) => `shrink-0 rounded-lg px-3 py-2 text-xs font-bold transition ${active?'bg-emerald-700 text-white':'hover:bg-emerald-500/15'}`;
  function chooseMatch(match: AnalyticsMatch) {
    setSelected(match);
    window.requestAnimationFrame(()=>report.current?.scrollIntoView({block:'start'}));
  }

  return <section dir="rtl" aria-label="مركز الاحصائيات" className={`min-w-0 font-cairo text-right ${isDark?'text-emerald-50':'text-[#103e2a]'}`}>
    <header className={`relative overflow-hidden rounded-[1.6rem] border px-5 py-6 sm:px-8 sm:py-9 ${isDark?'border-emerald-500/25 bg-gradient-to-bl from-[#1a5a42] to-[#102b21]':'border-emerald-900/15 bg-gradient-to-bl from-[#d8f6e7] to-white'}`}>
      <div aria-hidden="true" className="pointer-events-none absolute -end-16 -top-16 h-56 w-56 rounded-full border border-current opacity-15 before:absolute before:inset-6 before:rounded-full before:border before:border-current after:absolute after:inset-16 after:rounded-full after:border after:border-current" />
      <div className="relative">
        <h2 className="text-2xl font-black sm:text-4xl">{compact?'نبض المباريات':'مركز الاحصائيات'}</h2>
        <p className="mt-2 max-w-sm text-xs leading-6 opacity-85 sm:text-sm">اختر مباراة لفتح الإحصائيات والتشكيلة وخرائط الملعب.</p>
        {compact && <Link href="/analytics" className="mt-3 inline-flex rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white">افتح مركز الاحصائيات</Link>}
      </div>
    </header>
    {!compact&&<nav aria-label="أقسام مركز الاحصائيات" data-statistics-scroll className={`my-3 flex gap-1 overflow-x-auto rounded-xl border p-1 ${panel}`}>
      {([['matches','المباريات'],['numbers','مؤشرات البطولة'],['standings','الترتيب']] as const).map(([id,title])=><button type="button" key={id} className={chip(section===id)} aria-pressed={section===id} onClick={()=>setSection(id)}>{title}</button>)}
    </nav>}
    {section==='standings' ? <StandingsExplorer isDark={isDark} showAttribution={false} /> : <>
      <div className={`my-3 grid grid-cols-2 gap-2 rounded-xl border p-3 sm:grid-cols-4 ${panel}`}>
        <label className="min-w-0 space-y-1 text-xs font-bold">البطولة
          <select value={league} onChange={e=>{setLeague(e.target.value);setTeam('');setSelected(null);}} className={field}>
            <option value="all">كل البطولات</option>
            {ANALYTICS_LEAGUES.map(x=><option key={x.id} value={x.id}>{x.label}</option>)}
          </select>
        </label>
        <label className="min-w-0 space-y-1 text-xs font-bold">الفترة
          <select value={days} disabled={liveOnly || !!date} onChange={e=>{setDays(Number(e.target.value));setTeam('');setSelected(null);}} className={field}>
            {periods.map(n=><option key={n} value={n}>{n===1?'اليوم':`آخر ${count(n)} يومًا`}</option>)}
          </select>
        </label>
        <label className="min-w-0 space-y-1 text-xs font-bold">الفريق
          <select value={team} onChange={e=>{setTeam(e.target.value);setSelected(null);}} className={field}>
            <option value="">كل الفرق</option>{teams.map(name=><option key={name}>{name}</option>)}
          </select>
        </label>
        <label className="min-w-0 space-y-1 text-xs font-bold">تاريخ المباراة
          <input type="date" disabled={liveOnly} value={date} onChange={e=>{setDate(e.target.value);setTeam('');setSelected(null);}} className={field+' block'} />
        </label>
        {date&&!liveOnly&&<button type="button" onClick={()=>{setDate('');setTeam('');setSelected(null);}} className="justify-self-start px-1 text-xs font-bold underline">مسح التاريخ</button>}
      </div>
      <div role="group" aria-label="حالة المباريات" className="mb-3 flex flex-wrap gap-1">
        {(Object.entries(stateTypes) as [FilterState,string][]).map(([id,title])=><button type="button" key={id} aria-pressed={state===id} className={chip(state===id)} onClick={()=>{if (liveOnly !== (id==='in')) setTeam(''); setState(id);setSelected(null);}}>{title}</button>)}
      </div>
      {loading && <p role="status" className={`rounded-xl border p-4 text-sm ${panel}`}>جارٍ جلب المباريات لهذه الفترة…</p>}
      {error && <p role="alert" className={`rounded-xl border p-4 text-sm ${panel}`}>{error} <button className="me-2 underline" type="button" onClick={()=>setRetry(n=>n+1)}>إعادة المحاولة</button></p>}
      {data && <>
        {data.partial && <p role="status" className="mb-3 rounded-xl border border-amber-600/30 px-3 py-2 text-xs">بعض المباريات غير متاحة حاليًا.</p>}
        {section==='matches'&&<section aria-label="سجل المباريات" className="min-w-0">
          <h3 className="mb-2 font-black">{liveOnly ? 'المباريات المباشرة الآن' : !date && days===1 ? 'مباريات اليوم' : 'المباريات'}</h3>
          {visible.length ? <div data-statistics-scroll className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-3">
            {(compact?visible.slice(0,3):visible).map(m=>{
              const active=selected?.id===m.id&&selected?.league===m.league;
              return <button type="button" key={m.league+':'+m.id} aria-pressed={active} onClick={()=>chooseMatch(m)}
                className={`w-[min(80%,19rem)] shrink-0 snap-start rounded-2xl border p-3 text-start hover:border-emerald-400 focus-visible:outline-emerald-500 ${panel} ${active?'ring-1 ring-inset ring-emerald-500':''}`}>
                <div className="flex items-center justify-between gap-2 text-[11px] font-bold"><span className="truncate opacity-80">{m.competition}</span>
                  <span className={`shrink-0 rounded-full px-2 py-1 ${m.state==='in'?'bg-red-700 text-white':'bg-emerald-500/15'}`}>{STATUS[m.state]}</span>
                </div>
                <div className="my-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-center text-xs font-black">
                  {[[m.home,m.homeLogo],[m.away,m.awayLogo]].map(([name,logo], i)=><React.Fragment key={i}>
                    {i>0&&<span className="flex gap-1.5 text-xl"><bdi>{count(m.homeScore)}</bdi><span aria-hidden="true">–</span><bdi>{count(m.awayScore)}</bdi></span>}
                    <div className="flex min-w-0 flex-col items-center gap-1"><FootballTeamBadge name={name||''} logo={logo} size={36}/><span>{name}</span></div>
                  </React.Fragment>)}
                </div>
                <div className="flex justify-between gap-2 text-[11px]"><span className="opacity-75">{m.state==='in' ? 'تجري الآن' : matchDateInArabic(m.date, m.state==='pre')}</span><span className="font-bold underline">فتح الإحصائيات</span></div>
              </button>;
            })}
          </div> : <p className={`rounded-xl border p-4 text-sm ${panel}`}>{liveOnly ? 'لا توجد مباريات مباشرة الآن ضمن اختياراتك.' : 'لا توجد مباريات مطابقة للفلاتر.'}</p>}
          <div ref={report} className="scroll-mt-20">
            {selected && <MatchReport key={selected.league+':'+selected.id} matchName={selected.home+' × '+selected.away} eventId={selected.id} leagueCode={selected.league}
              homeLogo={selected.homeLogo} awayLogo={selected.awayLogo} embedded refresh={selected.state==='in'} isDark={isDark} />}
          </div>
        </section>}
        {section==='numbers'&&<div className="space-y-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {([['المباريات',totals.games],['انتهت',totals.completed],['مباشر',totals.live],['الأهداف',totals.goals]] as const).map(([label,value])=><div key={label} className={`rounded-xl border p-3 ${panel}`}><p className="text-xs font-bold">{label}</p><p className="text-2xl font-black tabular-nums">{count(value)}</p></div>)}
          </div>
          <div className={`rounded-xl border p-4 ${panel}`}>
            <h3 className="mb-3 text-sm font-black">أهداف المباريات المنتهية حسب اليوم</h3>
            {chart.length?<div className="h-56" dir="ltr"><ResponsiveContainer width="100%" height="100%"><BarChart data={chart}><CartesianGrid stroke="#62a487" strokeDasharray="3 3" vertical={false}/><XAxis dataKey="label" stroke={isDark?'#e3f6ec':'#204833'} tick={{fontSize:11}}/><YAxis allowDecimals={false} stroke={isDark?'#e3f6ec':'#204833'} tick={{fontSize:11}}/><Tooltip contentStyle={{background:isDark?'#102b21':'#fff',color:isDark?'#fff':'#103e2a'}}/><Bar dataKey="goals" name="الأهداف" fill="#35b880" radius={[5,5,0,0]}/></BarChart></ResponsiveContainer></div>:<p className="text-xs">لا توجد نتائج مكتملة في الفترة.</p>}
            <p className="mt-2 text-xs">متوسط الأهداف للمباراة · {count(totals.averageGoals)}</p>
          </div>
          <div className={`rounded-xl border p-4 ${panel}`}>
            <h3 className="mb-3 text-sm font-black">الأكثر تسجيلًا في الفترة</h3>
            {totals.teams.length?totals.teams.slice(0,6).map(t=><div key={t.id} className="flex justify-between gap-2 border-t border-emerald-500/20 py-2 text-xs"><span>{t.name}</span><b>{count(t.goalsFor)} هدف · {count(t.played)} مباراة</b></div>):<p className="text-xs">لا توجد نتائج مكتملة في الفترة.</p>}
          </div>
        </div>}
      </>}
    </>}
  </section>;
}
