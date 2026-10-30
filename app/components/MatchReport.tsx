'use client';
import React, { useState, useEffect } from 'react';

interface MatchReportProps {
  matchName: string;
  matchId?: string;
  isDark?: boolean;
}

const tabs = [
  { id: 'overview', label: '📊 النظرة العامة' },
  { id: 'attack', label: '⚔️ الهجوم' },
  { id: 'defence', label: '🛡️ الدفاع' },
  { id: 'lineup', label: '👥 التشكيلة' },
  { id: 'passing', label: '🔗 التمرير' },
  { id: 'shots', label: '🎯 التسديدات' },
];

export default function MatchReport({ matchName, matchId = '3869685', isDark = true }: MatchReportProps) {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // جلب البيانات من الـ API الخاص بنا
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

  const getAvatar = (name: string) => `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`;

  if (loading) {
    return (
      <div className={`w-full max-w-6xl mx-auto my-4 p-8 rounded-3xl border flex flex-col items-center justify-center ${isDark ? 'bg-[#0a0a0a] border-emerald-900/30' : 'bg-gray-50 border-gray-200'}`}>
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className={`font-bold text-sm ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>جاري جلب بيانات StatsBomb...</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div dir="rtl" className={`relative w-full max-w-6xl mx-auto my-4 sm:my-6 rounded-2xl sm:rounded-3xl border shadow-2xl overflow-hidden font-saudi transition-all ${isDark ? 'bg-[#0a0a0a] border-emerald-900/30 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}>
      
      {/* خلفية فوتبلاي */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1D6B35]/15 via-transparent to-[#131314]/90 pointer-events-none z-0"></div>
      <div className="absolute top-3 left-3 sm:top-4 sm:left-4 opacity-30 flex items-center gap-1 z-20">
        <span className="text-emerald-500 font-black italic text-sm sm:text-lg tracking-wider">AiFBall</span>
        <span className="text-[8px] sm:text-[9px] bg-emerald-500 text-black px-1 rounded font-bold">PRO</span>
      </div>

      {/* الترويسة */}
      {!selectedPlayer && (
        <>
          <div className={`relative z-10 p-3 sm:p-6 flex flex-col sm:flex-row justify-between items-center border-b gap-3 sm:gap-0 ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
            <div className="flex sm:flex-col items-center justify-between w-full sm:w-1/3 gap-2">
              <span className="text-3xl sm:text-5xl">{data.home.logo}</span>
              <span className="font-bold text-xs sm:text-base">{data.home.name}</span>
            </div>
            <div className="flex flex-col items-center justify-center w-full sm:w-1/3 order-first sm:order-none">
              <div className={`text-3xl sm:text-6xl font-black px-4 sm:px-6 py-1 sm:py-2 rounded-xl sm:rounded-2xl border-2 shadow-inner ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'}`}>
                {data.home.score} - {data.away.score}
              </div>
              <span className="text-[9px] sm:text-xs text-gray-500 mt-1 sm:mt-2 font-bold tracking-widest">تقرير StatsBomb المتقدم</span>
            </div>
            <div className="flex sm:flex-col items-center justify-between w-full sm:w-1/3 gap-2">
              <span className="text-3xl sm:text-5xl">{data.away.logo}</span>
              <span className="font-bold text-xs sm:text-base">{data.away.name}</span>
            </div>
          </div>

          <div className={`relative z-10 flex border-b overflow-x-auto custom-scrollbar ${isDark ? 'border-white/10 bg-[#131314]/80' : 'border-gray-200 bg-gray-100'}`}>
            {tabs.map((tab) => (
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

      {/* المحتوى */}
      <div className={`relative z-10 p-3 sm:p-6 ${selectedPlayer ? 'h-auto min-h-[500px]' : 'h-[500px] sm:h-[600px] overflow-y-auto custom-scrollbar'} ${isDark ? 'bg-[#0a0a0a]/50' : 'bg-white'}`}>
        
        {/* شاشة اللاعب */}
        {selectedPlayer ? (
          <div className="animate-in slide-in-from-bottom-4 duration-300">
            <button onClick={() => setSelectedPlayer(null)} className="mb-3 sm:mb-4 flex items-center gap-1.5 text-xs sm:text-sm font-bold text-emerald-500 hover:text-emerald-400">
              ← العودة للتشكيلة
            </button>
            <div className={`p-3 sm:p-6 rounded-2xl border ${isDark ? 'bg-[#111] border-white/10' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 mb-4 sm:mb-6 border-b pb-4 border-gray-700 text-center sm:text-right">
                 <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-emerald-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]">
                   <img src={getAvatar(selectedPlayer.name)} alt={selectedPlayer.name} className="w-full h-full bg-gray-800" />
                 </div>
                 <div>
                    <h2 className="text-xl sm:text-2xl font-black">{selectedPlayer.name}</h2>
                    <p className="text-[10px] sm:text-sm text-gray-400">{selectedPlayer.pos} | {selectedPlayer.num}</p>
                 </div>
                 <div className="sm:mr-auto text-center">
                    <div className="text-2xl sm:text-3xl font-black text-emerald-400">{selectedPlayer.rating}</div>
                    <div className="text-[9px] sm:text-[10px] text-gray-500">تقييم المباراة</div>
                 </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6">
                {[
                  { label: 'المسافة المقطوعة', val: '10.5 كم' }, // StatsBomb لا يوفر هذه، نضعها كبيانات تجريبية
                  { label: 'أعلى سرعة', val: '32.4 كم/س' }, // StatsBomb لا يوفر هذه
                  { label: 'تمريرات', val: data.playersData[selectedPlayer.id]?.passes.length || 0 },
                  { label: 'تسديدات', val: data.playersData[selectedPlayer.id]?.shots.length || 0 },
                ].map((item, i) => (
                  <div key={i} className={`p-2 sm:p-3 rounded-xl border text-center ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'}`}>
                    <div className="text-sm sm:text-xl font-bold">{item.val}</div>
                    <div className="text-[9px] sm:text-xs text-gray-500 mt-0.5">{item.label}</div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {/* خريطة التسديدات */}
                <div className={`rounded-xl border p-2 bg-[#2E8B57] ${isDark ? 'border-gray-700' : 'border-emerald-600'}`}>
                  <h4 className="text-center font-bold text-[10px] sm:text-xs mb-1.5 text-white bg-black/40 py-1 rounded">أماكن التسديد</h4>
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
                        <circle 
                          key={idx} 
                          cx={shot.x} 
                          cy={shot.y} 
                          r={2 + (shot.xg * 5)} 
                          fill={shot.isGoal ? '#22c55e' : '#ef4444'} 
                          stroke="#fff" 
                          strokeWidth="0.5" 
                          opacity="0.8"
                        />
                      ))}
                    </svg>
                  </div>
                </div>

                {/* شبكة التمرير */}
                <div className={`rounded-xl border p-2 bg-[#2E8B57] ${isDark ? 'border-gray-700' : 'border-emerald-600'}`}>
                  <h4 className="text-center font-bold text-[10px] sm:text-xs mb-1.5 text-white bg-black/40 py-1 rounded">شبكة التمرير</h4>
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
                  <h4 className="text-[11px] sm:text-sm font-bold text-gray-400 mb-3 sm:mb-4">الأهداف المتوقعة (xG) - StatsBomb</h4>
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
                  <table className="w-full text-right text-[10px] sm:text-sm">
                    <thead className={`${isDark ? 'bg-black/40 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
                      <tr>
                        <th className="p-2 sm:p-3 font-bold text-center w-1/3">{data.home.name}</th>
                        <th className="p-2 sm:p-3 font-bold text-center w-1/3 text-emerald-500">الإحصائية</th>
                        <th className="p-2 sm:p-3 font-bold text-center w-1/3">{data.away.name}</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? 'divide-white/5' : 'divide-gray-200'}`}>
                      {[
                        { h: data.stats.possession.home, stat: 'الاستحواذ', a: data.stats.possession.away },
                        { h: data.stats.shots.home, stat: 'التسديدات', a: data.stats.shots.away },
                        { h: data.stats.shotsOnTarget.home, stat: 'على المرمى', a: data.stats.shotsOnTarget.away },
                        { h: data.stats.passes.home, stat: 'التمريرات', a: data.stats.passes.away },
                        { h: data.stats.passAccuracy.home, stat: 'دقة التمرير', a: data.stats.passAccuracy.away },
                        { h: data.stats.fouls.home, stat: 'الأخطاء', a: data.stats.fouls.away },
                      ].map((row, i) => (
                        <tr key={i} className={isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'}>
                          <td className="p-2 sm:p-3 text-center font-bold">{row.h}</td>
                          <td className="p-2 sm:p-3 text-center text-gray-500 font-medium">{row.stat}</td>
                          <td className="p-2 sm:p-3 text-center font-bold">{row.a}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'lineup' && (
              <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-300">
                <h3 className="text-sm sm:text-lg font-bold text-emerald-500 border-b pb-2 mb-2 sm:mb-4">التشكيلة (اضغط لعرض التحليل)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <h4 className="text-center font-bold text-xs sm:text-sm mb-2 sm:mb-3 text-yellow-500 bg-yellow-500/10 py-1.5 rounded-lg border border-yellow-500/20">{data.home.name}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {data.lineup.home.map((p: any) => (
                        <button key={p.id} onClick={() => setSelectedPlayer(p)} className={`flex items-center gap-2 p-2 rounded-xl border transition-all hover:scale-[1.02] ${isDark ? 'bg-white/5 border-white/10 hover:border-emerald-500/50' : 'bg-white border-gray-200 hover:border-emerald-500'}`}>
                          <img src={getAvatar(p.name)} alt={p.name} className="w-8 h-8 rounded-full bg-gray-800 flex-shrink-0" />
                          <div className="text-right min-w-0 flex-1">
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
                          <img src={getAvatar(p.name)} alt={p.name} className="w-8 h-8 rounded-full bg-gray-800 flex-shrink-0" />
                          <div className="text-right min-w-0 flex-1">
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

            {/* تم إزالة التبويبات الأخرى (الهجوم، الدفاع، التمرير، التسديدات) مؤقتاً لجعل الكود أنظف، 
                ويمكنك إعادتها بنفس الطريقة باستخدام المتغير data بدلاً من matchData */}
            
            {(activeTab === 'attack' || activeTab === 'defence' || activeTab === 'passing' || activeTab === 'shots') && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                 <span className="text-4xl mb-4">📊</span>
                 <h3 className="text-lg font-bold text-emerald-500 mb-2">قريباً</h3>
                 <p className="text-xs text-gray-500">هذا القسم قيد التطوير باستخدام بيانات StatsBomb الحقيقية.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
