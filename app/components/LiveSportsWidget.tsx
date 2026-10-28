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

  useEffect(() => {
    // محاكاة جلب البيانات الحية من الـ API الرياضي الخاص بك لضمان استقرار العرض
    const fetchSportsData = async () => {
      setLoading(true);
      try {
        // هنا يمكنك لاحقاً تبديل الرابط بالـ API الفعلي الخاص بك
        // const res = await fetch(`/api/football?type=${type}&league=${league}`);
        // const result = await res.json();
        
        // بيانات تجريبية هيكلية مطابقة لموسم 2026-2027 الحركي لضمان جودة التصميم
        if (type === 'standings') {
          setData([
            { rank: 1, team: 'الهلال', played: 10, win: 9, draw: 0, lose: 1, points: 27, goals: '+21' },
            { rank: 2, team: 'النصر', played: 10, win: 8, draw: 1, lose: 1, points: 25, goals: '+15' },
            { rank: 3, team: 'القادسية', played: 11, win: 8, draw: 1, lose: 2, points: 25, goals: '+14' },
            { rank: 4, team: 'الاتحاد', played: 10, win: 7, draw: 2, lose: 1, points: 23, goals: '+10' },
          ]);
        } else {
          setData([
            { home: 'الهلال', away: 'النصر', homeScore: 2, awayScore: 1, status: '90\' Live', league: 'دوري روشن' },
            { home: 'الأهلي', away: 'الاتحاد', homeScore: 0, awayScore: 0, status: '45\' HT', league: 'دوري روشن' },
          ]);
        }
      } catch (err) {
        console.error(err);
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
        <span>جاري تحديث البيانات الرياضية الحية...</span>
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
                <td className="p-2.5 text-right font-bold text-emerald-400">{item.team}</td>
                <td className="p-2.5 text-center font-mono">{item.played}</td>
                <td className="p-2.5 text-center font-mono text-gray-400 hidden sm:table-cell">{item.goals}</td>
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
      {data?.map((match: any, idx: number) => (
        <div key={idx} className="p-4 rounded-2xl border border-gray-800 bg-[#131a2a] flex items-center justify-between shadow-lg hover:border-emerald-500/40 transition">
          <div className="flex flex-col text-right">
            <span className="text-[10px] text-gray-400 font-medium">{match.league}</span>
            <span className="text-xs text-gray-500 mt-1 font-mono">{match.status}</span>
          </div>
          <div className="flex items-center gap-4 flex-1 justify-center px-4">
            <span className="text-sm font-bold text-white text-left flex-1 truncate">{match.home}</span>
            <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-xl font-mono text-sm font-black border border-gray-800">
              <span className="text-emerald-400">{match.homeScore}</span>
              <span className="text-gray-600">:</span>
              <span className="text-emerald-400">{match.awayScore}</span>
            </div>
            <span className="text-sm font-bold text-white text-right flex-1 truncate">{match.away}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
