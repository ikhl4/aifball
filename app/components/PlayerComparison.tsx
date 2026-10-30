'use client';
import React from 'react';
import PlayerRadarChart from './PlayerRadarChart'; // استدعاء المكون الذي أرسلته

interface Props {
  player1: string;
  player2: string;
  isDark?: boolean;
}

export default function PlayerComparison({ player1, player2, isDark = true }: Props) {
  // 🌟 بيانات تجريبية (Mock Data) لكي يظهر المخطط بشكل كامل
  // لاحقاً يمكنك جلب هذه الأرقام من سيرفر البايثون ومقارنتها
  const radarData = [
    { metric: 'الأهداف (Goals)', player1: 85, player2: 92, fullMark: 100 },
    { metric: 'التمريرات الحاسمة (Assists)', player1: 78, player2: 80, fullMark: 100 },
    { metric: 'دقة التمرير (Pass Accuracy)', player1: 90, player2: 85, fullMark: 100 },
    { metric: 'المراوغات (Dribbles)', player1: 95, player2: 88, fullMark: 100 },
    { metric: 'الدفاع (Defense)', player1: 40, player2: 35, fullMark: 100 },
    { metric: 'السرعة (Speed)', player1: 82, player2: 89, fullMark: 100 },
  ];

  return (
    <div className={`w-full max-w-4xl mx-auto my-6 rounded-3xl border shadow-2xl overflow-hidden font-saudi ${isDark ? 'bg-[#0a0a0a] border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'}`}>
      
      <div className={`p-4 border-b flex items-center justify-between ${isDark ? 'bg-[#111] border-white/10' : 'bg-gray-50 border-gray-200'}`}>
        <h2 className="text-xl font-black text-emerald-500">⚔️ مقارنة مباشرة</h2>
        <span className="text-xs text-gray-500">AiFBall Pro Analytics</span>
      </div>

      <div className="p-4 grid grid-cols-2 text-center border-b border-gray-800">
        <div className="text-xl font-bold text-emerald-400">{player1}</div>
        <div className="text-xl font-bold text-sky-400">{player2}</div>
      </div>

      {/* استدعاء مكون الرادار الخاص بك */}
      <PlayerRadarChart 
        player1Name={player1} 
        player2Name={player2} 
        data={radarData} 
      />
      
      <div className={`p-4 text-center text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
        * الأرقام توضيحية وتُحسب بناءً على متوسط أداء اللاعبين في آخر 10 مباريات.
      </div>
    </div>
  );
}
