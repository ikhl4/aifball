'use client';
import React, { useState } from 'react';

interface TrainingDrillProps {
  drillName: string;
  isDark?: boolean;
}

export default function TrainingDrillWidget({ drillName, isDark = true }: TrainingDrillProps) {
  const [activeTab, setActiveTab] = useState<'board' | 'video'>('board');

  // رابط بحث يوتيوب للتمرين
  const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(drillName + ' football training drill')}`;

  return (
    <div className={`w-full max-w-4xl mx-auto my-6 rounded-3xl border shadow-2xl overflow-hidden font-saudi transition-all ${isDark ? 'bg-[#111] border-emerald-900/30 text-white' : 'bg-white border-gray-200 text-gray-900'}`}>
      
      {/* الترويسة */}
      <div className={`p-4 sm:p-6 border-b flex items-center justify-between ${isDark ? 'bg-gradient-to-r from-[#1D6B35]/20 to-transparent border-white/10' : 'bg-gradient-to-r from-emerald-50 to-transparent border-gray-200'}`}>
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-emerald-500">🏃‍♂️ تمرين: {drillName}</h2>
          <p className="text-xs text-gray-500 mt-1">لوحة تكتيكية تفاعلية للمدربين والمحللين</p>
        </div>
        <div className="flex bg-black/20 rounded-xl p-1">
          <button onClick={() => setActiveTab('board')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${activeTab === 'board' ? 'bg-emerald-600 text-white' : 'text-gray-400'}`}>اللوحة</button>
          <button onClick={() => setActiveTab('video')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${activeTab === 'video' ? 'bg-emerald-600 text-white' : 'text-gray-400'}`}>فيديو</button>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        {activeTab === 'board' ? (
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-emerald-500/30 bg-[#2E8B57]">
            {/* رسم الملعب */}
            <svg viewBox="0 0 120 80" className="w-full h-full">
              <g stroke="rgba(255,255,255,0.4)" strokeWidth="0.5" fill="none">
                <rect x="0" y="0" width="120" height="80" />
                <line x1="60" y1="0" x2="60" y2="80" />
                <circle cx="60" cy="40" r="10" />
                <rect x="102" y="18" width="18" height="44" />
                <rect x="0" y="18" width="18" height="44" />
              </g>
              
              {/* تصميم تخيلي لتمرين الروندو (مربع ودوائر) */}
              <rect x="40" y="25" width="40" height="30" fill="none" stroke="#FBBF24" strokeWidth="1" strokeDasharray="2,2" />
              
              {/* اللاعبين (دوائر حمراء) */}
              <circle cx="45" cy="30" r="3" fill="#ef4444" />
              <circle cx="75" cy="30" r="3" fill="#ef4444" />
              <circle cx="45" cy="50" r="3" fill="#ef4444" />
              <circle cx="75" cy="50" r="3" fill="#ef4444" />
              
              {/* المدافع (دائرة زرقاء) */}
              <circle cx="60" cy="40" r="3" fill="#3b82f6" />

              {/* أسهم التمرير */}
              <path d="M 45 30 Q 60 25 75 30" fill="none" stroke="#FBBF24" strokeWidth="1" markerEnd="url(#arrow)" />
              <path d="M 75 30 Q 80 40 75 50" fill="none" stroke="#FBBF24" strokeWidth="1" markerEnd="url(#arrow)" />
              
              <defs>
                <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="3" markerHeight="3" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#FBBF24" />
                </marker>
              </defs>
            </svg>
            <div className="absolute bottom-4 right-4 bg-black/60 text-white text-xs px-3 py-1.5 rounded-lg backdrop-blur-md">
              تمرير الكرة حول المدافع (اللاعب الأزرق)
            </div>
          </div>
        ) : (
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-red-500/30 flex flex-col items-center justify-center bg-black/40">
            <span className="text-4xl mb-4">🎥</span>
            <p className="text-sm text-gray-400 mb-4 text-center px-4">شاهد شرح التمرين بالفيديو على يوتيوب</p>
            <a href={youtubeSearchUrl} target="_blank" rel="noopener noreferrer" className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2">
              مشاهدة الفيديوهات ↗
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
