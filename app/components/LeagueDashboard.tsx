'use client';
import React, { useEffect, useState } from 'react';

const LEAGUE_NAMES: Record<string, string> = {
  'ksa.1': 'دوري روشن السعودي',
  'eng.1': 'الدوري الإنجليزي',
  'esp.1': 'الدوري الإسباني',
  'ita.1': 'الدوري الإيطالي',
  'ger.1': 'الدوري الألماني',
  'fra.1': 'الدوري الفرنسي',
  'egy.1': 'الدوري المصري',
  'uae.1': 'الدوري الإماراتي',
  'qat.1': 'دوري نجوم قطر',
  'usa.1': 'الدوري الأمريكي',
};

interface Props {
  leagueCode?: string;
  isDark?: boolean;
}

export default function LeagueDashboard({ leagueCode = 'ksa.1', isDark = true }: Props) {
  const [rows, setRows] = useState<any[]>([]);
  const [season, setSeason] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/standings?league=${encodeURIComponent(leagueCode)}`);
        const json = await res.json();
        if (!res.ok || json.error) throw new Error(json.error || 'فشل جلب الترتيب');
        if (!cancelled) {
          setRows(json.rows || []);
          setSeason(json.season || '');
        }
      } catch (e: any) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [leagueCode]);

  const box = `w-full rounded-3xl border shadow-xl overflow-hidden ${isDark ? 'bg-[#1a1c1e] border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'}`;
  const muted = isDark ? 'text-gray-400' : 'text-gray-600';

  if (loading) {
    return (
      <div className={`${box} p-8 flex flex-col items-center`}>
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-emerald-500 font-bold text-sm">جاري جلب الترتيب...</p>
      </div>
    );
  }

  if (error || rows.length === 0) {
    return (
      <div className={`${box} p-6 text-center`}>
        <p className="text-red-500 font-bold text-sm">⚠️ {error || 'لا توجد بيانات ترتيب لهذا الدوري حالياً.'}</p>
      </div>
    );
  }

  return (
    <div dir="rtl" className={box}>
      <div className={`p-5 text-center border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
        <h2 className="text-xl font-bold mb-1">🏆 {LEAGUE_NAMES[leagueCode] || leagueCode}</h2>
        {season && <p className="text-xs text-gray-500">موسم {season}</p>}
      </div>

      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-center text-xs sm:text-sm whitespace-nowrap">
          <thead className={`${isDark ? 'bg-[#15171a] text-gray-400' : 'bg-gray-100 text-gray-600'} border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
            <tr>
              <th className="py-3 px-2">#</th>
              <th className="py-3 px-4 text-right">الفريق</th>
              <th className="py-3 px-2">لعب</th>
              <th className="py-3 px-2 text-emerald-500">فاز</th>
              <th className="py-3 px-2 text-yellow-500">تعادل</th>
              <th className="py-3 px-2 text-red-500">خسر</th>
              <th className="py-3 px-2">له</th>
              <th className="py-3 px-2">عليه</th>
              <th className="py-3 px-2">+/-</th>
              <th className="py-3 px-2">نقاط</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDark ? 'divide-gray-800/50' : 'divide-gray-200'}`}>
            {rows.map((t) => (
              <tr key={`${t.pos}-${t.name}`} className={isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'}>
                <td className={`py-3 px-2 font-bold ${muted}`}>{t.pos}</td>
                <td className="py-3 px-4 text-right font-bold">
                  <div className="flex items-center gap-2">
                    {t.logo ? (
                      <img src={t.logo} alt={t.name} className="w-6 h-6 object-contain flex-shrink-0" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-gray-600 flex-shrink-0"></div>
                    )}
                    <span>{t.name}</span>
                  </div>
                </td>
                <td className={`py-3 px-2 ${muted}`}>{t.played}</td>
                <td className="py-3 px-2 font-bold text-emerald-500">{t.won}</td>
                <td className="py-3 px-2 font-bold text-yellow-500">{t.draw}</td>
                <td className="py-3 px-2 font-bold text-red-500">{t.lost}</td>
                <td className={`py-3 px-2 ${muted}`}>{t.gf}</td>
                <td className={`py-3 px-2 ${muted}`}>{t.ga}</td>
                <td className="py-3 px-2 font-bold" dir="ltr">{t.gd > 0 ? `+${t.gd}` : t.gd}</td>
                <td className="py-3 px-2">
                  <span className={`inline-block min-w-[2rem] py-1 rounded-md font-bold ${isDark ? 'bg-emerald-900/50 text-emerald-400' : 'bg-emerald-100 text-emerald-700'}`}>
                    {t.pts}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
