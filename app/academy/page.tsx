'use client';
import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import TacticalLesson from '../components/TacticalLesson';
import { categories, drills, type Drill } from '../../lib/academy/drills';

function Pitch({ drill }: { drill: Drill }) {
  const dots = Array.from({length:Math.min(10,drill.minPlayers)},(_,i)=>({x:15+(i%5)*17,y:25+Math.floor(i/5)*48}));
  return <svg viewBox="0 0 320 190" role="img" aria-label={'رسم تخطيطي توضيحي لتمرين '+drill.title} className="w-full rounded-xl bg-emerald-800">
    <rect x="8" y="8" width="304" height="174" rx="3" fill="none" stroke="#d1fae5" strokeWidth="2"/>
    <path d="M160 8V182 M8 48H55V142H8 M312 48H265V142H312" fill="none" stroke="#d1fae5" strokeWidth="2"/>
    <circle cx="160" cy="95" r="28" fill="none" stroke="#d1fae5" strokeWidth="2"/>
    {dots.map((d,i)=><g key={i}><circle cx={d.x*3.0} cy={d.y*1.8} r="9" fill={i%3===0?'#fbbf24':'#f8fafc'} stroke="#064e3b" strokeWidth="2"/><text x={d.x*3.0} y={d.y*1.8+3} textAnchor="middle" fontSize="9" fill="#064e3b">{i+1}</text></g>)}
    <text x="160" y="175" textAnchor="middle" fill="#d1fae5" fontSize="10">رسم توضيحي — ليس توزيعاً تكتيكياً معتمداً</text>
  </svg>;
}
export default function AcademyPage() {
  const [category,setCategory]=useState('الكل');
  const [query,setQuery]=useState('');
  const [selected,setSelected]=useState<Drill|null>(null);
  const [sessionIds,setSessionIds]=useState<string[]>([]);
  const sessionDrills=sessionIds.map(id=>drills.find(d=>d.id===id)).filter((d):d is Drill=>Boolean(d));
  const totalMinutes=sessionDrills.reduce((sum,d)=>sum+d.minutes,0);
  const addToSession=(id:string)=>setSessionIds(previous=>previous.includes(id)?previous:[...previous,id]);
  const moveSession=(index:number,direction:-1|1)=>setSessionIds(previous=>{const target=index+direction;if(target<0||target>=previous.length)return previous;const next=[...previous];[next[index],next[target]]=[next[target],next[index]];return next;});
  const [section,setSection]=useState<'static'|'interactive'>('static');
  const filtered=useMemo(()=>drills.filter(d=>(category==='الكل'||d.category===category)&&[d.title,d.objective,d.category].some(x=>x.includes(query.trim()))),[category,query]);
  return <main dir="rtl" className="min-h-screen bg-emerald-950 text-white px-4 py-8 sm:px-8" style={{fontFamily:'Cairo, sans-serif'}}>
    <div className="mx-auto max-w-5xl">
      <header className="mb-7 flex items-center justify-between gap-4">
        <div><p className="text-emerald-300 text-sm">AiFBall Academy</p><h1 className="text-2xl sm:text-4xl font-bold mt-2">أكاديمية المدربين</h1><p className="mt-2 text-emerald-100/80 text-sm">مكتبة تمارين كروية قابلة للبحث — المرحلة الأولى</p></div>
        <Link href="/" className="rounded-xl border border-emerald-400/50 px-4 py-2 text-sm hover:bg-emerald-800">العودة لفوتبلاي</Link>
      </header>
      <div className="grid grid-cols-2 gap-3 mb-6" aria-label="أقسام الأكاديمية">
        <button type="button" onClick={()=>{setSection('static');setSelected(null)}} aria-pressed={section==='static'} className={`rounded-2xl border p-4 sm:p-6 text-right ${section==='static'?'border-emerald-300 bg-emerald-700':'border-emerald-400/30 bg-emerald-900/60 hover:bg-emerald-800'}`}><span className="block text-lg font-bold">التمارين الثابتة</span><span className="block mt-2 text-xs sm:text-sm">المكتبة، المدة، التجهيز وطريقة التنفيذ</span></button>
        <button type="button" onClick={()=>{setSection('interactive');setSelected(null)}} aria-pressed={section==='interactive'} className={`rounded-2xl border p-4 sm:p-6 text-right ${section==='interactive'?'border-emerald-300 bg-emerald-700':'border-emerald-400/30 bg-emerald-900/60 hover:bg-emerald-800'}`}><span className="block text-lg font-bold">التمارين التفاعلية</span><span className="block mt-2 text-xs sm:text-sm">سبورة وتحريك لاعبين ومراحل التدريب</span></button>
      </div>
      {section==='static' ? <>
      <section aria-label="حقيبتي التدريبية" className="rounded-2xl border border-emerald-300/40 bg-emerald-900/60 p-4 mb-5">
        <div className="flex flex-wrap justify-between items-center gap-2 mb-3"><div><h2 className="font-bold text-lg">حقيبتي التدريبية</h2><p className="text-xs text-emerald-200">اختر تمارينك بنفسك، ثم رتّبها حسب خطتك.</p></div><span className="rounded-xl bg-emerald-700 px-3 py-2 text-sm font-bold">{sessionDrills.length} تمارين · {totalMinutes} دقيقة</span></div>
        {sessionDrills.length===0?<p className="text-sm text-emerald-100/80">لم تضف تمارين بعد. افتح أي تمرين واضغط «أضف إلى حقيبتي».</p>:<div className="space-y-2">{sessionDrills.map((d,i)=><div key={d.id} className="flex items-center justify-between gap-2 rounded-xl border border-white/15 p-2 sm:p-3"><div className="min-w-0"><p className="font-semibold text-sm">{i+1}. {d.title}</p><p className="text-xs text-emerald-200">{d.minutes} دقيقة</p></div><div className="flex shrink-0 gap-1"><button type="button" disabled={i===0} aria-label={`تقديم ${d.title}`} onClick={()=>moveSession(i,-1)} className="rounded-lg border border-white/30 px-2 py-1 disabled:opacity-30">↑</button><button type="button" disabled={i===sessionDrills.length-1} aria-label={`تأخير ${d.title}`} onClick={()=>moveSession(i,1)} className="rounded-lg border border-white/30 px-2 py-1 disabled:opacity-30">↓</button><button type="button" aria-label={`حذف ${d.title} من الحقيبة`} onClick={()=>setSessionIds(previous=>previous.filter(id=>id!==d.id))} className="rounded-lg border border-red-300/50 px-2 py-1 text-red-200">×</button></div></div>)}</div>}
      </section>
      <div className="rounded-2xl border border-emerald-400/30 bg-emerald-900/60 p-4 mb-5">
        <label htmlFor="drill-search" className="block mb-2 font-bold">ابحث عن تمرين</label>
        <input id="drill-search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="مثلاً: الضغط، الروندو، التسديد..." className="w-full rounded-xl bg-white text-slate-900 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-400"/>
      </div>
      <div className="flex flex-wrap gap-2 mb-6" aria-label="تصنيفات التمارين">{categories.map(c=><button type="button" key={c} onClick={()=>setCategory(c)} aria-pressed={category===c} className={'rounded-full border px-3 py-2 text-sm '+(category===c?'bg-white text-emerald-950 border-white':'border-emerald-400/40 hover:bg-emerald-800')}>{c}</button>)}</div>
      <p className="mb-4 text-sm text-emerald-200">{filtered.length} تمرين — بيانات تدريبية تعليمية تجريبية</p>
      {filtered.length===0?<p className="rounded-xl border p-5">لا توجد تمارين تطابق البحث.</p>:<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{filtered.map(d=><button key={d.id} type="button" onClick={()=>setSelected(d)} className="text-right rounded-2xl border border-emerald-400/30 bg-emerald-900/60 p-4 hover:border-emerald-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"><Pitch drill={d}/><div className="mt-3 text-xs text-emerald-200">{d.category} · {d.age}</div><h2 className="mt-1 text-lg font-bold">{d.title}</h2><p className="mt-1 text-sm text-emerald-100/80">{d.objective}</p><p className="mt-3 text-xs">{d.minutes} دقيقة · {d.minPlayers}–{d.maxPlayers} لاعباً</p><span className="inline-block mt-3 text-sm font-semibold text-emerald-200">عرض التفاصيل ←</span></button>)}</div>}
      {selected&&<div className="fixed inset-0 z-50 bg-black/80 p-3 sm:p-8 flex items-center justify-center" onClick={()=>setSelected(null)}><section role="dialog" aria-modal="true" aria-labelledby="drill-title" onClick={e=>e.stopPropagation()} className="max-h-[90vh] overflow-y-auto w-full max-w-2xl rounded-2xl border border-emerald-400/40 bg-emerald-950 p-5 sm:p-7"><div className="flex justify-between gap-3 mb-4"><h2 id="drill-title" className="text-xl font-bold">{selected.title}</h2><button type="button" onClick={()=>setSelected(null)} aria-label="إغلاق التفاصيل" className="rounded-lg border px-3 py-1">إغلاق</button></div><Pitch drill={selected}/><p className="mt-4 text-emerald-200">{selected.category} · {selected.age} · {selected.minutes} دقيقة · {selected.minPlayers}–{selected.maxPlayers} لاعباً</p><button type="button" disabled={sessionIds.includes(selected.id)} onClick={()=>addToSession(selected.id)} className="mt-4 w-full rounded-xl bg-emerald-600 px-4 py-3 font-bold disabled:bg-emerald-900 disabled:text-emerald-200">{sessionIds.includes(selected.id)?'مضاف إلى حقيبتي ✓':'أضف إلى حقيبتي التدريبية +'}</button><h3 className="font-bold mt-5">الهدف</h3><p>{selected.objective}</p><h3 className="font-bold mt-4">التجهيز والأدوات</h3><p>{selected.setup}</p><h3 className="font-bold mt-4">طريقة التنفيذ</h3><ol className="list-decimal list-inside space-y-2 mt-2">{selected.steps.map((s,i)=><li key={i}>{s}</li>)}</ol><h3 className="font-bold mt-4">توجيهات المدرب</h3><ul className="list-disc list-inside">{selected.tips.map((t,i)=><li key={i}>{t}</li>)}</ul><h3 className="font-bold mt-4">تطوير التمرين</h3><p>{selected.progression}</p><h3 className="font-bold mt-4">قبل التمرين</h3><p>جهّز الأدوات والمساحة، ووضّح القواعد والأدوار، وتأكد من جاهزية اللاعبين.</p><h3 className="font-bold mt-4">بعد التمرين</h3><p>ناقش ملاحظات التنفيذ مع اللاعبين، وامنحهم وقتاً مناسباً للتعافي قبل النشاط التالي.</p><p className="text-xs text-emerald-300 mt-5">الرسم تخطيطي عام للتوضيح، وليس توزيعاً دقيقاً للاعبين في التمرين.</p></section></div>}
      </> : <section aria-label="التمارين التفاعلية" className="rounded-2xl border border-emerald-400/30 bg-emerald-900/30 p-2 sm:p-4"><h2 className="text-xl font-bold mb-2">السبورة التفاعلية</h2><p className="text-sm text-emerald-100 mb-3">اختر التمرين، ثم أضف اللاعبين وحرّكهم وشغّل المراحل.</p><TacticalLesson name="" isDark trainingFirst={false}/></section>}
    </div>
  </main>;
}
