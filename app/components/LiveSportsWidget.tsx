'use client';
import React, { useEffect, useState } from 'react';

interface LiveSportsWidgetProps {
  league?: string;
  isDark?: boolean;
}

export default function LiveSportsWidget({ league = 'sau.1', isDark = true }: LiveSportsWidgetProps) {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/espn?league=${league}`);
        const result = await res.json();
        
        if (!res.ok) throw new Error(result.error || 'فشل جلب البيانات');
        
        setMatches(result.events || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [league]);

  if (loading) {
    return (
      <div className={`w-full p-6 flex flex-col items-center justify-center rounded-2xl border shadow-lg my-4 ${isDark ? 'bg-[#131a2a] border-gray-800/80' : 'bg-white border-gray-200'}`}>
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className={`font-bold text-sm ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>جاري جلب مباريات اليوم...</p>
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

  if (matches.length === 0) {
    return (
      <div className={`w-full p-4 rounded-2xl border text-center my-4 ${isDark ? 'bg-[#131a2a] border-gray-800/80' : 'bg-white border-gray-200'}`}>
        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>لا توجد مباريات مجدولة أو مباشرة حالياً في هذا الدوري.</p>
      </div>
    );
  }

  return (
    <div className={`w-full rounded-2xl border shadow-xl my-4 overflow-hidden ${isDark ? 'border-gray-800/80 bg-[#131a2a]' : 'border-gray-200 bg-white'}`}>
      <div className={`px-4 py-3 border-b flex items-center justify-between ${isDark ? 'bg-emerald-950/60 border-gray-800/80' : 'bg-emerald-50 border-gray-200'}`}>
        <span className={`font-bold text-sm flex items-center gap-2 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> نتائج مباشرة (ESPN)
        </span>
      </div>
      
      <div className="p-4 space-y-3">
        {matches.map((event: any) => {
          const competition = event.competitions[0];
          const homeTeam = competition.competitors.find((c: any) => c.homeAway === 'home');
          const awayTeam = competition.competitors.find((c: any) => c.homeAway === 'away');
          const isLive = event.status.type.state === 'in'; 
          const isFinished = event.status.type.state === 'post';

          return (
            <div key={event.id} className={`rounded-xl p-3 border ${isDark ? 'bg-[#0f1420] border-gray-800/50' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{event.name}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                  isLive 
                    ? (isDark ? 'text-red-400 bg-red-950/40 border-red-900/30' : 'text-red-600 bg-red-100 border-red-200') 
                    : (isDark ? 'text-gray-400 bg-gray-800 border-gray-700' : 'text-gray-600 bg-gray-200 border-gray-300')
                }`}>
                  {isLive ? `${event.status.displayClock}'` : isFinished ? 'انتهت' : event.status.type.detail}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 w-1/3">
                  <img src={homeTeam.team.logo} alt={homeTeam.team.name} className="w-6 h-6 object-contain" />
                  <span className={`text-sm font-bold truncate ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{homeTeam.team.shortDisplayName}</span>
                </div>
                
                <div className="flex items-center justify-center w-1/3">
                  <span className={`text-xl font-extrabold px-3 py-1 rounded-lg ${isDark ? 'text-white bg-emerald-900/50' : 'text-gray-800 bg-gray-200'}`}>
                    {homeTeam.score || '0'} - {awayTeam.score || '0'}
                  </span>
                </div>
                
                <div className="flex items-center justify-end gap-2 w-1/3">
                  <span className={`text-sm font-bold truncate text-left ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{awayTeam.team.shortDisplayName}</span>
                  <img src={awayTeam.team.logo} alt={awayTeam.team.shortDisplayName} className="w-6 h-6 object-contain" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
