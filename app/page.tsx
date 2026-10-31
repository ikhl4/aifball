'use client';
import React, { useState, useMemo } from 'react';

// 1. قاعدة بيانات تجريبية غنية لكل الدوريات
const LEAGUES_CONFIG = {
  'ksa.1': {
    name: 'دوري روشن السعودي',
    logo: '🇸🇦',
    color: 'bg-emerald-600',
    data: [
      { id: 1, rank: 1, team: 'القادسية', logo: '🟥', played: 12, won: 9, drawn: 1, lost: 2, gf: 32, ga: 12, pts: 28, form: ['W', 'W', 'D', 'L', 'W'], status: 'stable', xg: 26.4, poss: 55, cleanSheets: 4, topScorer: 'أوباميانغ (8)' },
      { id: 2, rank: 2, team: 'النصر', logo: '🟡', played: 11, won: 9, drawn: 1, lost: 1, gf: 28, ga: 11, pts: 28, form: ['W', 'W', 'D', 'L', 'W'], status: 'up', xg: 25.1, poss: 58, cleanSheets: 5, topScorer: 'رونالدو (9)' },
      { id: 3, rank: 3, team: 'الهلال', logo: '🔵', played: 10, won: 9, drawn: 0, lost: 1, gf: 30, ga: 9, pts: 27, form: ['L', 'W', 'W', 'W', 'W'], status: 'down', xg: 24.8, poss: 61, cleanSheets: 6, topScorer: 'ميتروفيتش (7)' },
      { id: 4, rank: 4, team: 'الاتحاد', logo: '🟡', played: 11, won: 7, drawn: 3, lost: 1, gf: 21, ga: 11, pts: 24, form: ['W', 'D', 'W', 'W', 'W'], status: 'stable', xg: 19.5, poss: 54, cleanSheets: 4, topScorer: 'بنزيما (6)' },
      { id: 5, rank: 5, team: 'نيوم', logo: '🟢', played: 12, won: 7, drawn: 1, lost: 4, gf: 18, ga: 10, pts: 22, form: ['W', 'L', 'W', 'D', 'W'], status: 'up', xg: 17.2, poss: 49, cleanSheets: 5, topScorer: 'لاعب (5)' },
      { id: 6, rank: 6, team: 'الأهلي', logo: '🟢', played: 11, won: 7, drawn: 0, lost: 4, gf: 28, ga: 19, pts: 21, form: ['W', 'L', 'W', 'L', 'L'], status: 'down', xg: 22.4, poss: 56, cleanSheets: 2, topScorer: 'محرز (7)' },
      { id: 7, rank: 7, team: 'الاتفاق', logo: '🟢', played: 11, won: 5, drawn: 3, lost: 3, gf: 17, ga: 16, pts: 18, form: ['W', 'D', 'L', 'W', 'D'], status: 'up', xg: 15.6, poss: 48, cleanSheets: 3, topScorer: 'ديمبيلي (4)' },
    ]
  },
  'eng.1': {
    name: 'الدوري الإنجليزي',
    logo: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    color: 'bg-purple-600',
    data: [
      { id: 1, rank: 1, team: 'مانشستر سيتي', logo: '🔵', played: 8, won: 6, drawn: 2, lost: 0, gf: 22, ga: 7, pts: 20, form: ['W', 'W', 'D', 'W', 'W'], status: 'stable', xg: 18.5, poss: 65, cleanSheets: 4, topScorer: 'هالاند (9)' },
      { id: 2, rank: 2, team: 'أرسنال', logo: '🔴', played: 8, won: 6, drawn: 1, lost: 1, gf: 19, ga: 8, pts: 19, form: ['W', 'D', 'W', 'W', 'L'], status: 'up', xg: 17.2, poss: 58, cleanSheets: 3, topScorer: 'ساكا (5)' },
      { id: 3, rank: 3, team: 'ليفربول', logo: '🔴', played: 8, won: 5, drawn: 2, lost: 1, gf: 18, ga: 9, pts: 17, form: ['W', 'W', 'W', 'D', 'W'], status: 'down', xg: 16.8, poss: 60, cleanSheets: 4, topScorer: 'صلاح (6)' },
      { id: 4, rank: 4, team: 'تشيلسي', logo: '🔵', played: 8, won: 4, drawn: 3, lost: 1, gf: 15, ga: 10, pts: 15, form: ['D', 'W', 'D', 'W', 'W'], status: 'stable', xg: 14.5, poss: 55, cleanSheets: 3, topScorer: 'بالمر (5)' },
      { id: 5, rank: 5, team: 'توتنهام', logo: '⚪', played: 8, won: 4, drawn: 1, lost: 3, gf: 14, ga: 12, pts: 13, form: ['L', 'W', 'W', 'L', 'W'], status: 'up', xg: 15.1, poss: 57, cleanSheets: 2, topScorer: 'سون (4)' },
    ]
  },
  'esp.1': {
    name: 'الدوري الإسباني',
    logo: '🇪🇸',
    color: 'bg-orange-600',
    data: [
      { id: 1, rank: 1, team: 'ريال مدريد', logo: '⚪', played: 9, won: 7, drawn: 2, lost: 0, gf: 24, ga: 8, pts: 23, form: ['W', 'W', 'D', 'W', 'W'], status: 'stable', xg: 21.0, poss: 59, cleanSheets: 5, topScorer: 'فينيسيوس (7)' },
      { id: 2, rank: 2, team: 'برشلونة', logo: '🔴', played: 9, won: 7, drawn: 0, lost: 2, gf: 26, ga: 11, pts: 21, form: ['W', 'L', 'W', 'W', 'W'], status: 'up', xg: 23.5, poss: 63, cleanSheets: 3, topScorer: 'ليفاندوفسكي (8)' },
      { id: 3, rank: 3, team: 'أتلتيكو مدريد', logo: '🔴', played: 9, won: 5, drawn: 3, lost: 1, gf: 15, ga: 8, pts: 18, form: ['D', 'W', 'W', 'D', 'W'], status: 'down', xg: 14.2, poss: 52, cleanSheets: 4, topScorer: 'جريزمان (5)' },
      { id: 4, rank: 4, team: 'أتلتيك بيلباو', logo: '🔴', played: 9, won: 5, drawn: 2, lost: 2, gf: 16, ga: 10, pts: 17, form: ['W', 'D', 'L', 'W', 'W'], status: 'stable', xg: 13.8, poss: 51, cleanSheets: 3, topScorer: 'ويليامز (4)' },
    ]
  },
  'ita.1': {
    name: 'الدوري الإيطالي',
    logo: '🇮🇹',
    color: 'bg-blue-600',
    data: [
      { id: 1, rank: 1, team: 'إنتر ميلان', logo: '🔵', played: 9, won: 7, drawn: 1, lost: 1, gf: 23, ga: 8, pts: 22, form: ['W', 'W', 'W', 'D', 'W'], status: 'stable', xg: 20.5, poss: 58, cleanSheets: 5, topScorer: 'لاوتارو (8)' },
      { id: 2, rank: 2, team: 'نابولي', logo: '🔵', played: 9, won: 6, drawn: 2, lost: 1, gf: 18, ga: 9, pts: 20, form: ['W', 'D', 'W', 'W', 'W'], status: 'up', xg: 16.5, poss: 54, cleanSheets: 4, topScorer: 'لوكاكو (6)' },
      { id: 3, rank: 3, team: 'يوفنتوس', logo: '⚫', played: 9, won: 5, drawn: 4, lost: 0, gf: 15, ga: 6, pts: 19, form: ['D', 'W', 'D', 'W', 'W'], status: 'stable', xg: 14.0, poss: 50, cleanSheets: 6, topScorer: 'فلاهوفيتش (5)' },
    ]
  },
  'ger.1': {
    name: 'الدوري الألماني',
    logo: '🇩🇪',
    color: 'bg-red-600',
    data: [
      { id: 1, rank: 1, team: 'بايرن ميونخ', logo: '🔴', played: 8, won: 7, drawn: 1, lost: 0, gf: 29, ga: 7, pts: 22, form: ['W', 'W', 'D', 'W', 'W'], status: 'stable', xg: 25.0, poss: 66, cleanSheets: 4, topScorer: 'كين (10)' },
      { id: 2, rank: 2, team: 'باير ليفركوزن', logo: '🔴', played: 8, won: 6, drawn: 1, lost: 1, gf: 22, ga: 10, pts: 19, form: ['W', 'W', 'L', 'W', 'D'], status: 'up', xg: 19.5, poss: 57, cleanSheets: 3, topScorer: 'فيرتز (6)' },
      { id: 3, rank: 3, team: 'بوروسيا دورتموند', logo: '🟡', played: 8, won: 5, drawn: 2, lost: 1, gf: 18, ga: 11, pts: 17, form: ['D', 'W', 'W', 'D', 'W'], status: 'down', xg: 16.2, poss: 55, cleanSheets: 2, topScorer: 'جيراسي (5)' },
    ]
  },
  'fra.1': {
    name: 'الدوري الفرنسي',
    logo: '🇫🇷',
    color: 'bg-indigo-600',
    data: [
      { id: 1, rank: 1, team: 'باريس سان جيرمان', logo: '🔵', played: 9, won: 8, drawn: 1, lost: 0, gf: 28, ga: 8, pts: 25, form: ['W', 'W', 'W', 'D', 'W'], status: 'stable', xg: 24.2, poss: 64, cleanSheets: 5, topScorer: 'ديمبيلي (7)' },
      { id: 2, rank: 2, team: 'موناكو', logo: '🔴', played: 9, won: 6, drawn: 2, lost: 1, gf: 19, ga: 11, pts: 20, form: ['W', 'D', 'W', 'W', 'L'], status: 'stable', xg: 17.0, poss: 53, cleanSheets: 3, topScorer: 'بن يدر (5)' },
    ]
  }
};

const TOP_SCORERS = {
  'ksa.1': [{ name: 'كريستيانو رونالدو', team: 'النصر', goals: 9, logo: '🟡' }, { name: 'أوباميانغ', team: 'القادسية', goals: 8, logo: '🟥' }],
  'eng.1': [{ name: 'إيرلينغ هالاند', team: 'مانشستر سيتي', goals: 9, logo: '🔵' }, { name: 'محمد صلاح', team: 'ليفربول', goals: 6, logo: '🔴' }],
  'esp.1': [{ name: 'روبرت ليفاندوفسكي', team: 'برشلونة', goals: 8, logo: '🔴' }, { name: 'فينيسيوس جونيور', team: 'ريال مدريد', goals: 7, logo: '⚪' }],
  'ita.1': [{ name: 'لاوتارو مارتينيز', team: 'إنتر', goals: 8, logo: '🔵' }, { name: 'لوكاكو', team: 'نابولي', goals: 6, logo: '🔵' }],
  'ger.1': [{ name: 'هاري كين', team: 'بايرن ميونخ', goals: 10, logo: '🔴' }, { name: 'فيرتز', team: 'ليفركوزن', goals: 6, logo: '🔴' }],
  'fra.1': [{ name: 'عثمان ديمبيلي', team: 'باريس', goals: 7, logo: '🔵' }, { name: 'بن يدر', team: 'موناكو', goals: 5, logo: '🔴' }],
};

export default function LeagueDashboard({ initialLeague = 'ksa.1', isDark = true }: { initialLeague?: string, isDark?: boolean }) {
  const [currentLeagueCode, setCurrentLeagueCode] = useState(initialLeague);
  const [activeTab, setActiveTab] = useState<'standings' | 'scorers' | 'cards' | 'stats'>('standings');
  const [viewMode, setViewMode] = useState<'details' | 'performance'>('details');
  const [expandedTeam, setExpandedTeam] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'pts' | 'gf' | 'ga'>('pts');

  // جلب بيانات الدوري الحالي
  const currentLeague = LEAGUES_CONFIG[currentLeagueCode as keyof typeof LEAGUES_CONFIG] || LEAGUES_CONFIG['ksa.1'];
  const scorersData = TOP_SCORERS[currentLeagueCode as keyof typeof TOP_SCORERS] || TOP_SCORERS['ksa.1'];

  // دالة الفلترة والترتيب
  const filteredAndSortedData = useMemo(() => {
    let result = currentLeague.data.filter(t => t.team.includes(searchQuery));
    result.sort((a, b) => {
      if (sortBy === 'pts') return b.pts - a.pts;
      if (sortBy === 'gf') return b.gf - a.gf;
      if (sortBy === 'ga') return a.ga - b.ga;
      return 0;
    });
    return result;
  }, [currentLeague, searchQuery, sortBy]);

  const getBorderColor = (rank: number, total: number) => {
    if (rank <= 3) return 'border-r-4 border-r-emerald-500';
    if (rank === 4) return 'border-r-4 border-r-blue-500';
    if (rank >= total - 2) return 'border-r-4 border-r-red-500';
    return 'border-r-4 border-r-transparent';
  };

  return (
    <div className={`w-full max-w-5xl mx-auto my-6 font-saudi transition-all ${isDark ? 'text-white' : 'text-gray-900'}`} dir="rtl">
      
      {/* شريط اختيار الدوريات (جديد ومميز) */}
      <div className={`p-2 rounded-t-3xl border-b flex gap-2 overflow-x-auto custom-scrollbar ${isDark ? 'bg-[#0f172a] border-gray-800' : 'bg-gray-100 border-gray-200'}`}>
        {Object.keys(LEAGUES_CONFIG).map((code) => {
          const league = LEAGUES_CONFIG[code as keyof typeof LEAGUES_CONFIG];
          const isActive = currentLeagueCode === code;
          return (
            <button
              key={code}
              onClick={() => { setCurrentLeagueCode(code); setExpandedTeam(null); setSearchQuery(''); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all duration-300 ${
                isActive 
                  ? `${league.color} text-white shadow-lg scale-105` 
                  : `${isDark ? 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`
              }`}
            >
              <span className="text-lg">{league.logo}</span> {league.name}
            </button>
          );
        })}
      </div>

      {/* الترويسة (البحث والترتيب) */}
      <div className={`p-4 border-b flex flex-col sm:flex-row justify-between items-center gap-4 ${isDark ? 'bg-[#131a2a] border-gray-800' : 'bg-white border-gray-200'}`}>
        <div>
          <h2 className="text-2xl font-black flex items-center gap-2">
            <span className="text-2xl">{currentLeague.logo}</span> {currentLeague.name}
          </h2>
          <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>موسم 2026/2027 - الجدول التفاعلي</p>
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <input 
            type="text" 
            placeholder="ابحث عن فريق..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`flex-1 sm:w-48 px-4 py-2 rounded-xl border text-sm outline-none transition-colors ${isDark ? 'bg-[#0f172a] border-gray-700 focus:border-emerald-500 text-white' : 'bg-gray-50 border-gray-300 focus:border-emerald-500'}`}
          />
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className={`px-4 py-2 rounded-xl border text-sm font-bold outline-none ${isDark ? 'bg-[#0f172a] border-gray-700 text-white' : 'bg-gray-50 border-gray-300'}`}
          >
            <option value="pts">النقاط</option>
            <option value="gf">الأهداف</option>
            <option value="ga">استقبل</option>
          </select>
        </div>
      </div>

      {/* التبويبات */}
      <div className={`flex overflow-x-auto custom-scrollbar border-b ${isDark ? 'border-gray-800 bg-[#0f172a]' : 'border-gray-200 bg-gray-50'}`}>
        {[
          { id: 'standings', label: 'جدول الترتيب' },
          { id: 'scorers', label: 'الهدافون' },
          { id: 'cards', label: 'البطاقات' },
          { id: 'stats', label: 'إحصائيات الفرق' }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`py-3 px-6 text-sm font-bold whitespace-nowrap transition-colors ${activeTab === tab.id ? 'text-emerald-400 border-b-2 border-emerald-500' : 'text-gray-500 hover:text-gray-300'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* المحتوى */}
      <div className={`rounded-b-3xl border border-t-0 shadow-2xl ${isDark ? 'bg-[#131a2a] border-gray-800' : 'bg-white border-gray-200'}`}>
        
        {/* 1. جدول الترتيب */}
        {activeTab === 'standings' && (
          <>
            <div className="p-4 flex justify-between items-center">
              <div className={`flex p-1 rounded-xl ${isDark ? 'bg-[#0f172a]' : 'bg-gray-100'}`}>
                <button className="px-4 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 text-white shadow-md">الكل</button>
                <button className="px-4 py-1.5 rounded-lg text-xs font-bold text-gray-400 hover:text-white">داخل</button>
                <button className="px-4 py-1.5 rounded-lg text-xs font-bold text-gray-400 hover:text-white">خارج</button>
              </div>

              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>عرض الأداء</span>
                <button 
                  onClick={() => setViewMode(viewMode === 'performance' ? 'details' : 'performance')}
                  className={`w-10 h-5 rounded-full p-1 transition-colors duration-300 relative flex items-center ${viewMode === 'performance' ? 'bg-emerald-600' : 'bg-gray-600'}`}
                >
                  <div className={`w-3.5 h-3.5 rounded-full bg-white shadow-md transform transition-transform duration-300 ${viewMode === 'performance' ? '-translate-x-4' : '-translate-x-0'}`}></div>
                </button>
              </div>
            </div>

            <div className={`grid ${viewMode === 'performance' ? 'grid-cols-[40px_1fr_120px]' : 'grid-cols-[40px_1fr_30px_30px_30px_30px_35px_35px_35px_45px]'} items-center p-3 text-xs font-bold text-gray-500 uppercase tracking-wider border-b ${isDark ? 'border-gray-800 bg-[#0f172a]' : 'border-gray-200 bg-gray-50'}`}>
              <div className="text-center">#</div>
              <div className="text-right px-2">الفريق</div>
              {viewMode === 'performance' ? (
                <div className="text-center">آخر 5 مباريات</div>
              ) : (
                <>
                  <div className="text-center">لعب</div>
                  <div className="text-center">فاز</div>
                  <div className="text-center">تعادل</div>
                  <div className="text-center">خسر</div>
                  <div className="text-center">له</div>
                  <div className="text-center">عليه</div>
                  <div className="text-center">+/-</div>
                  <div className="text-center text-white font-black">نقاط</div>
                </>
              )}
            </div>

            {filteredAndSortedData.map((team) => (
              <div key={team.id} className={`flex flex-col border-b last:border-b-0 ${isDark ? 'border-gray-800/50' : 'border-gray-100'}`}>
                <div 
                  onClick={() => setExpandedTeam(expandedTeam === team.id ? null : team.id)}
                  className={`grid ${viewMode === 'performance' ? 'grid-cols-[40px_1fr_120px]' : 'grid-cols-[40px_1fr_30px_30px_30px_30px_35px_35px_35px_45px]'} items-center p-3 cursor-pointer transition-colors ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'} ${getBorderColor(team.rank, currentLeague.data.length)}`}
                >
                  <div className="text-center font-bold text-sm">{team.rank}</div>
                  <div className="text-right px-2 flex items-center gap-3">
                    <span className="text-xl">{team.logo}</span>
                    <span className="font-bold text-sm truncate">{team.team}</span>
                  </div>
                  
                  {viewMode === 'performance' ? (
                    <div className="flex justify-center gap-1">
                      {team.form.map((f, i) => (
                        <span key={i} className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold text-white ${f === 'W' ? 'bg-emerald-500' : f === 'D' ? 'bg-gray-500' : 'bg-red-500'}`}>
                          {f === 'W' ? 'ف' : f === 'D' ? 'ت' : 'خ'}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <>
                      <div className="text-center text-xs text-gray-400">{team.played}</div>
                      <div className="text-center text-xs text-emerald-500 font-bold">{team.won}</div>
                      <div className="text-center text-xs text-yellow-500 font-bold">{team.drawn}</div>
                      <div className="text-center text-xs text-red-500 font-bold">{team.lost}</div>
                      <div className="text-center text-xs text-gray-400">{team.gf}</div>
                      <div className="text-center text-xs text-gray-400">{team.ga}</div>
                      <div className={`text-center text-xs font-bold ${team.gf - team.ga > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {team.gf - team.ga > 0 ? `+${team.gf - team.ga}` : team.gf - team.ga}
                      </div>
                      <div className="text-center font-black text-sm bg-emerald-600/20 text-emerald-400 rounded py-1">{team.pts}</div>
                    </>
                  )}
                </div>

                {expandedTeam === team.id && (
                  <div className={`p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 ${isDark ? 'bg-[#0a0f1a]' : 'bg-gray-50'}`}>
                    <div className={`p-3 rounded-xl border text-center ${isDark ? 'bg-[#1e293b] border-gray-700' : 'bg-white border-gray-200'}`}>
                      <span className="text-[10px] text-gray-500 block mb-1">الأهداف المتوقعة (xG)</span>
                      <span className="font-bold text-lg text-blue-400">{team.xg}</span>
                    </div>
                    <div className={`p-3 rounded-xl border text-center ${isDark ? 'bg-[#1e293b] border-gray-700' : 'bg-white border-gray-200'}`}>
                      <span className="text-[10px] text-gray-500 block mb-1">الاستحواذ</span>
                      <span className="font-bold text-lg text-emerald-400">{team.poss}%</span>
                    </div>
                    <div className={`p-3 rounded-xl border text-center ${isDark ? 'bg-[#1e293b] border-gray-700' : 'bg-white border-gray-200'}`}>
                      <span className="text-[10px] text-gray-500 block mb-1">الشباك النظيفة</span>
                      <span className="font-bold text-lg text-white">{team.cleanSheets}</span>
                    </div>
                    <div className={`p-3 rounded-xl border text-center ${isDark ? 'bg-[#1e293b] border-gray-700' : 'bg-white border-gray-200'}`}>
                      <span className="text-[10px] text-gray-500 block mb-1">هداف الفريق</span>
                      <span className="font-bold text-sm text-yellow-400">{team.topScorer}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            <div className={`p-4 flex flex-wrap gap-4 text-xs font-bold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> دوري أبطال آسيا/أوروبا</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> الدوري الأوروبي/كأس آسيا</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> منطقة الهبوط</div>
            </div>
          </>
        )}

        {/* 2. الهدافون */}
        {activeTab === 'scorers' && (
          <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {scorersData.map((player, i) => (
              <div key={i} className={`flex items-center justify-between p-4 rounded-2xl border ${isDark ? 'bg-[#1e293b]/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center gap-4">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${i === 0 ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-white'}`}>{player.goals}</span>
                  <div>
                    <h4 className="font-bold">{player.name}</h4>
                    <p className="text-xs text-gray-400">{player.logo} {player.team}</p>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-xl">👤</div>
              </div>
            ))}
          </div>
        )}

        {/* 3. البطاقات وإحصائيات الفرق (مؤقتاً) */}
        {(activeTab === 'cards' || activeTab === 'stats') && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <span className="text-4xl mb-4">📊</span>
            <p>هذا القسم قيد التطوير، سيتم ربطه بالبيانات الحقيقية قريباً.</p>
          </div>
        )}

      </div>
    </div>
  );
}
