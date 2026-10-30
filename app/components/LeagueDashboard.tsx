'use client';
import React, { useState, useEffect } from 'react';

// بيانات تجريبية تحاكي الدوري السعودي والإنجليزي لكي تظهر الواجهة بأبهى حلة
const MOCK_KSA = [
  { rank: 1, team: 'القادسية', logo: '🟡', mp: 12, w: 9, d: 1, l: 2, gf: 24, ga: 10, gd: 14, pts: 28, form: ['W', 'W', 'W', 'L', 'W'], zone: 'champions' },
  { rank: 2, team: 'النصر', logo: '🟡', mp: 11, w: 9, d: 1, l: 1, gf: 30, ga: 10, gd: 20, pts: 28, form: ['W', 'W', 'D', 'W', 'W'], zone: 'champions' },
  { rank: 3, team: 'الهلال', logo: '🔵', mp: 10, w: 9, d: 0, l: 1, gf: 27, ga: 8, gd: 19, pts: 27, form: ['W', 'L', 'W', 'W', 'W'], zone: 'champions' },
  { rank: 4, team: 'الاتحاد', logo: '🟡', mp: 11, w: 7, d: 3, l: 1, gf: 23, ga: 12, gd: 11, pts: 24, form: ['W', 'D', 'W', 'W', 'D'], zone: 'europa' },
  { rank: 5, team: 'نيوم', logo: '🔵', mp: 12, w: 6, d: 4, l: 2, gf: 18, ga: 12, gd: 6, pts: 22, form: ['D', 'W', 'W', 'D', 'W'], zone: 'europa' },
  { rank: 6, team: 'الأهلي', logo: '🟢', mp: 11, w: 6, d: 3, l: 2, gf: 19, ga: 11, gd: 8, pts: 21, form: ['W', 'W', 'D', 'L', 'W'], zone: 'conference' },
  { rank: 7, team: 'الاتفاق', logo: '🟢', mp: 11, w: 5, d: 3, l: 3, gf: 14, ga: 13, gd: 1, pts: 18, form: ['W', 'D', 'L', 'W', 'D'], zone: 'conference' },
  { rank: 8, team: 'الدرعية', logo: '🟤', mp: 12, w: 4, d: 3, l: 5, gf: 15, ga: 18, gd: -3, pts: 15, form: ['L', 'L', 'W', 'D', 'W'], zone: '' },
  { rank: 9, team: 'الخليج', logo: '🟢', mp: 12, w: 4, d: 3, l: 5, gf: 12, ga: 17, gd: -5, pts: 15, form: ['L', 'W', 'L', 'D', 'L'], zone: '' },
  { rank: 10, team: 'الشباب', logo: '⚪', mp: 11, w: 4, d: 2, l: 5, gf: 13, ga: 14, gd: -1, pts: 14, form: ['W', 'L', 'L', 'W', 'L'], zone: '' },
  { rank: 11, team: 'الخلود', logo: '⚫', mp: 11, w: 3, d: 3, l: 5, gf: 11, ga: 16, gd: -5, pts: 12, form: ['L', 'D', 'L', 'W', 'D'], zone: 'relegation' },
  { rank: 12, team: 'الرياض', logo: '🔴', mp: 11, w: 3, d: 3, l: 5, gf: 10, ga: 17, gd: -7, pts: 12, form: ['L', 'L', 'D', 'L', 'W'], zone: 'relegation' },
  { rank: 13, team: 'الحزم', logo: '🟡', mp: 12, w: 3, d: 1, l: 8, gf: 12, ga: 21, gd: -9, pts: 10, form: ['L', 'L', 'W', 'L', 'L'], zone: 'relegation' },
  { rank: 14, team: 'الفيصلي', logo: '🔴', mp: 11, w: 2, d: 4, l: 5, gf: 11, ga: 18, gd: -7, pts: 10, form: ['D', 'L', 'L', 'D', 'W'], zone: 'relegation' },
  { rank: 15, team: 'الفتح', logo: '🔵', mp: 11, w: 2, d: 2, l: 7, gf: 9, ga: 19, gd: -10, pts: 8, form: ['L', 'W', 'L', 'L', 'L'], zone: 'relegation' },
];

const MOCK_ENG = [
  { rank: 1, team: 'أرسنال', logo: '🔴', mp: 8, w: 5, d: 2, l: 1, gf: 15, ga: 7, gd: 8, pts: 17, form: ['W', 'D', 'W', 'W', 'W'], zone: 'champions' },
  { rank: 2, team: 'مانشستر سيتي', logo: '🔵', mp: 8, w: 4, d: 3, l: 1, gf: 18, ga: 11, gd: 7, pts: 15, form: ['W', 'W', 'D', 'W', 'L'], zone: 'champions' },
  { rank: 3, team: 'نوتينغهام فورست', logo: '🔴', mp: 8, w: 4, d: 2, l: 2, gf: 14, ga: 10, gd: 4, pts: 14, form: ['W', 'L', 'W', 'D', 'W'], zone: 'champions' },
  { rank: 4, team: 'برايتون', logo: '🔵', mp: 8, w: 4, d: 2, l: 2, gf: 16, ga: 10, gd: 6, pts: 14, form: ['D', 'W', 'W', 'L', 'W'], zone: 'champions' },
  { rank: 5, team: 'بورنموث', logo: '🔴', mp: 8, w: 4, d: 2, l: 2, gf: 14, ga: 11, gd: 3, pts: 14, form: ['W', 'D', 'L', 'W', 'W'], zone: 'europa' },
  { rank: 6, team: 'ليفربول', logo: '🔴', mp: 8, w: 4, d: 1, l: 3, gf: 12, ga: 10, gd: 2, pts: 13, form: ['W', 'L', 'W', 'L', 'W'], zone: 'europa' },
  { rank: 7, team: 'فولهام', logo: '⚫', mp: 8, w: 3, d: 2, l: 3, gf: 11, ga: 11, gd: 0, pts: 11, form: ['D', 'W', 'L', 'D', 'W'], zone: 'conference' },
  { rank: 8, team: 'برينتفورد', logo: '🔴', mp: 8, w: 3, d: 2, l: 3, gf: 14, ga: 14, gd: 0, pts: 11, form: ['L', 'W', 'D', 'W', 'L'], zone: '' },
  { rank: 9, team: 'ليدز يونايتد', logo: '⚪', mp: 8, w: 3, d: 2, l: 3, gf: 11, ga: 13, gd: -2, pts: 11, form: ['W', 'L', 'W', 'D', 'L'], zone: '' },
  { rank: 10, team: 'مانشستر يونايتد', logo: '🔴', mp: 8, w: 3, d: 2, l: 3, gf: 13, ga: 12, gd: 1, pts: 11, form: ['L', 'D', 'L', 'W', 'W'], zone: '' },
  { rank: 11, team: 'توتنهام', logo: '⚪', mp: 8, w: 3, d: 2, l: 3, gf: 8, ga: 8, gd: 0, pts: 11, form: ['L', 'W', 'D', 'L', 'W'], zone: '' },
  { rank: 12, team: 'تشيلسي', logo: '🔵', mp: 8, w: 2, d: 4, l: 2, gf: 10, ga: 11, gd: -1, pts: 10, form: ['D', 'D', 'L', 'W', 'D'], zone: '' },
  { rank: 13, team: 'سندرلاند', logo: '🔴', mp: 8, w: 3, d: 1, l: 4, gf: 11, ga: 15, gd: -4, pts: 10, form: ['W', 'L', 'L', 'W', 'L'], zone: '' },
  { rank: 14, team: 'إيفرتون', logo: '🔵', mp: 8, w: 2, d: 4, l: 2, gf: 10, ga: 12, gd: -2, pts: 10, form: ['D', 'D', 'W', 'L', 'D'], zone: '' },
  { rank: 15, team: 'أستون فيلا', logo: '🟣', mp: 8, w: 2, d: 3, l: 3, gf: 9, ga: 13, gd: -4, pts: 9, form: ['L', 'D', 'W', 'D', 'L'], zone: '' },
];

const MOCK_SCORERS = [
  { name: 'إيرلينغ هالاند', team: 'مانشستر سيتي', goals: 9, logo: '🔵' },
  { name: 'ألكسندر إسحاق', team: 'نيوكاسل', goals: 6, logo: '⚫' },
  { name: 'جواو بيدرو', team: 'برايتون', goals: 5, logo: '🔵' },
  { name: 'كريستيانو رونالدو', team: 'النصر', goals: 9, logo: '🟡' },
  { name: 'سالم الدوسري', team: 'الهلال', goals: 7, logo: '🔵' },
];

export default function LeagueDashboard({ leagueName = 'دوري روشن السعودي', leagueCode = 'ksa.1', isDark = true }: { leagueName?: string, leagueCode?: string, isDark?: boolean }) {
  const [activeTab, setActiveTab] = useState<'table' | 'scorers'>('table');
  const [tableFilter, setTableFilter] = useState<'overall' | 'home' | 'away'>('overall');
  const [loading, setLoading] = useState(false);
  
  // اختيار البيانات بناءً على كود الدوري
  const isEng = leagueCode === 'eng.1';
  const standingsData = isEng ? MOCK_ENG : MOCK_KSA;
  const scorersData = isEng ? MOCK_SCORERS.slice(0, 3) : MOCK_SCORERS.slice(3, 5);

  // دالة لتحديد لون الشريط الجانبي (دوري الأبطال، الهبوط، إلخ)
  const getZoneColor = (zone: string) => {
    if (zone === 'champions') return 'bg-emerald-500';
    if (zone === 'europa') return 'bg-blue-500';
    if (zone === 'conference') return 'bg-cyan-500';
    if (zone === 'relegation') return 'bg-red-500';
    return 'bg-transparent';
  };

  return (
    <div className={`w-full max-w-5xl mx-auto my-6 rounded-3xl border shadow-2xl overflow-hidden font-saudi transition-all ${isDark ? 'bg-[#0f172a] border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'}`} dir="rtl">
      
      {/* الترويسة العلوية */}
      <div className={`p-6 border-b flex flex-col sm:flex-row justify-between items-center gap-4 ${isDark ? 'bg-gradient-to-r from-[#1e293b] to-[#0f172a] border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-2xl">
            {isEng ? '🦁' : '🦅'}
          </div>
          <div>
            <h2 className="text-2xl font-black">{leagueName}</h2>
            <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>موسم 2026/27 - الجدول التفاعلي</p>
          </div>
        </div>
      </div>

      {/* التبويبات الرئيسية (الترتيب / الهدافون) */}
      <div className={`flex border-b ${isDark ? 'border-gray-700 bg-[#0f172a]' : 'border-gray-200 bg-white'}`}>
        <button onClick={() => setActiveTab('table')} className={`flex-1 py-4 text-sm font-bold transition-colors ${activeTab === 'table' ? 'text-emerald-400 border-b-2 border-emerald-500' : 'text-gray-500 hover:text-gray-300'}`}>
          جدول الترتيب
        </button>
        <button onClick={() => setActiveTab('scorers')} className={`flex-1 py-4 text-sm font-bold transition-colors ${activeTab === 'scorers' ? 'text-emerald-400 border-b-2 border-emerald-500' : 'text-gray-500 hover:text-gray-300'}`}>
          إحصائيات اللاعبين
        </button>
      </div>

      {/* المحتوى */}
      <div className="p-4 sm:p-6 overflow-x-auto custom-scrollbar">
        
        {/* 1. جدول الترتيب */}
        {activeTab === 'table' && (
          <div className="animate-in fade-in duration-300 min-w-[750px]">
            
            {/* فلاتر الجدول */}
            <div className="flex items-center justify-between mb-4">
              <div className={`flex p-1 rounded-xl ${isDark ? 'bg-[#1e293b]' : 'bg-gray-100'}`}>
                {[
                  { id: 'overall', label: 'الكل' },
                  { id: 'home', label: 'داخل الأرض' },
                  { id: 'away', label: 'خارج الأرض' }
                ].map(f => (
                  <button key={f.id} onClick={() => setTableFilter(f.id as any)} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${tableFilter === f.id ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}>
                    {f.label}
                  </button>
                ))}
              </div>
              <div className="text-xs text-gray-500 flex items-center gap-2">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> أبطال أوروبا</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> يوروبا</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> هبوط</span>
              </div>
            </div>

            <table className="w-full text-center text-sm border-collapse">
              <thead>
                <tr className={`border-b text-xs font-bold ${isDark ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-500'}`}>
                  <th className="py-3 px-2 text-right w-8">#</th>
                  <th className="py-3 px-4 text-right">الفريق</th>
                  <th className="py-3 px-2">لعب</th>
                  <th className="py-3 px-2 text-emerald-500">فاز</th>
                  <th className="py-3 px-2 text-yellow-500">تعادل</th>
                  <th className="py-3 px-2 text-red-500">خسر</th>
                  <th className="py-3 px-2">له</th>
                  <th className="py-3 px-2">عليه</th>
                  <th className="py-3 px-2">+/-</th>
                  <th className="py-3 px-2 font-black text-lg">النقاط</th>
                  <th className="py-3 px-2 text-center">آخر 5</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-gray-800/50' : 'divide-gray-200'}`}>
                {standingsData.map((team: any, i: number) => (
                  <tr key={i} className={`transition-colors ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}>
                    {/* شريط اللون الجانبي */}
                    <td className="py-3 px-0 relative">
                      <div className={`absolute left-0 top-0 bottom-0 w-1 ${getZoneColor(team.zone)}`}></div>
                      <span className="font-bold px-2">{team.rank}</span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold flex items-center gap-3">
                      <span className="text-2xl">{team.logo}</span> {team.team}
                    </td>
                    <td className="py-3 px-2 text-gray-400">{team.mp}</td>
                    <td className="py-3 px-2 font-bold text-emerald-400">{team.w}</td>
                    <td className="py-3 px-2 font-bold text-yellow-400">{team.d}</td>
                    <td className="py-3 px-2 font-bold text-red-400">{team.l}</td>
                    <td className="py-3 px-2 text-gray-400">{team.gf}</td>
                    <td className="py-3 px-2 text-gray-400">{team.ga}</td>
                    <td className={`py-3 px-2 font-bold ${team.gd > 0 ? 'text-emerald-500' : team.gd < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                      {team.gd > 0 ? `+${team.gd}` : team.gd}
                    </td>
                    <td className={`py-3 px-2 font-black text-lg ${isDark ? 'text-white' : 'text-black'}`}>{team.pts}</td>
                    <td className="py-3 px-2">
                      <div className="flex justify-center gap-1">
                        {team.form.map((f: string, idx: number) => (
                          <span key={idx} className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold text-white ${
                            f === 'W' ? 'bg-emerald-500' : f === 'D' ? 'bg-gray-500' : 'bg-red-500'
                          }`}>
                            {f === 'W' ? 'ف' : f === 'D' ? 'ت' : 'خ'}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 2. إحصائيات اللاعبين (الهدافون) */}
        {activeTab === 'scorers' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <h3 className={`font-bold text-lg mb-4 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>الهدافون</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {scorersData.map((player: any, i: number) => (
                <div key={i} className={`flex items-center justify-between p-4 rounded-2xl border transition-all hover:scale-[1.02] ${isDark ? 'bg-[#1e293b] border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}>
                  <div className="flex items-center gap-4">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${i === 0 ? 'bg-blue-500 text-white' : 'bg-gray-700 text-white'}`}>
                      {player.goals}
                    </span>
                    <div>
                      <h4 className="font-bold text-base">{player.name}</h4>
                      <p className="text-xs text-gray-400 flex items-center gap-1">{player.logo} {player.team}</p>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-lg">
                    👤
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
