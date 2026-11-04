'use client';
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ANALYTICS_LEAGUES, aggregateAnalytics, type AnalyticsMatch } from '../../lib/analytics-core';

type Payload = ReturnType<typeof aggregateAnalytics> & {
  matches: AnalyticsMatch[]; source: string; fetchedAt: string;
  partial: boolean; failed: string[]; period: { days: number; from: string; to: string };
};
const fmt = (date: string) => new Intl.DateTimeFormat('ar-SA', { day: 'numeric', month: 'short', timeZone: 'Asia/Riyadh' }).format(new Date(date));
const matchTime = (date: string) => new Intl.DateTimeFormat('ar-SA', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Riyadh' }).format(new Date(date));
export default function AnalyticsDashboard({ compact = false }: { compact?: boolean }) {
  const [league, setLeague] = useState('ksa.1');
  const [days, setDays] = useState(7);
  const [team, setTeam] = useState('');
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setData(null); setError('');
    fetch(`/api/analytics?league=${encodeURIComponent(league)}&days=${days}`, { cache: 'no-store', signal: controller.signal })
      .then(async res => { const json = await res.json(); if (!res.ok) throw Error(json.error || 'فشل تحميل البيانات'); return json as Payload; })
      .then(setData).catch(err => { if (!controller.signal.aborted) setError(err.message || 'تعذّر تحديث البيانات'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [league, days, retry]);
  const teams = useMemo(() => {
    if (!data) return [];
    return [...new Set(data.matches.flatMap(m => [m.home, m.away]))].sort((a,b)=>a.localeCompare(b,'ar'));
  }, [data]);
  const visible = useMemo(() => !data ? [] : data.matches.filter(m => !team || m.home === team || m.away === team), [data,team]);
  const totals = useMemo(() => aggregateAnalytics(visible), [visible]);
  const chart = useMemo(() => {
    const rows = new Map<string, { day: string; goals: number; played: number }>();
    for (const m of visible) {
      if (m.state !== 'post' || m.homeScore === null || m.awayScore === null) continue;
      const day = new Intl.DateTimeFormat('en-CA',{ timeZone:'Asia/Riyadh', year:'numeric', month:'2-digit',day:'2-digit' }).format(new Date(m.date));
      const row = rows.get(day) || { day, goals: 0, played: 0 };
      row.goals += m.homeScore + m.awayScore; row.played++; rows.set(day,row);
    }
    return [...rows.values()].sort((a,b) => a.day.localeCompare(b.day)).map(r=>({...r,label:r.day.slice(5)}));
  },[visible]);
  const tile = 'rounded-xl border border-emerald-500/15 bg-[#112720] px-3 py-3';
  return <section dir="rtl" aria-label="مركز تحليلات فوتبلاي" className="font-cairo text-right text-white">
    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
      <div><p className="text-xs font-bold tracking-wide text-emerald-400">AiFBall ANALYTICS</p>
        <h2 className="text-lg sm:text-2xl font-black">{compact ? 'نبض المباريات' : 'مركز فوتبلاي للتحليلات'}</h2>
        <p className="mt-1 text-xs text-gray-400">إحصاءات مباريات موثقة خلال الفترة المختارة، وليست ترتيب الدوري الكامل.</p></div>
      {compact && <Link href="/analytics" className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-500">افتح مركز التحليلات ←</Link>}
    </div>
    <div className="flex flex-wrap gap-2 mb-4">
      <label className="flex flex-col gap-1 text-xs text-gray-300"><span>البطولة</span>
        <select aria-label="اختر البطولة" value={league} onChange={e=>{setLeague(e.target.value);setTeam('');}} className="rounded-lg bg-[#15332a] border border-emerald-500/30 px-3 py-2 text-white">
          {!compact && <option value="all">جميع البطولات المتاحة</option>}
          {ANALYTICS_LEAGUES.map(x=><option key={x.id} value={x.id}>{x.label}</option>)}
        </select></label>
      {!compact && <><label className="flex flex-col gap-1 text-xs text-gray-300"><span>الفترة</span>
        <select aria-label="الفترة بالأيام" value={days} onChange={e=>setDays(Number(e.target.value))} className="rounded-lg bg-[#15332a] border border-emerald-500/30 px-3 py-2 text-white">
          <option value={7}>آخر 7 أيام</option><option value={14}>آخر 14 يومًا</option><option value={30}>آخر 30 يومًا</option>
        </select></label>
        <label className="flex flex-col gap-1 text-xs text-gray-300"><span>الفريق</span>
          <select aria-label="اختر الفريق" value={team} onChange={e=>setTeam(e.target.value)} className="rounded-lg bg-[#15332a] border border-emerald-500/30 px-3 py-2 text-white">
            <option value="">جميع الفرق</option>{teams.map(name=><option key={name} value={name}>{name}</option>)}
          </select></label></>}
    </div>
    {loading && <p role="status" className="py-6 text-sm text-emerald-300">جارٍ جلب النتائج من ESPN…</p>}
    {error && <div role="alert" className="py-5 text-amber-300 text-sm">{error} <button className="underline mr-2" type="button" onClick={()=>setRetry(n=>n+1)}>إعادة المحاولة</button></div>}
    {data && <><div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
      {[['المباريات',totals.games],['انتهت',totals.completed],['مباشرة',totals.live],['الأهداف المكتملة',totals.goals]].map(([label,value])=><div key={label} className={tile}><p className="text-xs text-gray-400">{label}</p><p className="text-2xl font-black mt-1 tabular-nums">{value}</p></div>)}
    </div>
    {data.partial && <p role="alert" className="mb-3 text-xs text-amber-300">تغطية جزئية: تعذّر جلب {data.failed.join('، ')}. الأرقام محسوبة من البطولات المسترجعة فقط.</p>}
    {!compact && <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-4">
      <div className="rounded-xl border border-emerald-500/15 bg-[#112720] p-4">
        <h3 className="font-bold text-sm mb-3">الأهداف في المباريات المنتهية حسب اليوم</h3>
        {chart.length ? <div className="h-56" dir="ltr"><ResponsiveContainer width="100%" height="100%"><BarChart data={chart}><CartesianGrid stroke="#2d4c41" strokeDasharray="3 3" vertical={false}/><XAxis dataKey="label" stroke="#9fb4ab" tick={{fontSize:11}}/><YAxis allowDecimals={false} stroke="#9fb4ab" tick={{fontSize:11}}/><Tooltip contentStyle={{background:'#10251d',borderColor:'#376450',color:'#fff'}}/><Bar dataKey="goals" name="الأهداف" fill="#43d49c" radius={[5,5,0,0]}/></BarChart></ResponsiveContainer></div> : <p className="text-xs text-gray-400">لا توجد مباريات منتهية بنتائج مكتملة خلال الفترة.</p>}
        <p className="text-xs mt-2 text-gray-400">متوسط الأهداف للمباراة المنتهية: {totals.averageGoals ?? 'غير متاح'}</p>
      </div>
      <div className="rounded-xl border border-emerald-500/15 bg-[#112720] p-4">
        <h3 className="font-bold text-sm mb-3">الأكثر تسجيلًا في الفترة</h3>
        {totals.teams.length ? <div className="space-y-2">{totals.teams.slice(0,6).map((t,i)=><div key={t.id} className="flex items-center justify-between gap-2 text-xs"><span className="truncate">{i+1}. {t.name}</span><span className="shrink-0 font-bold text-emerald-300">{t.goalsFor} هدف · {t.played} مباراة</span></div>)}</div> : <p className="text-xs text-gray-400">لا تتوفر نتائج مكتملة حاليًا.</p>}
        <p className="text-xs text-gray-400 mt-3">أهداف مسجلة خلال الفترة المختارة؛ لا تمثل ترتيب البطولة.</p>
      </div>
    </div>}
    <div className="rounded-xl border border-emerald-500/15 bg-[#112720] p-3 sm:p-4">
      <h3 className="font-bold text-sm mb-3">{compact ? 'أحدث المباريات' : 'سجل المباريات'}</h3>
      {visible.length ? <div className="space-y-2">{visible.slice(0,compact?3:30).map(m=><div key={m.league+':'+m.id} className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-b border-white/10 py-2 text-xs sm:text-sm">
        <span className="truncate font-semibold">{m.home}</span>
        <div className="text-center min-w-[76px]"><strong className="tabular-nums">{m.homeScore !== null && m.awayScore !== null ? m.homeScore+' - '+m.awayScore : 'VS'}</strong><p className="mt-1 text-[10px] text-gray-400">{m.state==='pre'?'قادمة':m.state==='in'?'مباشرة':'انتهت'} · {fmt(m.date)} {matchTime(m.date)}</p></div>
        <span className="truncate text-left font-semibold">{m.away}</span></div>)}</div> : <p className="text-xs text-gray-400">لا توجد مباريات مطابقة للفلاتر خلال الفترة.</p>}
    </div>
    <p className="mt-3 text-[11px] text-gray-400">المصدر: {data.source} · آخر جلب: {matchTime(data.fetchedAt)} بتوقيت الرياض · نطاق العرض: {days} أيام. تُحسب المؤشرات من المباريات التي أعادها المصدر فقط.</p>
    </>}
  </section>;
}
