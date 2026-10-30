'use client';
import ShotMap, { ShotData } from './ShotMap';

// واجهة لبيانات التسديدة (متوافقة مع StatsBomb والتصميم الخاص بك)
export interface ShotData {
  id: string;
  player: string;
  team: string;
  x: number; // من 0 إلى 120
  y: number; // من 0 إلى 80
  xg: number; // الأهداف المتوقعة
  outcome: 'Goal' | 'Saved' | 'Off Target' | 'Blocked';
}

interface ShotMapProps {
  matchName?: string;
  isDark?: boolean;
  shots?: ShotData[]; // جعلنا البيانات الحية تأتي من الخارج (اختياري)
}

// بيانات تجريبية (تظهر فقط إذا لم يتم تمرير بيانات حية)
const SAMPLE_SHOTS: ShotData[] = [
  { id: '1', player: 'Lionel Messi', team: 'Argentina', x: 108, y: 40, xg: 0.78, outcome: 'Goal' },
  { id: '2', player: 'Kylian Mbappe', team: 'France', x: 106, y: 48, xg: 0.65, outcome: 'Goal' },
];

export default function ShotMap({ matchName = "خريطة التسديدات", isDark = true, shots }: ShotMapProps) {
  const [hoveredShot, setHoveredShot] = useState<ShotData | null>(null);
  
  // استخدام البيانات الحية إن وجدت، وإلا استخدام التجريبية
  const displayShots = shots && shots.length > 0 ? shots : SAMPLE_SHOTS;

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
            <rect x="0" y="0" width="120" height="80" />
            <line x1="60" y1="0" x2="60" y2="80" />
            <circle cx="60" cy="40" r="10" />
            <circle cx="60" cy="40" r="0.8" fill="white" />
            
            {/* منطقة الجزاء (اليمين) */}
            <rect x="102" y="18" width="18" height="44" />
            <rect x="114" y="30" width="6" height="20" />
            <circle cx="108" cy="40" r="0.6" fill="white" />
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
          {displayShots.map((shot, idx) => {
            // حساب حجم الدائرة بناءً على قيمة xG
            const radius = 1.5 + (shot.xg * 4); 
            
            let fillColor = '#ef4444'; // Off Target (أحمر)
            if (shot.outcome === 'Goal') fillColor = '#22c55e'; // Goal (أخضر)
            else if (shot.outcome === 'Saved') fillColor = '#eab308'; // Saved (أصفر)
            else if (shot.outcome === 'Blocked') fillColor = '#6b7280'; // Blocked (رمادي)

            return (
              <g 
                key={shot.id || idx} 
                onMouseEnter={() => setHoveredShot(shot)}
                onMouseLeave={() => setHoveredShot(null)}
                className="cursor-pointer transition-all duration-300 hover:opacity-80"
              >
                <circle 
                  cx={shot.x} 
                  cy={shot.y} 
                  r={radius} 
                  fill={fillColor} 
                  fillOpacity="0.7" 
                  stroke={isDark ? 'white' : 'black'} 
                  strokeWidth="0.3" 
                />
                <circle cx={shot.x} cy={shot.y} r="0.4" fill="white" />
              </g>
            );
          })}
        </svg>

        {/* نافذة منبثقة (Tooltip) */}
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
      </div>
    </div>
  );
}
