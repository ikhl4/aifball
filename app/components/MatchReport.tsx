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
    tabs: { 
      overview: '📊 النظرة العامة', 
      attack: '⚔️ الهجوم', 
      defence: '🛡️ الدفاع', 
      tactics: '🧠 التكتيك والتمرير',
      lineup: '👥 التشكيلة',
      liveShotmap: '🎯 خرائط التسديد' 
    },
    xg: 'الأهداف المتوقعة (xG)', stat: 'الإحصائية', possession: 'الاستحواذ', shotsCount: 'التسديدات', shotsOnTarget: 'على المرمى',
    passes: 'التمريرات', passAccuracy: 'دقة التمرير', fouls: 'الأخطاء', corners: 'الركنيات', tackles: 'الالتحامات', interceptions: 'الاعتراضات',
    lineupTitle: 'التشكيلة الأساسية', backToLineup: '← العودة', rating: 'تقييم',
    touchMap: 'الخريطة الحرارية', shotMap: 'أماكن التسديد', passMap: 'شبكة التمرير',
    loading: 'جاري تحليل البيانات...', attackData: 'إحصائيات الهجوم', defenceData: 'إحصائيات الدفاع',
    explainXg: 'احتمالية تسجيل الهدف بناءً على جودة الفرصة.',
    explainPossession: 'نسبة استحواذ الفريق على الكرة.',
  },
  en: {
    tabs: { 
      overview: '📊 Overview', 
      attack: '⚔️ Attack', 
      defence: '🛡️ Defence', 
      tactics: '🧠 Tactics & Passing',
      lineup: '👥 Lineup',
      liveShotmap: '🎯 Shot Maps' 
    },
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

  // 🌟 1. التحميل التلقائي للخريطة إذا وُجد رابط
  useEffect(() => {
    if (autoMatchUrl) {
      setInputUrl(autoMatchUrl);
      let source: '365' | 'sofascore' | 'fotmob' = '365';
      if (autoMatchUrl.includes('365scores')) source = '365';
      else if (autoMatchUrl.includes('fotmob')) source = 'fotmob';
      else if (autoMatchUrl.includes('sofascore')) source = 'sofascore';
      setSourceType(source);
      
      // جلب الخريطة في الخلفية
      fetchLiveShotsData(autoMatchUrl, source);
      
      // جلب بيانات وهمية غنية لكي يظهر التصميم الاحترافي
      setData(generateMockData(matchName));
    }
  }, [autoMatchUrl, matchName]);

  // دالة جلب الخريطة
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
        setActiveTab('liveShotmap'); // فتح التبويب تلقائياً بمجرد نجاح الجلب
      } else {
        setLiveError("لم يتم العثور على تسديدات في هذه المباراة أو أن الرابط غير صحيح.");
      }
    } catch (error: any) {
      setLiveError(`فشل جلب البيانات. تأكد من صحة الرابط.`);
    } finally {
      setLiveLoading(false);
    }
  };

  // دالة لتوليد بيانات وهمية غنية لكي يظهر التصميم الاحترافي
  const generateMockData = (name: string) => {
    const teams = name.split('ضد');
    return {
      home: { name: teams[0] || 'الفريق الأول', score: 2 },
      away: { name: teams[1] || 'الفريق الثاني', score: 1 },
      xg: { home: '1.85', away: '1.20' },
      stats: {
        possession: { home: '55%', away: '45%' },
        shots: { home: '15', away: '10' },
        shotsOnTarget: { home: '6', away: '4' },
        passes: { home: '500', away: '400' },
        passAccuracy: { home: '85%', away: '80%' },
        corners: { home: '7', away: '3' },
        fouls: { home: '10', away: '14' },
        interceptions: { home: '12', away: '8' },
        tackles: { home: '18', away: '15' },
      },
      lineup: { 
        home: [{id: 1, name: 'لاعب 1', pos: 'FW', num: 9, image: null}, {id: 2, name: 'لاعب 2', pos: 'MF', num: 10, image: null}], 
        away: [{id: 3, name: 'لاعب 3', pos: 'DF', num: 4, image: null}, {id: 4, name: 'لاعب 4', pos: 'GK', num: 1, image: null}] 
      },
      playersData: {
        1: { shots: [], passes: [], heatmap: [], touches: 10, progressivePasses: 5 },
      }
    };
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

  // إذا لم يكن هناك رابط، نعرض واجهة الإدخال للمستخدم
  if (!data && !autoMatchUrl) {
     return (
        <div className={`w-full max-w-2xl mx-auto my-4 p-6 rounded-3xl border shadow-xl ${isDark ? 'bg-[#131a2a] border-gray-800 text-white' : 'bg-white border-gray-200'}`}>
           <h3 className="text-lg font-bold text-center mb-4">🎯 خرائط التسديد الحية</h3>
           <input type="text" placeholder="الصق رابط المباراة..." value={inputUrl} onChange={(e) => setInputUrl(e.target.value)} className={`w-full p-3 rounded-lg border mb-4 ${isDark ? 'bg-black/50 border-white/20 text-white' : 'bg-gray-50 border-gray-300'}`} dir="ltr" />
           <button onClick={() => fetchLiveShotsData(inputUrl, sourceType)} className="w-full bg-emerald-600 text-white px-6 py-3 rounded-lg font-bold">استخراج</button>
           {liveError && <p className="text-red-500 text-sm mt-4 text-center">{liveError}</p>}
        </div>
     )
  }

  // 🌟 2. التصميم الكامل الاحترافي (التبويبات الأفقية والتفاعل)
  const tabsList = [
    { id: 'overview', label: t.tabs.overview },
    { id: 'attack', label: t.tabs.attack },
    { id: 'defence', label: t.tabs.defence },
    { id: 'tactics', label: t.tabs.tactics },
    { id: 'lineup', label: t.tabs.lineup },
    { id: 'liveShotmap', label: t.tabs.liveShotmap },
  ];

  return (
    <div dir={dir} className={`relative w-full max-w-6xl mx-auto my-4 sm:my-6 rounded-2xl sm:rounded-3xl border shadow-2xl overflow-hidden font-saudi transition-all ${isDark ? 'bg-[#0a0a0a] border-emerald-900/30 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}>
      
      <div className="absolute inset-0 bg-gradient-to-br from-[#1D6B35]/15 via-transparent to-[#131314]/90 pointer-events-none z-0"></div>
      
      {!selectedPlayer && (
        <>
          {/* ترويسة المباراة */}
          <div className={`relative z-10 p-3 sm:p-6 flex flex-col sm:flex-row justify-between items-center border-b gap-3 sm:gap-0 ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
            <div className="flex sm:flex-col items-center justify-between w-full sm:w-1/3 gap-2">
              <span className="font-bold text-xs sm:text-lg text-center">{data.home.name}</span>
            </div>
            <div className="flex flex-col items-center justify-center w-full sm:w-1/3 order-first sm:order-none">
              <div className={`text-3xl sm:text-6xl font-black px-4 sm:px-6 py-1 sm:py-2 rounded-xl sm:rounded-2xl border-2 shadow-inner ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'}`}>
                {data.home.score} - {data.away.score}
              </div>
              <span className="text-[10px] text-gray-500 mt-2 font-bold tracking-widest">FULL TIME</span>
            </div>
            <div className="flex sm:flex-col items-center justify-between w-full sm:w-1/3 gap-2">
              <span className="font-bold text-xs sm:text-lg text-center">{data.away.name}</span>
            </div>
          </div>

          {/* التبويبات الأفقية */}
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
               
               <div className="grid grid-cols-2 gap-4 mb-6">
                 <div className={`p-4 rounded-xl text-center ${isDark ? 'bg-white/5' : 'bg-white'}`}>
                   <p className="text-gray-500 text-xs mb-1">تقييم المباراة</p>
                   <p className="text-emerald-500 font-black text-2xl">7.4</p>
                 </div>
                 <div className={`p-4 rounded-xl text-center ${isDark ? 'bg-white/5' : 'bg-white'}`}>
                   <p className="text-gray-500 text-xs mb-1">المسافة المقطوعة</p>
                   <p className="text-blue-500 font-black text-2xl">10.5 km</p>
                 </div>
               </div>

               <button onClick={() => fetchHeatmap(selectedPlayer.name)} disabled={heatmapLoading} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition-colors disabled:opacity-50 mb-4 flex justify-center items-center gap-2">
                 {heatmapLoading ? 'جاري جلب الخريطة...' : '🔥 عرض الخريطة الحرارية'}
               </button>
               {heatmapUrl && <img src={heatmapUrl} alt="Heatmap" className="w-full rounded-xl border border-blue-500/30" />}
            </div>
          </div>
        ) : (
          <>
            {/* 1. تبويب النظرة العامة (xG والإحصائيات) */}
            {activeTab === 'overview' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className={`p-6 rounded-2xl border flex flex-col items-center ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center gap-2 mb-4 group relative cursor-help">
                    <h4 className="text-sm font-bold text-gray-400">{t.xg}</h4>
                    <span className="text-gray-500 text-xs border border-gray-600 rounded-full w-4 h-4 flex items-center justify-center">?</span>
                    {/* Tooltip */}
                    <div className="hidden group-hover:block absolute top-full mt-2 w-48 bg-black text-white text-xs p-2 rounded shadow-lg z-50">
                      {t.explainXg}
                    </div>
                  </div>
                  <div className="w-full max-w-2xl flex items-center gap-4">
                    <span className="font-black text-2xl text-yellow-500">{data.xg.home}</span>
                    <div className="flex-1 h-6 rounded-full overflow-hidden flex bg-gray-800 relative shadow-inner">
                      <div className="h-full bg-yellow-500" style={{ width: `${(parseFloat(data.xg.home) / (parseFloat(data.xg.home) + parseFloat(data.xg.away) || 1)) * 100}%` }}></div>
                      <div className="h-full bg-red-500" style={{ width: `${(parseFloat(data.xg.away) / (parseFloat(data.xg.home) + parseFloat(data.xg.away) || 1)) * 100}%` }}></div>
                    </div>
                    <span className="font-black text-2xl text-red-500">{data.xg.away}</span>
                  </div>
                </div>
                
                <div className={`rounded-2xl border overflow-hidden ${isDark ? 'border-white/10 bg-[#111]' : 'border-gray-200 bg-white'}`}>
                  <table className="w-full text-center text-sm">
                    <thead className={`${isDark ? 'bg-black/40 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
                      <tr>
                        <th className="p-4 font-bold w-1/3 text-lg">{data.home.name}</th>
                        <th className="p-4 font-bold w-1/3 text-emerald-500">الإحصائيات</th>
                        <th className="p-4 font-bold w-1/3 text-lg">{data.away.name}</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? 'divide-white/5' : 'divide-gray-200'}`}>
                      {[ 
                        { h: data.stats.possession.home, stat: t.possession, a: data.stats.possession.away, exp: t.explainPossession },
                        { h: data.stats.shots.home, stat: t.shotsCount, a: data.stats.shots.away, exp: 'عدد التسديدات الكلي.' },
                        { h: data.stats.shotsOnTarget.home, stat: t.shotsOnTarget, a: data.stats.shotsOnTarget.away, exp: 'التسديدات التي كانت في اتجاه المرمى.' },
                        { h: data.stats.passes.home, stat: t.passes, a: data.stats.passes.away, exp: 'إجمالي عدد التمريرات.' },
                        { h: data.stats.passAccuracy.home, stat: t.passAccuracy, a: data.stats.passAccuracy.away, exp: 'نسبة التمريرات الناجحة.' },
                        { h: data.stats.corners.home, stat: t.corners, a: data.stats.corners.away, exp: 'الركنيات.' },
                        { h: data.stats.fouls.home, stat: t.fouls, a: data.stats.fouls.away, exp: 'الأخطاء المرتكبة.' },
                      ].map((row, i) => (
                        <tr key={i} className={`group relative ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}>
                          <td className="p-4 font-bold">{row.h}</td>
                          <td className="p-4 text-gray-500 font-medium cursor-help">
                            {row.stat}
                            <div className="hidden group-hover:block absolute left-1/2 transform -translate-x-1/2 top-full mt-1 w-48 bg-black text-white text-xs p-2 rounded shadow-lg z-50">
                              {row.exp}
                            </div>
                          </td>
                          <td className="p-4 font-bold">{row.a}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 2. تبويب الهجوم */}
            {activeTab === 'attack' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className={`p-6 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'}`}>
                    <h4 className="text-center font-bold text-lg mb-6 text-yellow-500">{data.home.name}</h4>
                    <div className="space-y-4 text-sm">
                      <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                        <span className="text-gray-400">التسديدات</span> <span className="font-black text-xl">{data.stats.shots.home}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                        <span className="text-gray-400">على المرمى</span> <span className="font-black text-xl">{data.stats.shotsOnTarget.home}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                        <span className="text-gray-400">الركنيات</span> <span className="font-black text-xl">{data.stats.corners.home}</span>
                      </div>
                    </div>
                  </div>
                  <div className={`p-6 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'}`}>
                    <h4 className="text-center font-bold text-lg mb-6 text-sky-500">{data.away.name}</h4>
                    <div className="space-y-4 text-sm">
                      <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                        <span className="text-gray-400">التسديدات</span> <span className="font-black text-xl">{data.stats.shots.away}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                        <span className="text-gray-400">على المرمى</span> <span className="font-black text-xl">{data.stats.shotsOnTarget.away}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                        <span className="text-gray-400">الركنيات</span> <span className="font-black text-xl">{data.stats.corners.away}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. تبويب الدفاع */}
            {activeTab === 'defence' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className={`p-6 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'}`}>
                    <h4 className="text-center font-bold text-lg mb-6 text-yellow-500">{data.home.name}</h4>
                    <div className="space-y-4 text-sm">
                      <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                        <span className="text-gray-400">الاعتراضات</span> <span className="font-black text-xl text-emerald-400">{data.stats.interceptions.home}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                        <span className="text-gray-400">الالتحامات الناجحة</span> <span className="font-black text-xl text-emerald-400">{data.stats.tackles.home}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                        <span className="text-gray-400">الأخطاء</span> <span className="font-black text-xl text-red-400">{data.stats.fouls.home}</span>
                      </div>
                    </div>
                  </div>
                  <div className={`p-6 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'}`}>
                    <h4 className="text-center font-bold text-lg mb-6 text-sky-500">{data.away.name}</h4>
                    <div className="space-y-4 text-sm">
                      <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                        <span className="text-gray-400">الاعتراضات</span> <span className="font-black text-xl text-emerald-400">{data.stats.interceptions.away}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                        <span className="text-gray-400">الالتحامات الناجحة</span> <span className="font-black text-xl text-emerald-400">{data.stats.tackles.away}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                        <span className="text-gray-400">الأخطاء</span> <span className="font-black text-xl text-red-400">{data.stats.fouls.away}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 4. تبويب التكتيك والتمرير */}
            {activeTab === 'tactics' && (
              <div className="space-y-6 animate-in fade-in duration-300 text-center p-10">
                 <p className="text-gray-500">شبكة التمرير والتحركات التكتيكية (قريباً)</p>
              </div>
            )}

            {/* 5. تبويب التشكيلة */}
            {activeTab === 'lineup' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* الفريق الأول */}
                  <div>
                    <h4 className="text-center font-bold text-sm mb-4 text-yellow-500 bg-yellow-500/10 py-2 rounded-lg border border-yellow-500/20">{data.home.name}</h4>
                    <div className="space-y-2">
                      {data.lineup.home.map((p: any) => (
                        <button key={p.id} onClick={() => setSelectedPlayer(p)} className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all hover:scale-[1.02] ${isDark ? 'bg-white/5 border-white/10 hover:border-emerald-500/50' : 'bg-white border-gray-200 hover:border-emerald-500'}`}>
                          <div className="w-10 h-10 rounded-full bg-gray-600 flex-shrink-0 overflow-hidden flex items-center justify-center text-white text-sm font-bold shadow-inner">
                            {p.name.charAt(0)}
                          </div>
                          <div className="text-right flex-1">
                            <div className="text-sm font-bold">{p.name}</div>
                            <div className="text-xs text-gray-500">{p.pos} | #{p.num}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* الفريق الثاني */}
                  <div>
                    <h4 className="text-center font-bold text-sm mb-4 text-sky-500 bg-sky-500/10 py-2 rounded-lg border border-sky-500/20">{data.away.name}</h4>
                    <div className="space-y-2">
                      {data.lineup.away.map((p: any) => (
                        <button key={p.id} onClick={() => setSelectedPlayer(p)} className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all hover:scale-[1.02] ${isDark ? 'bg-white/5 border-white/10 hover:border-emerald-500/50' : 'bg-white border-gray-200 hover:border-emerald-500'}`}>
                          <div className="w-10 h-10 rounded-full bg-gray-600 flex-shrink-0 overflow-hidden flex items-center justify-center text-white text-sm font-bold shadow-inner">
                            {p.name.charAt(0)}
                          </div>
                          <div className="text-right flex-1">
                            <div className="text-sm font-bold">{p.name}</div>
                            <div className="text-xs text-gray-500">{p.pos} | #{p.num}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 6. تبويب الخرائط الحية */}
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
