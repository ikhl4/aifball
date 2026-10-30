'use client';
import React, { useState, useEffect } from 'react';

export default function LeagueDashboard({ leagueName = 'دوري روشن السعودي', leagueCode = 'ksa.1', isDark = true }: { leagueName?: string, leagueCode?: string, isDark?: boolean }) {
  const [activeTab, setActiveTab] = useState<'standings' | 'cards' | 'matrix'>('standings');
  const [loading, setLoading] = useState(true);
  const [realData, setRealData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeagueData = async () => {
      setLoading(true);
      setError(null);
      try {
        // نطلب جدول الترتيب من FotMob
        const res = await fetch(`/api/advanced?source=fotmob&action=table&league=${leagueCode}&season=2026`);
        const json = await res.json();
        
        if (json.data && Array.isArray(json.data)) {
          setRealData(json.data);
        } else if (json.error) {
          setError(json.error);
        }
      } catch (err) {
        console.error("فشل جلب إحصائيات الدوري:", err);
        setError("تعذر الاتصال بالسيرفر لجلب بيانات الدوري.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchLeagueData();
  }, [leagueCode]);

  return (
    <div className={`w-full max-w-5xl mx-auto my-6 rounded-3xl border shadow-2xl overflow-hidden font-saudi transition-all ${isDark ? 'bg-[#0f172a] border-gray-800 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}>
      
      {/* الترويسة */}
      <div className={`p-6 border-b flex flex-col sm:flex-row justify-between items-center gap-4 ${isDark ? 'bg-[#1e293b] border-gray-700' : 'bg-white border-gray-200'}`}>
        <div>
          <h2 className="text-2xl font-black text-emerald-500">📊 مركز إحصائيات الدوري</h2>
          <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{leagueName} - موسم 2026/2027</p>
        </div>
        <div className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${isDark ? 'bg-emerald-900/30 border-emerald-500/30 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-600'}`}>
          AiFBall Data Center
        </div>
      </div>

      {/* التبويبات */}
      <div className={`flex overflow-x-auto custom-scrollbar border-b ${isDark ? 'border-gray-700 bg-[#0f172a]' : 'border-gray-200 bg-gray-100'}`}>
        {[
          { id: 'standings', label: '🏆 ترتيب الفرق' },
          { id: 'cards', label: '🟨 البطاقات' },
          { id: 'matrix', label: '⏱️ الأهداف حسب الدقائق' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`py-4 px-6 text-sm font-bold whitespace-nowrap transition-colors ${
              activeTab === tab.id 
                ? 'text-emerald-400 border-b-2 border-emerald-500 bg-emerald-500/5' 
                : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* المحتوى */}
      <div className="p-6">
        {loading ? (
           <div className="flex flex-col items-center justify-center py-20">
             <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
             <p className="text-emerald-500 font-bold text-sm">جاري جلب البيانات الحقيقية...</p>
           </div>
        ) : error ? (
           <div className="text-center py-10 text-red-500">{error}</div>
        ) : (
          <>
            {/* 1. ترتيب الفرق */}
            {activeTab === 'standings' && (
              <div className="space-y-3 animate-in fade-in duration-300">
                {realData.length > 0 ? realData.map((team: any, i: number) => (
                  <div key={i} className={`flex items-center justify-between p-4 rounded-2xl border transition-all hover:scale-[1.01] ${isDark ? 'bg-[#1e293b]/50 border-gray-700/50 hover:border-emerald-500/50' : 'bg-white border-gray-200'}`}>
                    <div className="flex items-center gap-4">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${i === 0 ? 'bg-yellow-500 text-black' : i === 1 ? 'bg-gray-300 text-black' : i === 2 ? 'bg-amber-700 text-white' : 'bg-gray-700 text-white'}`}>{i + 1}</span>
                      <div>
                        {/* قراءة اسم الفريق بأي صيغة تأتي */}
                        <h3 className="font-bold text-lg">{team.team || team.name || team.team_name || 'فريق'}</h3>
                        <p className="text-xs text-gray-400">لعب: {team.matches_played || team.played || team.mp || '-'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-black text-emerald-500">{team.points || team.pts || '0'}</span>
                      <span className="text-xs text-gray-500 mt-2">نقطة</span>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-10 text-gray-500">لا توجد بيانات متاحة حالياً (تأكد من إعدادات FotMob في السيرفر).</div>
                )}
              </div>
            )}

            {/* 2. البطاقات */}
            {activeTab === 'cards' && (
              <div className="text-center py-10 text-gray-500">
                 <p>إحصائيات البطاقات الحقيقية تحتاج لربط مسار FBRef في السيرفر (قيد التطوير).</p>
              </div>
            )}

            {/* 3. مصفوفة الأهداف حسب الدقائق */}
            {activeTab === 'matrix' && (
              <div className="text-center py-10 text-gray-500">
                 <p>مصفوفة الأهداف حسب الدقائق تحتاج لبيانات الأحداث (Event Data) وهي قيد التطوير.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
