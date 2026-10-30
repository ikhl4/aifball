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
    tabs: { overview: '📊 النظرة العامة', attack: '⚔️ الهجوم والانتقالات', defence: '🛡️ الدفاع والصراعات', lineup: '👥 التشكيلة والتحليل', liveShotmap: '🎯 خرائط التسديد الحية' },
    xg: 'الأهداف المتوقعة (xG)', stat: 'الإحصائية', possession: 'الاستحواذ', shotsCount: 'التسديدات', shotsOnTarget: 'على المرمى',
    passes: 'التمريرات', passAccuracy: 'دقة التمرير', fouls: 'الأخطاء', corners: 'الركنيات', tackles: 'الالتحامات', interceptions: 'الاعتراضات',
    lineupTitle: 'التشكيلة', backToLineup: '← العودة للتشكيلة', rating: 'تقييم',
    touchMap: 'الخريطة الحرارية', shotMap: 'أماكن التسديد', passMap: 'شبكة التمرير',
    loading: 'جاري جلب البيانات من المصدر...', attackData: 'إحصائيات الهجوم', defenceData: 'إحصائيات الدفاع',
  },
  en: {
    tabs: { overview: '📊 Overview', attack: '⚔️ Attack & Transitions', defence: '🛡️ Defence & Duels', lineup: '👥 Lineup & Analysis', liveShotmap: '🎯 Live Shot Maps' },
    xg: 'Expected Goals (xG)', stat: 'Statistic', possession: 'Possession', shotsCount: 'Shots', shotsOnTarget: 'Shots on Target',
    passes: 'Passes', passAccuracy: 'Pass Accuracy', fouls: 'Fouls', corners: 'Corners', tackles: 'Tackles', interceptions: 'Interceptions',
    lineupTitle: 'Lineup', backToLineup: '← Back to Lineup', rating: 'Rating',
    touchMap: 'Heatmap', shotMap: 'Shot Map', passNetwork: 'Pass Network',
    loading: 'Loading data from source...', attackData: 'Attack Stats', defenceData: 'Defence Stats',
  }
};

export default function MatchReport({ matchName, isDark = true, autoMatchUrl }: MatchReportProps) {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const [liveShots, setLiveShots] = useState<ShotData[]>([]);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [inputUrl, setInputUrl] = useState(autoMatchUrl || '');
  const [sourceType, setSourceType] = useState<'365' | 'sofascore' | 'fotmob'>('sofascore');

  const [heatmapUrl, setHeatmapUrl] = useState<string | null>(null);
  const [heatmapLoading, setHeatmapLoading] = useState(false);

  const isArabic = /[\u0600-\u06FF]/.test(matchName);
  const lang = isArabic ? 'ar' : 'en';
  const t = translations[lang];
  const dir = isArabic ? 'rtl' : 'ltr';

  useEffect(() => {
    if (!autoMatchUrl) {
      setLoading(false);
      return;
    }

    setInputUrl(autoMatchUrl);
    let source: '365' | 'sofascore' | 'fotmob' = 'sofascore';
    if (autoMatchUrl.includes('365scores')) source = '365';
    else if (autoMatchUrl.includes('fotmob')) source = 'fotmob';
    setSourceType(source);

    // إذا كان الرابط من FotMob، نجلب الإحصائيات الكاملة من البايثون
    if (source === 'fotmob') {
      const fetchMatchData = async () => {
        setLoading(true);
        try {
          const res = await fetch(`/api/advanced?source=fotmob&action=match&matchUrl=${encodeURIComponent(autoMatchUrl)}`);
          const result = await res.json();
          
          if (res.ok && result.data) {
            // 🚨 ملاحظة: هنا يتم مابنة بيانات FotMob لتتناسب مع التصميم
            // بناءً على هيكل البيانات الذي يرجعه LanusStats، قد تحتاج لتعديل أسماء الحقول
            const fotmobData = result.data;
            
            setData({
              home: { name: matchName.split('ضد')[0] || fotmobData.home?.name || 'الفريق الأول', logo: fotmobData.home?.logo || null, score: fotmobData.home?.score || 0 },
              away: { name: matchName.split('ضد')[1] || fotmobData.away?.name || 'الفريق الثاني', logo: fotmobData.away?.logo || null, score: fotmobData.away?.score || 0 },
              xg: { home: fotmobData.xg?.home || '0.00', away: fotmobData.xg?.away || '0.00' },
              stats: {
                possession: { home: fotmobData.stats?.possession?.home || '50%', away: fotmobData.stats?.possession?.away || '50%' },
                shots: { home: fotmobData.stats?.shots?.home || '0', away: fotmobData.stats?.shots?.away || '0' },
                shotsOnTarget: { home: fotmobData.stats?.shotsOnTarget?.home || '0', away: fotmobData.stats?.shotsOnTarget?.away || '0' },
                passes: { home: fotmobData.stats?.passes?.home || '0', away: fotmobData.stats?.passes?.away || '0' },
                passAccuracy: { home: fotmobData.stats?.passAccuracy?.home || '0%', away: fotmobData.stats?.passAccuracy?.away || '0%' },
                corners: { home: fotmobData.stats?.corners?.home || '0', away: fotmobData.stats?.corners?.away || '0' },
                fouls: { home: fotmobData.stats?.fouls?.home || '0', away: fotmobData.stats?.fouls?.away || '0' },
                interceptions: { home: fotmobData.stats?.interceptions?.home || '0', away: fotmobData.stats?.interceptions?.away || '0' },
                tackles: { home: fotmobData.stats?.tackles?.home || '0', away: fotmobData.stats?.tackles?.away || '0' },
              },
              lineup: { home: fotmobData.lineup?.home || [], away: fotmobData.lineup?.away || [] },
              playersData: fotmobData.playersData || {}
            });
          } else {
            setData(null);
          }
        } catch (error) {
          setData(null);
        } finally {
          setLoading(false);
        }
      };
      fetchMatchData();
    } else {
      // إذا كان الرابط من SofaScore أو 365، لا نجلب إحصائيات، بل نعرض واجهة الخرائط
      setLoading(false);
      setData(null);
    }
  }, [autoMatchUrl, matchName]);


  const fetchLiveShots = async () => {
    if (!inputUrl) {
      setLiveError("الرجاء إدخال رابط المباراة أولاً.");
      return;
    }
    setLiveLoading(true);
    setLiveError(null);
    setLiveShots([]); 

    try {
      const res = await fetch(`/api/advanced?source=${sourceType}&action=shotmap&matchUrl=${encodeURIComponent(inputUrl)}`);
      const json = await res.json();

      if (json.error) throw new Error(json.details || json.error);

      if (json.data && Array.isArray(json.data)) {
        const mappedShots: ShotData[] = json.data.map((shot: any, index: number) => {
          let mappedOutcome: 'Goal' | 'Saved' | 'Off Target' | 'Blocked' = 'Off Target';
          let mappedX = 60;
          let mappedY = 40;
          let playerName = '';
          let isHomeTeam = true;

          if (sourceType === '365') {
            if (shot.shot_outcome === 'Gol') mappedOutcome = 'Goal';
            else if (shot.shot_outcome === 'Atajado') mappedOutcome = 'Saved';
            else if (shot.shot_outcome === 'Bloqueado') mappedOutcome = 'Blocked';
            mappedX = shot.line ? (shot.line / 100) * 120 : 60; 
            mappedY = shot.y ? (shot.y / 100) * 80 : 40;
            isHomeTeam = shot.competitorNum === 1;
            playerName = `لاعب ${shot.playerId}`; 
          } else if (sourceType === 'sofascore') {
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
            id: String(index), player: playerName, team: isHomeTeam ? (data?.home?.name || 'Home') : (data?.away?.name || 'Away'),
            x: mappedX, y: mappedY, xg: shot.xg || shot.expected_goals || 0, outcome: mappedOutcome
          };
        });
        setLiveShots(mappedShots);
      } else {
        setLiveError("لم يتم العثور على تسديدات في هذه المباراة أو أن الرابط غير صحيح.");
      }
    } catch (error: any) {
      setLiveError(`فشل جلب البيانات. تأكد من صحة الرابط، أو جرب المصدر الآخر.`);
    } finally {
      setLiveLoading(false);
    }
  };

  const fetchHeatmap = async (playerName: string) => {
    if (!inputUrl) {
      alert("الرجاء إدخال رابط المباراة في تبويب خرائط التسديد أولاً.");
      return;
    }
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

  // 🌟 إذا لم توجد بيانات كاملة (رابط Sofa/365)، نعرض واجهة الخرائط الحية فوراً 🌟
  if (!data) {
    return (
      <div className={`relative w-full max-w-6xl mx-auto my-4 sm:my-6 rounded-2xl sm:rounded-3xl border shadow-2xl overflow-hidden font-saudi transition-all ${isDark ? 'bg-[#0a0a0a] border-emerald-900/30 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}>
        <div className={`absolute inset-0 bg-gradient-to-br from-[#1D6B35]/15 via-transparent to-[#131314]/90 pointer-events-none z-0`}></div>
        <div className={`relative z-10 p-4 sm:p-6 border-b ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
          <h3 className={`text-lg font-bold text-center ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
            🎯 خرائط التسديد والبيانات الحية
          </h3>
        </div>
        <div className="relative z-10 p-4 sm:p-6">
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className={`p-4 sm:p-6 rounded-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
              <div className="max-w-xl mx-auto space-y-4">
                <div className="flex justify-center gap-2 mb-4">
                  <button onClick={() => setSourceType('sofascore')} className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${sourceType === 'sofascore' ? 'bg-emerald-600 text-white' : (isDark ? 'bg-white/10 text-gray-300' : 'bg-gray-200 text-gray-700')}`}>SofaScore</button>
                  <button onClick={() => setSourceType('365')} className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${sourceType === '365' ? 'bg-emerald-600 text-white' : (isDark ? 'bg-white/10 text-gray-300' : 'bg-gray-200 text-gray-700')}`}>365Scores</button>
                </div>
                <input type="text" placeholder={`الصق رابط المباراة هنا...`} value={inputUrl} onChange={(e) => setInputUrl(e.target.value)} className={`w-full p-3 rounded-lg border outline-none ${isDark ? 'bg-black/50 border-white/20 text-white focus:border-emerald-500' : 'bg-white border-gray-300 text-black focus:border-emerald-500'}`} dir="ltr" />
                <button onClick={fetchLiveShots} disabled={liveLoading || !inputUrl} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {liveLoading ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>جاري المعالجة...</> : '🎯 استخراج الخريطة'}
                </button>
              </div>
              {liveError && <div className="mt-4 p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-center text-red-400 text-sm max-w-xl mx-auto">{liveError}</div>}
            </div>
            {liveShots.length > 0 && <ShotMap shots={liveShots} matchName={matchName} isDark={isDark} />}
          </div>
        </div>
      </div>
    );
  }

  // واجهة التقرير الكاملة (تظهر فقط إذا كان الرابط من FotMob وجلب البيانات بنجاح)
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
      {!selectedPlayer && (
        <>
          <div className={`relative z-10 p-3 sm:p-6 flex flex-col sm:flex-row justify-between items-center border-b gap-3 sm:gap-0 ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
            <div className="flex sm:flex-col items-center justify-between w-full sm:w-1/3 gap-2">
              <span className="font-bold text-xs sm:text-base text-center">{data.home.name}</span>
            </div>
            <div className="flex flex-col items-center justify-center w-full sm:w-1/3 order-first sm:order-none">
              <div className={`text-3xl sm:text-6xl font-black px-4 sm:px-6 py-1 sm:py-2 rounded-xl sm:rounded-2xl border-2 shadow-inner ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'}`}>
                {data.home.score} - {data.away.score}
              </div>
            </div>
            <div className="flex sm:flex-col items-center justify-between w-full sm:w-1/3 gap-2">
              <span className="font-bold text-xs sm:text-base text-center">{data.away.name}</span>
            </div>
          </div>

          <div className={`relative z-10 flex border-b overflow-x-auto custom-scrollbar ${isDark ? 'border-white/10 bg-[#131314]/80' : 'border-gray-200 bg-gray-100'}`}>
            {tabsList.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`py-2.5 sm:py-3.5 px-3 sm:px-6 text-[11px] sm:text-sm font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 sm:gap-2 ${activeTab === tab.id ? (isDark ? 'text-emerald-400 border-b-2 border-emerald-500 bg-white/5' : 'text-emerald-700 border-b-2 border-emerald-600 bg-white') : (isDark ? 'text-gray-400 hover:text-gray-200 hover:bg-white/5' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50')}`}>{tab.label}</button>
            ))}
          </div>
        </>
      )}

      <div className={`relative z-10 p-3 sm:p-6 ${selectedPlayer ? 'h-auto min-h-[500px]' : 'h-[500px] sm:h-[600px] overflow-y-auto custom-scrollbar'} ${isDark ? 'bg-[#0a0a0a]/50' : 'bg-white'}`}>
        {selectedPlayer ? (
          <div className="animate-in slide-in-from-bottom-4 duration-300">
            <button onClick={() => { setSelectedPlayer(null); setHeatmapUrl(null); }} className="mb-3 sm:mb-4 flex items-center gap-1.5 text-xs sm:text-sm font-bold text-emerald-500 hover:text-emerald-400">{t.backToLineup}</button>
            <div className={`p-3 sm:p-6 rounded-2xl border ${isDark ? 'bg-[#111] border-white/10' : 'bg-gray-50 border-gray-200'}`}>
               <h2 className="text-xl sm:text-3xl font-black">{selectedPlayer.name}</h2>
               <button onClick={() => fetchHeatmap(selectedPlayer.name)} disabled={heatmapLoading} className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-bold transition-colors disabled:opacity-50">{heatmapLoading ? 'جاري جلب الخريطة...' : 'عرض الخريطة الحرارية'}</button>
               {heatmapUrl && <img src={heatmapUrl} alt="Heatmap" className="w-full mt-4 rounded-xl" />}
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
                      <div className="h-full bg-yellow-500" style={{ width: `${(parseFloat(data.xg.home) / (parseFloat(data.xg.home) + parseFloat(data.xg.away) || 1)) * 100}%` }}></div>
                      <div className="h-full bg-red-500" style={{ width: `${(parseFloat(data.xg.away) / (parseFloat(data.xg.home) + parseFloat(data.xg.away) || 1)) * 100}%` }}></div>
                    </div>
                    <span className="font-black text-lg sm:text-2xl text-red-500">{data.xg.away}</span>
                  </div>
                </div>
                <div className={`rounded-2xl border overflow-hidden ${isDark ? 'border-white/10 bg-[#111]' : 'border-gray-200 bg-white'}`}>
                  <table className="w-full text-center text-[10px] sm:text-sm">
                    <thead className={`${isDark ? 'bg-black/40 text-gray-400' : 'bg-gray-100 text-gray-600'}`}><tr><th className="p-2 sm:p-3 font-bold w-1/3">{data.home.name}</th><th className="p-2 sm:p-3 font-bold w-1/3 text-emerald-500">{t.stat}</th><th className="p-2 sm:p-3 font-bold w-1/3">{data.away.name}</th></tr></thead>
                    <tbody className={`divide-y ${isDark ? 'divide-white/5' : 'divide-gray-200'}`}>
                      {[ { h: data.stats.possession.home, stat: t.possession, a: data.stats.possession.away }, { h: data.stats.shots.home, stat: t.shotsCount, a: data.stats.shots.away }, { h: data.stats.shotsOnTarget.home, stat: t.shotsOnTarget, a: data.stats.shotsOnTarget.away }, { h: data.stats.passes.home, stat: t.passes, a: data.stats.passes.away }, { h: data.stats.passAccuracy.home, stat: t.passAccuracy, a: data.stats.passAccuracy.away }, { h: data.stats.corners.home, stat: t.corners, a: data.stats.corners.away }, { h: data.stats.fouls.home, stat: t.fouls, a: data.stats.fouls.away }, ].map((row, i) => (
                        <tr key={i} className={isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'}><td className="p-2 sm:p-3 font-bold">{row.h}</td><td className="p-2 sm:p-3 text-gray-500 font-medium">{row.stat}</td><td className="p-2 sm:p-3 font-bold">{row.a}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'liveShotmap' && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className={`p-4 sm:p-6 rounded-xl border text-center ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                  <h3 className="text-lg font-bold text-emerald-500 mb-2">{t.tabs.liveShotmap}</h3>
                  <div className="max-w-xl mx-auto space-y-4">
                    <div className="flex justify-center gap-2 mb-4">
                      <button onClick={() => setSourceType('sofascore')} className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${sourceType === 'sofascore' ? 'bg-emerald-600 text-white' : (isDark ? 'bg-white/10 text-gray-300' : 'bg-gray-200 text-gray-700')}`}>SofaScore</button>
                      <button onClick={() => setSourceType('365')} className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${sourceType === '365' ? 'bg-emerald-600 text-white' : (isDark ? 'bg-white/10 text-gray-300' : 'bg-gray-200 text-gray-700')}`}>365Scores</button>
                    </div>
                    <input type="text" placeholder={`الصق رابط المباراة هنا...`} value={inputUrl} onChange={(e) => setInputUrl(e.target.value)} className={`w-full p-3 rounded-lg border outline-none ${isDark ? 'bg-black/50 border-white/20 text-white focus:border-emerald-500' : 'bg-white border-gray-300 text-black focus:border-emerald-500'}`} dir="ltr" />
                    <button onClick={fetchLiveShots} disabled={liveLoading || !inputUrl} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                      {liveLoading ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>جاري المعالجة...</> : '🎯 استخراج الخريطة'}
                    </button>
                  </div>
                  {liveError && <div className="mt-4 p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-center text-red-400 text-sm max-w-xl mx-auto">{liveError}</div>}
                </div>
                {liveShots.length > 0 && <ShotMap shots={liveShots} matchName={`${data?.home?.name} ضد ${data?.away?.name}`} isDark={isDark} />}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
