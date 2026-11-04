'use client';

import React, { useId, useState } from 'react';
import type { DetailedMatchReport } from '../../lib/match-report';
import type { Scores365Report } from '../../lib/scores365-report';
import type { SpatialReport } from '../../lib/spatial-report';

type Side = 'home' | 'away';
type Metric = { key: string; label: string; home: number | null; away: number | null; percent?: boolean };
type Shot = { id: string; x: number; y: number; side: Side; xg: number | null; goal: boolean };
type PassNode = { id: string; number: string; name: string; x: number; y: number };
type PassLink = { from: string; to: string; count: number };
type Network = { nodes: PassNode[]; links: PassLink[] };
export type VisualMatch = {
  home: string;
  away: string;
  homeScore: string | number | null;
  awayScore: string | number | null;
  context: string;
  source: string;
  demo?: boolean;
  metrics: Metric[];
  shots: Shot[];
  networks?: Partial<Record<Side, Network>>;
};

// Missing and formatted provider values must never become zero.
function numeric(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string' || !/^\d+(?:\.\d+)?%?$/.test(value.trim())) return null;
  const parsed = Number(value.trim().replace('%', ''));
  return Number.isFinite(parsed) ? parsed : null;
}

export function visualFromEspn(data: DetailedMatchReport): VisualMatch {
  return {
    home: data.home.name, away: data.away.name,
    homeScore: data.home.score, awayScore: data.away.score,
    context: [data.competition, data.date?.slice(0, 10)].filter(Boolean).join(' · '),
    source: 'ESPN',
    metrics: data.statistics.map(s => ({ ...s, home: numeric(s.home), away: numeric(s.away) })),
    shots: [],
  };
}

export function visualFrom365(data: Scores365Report): VisualMatch {
  return {
    home: data.home.name, away: data.away.name,
    homeScore: data.home.score, awayScore: data.away.score,
    context: [data.competition, data.date.slice(0, 10)].filter(Boolean).join(' · '),
    source: '365Scores',
    metrics: data.statistics.map(s => ({ ...s, home: numeric(s.home), away: numeric(s.away), percent: /%/.test((s.home || '') + (s.away || '')) })),
    shots: data.shots.map(s => ({ ...s, goal: /^goal$/i.test(s.outcome) })),
  };
}

export function visualFromSofa(data: SpatialReport): VisualMatch {
  return {
    home: data.home, away: data.away,
    homeScore: data.homeScore, awayScore: data.awayScore,
    context: [data.competition, data.date?.slice(0, 10)].filter(Boolean).join(' · '),
    source: 'SofaScore', metrics: data.statistics,
    shots: data.shots.filter((s): s is typeof s & { side: Side } => s.side === 'home' || s.side === 'away')
      .map(s => ({ ...s, goal: /^goal$/i.test(s.outcome) })),
  };
}

function Pitch({ children, label }: { children: React.ReactNode; label: string }) {
  return <svg viewBox="-10 -10 320 400" role="img" aria-label={label} className="mx-auto block w-full max-w-[340px]">
    <g fill="none" stroke="currentColor" strokeWidth="1" opacity=".3">
      <rect x="10" y="10" width="280" height="360" />
      <path d="M10 190H290" /><circle cx="150" cy="190" r="38" />
      <rect x="65" y="10" width="170" height="60" /><rect x="110" y="10" width="80" height="25" />
      <rect x="65" y="310" width="170" height="60" /><rect x="110" y="345" width="80" height="25" />
      <path d="M130 10V4H170V10M130 370V376H170V370" />
    </g>{children}
  </svg>;
}

const format = (n: number | null) => n === null ? '—' : String(Math.round(n * 100) / 100);
const tabs = [['passes', 'شبكة التمريرات'], ['shots', 'خريطة التسديدات'], ['metrics', 'مؤشرات الأداء']] as const;
type Tab = typeof tabs[number][0];

export default function MatchVisualReport({ data, isDark = true }: { data: VisualMatch; isDark?: boolean }) {
  const [tab, setTab] = useState<Tab>(data.demo ? 'passes' : 'metrics');
  const [side, setSide] = useState<Side>('home');
  const [selected, setSelected] = useState<string | null>(null);
  const id = useId();
  const surface = isDark ? 'bg-[#081b15] text-gray-100 border-emerald-900/60' : 'bg-white text-gray-900 border-emerald-200';
  const panel = isDark ? 'bg-[#10291f]' : 'bg-emerald-50/60';
  const subtle = isDark ? 'text-gray-300' : 'text-gray-600';
  const green = isDark ? '#4cdda0' : '#087e50';
  const orange = isDark ? '#f3ae71' : '#b55a19';
  const button = 'min-h-[44px] rounded-xl border px-3 py-2 text-xs transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2';
  const selectedButton = 'bg-emerald-700 border-emerald-700 text-white';
  const neutralButton = isDark ? 'border-emerald-800 text-gray-200' : 'border-emerald-200 text-gray-800';
  const network = data.networks?.[side];
  const nodes = network?.nodes.filter(n => [n.x, n.y].every(v => Number.isFinite(v) && v >= 0 && v <= 100)) || [];
  const nodeIds = new Set(nodes.map(n => n.id));
  const links = network?.links.filter(l => nodeIds.has(l.from) && nodeIds.has(l.to) && Number.isFinite(l.count) && l.count > 0) || [];
  const activeNode = nodes.find(n => n.id === selected);
  const shots = data.shots.filter(s => s.side === side && [s.x, s.y].every(v => Number.isFinite(v) && v >= 0 && v <= 100));
  const metrics = data.metrics.filter(m => m.home !== null || m.away !== null);
  const summaries = [
    metrics.find(m => /^(expectedGoals|expected_goals|xg)$/i.test(m.key) || /xG/.test(m.label)),
    metrics.find(m => /^(totalShots|shots|total_shots)$/i.test(m.key) || m.label === 'التسديدات'),
    metrics.find(m => /^(possessionPct|ballPossession|possession|ball_possession)$/i.test(m.key) || m.label === 'الاستحواذ'),
  ].filter((m): m is Metric => !!m);

  return <section dir="rtl" aria-label="تقرير فوتبلاي المرئي" className={`my-5 w-full overflow-hidden rounded-3xl border font-[Cairo] ${surface}`}>
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-600/20 p-4 sm:p-5">
      <div><h3 className="text-base font-bold">فوتبلاي · تقرير المباراة</h3><p className={`mt-1 text-xs ${subtle}`}>{data.context}</p></div>
      <span className={`rounded-lg px-2 py-1 text-xs ${panel}`}>{data.demo ? 'معاينة ببيانات افتراضية' : data.source}</span>
    </header>
    <div className="p-4 sm:p-5">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 py-4 text-center">
        <b className="min-w-0 break-words text-sm sm:text-lg">{data.home}</b>
        <b dir="ltr" className="whitespace-nowrap text-2xl tabular-nums sm:text-3xl">{data.homeScore ?? '—'} – {data.awayScore ?? '—'}</b>
        <b className="min-w-0 break-words text-sm sm:text-lg">{data.away}</b>
      </div>
      {data.demo && <p className={`mb-4 text-center text-xs ${subtle}`}>مواجهة افتراضية لعرض التصميم والتفاعل</p>}
      <div className="grid grid-cols-1 gap-2 min-[380px]:grid-cols-3">
        {summaries.map(m => <div key={m.key} className={`rounded-2xl p-3 text-center ${panel}`}>
          <p className={`text-xs ${subtle}`}>{m.label}</p><b dir="ltr" className="mt-2 block whitespace-nowrap text-sm tabular-nums sm:text-lg">{format(m.home)}{m.percent && m.home !== null ? '%' : ''} — {format(m.away)}{m.percent && m.away !== null ? '%' : ''}</b>
        </div>)}
      </div>
      <div role="tablist" aria-label="أقسام التقرير المرئي" className="my-5 flex flex-wrap gap-2">
        {tabs.map(([key, label]) => <button key={key} type="button" role="tab" id={`${id}-${key}`} aria-controls={`${id}-panel`} aria-selected={tab === key} className={`${button} ${tab === key ? selectedButton : neutralButton}`} onClick={() => { setTab(key); setSelected(null); }}>{label}</button>)}
      </div>
      <div role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-${tab}`} className={`rounded-2xl p-3 sm:p-4 ${panel}`}>
        {tab !== 'metrics' && <div role="group" aria-label="الفريق المعروض" className="mb-4 flex flex-wrap gap-2">
          {(['home', 'away'] as const).map(s => <button key={s} type="button" aria-pressed={side === s} className={`${button} ${side === s ? selectedButton : neutralButton}`} onClick={() => { setSide(s); setSelected(null); }}>{data[s]}</button>)}
        </div>}
        {tab === 'passes' && <>
          <h4 className="mb-2 text-sm font-bold">شبكة تمريرات {data[side]}</h4>
          {nodes.length && links.length ? <>
            <p className={`mb-3 text-xs ${subtle}`}>متوسط مواقع التمرير · الهجوم إلى الأعلى ↑ · سماكة الخط تعكس عدد التمريرات</p>
            <Pitch label={`شبكة تمريرات ${data[side]}`}>
              {links.map((l, i) => {
                const from = nodes.find(n => n.id === l.from)!;
                const to = nodes.find(n => n.id === l.to)!;
                return <line key={i} x1={25 + from.x * 2.5} y1={25 + from.y * 3.3} x2={25 + to.x * 2.5} y2={25 + to.y * 3.3} stroke={green} strokeWidth={Math.min(7, 1 + l.count / 7)} opacity={!activeNode || l.from === activeNode.id || l.to === activeNode.id ? .5 : .08} />;
              })}
              {nodes.map(n => <g key={n.id}><circle cx={25 + n.x * 2.5} cy={25 + n.y * 3.3} r={selected === n.id ? 15 : 12} fill={isDark ? '#10291f' : '#ffffff'} stroke={green} strokeWidth={selected === n.id ? 3 : 1.5} /><text x={25 + n.x * 2.5} y={29 + n.y * 3.3} textAnchor="middle" fill="currentColor" fontSize="12">{n.number}</text></g>)}
            </Pitch>
            <div className="mt-4 flex flex-wrap gap-2">{nodes.map(n => <button key={n.id} type="button" aria-pressed={selected === n.id} className={`${button} ${selected === n.id ? selectedButton : neutralButton}`} onClick={() => setSelected(selected === n.id ? null : n.id)}>{n.number} · {n.name}</button>)}</div>
            <p aria-live="polite" className="mt-4 text-sm">{activeNode ? `${activeNode.name} · ${links.filter(l => l.from === activeNode.id || l.to === activeNode.id).length} روابط تمرير موضحة` : 'اختر لاعبًا لإبراز روابط تمريره.'}</p>
          </> : <p className={`py-5 text-sm leading-7 ${subtle}`}>شبكة التمريرات غير متاحة لهذه المباراة في استجابة المصدر. يلزم متوسط مواقع اللاعبين وعدد التمريرات بينهم لرسمها.</p>}
        </>}
        {tab === 'shots' && <>
          <h4 className="mb-2 text-sm font-bold">مواقع تسديدات {data[side]}</h4>
          {shots.length ? <>
            <p className={`mb-3 text-xs leading-6 ${subtle}`}>الإحداثيات بحسب المصدر · حجم الدائرة يعكس xG عند توفره · إطار الدائرة يحدد الهدف</p>
            <Pitch label={`مواقع تسديدات ${data[side]}`}>
              {shots.map((s, i) => <circle key={`${s.id}-${i}`} cx={10 + s.y * 2.8} cy={370 - s.x * 3.6} r={s.xg !== null && Number.isFinite(s.xg) && s.xg >= 0 && s.xg <= 1 ? 4 + Math.sqrt(s.xg) * 13 : 5} fill={side === 'home' ? green : orange} fillOpacity={s.goal ? 1 : .35} stroke={s.goal ? 'currentColor' : 'none'} strokeWidth="2"><title>{s.goal ? 'هدف' : 'تسديدة'} · xG {format(s.xg)}</title></circle>)}
            </Pitch>
            <p className={`mt-3 text-xs ${subtle}`}>{shots.length} تسديدة بإحداثيات متاحة · الدوائر دون xG بحجم ثابت</p>
          </> : <p className={`py-5 text-sm leading-7 ${subtle}`}>لم تصل إحداثيات تسديدات صالحة لهذا الفريق. عدد التسديدات الإجمالي يظهر في المؤشرات عندما يوفره المصدر.</p>}
        </>}
        {tab === 'metrics' && <>
          <h4 className="text-sm font-bold">مقارنة مؤشرات الأداء</h4><p className={`my-2 text-xs ${subtle}`}>{data.home} يمينًا · {data.away} يسارًا · «—» تعني غير متاح</p>
          {metrics.map(m => {
            const total = m.home !== null && m.away !== null && m.home >= 0 && m.away >= 0 ? m.home + m.away : 0;
            return <div key={m.key} className="border-b border-emerald-600/15 py-4 last:border-0">
              <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 text-sm"><b dir="ltr" className="tabular-nums">{format(m.home)}{m.percent && m.home !== null ? '%' : ''}</b><span className="text-center text-xs">{m.label}</span><b dir="ltr" className="tabular-nums">{format(m.away)}{m.percent && m.away !== null ? '%' : ''}</b></div>
              {total > 0 && <div className="mt-3 flex h-1.5 gap-1 overflow-hidden rounded-full" aria-hidden="true"><span style={{ width: `${m.home! / total * 100}%`, background: green }} /><span style={{ width: `${m.away! / total * 100}%`, background: orange }} /></div>}
            </div>;
          })}
          {!metrics.length && <p className={`py-5 text-sm ${subtle}`}>مؤشرات الأداء غير متاحة في استجابة المصدر.</p>}
        </>}
      </div>
      <footer className={`mt-4 flex flex-wrap justify-between gap-2 text-xs ${subtle}`}><span>من الرياض إلى العالم</span><span>{data.demo ? 'القيم والإحداثيات افتراضية للتوضيح فقط' : `بيانات المباراة · ${data.source}`}</span></footer>
    </div>
  </section>;
}

const demoNodes: PassNode[] = [
  { id: '1', number: '1', name: 'الحارس', x: 50, y: 91 },
  { id: '2', number: '2', name: 'الظهير الأيسر', x: 16, y: 64 },
  { id: '4', number: '4', name: 'قلب الدفاع الأيسر', x: 38, y: 74 },
  { id: '5', number: '5', name: 'قلب الدفاع الأيمن', x: 65, y: 72 },
  { id: '3', number: '3', name: 'الظهير الأيمن', x: 86, y: 60 },
  { id: '6', number: '6', name: 'محور الارتكاز', x: 48, y: 52 },
  { id: '8', number: '8', name: 'الوسط الأيسر', x: 30, y: 38 },
  { id: '10', number: '10', name: 'صانع اللعب', x: 67, y: 35 },
  { id: '7', number: '7', name: 'الجناح الأيسر', x: 15, y: 19 },
  { id: '9', number: '9', name: 'المهاجم', x: 51, y: 13 },
  { id: '11', number: '11', name: 'الجناح الأيمن', x: 87, y: 20 },
];
const demoLinks: PassLink[] = [
  ['1', '4', 14], ['1', '5', 11], ['2', '4', 18], ['4', '5', 23],
  ['4', '6', 26], ['5', '3', 16], ['5', '6', 19], ['2', '8', 17],
  ['6', '8', 28], ['6', '10', 31], ['8', '7', 21], ['8', '10', 16],
  ['10', '9', 24], ['10', '11', 22], ['3', '11', 18], ['7', '9', 12],
].map(([from, to, count]) => ({ from: String(from), to: String(to), count: Number(count) }));

export function MatchVisualDemo({ isDark = true }: { isDark?: boolean }) {
  const data: VisualMatch = {
    home: 'الاتحاد', away: 'الهلال', homeScore: 2, awayScore: 1,
    context: 'نموذج تصميم · مواجهة افتراضية', source: 'بيانات توضيحية', demo: true,
    metrics: [
      { key: 'expectedGoals', label: 'الأهداف المتوقعة xG', home: 1.84, away: 1.12 },
      { key: 'totalShots', label: 'التسديدات', home: 14, away: 9 },
      { key: 'possessionPct', label: 'الاستحواذ', home: 54, away: 46, percent: true },
      { key: 'accuratePasses', label: 'التمريرات الناجحة', home: 432, away: 368 },
      { key: 'finalThirdPasses', label: 'تمريرات إلى الثلث الأخير', home: 68, away: 51 },
      { key: 'highRecoveries', label: 'استرجاع في الثلث الهجومي', home: 8, away: 5 },
      { key: 'boxEntries', label: 'الدخول إلى منطقة الجزاء', home: 24, away: 17 },
      { key: 'ppda', label: 'PPDA · تمريرات لكل فعل دفاعي', home: 9.4, away: 13.2 },
    ],
    networks: {
      home: { nodes: demoNodes, links: demoLinks },
      away: { nodes: demoNodes.map(n => ({ ...n, x: 100 - n.x })), links: demoLinks.map(l => ({ ...l, count: Math.max(1, l.count - 5) })) },
    },
    shots: [
      [.35, .17, .32, 1], [.6, .22, .18, 0], [.47, .12, .45, 1], [.22, .29, .06, 0],
      [.72, .32, .04, 0], [.53, .3, .13, 0], [.4, .36, .07, 0], [.8, .21, .03, 0],
      [.25, .16, .09, 0], [.64, .12, .14, 0], [.44, .26, .1, 0], [.3, .4, .02, 0],
      [.75, .38, .05, 0], [.55, .45, .16, 0], [.47, .2, .35, 1], [.36, .28, .12, 0],
      [.7, .24, .09, 0], [.58, .32, .12, 0], [.24, .28, .05, 0], [.41, .12, .2, 0],
      [.65, .15, .08, 0], [.8, .3, .04, 0], [.3, .4, .07, 0],
    ].map(([x, y, xg, goal], i) => ({ id: String(i), x: (1 - y) * 100, y: x * 100, xg, goal: goal === 1, side: i < 14 ? 'home' : 'away' })),
  };
  return <MatchVisualReport data={data} isDark={isDark} />;
}
