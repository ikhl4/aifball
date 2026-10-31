'use client';
import React from 'react';

interface MatchSummaryProps {
  match?: string;
  isDark?: boolean;
}

export default function MatchSummary({ 
  match = 'الهلال ضد النصر', 
  isDark = true 
}: MatchSummaryProps) {
  
  // 🌟 كود ذكي عالمي: يفصل بين الفرق بالعربية أو الإنجليزية
  let homeTeam = 'Team A';
  let awayTeam = 'Team B';
  
  if (match) {
    if (match.includes('ضد')) {
      const teams = match.split('ضد');
      homeTeam = teams[0].trim();
      awayTeam = teams[1].trim();
    } else if (match.toLowerCase().includes(' vs ')) {
      const teams = match.toLowerCase().split(' vs ');
      homeTeam = teams[0].trim();
      awayTeam = teams[1].trim();
    } else if (match.includes('-')) {
      const teams = match.split('-');
      homeTeam = teams[0].trim();
      awayTeam = teams[1].trim();
    } else {
      homeTeam = match;
    }
  }

  // بيانات تجريبية (مؤقتاً)
  const homeScore = 5;
  const awayScore = 1;

  return (
    <div 
      dir="auto" 
      className={`w-full max-w-3xl mx-auto my-6 rounded-3xl border shadow-xl overflow-hidden font-saudi transition-all ${isDark ? 'bg-[#1a1c1e] border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
    >
      
      {/* 1. الترويسة العلوية (النتيجة والفرق) */}
      <div className={`p-6 sm:p-8 text-center border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
        <div className="flex justify-between items-center max-w-lg mx-auto mb-6">
          {/* الفريق الأول */}
          <div className="flex flex-col items-center gap-2 w-1/3">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-blue-900 flex items-center justify-center border-2 border-white/20 shadow-lg">
              <span className="text-2xl">🔵</span>
            </div>
            <span className="font-bold text-sm sm:text-base text-center">{homeTeam}</span>
          </div>

          {/* النتيجة */}
          <div className="flex flex-col items-center justify-center w-1/3">
            <div className="text-5xl sm:text-7xl font-black tracking-tighter" dir="ltr">
              {homeScore} - {awayScore}
            </div>
            <span className="text-xs text-gray-500 mt-2">Full Time | نهاية المباراة</span>
          </div>

          {/* الفريق الثاني */}
          <div className="flex flex-col items-center gap-2 w-1/3">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-sky-900 flex items-center justify-center border-2 border-white/20 shadow-lg">
              <span className="text-2xl">🛡️</span>
            </div>
            <span className="font-bold text-sm sm:text-base text-center">{awayTeam}</span>
          </div>
        </div>

        {/* مسجلي الأهداف */}
        <div className="grid grid-cols-2 gap-4 text-xs sm:text-sm font-bold text-gray-400">
          <div className="text-start space-y-1" dir="auto">
            <p>⚽ Achraf Hakimi '28, '55, '69</p>
            <p>⚽ Senny Mayulu '62</p>
          </div>
          <div className="text-end space-y-1" dir="auto">
            <p>⚽ Josh Maja '18</p>
            <p>⚽ Mika Godts '26</p>
          </div>
        </div>
      </div>

      {/* 2. التبويبات (تصميم فقط) */}
      <div className={`flex justify-center gap-4 sm:gap-8 py-3 text-xs sm:text-sm font-bold border-b overflow-x-auto custom-scrollbar ${isDark ? 'bg-[#0f1115] border-gray-800 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
        <button className="text-blue-500 border-b-2 border-blue-500 pb-1">Events | أحداث</button>
        <button className="hover:text-gray-300">Lineups | التشكيلة</button>
        <button className="hover:text-gray-300">Stats | إحصائيات</button>
        <button className="hover:text-gray-300">Table | الترتيب</button>
      </div>

      {/* 3. المحتوى */}
      <div className={`p-4 sm:p-6 space-y-6 ${isDark ? 'bg-[#1a1c1e]' : 'bg-white'}`}>
        
        {/* بطاقة الخبر */}
        <div className={`flex items-center justify-between p-4 rounded-2xl border ${isDark ? 'bg-[#0f1115] border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
          <div className="flex-1" dir="auto">
            <h3 className="font-black text-sm sm:text-base leading-relaxed mb-2">{homeTeam} {homeScore}-{awayScore} {awayTeam}: Match Report</h3>
            <p className="text-xs text-gray-500 flex items-center gap-1"><span className="text-emerald-500">FotMob</span> - 1 hr ago</p>
          </div>
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-gray-700 overflow-hidden relative shrink-0">
            <div className="absolute inset-0 bg-gradient-to-tr from-black/60 to-transparent"></div>
            <span className="absolute bottom-2 right-2 text-xl">⚽</span>
          </div>
        </div>

        {/* فيديو الملخص */}
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden group cursor-pointer shadow-lg border border-gray-800">
          <img src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1200&auto=format&fit=crop" alt="Match Summary" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md border border-white/50 flex items-center justify-center transition-transform group-hover:scale-110">
              <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            </div>
          </div>
          <div className="absolute bottom-4 right-4 bg-black/80 text-white text-xs px-2 py-1 rounded">09:28</div>
          <div className="absolute top-4 left-4 bg-[#1a2a3a]/90 text-white text-xs px-3 py-1 rounded-full border border-white/10">beIN SPORTS</div>
        </div>

        {/* 🌟 قسم الرعاية والاحتمالات (نسخة عالمية) */}
        <div className="flex justify-between items-center bg-gray-800/50 p-3 rounded-xl border border-gray-700">
           <div className="flex gap-2">
             <span className="bg-gray-700 px-4 py-1.5 rounded text-xs text-gray-300 font-mono">1.29</span>
             <span className="bg-gray-700 px-4 py-1.5 rounded text-xs text-gray-300 font-mono">6.00</span>
             <span className="bg-gray-700 px-4 py-1.5 rounded text-xs text-gray-300 font-mono">9.00</span>
           </div>
           <span className="font-black text-emerald-500 italic text-lg px-2">bet365</span>
        </div>

      </div>
    </div>
  );
}
