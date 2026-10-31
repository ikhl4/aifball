'use client';
import React from 'react';

interface LeagueDashboardProps {
  leagueName?: string;
  leagueCode?: string;
  isDark?: boolean;
}

export default function LeagueDashboard({ 
  leagueName = 'دوري روشن السعودي', 
  leagueCode = 'ksa.1',
  isDark = true 
}: LeagueDashboardProps) {
  
  // بيانات تجريبية (سيتم استبدالها بالـ API لاحقاً)
  const teams = [
    { pos: 1, name: 'القادسية', played: 12, won: 9, draw: 1, lost: 2, gf: 32, ga: 12, gd: '+20', pts: 28, color: 'bg-red-600' },
    { pos: 2, name: 'النصر', played: 11, won: 9, draw: 1, lost: 1, gf: 28, ga: 11, gd: '+17', pts: 28, color: 'bg-yellow-500' },
    { pos: 3, name: 'الهلال', played: 10, won: 9, draw: 0, lost: 1, gf: 30, ga: 9, gd: '+21', pts: 27, color: 'bg-blue-600' },
    { pos: 4, name: 'الاتحاد', played: 11, won: 7, draw: 3, lost: 1, gf: 21, ga: 11, gd: '+10', pts: 24, color: 'bg-yellow-400' },
    { pos: 5, name: 'نيوم', played: 12, won: 7, draw: 1, lost: 4, gf: 18, ga: 10, gd: '+8', pts: 22, color: 'bg-green-500' },
    { pos: 6, name: 'الأهلي', played: 11, won: 7, draw: 0, lost: 4, gf: 28, ga: 19, gd: '+9', pts: 21, color: 'bg-green-600' },
    { pos: 7, name: 'الاتفاق', played: 11, won: 5, draw: 3, lost: 3, gf: 17, ga: 16, gd: '+1', pts: 18, color: 'bg-emerald-500' },
  ];

  return (
    <div dir="rtl" className={`w-full rounded-3xl border shadow-xl overflow-hidden font-saudi ${isDark ? 'bg-[#1a1c1e] border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'}`}>
      
      {/* الترويسة العلوية */}
      <div className={`p-6 text-center border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
        <h2 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2">
          <span>🏆</span> {leagueName}
        </h2>
        <p className="text-xs text-gray-500">موسم 2026/2027 - الجدول التفاعلي</p>
      </div>

      {/* التبويبات */}
      <div className={`flex justify-center gap-4 py-3 text-xs sm:text-sm font-bold border-b overflow-x-auto custom-scrollbar ${isDark ? 'bg-[#0f1115] border-gray-800 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
        <button className={`pb-1 border-b-2 ${isDark ? 'text-emerald-400 border-emerald-400' : 'text-emerald-600 border-emerald-600'}`}>جدول الترتيب</button>
        <button className="hover:text-gray-300">الهدافون</button>
        <button className="hover:text-gray-300">البطاقات</button>
        <button className="hover:text-gray-300">إحصائيات الفرق</button>
      </div>

      {/* الجدول */}
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-center text-xs sm:text-sm whitespace-nowrap">
          <thead className={`${isDark ? 'bg-[#15171a] text-gray-400' : 'bg-gray-100 text-gray-600'} border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
            <tr>
              <th className="py-3 px-2">#</th>
              <th className="py-3 px-4 text-right">الفريق</th>
              <th className="py-3 px-2">لعب</th>
              <th className="py-3 px-2 text-emerald-500">فاز</th>
              <th className="py-3 px-2 text-yellow-500">تعادل</th>
              <th className="py-3 px-2 text-red-500">خسر</th>
              <th className="py-3 px-2">له</th>
              <th className="py-3 px-2">عليه</th>
              <th className="py-3 px-2">+/-</th>
              <th className="py-3 px-2">نقاط</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDark ? 'divide-gray-800/50' : 'divide-gray-200'}`}>
            {teams.map((team) => (
              <tr key={team.pos} className={`transition-colors ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}>
                <td className={`py-3 px-2 font-bold ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{team.pos}</td>
                <td className="py-3 px-4 text-right font-bold flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full ${team.color} border border-white/20 shadow-sm`}></div>
                  {team.name}
                </td>
                <td className={`py-3 px-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{team.played}</td>
                <td className="py-3 px-2 font-bold text-emerald-500">{team.won}</td>
                <td className={`py-3 px-2 font-bold ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>{team.draw}</td>
                <td className="py-3 px-2 font-bold text-red-500">{team.lost}</td>
                <td className={`py-3 px-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{team.gf}</td>
                <td className={`py-3 px-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{team.ga}</td>
                <td className={`py-3 px-2 font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`} dir="ltr">{team.gd}</td>
                <td className="py-3 px-2">
                  <span className={`inline-block w-8 py-1 rounded-md font-bold ${isDark ? 'bg-emerald-900/50 text-emerald-400' : 'bg-emerald-100 text-emerald-700'}`}>
                    {team.pts}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
