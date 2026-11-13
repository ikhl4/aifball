'use client';

import { useEffect, useState } from 'react';
import { appleCompetitions, appleCompetitionNames, type AppleMatch, type AppleSchedule, type AppleSport, type AppleStat } from '../../lib/apple-sports-types';

import type { ScoresLanguage } from '../../lib/football-scoreboard';

const sports: { id: Exclude<AppleSport, 'football'>; label: string; en: string }[] = [
  { id: 'basketball', label: 'كرة السلة', en: 'Basketball' }, { id: 'tennis', label: 'التنس', en: 'Tennis' },
  { id: 'americanFootball', label: 'كرة القدم الأمريكية', en: 'American football' }, { id: 'baseball', label: 'البيسبول', en: 'Baseball' },
  { id: 'hockey', label: 'هوكي الجليد', en: 'Ice hockey' }, { id: 'motorsport', label: 'سباقات السيارات', en: 'Motorsport' },
  { id: 'golf', label: 'الغولف', en: 'Golf' }, { id: 'combat', label: 'الفنون القتالية المختلطة', en: 'Mixed martial arts' },
];
const dates = [{ value: -1, label: 'أمس' }, { value: 0, label: 'اليوم' }, { value: 1, label: 'غدًا' }];
const statusNames = { live: 'مباشر', final: 'انتهت', scheduled: 'قادمة', other: 'الحالة غير محددة' };
const statNames: Record<string, string> = {
  Goals: 'الأهداف', Assists: 'الصناعات', MinutesPlayed: 'الدقائق', Points: 'النقاط',
  Rebounds: 'المتابعات', Steals: 'السرقات', Blocks: 'التصديات', Turnovers: 'فقدان الكرة',
  Shots: 'التسديدات', ShotsOnGoal: 'على المرمى', Possession: 'الاستحواذ',
  'Possession:Percentage': 'الاستحواذ %', ChancesCreated: 'الفرص المصنوعة',
  FoulsCommitted: 'الأخطاء', YellowCards: 'البطاقات الصفراء', RedCards: 'البطاقات الحمراء',
  Aces: 'الإرسالات الساحقة', DoubleFaults: 'الأخطاء المزدوجة',
  'Strikes:Significant;Landed': 'الضربات المؤثرة', 'Takedowns:Landed': 'الإسقاطات',
  Knockdowns: 'مرات الطرح أرضًا', Hits: 'الضربات', Runs: 'الركضات', Saves: 'التصديات',

};
const englishCompetitions: Record<string, string> = {
  NBA: 'NBA', WNBA: 'WNBA', CBK_NCAA_TOUR: 'Men’s college basketball', WCBK_NCAA_TOUR: 'Women’s college basketball',
  ATP: 'ATP Tour', WTA: 'WTA Tour', NFL: 'NFL', CFB: 'College football', MLB: 'Major League Baseball',
  NHL: 'National Hockey League', FORMULA1: 'Formula 1', NASCAR: 'NASCAR', PGA: 'PGA Tour', LPGA: 'LPGA Tour', UFC: 'UFC',
};
const englishStatus = { live: 'Live', final: 'Finished', scheduled: 'Upcoming', other: 'Status unavailable' };
const englishDates = ['Yesterday', 'Today', 'Tomorrow'];
const choose = (language: ScoresLanguage, ar: string, en: string) => language === 'ar' ? ar : en;
const competitionName = (language: ScoresLanguage, code: string) =>
  (language === 'ar' ? appleCompetitionNames : englishCompetitions)[code] ?? code;

async function readJson<T>(query: string, signal: AbortSignal): Promise<T> {
  const response = await fetch('/api/apple-sports?' + query, { signal });
  if (!response.ok) throw new Error('Apple Sports unavailable');
  return response.json();
}

function summaryStats(stats: AppleStat[], language: ScoresLanguage) {
  return stats.flatMap(stat => statNames[stat.name] ? [{ ...stat, label: choose(language, statNames[stat.name], stat.name.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[:;]/g, " ")) }] : []);
}

function MatchScore({ match, language }: { match: AppleMatch; language: ScoresLanguage }) {
  const ranked = match.format === 'golf' || match.format === 'race';
  return (
    <>
      {ranked && <span className="block font-bold">{language === "en" ? match.englishName || match.name : match.name}</span>}
      {match.sides.map((side, index) => (
        <span key={index} className="flex items-center justify-between gap-3">
          <span className="min-w-0 break-words" dir="auto">{ranked && side.rank != null && <bdi className="me-2">{side.rank}</bdi>}{language === "en" ? side.englishName || side.name : side.name}{match.format === 'fight' && side.winner && <span className="ms-2 text-emerald-600">{choose(language, 'فائز', 'Winner')}</span>}</span>
          {match.format === 'tennis' ? (
            <span dir="ltr" aria-label={choose(language, 'أشواط كل مجموعة', 'Games per set')} className="flex shrink-0 gap-1 tabular-nums">
              {side.periods.map(period => <span key={period.index} className="min-w-6 rounded bg-gray-400/15 px-1 text-center">{period.score}</span>)}
            </span>
          ) : side.score !== null && <bdi className="rounded-md bg-gray-400/15 px-2 text-lg tabular-nums">{side.score}</bdi>}
        </span>
      ))}
      {!ranked && !match.sides.length && <span dir="auto">{(language === 'en' ? match.englishName : match.name) || choose(language, 'المشاركون غير محددين', 'Participants not confirmed')}</span>}
    </>
  );
}

function MatchDetails({ eventId, live, tennis, language }: { eventId: string; live: boolean; tennis: boolean; language: ScoresLanguage }) {
  const [match, setMatch] = useState<AppleMatch>();
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    const refresh = () => {
      void readJson<AppleMatch>('event=' + eventId + '&lang=' + language, controller.signal)
        .then(result => { if (!controller.signal.aborted) { setMatch(result); setFailed(false); } })
        .catch(() => { if (!controller.signal.aborted) setFailed(true); });
    };
    refresh();
    const interval = live ? window.setInterval(refresh, 30000) : undefined;
    return () => { controller.abort(); window.clearInterval(interval); };
  }, [eventId, live, language]);

  const t = (ar: string, en: string) => choose(language, ar, en);
  if (!match) return <p role="status" className="px-4 pb-4 text-sm">{failed ? t('تعذّر جلب تفاصيل اللقاء.', 'Event details unavailable.') : t('جارٍ جلب التفاصيل…', 'Loading details…')}</p>;
  return (
    <div className="space-y-3 border-t border-emerald-700/20 px-4 py-3 text-sm">
      {failed && <p role="status">{t('تعذّر تحديث التفاصيل. تظهر آخر بيانات وصلت.', 'Could not refresh details. Showing the last available data.')}</p>}
      {match.venue && <p>{language === "en" ? match.englishVenue || match.venue : match.venue}</p>}
      {(match.format === 'golf' || match.format === 'race') && (
        <div className="space-y-2"><MatchScore match={match} language={language} />
          {!match.sides.length && <p>{t('الترتيب غير متاح لهذا الحدث.', 'Rankings are unavailable for this event.')}</p>}
        </div>
      )}
      {match.format !== 'golf' && match.format !== 'race' && match.sides.map((side, index) => {
        const teamStats = summaryStats(side.stats, language);
        const starters = side.players.filter(player => player.starter);
        const playerStats = side.players.filter(player => summaryStats(player.stats, language).length);
        return (
          <section key={index} className="space-y-2">
            <h4 className="font-bold">{language === "en" ? side.englishName || side.name : side.name} {side.formation && <bdi className="ms-1 font-normal">{side.formation}</bdi>}</h4>
            {!tennis && side.periods.length > 1 && <p>{t('حسب الفترة', 'By period')} <bdi>{side.periods.map(period => period.score).join(' · ')}</bdi></p>}
            {teamStats.length > 0 && <p>{teamStats.map(stat => `${stat.label} ${stat.value}`).join(' · ')}</p>}
            {starters.length > 0 && <p>{t('الأساسيون:', 'Starters')} {starters.map(player => player.name).join('، ')}</p>}
            {playerStats.length > 0 && (
              <details>
                <summary className="cursor-pointer font-semibold">{t('إحصائيات اللاعبين', 'Player statistics')}</summary>
                <ul className="mt-2 space-y-1">
                  {playerStats.map(player => <li key={player.id}><bdi>{language === "en" ? player.englishName || player.name : player.name}</bdi> · {summaryStats(player.stats, language).map(stat => `${stat.label} ${stat.value}`).join(' · ')}</li>)}
                </ul>
              </details>
            )}
            {tennis && side.periods.length > 0 && <p>{t('أشواط المجموعات', 'Games per set')} <bdi>{side.periods.map(period => period.score).join(' · ')}</bdi></p>}
            {!tennis && !teamStats.length && !starters.length && !playerStats.length && side.periods.length <= 1 && <p className="opacity-70">{t('الإحصائيات التفصيلية غير متاحة لهذا الفريق.', 'Detailed statistics are unavailable for this team.')}</p>}
          </section>
        );
      })}
    </div>
  );
}

export default function AppleSportsCenter({ isDark, language }: { isDark: boolean; language: ScoresLanguage }) {
  const t = (ar: string, en: string) => choose(language, ar, en);
  const [sport, setSport] = useState<Exclude<AppleSport, 'football'>>('basketball');
  const [date, setDate] = useState(0);
  const [liveOnly, setLiveOnly] = useState(false);
  const [competition, setCompetition] = useState('all');
  const [schedule, setSchedule] = useState<AppleSchedule>();
  const [failed, setFailed] = useState(false);
  const [selected, setSelected] = useState<string>();
  const timeFormat = new Intl.DateTimeFormat(language === 'ar' ? 'ar-SA' : 'en-GB', { timeZone: 'Asia/Riyadh', hour: 'numeric', minute: '2-digit' });

  useEffect(() => {
    const controller = new AbortController();
    let pending = false;
    const refresh = async () => {
      if (pending) return;
      pending = true;
      try {
        const result = await readJson<AppleSchedule>(`sport=${sport}&date=${date}&lang=${language}`, controller.signal);
        if (!controller.signal.aborted) { setSchedule(result); setFailed(false); }
      } catch {
        if (!controller.signal.aborted) setFailed(true);
      } finally {
        pending = false;
      }
    };
    void refresh();
    const timer = date === 0 ? window.setInterval(refresh, 30000) : undefined;
    return () => { controller.abort(); window.clearInterval(timer); };
  }, [sport, date, language]);

  const matches = (schedule?.matches ?? []).filter(match =>
    (competition === 'all' || competition === match.competition) && (!liveOnly || match.status === 'live'));
  const surface = isDark ? 'bg-emerald-950/60' : 'bg-white';
  const border = 'border border-emerald-700/25';
  const button = (active: boolean) => `rounded-xl px-3 py-2 text-sm font-semibold ${active ? 'bg-emerald-700 text-white' : border}`;

  return (
    <div className="mx-auto max-w-4xl space-y-4 p-2 sm:p-4">
      <div role="group" aria-label={t('الرياضات الأخرى', 'Other sports')} className="flex flex-wrap gap-2">
        {sports.map(item => <button type="button" key={item.id} aria-pressed={sport === item.id} className={button(sport === item.id)} onClick={() => {
          if (item.id === sport) return;
          setSport(item.id); setCompetition('all'); setLiveOnly(false); setSchedule(undefined); setSelected(undefined); setFailed(false);
        }}>{t(item.label, item.en)}</button>)}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {dates.map((item, index) => <button type="button" key={item.value} aria-pressed={date === item.value} className={button(date === item.value)} onClick={() => {
          if (item.value === date) return;
          setDate(item.value); setLiveOnly(false); setSchedule(undefined); setSelected(undefined); setFailed(false);
        }}>{t(item.label, englishDates[index])}</button>)}
        {date === 0 && <button type="button" aria-pressed={liveOnly} className={button(liveOnly)} onClick={() => setLiveOnly(!liveOnly)}>{t('مباشر الآن', 'Live now')}</button>}
      </div>
      <label className="flex flex-wrap items-center gap-2 text-sm">
        <span>{t('البطولة', 'Competition')}</span>
        <select value={competition} onChange={event => { setCompetition(event.target.value); setSelected(undefined); }} className={`rounded-xl px-3 py-2 ${surface} ${border}`}>
          <option value="all">{t('كل البطولات', 'All competitions')}</option>
          {appleCompetitions[sport].map(code => <option key={code} value={code}>{competitionName(language, code)}</option>)}
        </select>
      </label>
      <p className="text-xs opacity-70">{t('توقيت الرياض', 'Riyadh time')}{date === 0 ? t(' · تحديث كل ٣٠ ثانية', ' · Refreshes every 30 seconds') : ''}</p>
        <div className="space-y-2">
          {failed && <p role="status">{schedule ? t('تعذّر التحديث. تظهر آخر بيانات وصلت.', 'Could not refresh scores. Showing the last available data.') : t('تعذّر جلب النتائج الآن.', 'Scores are temporarily unavailable.')}</p>}
          {!!schedule?.failed.length && <p role="status" className="text-sm opacity-80">{t('تعذّر تحميل بعض البطولات.', 'Some competitions could not be loaded.')}</p>}
          {!schedule && !failed && <p role="status">{t('جارٍ جلب المباريات…', 'Loading matches…')}</p>}
          {schedule && !matches.length && <p role="status">{liveOnly ? t('ما ظهر لقاء جارٍ في البيانات المتاحة.', 'No live events in the available data.') : t('لا توجد مباريات لهذه الفترة في البيانات المتاحة.', 'No events for this period in the available data.')}</p>}
          {matches.map(match => (
            <article key={match.id} className={`overflow-hidden rounded-2xl ${surface} ${border}`}>
              <button type="button" aria-expanded={selected === match.id} onClick={() => setSelected(selected === match.id ? undefined : match.id)} className="block w-full space-y-1.5 p-4 text-start">
                <span className="flex flex-wrap items-center justify-between gap-2 text-xs opacity-80">
                  <span>{competitionName(language, match.competition)}</span>
                  <span className={match.status === 'live' ? 'font-bold text-emerald-600' : ''}>
                    {language === 'ar' ? match.statusLabel ?? statusNames[match.status] : englishStatus[match.status]}
                    {match.status === 'scheduled' && ` · ${match.timeTbd ? t('الوقت غير محدد', 'Time to be confirmed') : timeFormat.format(new Date(match.start))}`}
                    {match.status === 'live' && match.period && ` · ${language === 'en' ? match.period.type : ({ Quarter: 'الربع', Set: 'المجموعة', Half: 'الشوط', Period: 'الفترة', Inning: 'الشوط', Round: 'الجولة' } as Record<string, string>)[match.period.type] ?? 'الفترة'} ${match.period.index}`}
                    {match.status === 'live' && match.clock && <> · <bdi>{match.clock}</bdi></>}
                  </span>
                </span>
                <MatchScore match={match} language={language} />
              </button>
              {selected === match.id && <MatchDetails key={match.id} eventId={match.id} live={match.status === 'live'} tennis={sport === 'tennis'} language={language} />}
            </article>
          ))}
        </div>
    </div>
  );
}
