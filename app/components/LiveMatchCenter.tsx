'use client';
import React, { useState, useEffect } from 'react';

const LEAGUES = [
  // الدوريات الخمسة الكبرى
  { id: 'eng.1', name: 'الدوري الإنجليزي', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { id: 'esp.1', name: 'الدوري الإسباني', flag: '🇪🇸' },
  { id: 'ita.1', name: 'الدوري الإيطالي', flag: '🇮🇹' },
  { id: 'ger.1', name: 'الدوري الألماني', flag: '🇩🇪' },
  { id: 'fra.1', name: 'الدوري الفرنسي', flag: '🇫🇷' },
  
  // الدوريات العربية والخليجية
  { id: 'ksa.1', name: 'دوري روشن السعودي', flag: '🇸🇦' },
  { id: 'egy.1', name: 'الدوري المصري', flag: '🇪🇬' },
  { id: 'uae.1', name: 'الدوري الإماراتي', flag: '🇦🇪' },
  { id: 'qat.1', name: 'دوري نجوم قطر', flag: '🇶🇦' },
  
  // دوريات أخرى
  { id: 'usa.1', name: 'الدوري الأمريكي (MLS)', flag: '🇺🇸' },
  { id: 'uefa.champions', name: 'دوري أبطال أوروبا', flag: '🏆' },
];

export default function LiveMatchCenter({ isDark = true }: { isDark?: boolean }) {
  const [dateMode, setDateMode] = useState<'today' | 'yesterday'>('today');
  const [matchesByLeague, setMatchesByLeague] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllLeagues = async () => {
      setLoading(true);
      const newData: Record<string, any[]> = {};
      
      try {
        const promises = LEAGUES.map(async (league) => {
          const res = await fetch(`/api/espn?league=${league.id}&date=${dateMode}`);
          const json = await res.json();
          return { id: league.id, events: json.events || [] };
        });

        const results = await Promise.all(promises);
        results.forEach((r) => { newData[r.id] = r.events; });
        setMatchesByLeague(newData);
      } catch (e) {
        console.error("Error fetching matches:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchAllLeagues();
    const interval = setInterval(fetchAllLeagues, 60000);
    return () => clearInterval(interval);
  }, [dateMode]);

  // ... (باقي كود العرض كما هو تماماً، عرض المباريات والنتائج)
  return (
    <div className={`w-full max-w-4xl mx-auto p-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
      
      <div className={`flex justify-center gap-4 mb-6 p-1 rounded-xl ${isDark ? 'bg-[#1A1C1E]' : 'bg-gray-100'}`}>
        <button onClick={() => setDateMode('today')} className={`flex-1 py-2 rounded-lg font-bold transition-all ${dateMode === 'today' ? 'bg-emerald-600 text-white' : 'text-gray-400'}`}>مباريات اليوم</button>
        <button onClick={() => setDateMode('yesterday')} className={`flex-1 py-2 rounded-lg font-bold transition-all ${dateMode === 'yesterday' ? 'bg-emerald-600 text-white' : 'text-gray-400'}`}>نتائج الأمس</button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-10">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-emerald-500 font-bold text-sm">جاري تحديث النتائج...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {LEAGUES.map((league) => {
            const leagueMatches = matchesByLeague[league.id] || [];
            if (leagueMatches.length === 0) return null;

            return (
              <div key={league.id} className={`rounded-2xl border overflow-hidden shadow-lg ${isDark ? 'border-gray-800 bg-[#131a2a]' : 'border-gray-200 bg-white'}`}>
                <div className={`px-4 py-3 border-b flex items-center gap-2 ${isDark ? 'bg-[#0f1420] border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
                  <span className="text-xl">{league.flag}</span>
                  <h2 className="font-bold text-md">{league.name}</h2>
                </div>
                <div className={`divide-y ${isDark ? 'divide-gray-800/50' : 'divide-gray-100'}`}>
                  {leagueMatches.map((event: any) => {
                    const comp = event.competitions[0];
                    const home = comp.competitors.find((c: any) => c.homeAway === 'home');
                    const away = comp.competitors.find((c: any) => c.homeAway === 'away');
                    const isLive = event.status.type.state === 'in'; 
                    
                    return (
                      <div key={event.id} className={`p-3 flex items-center justify-between ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}>
                        <div className="w-16 text-center">
                          {isLive ? (
                            <span className="text-red-500 font-bold text-xs animate-pulse">{event.status.displayClock}'</span>
                          ) : event.status.type.state === 'post' ? (
                            <span className="text-gray-500 text-xs font-bold">انتهت</span>
                          ) : (
                            <span className="text-emerald-500 text-xs font-bold">{event.status.type.shortDetail}</span>
                          )}
                        </div>
                        <div className="flex-1 flex items-center justify-end gap-2">
                          <span className={`font-bold text-sm truncate ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{home.team.shortDisplayName}</span>
                          <img src={home.team.logo} className="w-6 h-6 object-contain" />
                        </div>
                        <div className={`mx-4 w-14 text-center font-black text-lg px-1 py-0.5 rounded ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}>
                          {home.score || '0'} - {away.score || '0'}
                        </div>
                        <div className="flex-1 flex items-center justify-start gap-2">
                          <img src={away.team.logo} className="w-6 h-6 object-contain" />
                          <span className={`font-bold text-sm truncate ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{away.team.shortDisplayName}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
