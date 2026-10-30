'use client';
import React, { useEffect, useState } from 'react';

interface Player {
  id: number;
  name: string;
  num: number;
  pos: string;
}

interface TacticalBoardProps {
  team: string;
  players: Player[];
  formation?: string;
  isAway?: boolean;
}

export default function TacticalBoard({ team, players, formation = '4-3-3', isAway = false }: TacticalBoardProps) {
  const [animate, setAnimate] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setAnimate(true), 150);
    return () => clearTimeout(timer);
  }, [players]);

  if (!players || players.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-[#0B0F19] rounded-2xl border border-gray-700 text-gray-500 text-sm">
        التشكيلة غير متوفرة للرسم التكتيكي.
      </div>
    );
  }

  // خوارزمية توزيع اللاعبين بناءً على الخطة
  const lines = formation.split('-').map(Number);
  const totalLines = lines.length;
  const positions: { x: number, y: number }[] = [];
  
  // 1. حارس المرمى
  positions.push({ x: 10, y: 50 }); 

  // 2. باقي اللاعبين
  lines.forEach((playerCount, lineIndex) => {
    const xPosition = 30 + (lineIndex * (50 / (totalLines - 1 || 1)));
    for (let i = 0; i < playerCount; i++) {
      const yPosition = playerCount === 1 ? 50 : 15 + (i * (70 / (playerCount - 1)));
      positions.push({ x: xPosition, y: yPosition });
    }
  });

  const startingPlayers = players.slice(0, 11);

  return (
    <div className="w-full bg-[#0B0F19] rounded-3xl p-4 shadow-2xl border border-gray-800 font-saudi text-white overflow-hidden relative" dir="ltr">
      
      {/* الملعب */}
      <div className="relative w-full aspect-[105/68] bg-[#1a2a1f] rounded-xl border-2 border-white/20 overflow-hidden">
        
        {/* خطوط الملعب */}
        <svg viewBox="0 0 105 68" className="absolute inset-0 w-full h-full pointer-events-none">
          <g stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" fill="none">
            <rect x="0" y="0" width="105" height="68" />
            <line x1="52.5" y1="0" x2="52.5" y2="68" />
            <circle cx="52.5" cy="34" r="9.15" />
            <circle cx="52.5" cy="34" r="0.5" fill="white" />
            {/* منطقة الجزاء اليمنى */}
            <rect x="88.5" y="13.85" width="16.5" height="40.3" />
            <rect x="99.5" y="24.85" width="5.5" height="18.3" />
            <circle cx="94" cy="34" r="0.5" fill="white" />
            {/* منطقة الجزاء اليسرى */}
            <rect x="0" y="13.85" width="16.5" height="40.3" />
            <rect x="0" y="24.85" width="5.5" height="18.3" />
            <circle cx="11" cy="34" r="0.5" fill="white" />
          </g>
        </svg>

        {/* اسم الفريق */}
        <div className="absolute top-2 left-2 bg-black/60 px-3 py-1 rounded-full text-white font-bold text-xs shadow-lg">
          {team} ({formation})
        </div>

        {/* اللاعبين */}
        {startingPlayers.map((player, index) => {
          const pos = positions[index] || { x: 50, y: 50 };
          
          // عكس الاتجاه للفريق الثاني
          const finalX = isAway ? 100 - pos.x : pos.x;
          const finalY = isAway ? 100 - pos.y : pos.y;

          // لون الدائرة (أخضر لفوتبلاي أو أزرق/أحمر حسب الفريق)
          const circleColor = isAway ? 'bg-emerald-500 border-emerald-200' : 'bg-blue-600 border-blue-200';

          return (
            <div
              key={player.id || index}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center transition-all duration-1000 ease-out z-10"
              style={{
                left: animate ? `${finalX}%` : '50%',
                top: animate ? `${finalY}%` : '50%',
                opacity: animate ? 1 : 0,
              }}
            >
              {/* الدائرة */}
              <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full ${circleColor} border-2 flex items-center justify-center shadow-lg relative`}>
                <span className="text-white font-bold text-xs">{player.num}</span>
                <span className={`absolute inset-0 rounded-full border animate-ping opacity-20 ${isAway ? 'border-emerald-400' : 'border-blue-400'}`}></span>
              </div>
              
              {/* اسم اللاعب */}
              <div className="bg-black/80 px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] text-white font-bold whitespace-nowrap mt-1 border border-gray-700 max-w-[70px] truncate">
                {player.name.split(' ')[0]}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
