'use client';
import React, { useEffect, useState } from 'react';

interface LiveSportsWidgetProps {
  type: 'livescore' | 'standings';
  league?: string;
  season?: string;
}

export default function LiveSportsWidget({ type, league = '39', season = '2026' }: LiveSportsWidgetProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchSportsData = async () => {
      setLoading(true);
      setError(false);
      try {
        // الاتصال المباشر بالسيرفر الخلفي المطور الخاص بك على المنفذ 5000
        const endpoint = type === 'standings' 
          ? `http://localhost:5000/api/standings?league=${league}&season=${season}`
          : `http://localhost:5000/api/livescores`;
          
        const res = await fetch(endpoint);
        const result = await res.json();
        
        if (type === 'standings') {
          setData(result.standings[0] || []); // استقبال الترتيب الحقيقي
        } else {
          setData(result.matches || []); // استقبال المباريات الحية الحقيقية
        }
      } catch (err) {
        console.error('فشل الاتصال بسيرفر البيانات:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchSportsData();
  }, [type, league, season]);

  if (loading) {
    return (
      <div className="w-full my-4 p-4 bg-[#131a2a] border border-gray-800 rounded-2xl flex items-center justify-center gap-3 animate-pulse text-sm text-gray-400">
        <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <span>جاري جلب أحدث البيانات الحية من الملاعب...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full my-4 p-4 bg-red-950/25 border border-red-900/40 rounded-2xl text-center text-xs text-red-400">
        عذراً، فشل تحديث البيانات الحية. تأكد من تشغيل خادمك الخلفي.
      </div>
    );
  }

  if (type === 'standings') {
    return (
      <div className="w-full my-4 rounded-2xl border border-gray-800 bg-black/30 overflow-hidden shadow-2xl">
        <div className="bg-[#0d1321] px-4 py-3 border-b border-gray-800 flex justify-between items-center">
          <span className="text-xs font-black text-emerald-400 flex items-center gap-1.5">📊 جدول الترتيب المباشر (الدوري {league})</span>
          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-md font-mono">2026-2027</span>
        </div>
        <table className="w-full text-right border-collapse text-xs md:text-sm">
          <thead>
            <tr className="bg-[#131a2a] text-gray-400 font-bold border-b border-gray-800">
              <th className="p-2.5 text-center w-10">المركز</th>
              <th className="p-2.5 text-right">الفريق</th>
              <th className="p-2.5 text-center">لعب</th>
              <th className="p-2.5 text-center hidden sm:table-cell">الفارق</th>
              <th className="p-2.5 text-center font-black text-white">النقاط</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-850 text-gray-200">
            {data?.map((item: any, idx: number) => (
              <tr key={idx} className="hover:bg-white/5 transition-colors">
                <td className="p-2.5 text-center font-mono font-bold text-gray-400">{item.rank}</td>
                <td className="p-2.5 text-right font-bold text-emerald-400 flex items-center gap-2">
                  {item.team?.logo && <img src={item.team.logo} className="w-4 h-4 object-contain" alt="" />}
                  <span>{item.team?.name}</span>
                </td>
                <td className="p-2.5 text-center font-mono">{item.all?.played}</td>
                <td className="p-2.5 text-center font-mono text-gray-400 hidden sm:table-cell">{item.goalsDiff}</td>
                <td className="p-2.5 text-center font-mono font-black text-white bg-emerald-500/5">{item.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="w-full my-4 space-y-2">
      {data?.length === 0 ? (
        <div className="p-4 text-center text-xs text-gray-500 bg-[#131a2a] rounded-2xl border border-gray-800">
          لا توجد مباريات مباشرة جارية حالياً في هذه اللحظة.
        </div>
      ) : (
        data?.map((match: any, idx: number) => (
          <div key={idx} className="p-4 rounded-2xl border border-gray-800 bg-[#131a2a] flex items-center justify-between shadow-lg hover:border-emerald-500/40 transition">
            <div className="flex flex-col text-right">
              <span className="text-[10px] text-gray-400 font-medium">{match.league?.name}</span>
              <span className="text-xs text-emerald-400 mt-1 font-mono animate-pulse">{match.fixture?.status?.short} '{match.fixture?.status?.elapsed}</span>
            </div>
            <div className="flex items-center gap-4 flex-1 justify-center px-4">
              <span className="text-sm font-bold text-white text-left flex-1 truncate">{match.teams?.home?.name}</span>
              <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-xl font-mono text-sm font-black border border-gray-800">
                <span className="text-emerald-400">{match.goals?.home}</span>
                <span className="text-gray-600">:</span>
                <span className="text-emerald-400">{match.goals?.away}</span>
              </div>
              <span className="text-sm font-bold text-white text-right flex-1 truncate">{match.teams?.away?.name}</span>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
