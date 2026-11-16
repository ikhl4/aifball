'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { matchNameInArabic, matchNumberInArabic } from '../../lib/match-display-ar';
import { sameProviderMatch } from '../../lib/match-heatmap-source';
import type { DetailedMatchReport } from '../../lib/match-report';
import { normalize365Report, type Scores365Report } from '../../lib/scores365-report';
import FootballTeamBadge from './FootballTeamBadge';
import { visualFrom365, visualFromEspn } from './MatchVisualReport';

type View = 'overview' | 'shots';
type Side = 'home' | 'away';
type Period = 'all' | 'first' | 'second';
type Visual = ReturnType<typeof visualFromEspn>;
const periods = { all: 'المباراة كاملة', first: 'الشوط الأول', second: 'الشوط الثاني' } as const;
const groups = [
  { title: 'الهجوم وصناعة الفرص', pattern: /expectedGoals|totalGoals|totalShots|shotsOnTarget|scoring|chance|assist|corner|الأهداف المتوقعة|الصناعة المتوقعة|التسديدات|اختراق|الفرص|ركنيات/i },
  { title: 'التمرير والسيطرة', pattern: /pass|possession|cross|longball|touch|offside|التمرير|الاستحواذ|العرضيات|الكرات الطويلة|اللمسات|التسلل/i },
  { title: 'الدفاع والحراسة', pattern: /tackle|save|block|clearance|interception|duel|التدخلات|التصديات|الاعتراضات|التشتيت|الثنائيات/i },
  { title: 'الانضباط ومؤشرات أخرى', pattern: /.*/ },
];
const pitch = 'M2 2H103V66H2ZM52.5 2V66 M2 14H18V54H2 M103 14H87V54H103 M2 24H8V44H2 M103 24H97V44H103';
const homeInk = '#5ce3a7';
const awayInk = '#c1e1d5';
const goalInk = '#f1ce72';
const fmt = (value: number | string | null | undefined, percent = false) => value == null ? '—' : matchNumberInArabic(value) + (percent ? '٪' : '');

function LandscapePitch({ children, label }: { children: ReactNode; label: string }) {
  return <svg viewBox="0 0 105 68" role="group" aria-label={label} className="mx-auto block w-full max-w-[780px] rounded-xl bg-[#153b2d]">
    <g aria-hidden="true">
      {Array.from({ length: 10 }, (_, i) => i % 2 === 0 && <rect key={i} x={i * 10.5} width="10.5" height="68" fill="#ffffff" opacity=".038" />)}
      <path d={pitch} stroke="#a6d2bd" strokeOpacity=".64" strokeWidth=".35" fill="none" />
      <circle cx="52.5" cy="34" r="9.15" stroke="#a6d2bd" strokeOpacity=".64" strokeWidth=".35" fill="none" />
      <circle cx="52.5" cy="34" r=".5" fill="#a6d2bd" />
      <path d="M18 27a9.15 9.15 0 010 14m69-14a9.15 9.15 0 000 14" stroke="#a6d2bd" strokeOpacity=".64" strokeWidth=".35" fill="none" />
    </g>
    {children}
  </svg>;
}

function shotPeriod(shot: Visual['shots'][number]) {
  if (shot.period === 1 || shot.period === 2) return shot.period;
  if (shot.period != null) return null;
  const clock = String(shot.minute ?? '').trim().match(/^(\d{1,3})(?:\+\d{1,2})?['’′]?$/);
  if (!clock) return null;
  const minute = Number(clock[1]);
  return minute <= 45 ? 1 : minute <= 90 ? 2 : null;
}

const metricValue = (metric: Visual['metrics'][number], side: Side) => fmt(
  (side === 'home' ? metric.homeText : metric.awayText) || metric[side],
  !(side === 'home' ? metric.homeText : metric.awayText) && metric.percent,
);

function StatLine({ metric }: { metric: Visual['metrics'][number] }) {
  const both = metric.home != null && metric.away != null && metric.home >= 0 && metric.away >= 0;
  const max = metric.percent ? 100 : Math.max(metric.home ?? 0, metric.away ?? 0);
  const width = (n: number | null) => both && max > 0 ? Math.min(100, (n ?? 0) / max * 100) : 0;
  return <div className="space-y-1.5 px-1 py-2.5">
    <div className="grid grid-cols-[minmax(34px,auto)_1fr_minmax(34px,auto)] items-center gap-2 text-center">
      <bdi className="justify-self-start font-black tabular-nums">{metricValue(metric,'home')}</bdi>
      <span className="text-xs font-bold leading-5">{metric.label}</span>
      <bdi className="justify-self-end font-black tabular-nums">{metricValue(metric,'away')}</bdi>
    </div>
    {both && <div aria-hidden="true" className="grid grid-cols-2 gap-2">
      {([metric.home, metric.away] as const).map((value, i) => <div key={i} className={`flex h-1.5 overflow-hidden rounded-full bg-emerald-400/15 ${i===1?'justify-end':''}`}>
        <span className={i===0?'bg-emerald-500':'bg-[#75a893]'} style={{ width: width(value) + '%' }} />
      </div>)}
    </div>}
  </div>;
}

function landscapeImage(visual: Visual, title: string, isDark: boolean, metrics: Visual['metrics'], shots?: Visual['shots']) {
  const canvas = document.createElement('canvas');
  canvas.width = 1600;
  canvas.height = 900;
  const ctx = canvas.getContext('2d');
  if (!ctx) return Promise.resolve(null);
  const background = ctx.createLinearGradient(0, 0, 1600, 900);
  background.addColorStop(0, isDark ? '#081e17' : '#f1fbf6');
  background.addColorStop(1, isDark ? '#19523c' : '#d7f5e6');
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, 1600, 900);
  const ink = isDark ? '#f1fff7' : '#0d3827';
  const muted = isDark ? '#b0d7c4' : '#256449';
  const text = (label: string, x: number, y: number, size: number, color = ink, weight = 700, align: CanvasTextAlign = 'center') => {
    ctx.font = `${weight} ${size}px Cairo, Tahoma, sans-serif`;
    ctx.textAlign = align;
    ctx.fillStyle = color;
    ctx.fillText(label, x, y, align === 'center' ? 760 : 460);
  };
  ctx.strokeStyle = isDark ? '#397f61' : '#a4d9bf';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(30, 30, 1540, 840, 35);
  ctx.stroke();
  text('فوتبلاي  ·  مركز الاحصائيات', 1500, 95, 28, muted, 800, 'right');
  text(visual.context, 100, 95, 22, muted, 600, 'left');
  text(matchNameInArabic(visual.home), 1200, 201, 47);
  text(matchNameInArabic(visual.away), 400, 201, 47);
  text(fmt(visual.homeScore), 870, 207, 61);
  text('–', 800, 201, 39, muted);
  text(fmt(visual.awayScore), 730, 207, 61);
  text(title, 800, 285, 33, muted, 800);

  if (shots) {
    const left = 365, top = 310, width = 870, height = 465;
    ctx.fillStyle = '#153b2d';
    ctx.fillRect(left, top, width, height);
    ctx.save();
    ctx.translate(left, top);
    ctx.scale(width/105, height/68);
    ctx.lineWidth = .35;
    ctx.strokeStyle = '#a6d2bd';
    ctx.stroke(new Path2D(pitch));
    ctx.beginPath();
    ctx.arc(52.5, 34, 9.15, 0, Math.PI*2);
    ctx.stroke();
    for (const shot of shots) {
      ctx.beginPath();
      ctx.fillStyle = shot.goal ? goalInk : shot.side === 'home' ? homeInk : awayInk;
      ctx.arc(2+shot.x*1.01, 2+shot.y*.64, 1.05+(shot.xg??0)*2.2, 0, Math.PI*2);
      ctx.fill();
    }
    ctx.restore();
    text('ذهبي: هدف  ·  أخضر: صاحب الأرض  ·  أخضر فاتح: الضيف', 800, 811, 20, muted);
  } else {
    metrics.slice(0, 6).forEach((metric, i) => {
      const y = 362 + i * 75;
      text(metric.label, 800, y, 26, muted);
      text(metricValue(metric,'home'), 1300, y, 36);
      text(metricValue(metric,'away'), 300, y, 36);
      ctx.globalAlpha = .3;
      ctx.fillStyle = muted;
      ctx.fillRect(245, y+19, 1110, 1);
      ctx.globalAlpha = 1;
    });
  }
  text('فوتبلاي', 800, 846, 19, muted, 600);
  return new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
}

export default function MatchStatisticsBoard({ data, homeLogo, awayLogo, isDark, view }: {
  data: DetailedMatchReport;
  homeLogo?: string | null;
  awayLogo?: string | null;
  isDark: boolean;
  view: View;
}) {
  const [provider, setProvider] = useState<'espn' | '365'>('espn');
  const [additional, setAdditional] = useState<Scores365Report | null>();
  const [request, setRequest] = useState(0);
  const [period, setPeriod] = useState<Period>('all');
  const [side, setSide] = useState<Side | 'all'>('all');
  const [selected, setSelected] = useState<string | null>(null);
  const [shareError, setShareError] = useState(false);
  const home = data.home.name, away = data.away.name, date = data.date;
  useEffect(() => {
    if (request === 0 || !date) return;
    const kickoff = date;
    const controller = new AbortController();
    let pending = false;
    async function load() {
      if (pending) return;
      pending = true;
      try {
        const choice = await fetch('/api/match-heatmap-source?' + new URLSearchParams({ home, away, date: kickoff }), { signal: controller.signal });
        if (!choice.ok) throw new Error();
        const { matchUrl } = await choice.json();
        if (!matchUrl) throw new Error();
        const response = await fetch('/api/advanced?' + new URLSearchParams({ source:'365', action:'analysis', matchUrl }), { signal: controller.signal });
        if (!response.ok) throw new Error();
        const report = normalize365Report(await response.json(), matchUrl);
        if (!sameProviderMatch(report, { home, away, date: kickoff })) throw new Error();
        if (!controller.signal.aborted) setAdditional(report);
      } catch {
        if (!controller.signal.aborted) setAdditional(existing => existing ?? null);
      } finally { pending = false; }
    }
    void load();
    const timer = data.state === 'in' ? window.setInterval(load, 60000) : undefined;
    return () => { controller.abort(); window.clearInterval(timer); };
  }, [request, home, away, date, data.state]);
  const sourceReport = provider === '365' ? additional : undefined;
  const visual = useMemo(() => sourceReport ? visualFrom365(sourceReport) : visualFromEspn(data), [sourceReport, data]);
  const split = groups.map((g, idx) => ({ title:g.title, metrics:visual.metrics.filter(m => groups.findIndex(group => group.pattern.test(m.key+' '+m.label)) === idx) }));
  const shots = visual.shots.filter(s => (side === 'all' || side === s.side) && (period === 'all' || shotPeriod(s) === (period === 'first' ? 1 : 2)));
  const currentShot = shots.find(s => s.id === selected);
  const button = 'rounded-lg border border-emerald-600/35 px-3 py-2 text-xs font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-500';
  const chosen = ' bg-emerald-700 text-white';
  const panel = isDark ? 'bg-[#102b21] border-emerald-500/20' : 'bg-emerald-50/45 border-emerald-700/20';
  const canExport = view === 'shots' ? shots.length > 0 : visual.metrics.length > 0;
  async function share() {
    setShareError(false);
    try {
      const blob = await landscapeImage(visual, view === 'shots' ? 'خريطة التسديدات · '+periods[period] : 'إحصائيات المباراة', isDark, visual.metrics, view === 'shots' ? shots : undefined);
      if (!blob) throw new Error();
      const file = new File([blob], 'aifball-match-statistics.png', { type:'image/png' });
      if (navigator.canShare?.({ files:[file] })) {
        try { await navigator.share({ files:[file] }); return; }
        catch (error) { if (error instanceof DOMException && error.name === 'AbortError') return; }
      }
      const url = URL.createObjectURL(blob);
      const a = Object.assign(document.createElement('a'), { href:url, download:file.name });
      document.body.append(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1500);
    } catch { setShareError(true); }
  }

  return <div className="space-y-4 p-3 sm:p-5">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex flex-wrap gap-2" role="group" aria-label="عرض الإحصائيات">
        <button type="button" className={button+(provider==='espn'?chosen:'')} aria-pressed={provider==='espn'} onClick={()=>{setProvider('espn');setSelected(null);}}>الإحصائيات الأساسية</button>
        {date && data.state !== 'pre' && <button type="button" className={button+(provider==='365'?chosen:'')}
          disabled={request>0&&additional===undefined} aria-pressed={provider==='365'} onClick={()=>{
            setProvider('365');setSelected(null);
            if (!additional) { setAdditional(undefined); setRequest(n=>n+1); }
          }}>إحصائيات إضافية</button>}
      </div>
      <button type="button" className={button+' bg-emerald-700 text-white disabled:opacity-50'} disabled={!canExport || provider==='365'&&!additional} onClick={()=>void share()}>مشاركة بطاقة أفقية</button>
    </div>
    {shareError && <p role="alert" className="text-sm text-amber-600">تعذر تجهيز صورة المشاركة.</p>}
    {provider==='365'&&!additional ? <p role="status" className="rounded-xl border border-emerald-600/25 p-4 text-sm">{additional===undefined?'جارٍ تحميل الإحصائيات الإضافية…':'الإحصائيات الإضافية غير متاحة لهذه المباراة.'}</p> : <>
    {view === 'overview' ? <>
      <div className={`grid grid-cols-2 gap-4 rounded-xl border p-3 text-center ${panel}`}>
        {[[visual.home, homeLogo], [visual.away, awayLogo]].map(([name, logo], index) => <div key={index} className="flex min-w-0 items-center justify-center gap-2 text-sm font-black">
          <FootballTeamBadge name={matchNameInArabic(name||'')} logo={logo} size={30}/>
          <span>{matchNameInArabic(name || '')}</span>
        </div>)}
      </div>
      {visual.metrics.length ? <div className="grid gap-3 lg:grid-cols-2">
        {split.filter(group=>group.metrics.length).map(group=><section key={group.title} className={`rounded-2xl border p-3 sm:p-4 ${panel}`}>
          <h3 className="border-b border-emerald-500/20 pb-2 text-sm font-black">{group.title}</h3>
          {group.metrics.map(metric=><StatLine key={metric.key} metric={metric}/>)}
        </section>)}
      </div> : <p role="status" className="p-3 text-sm">الإحصائيات غير متاحة لهذه المباراة.</p>}
    </> : <>
      <div className="flex flex-wrap gap-2" role="group" aria-label="فترة التسديدات">
        {(Object.entries(periods) as [Period,string][]).map(([id,name])=><button type="button" key={id} aria-pressed={period===id} className={button+(period===id?chosen:'')} onClick={()=>{setPeriod(id);setSelected(null);}}>{name}</button>)}
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="فريق التسديدات">
        {(['all','home','away'] as const).map(id=><button type="button" key={id} aria-pressed={side===id} className={button+(side===id?chosen:'')} onClick={()=>{setSide(id);setSelected(null);}}>{id==='all'?'الفريقان':matchNameInArabic(visual[id])}</button>)}
      </div>
      {shots.length ? <>
        <LandscapePitch label="خريطة التسديدات الأفقية">
          {shots.map(shot=>{
            const label = [matchNameInArabic(shot.playerName||''),shot.outcome,shot.minute&&fmt(shot.minute),shot.xg!=null&&`xG ${fmt(shot.xg)}`].filter(Boolean).join(' · ');
            return <circle key={shot.id} cx={2+shot.x*1.01} cy={2+shot.y*.64} r={1.25+(shot.xg??0)*2.2}
              fill={shot.goal?goalInk:shot.side==='home'?homeInk:awayInk} stroke={selected===shot.id?'white':'#15352a'} strokeWidth={selected === shot.id ? .65 : .3}
              role="button" aria-label={label} tabIndex={0} onClick={()=>setSelected(shot.id)}
              onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setSelected(shot.id);}}} className="cursor-pointer">
              <title>{label}</title>
            </circle>;
          })}
        </LandscapePitch>
        <p className="text-xs opacity-75">الأخضر لصاحب الأرض، والأخضر الفاتح للضيف، والذهبي للأهداف.</p>
        {currentShot && <p role="status" className="rounded-lg border border-emerald-500/30 p-3 text-sm">
          {matchNameInArabic(currentShot.playerName || visual[currentShot.side])} · {currentShot.outcome || 'تسديدة'} · الدقيقة {fmt(currentShot.minute)} · xG {fmt(currentShot.xg)}
        </p>}
      </> : <p className="rounded-xl border border-dashed border-emerald-600/35 p-5 text-sm">إحداثيات التسديدات غير متاحة لهذا الاختيار.</p>}
    </>}
    </>}
  </div>;
}
