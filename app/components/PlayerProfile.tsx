'use client';
import React, { useState, useEffect } from 'react';

interface PlayerProfileProps {
  playerName: string;
  isDark?: boolean;
}

export default function PlayerProfile({ playerName, isDark = true }: PlayerProfileProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  // جلب البيانات من السيرفر
  useEffect(() => {
    const fetchPlayerData = async () => {
      setLoading(true);
      try {
        // هنا نطلب البيانات من الوسيط (الذي يمررها بدوره لسيرفر البايثون)
        // ملاحظة: المسار الحالي مجرد مثال، سنحتاج لتأكيد اسم المسار في main.py
        const res = await fetch(`/api/advanced?source=fbref&action=player-stats&playerName=${encodeURIComponent(playerName)}`);
        const json = await res.json();
        
        if (json.data && json.data.length > 0) {
          // نفترض أن السيرفر يرجع مصفوفة، نأخذ أول عنصر
          const playerInfo = json.data[0];
          
          setData({
            name: playerName,
            club: playerInfo.team || 'غير محدد',
            nationality: playerInfo.nation || 'غير محدد',
            height: 'غير محدد', // قد لا تتوفر في FBRef
            age: playerInfo.age || 'غير محدد',
            position: playerInfo.position || 'لاعب',
            contract: 'غير متوفر',
            season: '2026',
            league: 'الدوري',
            matchesPlayed: playerInfo.matches || '0',
            foot: playerInfo.footed || 'غير محدد',
            overall: { 
              matches: playerInfo.matches || 0, 
              goals: playerInfo.goals || 0, 
              assists: playerInfo.assists || 0, 
              cards: 0 
            },
            stats: { 
              goals: playerInfo.goals || 0, 
              xg: playerInfo.xg || '0.0', 
              assists: playerInfo.assists || 0, 
              xa: '0.0', 
              shots: playerInfo.shots || 0, 
              xg_per_shot: '0.0', 
              key_passes: 0, 
              pass_accuracy: 0, 
              duels_won: 0 
            },
            career: [
              { season: '2026', club: playerInfo.team || 'غير محدد', matches: playerInfo.matches || 0, goals: playerInfo.goals || 0, assists: playerInfo.assists || 0 }
            ]
          });
        } else {
          // إذا لم يرجع السيرفر بيانات، نعرض خطأ
          setData(null);
        }
      } catch (error) {
        console.error("فشل جلب بيانات اللاعب:", error);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayerData();
  }, [playerName]);

  // شاشة التحميل
  if (loading) {
    return (
      <div className={`w-full max-w-6xl mx-auto my-6 p-12 rounded-3xl border flex flex-col items-center justify-center ${isDark ? 'bg-[#0a0a0a] border-emerald-900/30' : 'bg-gray-50 border-gray-200'}`}>
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className={`font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>جاري جلب ملف اللاعب: {playerName}...</p>
      </div>
    );
  }

  // شاشة عدم توفر البيانات
  if (!data) {
    return (
      <div className={`w-full max-w-6xl mx-auto my-6 p-8 rounded-3xl border text-center flex flex-col items-center justify-center ${isDark ? 'bg-[#0a0a0a] border-red-900/30' : 'bg-gray-50 border-red-200'}`}>
         <p className="text-red-500 font-bold mb-2">عذراً، لم نتمكن من العثور على بيانات دقيقة لهذا اللاعب.</p>
         <p className="text-xs text-gray-500">قد يكون اسم اللاعب غير صحيح أو أن بياناته غير متوفرة في مصدرنا حالياً.</p>
      </div>
    );
  }

  // عرض بيانات اللاعب
  return (
    <div dir="rtl" className={`relative w-full max-w-6xl mx-auto my-6 rounded-3xl border shadow-2xl overflow-hidden font-saudi transition-all duration-300 ${isDark ? 'bg-[#0a0a0a] border-gray-800 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}>
      
      <div className="absolute inset-0 bg-gradient-to-br from-[#1D6B35]/15 via-transparent to-[#131314]/80 pointer-events-none z-0"></div>

      <div className="absolute top-4 left-4 opacity-30 select-none pointer-events-none flex items-center gap-1 z-20">
        <span className="text-emerald-500 font-black italic text-lg tracking-wider">AiFBall</span>
        <span className="text-[9px] bg-emerald-500 text-black px-1 rounded font-bold">PRO</span>
      </div>

      {/* الترويسة العلوية */}
      <div className={`relative z-10 p-4 sm:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b ${isDark ? 'border-white/5' : 'border-gray-200'}`}>
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="absolute inset-0 bg-[#1D6B35] rounded-full blur-md opacity-40 animate-pulse-slow"></div>
            <div className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 shadow-xl flex items-center justify-center text-4xl font-black text-emerald-500 bg-[#1a1a1a] ${isDark ? 'border-emerald-500/50' : 'border-emerald-600'}`}>
               {data.name.charAt(0)}
            </div>
          </div>
          <div>
            <h2 className={`text-3xl sm:text-4xl font-black tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>{data.name}</h2>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className={`px-3 py-1 text-xs font-bold rounded-lg backdrop-blur-md ${isDark ? 'bg-white/5 text-gray-300 border border-white/10' : 'bg-gray-200 text-gray-700'}`}>{data.club}</span>
              <span className={`px-3 py-1 text-xs font-bold rounded-lg backdrop-blur-md ${isDark ? 'bg-white/5 text-gray-300 border border-white/10' : 'bg-gray-200 text-gray-700'}`}>{data.nationality}</span>
              <span className={`px-3 py-1 text-xs font-bold rounded-lg backdrop-blur-md ${isDark ? 'bg-white/5 text-gray-300 border border-white/10' : 'bg-gray-200 text-gray-700'}`}>{data.age} سنة</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 w-full md:w-auto">
          <span className={`px-3 py-1 text-xs font-bold rounded-lg border ${isDark ? 'bg-[#1D6B35]/30 text-emerald-400 border-emerald-800/50' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>{data.position}</span>
        </div>
      </div>

      <div className="relative z-10 p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* المسيرة */}
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
                {data.career.map((row: any, idx: number) => (
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

        {/* أرقام الموسم */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span> أرقام الموسم {data.season}
            </h3>
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
            <div className={`p-3 rounded-xl border flex flex-col justify-between backdrop-blur-sm transition-all hover:-translate-y-1 ${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-gray-200 shadow-sm'}`}>
              <span className={`text-xl sm:text-2xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{data.stats.shots}</span>
              <span className="text-[10px] font-bold text-gray-500 mt-1">تسديدات</span>
            </div>
          </div>
        </div>

        {/* الملعب */}
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
