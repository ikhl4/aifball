'use client';
import React, { useEffect, useState } from 'react';

interface TacticalPitchProps {
  team?: string;
  formation?: string;
}

export default function TacticalPitch({ team = 'الفريق التكتيكي', formation = '4-3-3' }: TacticalPitchProps) {
  const [animate, setAnimate] = useState(false);
  
  useEffect(() => {
    // تشغيل الأنيميشن والحركة التدريجية للاعبين فور تحميل المكون على الشاشة
    const timer = setTimeout(() => setAnimate(true), 150);
    return () => clearTimeout(timer);
  }, [formation]);

  const lines = formation.split('-').map(Number);
  const totalLines = lines.length;
  
  // حارس المرمى يتم وضعه في المنتصف بالخلف تلقائياً
  const players = [{ x: 50, y: 88 }];

  lines.forEach((playerCount, lineIndex) => {
    const yPosition = 72 - (lineIndex * (55 / (totalLines - 1 || 1)));
    for (let i = 0; i < playerCount; i++) {
      const xPosition = playerCount === 1 ? 50 : 15 + (i * (70 / (playerCount - 1)));
      players.push({ x: xPosition, y: yPosition });
    }
  });

  return (
    <div className="relative w-full max-w-[460px] h-[330px] bg-[#1e5e2f] border-[3px] border-white/80 rounded-2xl my-5 mx-auto shadow-2xl overflow-hidden font-sans select-none direction-ltr">
      {/* نجيلة الملعب التكتيكية (تأثير الخطوط العشبية العمودية) */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 to-transparent bg-[length:40px_100%]" />
      
      {/* خطوط تخطيط الملعب الرسمية */}
      <div className="absolute top-1/2 left-0 w-full h-[0.5px] bg-white/30" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border border-white/30 rounded-full" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-12 border border-white/20 rounded-b-xl bg-white/[0.02]" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-12 border border-white/20 rounded-t-xl bg-white/[0.02]" />

      {/* ترويسة اسم الفريق والخطة التكتيكية */}
      <div className="absolute top-3 w-full text-center text-white font-black text-base tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.7)] px-4 truncate">
        ⚽ {team}
      </div>
      <div className="absolute bottom-3 right-3 bg-black/70 border border-gray-800 text-emerald-400 px-2.5 py-1 rounded-lg text-xs font-mono font-bold shadow-md">
        FORMATION: {formation}
      </div>

      {/* طبقة انتشار اللاعبين الحركية */}
      {players.map((player, index) => (
        <div
          key={index}
          className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center transition-all duration-[1200ms] ease-out"
          style={{
            // يبدأ اللاعبون من نقطة السنتر (50% , 50%) ثم يتوزعون إلى مراكزهم الأصلية بنعومة فائقة
            left: animate ? `${player.x}%` : '50%',
            top: animate ? `${player.y}%` : '50%',
            opacity: animate ? 1 : 0,
          }}
        >
          {/* نقطة اللاعب المضيئة مع نبض خلفي دائري جذاب */}
          <div className="relative w-4 h-4 bg-yellow-400 border-2 border-slate-900 rounded-full shadow-lg flex items-center justify-center">
            <span className="absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-40 animate-ping" />
            <div className="w-1 h-1 bg-black rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
