'use client';

import { useEffect, useState } from 'react';
import { COMPETITIONS } from '../../lib/competitions';
import type { AppLanguage } from '../../lib/app-language';
import LeagueDashboard from './LeagueDashboard';
import AppleSportsCenter from './AppleSportsCenter';

type Tab = 'standings' | 'goals' | 'assists' | 'overview';
type Leader = { id: number; name: string; team: string; photo: string | null; logo: string | null; value: number };
type Row = { name?: string; played?: number; won?: number; draw?: number; lost?: number; goalsFor?: number; goalsAgainst?: number; points?: number };
type Group = { rows?: Row[] };

const tabs: { id: Tab; ar: string; en: string }[] = [
  { id: 'standings', ar: 'الترتيب', en: 'Standings' },
  { id: 'goals', ar: 'الهدافين', en: 'Scorers' },
  { id: 'assists', ar: 'الصناع', en: 'Assists' },
  { id: 'overview', ar: 'إحصائية عامة', en: 'Overview' },
];
const sports = [
  ['🏀', 'كرة السلة', 'Basketball'], ['🎾', 'التنس', 'Tennis'],
  ['🏐', 'الكرة الطائرة', 'Volleyball'], ['🤾', 'كرة اليد', 'Handball'],
  ['🏈', 'كرة القدم الأمريكية', 'American football'], ['🏒', 'هوكي الجليد', 'Ice hockey'],
  ['⚾', 'البيسبول', 'Baseball'], ['🏎️', 'سباقات السيارات', 'Motorsport'],
];

export default function StandingsExplorer({ isDark = true, language = 'ar' }: { isDark?: boolean; language?: AppLanguage }) {
  const t = (ar: string, en: string) => language === 'ar' ? ar : en;
  const [league, setLeague] = useState('ksa.1');
  const [tab, setTab] = useState<Tab>('standings');
  const [other, setOther] = useState(false);
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [leaderStatus, setLeaderStatus] = useState<'loading' | 'ready' | 'unavailable'>('loading');
  const [leaderSeason, setLeaderSeason] = useState<number | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [overviewStatus, setOverviewStatus] = useState<'loading' | 'ready' | 'unavailable'>('loading');
  const [expanded, setExpanded] = useState(false);
  const selectedCompetition = COMPETITIONS[league];
  const surface = isDark ? 'border-emerald-700/30 bg-emerald-950/45 text-white' : 'border-emerald-700/20 bg-white text-gray-900';
  const subtle = isDark ? 'border-white/10 bg-white/5' : 'border-emerald-900/10 bg-emerald-50/70';
  const secondary = isDark ? 'text-gray-300' : 'text-gray-600';

  useEffect(() => {
    if (other || (tab !== 'goals' && tab !== 'assists')) return;
    const controller = new AbortController();
    setLeaders([]);
    setLeaderStatus('loading');
    setLeaderSeason(null);
    fetch('/api/football-leaders?league=' + encodeURIComponent(league) + '&kind=' + tab, { signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error('Unavailable');
        return response.json() as Promise<{ players?: Leader[]; season?: number }>;
      })
      .then(data => {
        if (controller.signal.aborted) return;
        setLeaders(Array.isArray(data.players) ? data.players : []);
        setLeaderSeason(typeof data.season === 'number' ? data.season : null);
        setLeaderStatus(data.players?.length ? 'ready' : 'unavailable');
      })
      .catch(() => { if (!controller.signal.aborted) setLeaderStatus('unavailable'); });
    return () => controller.abort();
  }, [league, tab, other]);

  useEffect(() => {
    if (other || tab !== 'overview') return;
    const controller = new AbortController();
    setOverviewStatus('loading');
    setRows([]);
    fetch('/api/standings?league=' + encodeURIComponent(league), { signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error('Unavailable');
        return response.json() as Promise<{ groups?: Group[]; rows?: Row[] }>;
      })
      .then(data => {
        if (controller.signal.aborted) return;
        const found = data.groups?.[0]?.rows || data.rows || [];
        setRows(found);
        setOverviewStatus(found.length ? 'ready' : 'unavailable');
      })
      .catch(() => { if (!controller.signal.aborted) setOverviewStatus('unavailable'); });
    return () => controller.abort();
  }, [league, tab, other]);

  const totals = {
    clubs: rows.length,
    played: rows.reduce((sum, row) => sum + (Number(row.played) || 0), 0) / 2,
    goals: rows.reduce((sum, row) => sum + (Number(row.goalsFor) || 0), 0),
    wins: rows.reduce((sum, row) => sum + (Number(row.won) || 0), 0),
  };

  return (
    <div dir={language === 'ar' ? 'rtl' : 'ltr'} lang={language} className="mx-auto max-w-4xl space-y-4 p-2 pb-8 font-cairo sm:p-5">
      <header className={`rounded-2xl border p-4 sm:p-5 ${surface}`}>
        <h2 className="text-xl font-extrabold sm:text-2xl">{t('الجداول والإحصائيات', 'Tables & statistics')}</h2>
        <p className={`mt-1 text-xs ${secondary}`}>{t('بيانات البطولات واللاعبين بحسب المصادر المتاحة', 'Competition and player data from available providers')}</p>
      </header>

      <div role="group" aria-label={t('نوع الرياضة', 'Sport type')} className="grid grid-cols-2 gap-2">
        <button type="button" onClick={() => setOther(false)} aria-pressed={!other}
          className={`rounded-2xl border px-3 py-3 text-sm font-bold transition ${!other ? 'border-emerald-600 bg-emerald-700 text-white' : surface}`}>
          ⚽ {t('كرة القدم', 'Football')}
        </button>
        <button type="button" onClick={() => setOther(true)} aria-pressed={other}
          className={`rounded-2xl border px-3 py-3 text-sm font-bold transition ${other ? 'border-emerald-600 bg-emerald-700 text-white' : surface}`}>
          🏀 {t('الرياضات الأخرى', 'Other sports')}
        </button>
      </div>

      {other ? (
        <section className={`space-y-4 rounded-2xl border p-3 sm:p-5 ${surface}`}>
          <div>
            <h3 className="text-lg font-bold">{t('الرياضات الأخرى', 'Other sports')}</h3>
            <p className={`mt-1 text-xs ${secondary}`}>
              {t('استعرض الرياضات المتاحة ونتائجها وتفاصيلها. ترتيب الدوريات يُعرض فقط عند توفر مصدر موثوق.', 'Browse available sports, results and match details. League standings appear only with verified sources.')}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {sports.map(([emoji, ar, en]) => <div key={en} className={`flex items-center gap-2 rounded-xl border p-3 text-xs font-bold sm:text-sm ${subtle}`}>
              <span aria-hidden="true" className="text-xl">{emoji}</span><span>{t(ar, en)}</span>
            </div>)}
          </div>
          <details className={`rounded-xl border p-3 ${subtle}`}>
            <summary className="cursor-pointer text-sm font-bold">{t('عرض المباريات والإحصائيات المتاحة', 'View available matches and statistics')}</summary>
            <div className="mt-3"><AppleSportsCenter isDark={isDark} language={language} /></div>
          </details>
        </section>
      ) : (
        <>
          <nav role="tablist" aria-label={t('إحصائيات كرة القدم', 'Football statistics')} className="grid grid-cols-4 gap-1.5 sm:gap-2">
            {tabs.map(item => <button key={item.id} type="button" role="tab" aria-selected={tab === item.id}
              onClick={() => { setTab(item.id); setExpanded(false); }}
              className={`min-h-11 rounded-xl border px-1.5 py-2 text-[11px] font-bold leading-snug sm:px-3 sm:text-sm ${tab === item.id ? 'border-emerald-700 bg-emerald-700 text-white' : surface}`}>
              {t(item.ar, item.en)}
            </button>)}
          </nav>
          <section className={`min-w-0 space-y-4 rounded-2xl border p-3 sm:p-5 ${surface}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-base font-extrabold sm:text-lg">{t(tabs.find(item => item.id === tab)?.ar || '', tabs.find(item => item.id === tab)?.en || '')}</h3>
              <select value={league} onChange={event => { setLeague(event.target.value); setExpanded(false); }}
                aria-label={t('اختر البطولة', 'Choose competition')}
                className={`max-w-full rounded-xl border border-emerald-600/30 px-3 py-2 text-xs font-bold sm:text-sm ${isDark ? 'bg-[#10251b] text-white [color-scheme:dark]' : 'bg-white text-gray-900'}`}>
                {(['club', 'national'] as const).map(kind =>
                  <optgroup key={kind} label={kind === 'club' ? t('بطولات الأندية', 'Club competitions') : t('بطولات المنتخبات', 'International competitions')}>
                    {Object.entries(COMPETITIONS).filter(([, competition]) => competition.kind === kind).map(([code, competition]) =>
                      <option key={code} value={code}>{competition[language]}</option>)}
                  </optgroup>)}
              </select>
            </div>

            {tab === 'standings' && (
              selectedCompetition?.searchOnly && !selectedCompetition.standingsSource
                ? <p className="text-sm">{t('لا تتوفر بيانات ترتيب مؤكدة لهذه البطولة عبر المصدر الحالي.', 'Verified standings are unavailable for this competition.')}{selectedCompetition.officialUrl && <a className="ms-2 text-emerald-500 underline" href={selectedCompetition.officialUrl} target="_blank" rel="noreferrer">{t('المصدر الرسمي', 'Official source')}</a>}</p>
                : <LeagueDashboard key={league} leagueCode={league} isDark={isDark} lang={language} />
            )}

            {(tab === 'goals' || tab === 'assists') && (
              <div className="space-y-3" role="tabpanel">
                {leaderStatus === 'loading' && <p role="status" className="text-sm">{t('جارٍ جلب الإحصائيات…', 'Loading statistics…')}</p>}
                {leaderStatus === 'unavailable' && <p role="status" className="text-sm">{t('إحصائيات اللاعبين الموثقة غير متاحة لهذه البطولة حاليًا. لن نعرض أسماء أو أرقامًا افتراضية.', 'Verified player leaders are unavailable for this competition. No example names or numbers are shown.')}</p>}
                {leaderStatus === 'ready' && <>
                  <p className={`text-xs ${secondary}`}>{t('المصدر: API-Football · موسم', 'Source: API-Football · Season')} {leaderSeason || '—'}</p>
                  {leaders.slice(0, expanded ? 20 : 6).map((player, index) => (
                    <div key={player.id} className={`flex items-center gap-2 rounded-xl border p-2.5 ${subtle}`}>
                      <span className="w-6 shrink-0 text-center text-sm font-extrabold text-emerald-500">{index + 1}</span>
                      {player.photo ? <img src={player.photo} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" /> : <span aria-hidden="true" className="h-9 w-9 shrink-0 rounded-full bg-emerald-600/15" />}
                      <span className="min-w-0 flex-1"><span dir="auto" className="block truncate text-sm font-bold">{player.name}</span><span dir="auto" className={`block truncate text-xs ${secondary}`}>{player.team}</span></span>
                      {player.logo && <img src={player.logo} alt="" className="h-6 w-6 shrink-0 object-contain" />}
                      <bdi className="min-w-9 rounded-lg bg-emerald-700 px-2 py-1 text-center text-base font-extrabold text-white">{player.value}</bdi>
                    </div>))}
                  {leaders.length > 6 && <button type="button" className="text-sm font-bold text-emerald-500" onClick={() => setExpanded(!expanded)}>
                    {expanded ? t('عرض أقل', 'Show less') : t('عرض الترتيب الكامل', 'Show full ranking')}
                  </button>}
                </>}
              </div>
            )}

            {tab === 'overview' && <div className="space-y-3" role="tabpanel">
              {overviewStatus === 'loading' && <p role="status" className="text-sm">{t('جارٍ جلب إحصائيات البطولة…', 'Loading league overview…')}</p>}
              {overviewStatus === 'unavailable' && <p role="status" className="text-sm">{t('لا تتوفر بيانات مؤكدة تكفي لإنشاء الإحصائية العامة.', 'Verified data is unavailable for the overview.')}</p>}
              {overviewStatus === 'ready' && <>
                <p className={`text-xs ${secondary}`}>{t('ملخص محسوب من جدول ترتيب البطولة، وليس إحصائيات فردية للاعبين.', 'Summary calculated from the league standings, not individual player statistics.')}</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    [t('الفرق', 'Teams'), totals.clubs],
                    [t('المباريات المنجزة تقريبًا', 'Estimated matches played'), Math.floor(totals.played)],
                    [t('الأهداف المسجلة', 'Goals scored'), totals.goals],
                    [t('مجموع الانتصارات', 'Total wins'), totals.wins],
                  ].map(([label, value]) => <div key={label} className={`rounded-xl border p-4 ${subtle}`}>
                    <div className="text-2xl font-extrabold text-emerald-500" dir="ltr">{value}</div>
                    <div className={`mt-1 text-xs ${secondary}`}>{label}</div>
                  </div>)}
                </div>
              </>}
            </div>}
          </section>
        </>
      )}
    </div>
  );
}
