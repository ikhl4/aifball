'use client';

import { useEffect, useState } from 'react';
import { COMPETITIONS } from '../../lib/competitions';
import type { AppLanguage } from '../../lib/app-language';
import LeagueDashboard from './LeagueDashboard';
import OtherSportsRankings from './OtherSportsRankings';
import { footballNameInArabic } from '../../lib/football-names-ar';

export default function StandingsExplorer({ isDark = true, language = 'ar' }: { isDark?: boolean; language?: AppLanguage }) {
  const t = (ar: string, en: string) => language === 'ar' ? ar : en;
  const [league, setLeague] = useState('ksa.1');
  const [otherSports, setOtherSports] = useState(false);
  const [tab, setTab] = useState<'standings' | 'goals' | 'assists'>('standings');
  const [leaders, setLeaders] = useState<{id:number; name:string; team:string; photo:string|null; logo:string|null; value:number}[]>([]);
  const [leadersStatus, setLeadersStatus] = useState<'loading' | 'ready' | 'unavailable'>('loading');
  const [leaderSource, setLeaderSource] = useState('');
  const [showAll, setShowAll] = useState(false);
  const selectedCompetition = COMPETITIONS[league];
  useEffect(() => {
    if (otherSports || tab === 'standings') return;
    const controller = new AbortController();
    setLeaders([]); setLeaderSource(''); setShowAll(false); setLeadersStatus('loading');
    fetch('/api/football-leaders?league=' + encodeURIComponent(league) + '&kind=' + tab, { signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw Error('Unavailable');
        return response.json() as Promise<{players?: typeof leaders; source?:string; season?:number}>;
      })
      .then(data => {
        if (controller.signal.aborted) return;
        const players = Array.isArray(data.players) ? data.players : [];
        setLeaders(players);
        setLeaderSource((data.source || 'API-Football') + (data.season ? ' · ' + data.season : ''));
        setLeadersStatus(players.length ? 'ready' : 'unavailable');
      })
      .catch(() => { if (!controller.signal.aborted) setLeadersStatus('unavailable'); });
    return () => controller.abort();
  }, [league, tab, otherSports]);
  return (
    <div className="p-2 sm:p-5 space-y-3" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div role="group" aria-label={t('نوع الرياضة','Sport')} className="grid grid-cols-2 gap-2">
        <button type="button" aria-pressed={!otherSports} onClick={()=>setOtherSports(false)}
          className={`rounded-xl border px-2 py-2.5 text-xs font-bold sm:text-sm ${!otherSports?'border-emerald-600 bg-emerald-700 text-white':'border-emerald-700/30'}`}>{t('⚽ كرة القدم','⚽ Football')}</button>
        <button type="button" aria-pressed={otherSports} onClick={()=>setOtherSports(true)}
          className={`rounded-xl border px-2 py-2.5 text-xs font-bold sm:text-sm ${otherSports?'border-emerald-600 bg-emerald-700 text-white':'border-emerald-700/30'}`}>{t('🏀 الرياضات الأخرى','🏀 Other sports')}</button>
      </div>
      {otherSports ? <OtherSportsRankings language={language}/> : <>
      <div role="tablist" aria-label={t('إحصائيات كرة القدم','Football statistics')} className="grid grid-cols-3 gap-1.5">
        {([
          ['standings','الترتيب','Standings'],
          ['goals','الهدافين','Top scorers'],
          ['assists','صناع اللعب','Top assists']
        ] as const).map(([id,ar,en]) =>
          <button key={id} role="tab" type="button" aria-selected={tab===id} onClick={()=>{setTab(id);setShowAll(false);}}
            className={`min-h-10 rounded-lg border px-1 py-2 text-xs font-bold ${tab===id?'border-emerald-600 bg-emerald-700 text-white':'border-emerald-700/30'}`}>{t(ar,en)}</button>)}
      </div>
      <label className="block text-sm font-bold">
        {t('اختر البطولة', 'Choose a competition')}
        <select value={league} onChange={event => setLeague(event.target.value)}
          className={`mt-2 block w-full p-3 rounded-xl border ${isDark ? 'bg-[#1a1c1e] text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'}`}>
          {(['club', 'national'] as const).map(kind => (
            <optgroup key={kind} label={kind === 'club' ? t('بطولات الأندية', 'Club competitions') : t('بطولات المنتخبات', 'International competitions')}>
              {Object.entries(COMPETITIONS).filter(([, competition]) => competition.kind === kind).map(([code, competition]) => (
                <option key={code} value={code}>{competition[language]}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>
      {tab === 'standings' ? <>
        <p className="text-xs text-gray-500 leading-relaxed">{t('الترتيب حسب آخر موسم متاح من المصدر، ويعرض مجموعات بطولات المنتخبات والتصفيات.', 'Standings use the latest available season and show competition groups.')}</p>
        {selectedCompetition?.searchOnly && !selectedCompetition.standingsSource ? (
          <section className={`rounded-xl border p-3 space-y-2 ${isDark?'border-emerald-900 bg-[#111b16]':'border-emerald-200 bg-emerald-50'}`}>
            <h2 className="text-sm font-bold">{selectedCompetition[language]}</h2>
            <p className="text-xs text-gray-500">{t('ترتيب هذه البطولة غير متاح عبر المصدر الحالي.', 'Verified standings are unavailable from the current source.')}</p>
            {selectedCompetition.officialUrl && <a href={selectedCompetition.officialUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-emerald-500">{t('صفحة البطولة الرسمية','Official competition page')}</a>}
          </section>
        ) : <LeagueDashboard key={league} leagueCode={league} season="" isDark={isDark} lang={language}/>}
      </> : <section className={`overflow-hidden rounded-xl border ${isDark?'border-emerald-800 bg-[#11251b]':'border-emerald-200 bg-white'}`}>
        <header className="flex items-center justify-between gap-2 p-3">
          <h2 className="text-sm font-extrabold">{tab==='goals'?t('ترتيب الهدافين','Top scorers'):t('ترتيب صناع اللعب','Top assists')}</h2>
          <span className="text-xs opacity-60">{leaderSource}</span>
        </header>
        {leadersStatus==='loading' && <p role="status" className="p-3 text-sm">{t('جارٍ جلب الأرقام الموثقة…','Loading verified statistics…')}</p>}
        {leadersStatus==='unavailable' && <p role="status" className="p-3 text-sm">{t('لا تتوفر بيانات مؤكدة للهدافين أو صناع اللعب في هذه البطولة حاليًا.', 'Verified leaderboard data is unavailable for this competition.')}</p>}
        {leadersStatus==='ready' && <>
          {(showAll?leaders:leaders.slice(0,5)).map((player,index) => <div key={player.id} className="flex items-center gap-2 border-t border-emerald-700/15 px-2 py-2">
            <bdi className="w-5 shrink-0 text-center text-xs font-extrabold text-emerald-500">{index+1}</bdi>
            {player.photo && <img src={player.photo} alt="" className="h-7 w-7 shrink-0 rounded-full object-cover"/>}
            <div className="min-w-0 flex-1"><bdi dir="auto" className="block truncate text-xs font-bold">{language === 'ar' ? (footballNameInArabic(player.name) || player.name) : player.name}</bdi><bdi dir="auto" className="block truncate text-[11px] opacity-60">{language === 'ar' ? (footballNameInArabic(player.team) || player.team) : player.team}</bdi></div>
            {player.logo && <img src={player.logo} alt="" className="h-5 w-5 shrink-0 object-contain"/>}
            <bdi className="min-w-7 text-center text-sm font-extrabold">{player.value}</bdi>
          </div>)}
          {leaders.length>5 && <button type="button" onClick={()=>setShowAll(!showAll)} className="w-full border-t border-emerald-700/15 px-3 py-2 text-xs font-bold text-emerald-500">
            {showAll?t('عرض أقل','Show fewer'):t('عرض الترتيب كامل','Show full ranking')}
          </button>}
        </>}
      </section>}
      </>}
    </div>
  );
}

