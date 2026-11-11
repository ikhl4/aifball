'use client';
import React, { useEffect, useRef, useState } from 'react';

type Item = {id:string;kind:'home'|'away'|'cone'|'ball';x:number;y:number;number:number};
type Stroke = {id:string;kind:'pass'|'run'|'shot';from:[number,number];to:[number,number]};
type Scene = {items:Item[];strokes:Stroke[]};
const initial:Scene={items:[{id:'ball',kind:'ball',x:52,y:34,number:0}],strokes:[]};
const clone=(s:Scene):Scene=>({items:s.items.map(i=>({...i})),strokes:s.strokes.map(a=>({...a,from:[...a.from],to:[...a.to]}))});
const clamp=(v:number,min:number,max:number)=>Math.max(min,Math.min(max,v));
export default function FreeTacticalBoard(){
 const [frames,setFrames]=useState<Scene[]>([clone(initial)]);
 const [step,setStep]=useState(0);
 const [tool,setTool]=useState<'select'|'home'|'away'|'cone'|'ball'|'pass'|'run'|'shot'>('select');
 const [selected,setSelected]=useState<string|null>(null);
 const [start,setStart]=useState<[number,number]|null>(null);
 const [playing,setPlaying]=useState(false);
 const [notice,setNotice]=useState('');
 const svg=useRef<SVGSVGElement>(null);
 const dragging=useRef<string|null>(null);
 const current=frames[step]||initial;
 const patch=(change:(s:Scene)=>Scene)=>setFrames(prev=>prev.map((s,i)=>i===step?change(clone(s)):s));
 const coord=(e:React.PointerEvent<SVGSVGElement>):[number,number]=>{
   const el=svg.current;const matrix=el?.getScreenCTM();if(!el||!matrix)return [52,34];
   const p=el.createSVGPoint();p.x=e.clientX;p.y=e.clientY;const q=p.matrixTransform(matrix.inverse());
   return [clamp(q.x,3,102),clamp(q.y,3,65)];
 };
 useEffect(()=>{if(!playing)return; if(step>=frames.length-1){setPlaying(false);return;}const t=setTimeout(()=>setStep(v=>v+1),1400);return()=>clearTimeout(t);},[playing,step,frames.length]);
 const onPitch=(e:React.PointerEvent<SVGSVGElement>)=>{
  if(dragging.current)return;
  const point=coord(e);
  if(tool==='select') {setSelected(null);return;}
  if(tool==='pass'||tool==='run'||tool==='shot'){
   if(!start){setStart(point);setNotice('حدد نقطة نهاية المسار على الملعب');return;}
   patch(s=>({...s,strokes:[...s.strokes,{id:'path-'+Date.now(),kind:tool,from:start,to:point}]}));
   setStart(null);setNotice('تم رسم المسار');return;
  }
  patch(s=>{
   if(tool==='ball')return {...s,items:[...s.items.filter(i=>i.kind!=='ball'),{id:'ball',kind:'ball',x:point[0],y:point[1],number:0}]};
   const count=s.items.filter(i=>i.kind===tool).length;
   if((tool==='home'||tool==='away')&&count>=11)return s;
   return {...s,items:[...s.items,{id:'item-'+Date.now()+'-'+count,kind:tool,x:point[0],y:point[1],number:tool==='cone'?0:count+1}]};
  });
 };
 const save=()=>{try{localStorage.setItem('aifball-academy-board-v1',JSON.stringify({frames,step}));setNotice('حُفظ التصميم على هذا الجهاز');}catch{setNotice('تعذر الحفظ على هذا الجهاز');}};
 const load=()=>{try{const raw=localStorage.getItem('aifball-academy-board-v1');if(!raw){setNotice('لا يوجد تصميم محفوظ');return;}const data=JSON.parse(raw);if(!Array.isArray(data.frames)||!data.frames.length||data.frames.length>40||!data.frames.every((f:Scene)=>Array.isArray(f.items)&&Array.isArray(f.strokes))){setNotice('ملف الحفظ غير صالح');return;}setFrames(data.frames);setStep(0);setSelected(null);setNotice('استُعيد التصميم');}catch{setNotice('تعذر قراءة التصميم المحفوظ');}};
 const exportSvg=()=>{if(!svg.current)return;const data=new XMLSerializer().serializeToString(svg.current);const url=URL.createObjectURL(new Blob([data],{type:'image/svg+xml;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='aifball-tactical-board.svg';a.click();URL.revokeObjectURL(url);};
 const btn='rounded-lg border border-emerald-400/40 bg-emerald-950 px-3 py-2 text-xs font-bold';
 return <section dir="rtl" className="rounded-2xl border border-emerald-400/40 p-3 sm:p-4 mt-4 bg-emerald-950/80">
  <h3 className="text-lg font-bold">مصمم السبورة التكتيكية الحر</h3>
  <p className="text-xs text-emerald-100/80 my-2">اختر أداة واضغط على الملعب للإضافة. اسحب العناصر في وضع التحديد. لرسم مسار، اضغط نقطة البداية ثم النهاية.</p>
  <div className="flex flex-wrap gap-2 my-3">{([['select','تحديد وتحريك'],['home','لاعب أخضر'],['away','لاعب برتقالي'],['cone','قمع'],['ball','كرة'],['pass','تمرير'],['run','جري'],['shot','تسديد']] as const).map(([id,label])=><button key={id} type="button" aria-pressed={tool===id} onClick={()=>{setTool(id);setStart(null);}} className={btn+' '+(tool===id?'!bg-emerald-600 !border-emerald-200':'')}>{label}</button>)}</div>
  <svg ref={svg} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 105 68" role="img" aria-label="سبورة تكتيكية قابلة للتحرير" className="w-full rounded-xl touch-none border border-emerald-400/50" onPointerDown={e=>{if(e.target===svg.current|| (e.target as Element).getAttribute('data-pitch')==='yes')onPitch(e);}} onPointerMove={e=>{if(!dragging.current)return;const [x,y]=coord(e);const id=dragging.current;patch(s=>({...s,items:s.items.map(i=>i.id===id?{...i,x,y}:i)}));}} onPointerUp={()=>dragging.current=null} onPointerCancel={()=>dragging.current=null}>
   <rect data-pitch="yes" width="105" height="68" fill="#0b4733"/>
   <g data-pitch="yes" stroke="#d3eee0" strokeWidth=".4" fill="none" opacity=".85"><rect x="2" y="2" width="101" height="64"/><path d="M52.5 2V66"/><circle cx="52.5" cy="34" r="9"/><rect x="2" y="14" width="16" height="40"/><rect x="87" y="14" width="16" height="40"/><rect x="2" y="25" width="6" height="18"/><rect x="97" y="25" width="6" height="18"/></g>
   {current.strokes.map(a=><g key={a.id}><line x1={a.from[0]} y1={a.from[1]} x2={a.to[0]} y2={a.to[1]} stroke={a.kind==='pass'?'#f9d46a':a.kind==='run'?'#8bd5ff':'#ff8989'} strokeWidth=".75" strokeDasharray={a.kind==='run'?'2 1':undefined}/><circle cx={a.to[0]} cy={a.to[1]} r="1" fill={a.kind==='pass'?'#f9d46a':a.kind==='run'?'#8bd5ff':'#ff8989'}/></g>)}
   {start&&<circle cx={start[0]} cy={start[1]} r="1.6" fill="#fff" stroke="#ffdb70" strokeWidth=".7"/>}
   {current.items.map(i=><g key={i.id} role="button" aria-label={i.kind==='cone'?'قمع':i.kind==='ball'?'كرة':'لاعب '+i.number} tabIndex={0} onPointerDown={e=>{e.stopPropagation();if(tool!=='select')return;e.currentTarget.setPointerCapture(e.pointerId);dragging.current=i.id;setSelected(i.id);}} onPointerUp={()=>dragging.current=null}>
    {i.kind==='cone'?<path d={`M${i.x} ${i.y-2.2}l-2.2 4.4h4.4z`} fill="#f8a449" stroke="#fff" strokeWidth=".35"/>: <circle cx={i.x} cy={i.y} r={i.kind==='ball'?1.5:2.6} fill={i.kind==='ball'?'#fff':i.kind==='home'?'#2be3a5':'#f3a266'} stroke={selected===i.id?'#ffeb8c':'#063d2c'} strokeWidth=".55"/>}
    {i.kind!=='cone'&&i.kind!=='ball'&&<text x={i.x} y={i.y+.85} textAnchor="middle" fontSize="2.5" fill="#08291e" fontWeight="bold">{i.number}</text>}
   </g>)}
  </svg>
  <div className="flex flex-wrap gap-2 mt-3">
   <button className={btn} onClick={()=>{if(!selected)return;patch(s=>({...s,items:s.items.filter(i=>i.id!==selected)}));setSelected(null);}} disabled={!selected}>حذف المحدد</button>
   <button className={btn} onClick={()=>patch(s=>({...s,strokes:s.strokes.slice(0,-1)}))}>تراجع عن آخر مسار</button>
   <button className={btn} onClick={()=>{setFrames(prev=>[...prev.slice(0,step+1),clone(current)]);setStep(step+1);setSelected(null);}}>إضافة مرحلة +</button>
   <button className={btn} onClick={()=>{if(frames.length===1)return;setFrames(prev=>prev.filter((_,i)=>i!==step));setStep(Math.max(0,step-1));}}>حذف المرحلة</button>
   <button className={btn} onClick={()=>{setPlaying(false);setStep(0);}}>البداية</button>
   <button className={btn} onClick={()=>setStep(v=>Math.max(0,v-1))}>السابق</button>
   <button className={btn} onClick={()=>setStep(v=>Math.min(frames.length-1,v+1))}>التالي</button>
   <button className={btn} onClick={()=>{if(step===frames.length-1)setStep(0);setPlaying(v=>!v);}}>{playing?'إيقاف':'▶ تشغيل المراحل'}</button>
  </div>
  <p className="text-xs mt-2 text-emerald-200">المرحلة {step+1} من {frames.length} · التشغيل ينتقل بين المشاهد المحفوظة، ولا يحاكي حركة فيزيائية مستمرة.</p>
  <div className="flex flex-wrap gap-2 mt-3"><button className={btn} onClick={save}>حفظ على الجهاز</button><button className={btn} onClick={load}>استعادة المحفوظ</button><button className={btn} onClick={exportSvg}>تصدير SVG</button><button className={btn} onClick={()=>{setFrames([clone(initial)]);setStep(0);setSelected(null);setStart(null);}}>سبورة جديدة</button></div>
  {notice&&<p role="status" className="text-sm mt-2 text-amber-200">{notice}</p>}
 </section>;
}
