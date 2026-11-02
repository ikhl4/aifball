'use client';
import React, { useEffect, useId, useRef, useState } from 'react';
import { LESSON_CHOICES, LESSON_CATEGORIES, TACTICAL_LESSONS, lessonByName, filterTacticalLessons, type LessonId, type BoardPlayer } from '../../lib/tactical-lessons';

import { addBoardPlayers, updateBoardPlayer, removeBoardPlayer } from '../../lib/tactical-board-editor';

export default function TacticalLesson({ name = '', isDark = true, trainingFirst = false }: { name?: string; isDark?: boolean; trainingFirst?: boolean }) {
  const [lessonId, setLessonId] = useState<LessonId | null>(() => lessonByName(name));
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [tab, setTab] = useState<'board' | 'drill' | 'source'>(trainingFirst ? 'drill' : 'board');
  const [showArrows, setShowArrows] = useState(true);
  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<number, BoardPlayer[]>>({});
  const [addCount, setAddCount] = useState(1);
  const [addSide, setAddSide] = useState<BoardPlayer['side']>('team');
  const [editorMessage, setEditorMessage] = useState('');
  const [libraryOpen, setLibraryOpen] = useState(() => !lessonByName(name));
  const [librarySearch, setLibrarySearch] = useState('');
  const [category, setCategory] = useState('all');
  const libraryResults = filterTacticalLessons(librarySearch, category);
  const svg = useRef<SVGSVGElement>(null);
  const dragging = useRef<string | null>(null);
  const uid = useId().replace(/:/g, '');
  const lesson = lessonId ? TACTICAL_LESSONS[lessonId] : null;
  const frame = lesson?.frames[step];
  const players = drafts[step] || frame?.players || [];
  const isCustomized = Boolean(drafts[step]);
  const activePlayer = players.find(p => p.id === selected);
  const surface = isDark ? 'bg-[#111a17] border-emerald-900/60 text-gray-100' : 'bg-white border-emerald-200 text-gray-900';
  const muted = isDark ? 'text-gray-400' : 'text-gray-600';
  const button = `rounded-xl px-3 py-2 text-xs font-bold border ${isDark ? 'border-white/15 bg-white/5 hover:bg-white/10' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}`;
  const resetScene = () => { setDrafts({}); setSelected(null); dragging.current = null; };
  const choose = (id: LessonId) => { setLibraryOpen(false); setLessonId(id); setStep(0); setPlaying(false); setEditing(false); setEditorMessage(''); resetScene(); };
  useEffect(() => { setLessonId(lessonByName(name)); setStep(0); setPlaying(false); setDrafts({}); setSelected(null); }, [name]);
  useEffect(() => {
    if (!playing || !lesson || tab !== 'board') return;
    if (step >= lesson.frames.length - 1) { setPlaying(false); return; }
    const timer = setTimeout(() => setStep(step + 1), 3200);
    return () => clearTimeout(timer);
  }, [playing, lessonId, tab, step]);
  const go = (index: number) => { setPlaying(false); setStep(index); setSelected(null); setEditorMessage(''); dragging.current = null; };
  const exportBoard = () => {
    if (!svg.current || !lesson) return;
    const xml = new XMLSerializer().serializeToString(svg.current);
    const url = URL.createObjectURL(new Blob([xml], { type: 'image/svg+xml;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = `aifball-${lesson.id}-step-${step + 1}.svg`; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const editPlayer = (id: string, patch: Partial<Pick<BoardPlayer, 'number' | 'role' | 'x' | 'y'>>) => {
    if (!frame) return;
    setDrafts(previous => ({ ...previous, [step]: updateBoardPlayer(previous[step] || frame.players, id, patch) }));
  };
  const movePlayer = (x: number, y: number) => { if (selected) editPlayer(selected, {x, y}); };
  const addPlayers = () => {
    const result = addBoardPlayers(players, addSide, addCount);
    if (result.error) { setEditorMessage(result.error); return; }
    setDrafts(previous => ({...previous, [step]: result.players}));
    setSelected(result.added[0]); setEditorMessage(`عدد اللاعبين المضافين لهذه المرحلة: ${result.added.length}`);
  };
  const restoreFrame = () => { setDrafts(previous => { const next = {...previous}; delete next[step]; return next; }); setSelected(null); setEditorMessage('استُعيدت المرحلة الأصلية.'); };

  return <section dir="rtl" aria-label="استوديو التكتيك والتدريب" className={`my-5 w-full min-w-0 rounded-2xl border overflow-hidden ${surface}`}>
    <header className="p-4 sm:p-5 border-b border-emerald-500/20">
      <p className="text-xs font-bold text-emerald-500 mb-2">فوتبلاي · تعلّم الفكرة ثم طبّقها</p>
      <h3 className="font-black text-lg sm:text-xl">{lesson?.title || 'استوديو التكتيك والتدريب'}</h3>
      <p className={`text-xs mt-2 leading-6 ${muted}`}>مخطط تعليمي من فوتبلاي، وليس تتبّعاً للاعبين أو تحليلاً لمباراة فعلية.</p>
      <details open={libraryOpen} onToggle={e => setLibraryOpen(e.currentTarget.open)} className="mt-3 rounded-xl border border-emerald-500/20 p-3">
        <summary className="cursor-pointer text-sm font-bold text-emerald-500">مكتبة التمارين ({LESSON_CHOICES.length}) · بحث وتصنيف</summary>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
          <label className="text-xs">ابحث عن تمرين<input type="search" value={librarySearch} onChange={e => setLibrarySearch(e.target.value)} placeholder="مثل الإنهاء، الحارس، الضغط" className={`block w-full mt-1 p-2 rounded-lg border ${surface}`} /></label>
          <label className="text-xs">تصنيف التمرين<select value={category} onChange={e => setCategory(e.target.value)} className={`block w-full mt-1 p-2 rounded-lg border ${surface}`}><option value="all">كل التصنيفات</option>{LESSON_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></label>
        </div>
        <p className={`text-xs mt-2 ${muted}`} role="status">التمارين المطابقة: {libraryResults.length}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">{libraryResults.map(l => <button key={l.id} onClick={() => choose(l.id)} className={`${button} text-right ${lessonId === l.id ? '!border-emerald-500' : ''}`}><span className="block">{l.title}</span><small className={`block mt-1 ${muted}`}>{l.category} · {l.drill.players}</small></button>)}</div>
        {!libraryResults.length && <p className="text-xs py-3">لا يوجد تمرين مطابق. جرّب كلمة أو تصنيفاً آخر.</p>}
      </details>
      <label className="block text-xs mt-3">الدرس
        <select value={lessonId || ''} onChange={e => choose(e.target.value as LessonId)} className={`block w-full mt-1 p-2 rounded-lg border ${surface}`}>
          <option value="" disabled>اختر فكرة تكتيكية</option>
          {LESSON_CHOICES.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
        </select>
      </label>
    </header>
    {!lesson || !frame ? <p className="p-5 text-sm leading-7">{name && name !== 'library' ? `لا يوجد درس جاهز مطابق لـ«${name}» حالياً. ` : ''}اختر أحد الدروس المتاحة لفتح لوحة المراحل والتمرين.</p> : <>
      <div role="tablist" aria-label="أقسام الدرس" className="grid grid-cols-3 gap-2 p-3">
        {([['board', 'اللوحة التفاعلية'], ['drill', 'التطبيق التدريبي'], ['source', 'المصدر والشرح']] as const).map(([id, label]) => <button key={id} role="tab" aria-selected={tab === id} onClick={() => { setTab(id); setPlaying(false); }} className={`${button} ${tab === id ? '!bg-emerald-600 !border-emerald-600 !text-white' : ''}`}>{label}</button>)}
      </div>
      <div role="tabpanel" className="px-3 pb-4 sm:px-5">
        {tab === 'board' && <>
          <p className={`text-sm leading-7 mb-3 ${muted}`}>{lesson.intro}</p>
          <div className="flex flex-wrap gap-2 mb-3">
            <button className={button} onClick={() => { if (editing) { setEditing(false); setSelected(null); } if (step === lesson.frames.length - 1) setStep(0); setPlaying(!playing); }} aria-label={playing ? 'إيقاف الحركة' : 'تشغيل المراحل'}>{playing ? '⏸ إيقاف' : '▶ تشغيل المراحل'}</button>
            <button className={button} onClick={() => go(0)}>إعادة البداية</button>
            <button className={button} aria-pressed={showArrows} onClick={() => setShowArrows(!showArrows)}>{showArrows ? 'إخفاء الأسهم' : 'إظهار الأسهم'}</button>
            <button className={button} aria-pressed={editing} onClick={() => { setEditing(!editing); setPlaying(false); setSelected(null); setEditorMessage(''); }}>تحرير اللاعبين</button>
            <button className={button} onClick={exportBoard}>تنزيل اللوحة SVG</button>
          </div>
          <svg ref={svg} xmlns="http://www.w3.org/2000/svg" role="img" aria-label={`${lesson.title} — ${frame.title}`} viewBox="0 0 105 68" className={`w-full rounded-xl border border-emerald-600/40 ${editing ? 'touch-none' : ''}`} onPointerMove={e => {
            if (!editing || !dragging.current || !svg.current) return;
            const matrix = svg.current.getScreenCTM(); if (!matrix) return;
            const pt = svg.current.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
            const pos = pt.matrixTransform(matrix.inverse());
            const id = dragging.current;
            editPlayer(id, {x: pos.x, y: pos.y});
          }} onPointerUp={() => { dragging.current = null; }} onPointerCancel={() => { dragging.current = null; }}>
            <title>{`${lesson.title} — ${frame.title}`}</title>
            <desc>{`${frame.instruction} الأخضر مجموعة التطبيق، والبرتقالي المنافس. الرسم تقريبي.`}</desc>
            <rect width="105" height="68" fill="#092e25" />
            {[0, 2, 4, 6, 8].map(i => <rect key={i} x={i * 10.5} width="10.5" height="68" fill="#ffffff" opacity="0.025" />)}
            <g stroke="#c5d9d0" strokeWidth="0.35" fill="none" opacity="0.6"><rect x="2" y="2" width="101" height="64" /><path d="M52.5 2V66" /><circle cx="52.5" cy="34" r="9.15" /><rect x="2" y="14" width="16" height="40" /><rect x="87" y="14" width="16" height="40" /><rect x="2" y="25" width="5.5" height="18" /><rect x="97.5" y="25" width="5.5" height="18" /></g>
            {lesson.id === 'rondo' && <path d="M25 16H80V56H25Z" stroke="#e6c86b" strokeDasharray="1.5 1.5" strokeWidth="0.45" fill="none" />}
            <defs>{(['pass','run','shot'] as const).map(kind => <marker key={kind} id={`${uid}-${kind}`} markerWidth="5" markerHeight="5" refX="5" refY="2.5" orient="auto" viewBox="0 0 5 5"><path d="M0 0L5 2.5L0 5Z" fill={kind === 'pass' ? '#f4d773' : kind === 'shot' ? '#ff7575' : '#a2d3ff'} /></marker>)}</defs>
            {showArrows && frame.arrows.map((arrow, i) => { const a=players.find(p=>p.id===arrow.from), b=players.find(p=>p.id===arrow.to); return a && b ? <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={arrow.kind === 'pass' ? '#f4d773' : arrow.kind === 'shot' ? '#ff7575' : '#a2d3ff'} strokeWidth="0.65" strokeDasharray={arrow.kind === 'run' ? '1.5 1' : undefined} markerEnd={`url(#${uid}-${arrow.kind})`} opacity="0.9" /> : null; })}
            {players.map(p => <g key={p.id} role={editing ? 'button' : undefined} tabIndex={editing ? 0 : undefined} aria-label={`اللاعب ${p.number}: ${p.role}`} style={{cursor:editing?'grab':'default'}} onPointerDown={e=>{if(!editing)return; e.preventDefault(); setSelected(p.id); dragging.current=p.id; e.currentTarget.setPointerCapture(e.pointerId);}} onKeyDown={e=>{if(editing&&(e.key==='Enter'||e.key===' ')){e.preventDefault();setSelected(p.id);}}}>
              <circle cx={p.x} cy={p.y} r={selected===p.id?3.1:2.5} fill={p.side==='team'?'#19bb87':'#ee9455'} stroke={selected===p.id?'#fff':'#092e25'} strokeWidth="0.55" className={editing?'':'motion-reduce:transition-none'} style={{transition:editing?'none':'cx 850ms ease, cy 850ms ease'}} />
              <text x={p.x} y={p.y+0.9} textAnchor="middle" fontSize="2.4" fontFamily="Arial, sans-serif" fontWeight="bold" fill="#071a12" pointerEvents="none">{p.number}</text>
            </g>)}
            <circle cx={frame.ball[0]} cy={frame.ball[1]+3.3} r="1.1" className="motion-reduce:transition-none" fill="#fff" stroke="#10231b" strokeWidth="0.4" style={{transition:'cx 850ms ease, cy 850ms ease'}} />
            <text x="4" y="64" fontSize="1.8" fill="#c5d9d0" fontFamily="Arial">AiFBall · Teaching scenario</text>
          </svg>
          <p className={`text-xs mt-2 ${muted}`}>● أخضر: مجموعة التطبيق · ● برتقالي: المنافس · أبيض: الكرة · خط أصفر: تمرير · أزرق متقطع: تحرك · أحمر: تسديد. الإحداثيات تقريبية.</p>
          {isCustomized && <p className="mt-2 text-xs text-amber-600">مشهد معدّل بواسطتك؛ الشرح التدريبي الأصلي لا يتغير تلقائياً مع تعديل اللاعبين.</p>}
          {editing && <div className="mt-3 p-3 border border-amber-500/40 rounded-xl text-xs space-y-3" aria-label="محرر اللاعبين">
            <p className="text-amber-600">أضف عدة لاعبين ثم اسحبهم أو عدّل مواضعهم من أدوات التحكم. التعديلات تخص المرحلة المعروضة وتبقى عند التنقل داخل الدرس؛ اختيار درس آخر يصفرها.</p>
            <p className="font-bold" aria-live="polite">الفريق: <bdi dir="ltr">{players.filter(p => p.side === 'team').length} / 11</bdi> · المنافس: <bdi dir="ltr">{players.filter(p => p.side === 'opponent').length} / 11</bdi></p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 items-end">
              <label>إضافة إلى<select value={addSide} onChange={e => setAddSide(e.target.value as BoardPlayer['side'])} className={`block w-full p-2 mt-1 rounded-lg border ${surface}`}><option value="team">الفريق الأخضر</option><option value="opponent">المنافس البرتقالي</option></select></label>
              <label>عدد اللاعبين<input type="number" min="1" max="11" value={addCount} onChange={e => setAddCount(Number(e.target.value))} className={`block w-full p-2 mt-1 rounded-lg border ${surface}`} /></label>
              <button className={button} onClick={addPlayers}>إضافة اللاعبين</button>
            </div>
            <p role="status" className="text-emerald-500">{editorMessage}</p>
            <label className="block">اختر لاعباً<select value={selected || ''} onChange={e => setSelected(e.target.value)} className={`block w-full p-2 mt-1 rounded-lg border ${surface}`}><option value="">اختر</option>{players.map(p => <option key={p.id} value={p.id}>{p.side === 'team' ? 'الفريق' : 'المنافس'} · {p.number || '—'} — {p.role || 'لاعب'}</option>)}</select></label>
            {activePlayer && <>
              <div className="grid grid-cols-2 gap-2"><label>رقم اللاعب<input type="text" inputMode="numeric" maxLength={2} value={activePlayer.number} onChange={e => editPlayer(activePlayer.id, {number:e.target.value})} className={`block w-full p-2 mt-1 rounded-lg border ${surface}`} /></label><label>دور اللاعب<input value={activePlayer.role} maxLength={40} onChange={e => editPlayer(activePlayer.id, {role:e.target.value})} className={`block w-full p-2 mt-1 rounded-lg border ${surface}`} /></label></div>
              <div className="grid grid-cols-2 gap-3"><label>الموضع الأفقي<input aria-label="الموضع الأفقي للاعب" type="range" min="4" max="101" value={activePlayer.x} onChange={e => movePlayer(Number(e.target.value),activePlayer.y)} className="w-full" /></label><label>الموضع العمودي<input aria-label="الموضع العمودي للاعب" type="range" min="4" max="64" value={activePlayer.y} onChange={e => movePlayer(activePlayer.x,Number(e.target.value))} className="w-full" /></label></div>
              <button className={`${button} text-red-500`} onClick={() => { setDrafts(previous => ({...previous,[step]:removeBoardPlayer(previous[step] || frame.players,activePlayer.id)})); setSelected(null); setEditorMessage('حُذف اللاعب من هذه المرحلة.'); }}>حذف اللاعب المحدد</button>
            </>}
            <button className={button} onClick={restoreFrame}>استعادة المرحلة الأصلية</button>
          </div>}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4" aria-label="مراحل الفكرة">{lesson.frames.map((f,i)=><button key={f.title} aria-current={step===i?'step':undefined} className={`${button} ${step===i?'!border-emerald-500 !text-emerald-500':''}`} onClick={()=>go(i)}>{f.title}</button>)}</div>
          <div aria-live="polite" className={`mt-3 p-4 rounded-xl ${isDark?'bg-black/20':'bg-emerald-50'}`}><h4 className="font-bold text-emerald-500">{frame.title}</h4><p className="text-sm leading-7 mt-1">{frame.instruction}</p></div>
          <p className="text-xs font-bold mt-3">هدف الفكرة: {lesson.objective}</p>
        </>}
        {tab === 'drill' && <>
          <h4 className="font-bold text-emerald-500 mb-3">تطبيق مقترح: {lesson.title}</h4>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">{[['اللاعبون',lesson.drill.players],['المساحة المقترحة',lesson.drill.area],['المدة المقترحة',lesson.drill.duration],['الأدوات',lesson.drill.equipment]].map(([label,value])=><div key={label} className={`p-3 rounded-xl ${isDark?'bg-white/5':'bg-emerald-50'}`}><dt className={`text-xs ${muted}`}>{label}</dt><dd className="text-sm mt-1">{value}</dd></div>)}</dl>
          <h4 className="font-bold mt-4 mb-2">طريقة التنفيذ</h4><ol className="list-decimal list-inside text-sm space-y-2 leading-7">{lesson.drill.rules.map(r=><li key={r}>{r}</li>)}</ol>
          <h4 className="font-bold mt-4 mb-2">نقاط المدرب</h4><ul className="list-disc list-inside text-sm space-y-2">{lesson.coaching.map(c=><li key={c}>{c}</li>)}</ul>
          <div className="text-sm leading-7 space-y-2 mt-4"><p><strong>تبسيط:</strong> {lesson.drill.easier}</p><p><strong>تطوير:</strong> {lesson.drill.harder}</p><p><strong>ماذا تراقب؟</strong> {lesson.drill.observe}</p></div>
          <p className={`text-xs leading-6 mt-4 ${muted}`}>الجرعة والمساحة تنظيم مقترح من فوتبلاي، يُعدّله المدرب حسب العمر والمستوى وعدد اللاعبين. تمرين التطبيق مستقل عن عدد اللاعبين في المشهد التكتيكي.</p>
        </>}
        {tab === 'source' && <div className="text-sm leading-8"><h4 className="font-bold text-emerald-500">المرجع الفني</h4><p>{lesson.reference.title}</p><p className={muted}>استُخدم المرجع لتوثيق المبدأ. المخطط والمراحل والتطبيق المقترح صياغة تعليمية من فوتبلاي، وليست إعادة إنتاج لجلسة FIFA.</p><a href={lesson.reference.url} target="_blank" rel="noopener noreferrer" className="inline-block mt-3 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold">فتح شرح FIFA ومادته المرئية ↗</a><p className={`text-xs mt-3 ${muted}`}>المادة تُفتح لدى المصدر؛ لا يُعرض هنا مقطع غير متحقق أو رابط بحث على أنه فيديو مختار.</p></div>}
      </div>
    </>}
  </section>;
}
