'use client';

import { useState } from 'react';
import { COMPETITIONS } from '../../lib/competitions';
import type { AppLanguage } from '../../lib/app-language';
import LeagueDashboard from './LeagueDashboard';
import OtherSportsRankings from './OtherSportsRankings';

export default function StandingsExplorer({ isDark = true, language = 'ar' }: { isDark?: boolean; language?: AppLanguage }) {
  const t = (ar: string, en: string) => language === 'ar' ? ar : en;
  const [league, setLeague] = useState('ksa.1');
  const [otherSports, setOtherSports] = useState(false);
  const selectedCompetition = COMPETITIONS[league];
  return (
    <div className="p-3 sm:p-5 space-y-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div role="group" aria-label={t('نوع الرياضة','Sport')} className="grid grid-cols-2 gap-2">
        <button type="button" aria-pressed={!otherSports} onClick={()=>setOtherSports(false)}
          className={`rounded-xl border px-3 py-3 text-sm font-bold ${!otherSports?'border-emerald-600 bg-emerald-700 text-white':'border-emerald-700/30'}`}>{t('⚽ كرة القدم','⚽ Football')}</button>
        <button type="button" aria-pressed={otherSports} onClick={()=>setOtherSports(true)}
          className={`rounded-xl border px-3 py-3 text-sm font-bold ${otherSports?'border-emerald-600 bg-emerald-700 text-white':'border-emerald-700/30'}`}>{t('🏀 الرياضات الأخرى','🏀 Other sports')}</button>
      </div>
      {otherSports ? <OtherSportsRankings language={language}/> : <>
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
      <p className="text-xs text-gray-500 leading-relaxed">{t('الترتيب حسب آخر موسم متاح من المصدر، ويعرض مجموعات بطولات المنتخبات والتصفيات.', 'Standings use the latest season available and show groups for international competitions and qualifiers.')}</p>
      {selectedCompetition?.searchOnly && !selectedCompetition.standingsSource ? (
        <section className={`rounded-2xl border p-5 space-y-3 ${isDark ? 'border-emerald-900 bg-[#111b16]' : 'border-emerald-200 bg-emerald-50'}`}>
          <h2 className="text-lg font-bold">{selectedCompetition[language]}</h2>
          <p className="text-sm leading-7 text-gray-500">{t('بيانات البطولة متاحة على موقع الاتحاد السعودي.', 'Competition data is available from the Saudi Arabian Football Federation.')}</p>
          {selectedCompetition.officialUrl && (
            <a href={selectedCompetition.officialUrl} target="_blank" rel="noreferrer"
              className="inline-flex rounded-xl border border-emerald-500/40 px-4 py-2 text-sm font-semibold text-emerald-500 hover:bg-emerald-500/10">
              {t('صفحة البطولة الرسمية', 'Official competition page')}
            </a>
          )}
        </section>
      ) : (
        <LeagueDashboard key={league} leagueCode={league} season="" isDark={isDark} lang={language} />
      )}
      </>}
    </div>
  );
}

