'use client';
import React, { useEffect, useState } from 'react';
import type { ScoresLanguage } from '../../lib/football-scoreboard';
import type { MatchDetails } from '../../lib/match-details';
import { footballNameInArabic } from '../../lib/football-names-ar';

export default function MatchSummary({ eventId, league, isDark = true, language = 'ar' }: { eventId: string; league: string; isDark?: boolean; language?: ScoresLanguage }) {
  const t = (ar: string, en: string) => language === 'ar' ? ar : en;
  const teamName = (name: string) => language === 'ar' ? footballNameInArabic(name) || name : name;
  const [data, setData] = useState<MatchDetails | null>(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'events' | 'statistics' | 'players'>('events');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true, pending = false;
    const controller = new AbortController();
    setData(null); setError(''); setTab('events');
    const refresh = async () => {
      if (pending) return;
      pending = true;
      try {
        const response = await fetch(`/api/match-details?league=${encodeURIComponent(league)}&event=${encodeURIComponent(eventId)}`, { signal: controller.signal, cache: 'no-store' });
        const next = await response.json();
        if (!response.ok || next.eventId !== eventId || next.league !== league) throw new Error('unavailable');
        if (active) { setData(next); setError(''); }
      } catch { if (active) setError('unavailable'); }
      finally { pending = false; }
    };
    void refresh();
    const interval = setInterval(() => { void refresh(); }, 60000);
    return () => { active = false; controller.abort(); clearInterval(interval); };
  }, [eventId, league, retry]);
  const empty = t('غير متاح من المصدر حالياً.', 'unavailable from the source.');
  return <section dir={language === 'ar' ? 'rtl' : 'ltr'} aria-label={t('تفاصيل المباراة', 'Match details')} className={`p-3 text-sm ${isDark ? 'bg-[#0a0e17] text-gray-200' : 'bg-white text-gray-800'}`}>
    <div role="tablist" aria-label={t('أقسام تفاصيل المباراة', 'Match detail sections')} className="flex gap-1 mb-4">
      {([['events', t('الأحداث', 'Events')], ['statistics', t('الإحصائيات', 'Statistics')], ['players', t('التشكيلة', 'Lineups')]] as const).map(([id, label]) => <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={`flex-1 p-2 rounded-lg ${tab === id ? 'bg-emerald-600 text-white' : isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>{label}</button>)}
    </div>
    {error && <div role="alert" className="text-amber-600 mb-3">{t('تعذّر تحديث التفاصيل. أي بيانات ظاهرة من آخر جلب ناجح.', 'Could not refresh details. Showing the last available data.')} <button className="underline" onClick={() => setRetry(n => n + 1)}>{t('إعادة المحاولة', 'Retry')}</button></div>}
    {!data && !error && <p role="status">{t('جارٍ جلب تفاصيل المباراة…', 'Loading match details…')}</p>}
    {data && <div role="tabpanel">
      {tab === 'events' && (data.events.length ? <ol className="space-y-3">{data.events.map(e => <li key={e.id} className="border-b border-gray-500/20 pb-2">
        <div className="flex justify-between gap-2"><span>{t(e.label, e.englishLabel)}{e.shootout ? t(' · الترجيح', ' · Shootout') : ''}</span><bdi dir="ltr">{e.minute || '—'}</bdi></div>
        <p className="text-xs text-gray-500 mt-1">{t('اللاعبون المرتبطون بالحدث', 'Players involved')}</p>
        <p className="font-bold break-words">{e.players.join(' / ') || t('اسم اللاعب غير متاح', 'Player name unavailable')}</p>
        <p className="text-xs text-emerald-600">{teamName(e.teamId === data.home.id ? data.home.name : e.teamId === data.away.id ? data.away.name : t('الفريق غير متاح', 'Team unavailable'))}</p>
      </li>)}</ol> : <p>{data.state === 'pre' ? t('المباراة لم تبدأ بعد.', 'The match has not started.') : t('تفاصيل الأحداث', 'Event details') + ' ' + empty}</p>)}
      {tab === 'statistics' && <><div className="grid grid-cols-3 text-center font-bold mb-3"><span>{teamName(data.home.name)}</span><span>{t('الإحصائية', 'Statistic')}</span><span>{teamName(data.away.name)}</span></div>{data.statistics.length ? data.statistics.map(s => <div key={s.key} className="grid grid-cols-3 text-center border-b border-gray-500/20 py-2"><bdi>{s.home == null ? '—' : s.home + (s.percent ? '%' : '')}</bdi><span>{t(s.label, s.key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, c => c.toUpperCase()))}</span><bdi>{s.away == null ? '—' : s.away + (s.percent ? '%' : '')}</bdi></div>) : <p>{t('الإحصائيات', 'Statistics')} {empty}</p>}</>}
      {tab === 'players' && <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{[data.home, data.away].map(team => <div key={team.id}><h3 className="font-bold text-emerald-600">{teamName(team.name)}</h3>{team.formation && <p>{t('الخطة', 'Formation')} <bdi dir="ltr">{team.formation}</bdi></p>}{!team.players.length ? <p>{t('التشكيلة', 'Lineups')} {empty}</p> : ([true, false, null] as const).map(starter => { const players = team.players.filter(p => p.starter === starter); return players.length ? <div key={String(starter)}><h4 className="font-bold mt-3 mb-2">{starter === true ? t('الأساسيون', 'Starters') : starter === false ? t('البدلاء', 'Substitutes') : t('لاعبون لم يحدد المصدر مشاركتهم', 'Participation not confirmed')}</h4><ul className="space-y-2">{players.map((p, i) => <li key={p.id || i} className="flex gap-2"><span className="text-gray-500">{p.jersey || '—'}</span><span className="break-words">{p.name} <small className="text-gray-500">{p.position}</small></span></li>)}</ul></div> : null; })}</div>)}</div>}
      <p className="text-xs text-gray-500 mt-4">{t('آخر تحديث', 'Last updated')} {new Intl.DateTimeFormat(language === 'ar' ? 'ar-SA' : 'en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Riyadh' }).format(new Date(data.fetchedAt))} {t('بتوقيت الرياض', 'Riyadh time')}{data.venue ? ` · ${data.venue}` : ''}</p>
    </div>}
  </section>;
}
