// components/TacticalPitch.js
import React from 'react';

export default function TacticalPitch({ team = 'الفريق', formation = '4-3-3' }) {
  const lines = formation.split('-').map(Number);
  const totalLines = lines.length;

  // حارس المرمى دائماً في المنتصف والخلف
  const players = [{ x: 50, y: 90 }];

  // حساب توزيع بقية الخطوط التكتيكية
  lines.forEach((playerCount, lineIndex) => {
    const yPosition = 75 - (lineIndex * (60 / (totalLines - 1 || 1)));
    
    for (let i = 0; i < playerCount; i++) {
      const xPosition = playerCount === 1 ? 50 : 15 + (i * (70 / (playerCount - 1)));
      players.push({ x: xPosition, y: yPosition });
    }
  });

  return (
    <div className="relative w-full max-w-[450px] h-[320px] bg-green-700 border-4 border-white rounded-xl my-5 mx-auto shadow-2xl overflow-hidden font-sans select-none direction-ltr">
      {/* خط المنتصف والدائرة */}
      <div className="absolute top-1/2 left-0 w-full h-[2px] bg-white/40" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 border-2 border-white/40 rounded-full" />
      
      {/* اسم الفريق والخطة */}
      <div className="absolute top-3 w-full text-center text-white font-bold text-lg drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
        {team}
      </div>
      <div className="absolute bottom-3 right-3 bg-black/60 text-white px-3 py-1 rounded text-xs font-mono">
        خطة: {formation}
      </div>

      {/* توزيع اللاعبين */}
      {players.map((player, index) => (
        <div
          key={index}
          className="absolute w-4 h-4 bg-yellow-400 border-2 border-black rounded-full -translate-x-1/2 -translate-y-1/2 shadow-md transition-all duration-500"
          style={{ left: `${player.x}%`, top: `${player.y}%` }}
        />
      ))}
    </div>
  );
}
