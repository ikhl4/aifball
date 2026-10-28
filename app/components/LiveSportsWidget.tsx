'use client';
import React, { useEffect, useState } from 'react';

interface LiveSportsWidgetProps {
  type: 'standings' | 'livescore';
  league?: string;
  season?: string;
}

export default function LiveSportsWidget({ type, league, season }: LiveSportsWidgetProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      // نستخدم action بدلاً من type ليتطابق مع كود الـ API Routes الخاص بك
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
      <div className="w-full p-6 flex flex-col items-center justify-center bg-[#131a2a] rounded-2xl border border-gray-800/80 shadow-lg my-4">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-emerald-400 font-bold text-sm">جاري تحميل البيانات الحية...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full p-4 bg-red-950/40 border border-red-900/50 rounded-2xl text-center my-4">
        <p className="text-red-400 font-bold text-sm">⚠️ {error}</p>
      </div>
    );
  }

  // 🏆 عرض جدول الترتيب
  if (type === 'standings') {
    return (
      <div className="w-full overflow-hidden rounded-2xl border border-gray-800/80 shadow-xl bg-[#131a2a] my-4">
        <div className="bg-emerald-950/60 px-4 py-3 border-b border-gray-800/80 flex items-center justify-between">
          <span className="text-emerald-400 font-bold text-sm flex items-center gap-2">
            <span>📊</span> جدول الترتيب
          </span>
          <span className="text-xs text-gray-400">موسم {season}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-[#0f1420] text-gray-400">
              <tr>
                <th className="py-3 px-3 font-medium">#</th>
                <th className="py-3 px-3 font-medium">الفريق</th>
                <th className="py-3 px-3 font-medium text-center">لعب</th>
                <th className="py-3 px-3 font-medium text-center">فاز</th>
                <th className="py-3 px-3 font-medium text-center">تعادل</th>
                <th className="py-3 px-3 font-medium text-center">خسر</th>
                <th className="py-3 px-3 font-medium text-center">له</th>
                <th className="py-3 px-3 font-medium text-center">عليه</th>
                <th className="py-3 px-3 font-bold text-emerald-400 text-center">نقاط</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {data.map((team: any, idx: number) => (
                <tr key={team.team.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-3 px-3 text-gray-300 font-bold">{team.rank}</td>
                  <td className="py-3 px-3 flex items-center gap-2">
                    <img src={team.team.logo} alt={team.team.name} className="w-6 h-6 object-contain" />
                    <span className="text-gray-100 font-bold whitespace-nowrap">{team.team.name}</span>
                  </td>
                  <td className="py-3 px-3 text-center text-gray-400">{team.all.played}</td>
                  <td className="py-3 px-3 text-center text-emerald-400">{team.all.win}</td>
                  <td className="py-3 px-3 text-center text-gray-300">{team.all.draw}</td>
                  <td className="py-3 px-3 text-center text-red-400">{team.all.lose}</td>
                  <td className="py-3 px-3 text-center text-gray-400">{team.all.goals.for}</td>
                  <td className="py-3 px-3 text-center text-gray-400">{team.all.goals.against}</td>
                  <td className="py-3 px-3 text-center text-emerald-400 font-bold bg-emerald-900/10">{team.points}</td>
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
        <div className="w-full p-4 bg-[#131a2a] rounded-2xl border border-gray-800/80 text-center my-4">
          <p className="text-gray-400 text-sm">لا توجد مباريات مباشرة حالياً.</p>
        </div>
      );
    }

    return (
      <div className="w-full rounded-2xl border border-gray-800/80 shadow-xl bg-[#131a2a] my-4 overflow-hidden">
        <div className="bg-emerald-950/60 px-4 py-3 border-b border-gray-800/80 flex items-center justify-between">
          <span className="text-emerald-400 font-bold text-sm flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> نتائج مباشرة
          </span>
        </div>
        <div className="p-4 space-y-3">
          {data.map((match: any) => (
            <div key={match.fixture.id} className="bg-[#0f1420] rounded-xl p-3 border border-gray-800/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400">{match.league.name}</span>
                <span className="text-xs font-bold text-red-400 bg-red-950/40 px-2 py-0.5 rounded-full border border-red-900/30">
                  {match.fixture.status.elapsed}'
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 w-1/3">
                  <img src={match.teams.home.logo} alt={match.teams.home.name} className="w-6 h-6 object-contain" />
                  <span className="text-sm font-bold text-gray-200 truncate">{match.teams.home.name}</span>
                </div>
                <div className="flex items-center justify-center w-1/3">
                  <span className="text-xl font-extrabold text-white bg-emerald-900/50 px-3 py-1 rounded-lg">
                    {match.goals.home ?? 0} - {match.goals.away ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-end gap-2 w-1/3">
                  <span className="text-sm font-bold text-gray-200 truncate text-left">{match.teams.away.name}</span>
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
