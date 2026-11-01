'use client';
import React, { useState, useEffect } from 'react';

interface LeagueDashboardProps {
  leagueName?: string;
  leagueCode?: string; // مثل ksa.1 أو eng.1
  season?: string;
  isDark?: boolean;
}

export default function LeagueDashboard({ 
  leagueName = 'دوري روشن السعودي', 
  leagueCode = 'ksa.1',
  season = '2026',
  isDark = true 
}: LeagueDashboardProps) {
  
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStandings = async () => {
      setLoading(true);
      setError(null);
      try {
        // الاتصال بمسار الـ API المتقدم المرتبط بسيرفر Render
        const res = await fetch(`/api/advanced?source=fotmob&action=table&league=${leagueCode}&season=${season}`);
        const json = await res.json();
        
        if (!res.ok) throw new Error(json.error || 'فشل جلب جدول الترتيب');
        
        // استخراج البيانات وتصحيح هيكلتها بحسب راجع سيرفر بايثون
        const tableData = json.table || json.data || json || [];
        setTeams(Array.isArray(tableData) ? tableData : []);
      } catch (err: any) {
        console.error("Error fetching standings:", err);
        setError(err.message || 'تعذر تحميل جدول الترتيب');
      } finally {
        setLoading(false);
      }
    };

    fetchStandings();
  }, [leagueCode, season]);

  return (
    <div dir="rtl" className={`w-full rounded-3xl border shadow-xl overflow-hidden font-saudi ${isDark ? 'bg-[#1a1c1e] border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'}`}>
      
      {/* الترويسة العلوية */}
      <div className={`p-6 text-center border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
        <h2 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2">
          <span>🏆</span> {leagueName}
        </h2>
        <p className="text-xs text-gray-500">موسم {season} - الترتيب المباشر من السيرفر</p>
      </div>

      {/* محتوى الجدول أو التحميل */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-emerald-500 font-bold text-xs">جاري جلب جدول الترتيب المباشر...</p>
        </div>
      ) : error ? (
        <div className="p-8 text-center text-red-500 font-bold text-sm">
          ⚠️ {error}
        </div>
      ) : teams.length === 0 ? (
        <div className="p-8 text-center text-gray-500 font-bold text-sm">
          لا توجد بيانات متاحة لهذا الدوري حالياً.
        </div>
      ) : (
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
              {teams.map((team, index) => {
                const pos = team.pos || team.position || index + 1;
                const name = team.name || team.teamName || 'فريق';
                const played = team.played || team.matchesPlayed || 0;
                const won = team.won || 0;
                const draw = team.draw || 0;
                const lost = team.lost || 0;
                const gf = team.gf || team.goalsFor || 0;
                const ga = team.ga || team.goalsAgainst || 0;
                const gd = team.gd || team.goalDifference || '0';
                const pts = team.pts || team.points || 0;

                return (
                  <tr key={index} className={`transition-colors ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}>
                    <td className={`py-3 px-2 font-bold ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{pos}</td>
                    <td className="py-3 px-4 text-right font-bold flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-emerald-600/20 border border-white/20 shadow-sm flex items-center justify-center text-[10px] text-emerald-400">
                        {name.charAt(0)}
                      </div>
                      {name}
                    </td>
                    <td className={`py-3 px-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{played}</td>
                    <td className="py-3 px-2 font-bold text-emerald-500">{won}</td>
                    <td className={`py-3 px-2 font-bold ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>{draw}</td>
                    <td className="py-3 px-2 font-bold text-red-500">{lost}</td>
                    <td className={`py-3 px-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{gf}</td>
                    <td className={`py-3 px-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{ga}</td>
                    <td className={`py-3 px-2 font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`} dir="ltr">{gd}</td>
                    <td className="py-3 px-2">
                      <span className={`inline-block w-8 py-1 rounded-md font-bold ${isDark ? 'bg-emerald-900/50 text-emerald-400' : 'bg-emerald-100 text-emerald-700'}`}>
                        {pts}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
