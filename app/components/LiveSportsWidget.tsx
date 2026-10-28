'use client';
import React, { useEffect, useState } from 'react';

interface LiveSportsWidgetProps {
  type: 'standings' | 'livescore';
  league?: string;
  season?: string;
  isDark?: boolean; // أضفنا هذا المتغير
}

export default function LiveSportsWidget({ type, league, season, isDark = true }: LiveSportsWidgetProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      const action = type === 'standings' ? 'standings' : 'livescores';
      let url = `/api/football?action=${action}`;
      
      if (type === 'standings') {
        url += `&league=${league || '39'}&season=${season || '2026'}`;
      }

      try {
        const res = await fetch(url);
        const result = await res.json();
        
        if (!res.ok) throw new Error(result.error || 'فشل جلب البيانات');

        if (type === 'standings') {
          setData(result.standings || []);
        } else {
          setData(result.matches || []);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [type, league, season]);

  if (loading) {
    return (
      <div className={`w-full p-6 flex flex-col items-center justify-center rounded-2xl border shadow-lg my-4 ${isDark ? 'bg-[#131a2a] border-gray-800/80' : 'bg-white border-gray-200'}`}>
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className={`font-bold text-sm ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>جاري تحميل البيانات...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`w-full p-4 rounded-2xl text-center my-4 border ${isDark ? 'bg-red-950/40 border-red-900/50' : 'bg-red-50 border-red-200'}`}>
        <p className={`font-bold text-sm ${isDark ? 'text-red-400' : 'text-red-600'}`}>⚠️ {error}</p>
      </div>
    );
  }

  // 🏆 عرض جدول الترتيب
  if (type === 'standings') {
    return (
      <div className={`w-full overflow-hidden rounded-2xl border shadow-xl my-4 ${isDark ? 'border-gray-800/80 bg-[#131a2a]' : 'border-gray-200 bg-white'}`}>
        <div className={`px-4 py-3 border-b flex items-center justify-between ${isDark ? 'bg-emerald-950/60 border-gray-800/80' : 'bg-emerald-50 border-gray-200'}`}>
          <span className={`font-bold text-sm flex items-center gap-2 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
            <span>📊</span> جدول الترتيب
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className={isDark ? 'bg-[#0f1420] text-gray-400' : 'bg-gray-100 text-gray-600'}>
              <tr>
                <th className="py-3 px-3 font-medium">#</th>
                <th className="py-3 px-3 font-medium">الفريق</th>
                <th className={`py-3 px-3 font-bold text-center ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>نقاط</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-gray-800/50' : 'divide-gray-200'}`}>
              {data.map((team: any, idx: number) => (
                <tr key={team.team.id} className={isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'}>
                  <td className={`py-3 px-3 font-bold ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{team.rank}</td>
                  <td className="py-3 px-3 flex items-center gap-2">
                    <img src={team.team.logo} alt={team.team.name} className="w-6 h-6 object-contain" />
                    <span className={`font-bold whitespace-nowrap ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>{team.team.name}</span>
                  </td>
                  <td className={`py-3 px-3 text-center font-bold ${isDark ? 'text-emerald-400 bg-emerald-900/10' : 'text-emerald-600 bg-emerald-50'}`}>{team.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ⚽ عرض المباريات المباشرة
  if (type === 'livescore') {
    if (data.length === 0) {
      return (
        <div className={`w-full p-4 rounded-2xl border text-center my-4 ${isDark ? 'bg-[#131a2a] border-gray-800/80' : 'bg-white border-gray-200'}`}>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>لا توجد مباريات مباشرة حالياً.</p>
        </div>
      );
    }

    return (
      <div className={`w-full rounded-2xl border shadow-xl my-4 overflow-hidden ${isDark ? 'border-gray-800/80 bg-[#131a2a]' : 'border-gray-200 bg-white'}`}>
        <div className={`px-4 py-3 border-b flex items-center justify-between ${isDark ? 'bg-emerald-950/60 border-gray-800/80' : 'bg-emerald-50 border-gray-200'}`}>
          <span className={`font-bold text-sm flex items-center gap-2 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> نتائج مباشرة
          </span>
        </div>
        <div className="p-4 space-y-3">
          {data.map((match: any) => (
            <div key={match.fixture.id} className={`rounded-xl p-3 border ${isDark ? 'bg-[#0f1420] border-gray-800/50' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{match.league.name}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${isDark ? 'text-red-400 bg-red-950/40 border-red-900/30' : 'text-red-600 bg-red-100 border-red-200'}`}>
                  {match.fixture.status.elapsed}'
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 w-1/3">
                  <img src={match.teams.home.logo} alt={match.teams.home.name} className="w-6 h-6 object-contain" />
                  <span className={`text-sm font-bold truncate ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{match.teams.home.name}</span>
                </div>
                <div className="flex items-center justify-center w-1/3">
                  <span className={`text-xl font-extrabold px-3 py-1 rounded-lg ${isDark ? 'text-white bg-emerald-900/50' : 'text-gray-800 bg-gray-200'}`}>
                    {match.goals.home ?? 0} - {match.goals.away ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-end gap-2 w-1/3">
                  <span className={`text-sm font-bold truncate text-left ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{match.teams.away.name}</span>
                  <img src={match.teams.away.logo} alt={match.teams.away.name} className="w-6 h-6 object-contain" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}
