'use client';
import React, { useState } from 'react';

interface MatchReportProps {
  matchName: string;
  isDark?: boolean;
}

export default function MatchReport({ matchName, isDark = true }: MatchReportProps) {
  const [activeTab, setActiveTab] = useState<'stats' | 'positions' | 'passing'>('stats');

  // بيانات تجريبية مستوحاة من التقرير الذي أرسلته (ريال مدريد 0-4 برشلونة)
  const homeTeam = { name: 'Real Madrid', logo: '🛡️', score: 0, color: '#FBBF24' };
  const awayTeam = { name: 'Barcelona', logo: '🔴', score: 4, color: '#EF4444' };

  return (
    <div dir="rtl" className={`relative w-full max-w-5xl mx-auto my-6 rounded-3xl border shadow-2xl overflow-hidden font-saudi transition-all ${isDark ? 'bg-[#0a0a0a] border-emerald-900/30 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}>
      
      {/* خلفية */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1D6B35]/15 via-transparent to-[#131314]/80 pointer-events-none z-0"></div>
      
      {/* علامة مائية */}
      <div className="absolute top-4 left-4 opacity-30 flex items-center gap-1 z-20">
        <span className="text-emerald-500 font-black italic text-lg tracking-wider">AiFBall</span>
        <span className="text-[9px] bg-emerald-500 text-black px-1 rounded font-bold">PRO</span>
      </div>

      {/* الترويسة: النتيجة */}
      <div className={`relative z-10 p-6 flex justify-between items-center border-b ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
        <div className="flex flex-col items-center gap-2 w-1/3">
          <span className="text-4xl">{homeTeam.logo}</span>
          <span className="font-bold text-sm">{homeTeam.name}</span>
        </div>
        
        <div className="flex flex-col items-center justify-center w-1/3">
          <div className={`text-4xl sm:text-5xl font-black px-4 py-2 rounded-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'}`}>
            {homeTeam.score} - {awayTeam.score}
          </div>
          <span className="text-[10px] text-gray-500 mt-2 font-bold">تقرير المباراة الشامل</span>
        </div>

        <div className="flex flex-col items-center gap-2 w-1/3">
          <span className="text-4xl">{awayTeam.logo}</span>
          <span className="font-bold text-sm">{awayTeam.name}</span>
        </div>
      </div>

      {/* التبويبات (أزرار للتنقل بين التحليلات) */}
      <div className={`relative z-10 flex border-b overflow-x-auto ${isDark ? 'border-white/10 bg-[#131314]/50' : 'border-gray-200 bg-gray-100'}`}>
        {[
          { id: 'stats', label: '📊 الإحصائيات المتقدمة' },
          { id: 'positions', label: '🏃‍♂️ التحركات ومتوسط المراكز' },
          { id: 'passing', label: '🔗 شبكة التمرير والتكتيك' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-3 px-4 text-xs sm:text-sm font-bold whitespace-nowrap transition-colors ${activeTab === tab.id ? (isDark ? 'text-emerald-400 border-b-2 border-emerald-500 bg-white/5' : 'text-emerald-700 border-b-2 border-emerald-600 bg-white') : (isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-800')}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="relative z-10 p-4 sm:p-6 h-[500px] overflow-y-auto custom-scrollbar">
        
        {/* 1. الإحصائيات */}
        {activeTab === 'stats' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* xG */}
            <div className={`p-4 rounded-2xl border flex flex-col items-center ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'}`}>
              <h4 className="text-xs font-bold text-gray-400 mb-4">الأهداف المتوقعة (xG)</h4>
              <div className="w-full max-w-md flex items-center gap-4">
                <span className="font-black text-lg text-yellow-500">0.87</span>
                <div className="flex-1 h-4 rounded-full overflow-hidden flex bg-gray-800">
                  <div className="h-full bg-yellow-500" style={{ width: '30%' }}></div>
                  <div className="h-full bg-red-500" style={{ width: '70%' }}></div>
                </div>
                <span className="font-black text-lg text-red-500">2.04</span>
              </div>
            </div>

            {/* جدول الإحصائيات */}
            <div className={`rounded-2xl border overflow-hidden ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
              <table className="w-full text-right text-xs sm:text-sm">
                <thead className={`${isDark ? 'bg-[#111] text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
                  <tr>
                    <th className="p-3 font-bold text-center">ريال مدريد</th>
                    <th className="p-3 font-bold text-center">الإحصائية</th>
                    <th className="p-3 font-bold text-center">برشلونة</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-white/5' : 'divide-gray-200'}`}>
                  {[
                    { h: '45%', stat: 'الاستحواذ', a: '55%' },
                    { h: '8', stat: 'التسديدات', a: '15' },
                    { h: '4', stat: 'على المرمى', a: '7' },
                    { h: '74%', stat: 'دقة التمرير', a: '84%' },
                    { h: '317', stat: 'التمريرات', a: '430' },
                    { h: '50%', stat: 'التحامات المكسوبة', a: '47%' },
                    { h: '15', stat: 'الأخطاء', a: '17' },
                  ].map((row, i) => (
                    <tr key={i} className={isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'}>
                      <td className="p-3 text-center font-bold">{row.h}</td>
                      <td className="p-3 text-center text-gray-500 font-medium">{row.stat}</td>
                      <td className="p-3 text-center font-bold">{row.a}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 2. التحركات (متوسط المراكز) */}
        {activeTab === 'positions' && (
          <div className="animate-in fade-in duration-300 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* ملعب ريال مدريد */}
            <div className={`rounded-2xl border p-2 ${isDark ? 'bg-[#1a472a] border-gray-700' : 'bg-green-50 border-gray-200'}`}>
              <h4 className="text-center font-bold text-xs mb-2 text-white">ريال مدريد (4-4-2)</h4>
              <svg viewBox="0 0 100 150" className="w-full h-full drop-shadow-md">
                <g stroke="rgba(255,255,255,0.3)" strokeWidth="1" fill="none">
                  <rect x="5" y="5" width="90" height="140" />
                  <line x1="5" y1="75" x2="95" y2="75" />
                  <circle cx="50" cy="75" r="15" />
                  <rect x="25" y="5" width="50" height="20" />
                  <rect x="25" y="125" width="50" height="20" />
                </g>
                {/* مراكز اللاعبين التقريبية من التقرير */}
                <circle cx="50" cy="135" r="4" fill="#FBBF24" /> {/* حارس */}
                <circle cx="30" cy="115" r="4" fill="#FBBF24" />
                <circle cx="70" cy="115" r="4" fill="#FBBF24" />
                <circle cx="40" cy="115" r="4" fill="#FBBF24" />
                <circle cx="60" cy="115" r="4" fill="#FBBF24" />
                <circle cx="20" cy="80" r="4" fill="#FBBF24" />
                <circle cx="40" cy="80" r="4" fill="#FBBF24" />
                <circle cx="60" cy="80" r="4" fill="#FBBF24" />
                <circle cx="80" cy="80" r="4" fill="#FBBF24" />
                <circle cx="40" cy="35" r="4" fill="#FBBF24" />
                <circle cx="60" cy="35" r="4" fill="#FBBF24" />
              </svg>
            </div>

            {/* ملعب برشلونة */}
            <div className={`rounded-2xl border p-2 ${isDark ? 'bg-[#1a472a] border-gray-700' : 'bg-green-50 border-gray-200'}`}>
              <h4 className="text-center font-bold text-xs mb-2 text-white">برشلونة (4-2-3-1)</h4>
              <svg viewBox="0 0 100 150" className="w-full h-full drop-shadow-md">
                <g stroke="rgba(255,255,255,0.3)" strokeWidth="1" fill="none">
                  <rect x="5" y="5" width="90" height="140" />
                  <line x1="5" y1="75" x2="95" y2="75" />
                  <circle cx="50" cy="75" r="15" />
                  <rect x="25" y="5" width="50" height="20" />
                  <rect x="25" y="125" width="50" height="20" />
                </g>
                {/* مراكز اللاعبين التقريبية */}
                <circle cx="50" cy="135" r="4" fill="#EF4444" /> {/* حارس */}
                <circle cx="20" cy="115" r="4" fill="#EF4444" />
                <circle cx="80" cy="115" r="4" fill="#EF4444" />
                <circle cx="40" cy="115" r="4" fill="#EF4444" />
                <circle cx="60" cy="115" r="4" fill="#EF4444" />
                <circle cx="40" cy="90" r="4" fill="#EF4444" />
                <circle cx="60" cy="90" r="4" fill="#EF4444" />
                <circle cx="20" cy="60" r="4" fill="#EF4444" />
                <circle cx="80" cy="60" r="4" fill="#EF4444" />
                <circle cx="50" cy="60" r="4" fill="#EF4444" />
                <circle cx="50" cy="30" r="4" fill="#EF4444" />
              </svg>
            </div>
          </div>
        )}

        {/* 3. شبكة التمرير */}
        {activeTab === 'passing' && (
          <div className="animate-in fade-in duration-300 space-y-4">
             <div className={`rounded-2xl border p-4 ${isDark ? 'bg-[#1a472a] border-gray-700' : 'bg-green-50 border-gray-200'}`}>
              <h4 className="text-center font-bold text-xs mb-2 text-white">شبكة التمرير (برشلونة)</h4>
              <svg viewBox="0 0 100 150" className="w-full h-[300px] drop-shadow-md">
                <g stroke="rgba(255,255,255,0.2)" strokeWidth="1" fill="none">
                  <rect x="5" y="5" width="90" height="140" />
                  <line x1="5" y1="75" x2="95" y2="75" />
                  <circle cx="50" cy="75" r="15" />
                  <rect x="25" y="5" width="50" height="20" />
                  <rect x="25" y="125" width="50" height="20" />
                </g>
                {/* خطوط التمرير التقريبية */}
                <g stroke="#EF4444" strokeWidth="1" opacity="0.6">
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
                {/* نقاط اللاعبين */}
                <circle cx="50" cy="135" r="5" fill="#EF4444" />
                <circle cx="40" cy="115" r="5" fill="#EF4444" />
                <circle cx="60" cy="115" r="5" fill="#EF4444" />
                <circle cx="80" cy="115" r="5" fill="#EF4444" />
                <circle cx="40" cy="90" r="5" fill="#EF4444" />
                <circle cx="60" cy="90" r="5" fill="#EF4444" />
                <circle cx="20" cy="60" r="5" fill="#EF4444" />
                <circle cx="80" cy="60" r="5" fill="#EF4444" />
                <circle cx="50" cy="60" r="5" fill="#EF4444" />
                <circle cx="50" cy="30" r="5" fill="#EF4444" />
              </svg>
              <p className="text-center text-xs text-gray-400 mt-2">حجم الدائرة يمثل عدد التمريرات</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
