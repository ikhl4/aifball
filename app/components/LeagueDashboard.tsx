'use client';
import React, { useState, useEffect } from 'react';

interface TeamStats {
  id: number;
  rank: number;
  name: string;
  logo: string; // سنستخدم إيموجي أو حرف كبديل مؤقت
  p: number; // لعب
  w: number; // فاز
  d: number; // تعادل
  l: number; // خسر
  gf: number; // له
  ga: number; // عليه
  gd: number; // الفارق
  pts: number; // النقاط
  xg?: number;
  xga?: number;
  xpts?: number;
  color?: 'green' | 'blue' | 'red' | 'none'; // لون الشريط الجانبي
}

export default function LeagueDashboard({ leagueName = 'دوري روشن السعودي', leagueCode = 'ksa.1', isDark = true }: { leagueName?: string, leagueCode?: string, isDark?: boolean }) {
  const [activeTab, setActiveTab] = useState<'overall' | 'home' | 'away' | 'xg'>('overall');
  const [loading, setLoading] = useState(false);

  // بيانات تجريبية للدوري السعودي
  const ksaData: Record<string, TeamStats[]> = {
    overall: [
      { id: 1, rank: 1, name: 'الهلال', logo: '🔵', p: 21, w: 18, d: 3, l: 0, gf: 58, ga: 12, gd: 46, pts: 57, color: 'green' },
      { id: 2, rank: 2, name: 'النصر', logo: '🟡', p: 21, w: 16, d: 2, l: 3, gf: 52, ga: 21, gd: 31, pts: 50, color: 'green' },
      { id: 3, rank: 3, name: 'الأهلي', logo: '🟢', p: 21, w: 13, d: 5, l: 3, gf: 41, ga: 22, gd: 19, pts: 44, color: 'blue' },
      { id: 4, rank: 4, name: 'الاتحاد', logo: '🟡', p: 21, w: 11, d: 5, l: 5, gf: 38, ga: 26, gd: 12, pts: 38, color: 'blue' },
      { id: 5, rank: 5, name: 'التعاون', logo: '🟡', p: 21, w: 9, d: 6, l: 6, gf: 30, ga: 24, gd: 6, pts: 33, color: 'none' },
      { id: 6, rank: 6, name: 'الفتح', logo: '🔵', p: 21, w: 8, d: 5, l: 8, gf: 28, ga: 29, gd: -1, pts: 29, color: 'none' },
      { id: 7, rank: 7, name: 'الشباب', logo: '⚪', p: 21, w: 7, d: 6, l: 8, gf: 25, ga: 28, gd: -3, pts: 27, color: 'none' },
      { id: 8, rank: 8, name: 'ضمك', logo: '🔴', p: 21, w: 6, d: 6, l: 9, gf: 22, ga: 30, gd: -8, pts: 24, color: 'none' },
      { id: 9, rank: 9, name: 'الفيحاء', logo: '🔴', p: 21, w: 5, d: 5, l: 11, gf: 20, ga: 35, gd: -15, pts: 20, color: 'none' },
      { id: 10, rank: 10, name: 'الرياض', logo: '🔴', p: 21, w: 3, d: 4, l: 14, gf: 15, ga: 42, gd: -27, pts: 13, color: 'red' },
    ],
    home: [], // سنستخدم نفس البيانات للتبسيط
    away: [],
    xg: [
      { id: 1, rank: 1, name: 'الهلال', logo: '🔵', p: 21, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 57, xg: 45.2, xga: 15.1, xpts: 54, color: 'green' },
      { id: 2, rank: 2, name: 'النصر', logo: '🟡', p: 21, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 50, xg: 42.8, xga: 20.3, xpts: 48, color: 'green' },
      { id: 3, rank: 3, name: 'الأهلي', logo: '🟢', p: 21, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 44, xg: 35.1, xga: 22.4, xpts: 41, color: 'blue' },
      { id: 4, rank: 4, name: 'الاتحاد', logo: '🟡', p: 21, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 38, xg: 30.5, xga: 25.8, xpts: 36, color: 'blue' },
    ]
  };

  // دالة لجلب اللون المناسب للشريط الجانبي
  const getBarColor = (color?: string) => {
    switch (color) {
      case 'green': return 'bg-emerald-500';
      case 'blue': return 'bg-blue-500';
      case 'red': return 'bg-red-500';
      default: return 'bg-transparent';
    }
  };

  const dataToUse = activeTab === 'xg' ? ksaData.xg : ksaData.overall;

  return (
    <div className={`w-full max-w-5xl mx-auto my-6 rounded-3xl border shadow-2xl overflow-hidden font-saudi transition-all ${isDark ? 'bg-[#0f172a] border-gray-800 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}>
      
      {/* الترويسة العلوية */}
      <div className={`p-4 sm:p-6 border-b flex flex-col sm:flex-row justify-between items-center gap-4 ${isDark ? 'bg-[#1e293b] border-gray-700' : 'bg-white border-gray-200'}`}>
        <div>
          <h2 className="text-2xl font-black text-emerald-500 flex items-center gap-2">
            <span className="text-3xl">🏆</span> جدول الترتيب
          </h2>
          <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{leagueName} - موسم 2026/2027</p>
        </div>
        <div className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${isDark ? 'bg-emerald-900/30 border-emerald-500/30 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-600'}`}>
          AiFBall Data Center
        </div>
      </div>

      {/* التبويبات الداخلية (الكل، داخل الأرض، خارج الأرض، xG) */}
      <div className={`flex overflow-x-auto custom-scrollbar border-b ${isDark ? 'border-gray-700 bg-[#0f172a]' : 'border-gray-200 bg-gray-100'}`}>
        {[
          { id: 'overall', label: 'الجدول الإجمالي' },
          { id: 'home', label: 'داخل الأرض' },
          { id: 'away', label: 'خارج الأرض' },
          { id: 'xg', label: 'إحصائيات xG' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`py-3 px-4 sm:px-6 text-xs sm:text-sm font-bold whitespace-nowrap transition-colors ${
              activeTab === tab.id 
                ? 'text-emerald-400 border-b-2 border-emerald-500 bg-emerald-500/5' 
                : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* الجدول */}
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-center text-xs sm:text-sm min-w-[700px]">
          
          {/* رأس الجدول (يتغير حسب التبويب) */}
          <thead className={`${isDark ? 'bg-[#1e293b] text-gray-400' : 'bg-gray-100 text-gray-600'} border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <tr>
              <th className="py-3 px-2 text-right w-12">#</th>
              <th className="py-3 px-2 text-right min-w-[150px]">الفريق</th>
              <th className="py-3 px-2">لعب</th>
              
              {activeTab !== 'xg' ? (
                <>
                  <th className="py-3 px-2 text-emerald-500">فاز</th>
                  <th className="py-3 px-2 text-yellow-500">تعادل</th>
                  <th className="py-3 px-2 text-red-500">خسر</th>
                  <th className="py-3 px-2">له</th>
                  <th className="py-3 px-2">عليه</th>
                  <th className="py-3 px-2">+/-</th>
                  <th className="py-3 px-2 font-black text-white">النقاط</th>
                </>
              ) : (
                <>
                  <th className="py-3 px-2 text-sky-400">xG</th>
                  <th className="py-3 px-2 text-red-400">xGA</th>
                  <th className="py-3 px-2 text-emerald-400">xPTS</th>
                  <th className="py-3 px-2 font-black text-white">النقاط الفعلية</th>
                </>
              )}
            </tr>
          </thead>

          {/* جسم الجدول */}
          <tbody className={`divide-y ${isDark ? 'divide-gray-800/50' : 'divide-gray-200'}`}>
            {dataToUse.map((team, idx) => (
              <tr key={team.id} className={`transition-colors group ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}>
                
                {/* شريط اللون والترتيب */}
                <td className="relative py-3 px-2 text-right font-bold">
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${getBarColor(team.color)}`}></div>
                  {team.rank}
                </td>

                {/* الفريق والشعار */}
                <td className="py-3 px-2 text-right font-bold flex items-center gap-2">
                  <span className="text-lg">{team.logo}</span> 
                  <span className={`${isDark ? 'text-gray-100' : 'text-gray-900'} group-hover:text-emerald-400 transition-colors`}>{team.name}</span>
                </td>

                <td className="py-3 px-2 text-gray-400 font-medium">{team.p}</td>

                {/* إحصائيات الجدول العادي */}
                {activeTab !== 'xg' ? (
                  <>
                    <td className="py-3 px-2 font-bold text-emerald-400">{team.w}</td>
                    <td className="py-3 px-2 font-bold text-yellow-400">{team.d}</td>
                    <td className="py-3 px-2 font-bold text-red-400">{team.l}</td>
                    <td className="py-3 px-2 text-gray-400">{team.gf}</td>
                    <td className="py-3 px-2 text-gray-400">{team.ga}</td>
                    <td className={`py-3 px-2 font-bold ${team.gd > 0 ? 'text-emerald-500' : team.gd < 0 ? 'text-red-500' : 'text-gray-400'}`}>{team.gd > 0 ? `+${team.gd}` : team.gd}</td>
                    <td className={`py-3 px-2 font-black text-base ${isDark ? 'text-white' : 'text-black'}`}>{team.pts}</td>
                  </>
                ) : (
                  <>
                    <td className="py-3 px-2 font-bold text-sky-400">{team.xg?.toFixed(1)}</td>
                    <td className="py-3 px-2 font-bold text-red-400">{team.xga?.toFixed(1)}</td>
                    <td className="py-3 px-2 font-bold text-emerald-400">{team.xpts}</td>
                    <td className={`py-3 px-2 font-black text-base ${isDark ? 'text-white' : 'text-black'}`}>{team.pts}</td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* مفتاح الألوان أسفل الجدول */}
      <div className={`p-4 flex flex-wrap gap-4 text-xs border-t ${isDark ? 'border-gray-800 bg-[#0f172a] text-gray-400' : 'border-gray-200 bg-gray-50 text-gray-500'}`}>
        <div className="flex items-center gap-1.5"><div className="w-2 h-4 bg-emerald-500 rounded-sm"></div> دوري أبطال آسيا للنخبة</div>
        <div className="flex items-center gap-1.5"><div className="w-2 h-4 bg-blue-500 rounded-sm"></div> دوري أبطال آسيا 2</div>
        <div className="flex items-center gap-1.5"><div className="w-2 h-4 bg-red-500 rounded-sm"></div> منطقة الهبوط</div>
      </div>

    </div>
  );
}
