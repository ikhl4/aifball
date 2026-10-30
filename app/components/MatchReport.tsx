'use client';
import React, { useState } from 'react';

interface MatchReportProps {
  matchName: string;
  isDark?: boolean;
}

const matchData = {
  home: { name: 'Real Madrid', logo: '🛡️', score: 0, color: '#FBBF24' },
  away: { name: 'Barcelona', logo: '🔴', score: 4, color: '#EF4444' },
  xg: { home: 0.87, away: 2.04 },
  stats: {
    possession: { home: '45%', away: '55%' },
    shots: { home: '8', away: '15' },
    shotsOnTarget: { home: '4', away: '7' },
    passes: { home: '317', away: '430' },
    passAccuracy: { home: '74%', away: '84%' },
    duelsWon: { home: '80 (50%)', away: '75 (47%)' },
    recoveries: { home: '71', away: '69' },
    interceptions: { home: '35', away: '29' },
    tackles: { home: '16', away: '15' },
    fouls: { home: '15', away: '17' },
  },
  lineup: {
    home: [
      { id: 13, name: 'Lunin', num: 13, pos: 'GK', rating: 6.5 },
      { id: 17, name: 'Vázquez', num: 17, pos: 'RB', rating: 6.8 },
      { id: 3, name: 'Militão', num: 3, pos: 'RCB', rating: 6.2 },
      { id: 22, name: 'Rüdiger', num: 22, pos: 'LCB', rating: 6.0 },
      { id: 23, name: 'Mendy', num: 23, pos: 'LB', rating: 5.5 },
      { id: 8, name: 'Valverde', num: 8, pos: 'RCM', rating: 7.0 },
      { id: 14, name: 'Tchouaméni', num: 14, pos: 'LCM', rating: 6.5 },
      { id: 5, name: 'Bellingham', num: 5, pos: 'CAM', rating: 7.5 },
      { id: 7, name: 'Vinícius Jr', num: 7, pos: 'LW', rating: 7.5 },
      { id: 9, name: 'Mbappé', num: 9, pos: 'ST', rating: 7.2 },
    ],
    away: [
      { id: 13, name: 'Peña', num: 13, pos: 'GK', rating: 7.0 },
      { id: 23, name: 'Koundé', num: 23, pos: 'RB', rating: 8.0 },
      { id: 2, name: 'Cubarsí', num: 2, pos: 'RCB', rating: 8.5 },
      { id: 5, name: 'I. Martínez', num: 5, pos: 'LCB', rating: 7.8 },
      { id: 3, name: 'Balde', num: 3, pos: 'LB', rating: 8.2 },
      { id: 17, name: 'Casadó', num: 17, pos: 'RDM', rating: 7.5 },
      { id: 8, name: 'Pedri', num: 8, pos: 'LDM', rating: 8.8 },
      { id: 19, name: 'Lamine Yamal', num: 19, pos: 'RAM', rating: 9.1 },
      { id: 16, name: 'Fermín', num: 16, pos: 'CAM', rating: 7.9 },
      { id: 11, name: 'Raphinha', num: 11, pos: 'LAM', rating: 9.8 },
      { id: 9, name: 'Lewandowski', num: 9, pos: 'ST', rating: 9.5 },
    ]
  }
};

const tabs = [
  { id: 'overview', label: '📊 النظرة العامة' },
  { id: 'attack', label: '⚔️ الهجوم' },
  { id: 'defence', label: '🛡️ الدفاع' },
  { id: 'lineup', label: '👥 التشكيلة' },
  { id: 'passing', label: '🔗 التمرير' },
  { id: 'shots', label: '🎯 التسديدات' },
];

export default function MatchReport({ matchName, isDark = true }: MatchReportProps) {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);

  const getAvatar = (name: string) => `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`;

  return (
    <div dir="rtl" className={`relative w-full max-w-6xl mx-auto my-4 sm:my-6 rounded-2xl sm:rounded-3xl border shadow-2xl overflow-hidden font-saudi transition-all ${isDark ? 'bg-[#0a0a0a] border-emerald-900/30 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}>
      
      {/* خلفية فوتبلاي */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1D6B35]/15 via-transparent to-[#131314]/90 pointer-events-none z-0"></div>
      <div className="absolute top-3 left-3 sm:top-4 sm:left-4 opacity-30 flex items-center gap-1 z-20">
        <span className="text-emerald-500 font-black italic text-sm sm:text-lg tracking-wider">AiFBall</span>
        <span className="text-[8px] sm:text-[9px] bg-emerald-500 text-black px-1 rounded font-bold">PRO</span>
      </div>

      {/* الترويسة (تختفي في وضع اللاعب) */}
      {!selectedPlayer && (
        <>
          <div className={`relative z-10 p-3 sm:p-6 flex flex-col sm:flex-row justify-between items-center border-b gap-3 sm:gap-0 ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
            <div className="flex sm:flex-col items-center justify-between w-full sm:w-1/3 gap-2">
              <span className="text-3xl sm:text-5xl">{matchData.home.logo}</span>
              <span className="font-bold text-xs sm:text-base">{matchData.home.name}</span>
            </div>
            <div className="flex flex-col items-center justify-center w-full sm:w-1/3 order-first sm:order-none">
              <div className={`text-3xl sm:text-6xl font-black px-4 sm:px-6 py-1 sm:py-2 rounded-xl sm:rounded-2xl border-2 shadow-inner ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'}`}>
                {matchData.home.score} - {matchData.away.score}
              </div>
              <span className="text-[9px] sm:text-xs text-gray-500 mt-1 sm:mt-2 font-bold tracking-widest">تقرير Wyscout المتقدم</span>
            </div>
            <div className="flex sm:flex-col items-center justify-between w-full sm:w-1/3 gap-2">
              <span className="text-3xl sm:text-5xl">{matchData.away.logo}</span>
              <span className="font-bold text-xs sm:text-base">{matchData.away.name}</span>
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
        
        {/* ===================== شاشة اللاعب ===================== */}
        {selectedPlayer ? (
          <div className="animate-in slide-in-from-bottom-4 duration-300">
            <button onClick={() => setSelectedPlayer(null)} className="mb-3 sm:mb-4 flex items-center gap-1.5 text-xs sm:text-sm font-bold text-emerald-500 hover:text-emerald-400">
              ← العودة للتشكيلة
            </button>
            <div className={`p-3 sm:p-6 rounded-2xl border ${isDark ? 'bg-[#111] border-white/10' : 'bg-gray-50 border-gray-200'}`}>
              {/* ترويسة اللاعب */}
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

              {/* إحصائيات المسافة */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6">
                {[
                  { label: 'المسافة المقطوعة', val: '10.5 كم' },
                  { label: 'أعلى سرعة', val: '32.4 كم/س' },
                  { label: 'تمريرات صحيحة', val: '45' },
                  { label: 'تسديدات', val: '4' },
                ].map((item, i) => (
                  <div key={i} className={`p-2 sm:p-3 rounded-xl border text-center ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'}`}>
                    <div className="text-sm sm:text-xl font-bold">{item.val}</div>
                    <div className="text-[9px] sm:text-xs text-gray-500 mt-0.5">{item.label}</div>
                  </div>
                ))}
              </div>

              {/* 3 ملاعب */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                {/* 1. الحرارية */}
                <div className={`rounded-xl border p-2 bg-[#2E8B57] ${isDark ? 'border-gray-700' : 'border-emerald-600'}`}>
                  <h4 className="text-center font-bold text-[10px] sm:text-xs mb-1.5 text-white bg-black/40 py-1 rounded">الخريطة الحرارية</h4>
                  <div className="aspect-[3/4] w-full max-w-[150px] mx-auto">
                    <svg viewBox="0 0 100 150" className="w-full h-full">
                      <g stroke="rgba(255,255,255,0.3)" strokeWidth="1" fill="none">
                        <rect x="5" y="5" width="90" height="140" />
                        <line x1="5" y1="75" x2="95" y2="75" />
                        <circle cx="50" cy="75" r="15" />
                        <rect x="25" y="5" width="50" height="20" />
                        <rect x="25" y="125" width="50" height="20" />
                      </g>
                      <circle cx="40" cy="40" r="20" fill="#ef4444" opacity="0.3" filter="blur(5px)" />
                      <circle cx="40" cy="40" r="10" fill="#ef4444" opacity="0.5" filter="blur(3px)" />
                      <circle cx="60" cy="60" r="15" fill="#fbbf24" opacity="0.3" filter="blur(4px)" />
                    </svg>
                  </div>
                </div>

                {/* 2. التسديدات */}
                <div className={`rounded-xl border p-2 bg-[#2E8B57] ${isDark ? 'border-gray-700' : 'border-emerald-600'}`}>
                  <h4 className="text-center font-bold text-[10px] sm:text-xs mb-1.5 text-white bg-black/40 py-1 rounded">أماكن التسديد</h4>
                  <div className="aspect-[3/4] w-full max-w-[150px] mx-auto">
                    <svg viewBox="0 0 100 150" className="w-full h-full">
                      <g stroke="rgba(255,255,255,0.3)" strokeWidth="1" fill="none">
                        <rect x="5" y="5" width="90" height="140" />
                        <line x1="5" y1="75" x2="95" y2="75" />
                        <circle cx="50" cy="75" r="15" />
                        <rect x="25" y="5" width="50" height="20" />
                        <rect x="25" y="125" width="50" height="20" />
                      </g>
                      <circle cx="50" cy="20" r="3" fill="#22c55e" stroke="#fff" strokeWidth="0.5" />
                      <circle cx="45" cy="15" r="2" fill="#ef4444" stroke="#fff" strokeWidth="0.5" />
                      <circle cx="55" cy="25" r="4" fill="#22c55e" stroke="#fff" strokeWidth="0.5" />
                      <circle cx="40" cy="30" r="2" fill="#eab308" stroke="#fff" strokeWidth="0.5" />
                    </svg>
                  </div>
                </div>

                {/* 3. التمرير */}
                <div className={`rounded-xl border p-2 bg-[#2E8B57] ${isDark ? 'border-gray-700' : 'border-emerald-600'}`}>
                  <h4 className="text-center font-bold text-[10px] sm:text-xs mb-1.5 text-white bg-black/40 py-1 rounded">شبكة التمرير</h4>
                  <div className="aspect-[3/4] w-full max-w-[150px] mx-auto">
                    <svg viewBox="0 0 100 150" className="w-full h-full">
                      <g stroke="rgba(255,255,255,0.3)" strokeWidth="1" fill="none">
                        <rect x="5" y="5" width="90" height="140" />
                        <line x1="5" y1="75" x2="95" y2="75" />
                        <circle cx="50" cy="75" r="15" />
                      </g>
                      <g stroke="#fff" strokeWidth="0.5" opacity="0.6">
                        <line x1="50" y1="130" x2="30" y2="100" />
                        <line x1="50" y1="130" x2="70" y2="100" />
                        <line x1="30" y1="100" x2="50" y2="50" />
                        <line x1="70" y1="100" x2="50" y2="50" />
                        <line x1="50" y1="50" x2="50" y2="20" />
                      </g>
                      <circle cx="50" cy="130" r="4" fill="#FBBF24" />
                      <circle cx="30" cy="100" r="4" fill="#FBBF24" />
                      <circle cx="70" cy="100" r="4" fill="#FBBF24" />
                      <circle cx="50" cy="50" r="4" fill="#FBBF24" />
                      <circle cx="50" cy="20" r="4" fill="#FBBF24" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ===================== شاشة المباراة ===================== */
          <>
            {activeTab === 'overview' && (
              <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-300">
                <div className={`p-4 sm:p-6 rounded-2xl border flex flex-col items-center ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                  <h4 className="text-[11px] sm:text-sm font-bold text-gray-400 mb-3 sm:mb-4">الأهداف المتوقعة (xG)</h4>
                  <div className="w-full max-w-2xl flex items-center gap-2 sm:gap-4">
                    <span className="font-black text-lg sm:text-2xl text-yellow-500">{matchData.xg.home}</span>
                    <div className="flex-1 h-4 sm:h-6 rounded-full overflow-hidden flex bg-gray-800 relative shadow-inner">
                      <div className="h-full bg-yellow-500" style={{ width: '30%' }}></div>
                      <div className="h-full bg-red-500" style={{ width: '70%' }}></div>
                    </div>
                    <span className="font-black text-lg sm:text-2xl text-red-500">{matchData.xg.away}</span>
                  </div>
                </div>
                
                <div className={`rounded-2xl border overflow-hidden ${isDark ? 'border-white/10 bg-[#111]' : 'border-gray-200 bg-white'}`}>
                  <table className="w-full text-right text-[10px] sm:text-sm">
                    <thead className={`${isDark ? 'bg-black/40 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
                      <tr>
                        <th className="p-2 sm:p-3 font-bold text-center w-1/3">ريال مدريد</th>
                        <th className="p-2 sm:p-3 font-bold text-center w-1/3 text-emerald-500">الإحصائية</th>
                        <th className="p-2 sm:p-3 font-bold text-center w-1/3">برشلونة</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? 'divide-white/5' : 'divide-gray-200'}`}>
                      {[
                        { h: matchData.stats.possession.home, stat: 'الاستحواذ', a: matchData.stats.possession.away },
                        { h: matchData.stats.shots.home, stat: 'التسديدات', a: matchData.stats.shots.away },
                        { h: matchData.stats.shotsOnTarget.home, stat: 'على المرمى', a: matchData.stats.shotsOnTarget.away },
                        { h: matchData.stats.passes.home, stat: 'التمريرات', a: matchData.stats.passes.away },
                        { h: matchData.stats.passAccuracy.home, stat: 'دقة التمرير', a: matchData.stats.passAccuracy.away },
                        { h: matchData.stats.fouls.home, stat: 'الأخطاء', a: matchData.stats.fouls.away },
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

            {activeTab === 'attack' && (
              <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-300">
                <h3 className="text-sm sm:text-lg font-bold text-emerald-500 border-b pb-2 mb-2 sm:mb-4">تحليل الهجمات والانتقالات</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    <div className={`p-3 sm:p-4 rounded-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'}`}>
                      <h4 className="text-xs sm:text-sm font-bold mb-2 sm:mb-3 text-gray-300">الهجمات</h4>
                      <div className="space-y-2 text-[10px] sm:text-sm">
                        <div className="flex justify-between border-b border-gray-700 pb-1"><span>إجمالي الهجمات</span> <span className="font-bold">36 vs 38</span></div>
                        <div className="flex justify-between border-b border-gray-700 pb-1"><span>هجمات مع تسديدات</span> <span className="font-bold">8 (22%) vs 15 (39%)</span></div>
                        <div className="flex justify-between border-b border-gray-700 pb-1"><span>هجمات منظمة</span> <span className="font-bold">19 vs 21</span></div>
                      </div>
                    </div>
                    <div className={`p-3 sm:p-4 rounded-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'}`}>
                      <h4 className="text-xs sm:text-sm font-bold mb-2 sm:mb-3 text-gray-300">الاختراقات</h4>
                      <div className="space-y-2 text-[10px] sm:text-sm">
                        <div className="flex justify-between border-b border-gray-700 pb-1"><span>استرجاع (عالية)</span> <span className="font-bold">10 vs 14</span></div>
                        <div className="flex justify-between border-b border-gray-700 pb-1"><span>استرجاع نصف الخصم</span> <span className="font-bold">21 vs 29</span></div>
                        <div className="flex justify-between border-b border-gray-700 pb-1"><span>فقدان الكرة</span> <span className="font-bold">39 vs 42</span></div>
                      </div>
                    </div>
                </div>
              </div>
            )}

            {activeTab === 'defence' && (
              <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-300">
                <h3 className="text-sm sm:text-lg font-bold text-emerald-500 border-b pb-2 mb-2 sm:mb-4">الصلابة الدفاعية</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    <div className={`p-3 sm:p-4 rounded-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'}`}>
                      <h4 className="text-xs sm:text-sm font-bold mb-2 sm:mb-3 text-gray-300">الالتحامات</h4>
                      <div className="space-y-2 text-[10px] sm:text-sm">
                        <div className="flex justify-between border-b border-gray-700 pb-1"><span>إجمالي الالتحامات</span> <span className="font-bold">161 vs 161</span></div>
                        <div className="flex justify-between border-b border-gray-700 pb-1"><span>مكسوبة</span> <span className="font-bold text-emerald-400">80 (50%) vs 75 (47%)</span></div>
                      </div>
                    </div>
                    <div className={`p-3 sm:p-4 rounded-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'}`}>
                      <h4 className="text-xs sm:text-sm font-bold mb-2 sm:mb-3 text-gray-300">التدخلات</h4>
                      <div className="space-y-2 text-[10px] sm:text-sm">
                        <div className="flex justify-between border-b border-gray-700 pb-1"><span>اعتراضات</span> <span className="font-bold">{matchData.stats.interceptions.home} vs {matchData.stats.interceptions.away}</span></div>
                        <div className="flex justify-between border-b border-gray-700 pb-1"><span>تشتيت</span> <span className="font-bold">9 vs 20</span></div>
                      </div>
                    </div>
                </div>
              </div>
            )}

            {/* 4. التشكيلة */}
            {activeTab === 'lineup' && (
              <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-300">
                <h3 className="text-sm sm:text-lg font-bold text-emerald-500 border-b pb-2 mb-2 sm:mb-4">التشكيلة (اضغط لعرض التحليل)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  {/* ريال مدريد */}
                  <div>
                    <h4 className="text-center font-bold text-xs sm:text-sm mb-2 sm:mb-3 text-yellow-500 bg-yellow-500/10 py-1.5 rounded-lg border border-yellow-500/20">ريال مدريد</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {matchData.lineup.home.map((p) => (
                        <button key={p.id} onClick={() => setSelectedPlayer(p)} className={`flex items-center gap-2 p-2 rounded-xl border transition-all hover:scale-[1.02] ${isDark ? 'bg-white/5 border-white/10 hover:border-emerald-500/50' : 'bg-white border-gray-200 hover:border-emerald-500'}`}>
                          <img src={getAvatar(p.name)} alt={p.name} className="w-8 h-8 rounded-full bg-gray-800 flex-shrink-0" />
                          <div className="text-right min-w-0 flex-1">
                            <div className="text-[11px] sm:text-xs font-bold truncate">{p.name}</div>
                            <div className="text-[9px] text-gray-500">{p.pos}</div>
                          </div>
                          <div className={`text-[10px] sm:text-xs font-black px-1.5 py-0.5 rounded ${p.rating >= 7 ? 'text-emerald-400 bg-emerald-900/30' : 'text-gray-400 bg-gray-800'}`}>{p.rating}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* برشلونة */}
                  <div>
                    <h4 className="text-center font-bold text-xs sm:text-sm mb-2 sm:mb-3 text-red-500 bg-red-500/10 py-1.5 rounded-lg border border-red-500/20">برشلونة</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {matchData.lineup.away.map((p) => (
                        <button key={p.id} onClick={() => setSelectedPlayer(p)} className={`flex items-center gap-2 p-2 rounded-xl border transition-all hover:scale-[1.02] ${isDark ? 'bg-white/5 border-white/10 hover:border-emerald-500/50' : 'bg-white border-gray-200 hover:border-emerald-500'}`}>
                          <img src={getAvatar(p.name)} alt={p.name} className="w-8 h-8 rounded-full bg-gray-800 flex-shrink-0" />
                          <div className="text-right min-w-0 flex-1">
                            <div className="text-[11px] sm:text-xs font-bold truncate">{p.name}</div>
                            <div className="text-[9px] text-gray-500">{p.pos}</div>
                          </div>
                          <div className={`text-[10px] sm:text-xs font-black px-1.5 py-0.5 rounded ${p.rating >= 7 ? 'text-emerald-400 bg-emerald-900/30' : 'text-gray-400 bg-gray-800'}`}>{p.rating}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'passing' && (
              <div className="space-y-4 animate-in fade-in duration-300 flex flex-col items-center">
                <h3 className="text-sm sm:text-lg font-bold text-emerald-500 border-b pb-2 mb-2 w-full">شبكة التمرير - برشلونة</h3>
                <div className={`w-full max-w-md rounded-2xl border p-3 sm:p-4 bg-[#2E8B57] ${isDark ? 'border-gray-700' : 'border-emerald-600'}`}>
                  <div className="aspect-[3/4] w-full max-w-[280px] mx-auto">
                    <svg viewBox="0 0 100 150" className="w-full h-full drop-shadow-md">
                      <g stroke="rgba(255,255,255,0.3)" strokeWidth="1" fill="none">
                        <rect x="5" y="5" width="90" height="140" />
                        <line x1="5" y1="75" x2="95" y2="75" />
                        <circle cx="50" cy="75" r="15" />
                        <rect x="25" y="5" width="50" height="20" />
                        <rect x="25" y="125" width="50" height="20" />
                      </g>
                      <g stroke="#EF4444" strokeWidth="1.5" opacity="0.7">
                        <line x1="50" y1="135" x2="40" y2="115" />
                        <line x1="40" y1="115" x2="60" y2="115" />
                        <line x1="60" y1="115" x2="80" y2="115" />
                        <line x1="40" y1="115" x2="40" y2="90" />
                        <line x1="60" y1="115" x2="60" y2="90" />
                        <line x1="40" y1="90" x2="20" y2="60" />
                        <line x1="60" y1="90" x2="80" y2="60" />
                        <line x1="40" y1="90" x2="50" y2="60" />
                        <line x1="60" y1="90" x2="50" y2="60" />
                        <line x1="50" y1="60" x2="50" y2="30" />
                      </g>
                      <g fill="#EF4444" stroke="#991B1B" strokeWidth="1">
                        <circle cx="50" cy="135" r="6" />
                        <circle cx="40" cy="115" r="7" />
                        <circle cx="60" cy="115" r="8" />
                        <circle cx="80" cy="115" r="6" />
                        <circle cx="40" cy="90" r="9" />
                        <circle cx="60" cy="90" r="7" />
                        <circle cx="20" cy="60" r="6" />
                        <circle cx="80" cy="60" r="6" />
                        <circle cx="50" cy="60" r="8" />
                        <circle cx="50" cy="30" r="5" />
                      </g>
                    </svg>
                  </div>
                  <p className="text-center text-[10px] sm:text-xs text-white/80 mt-2">حجم الدائرة يمثل عدد التمريرات</p>
                </div>
              </div>
            )}

            {activeTab === 'shots' && (
              <div className="animate-in fade-in duration-300 flex flex-col items-center">
                 <h3 className="text-sm sm:text-lg font-bold text-emerald-500 border-b pb-2 mb-3 w-full">خريطة التسديدات</h3>
                 <div className={`w-full max-w-lg rounded-2xl border p-3 sm:p-4 bg-[#1a472a] ${isDark ? 'border-gray-700' : 'border-emerald-600'}`}>
                    <svg viewBox="0 0 120 80" className="w-full drop-shadow-md">
                      <g stroke="white" strokeWidth="0.5" fill="none" opacity="0.4">
                        <rect x="0" y="0" width="120" height="80" />
                        <line x1="60" y1="0" x2="60" y2="80" />
                        <circle cx="60" cy="40" r="10" />
                        <rect x="102" y="18" width="18" height="44" />
                        <rect x="114" y="30" width="6" height="20" />
                      </g>
                      <g>
                        <circle cx="108" cy="40" r="3" fill="#FBBF24" opacity="0.8" />
                        <circle cx="102" cy="35" r="2" fill="#FBBF24" opacity="0.8" />
                      </g>
                      <g>
                        <circle cx="12" cy="40" r="3" fill="#EF4444" opacity="0.8" />
                        <circle cx="15" cy="30" r="2" fill="#EF4444" opacity="0.8" />
                      </g>
                    </svg>
                 </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
