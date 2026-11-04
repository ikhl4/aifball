'use client';
import React, { useEffect, useState } from 'react';
import type { PosterMatch } from '../../lib/match-card-data';
function Team({ team }: { team: PosterMatch['home'] }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [team.logo]);
  return <div className="flex-1 min-w-0 flex flex-col items-center gap-3 text-center">
    <div className="w-20 h-20 sm:w-28 sm:h-28 flex items-center justify-center rounded-3xl bg-white/10 border border-white/10">
      {team.logo && !failed ? <img src={team.logo} alt={`شعار ${team.name}`} crossOrigin="anonymous" referrerPolicy="no-referrer" onError={() => setFailed(true)} className="w-[85%] h-[85%] object-contain" /> : <span className="text-3xl font-black">{team.name.slice(0,2)}</span>}
    </div>
    <h3 className="text-base sm:text-xl font-black leading-snug">{team.name}</h3>
  </div>;
}
export default function MatchPoster({ query }: { query: string }) {
  const [match, setMatch] = useState<PosterMatch | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(''); setMatch(null);
    fetch('/api/match-card?query=' + encodeURIComponent(query), { signal: controller.signal, cache: 'no-store' })
      .then(async response => { const json = await response.json(); if (!response.ok) throw new Error(json.error || 'تعذر جلب المباراة'); return json; })
      .then(json => setMatch(json.match)).catch(err => { if (!controller.signal.aborted) setError(err.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [query]);
  if (loading) return <div role="status" dir="rtl" className="p-6 text-sm text-emerald-500">جارٍ التحقق من بيانات المباراة والشعارات…</div>;
  if (!match) return <p role="alert" dir="rtl" className="p-4 text-amber-500 text-sm">{error || 'البطاقة غير متوفرة.'}</p>;
  const when = new Intl.DateTimeFormat('ar-SA', { dateStyle: 'full', timeStyle: 'short', timeZone: 'Asia/Riyadh' }).format(new Date(match.date));
  const status = match.status === 'upcoming' ? 'مباراة قادمة' : match.status === 'finished' ? 'انتهت المباراة' : 'مباشر';
  return <figure dir="rtl" className="my-5 w-full max-w-xl mx-auto">
    <div className="relative overflow-hidden rounded-3xl border border-emerald-400/20 bg-[#071d19] text-white shadow-2xl px-4 py-8 sm:px-9 sm:py-10" aria-label={`بطاقة ${match.home.name} ضد ${match.away.name}`}>
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none" style={{background:'radial-gradient(ellipse at 10% 0%, #155b4a 0%, transparent 55%), radial-gradient(ellipse at 90% 100%, #0b3e49 0%, transparent 60%)'}} />
      <div className="relative">
        <div className="text-center mb-8">
          <span className="inline-block text-xs uppercase tracking-widest text-emerald-300 font-bold">AiFBall • من الرياض للعالم</span>
          <h2 className="mt-3 text-lg sm:text-xl font-black">{match.competition}</h2>
          <span className={`mt-3 inline-block rounded-full px-4 py-1.5 text-xs font-bold ${match.status === 'live' ? 'bg-red-600' : 'bg-white/10'}`}>{status}{match.statusDetail ? ` • ${match.statusDetail}` : ''}</span>
        </div>
        <div className="flex items-start gap-2 sm:gap-4 justify-between">
          <Team team={match.home} />
          <div className="shrink-0 pt-9 sm:pt-12 min-w-[82px] text-center">
            {match.score ? <div dir="ltr" className="text-3xl sm:text-4xl font-black tabular-nums whitespace-nowrap">{match.score.home} - {match.score.away}</div> : <div className="text-3xl font-black tracking-widest text-emerald-300">VS</div>}
          </div>
          <Team team={match.away} />
        </div>
        <div className="mt-9 pt-5 border-t border-white/15 text-center space-y-1.5">
          <p className="text-sm font-bold">{when} <span className="text-emerald-300 text-xs">• بتوقيت الرياض</span></p>
          {match.venue && <p className="text-xs text-gray-300">{match.venue}</p>}
        </div>
      </div>
    </div>
    <figcaption className="text-xs text-gray-500 mt-3 text-center">بيانات ESPN عند الطلب؛ الشعارات من بيانات الفريق لدى المصدر. {match.source && <a href={match.source} target="_blank" rel="noopener noreferrer" className="underline text-emerald-500">تفاصيل المباراة</a>}</figcaption>
  </figure>;
}
