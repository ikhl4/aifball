'use client';
import React from 'react';

interface Player {
  id: number;
  name: string;
  num: number;
  x: number; // إحداثي X (0-100)
  y: number; // إحداثي Y (0-100)
  team: 'home' | 'away';
}

export default function TacticalBoard({ homeName, awayName, players }: { homeName: string, awayName: string, players: Player[] }) {
  return (
    <div className="w-full bg-[#0B0F19] rounded-3xl p-4 sm:p-6 shadow-2xl border border-gray-800 font-saudi text-white overflow-hidden relative">
      
      {/* ترويسة اللوحة */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-blue-500 font-bold text-lg flex items-center gap-2">
          <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
          {homeName}
        </div>
        <div className="text-gray-500 font-bold text-sm">Tactical Board</div>
        <div className="text-red-500 font-bold text-lg flex items-center gap-2">
          {awayName}
          <span className="w-3 h-3 bg-red-500 rounded-full"></span>
        </div>
      </div>

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

        {/* اللاعبين */}
        {players.map((p) => (
          <div
            key={p.id}
            className={`absolute flex flex-col items-center justify-center transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer transition-transform hover:scale-110`}
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
          >
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-sm sm:text-base border-2 shadow-lg ${p.team === 'home' ? 'bg-blue-600 border-white text-white' : 'bg-red-600 border-white text-white'}`}>
              {p.num}
            </div>
            <span className="text-[8px] sm:text-[10px] font-bold mt-1 bg-black/60 px-1.5 py-0.5 rounded text-white whitespace-nowrap">
              {p.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
