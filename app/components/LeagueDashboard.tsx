'use client';
import React, { useState } from 'react';

export default function LeagueDashboard({ leagueName = 'دوري روشن السعودي', isDark = true }: { leagueName?: string, isDark?: boolean }) {
  const [activeTab, setActiveTab] = useState<'scorers' | 'assists' | 'cards' | 'matrix'>('scorers');

  // بيانات تجريبية (Mock Data) تحاكي شكل البيانات الحقيقية
  const topScorers = [
    { name: 'كريستيانو رونالدو', team: 'النصر', goals: 23, logo: '🟡' },
    { name: 'سالم الدوسري', team: 'الهلال', goals: 15, logo: '🔵' },
    { name: 'عبدالرزاق حمدالله', team: 'الاتحاد', goals: 14, logo: '🟡' },
    { name: 'ألكسندر ميتروفيتش', team: 'الهلال', goals: 14, logo: '🔵' },
    { name: 'فراس البريكان', team: 'الأهلي', goals: 12, logo: '🟢' },
  ];

  const topAssists = [
    { name: 'رياض بودبوز', team: 'ضمك', assists: 10, logo: '🔴' },
    { name: 'سالم الدوسري', team: 'الهلال', assists: 9, logo: '🔵' },
    { name: 'كريستيانو رونالدو', team: 'النصر', assists: 8, logo: '🟡' },
    { name: 'فيتينيو', team: 'الاتحاد', assists: 7, logo: '🟡' },
  ];

  const topCards = [
    { name: 'أحمد حجازي', team: 'الاتحاد', yellow: 8, red: 1, logo: '🟡' },
    { name: 'علي البليهي', team: 'الهلال', yellow: 7, red: 0, logo: '🔵' },
    { name: 'سعد الناصر', team: 'الفتح', yellow: 6, red: 1, logo: '🔵' },
  ];

  // مصفوفة الأهداف حسب الدقائق (تحاكي الجدول الكبير في صورتك الأولى)
  const goalIntervals = [
    { team: 'الهلال', i1: 5, i2: 6, i3: 4, i4: 7, i5: 3, i6: 2, i7: 1, total: 28 },
    { team: 'النصر', i1: 4, i2: 5, i3: 6, i4: 3, i5: 2, i6: 1, i7: 0, total: 21 },
    { team: 'الأهلي', i1: 3, i2: 4, i3: 3, i4: 2, i5: 2, i6: 1, i7: 1, total: 16 },
    { team: 'الاتحاد', i1: 4, i2: 2, i3: 2, i4: 3, i5: 1, i6: 1, i7: 1, total: 14 },
    { team: 'الشباب', i1: 2, i2: 3, i3: 1, i4: 2, i5: 1, i6: 0, i7: 0, total: 9 },
  ];

  return (
    <div className={`w-full max-w-5xl mx-auto my-6 rounded-3xl border shadow-2xl overflow-hidden font-saudi transition-all ${isDark ? 'bg-[#0f172a] border-gray-800 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}>
      
      {/* الترويسة */}
      <div className={`p-6 border-b flex flex-col sm:flex-row justify-between items-center gap-4 ${isDark ? 'bg-[#1e293b] border-gray-700' : 'bg-white border-gray-200'}`}>
        <div>
          <h2 className="text-2xl font-black text-emerald-500">📊 مركز إحصائيات الدوري</h2>
          <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{leagueName} - موسم 2026/2027</p>
        </div>
        <div className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${isDark ? 'bg-emerald-900/30 border-emerald-500/30 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-600'}`}>
          AiFBall Data Center
        </div>
      </div>

      {/* التبويبات */}
      <div className={`flex overflow-x-auto custom-scrollbar border-b ${isDark ? 'border-gray-700 bg-[#0f172a]' : 'border-gray-200 bg-gray-100'}`}>
        {[
          { id: 'scorers', label: '⚽ الهدافون' },
          { id: 'assists', label: '🎯 صناعة الأهداف' },
          { id: 'cards', label: '🟨 البطاقات' },
          { id: 'matrix', label: '⏱️ الأهداف حسب الدقائق' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`py-4 px-6 text-sm font-bold whitespace-nowrap transition-colors ${
              activeTab === tab.id 
                ? 'text-emerald-400 border-b-2 border-emerald-500 bg-emerald-500/5' 
                : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* المحتوى */}
      <div className="p-6">
        
        {/* 1. الهدافون */}
        {activeTab === 'scorers' && (
          <div className="space-y-3 animate-in fade-in duration-300">
            {topScorers.map((p, i) => (
              <div key={i} className={`flex items-center justify-between p-4 rounded-2xl border transition-all hover:scale-[1.01] ${isDark ? 'bg-[#1e293b]/50 border-gray-700/50 hover:border-emerald-500/50' : 'bg-white border-gray-200'}`}>
                <div className="flex items-center gap-4">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${i === 0 ? 'bg-yellow-500 text-black' : i === 1 ? 'bg-gray-300 text-black' : i === 2 ? 'bg-amber-700 text-white' : 'bg-gray-700 text-white'}`}>{i + 1}</span>
                  <div>
                    <h3 className="font-bold text-lg">{p.name}</h3>
                    <p className="text-xs text-gray-400 flex items-center gap-1">{p.logo} {p.team}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black text-emerald-500">{p.goals}</span>
                  <span className="text-xs text-gray-500 mt-2">هدف</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 2. صناعة الأهداف */}
        {activeTab === 'assists' && (
          <div className="space-y-3 animate-in fade-in duration-300">
            {topAssists.map((p, i) => (
              <div key={i} className={`flex items-center justify-between p-4 rounded-2xl border ${isDark ? 'bg-[#1e293b]/50 border-gray-700/50' : 'bg-white border-gray-200'}`}>
                <div className="flex items-center gap-4">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold bg-gray-700 text-white`}>{i + 1}</span>
                  <div>
                    <h3 className="font-bold text-lg">{p.name}</h3>
                    <p className="text-xs text-gray-400 flex items-center gap-1">{p.logo} {p.team}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black text-sky-500">{p.assists}</span>
                  <span className="text-xs text-gray-500 mt-2">صناعة</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 3. البطاقات */}
        {activeTab === 'cards' && (
          <div className="space-y-3 animate-in fade-in duration-300">
            {topCards.map((p, i) => (
              <div key={i} className={`flex items-center justify-between p-4 rounded-2xl border ${isDark ? 'bg-[#1e293b]/50 border-gray-700/50' : 'bg-white border-gray-200'}`}>
                <div className="flex items-center gap-4">
                  <div>
                    <h3 className="font-bold text-lg">{p.name}</h3>
                    <p className="text-xs text-gray-400 flex items-center gap-1">{p.logo} {p.team}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 bg-yellow-500/20 px-2 py-1 rounded text-yellow-500 font-bold">
                    <div className="w-3 h-4 bg-yellow-500 rounded-sm"></div> {p.yellow}
                  </div>
                  <div className="flex items-center gap-1 bg-red-500/20 px-2 py-1 rounded text-red-500 font-bold">
                    <div className="w-3 h-4 bg-red-500 rounded-sm"></div> {p.red}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 4. مصفوفة الأهداف حسب الدقائق (مثل الصورة) */}
        {activeTab === 'matrix' && (
          <div className="overflow-x-auto animate-in fade-in duration-300">
            <table className={`w-full text-center border-collapse text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              <thead>
                <tr className={`${isDark ? 'bg-[#1e293b]' : 'bg-gray-100'} border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                  <th className="p-3 text-right">الفريق</th>
                  <th className="p-3 text-emerald-500">1-15</th>
                  <th className="p-3 text-emerald-500">16-30</th>
                  <th className="p-3 text-emerald-500">31-45</th>
                  <th className="p-3 text-emerald-500">46-60</th>
                  <th className="p-3 text-emerald-500">61-75</th>
                  <th className="p-3 text-emerald-500">76-90</th>
                  <th className="p-3 text-emerald-500">+90</th>
                  <th className="p-3 text-white bg-emerald-600 rounded-tr-lg">المجموع</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-gray-700/50' : 'divide-gray-200'}`}>
                {goalIntervals.map((row, i) => (
                  <tr key={i} className={isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'}>
                    <td className="p-3 text-right font-bold">{row.team}</td>
                    <td className="p-3 bg-emerald-500/5">{row.i1}</td>
                    <td className="p-3 bg-emerald-500/10">{row.i2}</td>
                    <td className="p-3 bg-emerald-500/15">{row.i3}</td>
                    <td className="p-3 bg-emerald-500/10">{row.i4}</td>
                    <td className="p-3 bg-emerald-500/5">{row.i5}</td>
                    <td className="p-3">{row.i6}</td>
                    <td className="p-3">{row.i7}</td>
                    <td className="p-3 font-black text-emerald-400 bg-emerald-900/20">{row.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
}
