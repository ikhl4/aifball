'use client';
import React from 'react';

interface PlayerProfileProps {
  playerName: string;
  isDark?: boolean;
}

const DUMMY_DATA = {
  name: "Carlos Vinicius",
  club: "Grêmio",
  nationality: "Brazil",
  height: "190 سم",
  age: 31,
  position: "مهاجم",
  contract: "31-12-2026 (باقي شهرين)",
  season: "2026",
  league: "Serie A (BRA) - Grêmio",
  stats: {
    matches: 31,
    goals: 11,
    xg: 9.5,
    assists: 1,
    xa: 0.9,
    shots: 54,
    xg_per_shot: 0.29,
    key_passes: 27,
    pass_accuracy: 83,
    duels_won: 84,
  },
  career: [
    { season: "2026", club: "Grêmio", matches: 20, goals: 2, assists: 1 },
    { season: "2025", club: "Grêmio", matches: 12, goals: 1, assists: 1 },
    { season: "2024/2025", club: "Fulham", matches: 0, goals: 0, assists: 0 },
    { season: "2023/2024", club: "Galatasaray", matches: 2, goals: 0, assists: 0 },
    { season: "2023/2024", club: "Fulham", matches: 3, goals: 0, assists: 0 },
  ]
};

export default function PlayerProfile({ playerName, isDark = true }: PlayerProfileProps) {
  const data = DUMMY_DATA; 

  return (
    <div className={`relative w-full max-w-4xl mx-auto my-6 rounded-3xl border shadow-2xl overflow-hidden font-saudi transition-all duration-300 ${isDark ? 'bg-[#0f0f0f] border-emerald-900/30' : 'bg-white border-gray-200'}`}>
      
      {/* خلفية متدرجة بلمسة فوتبلاي */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1D6B35]/20 via-transparent to-[#131314]/90 pointer-events-none"></div>

      {/* علامة مائية للمنصة */}
      <div className="absolute top-4 left-4 opacity-30 select-none pointer-events-none flex items-center gap-1">
        <span className="text-emerald-500 font-black italic text-lg tracking-wider">AiFBall</span>
        <span className="text-[9px] bg-emerald-500 text-black px-1 rounded font-bold">PRO</span>
      </div>

      {/* الترويسة العلوية */}
      <div className={`relative z-10 p-4 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b ${isDark ? 'border-white/5' : 'border-gray-200'}`}>
        <div className="flex items-center gap-5">
          
          {/* صورة اللاعب بتأثير توهج */}
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-500 rounded-full blur-md opacity-40 animate-pulse-slow"></div>
            <div className={`relative w-24 h-24 rounded-full overflow-hidden border-2 shadow-xl ${isDark ? 'border-emerald-500/50' : 'border-emerald-600'}`}>
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos" alt={data.name} className="w-full h-full object-cover bg-[#1a1a1a]" />
            </div>
            <div className={`absolute -bottom-2 -right-2 text-xs font-black px-2 py-1 rounded-lg border shadow-lg ${isDark ? 'bg-[#131314] border-emerald-900/50 text-emerald-400' : 'bg-white border-emerald-200 text-emerald-600'}`}>
              {data.position}
            </div>
          </div>

          <div>
            <h2 className={`text-2xl sm:text-4xl font-black tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>{data.name}</h2>
            <div className="flex flex-wrap items-center gap-3 mt-3">
              <span className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg backdrop-blur-md ${isDark ? 'bg-white/5 text-gray-300 border border-white/10' : 'bg-gray-100 text-gray-700'}`}>
                🌍 {data.nationality}
              </span>
              <span className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg backdrop-blur-md ${isDark ? 'bg-white/5 text-gray-300 border border-white/10' : 'bg-gray-100 text-gray-700'}`}>
                🎂 {data.age} سنة
              </span>
              <span className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg backdrop-blur-md ${isDark ? 'bg-white/5 text-gray-300 border border-white/10' : 'bg-gray-100 text-gray-700'}`}>
                📏 {data.height}
              </span>
            </div>
          </div>
        </div>
        
        <div className="text-left md:text-right w-full md:w-auto flex flex-col md:items-end">
          <div className={`text-xl font-black px-4 py-2 rounded-xl border shadow-sm ${isDark ? 'bg-[#1D6B35] text-white border-emerald-600' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
            {data.club}
          </div>
          <div className={`text-xs mt-2 font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>ينتهي العقد: {data.contract}</div>
        </div>
      </div>

      <div className="relative z-10 p-4 sm:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* العمود الأيمن: الإحصائيات */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* الموسم الحالي (إحصائيات رئيسية) */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span> 
                أرقام الموسم {data.season}
              </h3>
              <span className={`text-xs font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{data.league}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {/* أهداف */}
              <div className={`p-4 rounded-2xl border backdrop-blur-xl transition-all hover:-translate-y-1 ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
                <div className={`text-3xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{data.stats.goals}</div>
                <div className={`text-xs font-bold mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>أهداف</div>
              </div>
              
              {/* xG */}
              <div className={`p-4 rounded-2xl border relative overflow-hidden transition-all hover:-translate-y-1 ${isDark ? 'bg-[#1D6B35]/20 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200 shadow-sm'}`}>
                <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500 blur-3xl opacity-20"></div>
                <div className={`text-3xl font-black ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{data.stats.xg}</div>
                <div className={`text-xs font-bold mt-1 ${isDark ? 'text-emerald-500/80' : 'text-emerald-700/80'}`}>xG (متوقع)</div>
              </div>

              {/* صناعة */}
              <div className={`p-4 rounded-2xl border backdrop-blur-xl transition-all hover:-translate-y-1 ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
                <div className={`text-3xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{data.stats.assists}</div>
                <div className={`text-xs font-bold mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>صناعة أهداف</div>
              </div>

              {/* xA */}
              <div className={`p-4 rounded-2xl border relative overflow-hidden transition-all hover:-translate-y-1 ${isDark ? 'bg-sky-900/20 border-sky-500/30' : 'bg-sky-50 border-sky-200 shadow-sm'}`}>
                <div className="absolute top-0 right-0 w-16 h-16 bg-sky-500 blur-3xl opacity-20"></div>
                <div className={`text-3xl font-black ${isDark ? 'text-sky-400' : 'text-sky-600'}`}>{data.stats.xa}</div>
                <div className={`text-xs font-bold mt-1 ${isDark ? 'text-sky-500/80' : 'text-sky-700/80'}`}>xA (صناعة متوقعة)</div>
              </div>
            </div>
          </div>

          {/* إحصائيات ثانوية */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
             {[
               { label: 'تسديدات', val: data.stats.shots },
               { label: 'معدل xG/تسديدة', val: data.stats.xg_per_shot },
               { label: 'تمريرات مفتاحية', val: data.stats.key_passes },
               { label: 'دقة التمرير', val: `${data.stats.pass_accuracy}%` },
               { label: 'التحامات مكسوبة', val: data.stats.duels_won },
               { label: 'مباريات', val: data.stats.matches },
             ].map((stat, i) => (
              <div key={i} className={`p-3 rounded-xl border flex flex-col justify-between ${isDark ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-200'}`}>
                <span className={`text-[11px] font-bold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{stat.label}</span>
                <span className={`text-xl font-black mt-1 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{stat.val}</span>
              </div>
             ))}
          </div>

          {/* سجل المسيرة */}
          <div>
            <h3 className={`text-sm font-bold mb-3 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>سجل المسيرة</h3>
            <div className={`rounded-2xl border overflow-hidden ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
              <table className="w-full text-right text-xs sm:text-sm">
                <thead className={`${isDark ? 'bg-white/5 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
                  <tr>
                    <th className="p-3 font-bold">الموسم</th>
                    <th className="p-3 font-bold">النادي</th>
                    <th className="p-3 font-bold text-center">لعب</th>
                    <th className="p-3 font-bold text-center text-emerald-500">أهداف</th>
                    <th className="p-3 font-bold text-center text-sky-500">صناعة</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-white/5' : 'divide-gray-200'}`}>
                  {data.career.map((row, idx) => (
                    <tr key={idx} className={isDark ? 'hover:bg-white/5 transition-colors' : 'hover:bg-gray-50'}>
                      <td className={`p-3 font-bold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{row.season}</td>
                      <td className={`p-3 font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{row.club}</td>
                      <td className={`p-3 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{row.matches}</td>
                      <td className={`p-3 text-center font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{row.goals}</td>
                      <td className={`p-3 text-center font-bold ${isDark ? 'text-sky-400' : 'text-sky-600'}`}>{row.assists}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* العمود الأيسر: خريطة المركز */}
        <div className="lg:col-span-1">
          <h3 className={`text-sm font-bold mb-3 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>خريطة التواجد</h3>
          <div className={`relative w-full aspect-[3/4] rounded-2xl overflow-hidden border shadow-inner ${isDark ? 'bg-[#0a0a0a] border-white/10' : 'bg-green-50 border-gray-200'}`}>
            
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 mix-blend-overlay"></div>

            <svg viewBox="0 0 100 150" className="w-full h-full drop-shadow-2xl relative z-10">
              <rect x="0" y="0" width="100" height="150" fill={isDark ? "transparent" : "#dcfce7"} />
              <g stroke={isDark ? "rgba(34,197,94,0.3)" : "rgba(22,163,74,0.3)"} strokeWidth="1" fill="none">
                <rect x="5" y="5" width="90" height="140" />
                <line x1="5" y1="75" x2="95" y2="75" />
                <circle cx="50" cy="75" r="15" />
                <rect x="25" y="5" width="50" height="20" />
                <rect x="35" y="5" width="30" height="8" />
                <rect x="25" y="125" width="50" height="20" />
                <rect x="35" y="137" width="30" height="8" />
              </g>
              
              {/* هالة توهج حول مركز اللاعب */}
              <circle cx="50" cy="35" r="18" fill="#22C55E" opacity="0.15" filter="blur(4px)" />
              <circle cx="50" cy="35" r="10" fill="#22C55E" opacity="0.4" />
              <circle cx="50" cy="35" r="4" fill="#ffffff" className="shadow-lg" />
            </svg>
            
            <div className="absolute bottom-4 left-0 right-0 text-center z-20">
              <span className={`inline-block px-4 py-1.5 text-xs font-black rounded-full backdrop-blur-md border ${isDark ? 'bg-[#1D6B35]/80 text-white border-emerald-500/50 shadow-[0_0_15px_rgba(34,197,94,0.4)]' : 'bg-white/90 text-emerald-800 border-emerald-200'}`}>
                {data.position}
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
