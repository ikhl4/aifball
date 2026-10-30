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
    tabs: { overview: '📊 النظرة العامة', lineup: '👥 التشكيلة', liveShotmap: '🎯 خرائط التسديد' },
    xg: 'الأهداف المتوقعة (xG)', stat: 'الإحصائية', possession: 'الاستحواذ', shotsCount: 'التسديدات',
    loading: 'جاري تحليل البيانات...', 
  },
  en: {
    tabs: { overview: '📊 Overview', lineup: '👥 Lineup', liveShotmap: '🎯 Shot Maps' },
    xg: 'Expected Goals (xG)', stat: 'Statistic', possession: 'Possession', shotsCount: 'Shots',
    loading: 'Analyzing data...', 
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

  const [heatmapUrl, setHeatmapUrl] = useState<string | null>(null);
  const [heatmapLoading, setHeatmapLoading] = useState(false);

  const isArabic = /[\u0600-\u06FF]/.test(matchName);
  const lang = isArabic ? 'ar' : 'en';
  const t = translations[lang];
  const dir = isArabic ? 'rtl' : 'ltr';

  // 🌟 دالة لجلب الصور والشعارات من ويكيبيديا
  const fetchWikiImage = async (searchQuery: string, type: 'logo' | 'player' = 'logo') => {
    let query = searchQuery;
    if (type === 'logo') query = `${searchQuery} football club logo`;
    else query = `${searchQuery} footballer`;

    const url = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrlimit=1&prop=pageimages&format=json&pithumbsize=300&origin=*`;
    try {
      const res = await fetch(url);
      const result = await res.json();
      const pages = result.query?.pages;
      if (pages) {
        const pageId = Object.keys(pages)[0];
        if (pageId !== '-1' && pages[pageId].thumbnail) {
          return pages[pageId].thumbnail.source;
        }
      }
    } catch (e) {
      return null;
    }
    return null;
  };

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

      const homeName = matchName.split('ضد')[0] || 'الفريق الأول';
      const awayName = matchName.split('ضد')[1] || 'الفريق الثاني';

      // 1. جلب الشعارات
      const homeLogo = await fetchWikiImage(homeName, 'logo');
      const awayLogo = await fetchWikiImage(awayName, 'logo');

      const baseData = {
        home: { name: homeName, score: '-', logo: homeLogo },
        away: { name: awayName, score: '-', logo: awayLogo },
        xg: { home: '0.00', away: '0.00' },
        lineup: { home: [], away: [] },
      };

      // 2. جلب التشكيلة الحقيقية
      if (autoMatchUrl && source === '365') {
        try {
          const lineupRes = await fetch(`/api/advanced?source=365&action=lineup&matchUrl=${encodeURIComponent(autoMatchUrl)}`);
          const lineupJson = await lineupRes.json();
          
          if (lineupJson.data && Array.isArray(lineupJson.data)) {
            const allPlayers = lineupJson.data;
            
            // استخراج أرقام الفريقين
            const competitorIds = [...new Set(allPlayers.map((p: any) => p.competitorId))];
            const homeId = competitorIds[0];
            const awayId = competitorIds[1] || competitorIds[0];

            // جلب صور اللاعبين (بشكل متوازي لتسريع العملية)
            const homePlayers = await Promise.all(allPlayers.filter((p: any) => p.competitorId === homeId).slice(0, 11).map(async (p: any) => {
              const img = await fetchWikiImage(p.name, 'player');
              return {
                id: p.id || p.athleteId, 
                name: p.name || p.shortName || 'لاعب', 
                pos: 'Player', 
                num: p.jerseyNumber || '-', 
                image: img
              };
            }));

            const awayPlayers = await Promise.all(allPlayers.filter((p: any) => p.competitorId === awayId).slice(0, 11).map(async (p: any) => {
              const img = await fetchWikiImage(p.name, 'player');
              return {
                id: p.id || p.athleteId, 
                name: p.name || p.shortName || 'لاعب', 
                pos: 'Player', 
                num: p.jerseyNumber || '-', 
                image: img
              };
            }));
            
            baseData.lineup = { home: homePlayers, away: awayPlayers };
          }
        } catch (e) {
          console.error("فشل جلب التشكيلة:", e);
        }
      }

      setData(baseData);

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
            
            const xVal = shot.side !== undefined ? shot.side : (shot.x !== undefined ? shot.x : 50);
            const yVal = shot.line !== undefined ? shot.line : (shot.y !== undefined ? shot.y : 50);
            
            mappedX = (xVal / 100) * 120;
            mappedY = (yVal / 100) * 80;
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

          if (!isHomeTeam) { 
            mappedX = 120 - mappedX; 
            mappedY = 80 - mappedY; 
          }

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
    <div dir={dir} className={`relative w-full max-w-6xl mx-auto my-4 sm:my-6 rounded-2xl sm:rounded-3xl border shadow-2xl overflow-hidden font-saudi transition-all ${isDark ? 'bg-[#07100B] border-emerald-900/30 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}>
      
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#1D6B35]/20 rounded-full filter blur-[120px] pointer-events-none"></div>
      
      {!selectedPlayer && (
        <>
          <div className={`relative z-10 p-3 sm:p-6 flex flex-col sm:flex-row justify-between items-center border-b gap-3 sm:gap-0 ${isDark ? 'border-emerald-900/50 bg-[#111A14]/80' : 'border-gray-200 bg-white'}`}>
            <div className="flex sm:flex-col items-center justify-between w-full sm:w-1/3 gap-2">
              {data.home.logo ? (
                <img src={data.home.logo} alt={data.home.name} className="w-12 h-12 sm:w-20 sm:h-20 object-contain drop-shadow-md" />
              ) : (
                <div className="w-12 h-12 sm:w-20 sm:h-20 rounded-full bg-gray-600 flex items-center justify-center text-gray-300 shadow-inner">
                  <svg className="w-6 h-6 sm:w-10 sm:h-10" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L3 7v10l9 5 9-5V7l-9-5z"/></svg>
                </div>
              )}
              <span className="font-bold text-xs sm:text-lg text-center">{data.home.name}</span>
            </div>
            <div className="flex flex-col items-center justify-center w-full sm:w-1/3 order-first sm:order-none">
              <div className={`text-3xl sm:text-6xl font-black px-4 sm:px-6 py-1 sm:py-2 rounded-xl sm:rounded-2xl border-2 shadow-[0_0_20px_rgba(16,185,129,0.2)] ${isDark ? 'bg-[#07100B] border-emerald-500/30 text-white' : 'bg-white border-gray-200'}`}>
                {data.home.score} - {data.away.score}
              </div>
            </div>
            <div className="flex sm:flex-col items-center justify-between w-full sm:w-1/3 gap-2">
              {data.away.logo ? (
                <img src={data.away.logo} alt={data.away.name} className="w-12 h-12 sm:w-20 sm:h-20 object-contain drop-shadow-md" />
              ) : (
                <div className="w-12 h-12 sm:w-20 sm:h-20 rounded-full bg-gray-600 flex items-center justify-center text-gray-300 shadow-inner">
                  <svg className="w-6 h-6 sm:w-10 sm:h-10" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L3 7v10l9 5 9-5V7l-9-5z"/></svg>
                </div>
              )}
              <span className="font-bold text-xs sm:text-lg text-center">{data.away.name}</span>
            </div>
          </div>

          <div className={`relative z-10 flex border-b overflow-x-auto custom-scrollbar ${isDark ? 'border-emerald-900/50 bg-[#07100B]' : 'border-gray-200 bg-gray-100'}`}>
            {tabsList.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`py-3 px-4 sm:px-6 text-xs sm:text-sm font-bold whitespace-nowrap transition-colors flex items-center gap-2 ${activeTab === tab.id ? (isDark ? 'text-emerald-400 border-b-2 border-emerald-500 bg-[#111A14]' : 'text-emerald-700 border-b-2 border-emerald-600 bg-white') : (isDark ? 'text-gray-400 hover:text-emerald-200 hover:bg-[#111A14]/50' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50')}`}>
                {tab.label}
              </button>
            ))}
          </div>
        </>
      )}

      <div className={`relative z-10 p-4 sm:p-6 ${selectedPlayer ? 'h-auto min-h-[500px]' : 'h-auto min-h-[600px] overflow-y-auto custom-scrollbar'} ${isDark ? 'bg-[#07100B]' : 'bg-white'}`}>
        
        {selectedPlayer ? (
          <div className="animate-in slide-in-from-bottom-4 duration-300">
            <button onClick={() => { setSelectedPlayer(null); setHeatmapUrl(null); }} className="mb-4 flex items-center gap-2 text-sm font-bold text-emerald-500 hover:text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg w-fit">{t.tabs.lineup}</button>
            <div className={`p-6 rounded-2xl border ${isDark ? 'bg-[#111A14] border-emerald-900/50' : 'bg-gray-50 border-gray-200'}`}>
               <div className="flex items-center gap-4 mb-6">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-emerald-500/50 bg-[#1D6B35]/20 flex items-center justify-center text-3xl font-black text-emerald-400">
                    {selectedPlayer.image ? (
                      <img src={selectedPlayer.image} alt={selectedPlayer.name} className="w-full h-full object-cover" />
                    ) : (
                      selectedPlayer.name.charAt(0)
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl font-black mb-1">{selectedPlayer.name}</h2>
                    <p className="text-gray-400 text-sm">{selectedPlayer.pos} | #{selectedPlayer.num}</p>
                  </div>
               </div>
               
               <button onClick={() => fetchHeatmap(selectedPlayer.name)} disabled={heatmapLoading} className="w-full bg-[#1D6B35] hover:bg-emerald-600 text-white py-3 rounded-xl font-bold transition-colors disabled:opacity-50 mb-4 flex justify-center items-center gap-2 shadow-[0_0_15px_rgba(29,107,53,0.4)]">
                 {heatmapLoading ? 'جاري جلب الخريطة...' : '🔥 عرض الخريطة الحرارية'}
               </button>
               {heatmapUrl && <img src={heatmapUrl} alt="Heatmap" className="w-full rounded-xl border border-emerald-500/30" />}
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                     <div className="bg-[#111A14]/80 p-5 rounded-2xl border border-emerald-900/50 backdrop-blur-md">
                        <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold mb-2">
                           <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                           الأهداف المتوقعة (xG)
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-2xl font-black text-yellow-500">{data.xg.home}</span>
                          <div className="flex-1 h-2 rounded-full bg-gray-800 overflow-hidden flex">
                            <div className="h-full bg-yellow-500" style={{ width: `${(parseFloat(data.xg.home) / (parseFloat(data.xg.home) + parseFloat(data.xg.away) || 1)) * 100}%` }}></div>
                            <div className="h-full bg-red-500" style={{ width: `${(parseFloat(data.xg.away) / (parseFloat(data.xg.home) + parseFloat(data.xg.away) || 1)) * 100}%` }}></div>
                          </div>
                          <span className="text-2xl font-black text-red-500">{data.xg.away}</span>
                        </div>
                     </div>
                  </div>

                  <div className="bg-[#111A14]/80 p-4 rounded-2xl border border-emerald-900/50 backdrop-blur-md">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] text-gray-500 font-bold tracking-wider">MATCH ANALYSIS</span>
                      <span className="text-[10px] text-emerald-400 font-bold tracking-wider">AiFBall BOARD</span>
                    </div>
                    <div className="relative w-full aspect-[2/1] bg-[#07100B] rounded-xl overflow-hidden border border-emerald-900/30">
                      <svg viewBox="0 0 120 60" className="w-full h-full">
                        <g stroke="rgba(16,185,129,0.2)" strokeWidth="0.5" fill="none">
                          <rect x="2" y="2" width="116" height="56" />
                          <line x1="60" y1="2" x2="60" y2="58" />
                          <circle cx="60" cy="30" r="8" />
                          <rect x="100" y="15" width="18" height="30" />
                          <rect x="2" y="15" width="18" height="30" />
                        </g>
                        <path d="M 20 30 Q 40 10 60 30 T 100 30" fill="none" stroke="#10b981" strokeWidth="1" strokeDasharray="2,2" />
                        <circle cx="20" cy="30" r="1.5" fill="#10b981" />
                        <circle cx="60" cy="30" r="1.5" fill="#f59e0b" />
                        <circle cx="100" cy="30" r="1.5" fill="#10b981" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-[#111A14]/80 border border-emerald-900/50 rounded-2xl p-6 text-center mt-6">
                    <p className="text-gray-400 text-sm">💡 الإحصائيات التفصيلية (الاستحواذ، التمرير) تتطلب ربط بيانات FotMob. يمكنك الاعتماد حالياً على خريطة التسديد والتحليل النصي أعلاه.</p>
                </div>
              </div>
            )}

            {activeTab === 'lineup' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-center font-bold text-sm mb-4 text-yellow-500 bg-yellow-500/10 py-2 rounded-lg border border-yellow-500/20">{data.home.name}</h4>
                    <div className="space-y-2">
                      {data.lineup.home.length > 0 ? data.lineup.home.map((p: any) => (
                        <button key={p.id} onClick={() => setSelectedPlayer(p)} className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all hover:scale-[1.02] ${isDark ? 'bg-[#111A14] border-emerald-900/50 hover:border-emerald-500/50' : 'bg-white border-gray-200 hover:border-emerald-500'}`}>
                          <div className="w-10 h-10 rounded-full bg-[#1D6B35]/20 flex-shrink-0 overflow-hidden flex items-center justify-center text-emerald-400 text-sm font-bold shadow-inner border border-emerald-500/30">
                            {p.image ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" /> : p.name.charAt(0)}
                          </div>
                          <div className="text-right flex-1">
                            <div className="text-sm font-bold text-gray-200">{p.name}</div>
                            <div className="text-xs text-gray-500">{p.pos} | #{p.num}</div>
                          </div>
                        </button>
                      )) : <p className="text-center text-xs text-gray-500">التشكيلة غير متوفرة لهذه المباراة.</p>}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-center font-bold text-sm mb-4 text-sky-500 bg-sky-500/10 py-2 rounded-lg border border-sky-500/20">{data.away.name}</h4>
                    <div className="space-y-2">
                      {data.lineup.away.length > 0 ? data.lineup.away.map((p: any) => (
                        <button key={p.id} onClick={() => setSelectedPlayer(p)} className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all hover:scale-[1.02] ${isDark ? 'bg-[#111A14] border-emerald-900/50 hover:border-emerald-500/50' : 'bg-white border-gray-200 hover:border-emerald-500'}`}>
                          <div className="w-10 h-10 rounded-full bg-sky-900/20 flex-shrink-0 overflow-hidden flex items-center justify-center text-sky-400 text-sm font-bold shadow-inner border border-sky-500/30">
                            {p.image ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" /> : p.name.charAt(0)}
                          </div>
                          <div className="text-right flex-1">
                            <div className="text-sm font-bold text-gray-200">{p.name}</div>
                            <div className="text-xs text-gray-500">{p.pos} | #{p.num}</div>
                          </div>
                        </button>
                      )) : <p className="text-center text-xs text-gray-500">التشكيلة غير متوفرة لهذه المباراة.</p>}
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
                  <div className={`p-10 rounded-xl border text-center ${isDark ? 'bg-[#111A14] border-emerald-900/50' : 'bg-gray-50 border-gray-200'}`}>
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
