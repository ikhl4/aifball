'use client';
import React, { useState, useEffect } from 'react';
import ShotMap, { ShotData } from './ShotMap';

interface MatchReportProps {
  matchName: string;
  isDark?: boolean;
  autoMatchUrl?: string; 
}

const translations = {
  ar: {
    tabs: { overview: '📊 النظرة العامة', attack: '⚔️ الهجوم', defence: '🛡️ الدفاع', tactics: '🧠 التكتيك والتمرير', lineup: '👥 التشكيلة', liveShotmap: '🎯 خرائط التسديد' },
    xg: 'الأهداف المتوقعة (xG)', stat: 'الإحصائية', possession: 'الاستحواذ', shotsCount: 'التسديدات', shotsOnTarget: 'على المرمى',
    passes: 'التمريرات', passAccuracy: 'دقة التمرير', fouls: 'الأخطاء', corners: 'الركنيات', tackles: 'الالتحامات', interceptions: 'الاعتراضات',
    lineupTitle: 'التشكيلة الأساسية', backToLineup: '← العودة', rating: 'تقييم',
    touchMap: 'الخريطة الحرارية', shotMap: 'أماكن التسديد', passMap: 'شبكة التمرير',
    loading: 'جاري تحليل البيانات...', attackData: 'إحصائيات الهجوم', defenceData: 'إحصائيات الدفاع',
    explainXg: 'احتمالية تسجيل الهدف بناءً على جودة الفرصة.',
    explainPossession: 'نسبة استحواذ الفريق على الكرة.',
  },
  en: {
    tabs: { overview: '📊 Overview', attack: '⚔️ Attack', defence: '🛡️ Defence', tactics: '🧠 Tactics', lineup: '👥 Lineup', liveShotmap: '🎯 Shot Maps' },
    xg: 'Expected Goals (xG)', stat: 'Statistic', possession: 'Possession', shotsCount: 'Shots', shotsOnTarget: 'Shots on Target',
    passes: 'Passes', passAccuracy: 'Pass Accuracy', fouls: 'Fouls', corners: 'Corners', tackles: 'Tackles', interceptions: 'Interceptions',
    lineupTitle: 'Starting Lineup', backToLineup: '← Back', rating: 'Rating',
    touchMap: 'Heatmap', shotMap: 'Shot Map', passNetwork: 'Pass Network',
    loading: 'Analyzing data...', attackData: 'Attack Stats', defenceData: 'Defence Stats',
    explainXg: 'Probability of scoring based on chance quality.',
    explainPossession: 'Percentage of ball possession.',
  }
};

export default function MatchReport({ matchName, isDark = true, autoMatchUrl }: MatchReportProps) {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // --- حالات خرائط التسديد الحية ---
  const [liveShots, setLiveShots] = useState<ShotData[]>([]);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [inputUrl, setInputUrl] = useState(autoMatchUrl || '');
  const [sourceType, setSourceType] = useState<'365' | 'sofascore' | 'fotmob'>('365');

  // --- حالات الخريطة الحرارية ---
  const [heatmapUrl, setHeatmapUrl] = useState<string | null>(null);
  const [heatmapLoading, setHeatmapLoading] = useState(false);

  const isArabic = /[\u0600-\u06FF]/.test(matchName);
  const lang = isArabic ? 'ar' : 'en';
  const t = translations[lang];
  const dir = isArabic ? 'rtl' : 'ltr';

  // 🌟 جلب البيانات الحقيقية (التشكيلة + الخرائط) عند تحميل المكون
  useEffect(() => {
    const loadRealData = async () => {
      setLoading(true);
      
      let source: '365' | 'sofascore' | 'fotmob' = '365';
      if (autoMatchUrl) {
        setInputUrl(autoMatchUrl);
        if (autoMatchUrl.includes('365scores')) source = '365';
        else if (autoMatchUrl.includes('fotmob')) source = 'fotmob';
        else if (autoMatchUrl.includes('sofascore')) source = 'sofascore';
        setSourceType(source);
      }

      // إعداد بيانات أساسية للتصميم (تجنباً لظهور الخطأ)
      const baseData = {
        home: { name: matchName.split('ضد')[0] || 'الفريق الأول', score: '-' },
        away: { name: matchName.split('ضد')[1] || 'الفريق الثاني', score: '-' },
        xg: { home: '0.00', away: '0.00' },
        stats: {
          possession: { home: '0%', away: '0%' }, shots: { home: '0', away: '0' },
          shotsOnTarget: { home: '0', away: '0' }, passes: { home: '0', away: '0' },
          passAccuracy: { home: '0%', away: '0%' }, corners: { home: '0', away: '0' },
          fouls: { home: '0', away: '0' }, interceptions: { home: '0', away: '0' }, tackles: { home: '0', away: '0' },
        },
        lineup: { home: [], away: [] },
        playersData: {}
      };

      // إذا كان هناك رابط من 365Scores، نجلب التشكيلة الحقيقية
      if (autoMatchUrl && source === '365') {
        try {
          const lineupRes = await fetch(`/api/advanced?source=365&action=lineup&matchUrl=${encodeURIComponent(autoMatchUrl)}`);
          const lineupJson = await lineupRes.json();
          
          if (lineupJson.data && Array.isArray(lineupJson.data)) {
            // هنا نقوم بفلترة اللاعبين وتقسيمهم (حسب المنطق الذي يرجعه 365)
            // افتراضياً، نأخذ أول 11 لاعب كأساسيين للفريق الأول، والباقي للثاني
            const allPlayers = lineupJson.data;
            const homePlayers = allPlayers.filter((p: any) => p.competitorNum === 1).slice(0, 11).map((p: any) => ({
              id: p.playerId, name: p.playerName || `لاعب ${p.playerId}`, pos: p.position || 'N/A', num: p.shirtNumber || '-', image: null
            }));
            const awayPlayers = allPlayers.filter((p: any) => p.competitorNum === 2).slice(0, 11).map((p: any) => ({
              id: p.playerId, name: p.playerName || `لاعب ${p.playerId}`, pos: p.position || 'N/A', num: p.shirtNumber || '-', image: null
            }));
            
            baseData.lineup = { home: homePlayers, away: awayPlayers };
          }
        } catch (e) {
          console.error("فشل جلب التشكيلة:", e);
        }
      }

      setData(baseData);

      // جلب خريطة التسديد تلقائياً في الخلفية
      if (autoMatchUrl) {
        fetchLiveShotsData(autoMatchUrl, source);
      }
      
      setLoading(false);
    };

    loadRealData();
  }, [autoMatchUrl, matchName]);

  const fetchLiveShotsData = async (url: string, source: string) => {
    setLiveLoading(true);
    setLiveError(null);
    setLiveShots([]); 

    try {
      const res = await fetch(`/api/advanced?source=${source}&action=shotmap&matchUrl=${encodeURIComponent(url)}`);
      const json = await res.json();

      if (json.error) throw new Error(json.details || json.error);

      if (json.data && Array.isArray(json.data)) {
        const mappedShots: ShotData[] = json.data.map((shot: any, index: number) => {
          let mappedOutcome: 'Goal' | 'Saved' | 'Off Target' | 'Blocked' = 'Off Target';
          let mappedX = 60; let mappedY = 40; let playerName = ''; let isHomeTeam = true;

          if (source === '365') {
            if (shot.shot_outcome === 'Gol') mappedOutcome = 'Goal';
            else if (shot.shot_outcome === 'Atajado') mappedOutcome = 'Saved';
            else if (shot.shot_outcome === 'Bloqueado') mappedOutcome = 'Blocked';
            mappedX = shot.line ? (shot.line / 100) * 120 : 60; 
            mappedY = shot.y ? (shot.y / 100) * 80 : 40;
            isHomeTeam = shot.competitorNum === 1;
            playerName = `لاعب ${shot.playerId}`; 
          } else if (source === 'sofascore') {
            const outcomeStr = (shot.shot_type || shot.outcome || '').toLowerCase();
            if (outcomeStr.includes('goal')) mappedOutcome = 'Goal';
            else if (outcomeStr.includes('save')) mappedOutcome = 'Saved';
            else if (outcomeStr.includes('block')) mappedOutcome = 'Blocked';
            mappedX = shot.x ? (shot.x / 100) * 120 : 60; 
            mappedY = shot.y ? (shot.y / 100) * 80 : 40;
            isHomeTeam = shot.is_home === true; 
            playerName = shot.player_name || shot.player || 'لاعب غير معروف';
          }

          if (!isHomeTeam) { mappedX = 120 - mappedX; mappedY = 80 - mappedY; }

          return {
            id: String(index), player: playerName, team: isHomeTeam ? (matchName.split('ضد')[0] || 'Home') : (matchName.split('ضد')[1] || 'Away'),
            x: mappedX, y: mappedY, xg: shot.xg || shot.expected_goals || 0, outcome: mappedOutcome
          };
        });
        setLiveShots(mappedShots);
        setActiveTab('liveShotmap');
      } else {
        setLiveError("لم يتم العثور على تسديدات لهذه المباراة.");
      }
    } catch (error: any) {
      setLiveError(`فشل جلب الخريطة. تأكد من الرابط.`);
    } finally {
      setLiveLoading(false);
    }
  };

  const fetchHeatmap = async (playerName: string) => {
    if (!inputUrl) return;
    setHeatmapLoading(true);
    setHeatmapUrl(null);
    try {
      const res = await fetch(`/api/advanced?source=${sourceType}&action=heatmap&matchUrl=${encodeURIComponent(inputUrl)}&playerName=${encodeURIComponent(playerName)}`);
      const json = await res.json();
      if (json.url) setHeatmapUrl(json.url);
      else alert("لم يتم العثور على خريطة حرارية لهذا اللاعب.");
    } catch (error) {
      alert("فشل جلب الخريطة الحرارية.");
    } finally {
      setHeatmapLoading(false);
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
    { id: 'lineup', label: t.tabs.lineup },
    { id: 'liveShotmap', label: t.tabs.liveShotmap },
  ];

  return (
    <div dir={dir} className={`relative w-full max-w-6xl mx-auto my-4 sm:my-6 rounded-2xl sm:rounded-3xl border shadow-2xl overflow-hidden font-saudi transition-all ${isDark ? 'bg-[#0a0a0a] border-emerald-900/30 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}>
      
      <div className="absolute inset-0 bg-gradient-to-br from-[#1D6B35]/15 via-transparent to-[#131314]/90 pointer-events-none z-0"></div>
      
      {!selectedPlayer && (
        <>
          <div className={`relative z-10 p-3 sm:p-6 flex flex-col sm:flex-row justify-between items-center border-b gap-3 sm:gap-0 ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
            <div className="flex sm:flex-col items-center justify-between w-full sm:w-1/3 gap-2">
              <span className="font-bold text-xs sm:text-lg text-center">{data.home.name}</span>
            </div>
            <div className="flex flex-col items-center justify-center w-full sm:w-1/3 order-first sm:order-none">
              <div className={`text-3xl sm:text-6xl font-black px-4 sm:px-6 py-1 sm:py-2 rounded-xl sm:rounded-2xl border-2 shadow-inner ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'}`}>
                {data.home.score} - {data.away.score}
              </div>
            </div>
            <div className="flex sm:flex-col items-center justify-between w-full sm:w-1/3 gap-2">
              <span className="font-bold text-xs sm:text-lg text-center">{data.away.name}</span>
            </div>
          </div>

          <div className={`relative z-10 flex border-b overflow-x-auto custom-scrollbar ${isDark ? 'border-white/10 bg-[#131314]/80' : 'border-gray-200 bg-gray-100'}`}>
            {tabsList.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`py-3 px-4 sm:px-6 text-xs sm:text-sm font-bold whitespace-nowrap transition-colors flex items-center gap-2 ${activeTab === tab.id ? (isDark ? 'text-emerald-400 border-b-2 border-emerald-500 bg-white/5' : 'text-emerald-700 border-b-2 border-emerald-600 bg-white') : (isDark ? 'text-gray-400 hover:text-gray-200 hover:bg-white/5' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50')}`}>
                {tab.label}
              </button>
            ))}
          </div>
        </>
      )}

      <div className={`relative z-10 p-4 sm:p-6 ${selectedPlayer ? 'h-auto min-h-[500px]' : 'h-[600px] overflow-y-auto custom-scrollbar'} ${isDark ? 'bg-[#0a0a0a]/50' : 'bg-white'}`}>
        
        {/* شاشة اللاعب */}
        {selectedPlayer ? (
          <div className="animate-in slide-in-from-bottom-4 duration-300">
            <button onClick={() => { setSelectedPlayer(null); setHeatmapUrl(null); }} className="mb-4 flex items-center gap-2 text-sm font-bold text-emerald-500 hover:text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg w-fit">{t.backToLineup}</button>
            <div className={`p-6 rounded-2xl border ${isDark ? 'bg-[#111] border-white/10' : 'bg-gray-50 border-gray-200'}`}>
               <h2 className="text-2xl font-black mb-2">{selectedPlayer.name}</h2>
               <p className="text-gray-500 text-sm mb-6">{selectedPlayer.pos} | #{selectedPlayer.num}</p>
               
               <button onClick={() => fetchHeatmap(selectedPlayer.name)} disabled={heatmapLoading} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition-colors disabled:opacity-50 mb-4 flex justify-center items-center gap-2">
                 {heatmapLoading ? 'جاري جلب الخريطة...' : '🔥 عرض الخريطة الحرارية'}
               </button>
               {heatmapUrl && <img src={heatmapUrl} alt="Heatmap" className="w-full rounded-xl border border-blue-500/30" />}
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <div className="space-y-6 animate-in fade-in duration-300 text-center p-10 text-gray-500">
                <p>بيانات الإحصائيات الدقيقة (ستتوفر عند جلب الإحصائيات من FotMob بالكامل)</p>
              </div>
            )}

            {activeTab === 'lineup' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* الفريق الأول */}
                  <div>
                    <h4 className="text-center font-bold text-sm mb-4 text-yellow-500 bg-yellow-500/10 py-2 rounded-lg border border-yellow-500/20">{data.home.name}</h4>
                    <div className="space-y-2">
                      {data.lineup.home.length > 0 ? data.lineup.home.map((p: any) => (
                        <button key={p.id} onClick={() => setSelectedPlayer(p)} className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all hover:scale-[1.02] ${isDark ? 'bg-white/5 border-white/10 hover:border-emerald-500/50' : 'bg-white border-gray-200 hover:border-emerald-500'}`}>
                          <div className="w-10 h-10 rounded-full bg-gray-600 flex-shrink-0 overflow-hidden flex items-center justify-center text-white text-sm font-bold shadow-inner">
                            {p.name.charAt(0)}
                          </div>
                          <div className="text-right flex-1">
                            <div className="text-sm font-bold">{p.name}</div>
                            <div className="text-xs text-gray-500">{p.pos} | #{p.num}</div>
                          </div>
                        </button>
                      )) : <p className="text-center text-xs text-gray-500">التشكيلة غير متوفرة</p>}
                    </div>
                  </div>
                  {/* الفريق الثاني */}
                  <div>
                    <h4 className="text-center font-bold text-sm mb-4 text-sky-500 bg-sky-500/10 py-2 rounded-lg border border-sky-500/20">{data.away.name}</h4>
                    <div className="space-y-2">
                      {data.lineup.away.length > 0 ? data.lineup.away.map((p: any) => (
                        <button key={p.id} onClick={() => setSelectedPlayer(p)} className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all hover:scale-[1.02] ${isDark ? 'bg-white/5 border-white/10 hover:border-emerald-500/50' : 'bg-white border-gray-200 hover:border-emerald-500'}`}>
                          <div className="w-10 h-10 rounded-full bg-gray-600 flex-shrink-0 overflow-hidden flex items-center justify-center text-white text-sm font-bold shadow-inner">
                            {p.name.charAt(0)}
                          </div>
                          <div className="text-right flex-1">
                            <div className="text-sm font-bold">{p.name}</div>
                            <div className="text-xs text-gray-500">{p.pos} | #{p.num}</div>
                          </div>
                        </button>
                      )) : <p className="text-center text-xs text-gray-500">التشكيلة غير متوفرة</p>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'liveShotmap' && (
              <div className="space-y-4 animate-in fade-in duration-300">
                {liveLoading ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-emerald-500 font-bold text-sm">جاري استخراج الخريطة...</p>
                  </div>
                ) : liveShots.length > 0 ? (
                  <ShotMap shots={liveShots} matchName={matchName} isDark={isDark} />
                ) : (
                  <div className={`p-10 rounded-xl border text-center ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                    <p className="text-red-500 font-bold mb-4">{liveError || "لم نتمكن من جلب الخريطة."}</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
