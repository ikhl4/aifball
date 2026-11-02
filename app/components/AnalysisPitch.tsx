'use client';
import React, { useEffect, useId, useState, useRef } from 'react';
import { interpolateAnalysisFrame, analysisStep } from '../../lib/analysis-motion';
import type { StoryFrame } from '../../lib/analysis-story';
export default function AnalysisPitch({caption,frames,isDark=true}:{caption:string;frames:StoryFrame[];isDark?:boolean}) {
  const [step,setStep]=useState(0);
  const [playing,setPlaying]=useState(false);
  const [speed,setSpeed]=useState(1);
  const [reducedMotion,setReducedMotion]=useState(false);
  const uid=useId().replace(/:/g,'');
  const target=frames[Math.min(step,frames.length-1)] || frames[0];
  const [frame,setFrame]=useState(target);
  const drawn=useRef(target);
  const paused=useRef(false);
  useEffect(()=>{const media=window.matchMedia('(prefers-reduced-motion: reduce)');const update=()=>setReducedMotion(media.matches);update();media.addEventListener('change',update);return()=>media.removeEventListener('change',update);},[]);
  useEffect(()=>{
    if(reducedMotion){drawn.current=target;setFrame(target);return;}
    const from=drawn.current;let elapsed=0,last:number|undefined,raf=0;
    const tick=(now:number)=>{
      if(last!==undefined && !paused.current)elapsed+=Math.min(now-last,100);
      last=now;const progress=Math.min(1,elapsed/(1100/speed));
      const next=interpolateAnalysisFrame(from,target,progress);drawn.current=next;setFrame(next);
      if(progress<1)raf=requestAnimationFrame(tick);
    };
    raf=requestAnimationFrame(tick);return()=>cancelAnimationFrame(raf);
  },[target,speed,reducedMotion]);
  useEffect(()=>{
    if(!playing)return;
    const timer=setTimeout(()=>{if(step>=frames.length-1){setPlaying(false);return;}setStep(i=>analysisStep(i,'next',frames.length));},4200/speed);
    return()=>clearTimeout(timer);
  },[playing,step,speed,frames.length]);
  const move=(action:'next'|'previous'|'restart')=>{paused.current=false;setPlaying(false);setStep(i=>analysisStep(i,action,frames.length));};
  const toggle=()=>{
    if(playing){paused.current=true;setPlaying(false);return;}
    paused.current=false;if(step>=frames.length-1)setStep(0);setPlaying(true);
  };
  const colors={pass:'#f6db78',run:'#a1d2fc',shot:'#ff8383'};
  return <figure className={`my-4 rounded-xl border overflow-hidden ${isDark?'border-emerald-800/50 bg-[#09251e]':'border-emerald-200 bg-emerald-50'}`}>
    <figcaption className="p-3 text-sm font-bold leading-7">{caption}</figcaption>
    <svg viewBox="0 0 105 68" role="img" aria-label={frame.title} className="w-full" xmlns="http://www.w3.org/2000/svg">
      <title>{frame.title}</title><desc>{frame.note}</desc><rect width="105" height="68" fill="#092e25" />
      <g stroke="#d7e5de" strokeWidth="0.4" opacity="0.6" fill="none"><rect x="2" y="2" width="101" height="64"/><path d="M52.5 2V66"/><circle cx="52.5" cy="34" r="9.15"/><rect x="2" y="14" width="16" height="40"/><rect x="87" y="14" width="16" height="40"/><rect x="2" y="25" width="5.5" height="18"/><rect x="97.5" y="25" width="5.5" height="18"/></g>
      <defs>{(['pass','run','shot'] as const).map(kind=><marker key={kind} id={`${uid}-${kind}`} viewBox="0 0 5 5" refX="5" refY="2.5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L5 2.5L0 5Z" fill={colors[kind]}/></marker>)}</defs>
      {frame.arrows.map((a,i)=>{const from=frame.players.find(p=>p.id===a.from)!,to=Array.isArray(a.to)?{x:a.to[0],y:a.to[1]}:frame.players.find(p=>p.id===a.to)!;return <line key={i} x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={colors[a.kind]} strokeWidth="0.6" strokeDasharray={a.kind==='run'?'1.4 1':undefined} markerEnd={`url(#${uid}-${a.kind})`}/>;})}
      {frame.players.map(p=><g key={p.id}><title>{`${p.number} — ${p.role}`}</title><circle cx={p.x} cy={p.y} r="2.5" fill={p.side==='team'?'#28cd98':'#f1a060'} stroke="#082119" strokeWidth="0.5" /><text x={p.x} y={p.y+0.8} textAnchor="middle" fontSize="2.3" fill="#071c14" fontFamily="Arial" fontWeight="bold">{p.number.trim().length > 3 ? Array.from(p.number.trim()).slice(0,2).join('') : p.number.trim()}</text></g>)}
      <circle cx={frame.ball[0]} cy={frame.ball[1]} r="1" fill="white" stroke="#092e25" strokeWidth="0.3" />
    </svg>
    <div className="p-3"><p className={`text-xs leading-6 ${isDark?'text-gray-300':'text-gray-600'}`}>أخضر: الفريق · برتقالي: المنافس · أبيض: الكرة · أصفر: تمرير · أزرق متقطع: تحرك · أحمر: تسديد.</p>
      {frames.length>1 ? <div className="mt-3 space-y-3" role="group" aria-label="التحكم في المشهد التكتيكي">
        <div className="flex flex-wrap gap-2 items-center">
          <button type="button" onClick={()=>move('previous')} disabled={step===0} className="rounded-lg border border-emerald-600/50 px-3 py-2 text-xs disabled:opacity-40">السابق</button>
          <button type="button" onClick={toggle} aria-pressed={playing} className="rounded-lg bg-emerald-600 text-white text-xs px-3 py-2">{playing?'إيقاف المشهد':'تشغيل المشهد'}</button>
          <button type="button" onClick={()=>move('next')} disabled={step>=frames.length-1} className="rounded-lg border border-emerald-600/50 px-3 py-2 text-xs disabled:opacity-40">التالي</button>
          <button type="button" onClick={()=>move('restart')} className="rounded-lg border border-emerald-600/50 px-3 py-2 text-xs">من البداية</button>
          <label className="text-xs flex gap-2 items-center">سرعة العرض<select aria-label="سرعة العرض" value={speed} onChange={e=>setSpeed(Number(e.target.value))} className="rounded bg-emerald-950 text-white p-2"><option value={0.5}>بطيء</option><option value={1}>عادي</option><option value={1.5}>سريع</option></select></label>
        </div>
        <p className="text-xs text-emerald-500">الخطوة {step+1} من {frames.length} · {target.title}</p>
        <div className="flex flex-wrap gap-2">{frames.map((f,i)=><button type="button" key={i} aria-pressed={step===i} onClick={()=>{paused.current=false;setPlaying(false);setStep(i);}} className={`text-xs rounded-lg border px-3 py-2 ${step===i?'border-emerald-500 text-emerald-500':'border-gray-500/30'}`}>{i+1}. {f.title}</button>)}</div>
        {reducedMotion && <p className="text-xs">تقليل الحركة مفعّل: تتبدل الخطوات دون حركة انتقالية.</p>}
      </div> : <p className="text-xs mt-3 text-emerald-500">مشهد ثابت · لم تصل خطوات حركة إضافية لهذا الرسم.</p>}
      <p aria-live="polite" className="text-sm leading-7 mt-2">{target.note}</p>
      <details className="text-xs mt-2"><summary className="cursor-pointer">أدوار اللاعبين في الرسم</summary><ul className="mt-2 grid grid-cols-2 gap-2">{frame.players.map(p=><li key={p.id}>{p.side==='team'?'الفريق':'المنافس'} · {p.number}: {p.role}</li>)}</ul></details>
      <p className={`text-xs leading-6 mt-2 ${isDark?'text-gray-400':'text-gray-600'}`}>رسم تفسيري بإحداثيات تقريبية؛ لا يمثل تتبّعاً فعلياً للاعبين.</p>
    </div>
  </figure>;
}
