'use client';
import React, { useState } from 'react';

// واجهة لبيانات التسديدة (متوافقة مع StatsBomb)
interface ShotData {
  id: string;
  player: string;
  team: string;
  x: number; // من 0 إلى 120
  y: number; // من 0 إلى 80
  xg: number; // الأهداف المتوقعة (0.01 إلى 0.99)
  outcome: 'Goal' | 'Saved' | 'Off Target' | 'Blocked';
}

interface ShotMapProps {
  matchName?: string;
  isDark?: boolean;
}

// بيانات تجريبية (محاكاة لبيانات StatsBomb - نهائي كأس العالم 2022)
const SAMPLE_SHOTS: ShotData[] = [
  { id: '1', player: 'Lionel Messi', team: 'Argentina', x: 108, y: 40, xg: 0.78, outcome: 'Goal' }, // ركلة جزاء
  { id: '2', player: 'Lionel Messi', team: 'Argentina', x: 102, y: 35, xg: 0.25, outcome: 'Goal' },
  { id: '3', player: 'Angel Di Maria', team: 'Argentina', x: 105, y: 42, xg: 0.45, outcome: 'Goal' },
  { id: '4', player: 'Kylian Mbappe', team: 'France', x: 106, y: 48, xg: 0.65, outcome: 'Goal' }, // ركلة جزاء
  { id: '5', player: 'Kylian Mbappe', team: 'France', x: 98, y: 50, xg: 0.15, outcome: 'Goal' },
  { id: '6', player: 'Kylian Mbappe', team: 'France', x: 95, y: 38, xg: 0.12, outcome: 'Goal' },
  { id: '7', player: 'Lionel Messi', team: 'Argentina', x: 110, y: 30, xg: 0.08, outcome: 'Saved' },
  { id: '8', player: 'Kylian Mbappe', team: 'France', x: 100, y: 45, xg: 0.05, outcome: 'Blocked' },
  { id: '9', player: 'Antoine Griezmann', team: 'France', x: 90, y: 35, xg: 0.03, outcome: 'Off Target' },
];

export default function ShotMap({ matchName = "نهائي كأس العالم 2022", isDark = true }: ShotMapProps) {
  const [hoveredShot, setHoveredShot] = useState<ShotData | null>(null);

  return (
    <div className={`w-full max-w-3xl mx-auto my-6 rounded-2xl border shadow-2xl overflow-hidden ${isDark ? 'bg-[#131a2a] border-gray-800' : 'bg-white border-gray-200'}`}>
      
      {/* الترويسة */}
      <div className={`px-4 py-3 border-b flex items-center justify-between ${isDark ? 'bg-emerald-950/40 border-gray-800' : 'bg-emerald-50 border-gray-200'}`}>
        <span className={`font-bold text-sm flex items-center gap-2 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
          <span>🎯</span> خريطة التسديدات والأهداف المتوقعة (xG)
        </span>
        <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
          {matchName}
        </span>
      </div>

      {/* الملعب */}
      <div className="relative w-full aspect-[120/80] p-2 sm:p-4">
        <svg viewBox="0 0 120 80" className="w-full h-full drop-shadow-lg">
          {/* أرضية الملعب */}
          <rect x="0" y="0" width="120" height="80" fill={isDark ? "#1a472a" : "#2E8B57"} rx="2" />
          
          {/* خطوط الملعب */}
          <g stroke="white" strokeWidth="0.4" fill="none" opacity="0.6">
            {/* الخطوط الخارجية */}
            <rect x="0" y="0" width="120" height="80" />
            {/* خط منتصف الملعب */}
            <line x1="60" y1="0" x2="60" y2="80" />
            {/* دائرة المنتصف */}
            <circle cx="60" cy="40" r="10" />
            <circle cx="60" cy="40" r="0.8" fill="white" />
            
            {/* منطقة الجزاء (اليمين) */}
            <rect x="102" y="18" width="18" height="44" />
            <rect x="114" y="30" width="6" height="20" />
            {/* نقطة الجزاء */}
            <circle cx="108" cy="40" r="0.6" fill="white" />
            {/* قوس منطقة الجزاء */}
            <path d="M 102 30 A 10 10 0 0 1 102 50" />

            {/* منطقة الجزاء (اليسار) */}
            <rect x="0" y="18" width="18" height="44" />
            <rect x="0" y="30" width="6" height="20" />
            <circle cx="12" cy="40" r="0.6" fill="white" />
            <path d="M 18 30 A 10 10 0 0 0 18 50" />
            
            {/* المرمى */}
            <rect x="120" y="36" width="1.5" height="8" fill="white" opacity="0.8" />
            <rect x="-1.5" y="36" width="1.5" height="8" fill="white" opacity="0.8" />
          </g>

          {/* رسم التسديدات */}
          {SAMPLE_SHOTS.map((shot) => {
            // حساب حجم الدائرة بناءً على قيمة xG
            const radius = 1.5 + (shot.xg * 4); 
            
            let fillColor = '#ef4444'; // Off Target (أحمر)
            if (shot.outcome === 'Goal') fillColor = '#22c55e'; // Goal (أخضر)
            else if (shot.outcome === 'Saved') fillColor = '#eab308'; // Saved (أصفر)
            else if (shot.outcome === 'Blocked') fillColor = '#6b7280'; // Blocked (رمادي)

            return (
              <g 
                key={shot.id} 
                onMouseEnter={() => setHoveredShot(shot)}
                onMouseLeave={() => setHoveredShot(null)}
                className="cursor-pointer transition-all duration-300 hover:opacity-80"
              >
                {/* دائرة التسديدة */}
                <circle 
                  cx={shot.x} 
                  cy={shot.y} 
                  r={radius} 
                  fill={fillColor} 
                  fillOpacity="0.7" 
                  stroke={isDark ? 'white' : 'black'} 
                  strokeWidth="0.3" 
                />
                {/* نقطة صغيرة في المنتصف */}
                <circle cx={shot.x} cy={shot.y} r="0.4" fill="white" />
              </g>
            );
          })}
        </svg>

        {/* نافذة منبثقة (Tooltip) تظهر عند تمرير الماوس */}
        {hoveredShot && (
          <div 
            className="absolute z-10 bg-black/90 text-white text-xs rounded-lg p-2.5 border border-gray-600 shadow-xl pointer-events-none transform -translate-x-1/2 -translate-y-full"
            style={{ left: `${(hoveredShot.x / 120) * 100}%`, top: `${(hoveredShot.y / 80) * 100 - 2}%` }}
          >
            <div className="font-bold text-emerald-400 mb-1">{hoveredShot.player}</div>
            <div className="flex justify-between gap-4">
              <span>الفريق:</span> <span className="text-gray-300">{hoveredShot.team}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span>الأهداف المتوقعة (xG):</span> <span className="text-yellow-400 font-bold">{hoveredShot.xg.toFixed(2)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span>النتيجة:</span> 
              <span className={hoveredShot.outcome === 'Goal' ? 'text-green-400' : 'text-red-400'}>
                {hoveredShot.outcome === 'Goal' ? 'هدف ⚽' : hoveredShot.outcome === 'Saved' ? 'تصدى لها الحارس 🧤' : hoveredShot.outcome === 'Blocked' ? 'اعتراض مدافع 🛡️' : 'خارج المرمى ❌'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* المفتاح (Legend) */}
      <div className={`px-4 py-2 text-xs flex flex-wrap gap-4 border-t ${isDark ? 'bg-[#0f1420] border-gray-800 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-green-500 opacity-80"></span> هدف</div>
        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-yellow-500 opacity-80"></span> تصدي</div>
        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-gray-500 opacity-80"></span> اعتراض</div>
        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500 opacity-80"></span> خارج</div>
        <span className="mr-auto opacity-70">* حجم الدائرة يمثل قيمة xG</span>
      </div>
    </div>
  );
}
