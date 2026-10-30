'use client';
import React, { useState, useEffect } from 'react';
import ShotMap, { ShotData } from '@/components/ShotMap';

interface MatchReportProps {
  matchName: string;
  matchId?: string;
  isDark?: boolean;
}

const translations = {
  ar: {
    tabs: { 
      overview: '📊 النظرة العامة', 
      attack: '⚔️ الهجوم والانتقالات', 
      defence: '🛡️ الدفاع والصراعات', 
      lineup: '👥 التشكيلة والتحليل',
      liveShotmap: '🎯 خرائط التسديد الحية' 
    },
    xg: 'الأهداف المتوقعة (xG)', stat: 'الإحصائية', possession: 'الاستحواذ', shotsCount: 'التسديدات', shotsOnTarget: 'على المرمى',
    passes: 'التمريرات', passAccuracy: 'دقة التمرير', fouls: 'الأخطاء', corners: 'الركنيات', tackles: 'الالتحامات', interceptions: 'الاعتراضات',
    lineupTitle: 'التشكيلة (اضغط لعرض التحليل الفردي)', backToLineup: '← العودة للتشكيلة', rating: 'تقييم المباراة',
    distance: 'المسافة (تقديري)', topSpeed: 'أعلى سرعة (تقديري)', passesMade: 'تمريرات صحيحة', shotsMade: 'تسديدات',
    progressivePasses: 'تمريرات تقدمية', touchMap: 'الخريطة الحرارية', shotMap: 'أماكن التسديد', passMap: 'شبكة التمرير',
    loading: 'جاري جلب بيانات StatsBomb...', attackData: 'إحصائيات الهجوم', defenceData: 'إحصائيات الدفاع',
  },
  en: {
    tabs: { 
      overview: '📊 Overview', 
      attack: '⚔️ Attack & Transitions', 
      defence: '🛡️ Defence & Duels', 
      lineup: '👥 Lineup & Analysis',
      liveShotmap: '🎯 Live Shot Maps' 
    },
    xg: 'Expected Goals (xG)', stat: 'Statistic', possession: 'Possession', shotsCount: 'Shots', shotsOnTarget: 'Shots on Target',
    passes: 'Passes', passAccuracy: 'Pass Accuracy', fouls: 'Fouls', corners: 'Corners', tackles: 'Tackles', interceptions: 'Interceptions',
    lineupTitle: 'Lineup (Click player for analysis)', backToLineup: '← Back to Lineup', rating: 'Match Rating',
    distance: 'Distance (Est.)', topSpeed: 'Top Speed (Est.)', passesMade: 'Accurate Passes', shotsMade: 'Shots',
    progressivePasses: 'Progressive Passes', touchMap: 'Heatmap', shotMap: 'Shot Map', passMap: 'Pass Network',
    loading: 'Loading StatsBomb data...', attackData: 'Attack Stats', defenceData: 'Defence Stats',
  }
};

export default function MatchReport({ matchName, matchId = '3869685', isDark = true }: MatchReportProps) {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // --- حالات جديدة لخريطة التسديدات الحية ---
  const [liveShots, setLiveShots] = useState<ShotData[]>([]);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveError, setLiveError] = useState<string | null>(null);

  const isArabic = /[\u0600-\u06FF]/.test(matchName);
  const lang = isArabic ? 'ar' : 'en';
  const t = translations[lang];
  const dir = isArabic ? 'rtl' : 'ltr';

  useEffect(() => {
    const fetchMatchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/match-report?matchId=${matchId}`);
        const result = await res.json();
        if (res.ok) setData(result);
      } catch (error) {
        console.error("Error fetching match data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMatchData();
  }, [matchId]);

  // دالة جلب خرائط التسديد من 365Scores
  const fetchLiveShots = async (matchUrl: string) => {
    setLiveLoading(true);
    setLiveError(null);
    try {
      const res = await fetch(`/api/advanced?source=365&action=shotmap&matchUrl=${encodeURIComponent(matchUrl)}`);
      const json = await res.json();
      
      if (json.error) {
        throw new Error(json.details || json.error);
      }

      if (json.data && Array.isArray(json.data)) {
        // تحويل بيانات 365Scores إلى الشكل الذي يتوقعه ShotMap
        const mappedShots: ShotData[] = json.data.map((shot: any, index: number) => {
          // 1. ترجمة النتيجة
          let mappedOutcome: 'Goal' | 'Saved' | 'Off Target' | 'Blocked' = 'Off Target';
          if (shot.shot_outcome === 'Gol') mappedOutcome = 'Goal';
          else if (shot.shot_outcome === 'Atajado') mappedOutcome = 'Saved';
          else if (shot.shot_outcome === 'Bloqueado') mappedOutcome = 'Blocked';
          else if (shot.shot_outcome === 'Fallado' || shot.shot_outcome === 'Poste') mappedOutcome = 'Off Target';

          // 2. تحويل الإحداثيات (من 100 إلى 120 و 80)
          const mappedX = shot.line ? (shot.line / 100) * 120 : 60; 
          const mappedY = shot.y ? (shot.y / 100) * 80 : 40;

          return {
            id: shot.key || String(index),
            player: `ID: ${shot.playerId}`, 
            team: shot.competitorNum === 1 ? data?.home?.name : data?.away?.name,
            x: mappedX,
            y: mappedY,
            xg: shot.xg || 0,
            outcome: mappedOutcome
          };
        });
        
        setLiveShots(mappedShots);
      }
    } catch (error: any) {
      console.error("خطأ في جلب البيانات الحية:", error);
      setLiveError(error.message || "حدث خطأ أثناء جلب البيانات من السيرفر.");
    } finally {
      setLiveLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`w-full max-w-6xl mx-auto my-4 p-8 rounded-3xl border flex flex-col items-center justify-center ${isDark ? 'bg-[#0a0a0a] border-emerald-900/30' : 'bg-gray-50 border-gray-200'}`}>
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className={`font-bold text-sm ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{t.loading}</p>
      </div>
    );
  }

  if (!data) return null;

  const tabsList = [
    { id: 'overview', label: t.tabs.overview },
    { id: 'attack', label: t.tabs.attack },
    { id: 'defence', label: t.tabs.defence },
    { id: 'lineup', label: t.tabs.lineup },
    { id: 'liveShotmap', label: t.tabs.liveShotmap },
  ];

  return (
    <div dir={dir} className={`relative w-full max-w-6xl mx-auto my-4 sm:my-6 rounded-2xl sm:rounded-3xl border shadow-2xl overflow-hidden font-saudi transition-all ${isDark ? 'bg-[#0a0a0a] border-emerald-900/30 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}>
      
      <div className="absolute inset-0 bg-gradient-to-br from-[#1D6B35]/15 via-transparent to-[#131314]/90 pointer-events-none z-0"></div>
      <div className={`absolute top-3 ${isArabic ? 'left-3' : 'right-3'} sm:top-4 sm:${isArabic ? 'left-4' : 'right-4'} opacity-30 flex items-center gap-1 z-20`}>
        <span className="text-emerald-500 font-black italic text-sm sm:text-lg tracking-wider">AiFBall</span>
        <span className="text-[8px] sm:text-[9px] bg-emerald-500 text-black px-1 rounded font-bold">PRO</span>
      </div>

      {!selectedPlayer && (
        <>
          {/* ترويسة المباراة */}
          <div className={`relative z-10 p-3 sm:p-6 flex flex-col sm:flex-row justify-between items-center border-b gap-3 sm:gap-0 ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
            <div className="flex sm:flex-col items-center justify-between w-full sm:w-1/3 gap-2">
              {data.home.logo ? (
                <img src={data.home.logo} alt={data.home.name} className="w-12 h-12 sm:w-20 sm:h-20 object-contain drop-shadow-md" />
              ) : (
                <div className="w-12 h-12 sm:w-20 sm:h-20 rounded-full bg-gray-600 flex items-center justify-center text-gray-300 shadow-inner">
                  <svg className="w-6 h-6 sm:w-10 sm:h-10" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L3 7v10l9 5 9-5V7l-9-5z"/></svg>
                </div>
              )}
              <span className="font-bold text-xs sm:text-base text-center">{data.home.name}</span>
            </div>
            
            <div className="flex flex-col items-center justify-center w-full sm:w-1/3 order-first sm:order-none">
              <div className={`text-3xl sm:text-6xl font-black px-4 sm:px-6 py-1 sm:py-2 rounded-xl sm:rounded-2xl border-2 shadow-inner ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'}`}>
                {data.home.score} - {data.away.score}
              </div>
              <span className="text-[9px] sm:text-xs text-gray-500 mt-1 sm:mt-2 font-bold tracking-widest">StatsBomb Data</span>
            </div>

            <div className="flex sm:flex-col items-center justify-between w-full sm:w-1/3 gap-2">
               {data.away.logo ? (
                <img src={data.away.logo} alt={data.away.name} className="w-12 h-12 sm:w-20 sm:h-20 object-contain drop-shadow-md" />
              ) : (
                <div className="w-12 h-12 sm:w-20 sm:h-20 rounded-full bg-gray-600 flex items-center justify-center text-gray-300 shadow-inner">
                  <svg className="w-6 h-6 sm:w-10 sm:h-10" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L3 7v10l9 5 9-5V7l-9-5z"/></svg>
                </div>
              )}
              <span className="font-bold text-xs sm:text-base text-center">{data.away.name}</span>
            </div>
          </div>

          <div className={`relative z-10 flex border-b overflow-x-auto custom-scrollbar ${isDark ? 'border-white/10 bg-[#131314]/80' : 'border-gray-200 bg-gray-100'}`}>
            {tabsList.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2.5 sm:py-3.5 px-3 sm:px-6 text-[11px] sm:text-sm font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 sm:gap-2 ${activeTab === tab.id ? (isDark ? 'text-emerald-400 border-b-2 border-emerald-500 bg-white/5' : 'text-emerald-700 border-b-2 border-emerald-600 bg-white') : (isDark ? 'text-gray-400 hover:text-gray-200 hover:bg-white/5' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50')}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </>
      )}

      <div className={`relative z-10 p-3 sm:p-6 ${selectedPlayer ? 'h-auto min-h-[500px]' : 'h-[500px] sm:h-[600px] overflow-y-auto custom-scrollbar'} ${isDark ? 'bg-[#0a0a0a]/50' : 'bg-white'}`}>
        
        {/* شاشة اللاعب */}
        {selectedPlayer ? (
          <div className="animate-in slide-in-from-bottom-4 duration-300">
            <button onClick={() => setSelectedPlayer(null)} className="mb-3 sm:mb-4 flex items-center gap-1.5 text-xs sm:text-sm font-bold text-emerald-500 hover:text-emerald-400">
              {t.backToLineup}
            </button>
            <div className={`p-3 sm:p-6 rounded-2xl border ${isDark ? 'bg-[#111] border-white/10' : 'bg-gray-50 border-gray-200'}`}>
              
              <div className={`flex flex-col sm:flex-row items-center gap-3 sm:gap-4 mb-4 sm:mb-6 border-b pb-4 border-gray-700 ${isArabic ? 'text-center sm:text-right' : 'text-center sm:text-left'}`}>
                 <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-gray-600 shadow-inner bg-gray-600 flex-shrink-0">
                   {selectedPlayer.image ? (
                     <img src={selectedPlayer.image} alt={selectedPlayer.name} className="w-full h-full object-cover object-top" />
                   ) : (
                     <div className="w-full h-full flex items-center justify-center text-gray-300 text-xl sm:text-3xl font-bold">
                       {selectedPlayer.name.charAt(0)}
                     </div>
                   )}
                 </div>
                 <div>
                    <h2 className="text-xl sm:text-3xl font-black">{selectedPlayer.name}</h2>
                    <p className="text-[10px] sm:text-sm text-gray-400">{selectedPlayer.pos} | {selectedPlayer.num}</p>
                 </div>
                 <div className={`${isArabic ? 'sm:mr-auto' : 'sm:ml-auto'} text-center`}>
                    <div className="text-2xl sm:text-4xl font-black text-emerald-400">{selectedPlayer.rating}</div>
                    <div className="text-[9px] sm:text-[10px] text-gray-500">{t.rating}</div>
                 </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3 mb-4 sm:mb-6">
                {[
                  { label: t.distance, val: '10.5 km' }, 
                  { label: t.topSpeed, val: '32.4 km/h' },
                  { label: t.passesMade, val: data.playersData[selectedPlayer.id]?.touches || 0 },
                  { label: t.progressivePasses, val: data.playersData[selectedPlayer.id]?.progressivePasses || 0 },
                  { label: t.shotsMade, val: data.playersData[selectedPlayer.id]?.shots.length || 0 },
                ].map((item, i) => (
                  <div key={i} className={`p-2 sm:p-3 rounded-xl border text-center ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'}`}>
                    <div className="text-sm sm:text-lg font-bold">{item.val}</div>
                    <div className="text-[9px] sm:text-[10px] text-gray-500 mt-0.5">{item.label}</div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className={`rounded-xl border p-2 bg-[#2E8B57] ${isDark ? 'border-gray-700' : 'border-emerald-600'}`}>
                  <h4 className="text-center font-bold text-[10px] sm:text-xs mb-1.5 text-white bg-black/40 py-1 rounded">{t.touchMap}</h4>
                  <div className="aspect-[3/4] w-full max-w-[200px] mx-auto">
                    <svg viewBox="0 0 120 80" className="w-full h-full">
                      <g stroke="rgba(255,255,255,0.3)" strokeWidth="1" fill="none">
                        <rect x="0" y="0" width="120" height="80" />
                        <line x1="60" y1="0" x2="60" y2="80" />
                        <circle cx="60" cy="40" r="10" />
                        <rect x="102" y="18" width="18" height="44" />
                        <rect x="114" y="30" width="6" height="20" />
                        <rect x="0" y="18" width="18" height="44" />
                      </g>
                      {data.playersData[selectedPlayer.id]?.heatmap.map((pt: any, idx: number) => (
                        <circle key={idx} cx={pt[0]} cy={pt[1]} r="2.5" fill="#ef4444" opacity="0.15" filter="blur(1px)" />
                      ))}
                    </svg>
                  </div>
                </div>

                <div className={`rounded-xl border p-2 bg-[#2E8B57] ${isDark ? 'border-gray-700' : 'border-emerald-600'}`}>
                  <h4 className="text-center font-bold text-[10px] sm:text-xs mb-1.5 text-white bg-black/40 py-1 rounded">{t.shotMap}</h4>
                  <div className="aspect-[3/4] w-full max-w-[200px] mx-auto">
                    <svg viewBox="0 0 120 80" className="w-full h-full">
                      <g stroke="rgba(255,255,255,0.3)" strokeWidth="1" fill="none">
                        <rect x="0" y="0" width="120" height="80" />
                        <line x1="60" y1="0" x2="60" y2="80" />
                        <circle cx="60" cy="40" r="10" />
                        <rect x="102" y="18" width="18" height="44" />
                        <rect x="114" y="30" width="6" height="20" />
                        <rect x="0" y="18" width="18" height="44" />
                      </g>
                      {data.playersData[selectedPlayer.id]?.shots.map((shot: any, idx: number) => (
                        <circle key={idx} cx={shot.x} cy={shot.y} r={2 + (shot.xg * 5)} fill={shot.isGoal ? '#22c55e' : '#ef4444'} stroke="#fff" strokeWidth="0.5" opacity="0.8" />
                      ))}
                    </svg>
                  </div>
                </div>

                <div className={`rounded-xl border p-2 bg-[#2E8B57] ${isDark ? 'border-gray-700' : 'border-emerald-600'}`}>
                  <h4 className="text-center font-bold text-[10px] sm:text-xs mb-1.5 text-white bg-black/40 py-1 rounded">{t.passMap}</h4>
                  <div className="aspect-[3/4] w-full max-w-[200px] mx-auto">
                    <svg viewBox="0 0 120 80" className="w-full h-full">
                      <g stroke="rgba(255,255,255,0.3)" strokeWidth="1" fill="none">
                        <rect x="0" y="0" width="120" height="80" />
                        <line x1="60" y1="0" x2="60" y2="80" />
                        <circle cx="60" cy="40" r="10" />
                      </g>
                      {data.playersData[selectedPlayer.id]?.passes.map((pass: any, idx: number) => (
                        <g key={idx}>
                          <line x1={pass.x} y1={pass.y} x2={pass.endX} y2={pass.endY} stroke="#fff" strokeWidth="0.5" opacity="0.5" />
                          <circle cx={pass.endX} cy={pass.endY} r="1.5" fill="#FBBF24" />
                        </g>
                      ))}
                      <circle cx={data.playersData[selectedPlayer.id]?.passes[0]?.x || 60} cy={data.playersData[selectedPlayer.id]?.passes[0]?.y || 40} r="3" fill="#22c55e" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-300">
                <div className={`p-4 sm:p-6 rounded-2xl border flex flex-col items-center ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                  <h4 className="text-[11px] sm:text-sm font-bold text-gray-400 mb-3 sm:mb-4">{t.xg}</h4>
                  <div className="w-full max-w-2xl flex items-center gap-2 sm:gap-4">
                    <span className="font-black text-lg sm:text-2xl text-yellow-500">{data.xg.home}</span>
                    <div className="flex-1 h-4 sm:h-6 rounded-full overflow-hidden flex bg-gray-800 relative shadow-inner">
                      <div className="h-full bg-yellow-500" style={{ width: `${(parseFloat(data.xg.home) / (parseFloat(data.xg.home) + parseFloat(data.xg.away))) * 100}%` }}></div>
                      <div className="h-full bg-red-500" style={{ width: `${(parseFloat(data.xg.away) / (parseFloat(data.xg.home) + parseFloat(data.xg.away))) * 100}%` }}></div>
                    </div>
                    <span className="font-black text-lg sm:text-2xl text-red-500">{data.xg.away}</span>
                  </div>
                </div>
                
                <div className={`rounded-2xl border overflow-hidden ${isDark ? 'border-white/10 bg-[#111]' : 'border-gray-200 bg-white'}`}>
                  <table className="w-full text-center text-[10px] sm:text-sm">
                    <thead className={`${isDark ? 'bg-black/40 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
                      <tr>
                        <th className="p-2 sm:p-3 font-bold w-1/3">{data.home.name}</th>
                        <th className="p-2 sm:p-3 font-bold w-1/3 text-emerald-500">{t.stat}</th>
                        <th className="p-2 sm:p-3 font-bold w-1/3">{data.away.name}</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? 'divide-white/5' : 'divide-gray-200'}`}>
                      {[
                        { h: data.stats.possession.home, stat: t.possession, a: data.stats.possession.away },
                        { h: data.stats.shots.home, stat: t.shotsCount, a: data.stats.shots.away },
                        { h: data.stats.shotsOnTarget.home, stat: t.shotsOnTarget, a: data.stats.shotsOnTarget.away },
                        { h: data.stats.passes.home, stat: t.passes, a: data.stats.passes.away },
                        { h: data.stats.passAccuracy.home, stat: t.passAccuracy, a: data.stats.passAccuracy.away },
                        { h: data.stats.corners.home, stat: t.corners, a: data.stats.corners.away },
                        { h: data.stats.fouls.home, stat: t.fouls, a: data.stats.fouls.away },
                      ].map((row, i) => (
                        <tr key={i} className={isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'}>
                          <td className="p-2 sm:p-3 font-bold">{row.h}</td>
                          <td className="p-2 sm:p-3 text-gray-500 font-medium">{row.stat}</td>
                          <td className="p-2 sm:p-3 font-bold">{row.a}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'attack' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <h3 className="text-lg font-bold text-emerald-500 border-b pb-2 mb-4">{t.attackData}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className={`p-4 rounded-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'}`}>
                    <h4 className="text-sm font-bold mb-3 text-gray-300">{data.home.name}</h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between border-b border-gray-700 pb-1"><span>التسديدات</span> <span className="font-bold">{data.stats.shots.home}</span></div>
                      <div className="flex justify-between border-b border-gray-700 pb-1"><span>الركنيات</span> <span className="font-bold">{data.stats.corners.home}</span></div>
                      <div className="flex justify-between border-b border-gray-700 pb-1"><span>التمريرات</span> <span className="font-bold">{data.stats.passes.home}</span></div>
                      <div className="flex justify-between pb-1"><span>دقة التمرير</span> <span className="font-bold">{data.stats.passAccuracy.home}</span></div>
                    </div>
                  </div>
                  <div className={`p-4 rounded-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'}`}>
                    <h4 className="text-sm font-bold mb-3 text-gray-300">{data.away.name}</h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between border-b border-gray-700 pb-1"><span>التسديدات</span> <span className="font-bold">{data.stats.shots.away}</span></div>
                      <div className="flex justify-between border-b border-gray-700 pb-1"><span>الركنيات</span> <span className="font-bold">{data.stats.corners.away}</span></div>
                      <div className="flex justify-between border-b border-gray-700 pb-1"><span>التمريرات</span> <span className="font-bold">{data.stats.passes.away}</span></div>
                      <div className="flex justify-between pb-1"><span>دقة التمرير</span> <span className="font-bold">{data.stats.passAccuracy.away}</span></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'defence' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <h3 className="text-lg font-bold text-emerald-500 border-b pb-2 mb-4">{t.defenceData}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className={`p-4 rounded-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'}`}>
                    <h4 className="text-sm font-bold mb-3 text-gray-300">{data.home.name}</h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between border-b border-gray-700 pb-1"><span>الاعتراضات</span> <span className="font-bold">{data.stats.interceptions.home}</span></div>
                      <div className="flex justify-between border-b border-gray-700 pb-1"><span>الالتحامات</span> <span className="font-bold">{data.stats.tackles.home}</span></div>
                      <div className="flex justify-between pb-1"><span>الأخطاء</span> <span className="font-bold">{data.stats.fouls.home}</span></div>
                    </div>
                  </div>
                  <div className={`p-4 rounded-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'}`}>
                    <h4 className="text-sm font-bold mb-3 text-gray-300">{data.away.name}</h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between border-b border-gray-700 pb-1"><span>الاعتراضات</span> <span className="font-bold">{data.stats.interceptions.away}</span></div>
                      <div className="flex justify-between border-b border-gray-700 pb-1"><span>الالتحامات</span> <span className="font-bold">{data.stats.tackles.away}</span></div>
                      <div className="flex justify-between pb-1"><span>الأخطاء</span> <span className="font-bold">{data.stats.fouls.away}</span></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'lineup' && (
              <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-300">
                <h3 className="text-sm sm:text-lg font-bold text-emerald-500 border-b pb-2 mb-2 sm:mb-4">{t.lineupTitle}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <h4 className="text-center font-bold text-xs sm:text-sm mb-2 sm:mb-3 text-yellow-500 bg-yellow-500/10 py-1.5 rounded-lg border border-yellow-500/20">{data.home.name}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {data.lineup.home.map((p: any) => (
                        <button key={p.id} onClick={() => setSelectedPlayer(p)} className={`flex items-center gap-2 p-2 rounded-xl border transition-all hover:scale-[1.02] ${isDark ? 'bg-white/5 border-white/10 hover:border-emerald-500/50' : 'bg-white border-gray-200 hover:border-emerald-500'}`}>
                          
                          <div className="w-8 h-8 rounded-full bg-gray-600 flex-shrink-0 overflow-hidden flex items-center justify-center text-gray-300 text-xs font-bold shadow-inner">
                            {p.image ? (
                              <img src={p.image} alt={p.name} className="w-full h-full object-cover object-top" />
                            ) : (
                              p.name.charAt(0)
                            )}
                          </div>

                          <div className={`${isArabic ? 'text-right' : 'text-left'} min-w-0 flex-1`}>
                            <div className="text-[11px] sm:text-xs font-bold truncate">{p.name}</div>
                            <div className="text-[9px] text-gray-500">{p.pos}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-center font-bold text-xs sm:text-sm mb-2 sm:mb-3 text-red-500 bg-red-500/10 py-1.5 rounded-lg border border-red-500/20">{data.away.name}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {data.lineup.away.map((p: any) => (
                        <button key={p.id} onClick={() => setSelectedPlayer(p)} className={`flex items-center gap-2 p-2 rounded-xl border transition-all hover:scale-[1.02] ${isDark ? 'bg-white/5 border-white/10 hover:border-emerald-500/50' : 'bg-white border-gray-200 hover:border-emerald-500'}`}>
                          
                          <div className="w-8 h-8 rounded-full bg-gray-600 flex-shrink-0 overflow-hidden flex items-center justify-center text-gray-300 text-xs font-bold shadow-inner">
                            {p.image ? (
                              <img src={p.image} alt={p.name} className="w-full h-full object-cover object-top" />
                            ) : (
                              p.name.charAt(0)
                            )}
                          </div>

                          <div className={`${isArabic ? 'text-right' : 'text-left'} min-w-0 flex-1`}>
                            <div className="text-[11px] sm:text-xs font-bold truncate">{p.name}</div>
                            <div className="text-[9px] text-gray-500">{p.pos}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* التبويب الجديد: خرائط التسديد الحية */}
            {activeTab === 'liveShotmap' && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className={`p-4 sm:p-6 rounded-xl border text-center ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                  <h3 className="text-lg font-bold text-emerald-500 mb-2">{t.tabs.liveShotmap}</h3>
                  <p className="text-sm text-gray-400 mb-4">
                    جلب خرائط التسديدات الحية مباشرة من 365Scores. (قد يستغرق السيرفر 50 ثانية للاستيقاظ في المرة الأولى)
                  </p>
                  <button
                    onClick={() => {
                      const url = prompt("أدخل رابط المباراة من 365Scores:");
                      if (url) fetchLiveShots(url);
                    }}
                    disabled={liveLoading}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mx-auto"
                  >
                    {liveLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        جاري الجلب...
                      </>
                    ) : (
                      '🎯 جلب خرائط التسديد'
                    )}
                  </button>
                  
                  {liveError && (
                    <p className="text-red-400 text-sm mt-4 bg-red-900/20 p-2 rounded">{liveError}</p>
                  )}
                </div>

                {liveShots.length > 0 && (
                  <ShotMap 
                    shots={liveShots} 
                    matchName={`${data?.home?.name} ضد ${data?.away?.name}`}
                    isDark={isDark}
                  />
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
