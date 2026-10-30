'use client';
import React, { useState, useEffect } from 'react';
import ShotMap, { ShotData } from './ShotMap';

interface MatchReportProps {
  matchName: string;
  isDark?: boolean;
  autoMatchUrl?: string; 
}

export default function MatchReport({ matchName, isDark = true, autoMatchUrl }: MatchReportProps) {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- حالات خرائط التسديد الحية ---
  const [liveShots, setLiveShots] = useState<ShotData[]>([]);
  const [liveLoading, setLiveLoading] = useState(false);
  const [inputUrl, setInputUrl] = useState(autoMatchUrl || '');
  const [sourceType, setSourceType] = useState<'365' | 'sofascore' | 'fotmob'>('365');

  const [heatmapUrl, setHeatmapUrl] = useState<string | null>(null);
  const [heatmapLoading, setHeatmapLoading] = useState(false);

  const isArabic = /[\u0600-\u06FF]/.test(matchName);
  const dir = isArabic ? 'rtl' : 'ltr';

  // 🌟 جلب البيانات الأوتوماتيكي بمجرد وصول الرابط من الذكاء الاصطناعي
  useEffect(() => {
    if (!autoMatchUrl) {
      setLoading(false);
      setError("لم يتم توفير رابط للمباراة من قبل المساعد الذكي.");
      return;
    }

    setInputUrl(autoMatchUrl);
    
    // تحديد المصدر بناءً على الرابط
    let source: '365' | 'sofascore' | 'fotmob' = '365'; 
    if (autoMatchUrl.includes('365scores')) source = '365';
    else if (autoMatchUrl.includes('fotmob')) source = 'fotmob';
    else if (autoMatchUrl.includes('sofascore')) source = 'sofascore';
    setSourceType(source);

    const fetchDataAutomatically = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1. محاولة جلب الإحصائيات الكاملة (إذا كان الرابط من FotMob)
        if (source === 'fotmob') {
          const res = await fetch(`/api/advanced?source=fotmob&action=match&matchUrl=${encodeURIComponent(autoMatchUrl)}`);
          const result = await res.json();
          
          if (res.ok && result.data) {
             // هنا نضع بيانات FotMob (سيتم ربطها لاحقاً)
             setData(result.data); 
          } else {
             // إذا فشل FotMob، نجرب جلب الخريطة الحية من 365
             await fetchLiveShotsAutomatically(autoMatchUrl, '365');
          }
        } else {
          // 2. إذا كان الرابط من 365 أو Sofa، نجلب الخريطة الحية مباشرة
          await fetchLiveShotsAutomatically(autoMatchUrl, source);
        }
      } catch (err) {
        setError("تعذر جلب البيانات لهذه المباراة من المصدر.");
      } finally {
        setLoading(false);
      }
    };

    fetchDataAutomatically();
  }, [autoMatchUrl]);

  // دالة مساعدة لجلب الخريطة الحية تلقائياً
  const fetchLiveShotsAutomatically = async (url: string, source: string) => {
    setLiveLoading(true);
    try {
      const res = await fetch(`/api/advanced?source=${source}&action=shotmap&matchUrl=${encodeURIComponent(url)}`);
      const json = await res.json();

      if (json.data && Array.isArray(json.data)) {
        const mappedShots: ShotData[] = json.data.map((shot: any, index: number) => {
          let mappedOutcome: 'Goal' | 'Saved' | 'Off Target' | 'Blocked' = 'Off Target';
          let mappedX = 60; let mappedY = 40; let playerName = ''; let isHomeTeam = true;

          if (source === '365') {
            if (shot.shot_outcome === 'Gol') mappedOutcome = 'Goal';
            else if (shot.shot_outcome === 'Atajado') mappedOutcome = 'Saved';
            else if (shot.shot_outcome === 'Bloqueado') mappedOutcome = 'Blocked';
            mappedX = shot.line ? (shot.line / 100) * 120 : 60; 
            mappedY = shot.y ? (shot.y / 100) * 80 : 40;
            isHomeTeam = shot.competitorNum === 1;
            playerName = `لاعب ${shot.playerId}`; 
          } else if (source === 'sofascore') {
            const outcomeStr = (shot.shot_type || shot.outcome || '').toLowerCase();
            if (outcomeStr.includes('goal')) mappedOutcome = 'Goal';
            else if (outcomeStr.includes('save')) mappedOutcome = 'Saved';
            else if (outcomeStr.includes('block')) mappedOutcome = 'Blocked';
            mappedX = shot.x ? (shot.x / 100) * 120 : 60; 
            mappedY = shot.y ? (shot.y / 100) * 80 : 40;
            isHomeTeam = shot.is_home === true; 
            playerName = shot.player_name || shot.player || 'لاعب غير معروف';
          }

          if (!isHomeTeam) { mappedX = 120 - mappedX; mappedY = 80 - mappedY; }

          return {
            id: String(index), player: playerName, team: isHomeTeam ? (data?.home?.name || 'Home') : (data?.away?.name || 'Away'),
            x: mappedX, y: mappedY, xg: shot.xg || shot.expected_goals || 0, outcome: mappedOutcome
          };
        });
        setLiveShots(mappedShots);
      } else {
        setError("لم يتم العثور على تسديدات في هذه المباراة.");
      }
    } catch (err) {
      setError("فشل الاتصال بالسيرفر لجلب الخريطة.");
    } finally {
      setLiveLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`w-full max-w-6xl mx-auto my-4 p-12 rounded-3xl border flex flex-col items-center justify-center ${isDark ? 'bg-[#0a0a0a] border-emerald-900/30' : 'bg-gray-50 border-gray-200'}`}>
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className={`font-bold text-sm ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>جاري تحليل المباراة وإستخراج الخرائط تلقائياً...</p>
      </div>
    );
  }

  if (error || (!data && liveShots.length === 0)) {
    return (
      <div className={`w-full max-w-6xl mx-auto my-4 p-8 rounded-3xl border flex flex-col items-center justify-center ${isDark ? 'bg-[#0a0a0a] border-red-900/30' : 'bg-gray-50 border-red-200'}`}>
        <p className={`font-bold text-sm text-red-500`}>⚠️ {error || "لم نتمكن من جلب البيانات لهذه المباراة."}</p>
        <p className="text-xs text-gray-500 mt-2">يرجى التأكد من أن الرابط المرسل من المساعد الذكي صحيح.</p>
      </div>
    );
  }

  // 🌟 إذا كانت البيانات جاهزة (خرائط أو إحصائيات)، نعرضها فوراً
  return (
    <div dir={dir} className={`relative w-full max-w-6xl mx-auto my-4 sm:my-6 rounded-2xl sm:rounded-3xl border shadow-2xl overflow-hidden font-saudi transition-all ${isDark ? 'bg-[#0a0a0a] border-emerald-900/30 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-[#1D6B35]/15 via-transparent to-[#131314]/90 pointer-events-none z-0"></div>
      
      {/* الترويسة */}
      <div className={`relative z-10 p-4 sm:p-6 border-b flex flex-col items-center justify-center gap-2 ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
        <h2 className="text-xl sm:text-3xl font-black">{matchName}</h2>
        <span className="text-xs text-emerald-500 font-bold bg-emerald-500/10 px-3 py-1 rounded-full">تم الجلب تلقائياً</span>
      </div>

      {/* عرض الخريطة الحية */}
      {liveShots.length > 0 && (
        <div className="relative z-10 p-3 sm:p-6">
          <ShotMap shots={liveShots} matchName={matchName} isDark={isDark} />
        </div>
      )}

      {/* عرض الإحصائيات (إذا كانت البيانات جاهزة) */}
      {data && (
        <div className="relative z-10 p-6 text-center">
          <p className="text-gray-400">بيانات الإحصائيات جاهزة هنا (سيتم تطويرها بناءً على رد FotMob)</p>
        </div>
      )}
    </div>
  );
}
