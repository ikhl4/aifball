'use client';

import { useEffect, useState } from 'react';
import MatchSummary from './MatchSummary';
import type { PosterMatch } from '../../lib/match-card-data';

type Response = { match?: PosterMatch };
function TeamMark({ name, logo }: { name: string; logo: string | null }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [logo]);
  return <div className="flex min-w-0 flex-1 flex-col items-center gap-2">
    <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/10 sm:h-14 sm:w-14">
      {logo && !failed ? <img src={logo} alt={`شعار ${name}`} loading="lazy" className="h-10 w-10 object-contain sm:h-12 sm:w-12" onError={() => setFailed(true)} /> : <span className="text-sm font-black">{name.slice(0, 2)}</span>}
    </div>
    <span className="w-full break-words text-center text-xs font-bold sm:text-sm">{name}</span>
  </div>;
}

/** Official scoreboard-backed card. If the fixture cannot be independently
 * identified, render nothing and leave the original text intact. */
export default function MatchResultCard({ query, isDark = true, onDetails }: {
  query: string;
  isDark?: boolean;
  onDetails?: (query: string) => void;
}) {
  const [match, setMatch] = useState<PosterMatch | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  useEffect(() => {
    const abort = new AbortController();
    setMatch(null);
    setDetailsOpen(false);
    const requested = `بطاقة ${query}`;
    fetch('/api/match-card?query=' + encodeURIComponent(requested), { signal: abort.signal, cache: 'no-store' })
      .then(async response => response.ok ? response.json() as Promise<Response> : null)
      .then(result => { if (!abort.signal.aborted) setMatch(result?.match || null); })
      .catch(() => { if (!abort.signal.aborted) setMatch(null); });
    return () => abort.abort();
  }, [query]);

  if (!match) return null;
  const finished = match.status === 'finished';
  const live = match.status === 'live';
  const date = new Date(match.date);
  const when = Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat('ar-SA', {
    timeZone: 'Asia/Riyadh', dateStyle: 'medium', timeStyle: 'short',
  }).format(date) : null;

  return <section dir="rtl" aria-label="بطاقة نتيجة المباراة" className={`mb-4 min-w-0 overflow-hidden rounded-2xl border px-3 py-3 sm:px-4 ${isDark ? 'border-emerald-600/25 bg-[#101c17] text-gray-100' : 'border-emerald-600/20 bg-emerald-50/60 text-gray-900'}`}>
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-emerald-700/20 pb-2 text-xs">
      <span className="font-semibold text-emerald-500">{match.competition}</span>
      <span className={live ? 'font-bold text-red-500' : 'opacity-75'}>{live ? '● LIVE' : finished ? 'انتهت' : 'لم تبدأ'}{match.statusDetail ? ` · ${match.statusDetail}` : ''}</span>
    </div>
    <div className="flex min-w-0 items-center justify-between gap-2">
      <TeamMark name={match.home.name} logo={match.home.logo} />
      <div className="shrink-0 text-center">
        <div dir="ltr" className="text-2xl font-black tabular-nums sm:text-3xl">
          {match.score ? `${match.score.home} - ${match.score.away}` : '–'}
        </div>
        <span className="text-[11px] opacity-70">{live ? 'مباشر' : finished ? 'النتيجة النهائية' : 'موعد المباراة'}</span>
      </div>
      <TeamMark name={match.away.name} logo={match.away.logo} />
    </div>
    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-emerald-700/20 pt-3 text-xs">
      <span className="opacity-75">{when ? `${when} · الرياض` : 'التوقيت غير متاح'}</span>
      <button type="button" onClick={() => setDetailsOpen(open => !open)} aria-expanded={detailsOpen} className="rounded-lg border border-emerald-500/30 px-3 py-1.5 font-semibold text-emerald-500 hover:bg-emerald-500/10">{detailsOpen ? 'إخفاء التفاصيل' : 'تفاصيل المباراة'}</button>
    </div>
    {detailsOpen && <MatchSummary key={match.id} eventId={match.id} league={match.league} isDark={isDark} />}
  </section>;
}
