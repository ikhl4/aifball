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
  const [dateMode, setDateMode] = useState<'yesterday' | 'today' | 'tomorrow'>('today');
  const [matchesByLeague, setMatchesByLeague] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);

  // 🌟 دالة لتنسيق التوقيت المحلي للمستخدم
  const formatMatchTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat('ar-SA', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }).format(date);
    } catch (e) {
      return 'غير محدد';
    }
  };

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
    const interval = setInterval(fetchAllLeagues, 60000); // تحديث تلقائي كل دقيقة
    return () => clearInterval(interval);
  }, [dateMode]);

  return (
    <div className={`w-full max-w-4xl mx-auto p-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
      
      {/* 🌟 أزرار التحكم (الأمس، اليوم، غداً) 🌟 */}
      <div className={`flex justify-center gap-2 mb-6 p-1 rounded-xl ${isDark ? 'bg-[#1A1C1E]' : 'bg-gray-100'}`}>
        <button 
          onClick={() => setDateMode('yesterday')}
          className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${dateMode === 'yesterday' ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-200'}`}
        >
          نتائج الأمس
        </button>
        <button 
          onClick={() => setDateMode('today')}
          className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${dateMode === 'today' ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-200'}`}
        >
          مباريات اليوم
        </button>
        <button 
          onClick={() => setDateMode('tomorrow')}
          className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${dateMode === 'tomorrow' ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-200'}`}
        >
          مباريات غداً
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-10">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-emerald-500 font-bold text-sm">جاري جلب المباريات...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {LEAGUES.map((league) => {
            const leagueMatches = matchesByLeague[league.id] || [];
            
            // إذا لم توجد مباريات في هذا الدوري في هذا اليوم، لا نعرضه
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
                    const isFinished = event.status.type.state === 'post';
                    const isScheduled = !isLive && !isFinished;

                    return (
                      <div key={event.id} className={`p-3 flex items-center justify-between ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}>
                        
                        {/* الوقت / الحالة */}
                        <div className="w-16 sm:w-20 text-center flex-shrink-0">
                          {isLive ? (
                            <span className="text-red-500 font-bold text-xs animate-pulse bg-red-900/20 px-2 py-1 rounded">{event.status.displayClock}'</span>
                          ) : isFinished ? (
                            <span className="text-gray-500 text-xs font-bold">انتهت</span>
                          ) : (
                            <span className="text-emerald-500 text-[10px] sm:text-xs font-bold" dir="ltr">
                              {formatMatchTime(event.date)}
                            </span>
                          )}
                        </div>

                        {/* الفريق الأول */}
                        <div className="flex-1 flex items-center justify-end gap-2 min-w-0">
                          <span className={`font-bold text-sm truncate ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{home.team.shortDisplayName}</span>
                          <img src={home.team.logo} alt={home.team.name} className="w-6 h-6 object-contain flex-shrink-0" />
                        </div>

                        {/* النتيجة (VS للمباريات التي لم تبدأ) */}
                        <div className={`mx-2 sm:mx-3 w-12 sm:w-16 text-center font-black px-1 py-0.5 rounded flex-shrink-0 flex items-center justify-center ${isDark ? 'bg-gray-800' : 'bg-gray-200'} ${isScheduled ? 'text-gray-400 text-[10px] sm:text-xs font-bold' : 'text-lg text-white'}`}>
                          {isScheduled 
                            ? 'VS' 
                            : `${home.score || 0} - ${away.score || 0}`}
                        </div>

                        {/* الفريق الثاني */}
                        <div className="flex-1 flex items-center justify-start gap-2 min-w-0">
                          <img src={away.team.logo} alt={away.team.name} className="w-6 h-6 object-contain flex-shrink-0" />
                          <span className={`font-bold text-sm truncate ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{away.team.shortDisplayName}</span>
                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          
          {/* رسالة في حال عدم وجود مباريات في اليوم المحدد */}
          {Object.values(matchesByLeague).every(arr => arr.length === 0) && (
            <div className={`text-center py-20 rounded-2xl border ${isDark ? 'bg-[#131a2a] border-gray-800' : 'bg-white border-gray-200'}`}>
              <p className="text-gray-500 font-bold">لا توجد مباريات في هذه الدوريات {dateMode === 'today' ? 'اليوم' : dateMode === 'yesterday' ? 'بالأمس' : 'غداً'}.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
