'use client';

import { useState } from 'react';
import { COMPETITIONS } from '../../lib/competitions';
import LeagueDashboard from './LeagueDashboard';

export default function StandingsExplorer({ isDark = true }: { isDark?: boolean }) {
  const [league, setLeague] = useState('ksa.1');
  const selectedCompetition = COMPETITIONS[league];
  return (
    <div className="p-3 sm:p-5 space-y-4" dir="rtl">
      <label className="block text-sm font-bold">
        اختر البطولة
        <select value={league} onChange={event => setLeague(event.target.value)}
          className={`mt-2 block w-full p-3 rounded-xl border ${isDark ? 'bg-[#1a1c1e] text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'}`}>
          {(['club', 'national'] as const).map(kind => (
            <optgroup key={kind} label={kind === 'club' ? 'بطولات الأندية' : 'بطولات المنتخبات'}>
              {Object.entries(COMPETITIONS).filter(([, competition]) => competition.kind === kind).map(([code, competition]) => (
                <option key={code} value={code}>{competition.ar}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>
      <p className="text-xs text-gray-500 leading-relaxed">تُعرض آخر نسخة متاحة لدى المصدر، مع اسم موسمها. ترتيب المنتخبات هنا هو ترتيب مجموعات البطولات والتصفيات؛ وليس تصنيف FIFA العالمي.</p>
      {selectedCompetition?.searchOnly && !selectedCompetition.standingsSource ? (
        <section className={`rounded-2xl border p-5 space-y-3 ${isDark ? 'border-emerald-900 bg-[#111b16]' : 'border-emerald-200 bg-emerald-50'}`}>
          <h2 className="text-lg font-bold">{selectedCompetition.ar}</h2>
          <p className="text-sm leading-7 text-gray-500">تُعرض بيانات هذه البطولة من مصادر الاتحاد السعودي الرسمية؛ لا يتوفر لها جدول ESPN داخل اللوحة حالياً.</p>
          {selectedCompetition.officialUrl && (
            <a href={selectedCompetition.officialUrl} target="_blank" rel="noreferrer"
              className="inline-flex rounded-xl border border-emerald-500/40 px-4 py-2 text-sm font-semibold text-emerald-500 hover:bg-emerald-500/10">
              صفحة البطولة الرسمية على موقع الاتحاد السعودي
            </a>
          )}
        </section>
      ) : (
        <LeagueDashboard key={league} leagueCode={league} season="" isDark={isDark} lang="ar" />
      )}
    </div>
  );
}

