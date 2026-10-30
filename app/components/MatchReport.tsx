'use client';
import React, { useState, useEffect } from 'react';
import ShotMap, { ShotData } from './ShotMap';
import TacticalBoard from './TacticalBoard'; 

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

  // دالة لجلب الصور والشعارات
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
    } catch (e) { return null; }
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

      const homeLogo = await fetchWikiImage(homeName, 'logo');
      const awayLogo = await fetchWikiImage(awayName, 'logo');

      const baseData = {
        home: { name: homeName, score: '-', logo: homeLogo },
        away: { name: awayName, score: '-', logo: awayLogo },
        xg: { home: '0.00', away: '0.00' },
        lineup: { home: [], away: [] },
      };

      if (autoMatchUrl && source === '365') {
        try {
          const lineupRes = await fetch(`/api/advanced?source=365&action=lineup&matchUrl=${encodeURIComponent(autoMatchUrl)}`);
          const lineupJson = await lineupRes.json();
          
          if (lineupJson.data && Array.isArray(lineupJson.data)) {
            const allPlayers = lineupJson.data;
            const competitorIds = [...new Set(allPlayers.map((p: any) => p.competitorId))];
            const homeId = competitorIds[0];
            const awayId = competitorIds[1] || competitorIds[0];

            const homePlayers = await Promise.all(allPlayers.filter((p: any) => p.competitorId === homeId).slice(0, 11).map(async (p: any) => {
              const img = await fetchWikiImage(p.name, 'player');
              return { id: p.id || p.athleteId, name: p.name || p.shortName || 'لاعب', pos: 'Player', num: p.jerseyNumber || '-', image: img };
            }));

            const awayPlayers = await Promise.all(allPlayers.filter((p: any) => p.competitorId === awayId).slice(0, 11).map(async (p: any) => {
              const img = await fetchWikiImage(p.name, 'player');
              return { id: p.id || p.athleteId, name: p.name || p.shortName || 'لاعب', pos: 'Player', num: p.jerseyNumber || '-', image: img };
            }));
            
            baseData.lineup = { home: homePlayers, away: awayPlayers };
          }
        } catch (e) { console.error("فشل جلب التشكيلة:", e); }
      }

      setData(baseData);

      if (autoMatchUrl) { fetchLiveShotsData(autoMatchUrl, source); }
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
          if (!isHomeTeam) { mappedX = 120 - mappedX; mappedY = 80 - mappedY; }
          return { id: String(index), player: playerName, team: isHomeTeam ? (matchName.split('ضد')[0] || 'Home') : (matchName.split('ضد')[1] || 'Away'), x: mappedX, y: mappedY, xg: shot.xg || 0, outcome: mappedOutcome };
        });
        setLiveShots(mappedShots);
        setActiveTab('liveShotmap');
      } else { setLiveError("لم يتم العثور على تسديدات لهذه المباراة."); }
    } catch (error: any) { setLiveError(`فشل جلب الخريطة.`); } finally { setLiveLoading(false); }
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
    } catch (error) { alert("فشل جلب الخريطة الحرارية."); } finally { setHeatmapLoading(false); }
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
    <div dir={dir} className={`relative w-full max-w-6xl mx-auto my-4 sm:my-6 rounded-3xl border shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden font-saudi transition-all ${isDark ? 'bg-[#070B14] border-white/5 text-white' : 'bg-white border-gray-200 text-gray-900'}`}>
      
      {/* خلفية متوهجة */}
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-emerald-500/10 to-transparent pointer-events-none"></div>
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-emerald-600/20 rounded-full blur-[120px] pointer-events-none"></div>

      {!selectedPlayer && (
        <>
          {/* ترويسة المباراة (تصميم ملكي) */}
          <div className="relative z-10 p-6 sm:p-10 flex flex-col sm:flex-row justify-between items-center gap-6 border-b border-white/5">
            
            {/* الفريق الأول */}
            <div className="flex flex-col items-center gap-3 w-full sm:w-1/3">
              <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-[#131A2A] border border-white/10 shadow-2xl flex items-center justify-center p-3 relative group">
                <div className="absolute inset-0 bg-emerald-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                {data.home.logo ? (
                  <img src={data.home.logo} alt={data.home.name} className="w-full h-full object-contain drop-shadow-xl z-10" />
                ) : (
                  <span className="text-4xl font-black text-emerald-500 z-10">{data.home.name.charAt(0)}</span>
                )}
              </div>
              <span className="font-black text-lg sm:text-2xl text-center bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400">{data.home.name}</span>
            </div>

            {/* النتيجة */}
            <div className="flex flex-col items-center justify-center w-full sm:w-1/3 order-first sm:order-none">
              <div className="text-sm font-bold tracking-[0.3em] text-emerald-500 mb-2">FULL TIME</div>
              <div className="text-5xl sm:text-7xl font-black text-white tracking-tighter drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                {data.home.score} <span className="text-gray-600 mx-2">-</span> {data.away.score}
              </div>
            </div>

            {/* الفريق الثاني */}
            <div className="flex flex-col items-center gap-3 w-full sm:w-1/3">
              <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-[#131A2A] border border-white/10 shadow-2xl flex items-center justify-center p-3 relative group">
                <div className="absolute inset-0 bg-sky-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                {data.away.logo ? (
                  <img src={data.away.logo} alt={data.away.name} className="w-full h-full object-contain drop-shadow-xl z-10" />
                ) : (
                  <span className="text-4xl font-black text-sky-500 z-10">{data.away.name.charAt(0)}</span>
                )}
              </div>
              <span className="font-black text-lg sm:text-2xl text-center bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400">{data.away.name}</span>
            </div>
          </div>

          {/* التبويبات الزجاجية */}
          <div className="relative z-10 flex p-2 gap-2 overflow-x-auto custom-scrollbar bg-[#0B0F19]/80 backdrop-blur-md">
            {tabsList.map((tab) => (
              <button 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id)} 
                className={`flex-1 py-3 px-4 text-xs sm:text-sm font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${
                  activeTab === tab.id 
                    ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </>
      )}

      <div className="relative z-10 p-4 sm:p-8 min-h-[500px]">
        
        {selectedPlayer ? (
          /* شاشة اللاعب الفردية */
          <div className="animate-in slide-in-from-bottom-4 duration-300">
            <button onClick={() => { setSelectedPlayer(null); setHeatmapUrl(null); }} className="mb-6 flex items-center gap-2 text-sm font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 px-4 py-2 rounded-xl w-fit border border-emerald-500/20 transition-all">
              ← العودة للتشكيلة
            </button>
            <div className="p-6 sm:p-8 rounded-3xl border border-white/5 bg-[#111A14]/80 backdrop-blur-xl shadow-2xl">
               <div className="flex flex-col sm:flex-row items-center gap-6 mb-8">
                  <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden border-2 border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.2)] bg-[#1a1a1a] flex items-center justify-center text-4xl font-black text-emerald-400">
                    {selectedPlayer.image ? <img src={selectedPlayer.image} alt={selectedPlayer.name} className="w-full h-full object-cover" /> : selectedPlayer.name.charAt(0)}
                  </div>
                  <div className="text-center sm:text-right">
                    <h2 className="text-3xl sm:text-4xl font-black text-white mb-2">{selectedPlayer.name}</h2>
                    <span className="px-4 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg text-sm font-bold border border-emerald-500/30">{selectedPlayer.pos} | #{selectedPlayer.num}</span>
                  </div>
               </div>
               
               <button onClick={() => fetchHeatmap(selectedPlayer.name)} disabled={heatmapLoading} className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white py-4 rounded-xl font-black text-lg transition-all disabled:opacity-50 mb-6 flex justify-center items-center gap-3 shadow-[0_10px_30px_rgba(16,185,129,0.3)]">
                 {heatmapLoading ? 'جاري استخراج البيانات...' : '🔥 عرض الخريطة الحرارية'}
               </button>
               {heatmapUrl && <img src={heatmapUrl} alt="Heatmap" className="w-full rounded-2xl border border-white/10 shadow-2xl" />}
            </div>
          </div>
        ) : (
          <>
            {/* 1. النظرة العامة */}
            {activeTab === 'overview' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* بطاقة xG */}
                <div className="bg-gradient-to-br from-[#131A2A] to-[#0B0F19] p-6 rounded-3xl border border-white/5 shadow-xl relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl rounded-full"></div>
                   <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-bold text-gray-400 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> الأهداف المتوقعة (xG)</span>
                   </div>
                   {parseFloat(data.xg.home) === 0 && parseFloat(data.xg.away) === 0 ? (
                     <div className="text-center py-6 text-gray-500 font-bold">بيانات xG غير متوفرة لهذه المباراة حالياً</div>
                   ) : (
                     <div className="flex items-center gap-4">
                        <span className="text-3xl font-black text-white">{data.xg.home}</span>
                        <div className="flex-1 h-3 rounded-full bg-gray-800 flex overflow-hidden shadow-inner">
                          <div className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400" style={{ width: `${(parseFloat(data.xg.home) / (parseFloat(data.xg.home) + parseFloat(data.xg.away) || 1)) * 100}%` }}></div>
                          <div className="h-full bg-gradient-to-l from-sky-600 to-sky-400" style={{ width: `${(parseFloat(data.xg.away) / (parseFloat(data.xg.home) + parseFloat(data.xg.away) || 1)) * 100}%` }}></div>
                        </div>
                        <span className="text-3xl font-black text-white">{data.xg.away}</span>
                     </div>
                   )}
                </div>

                {/* لوحة التكتيك المصغرة */}
                <div className="bg-[#131A2A] p-5 rounded-3xl border border-white/5 shadow-xl">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-black text-gray-500 tracking-widest uppercase">Match Analysis</span>
                    <span className="text-xs font-black text-emerald-500 tracking-widest uppercase">AiFBall Board</span>
                  </div>
                  <div className="relative w-full aspect-[2/1] bg-[#0B0F19] rounded-2xl overflow-hidden border border-white/5">
                    <svg viewBox="0 0 120 60" className="w-full h-full">
                      <g stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" fill="none">
                        <rect x="2" y="2" width="116" height="56" /><line x1="60" y1="2" x2="60" y2="58" /><circle cx="60" cy="30" r="8" /><rect x="100" y="15" width="18" height="30" /><rect x="2" y="15" width="18" height="30" />
                      </g>
                      <path d="M 20 30 Q 40 10 60 30 T 100 30" fill="none" stroke="#10b981" strokeWidth="1.5" strokeDasharray="3,3" opacity="0.5" />
                      <circle cx="20" cy="30" r="2" fill="#10b981" /><circle cx="60" cy="30" r="2" fill="#f59e0b" /><circle cx="100" cy="30" r="2" fill="#10b981" />
                    </svg>
                  </div>
                </div>
              </div>
            )}

            {/* 2. التشكيلة (تصميم بطاقات احترافي) */}
            {activeTab === 'lineup' && (
              <div className="space-y-8 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  
                  {/* الفريق الأول */}
                  <div>
                    <h3 className="text-center font-black text-lg mb-6 text-emerald-400 tracking-wide flex items-center justify-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span> {data.home.name}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {data.lineup.home.map((p: any) => (
                        <button key={p.id} onClick={() => setSelectedPlayer(p)} className="group flex items-center gap-4 p-3 rounded-2xl bg-[#131A2A] border border-white/5 hover:border-emerald-500/50 hover:bg-[#1a2336] transition-all duration-300 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] text-right">
                          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-emerald-500/30 bg-[#0B0F19] flex-shrink-0 relative">
                            {p.image ? <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" /> : <span className="flex items-center justify-center h-full text-emerald-500 font-bold">{p.name.charAt(0)}</span>}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-bold text-white truncate">{p.name}</div>
                            <div className="text-[10px] font-bold text-emerald-500/70 mt-0.5">#{p.num} | {p.pos}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* الفريق الثاني */}
                  <div>
                    <h3 className="text-center font-black text-lg mb-6 text-sky-400 tracking-wide flex items-center justify-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-sky-500"></span> {data.away.name}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {data.lineup.away.map((p: any) => (
                        <button key={p.id} onClick={() => setSelectedPlayer(p)} className="group flex items-center gap-4 p-3 rounded-2xl bg-[#131A2A] border border-white/5 hover:border-sky-500/50 hover:bg-[#1a2336] transition-all duration-300 hover:shadow-[0_0_20px_rgba(14,165,233,0.15)] text-right">
                          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-sky-500/30 bg-[#0B0F19] flex-shrink-0 relative">
                            {p.image ? <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" /> : <span className="flex items-center justify-center h-full text-sky-500 font-bold">{p.name.charAt(0)}</span>}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-bold text-white truncate">{p.name}</div>
                            <div className="text-[10px] font-bold text-sky-500/70 mt-0.5">#{p.num} | {p.pos}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. الخرائط الحية */}
            {activeTab === 'liveShotmap' && (
              <div className="space-y-4 animate-in fade-in duration-300">
                {liveLoading ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
                    <p className="text-emerald-500 font-bold text-sm">جاري استخراج الخريطة...</p>
                  </div>
                ) : liveShots.length > 0 ? (
                  <ShotMap shots={liveShots} matchName={matchName} isDark={isDark} />
                ) : (
                  <div className="p-16 rounded-3xl border border-red-500/20 bg-red-500/5 text-center">
                    <p className="text-red-400 font-bold text-lg mb-2">لم نتمكن من جلب الخريطة.</p>
                    <p className="text-sm text-gray-400">تأكد من الرابط المرسل من المساعد الذكي.</p>
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
