'use client';
import React from 'react';

interface PlayerProfileProps {
  playerName: string;
  isDark?: boolean;
}

const RONALDO_DATA = {
  name: "Cristiano Ronaldo",
  club: "النصر",
  nationality: "البرتغال",
  height: "187 سم",
  age: 41,
  position: "مهاجم",
  contract: "30-06-2025",
  season: "2026",
  league: "دوري روشن",
  matchesPlayed: "31 مباراة",
  foot: "القدم اليمنى",
  overall: { matches: 1215, goals: 897, assists: 251, cards: 145 },
  stats: { goals: 35, xg: 28.4, assists: 11, xa: 7.2, shots: 142, xg_per_shot: 0.20, key_passes: 45, pass_accuracy: 82, duels_won: 65 },
  career: [
    { season: "2026", club: "النصر", matches: 31, goals: 35, assists: 11 },
    { season: "2025", club: "النصر", matches: 30, goals: 28, assists: 7 },
    { season: "2024", club: "النصر", matches: 29, goals: 26, assists: 5 },
    { season: "2023", club: "النصر", matches: 19, goals: 14, assists: 2 },
    { season: "2022", club: "مان يونايتد", matches: 16, goals: 3, assists: 2 },
  ]
};

const VINICIUS_DATA = {
  name: "Carlos Vinicius",
  club: "Grêmio",
  nationality: "Brazil",
  height: "190 سم",
  age: 31,
  position: "مهاجم",
  contract: "31-12-2026 (باقي شهرين)",
  season: "2026",
  league: "Serie A (BRA) - Grêmio",
  matchesPlayed: "31 مباراة",
  foot: "القدم اليسرى",
  overall: { matches: 315, goals: 115, assists: 24, cards: 10 },
  stats: { goals: 11, xg: 9.5, assists: 1, xa: 0.9, shots: 54, xg_per_shot: 0.29, key_passes: 27, pass_accuracy: 83, duels_won: 84 },
  career: [
    { season: "2026", club: "Grêmio", matches: 20, goals: 2, assists: 1 },
    { season: "2025", club: "Grêmio", matches: 12, goals: 1, assists: 1 },
    { season: "2024/2025", club: "Fulham", matches: 0, goals: 0, assists: 0 },
    { season: "2023/2024", club: "Galatasaray", matches: 2, goals: 0, assists: 0 },
    { season: "2023/2024", club: "Fulham", matches: 3, goals: 0, assists: 0 },
  ]
};

export default function PlayerProfile({ playerName, isDark = true }: PlayerProfileProps) {
  // فحص اسم اللاعب لاختيار البيانات المناسبة (مؤقتاً حتى ربط الـ API)
  const isRonaldo = playerName.toLowerCase().includes('رونالدو') || playerName.toLowerCase().includes('ronaldo');
  const data = isRonaldo ? RONALDO_DATA : VINICIUS_DATA;

  return (
    <div dir="rtl" className={`relative w-full max-w-6xl mx-auto my-6 rounded-3xl border shadow-2xl overflow-hidden font-saudi transition-all duration-300 ${isDark ? 'bg-[#0a0a0a] border-gray-800 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}>
      
      <div className="absolute inset-0 bg-gradient-to-br from-[#1D6B35]/15 via-transparent to-[#131314]/80 pointer-events-none z-0"></div>

      <div className="absolute top-4 left-4 opacity-30 select-none pointer-events-none flex items-center gap-1 z-20">
        <span className="text-emerald-500 font-black italic text-lg tracking-wider">AiFBall</span>
        <span className="text-[9px] bg-emerald-500 text-black px-1 rounded font-bold">PRO</span>
      </div>

      <div className={`relative z-10 p-4 sm:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b ${isDark ? 'border-white/5' : 'border-gray-200'}`}>
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="absolute inset-0 bg-[#1D6B35] rounded-full blur-md opacity-40 animate-pulse-slow"></div>
            <div className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 shadow-xl ${isDark ? 'border-emerald-500/50' : 'border-emerald-600'}`}>
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${data.name}`} alt={data.name} className="w-full h-full object-cover bg-[#1a1a1a]" />
            </div>
          </div>
          <div>
            <h2 className={`text-3xl sm:text-4xl font-black tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>{data.name}</h2>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className={`px-3 py-1 text-xs font-bold rounded-lg backdrop-blur-md ${isDark ? 'bg-white/5 text-gray-300 border border-white/10' : 'bg-gray-200 text-gray-700'}`}>{data.club}</span>
              <span className={`px-3 py-1 text-xs font-bold rounded-lg backdrop-blur-md ${isDark ? 'bg-white/5 text-gray-300 border border-white/10' : 'bg-gray-200 text-gray-700'}`}>{data.nationality}</span>
              <span className={`px-3 py-1 text-xs font-bold rounded-lg backdrop-blur-md ${isDark ? 'bg-white/5 text-gray-300 border border-white/10' : 'bg-gray-200 text-gray-700'}`}>{data.height}</span>
              <span className={`px-3 py-1 text-xs font-bold rounded-lg backdrop-blur-md ${isDark ? 'bg-white/5 text-gray-300 border border-white/10' : 'bg-gray-200 text-gray-700'}`}>{data.age} سنة</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-400">ينتهي العقد</span>
            <span className={`px-3 py-1 text-xs font-bold rounded-lg border ${isDark ? 'bg-red-900/20 text-red-400 border-red-900/50' : 'bg-red-50 text-red-600 border-red-200'}`}>{data.contract}</span>
          </div>
          <span className={`px-3 py-1 text-xs font-bold rounded-lg border ${isDark ? 'bg-[#1D6B35]/30 text-emerald-400 border-emerald-800/50' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>{data.position}</span>
        </div>
      </div>

      <div className="relative z-10 p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-4">
          <h3 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span> المسيرة
          </h3>
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'مباريات', val: data.overall.matches },
              { label: 'أهداف', val: data.overall.goals },
              { label: 'صناعة', val: data.overall.assists },
              { label: 'بطاقات', val: data.overall.cards }
            ].map((item, i) => (
              <div key={i} className={`p-2 rounded-xl border text-center flex flex-col justify-center backdrop-blur-sm transition-all hover:-translate-y-1 ${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-gray-200'}`}>
                <span className={`text-lg font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.val}</span>
                <span className="text-[9px] font-bold text-gray-500 mt-1">{item.label}</span>
              </div>
            ))}
          </div>
          <div className={`rounded-xl border overflow-hidden backdrop-blur-md ${isDark ? 'border-white/5' : 'border-gray-200'}`}>
            <table className="w-full text-right text-[11px] sm:text-xs">
              <thead className={`${isDark ? 'bg-[#131314]/80 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
                <tr>
                  <th className="p-2 font-bold">الموسم</th>
                  <th className="p-2 font-bold">النادي</th>
                  <th className="p-2 font-bold text-center">لعب</th>
                  <th className="p-2 font-bold text-center text-emerald-500">أهداف</th>
                  <th className="p-2 font-bold text-center text-sky-500">صناعة</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-white/5' : 'divide-gray-200'}`}>
                {data.career.map((row, idx) => (
                  <tr key={idx} className={isDark ? 'hover:bg-white/5 transition-colors' : 'hover:bg-gray-50'}>
                    <td className={`p-2 font-bold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{row.season}</td>
                    <td className={`p-2 font-bold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{row.club}</td>
                    <td className="p-2 text-center text-gray-500">{row.matches}</td>
                    <td className={`p-2 text-center font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{row.goals}</td>
                    <td className={`p-2 text-center font-bold ${isDark ? 'text-sky-400' : 'text-sky-600'}`}>{row.assists}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span> أرقام الموسم {data.season}
            </h3>
            <span className="text-[10px] font-bold text-gray-500 bg-white/5 px-2 py-1 rounded-md">{data.league}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
            <div className={`p-3 rounded-xl border flex flex-col justify-between backdrop-blur-sm transition-all hover:-translate-y-1 ${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-gray-200 shadow-sm'}`}>
              <span className={`text-xl sm:text-2xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{data.stats.goals}</span>
              <span className="text-[10px] font-bold text-gray-500 mt-1">أهداف</span>
            </div>
            <div className={`p-3 rounded-xl border relative overflow-hidden backdrop-blur-sm transition-all hover:-translate-y-1 ${isDark ? 'bg-[#1D6B35]/20 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200 shadow-sm'}`}>
              <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500 blur-2xl opacity-20"></div>
              <span className={`text-xl sm:text-2xl font-black ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{data.stats.xg}</span>
              <span className={`text-[10px] font-bold mt-1 ${isDark ? 'text-emerald-500/80' : 'text-emerald-700/80'}`}>xG (متوقع)</span>
            </div>
            <div className={`p-3 rounded-xl border flex flex-col justify-between backdrop-blur-sm transition-all hover:-translate-y-1 ${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-gray-200 shadow-sm'}`}>
              <span className={`text-xl sm:text-2xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{data.stats.assists}</span>
              <span className="text-[10px] font-bold text-gray-500 mt-1">صناعة</span>
            </div>
            <div className={`p-3 rounded-xl border relative overflow-hidden backdrop-blur-sm transition-all hover:-translate-y-1 ${isDark ? 'bg-sky-900/20 border-sky-500/30' : 'bg-sky-50 border-sky-200 shadow-sm'}`}>
              <div className="absolute top-0 right-0 w-16 h-16 bg-sky-500 blur-2xl opacity-20"></div>
              <span className={`text-xl sm:text-2xl font-black ${isDark ? 'text-sky-400' : 'text-sky-600'}`}>{data.stats.xa}</span>
              <span className={`text-[10px] font-bold mt-1 ${isDark ? 'text-sky-500/80' : 'text-sky-700/80'}`}>xA (صناعة متوقعة)</span>
            </div>
            <div className={`p-3 rounded-xl border flex flex-col justify-between backdrop-blur-sm transition-all hover:-translate-y-1 ${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-gray-200 shadow-sm'}`}>
              <span className={`text-xl sm:text-2xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{data.stats.shots}</span>
              <span className="text-[10px] font-bold text-gray-500 mt-1">تسديدات</span>
            </div>
            <div className={`p-3 rounded-xl border flex flex-col justify-between backdrop-blur-sm transition-all hover:-translate-y-1 ${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-gray-200 shadow-sm'}`}>
              <span className={`text-xl sm:text-2xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{data.stats.xg_per_shot}</span>
              <span className="text-[10px] font-bold text-gray-500 mt-1">xG/تسديدة</span>
            </div>
            <div className={`p-3 rounded-xl border flex flex-col justify-between backdrop-blur-sm transition-all hover:-translate-y-1 ${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-gray-200 shadow-sm'}`}>
              <span className={`text-xl sm:text-2xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{data.stats.key_passes}</span>
              <span className="text-[10px] font-bold text-gray-500 mt-1">تمريرات مفتاحية</span>
            </div>
            <div className={`p-3 rounded-xl border flex flex-col justify-between backdrop-blur-sm transition-all hover:-translate-y-1 ${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-gray-200 shadow-sm'}`}>
              <span className={`text-xl sm:text-2xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{data.stats.pass_accuracy}%</span>
              <span className="text-[10px] font-bold text-gray-500 mt-1">دقة التمرير</span>
            </div>
            <div className={`p-3 rounded-xl border flex flex-col justify-between backdrop-blur-sm transition-all hover:-translate-y-1 ${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-gray-200 shadow-sm'}`}>
              <span className={`text-xl sm:text-2xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{data.stats.duels_won}</span>
              <span className="text-[10px] font-bold text-gray-500 mt-1">التحامات مكسوبة</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-4">
          <h3 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
             <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span> المراكز والملعب
          </h3>
          <div className={`relative w-full aspect-[3/4] max-w-[200px] mx-auto rounded-xl overflow-hidden border-2 shadow-xl bg-[#1a472a] border-emerald-900/50`}>
            <svg viewBox="0 0 100 150" className="w-full h-full drop-shadow-md">
              <g stroke="rgba(255,255,255,0.3)" strokeWidth="1" fill="none">
                <rect x="5" y="5" width="90" height="140" />
                <line x1="5" y1="75" x2="95" y2="75" />
                <circle cx="50" cy="75" r="15" />
                <rect x="25" y="5" width="50" height="20" />
                <rect x="25" y="125" width="50" height="20" />
              </g>
              <circle cx="50" cy="35" r="16" fill="#22C55E" opacity="0.2" filter="blur(3px)" />
              <circle cx="50" cy="35" r="12" fill="#ef4444" opacity="0.9" />
              <text x="50" y="38" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">51</text>
            </svg>
          </div>
          <div className={`rounded-xl border p-3 flex flex-col gap-2 backdrop-blur-md ${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">مباريات</span>
              <span className={`font-bold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{data.matchesPlayed}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">القدم</span>
              <span className={`font-bold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{data.foot}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
