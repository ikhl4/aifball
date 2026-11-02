'use client';
import React, { useState, useEffect } from 'react';

const LEAGUES = [
  { id: 'ksa.1', name: 'دوري روشن السعودي', flag: '🇸🇦' },
  { id: 'eng.1', name: 'الدوري الإنجليزي', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { id: 'esp.1', name: 'الدوري الإسباني', flag: '🇪🇸' },
  { id: 'ita.1', name: 'الدوري الإيطالي', flag: '🇮🇹' },
  { id: 'ger.1', name: 'الدوري الألماني', flag: '🇩🇪' },
  { id: 'fra.1', name: 'الدوري الفرنسي', flag: '🇫🇷' },
  { id: 'uefa.champions', name: 'دوري أبطال أوروبا', flag: '🏆' },
  { id: 'afc.champions', name: 'دوري أبطال آسيا للنخبة', flag: '🏆' },
  { id: 'fifa.world', name: 'كأس العالم', flag: '🌍' },
  { id: 'fifa.worldq.afc', name: 'تصفيات كأس العالم — آسيا', flag: '🌏' },
  { id: 'fifa.worldq.uefa', name: 'تصفيات كأس العالم — أوروبا', flag: '🌍' },
  { id: 'fifa.worldq.caf', name: 'تصفيات كأس العالم — أفريقيا', flag: '🌍' },
  { id: 'fifa.worldq.conmebol', name: 'تصفيات كأس العالم — أمريكا الجنوبية', flag: '🌎' },
  { id: 'fifa.worldq.concacaf', name: 'تصفيات كأس العالم — كونكاكاف', flag: '🌎' },
  { id: 'fifa.worldq.ofc', name: 'تصفيات كأس العالم — أوقيانوسيا', flag: '🌏' },
  { id: 'afc.asian.cup', name: 'كأس آسيا للمنتخبات', flag: '🌏' },
  { id: 'uefa.euro', name: 'كأس أمم أوروبا', flag: '🌍' },
  { id: 'uefa.euroq', name: 'تصفيات كأس أمم أوروبا', flag: '🌍' },
  { id: 'uefa.nations', name: 'دوري الأمم الأوروبية', flag: '🌍' },
  { id: 'caf.nations', name: 'كأس أمم أفريقيا', flag: '🌍' },
  { id: 'conmebol.america', name: 'كوبا أمريكا', flag: '🌎' },
  { id: 'concacaf.gold', name: 'الكأس الذهبية', flag: '🌎' },
  { id: 'fifa.friendly', name: 'مباريات المنتخبات الودية', flag: '🌐' },
];

export default function LiveMatchCenter({ isDark = true }: { isDark?: boolean }) {
  const [dateMode, setDateMode] = useState<'yesterday' | 'today' | 'tomorrow'>('today');
  const [matchesByLeague, setMatchesByLeague] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [failedLeagues, setFailedLeagues] = useState<string[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);

  const formatMatchTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat('ar-SA', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Riyadh'
      }).format(date);
    } catch (e) {
      return 'غير محدد';
    }
  };

  useEffect(() => {
    let active = true;
    let pending = false;
    const controller = new AbortController();
    setLoading(true);
    setMatchesByLeague({});
    setFailedLeagues([]);
    setUpdatedAt(null);
    setExpandedMatchId(null);

    const fetchAllLeagues = async () => {
      if (pending) return;
      pending = true;
      const results = await Promise.allSettled(LEAGUES.map(async (league) => {
        const res = await fetch(`/api/espn?league=${league.id}&date=${dateMode}`, {
          signal: controller.signal, cache: 'no-store',
        });
        const json = await res.json();
        if (!res.ok || !Array.isArray(json?.events)) throw new Error('فشل جلب المباريات');
        return json.events;
      }));
      if (!active) return;
      const failed: string[] = [];
      const successful: Record<string, any[]> = {};
      results.forEach((result, index) => {
        const league = LEAGUES[index];
        if (result.status === 'fulfilled') successful[league.id] = result.value;
        else failed.push(league.name);
      });
      setMatchesByLeague(previous => ({ ...previous, ...successful }));
      setFailedLeagues(failed);
      if (failed.length < LEAGUES.length) {
        setUpdatedAt(new Intl.DateTimeFormat('ar-SA', {
          hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Asia/Riyadh',
        }).format(new Date()));
      }
      setLoading(false);
      pending = false;
    };

    void fetchAllLeagues();
    const interval = setInterval(() => { void fetchAllLeagues(); }, 60000);
    return () => {
      active = false;
      controller.abort();
      clearInterval(interval);
    };
  }, [dateMode]);

  return (
    <div className={`w-full max-w-4xl mx-auto p-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>

      {/* أزرار التحكم (الأمس، اليوم، غداً) */}
      <div className={`flex justify-center gap-2 mb-6 p-1 rounded-xl ${isDark ? 'bg-[#1A1C1E]' : 'bg-gray-100'}`}>
        <button onClick={() => setDateMode('yesterday')} className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${dateMode === 'yesterday' ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-200'}`}>نتائج الأمس</button>
        <button onClick={() => setDateMode('today')} className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${dateMode === 'today' ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-200'}`}>مباريات اليوم</button>
        <button onClick={() => setDateMode('tomorrow')} className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${dateMode === 'tomorrow' ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-200'}`}>مباريات غداً</button>
      </div>

      <p className="text-xs text-gray-500 text-center mb-3" aria-live="polite">
        ESPN · المواعيد بتوقيت الرياض · تحديث تلقائي كل دقيقة{updatedAt ? ` · آخر تحديث ناجح: ${updatedAt}` : ''}
      </p>
      {failedLeagues.length > 0 && (
        <p role="alert" className="text-sm text-amber-600 text-center mb-3">
          تعذّر تحديث: {failedLeagues.join('، ')}. أي نتائج ظاهرة لهذه البطولات من آخر جلب ناجح؛ ستتم إعادة المحاولة تلقائياً.
        </p>
      )}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-10">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-emerald-500 font-bold text-sm">جاري جلب المباريات...</p>
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
                    const comp = event.competitions?.[0];
                    if (!comp || !Array.isArray(comp.competitors)) return null;
                    const home = comp.competitors.find((c: any) => c.homeAway === 'home');
                    const away = comp.competitors.find((c: any) => c.homeAway === 'away');

                    if (!home?.team || !away?.team) return null;
                    const status = event.status?.type;
                    const specialStatus = /POSTPONED|CANCELED|CANCELLED|SUSPENDED|DELAYED|ABANDONED/i.test(status?.name || '')
                      ? status?.detail || 'تغيّر موعد المباراة' : null;
                    const isLive = status?.state === 'in';
                    const isFinished = status?.state === 'post';
                    const isScheduled = !isLive && !isFinished;

                    const details = Array.isArray(comp.details) ? comp.details : [];
                    const goals = details.filter((d: any) => d.scoringPlay === true);
                    const matchKey = `${league.id}:${event.id}`;
                    const isExpanded = expandedMatchId === matchKey;

                    return (
                      <div key={event.id} className="flex flex-col">
                        {/* صف المباراة */}
                        <div
                          role="button"
                          tabIndex={0}
                          aria-expanded={isExpanded}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setExpandedMatchId(isExpanded ? null : matchKey);
                            }
                          }}
                          onClick={() => setExpandedMatchId(isExpanded ? null : matchKey)}
                          className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'} ${isExpanded ? (isDark ? 'bg-white/5 border-b border-gray-700' : 'bg-gray-50 border-b border-gray-200') : ''}`}
                        >
                          <div className="w-16 sm:w-20 text-center flex-shrink-0">
                            {specialStatus ? (
                              <span className="text-amber-600 text-xs font-bold">{specialStatus}</span>
                            ) : isLive ? (
                              <span className="text-red-500 font-bold text-xs animate-pulse bg-red-900/20 px-2 py-1 rounded">{status?.name === 'STATUS_HALFTIME' ? 'استراحة' : event.status?.displayClock ? `${event.status.displayClock.replace(/['′]+$/, '')}′` : status?.detail || 'مباشر'}</span>
                            ) : isFinished ? (
                              <span className="text-gray-500 text-xs font-bold">انتهت</span>
                            ) : (
                              <span className="text-emerald-500 text-[10px] sm:text-xs font-bold" dir="ltr">{formatMatchTime(event.date)}</span>
                            )}
                          </div>

                          <div className="flex-1 flex items-center justify-end gap-2 min-w-0">
                            <span className={`font-bold text-sm truncate ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{home.team.shortDisplayName}</span>
                            <img src={home.team.logo} alt={home.team.name} className="w-6 h-6 object-contain flex-shrink-0" />
                          </div>

                          <div className={`mx-2 sm:mx-3 w-12 sm:w-16 text-center font-black px-1 py-0.5 rounded flex-shrink-0 flex items-center justify-center ${isDark ? 'bg-gray-800' : 'bg-gray-200'} ${isScheduled ? 'text-gray-400 text-[10px] sm:text-xs font-bold' : (isDark ? 'text-lg text-white' : 'text-lg text-gray-900')}`}>
                            {isScheduled ? 'VS' : `${home.score ?? '—'} - ${away.score ?? '—'}`}
                          </div>

                          <div className="flex-1 flex items-center justify-start gap-2 min-w-0">
                            <img src={away.team.logo} alt={away.team.name} className="w-6 h-6 object-contain flex-shrink-0" />
                            <span className={`font-bold text-sm truncate ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{away.team.shortDisplayName}</span>
                          </div>
                        </div>

                        {/* 🌟 قائمة الأهداف (محدثة لاستخراج الاسم بدقة) 🌟 */}
                        {isExpanded && (
                          <div className={`p-3 text-sm ${isDark ? 'bg-[#0a0e17] text-gray-300' : 'bg-white text-gray-700'}`}>
                            {goals.length > 0 ? (
                              <div className="space-y-2">
                                <p className={`font-bold text-xs mb-2 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>⚽ سجل الأهداف:</p>
                                {goals.map((goal: any, idx: number) => {
                                  let scorer = 'لاعب غير معروف';

                                  // 1. محاولة استخراج الاسم من المسار القياسي
                                  if (goal.athletesInvolved && goal.athletesInvolved.length > 0) {
                                    scorer = goal.athletesInvolved[0].displayName;
                                  }
                                  // 2. محاولة استخراج الاسم من مسار آخر
                                  else if (goal.participants && goal.participants.length > 0 && goal.participants[0].athlete) {
                                    scorer = goal.participants[0].athlete.displayName;
                                  }
                                  // 3. خوارزمية ذكية: استخراج الاسم من نص الهدف (Text)
                                  else if (goal.text) {
                                    // النص غالباً يكون: "Goal! Al Nassr 1, Al Khaleej 0. Cristiano Ronaldo (Al Nassr) right footed..."
                                    const match = goal.text.match(/\.\s([^(]+)\(/);
                                    if (match && match[1]) {
                                      scorer = match[1].trim();
                                    } else {
                                      // محاولة أخرى إذا كانت الصيغة مختلفة
                                      const match2 = goal.text.match(/Goal!\s(.*?)\s\(/);
                                      if (match2 && match2[1]) scorer = match2[1].trim();
                                    }
                                  }

                                  const minute = goal.clock?.displayValue || '';
                                  const isHomeGoal = String(goal.team?.id) === String(home.team.id);
                                  const isAwayGoal = String(goal.team?.id) === String(away.team.id);

                                  return (
                                    <div key={idx} className="flex items-center justify-between border-b border-gray-700/30 pb-1 last:border-0">
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-500 w-8 text-center">{minute}</span>
                                        <span className={`font-bold ${isDark ? 'text-white' : 'text-black'}`}>{scorer}</span>
                                      </div>
                                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${isHomeGoal ? 'bg-emerald-900/30 text-emerald-400' : 'bg-sky-900/30 text-sky-400'}`}>
                                        {isHomeGoal ? home.team.shortDisplayName : isAwayGoal ? away.team.shortDisplayName : 'الفريق غير متاح'}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <p className="text-center text-xs text-gray-500 py-2">
                                {isScheduled ? 'المباراة لم تبدأ بعد.' : 'تفاصيل الأهداف غير متاحة من المصدر حالياً.'}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {failedLeagues.length === 0 && Object.values(matchesByLeague).every(arr => arr.length === 0) && (
            <div className={`text-center py-20 rounded-2xl border ${isDark ? 'bg-[#131a2a] border-gray-800' : 'bg-white border-gray-200'}`}>
              <p className="text-gray-500 font-bold">لا توجد مباريات في هذه الدوريات {dateMode === 'today' ? 'اليوم' : dateMode === 'yesterday' ? 'بالأمس' : 'غداً'}.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
