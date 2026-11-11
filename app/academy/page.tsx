'use client';
import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import TacticalLesson from '../components/TacticalLesson';
import FreeTacticalBoard from '../components/FreeTacticalBoard';
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
  const [section,setSection]=useState<'static'|'interactive'|'schedule'>('static');
  const [ageGroup,setAgeGroup]=useState('U15');
  const [trainingDay,setTrainingDay]=useState(0);
  const agePlans: Record<string, {title:string; exercises:[string,number,string][]}[]> = {
    U9: [
      {title:'المتعة والتحكم بالكرة',exercises:[['ألعاب حركة وهرولة',10,'مطاردة خفيفة ومساحات آمنة'],['لمسات بالكرة بين الأقماع',12,'كل لاعب مع كرة'],['تمرير ثنائي قريب',10,'تبادل الكرة مع شريك'],['مباراة 3 ضد 3',15,'فرق صغيرة وتبديل مستمر']]},
      {title:'التوازن والمراوغة',exercises:[['إحماء ألعاب توازن',10,'حركة متنوعة دون إجهاد'],['مراوغة بين بوابات',12,'التحكم بالقدمين'],['لعبة احتفظ بكرتك',10,'حماية الكرة دون احتكاك عنيف'],['مباراة 3 ضد 3',15,'تشجيع المحاولة']]},
      {title:'الاستلام والتحرك',exercises:[['لعبة الإشارات والألوان',10,'رد فعل وتغيير اتجاه'],['استلام ثم تمرير',12,'تمريرات قصيرة'],['تحرك إلى مساحة فارغة',10,'لعبة بوابات مفتوحة'],['مباراة 4 ضد 4',15,'التعاون والتمركز']]},
      {title:'التسديد والمرح',exercises:[['إحماء بالكرة',10,'جري خفيف ولمسات'],['التسديد نحو أهداف صغيرة',12,'من مسافات قصيرة'],['استلام ثم تسديد',10,'دون ضغط كبير'],['مباراة مصغرة',15,'فرص تسجيل كثيرة']]},
      {title:'تحديات مهارية',exercises:[['إحماء بالألعاب',10,'حركة متنوعة'],['سباق تحكم بالكرة',12,'الدقة أهم من السرعة'],['تحدي التمرير والتصويب',10,'مجموعات صغيرة'],['مباراة ممتعة 3 ضد 3',15,'مراجعة إيجابية']]}
    ],
    U12: [
      {title:'التمرير والاستلام',exercises:[['إحماء ديناميكي',10,'حركة مع الكرة'],['تمرير في مثلثات',15,'الاستلام بالقدم البعيدة'],['تمرير وتحرك',15,'فتح زوايا جديدة'],['لعبة 4 ضد 4',15,'تطبيق التمرير']]},
      {title:'المراوغة والمواجهة',exercises:[['إحماء رشاقة',10,'تغيير اتجاه'],['مراوغة 1 ضد 1',15,'تبادل الأدوار'],['حماية الكرة',15,'مساحات صغيرة'],['لعبة 4 ضد 4',15,'مواقف مواجهة']]},
      {title:'الاستحواذ',exercises:[['إحماء بالكرة',10,'تمريرات ثنائية'],['روندو 4 ضد 1',15,'تبادل الأدوار'],['لعبة دعم حامل الكرة',15,'فتح زوايا تمرير'],['مباراة 5 ضد 5',15,'الاحتفاظ بالكرة']]},
      {title:'الدفاع الأساسي',exercises:[['إحماء ديناميكي',10,'حركة متدرجة'],['الدفاع 1 ضد 1',15,'وضعية الجسم'],['دفاع 2 ضد 2',15,'التغطية والمساندة'],['مباراة مصغرة',15,'الانتقال للدفاع']]},
      {title:'التسديد والتحولات',exercises:[['إحماء بالكرة',10,'تمريرات قصيرة'],['استلام وتسديد',15,'التركيز على الدقة'],['هجوم 2 ضد 1',15,'اختيار التمرير أو التسديد'],['مباراة 5 ضد 5',15,'تحول بعد افتكاك الكرة']]}
    ],
    U15: [
      {title:'الاستلام والتمرير',exercises:[['هرولة وإحماء ديناميكي',10,'تدرج بالحركة'],['استلام موجه تحت ضغط',15,'توجيه اللمسة الأولى'],['التمرير والتحرك دون كرة',15,'دعم حامل الكرة'],['لعبة 5 ضد 5',20,'قيود لمسات حسب المستوى']]},
      {title:'الرشاقة والمراوغة',exercises:[['إحماء بالكرة',10,'تنشيط تدريجي'],['تغيير اتجاه ورشاقة',15,'جودة الحركة'],['مواجهة 1 ضد 1',15,'تبادل الأدوار'],['لعبة 4 ضد 4',20,'الانتقال السريع']]},
      {title:'الاستحواذ والتحرك',exercises:[['إحماء تمرير',10,'تحرك واستلام'],['روندو 5 ضد 2',15,'خلق زوايا تمرير'],['لعبة طرف ثالث',15,'التمرير ثم الانطلاق'],['استحواذ 6 ضد 6',20,'توسيع الملعب']]},
      {title:'الدفاع والضغط',exercises:[['إحماء ديناميكي',10,'تنشيط متدرج'],['الدفاع 2 ضد 2',15,'التغطية والتوازن'],['ضغط جماعي 4 ضد 4',15,'توقيت الضغط'],['مباراة تطبيقية',20,'التحول بعد الفقد']]},
      {title:'إنهاء الهجمات',exercises:[['إحماء بالكرة',10,'تنشيط وتسديد خفيف'],['تمرير ثم تسديد',15,'التسديد من الحركة'],['هجوم 3 ضد 2',15,'اختيار القرار'],['مباراة بمرميين',20,'إنهاء سريع']]}
    ],
    U17: [
      {title:'بناء اللعب',exercises:[['إحماء تمرير',10,'رفع الإيقاع تدريجياً'],['خروج بالكرة 4 ضد 3',20,'خلق التفوق العددي'],['تحرك الطرف الثالث',20,'توقيت الجري'],['مباراة تطبيقية',20,'البناء تحت الضغط']]},
      {title:'الضغط بعد الفقد',exercises:[['إحماء ديناميكي',10,'تنشيط'],['ضغط 3 ضد 3',20,'الاقتراب والتغطية'],['استعادة الكرة خلال ثوانٍ',20,'تنظيم المجموعة'],['مباراة انتقالات',20,'استرجاع ثم هجوم']]},
      {title:'الاستحواذ المتقدم',exercises:[['إحماء بالكرة',10,'تمريرات متحركة'],['روندو 6 ضد 3',20,'سرعة القرار'],['تغيير جهة اللعب',20,'استغلال المساحات'],['مباراة مشروطة',20,'خلق التفوق']]},
      {title:'التحولات الدفاعية',exercises:[['إحماء ديناميكي',10,'تحرك جماعي'],['دفاع 3 ضد 2',20,'تأخير الهجوم'],['العودة خلف الكرة',20,'تنظيم الخطوط'],['مباراة انتقالية',20,'التمركز السريع']]},
      {title:'إنهاء الهجمات',exercises:[['إحماء بالكرة',10,'تمرير وتسديد'],['اختراق ثم تسديد',20,'توقيت الجري'],['هجوم 4 ضد 3',20,'القرار الأخير'],['مباراة تطبيقية',20,'جودة الفرصة']]}
    ],
    U19: [
      {title:'بناء اللعب تحت الضغط',exercises:[['إحماء بالكرة',10,'تدرج'],['بناء 6 ضد 4',20,'تشكيل خطوط التمرير'],['كسر خطوط الضغط',20,'استلام بين الخطوط'],['مباراة تكتيكية',25,'تنظيم البناء']]},
      {title:'الضغط الجماعي',exercises:[['إحماء ديناميكي',10,'تنشيط'],['مصائد الضغط',20,'تحديد محفز الضغط'],['ضغط 6 ضد 6',20,'تناسق الخطوط'],['مباراة تطبيقية',25,'تقييم التوقيت']]},
      {title:'التحولات الهجومية',exercises:[['إحماء تمرير',10,'إيقاع متدرج'],['هجوم 4 ضد 3',20,'استغلال التفوق'],['التحول بعد افتكاك الكرة',20,'سرعة القرار'],['مباراة انتقالات',25,'جودة إنهاء الهجمة']]},
      {title:'التنظيم الدفاعي',exercises:[['إحماء ديناميكي',10,'حركة تدريجية'],['دفاع المنطقة',20,'المسافات بين الخطوط'],['دفاع 7 ضد 6',20,'التغطية والتواصل'],['مباراة تكتيكية',25,'تنظيم الفريق']]},
      {title:'الإنهاء والكرات الثابتة',exercises:[['إحماء بالكرة',10,'تدرج'],['إنهاء من الأطراف',20,'التوقيت داخل المنطقة'],['تنفيذ ركنيات',20,'أدوار وتحركات'],['مباراة تطبيقية',25,'التقييم الختامي']]}
    ]
  };
  const dailyPlan=(agePlans[ageGroup] || agePlans.U19)[trainingDay];
  const filtered=useMemo(()=>drills.filter(d=>(category==='الكل'||d.category===category)&&[d.title,d.objective,d.category].some(x=>x.includes(query.trim()))),[category,query]);
  return <main dir="rtl" className="min-h-screen bg-emerald-950 text-white px-4 py-8 sm:px-8" style={{fontFamily:"'Cairo', sans-serif"}}>
    <div className="mx-auto max-w-5xl">
      <header className="mb-7 flex items-center justify-between gap-4">
        <div><p className="text-emerald-300 text-sm">AiFBall Academy</p><h1 className="text-2xl sm:text-4xl font-bold mt-2">الأكاديمية التدريبية</h1><p className="mt-2 text-emerald-100/80 text-sm">مكتبة تمارين كروية قابلة للبحث — المرحلة الأولى</p></div>
        <Link href="/" className="rounded-xl border border-emerald-400/50 px-4 py-2 text-sm hover:bg-emerald-800">العودة لفوتبلاي</Link>
      </header>
      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-6" aria-label="أقسام الأكاديمية">
        <button type="button" onClick={()=>{setSection('static');setSelected(null)}} aria-pressed={section==='static'} className={`rounded-2xl border p-4 sm:p-6 text-right ${section==='static'?'border-emerald-300 bg-emerald-700':'border-emerald-400/30 bg-emerald-900/60 hover:bg-emerald-800'}`}><span className="block text-lg font-bold">مكتبة التمارين</span><span className="block mt-2 text-xs sm:text-sm">المكتبة، المدة، التجهيز وطريقة التنفيذ</span></button>
        <button type="button" onClick={()=>{setSection('interactive');setSelected(null)}} aria-pressed={section==='interactive'} className={`rounded-2xl border p-4 sm:p-6 text-right ${section==='interactive'?'border-emerald-300 bg-emerald-700':'border-emerald-400/30 bg-emerald-900/60 hover:bg-emerald-800'}`}><span className="block text-lg font-bold">التمارين التفاعلية</span><span className="block mt-2 text-xs sm:text-sm">سبورة وتحريك لاعبين ومراحل التدريب</span></button>
        <button type="button" onClick={()=>{setSection('schedule');setSelected(null)}} aria-pressed={section==='schedule'} className={`rounded-2xl border p-2 sm:p-6 text-right ${section==='schedule'?'border-emerald-300 bg-emerald-700':'border-emerald-400/30 bg-emerald-900/60 hover:bg-emerald-800'}`}><span className="block text-sm sm:text-lg font-bold">جدول التمارين</span><span className="hidden sm:block mt-2 text-sm">خطة تدريب متنوعة لخمسة أيام</span></button>
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
      </> : section==='schedule' ? <section aria-label="جدول التمارين" className="rounded-2xl border border-emerald-400/30 bg-emerald-900/40 p-4 sm:p-6">
        <h2 className="text-xl font-bold mb-2">جدول التمارين</h2><p className="text-sm text-emerald-200 mb-4">اختر الفئة السنية واليوم. هذه أمثلة تعليمية قابلة للتعديل وليست برنامج أحمال معتمداً.</p>
        <label htmlFor="academy-age" className="block text-sm mb-2">الفئة السنية</label>
        <select id="academy-age" value={ageGroup} onChange={e=>setAgeGroup(e.target.value)} className="w-full sm:w-64 rounded-xl bg-white text-emerald-950 p-3 mb-4">{['U9','U12','U15','U17','U19','الفريق الأول'].map(a=><option key={a} value={a}>{a==='الفريق الأول'?a:'تحت '+a.slice(1)+' سنة'}</option>)}</select>
        <div className="grid grid-cols-5 gap-1 sm:gap-2 mb-5">{(agePlans[ageGroup] || agePlans.U19).map((plan,i)=><button key={i} type="button" onClick={()=>setTrainingDay(i)} aria-pressed={trainingDay===i} className={`rounded-lg border px-1 py-3 text-xs sm:text-sm ${trainingDay===i?'bg-emerald-600 border-emerald-300':'border-white/20'}`}>اليوم {i+1}</button>)}</div>
        <h3 className="font-bold mb-3">اليوم {trainingDay+1} — {dailyPlan.title}</h3>
        <p className="text-sm text-emerald-200 mb-3">المدة المقترحة: {dailyPlan.exercises.reduce((sum,item)=>sum+item[1],0)} دقيقة، مع فترات راحة حسب جاهزية اللاعبين.</p>
        <div className="space-y-2">{dailyPlan.exercises.map(([title,minutes,note],i)=><div key={i} className="rounded-xl border border-white/15 p-3"><div className="flex justify-between gap-2"><p className="font-bold">{i+1}. {title}</p><span className="shrink-0 text-emerald-200 text-sm">{minutes} دقيقة</span></div><p className="text-xs text-emerald-200 mt-1">{note}</p></div>)}</div>
        <p className="text-xs text-emerald-200 mt-4">هذه خطط توضيحية مختلفة بحسب العمر واليوم وليست توصية بحمل تدريبي يومي متتالٍ؛ عدّل الشدة والراحة بحسب جدول المباريات وحالة اللاعبين.</p>
      </section> : <section aria-label="التمارين التفاعلية" className="rounded-2xl border border-emerald-400/30 bg-emerald-900/30 p-2 sm:p-4"><h2 className="text-xl font-bold mb-2">السبورة التفاعلية</h2><p className="text-sm text-emerald-100 mb-3">اختر التمرين، ثم أضف اللاعبين وحرّكهم وشغّل المراحل.</p><FreeTacticalBoard/><details className="mt-5 rounded-xl border border-emerald-400/30 p-3"><summary className="cursor-pointer font-bold text-emerald-200">التمارين التفاعلية الجاهزة ومراجع FIFA</summary><TacticalLesson name="" isDark trainingFirst={false}/></details></section>}
    </div>
  </main>;
}
