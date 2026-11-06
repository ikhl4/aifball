'use client';

import { useState } from 'react';
import ChatVideoCard from './ChatVideoCard';
import MatchReport from './MatchReport';
import { youtubeVideoId } from '../../lib/summary-presentation';

type Props = { attrs: Record<string, string>; isDark?: boolean };
type Event = { minute: number; time: string; label: string; kind: 'goal' | 'moment' };

function safePhoto(url?: string) {
  if (!url) return '';
  try {
    const u = new URL(url);
    return u.protocol === 'https:' && !u.username && !u.password ? u.href : '';
  } catch { return ''; }
}
function TeamBadge({ name, logo }: { name: string; logo?: string }) {
  const image = safePhoto(logo);
  return <div className="flex min-w-0 flex-1 flex-col items-center gap-2">
    {image ? <img src={image} alt={`شعار ${name}`} loading="lazy" className="h-12 w-12 object-contain" /> :
      <div aria-hidden="true" className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-500/20 bg-white/10 text-sm font-bold">{name.slice(0, 2)}</div>}
    <span className="text-center text-xs font-semibold sm:text-sm">{name}</span>
  </div>;
}

export default function MatchHighlightCard({ attrs, isDark = true }: Props) {
  const [expandedReport, setExpandedReport] = useState(false);
  const id = youtubeVideoId(attrs.video_url || '');
  const verified = attrs.video_status === 'found';
  const home = attrs.home || '';
  const away = attrs.away || '';
  const completeScore = /^\d+$/.test(attrs.home_score || '') && /^\d+$/.test(attrs.away_score || '');
  const score = completeScore ? `${attrs.home_score} - ${attrs.away_score}` : '–';
  const goals = (attrs.goals || '').split(';').map(line => line.split('|')).filter(row => row[0]?.trim() && row[1]?.trim());
  const events: Event[] = [
    ...goals.map(row => {
      const time = row[1].trim().replace(/['′]/g, '');
      return { minute: Number(time.match(/^\d+/)?.[0] || 999), time, label: `⚽ ${row[0].trim()}`, kind: 'goal' as const };
    }),
    ...(attrs.moments || '').split(';').flatMap(part => {
      const value = part.trim(), match = value.match(/(?:الدقيقة\s*)?(\d{1,3})(?:\+\d+)?[′':\s–-]/);
      return value && match ? [{ minute: Number(match[1]), time: match[1], label: value, kind: 'moment' as const }] : [];
    }),
  ].sort((a, b) => a.minute - b.minute);

  const statistics: { label: string; home: number; away: number; suffix?: string }[] = [];
  for (const [label, left, right, suffix] of [
    ['الاستحواذ', 'home_possession', 'away_possession', '%'],
    ['التسديدات', 'home_shots', 'away_shots', ''],
    ['التسديدات على المرمى', 'home_shots_on_target', 'away_shots_on_target', ''],
    ['الأهداف المتوقعة xG', 'home_xg', 'away_xg', ''],
    ['التمريرات', 'home_passes', 'away_passes', ''],
    ['التصديات', 'home_saves', 'away_saves', ''],
  ]) {
    const a = attrs[left], b = attrs[right];
    if (a != null && b != null && a.trim() && b.trim() && Number.isFinite(Number(a)) && Number.isFinite(Number(b)) && Number(a) >= 0 && Number(b) >= 0) {
      statistics.push({ label, home: Number(a), away: Number(b), suffix });
    }
  }
  const source = safePhoto(attrs.source_url);
  const when = attrs.date && /^\d{4}-\d\d-\d\d/.test(attrs.date) ? attrs.date : '';
  const hasVerifiedVideo = Boolean(id && verified);

  return <section dir="rtl" aria-label="تقرير المباراة" className={`my-4 w-full min-w-0 space-y-4 rounded-2xl border p-3 sm:p-4 ${isDark ? 'border-white/10 bg-[#101913] text-gray-100' : 'border-gray-200 bg-white text-gray-900'}`}>
    {(home && away) ? <div className={`overflow-hidden rounded-2xl border p-3 ${isDark ? 'border-emerald-500/20 bg-black/25' : 'border-emerald-600/15 bg-emerald-50/60'}`}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="font-bold text-emerald-500">{attrs.competition || 'المباراة'}</span>
        <span className="opacity-70">{when} {attrs.status === 'live' ? '· 🔴 مباشر' : attrs.status === 'upcoming' ? '· لم تبدأ' : completeScore ? '· انتهت' : ''}</span>
      </div>
      <div className="flex min-w-0 items-center gap-2">
        <TeamBadge name={home} logo={attrs.home_logo} />
        <div dir="ltr" className="shrink-0 text-center text-2xl font-black tabular-nums sm:text-3xl">{score}</div>
        <TeamBadge name={away} logo={attrs.away_logo} />
      </div>
    </div> : <h3 className="font-bold text-lg text-emerald-500">{attrs.match || 'ملخص المباراة'}</h3>}

    {attrs.summary && <div>
      <h4 className="mb-1 text-sm font-bold text-emerald-500">قصة المباراة</h4>
      <p className="whitespace-pre-line text-sm leading-7">{attrs.summary}</p>
    </div>}

    {!!events.length && <div>
      <h4 className="mb-3 text-sm font-bold text-emerald-500">الخط الزمني</h4>
      <ol className="space-y-2 border-r-2 border-emerald-500/25 pr-4">
        {events.map((event, i) => <li key={i} className="relative flex items-start gap-3 text-sm leading-6">
          <span className="absolute -right-[22px] top-2 h-2 w-2 rounded-full bg-emerald-500" />
          <bdi dir="ltr" className="shrink-0 font-bold text-emerald-500">{event.time}′</bdi>
          <span>{event.label}</span>
        </li>)}
      </ol>
    </div>}
    {attrs.moments && events.length === goals.length && <div>
      <h4 className="mb-1 text-sm font-bold text-emerald-500">أبرز الأحداث</h4>
      <p className="whitespace-pre-line text-sm leading-7">{attrs.moments.split(';').filter(Boolean).join('، ')}</p>
    </div>}

    {!!statistics.length && <details className="rounded-xl border border-emerald-500/20 p-3" open>
      <summary className="cursor-pointer text-sm font-bold text-emerald-500">إحصائيات المباراة</summary>
      <div className="mt-3 space-y-3">
        {statistics.map(stat => {
          const total = stat.home + stat.away;
          const homeWidth = total ? 100 * stat.home / total : 50;
          return <div key={stat.label} className="text-xs">
            <div className="mb-1 flex items-center justify-between gap-2"><bdi>{stat.home}{stat.suffix}</bdi><span className="text-center opacity-75">{stat.label}</span><bdi>{stat.away}{stat.suffix}</bdi></div>
            <div className="flex h-1.5 overflow-hidden rounded-full bg-gray-600/30"><div className="bg-emerald-500" style={{ width: `${homeWidth}%` }} /><div className="flex-1 bg-slate-400/70" /></div>
          </div>;
        })}
      </div>
    </details>}
    {hasVerifiedVideo && <div>
      <h4 className="mb-1 text-sm font-bold text-emerald-500">ملخص المباراة بالفيديو</h4>
      <ChatVideoCard url={attrs.video_url} title={attrs.video_title || (home && away ? `ملخص ${home} ضد ${away}` : 'ملخص المباراة')} channel={attrs.video_channel} isDark={isDark} canEmbed={attrs.video_embed === 'true' ? true : attrs.video_embed === 'false' ? false : undefined} />
    </div>}
    {/^[a-z]+(?:\\.[a-z0-9]+)+$/i.test(attrs.league || '') && /^\\d+$/.test(attrs.event || '') && (
      <div className="border-t border-emerald-500/15 pt-3">
        <button type="button" onClick={() => setExpandedReport(open => !open)} aria-expanded={expandedReport} className="rounded-xl border border-emerald-500/30 px-3 py-2 text-xs font-bold text-emerald-500 hover:bg-emerald-500/10">
          {expandedReport ? 'إغلاق التقرير التفصيلي' : 'تقرير المباراة والإحصائيات واللاعبين'}
        </button>
        {expandedReport && <MatchReport key={attrs.event} matchName={attrs.match || `${home} ضد ${away}`} eventId={attrs.event} leagueCode={attrs.league} isDark={isDark} />}
      </div>
    )}
    {source && <a href={source} target="_blank" rel="noopener noreferrer" className="inline-block text-xs font-semibold text-emerald-500 underline">{attrs.source_name || 'مصدر تفاصيل المباراة'} ↗</a>}
  </section>;
}
