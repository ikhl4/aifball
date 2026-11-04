'use client';
import React, { useEffect, useState } from 'react';

interface LiveSportsWidgetProps {
  league?: string;
  isDark?: boolean;
  date?: string; // أضفنا هذا المتغير
}

export default function LiveSportsWidget({ league = 'ksa.1', isDark = true, date = 'today' }: LiveSportsWidgetProps) {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let pending = false;
    const controller = new AbortController();
    setLoading(true);
    setMatches([]);
    setError(null);
    const fetchData = async () => {
      if (pending) return;
      pending = true;
      try {
        const res = await fetch(`/api/espn?league=${encodeURIComponent(league)}&date=${encodeURIComponent(date)}`, {
          signal: controller.signal, cache: 'no-store',
        });
        const result = await res.json();
        if (!res.ok || !Array.isArray(result?.events)) throw new Error('فشل جلب البيانات من ESPN');
        if (active) { setMatches(result.events); setError(null); }
      } catch (err: unknown) {
        if (active) setError(err instanceof Error ? err.message : 'فشل جلب البيانات');
      } finally {
        if (active) setLoading(false);
        pending = false;
      }
    };
    void fetchData();
    const interval = setInterval(() => { void fetchData(); }, 60000);
    return () => { active = false; controller.abort(); clearInterval(interval); };
  }, [league, date]);

  const dateLabel = date === 'yesterday' ? 'الأمس' : date === 'tomorrow' ? 'غداً' : 'اليوم';

  if (loading) {
    return (
      <div className={`w-full p-6 flex flex-col items-center justify-center rounded-2xl border shadow-lg my-4 ${isDark ? 'bg-[#131a2a] border-gray-800/80' : 'bg-white border-gray-200'}`}>
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className={`font-bold text-sm ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>جاري جلب مباريات {dateLabel}...</p>
      </div>
    );
  }

  if (error && matches.length === 0) {
    return (
      <div className={`w-full p-4 rounded-2xl text-center my-4 border ${isDark ? 'bg-red-950/40 border-red-900/50' : 'bg-red-50 border-red-200'}`}>
        <p className={`font-bold text-sm ${isDark ? 'text-red-400' : 'text-red-600'}`}>⚠️ {error}</p>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className={`w-full p-4 rounded-2xl border text-center my-4 ${isDark ? 'bg-[#131a2a] border-gray-800/80' : 'bg-white border-gray-200'}`}>
        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>لا توجد مباريات في هذا الدوري {dateLabel}.</p>
      </div>
    );
  }

  return (
    <div dir="rtl" className={`w-full font-cairo rounded-2xl border shadow-xl my-4 overflow-hidden ${isDark ? 'border-gray-800/80 bg-[#131a2a]' : 'border-gray-200 bg-white'}`}>
      <div className={`px-4 py-3 border-b flex items-center justify-between ${isDark ? 'bg-emerald-950/60 border-gray-800/80' : 'bg-emerald-50 border-gray-200'}`}>
        <span className={`font-bold text-sm flex items-center gap-2 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span> مباريات {dateLabel}
        </span>
      </div>

      {error && <p role="alert" className="px-4 pt-3 text-xs text-amber-600">تعذّر التحديث؛ النتائج المعروضة من آخر جلب ناجح. ستتم إعادة المحاولة تلقائياً.</p>}
      <p className="px-4 pt-3 text-xs text-gray-500">المواعيد بتوقيت الرياض · تحديث تلقائي كل دقيقة</p>
      <div className="p-4 space-y-3">
        {matches.map((event: any) => {
          const competition = event.competitions?.[0];
          if (!competition || !Array.isArray(competition.competitors)) return null;
          const homeTeam = competition.competitors.find((c: any) => c.homeAway === 'home');
          const awayTeam = competition.competitors.find((c: any) => c.homeAway === 'away');
          if (!homeTeam?.team || !awayTeam?.team) return null;
          const status = event.status?.type;
          const isLive = status?.state === 'in';
          const isFinished = status?.state === 'post';

          return (
            <div key={event.id} className={`rounded-2xl p-3 sm:p-4 border transition-colors ${isDark ? 'bg-[#0f1420] border-white/10 hover:border-emerald-500/30' : 'bg-gray-50 border-gray-200 hover:border-emerald-200'}`}>
              {!isLive && !isFinished && event.date && (
                <p className="text-xs text-emerald-600 mb-2">{Number.isNaN(new Date(event.date).getTime()) ? 'الموعد غير متاح' : new Intl.DateTimeFormat('ar-SA', {
                  hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Riyadh',
                }).format(new Date(event.date))}</p>
              )}
              <div className="flex items-center justify-between gap-3 mb-3">
                <span className={`text-[11px] truncate ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{event.name}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                  isLive
                    ? (isDark ? 'text-red-400 bg-red-950/40 border-red-900/30' : 'text-red-600 bg-red-100 border-red-200')
                    : (isDark ? 'text-gray-400 bg-gray-800 border-gray-700' : 'text-gray-600 bg-gray-200 border-gray-300')
                }`}>
                  {isLive ? status?.name === 'STATUS_HALFTIME' ? 'استراحة' : event.status?.displayClock ? `${event.status.displayClock.replace(/['′]+$/, '')}′` : status?.detail || 'مباشر' : isFinished ? status?.detail || 'انتهت' : status?.detail || 'لم تبدأ'}
                </span>
              </div>

              <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:gap-4">
                <div className="min-w-0 flex flex-col items-center justify-center gap-2 text-center">
                  <img src={homeTeam.team.logo} alt={homeTeam.team.name} className="w-9 h-9 sm:w-11 sm:h-11 object-contain" />
                  <span className={`text-xs sm:text-sm font-bold truncate max-w-full ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{homeTeam.team.shortDisplayName}</span>
                </div>

                <div className="flex flex-col items-center justify-center min-w-[68px]">
                  <span className={`text-xl sm:text-2xl tabular-nums font-extrabold px-3 py-2 rounded-xl ${isDark ? 'text-white bg-emerald-900/30' : 'text-gray-800 bg-gray-200'}`}>
                    {!isLive && !isFinished ? '—' : `${homeTeam.score ?? '—'} - ${awayTeam.score ?? '—'}`}
                  </span>
                </div>

                <div className="min-w-0 flex flex-col items-center justify-center gap-2 text-center">
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
