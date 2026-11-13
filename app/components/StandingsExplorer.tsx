'use client';

import { useEffect, useState } from 'react';
import { COMPETITIONS } from '../../lib/competitions';
import type { AppLanguage } from '../../lib/app-language';
import LeagueDashboard from './LeagueDashboard';
import AppleSportsCenter from './AppleSportsCenter';

type Tab = 'standings' | 'goals' | 'assists' | 'overview';
type Leader = { id: number; name: string; team: string; photo: string | null; logo: string | null; value: number };
type Row = { id?: string; position?: number; name?: string; logo?: string | null; played?: number; won?: number; draw?: number; lost?: number; goalsFor?: number; goalsAgainst?: number; goalDifference?: number; points?: number };
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
  const [fullTable, setFullTable] = useState(false);
  const [standingsRows, setStandingsRows] = useState<Row[]>([]);
  const [standingsLoading, setStandingsLoading] = useState(true);
  const [standingsError, setStandingsError] = useState(false);
  const selectedCompetition = COMPETITIONS[league];
  const surface = 'border-[#2d5183] bg-[#091a36] text-white';
  const subtle = 'border-[#2a4d7e] bg-[#132b50] text-white';
  const secondary = 'text-slate-300';

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

  useEffect(() => {
    if (other || tab !== 'standings') return;
    if (selectedCompetition?.searchOnly && !selectedCompetition.standingsSource) return;
    const controller = new AbortController();
    setStandingsLoading(true);
    setStandingsError(false);
    setStandingsRows([]);
    fetch('/api/standings?league=' + encodeURIComponent(league), { signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error('Standings unavailable');
        return response.json() as Promise<{groups?: Group[]; rows?: Row[]}>;
      })
      .then(data => {
        if (controller.signal.aborted) return;
        const next = data.groups?.[0]?.rows || data.rows || [];
        setStandingsRows(next);
        setStandingsError(!next.length);
      })
      .catch(() => { if (!controller.signal.aborted) setStandingsError(true); })
      .finally(() => { if (!controller.signal.aborted) setStandingsLoading(false); });
    return () => controller.abort();
  }, [league, other, tab, selectedCompetition?.searchOnly, selectedCompetition?.standingsSource]);

  useEffect(() => { setFullTable(false); }, [league, other]);

  const totals = {
    clubs: rows.length,
    played: rows.reduce((sum, row) => sum + (Number(row.played) || 0), 0) / 2,
    goals: rows.reduce((sum, row) => sum + (Number(row.goalsFor) || 0), 0),
    wins: rows.reduce((sum, row) => sum + (Number(row.won) || 0), 0),
  };

  return (
    <div dir={language === 'ar' ? 'rtl' : 'ltr'} lang={language} className="mx-auto max-w-4xl space-y-4 rounded-3xl bg-gradient-to-b from-[#0d274f] via-[#091a36] to-[#040e22] p-2 pb-8 font-cairo text-white sm:p-5">
      <header className={`rounded-2xl border p-4 sm:p-5 ${surface}`}>
        <h2 className="text-xl font-extrabold sm:text-2xl">{t('الجداول والإحصائيات', 'Tables & statistics')}</h2>
        <p className={`mt-1 text-xs ${secondary}`}>{t('بيانات البطولات واللاعبين بحسب المصادر المتاحة', 'Competition and player data from available providers')}</p>
      </header>

      <div role="group" aria-label={t('نوع الرياضة', 'Sport type')} className="grid grid-cols-2 gap-2">
        <button type="button" onClick={() => setOther(false)} aria-pressed={!other}
          className={`rounded-2xl border px-3 py-3 text-sm font-bold transition ${!other ? 'border-cyan-300 bg-cyan-400 text-[#092443]' : surface}`}>
          ⚽ {t('كرة القدم', 'Football')}
        </button>
        <button type="button" onClick={() => setOther(true)} aria-pressed={other}
          className={`rounded-2xl border px-3 py-3 text-sm font-bold transition ${other ? 'border-cyan-300 bg-cyan-400 text-[#092443]' : surface}`}>
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
              className={`min-h-11 rounded-xl border px-1.5 py-2 text-[11px] font-bold leading-snug sm:px-3 sm:text-sm ${tab === item.id ? 'border-cyan-300 bg-cyan-400 text-[#092443]' : surface}`}>
              {t(item.ar, item.en)}
            </button>)}
          </nav>
          <section className={`min-w-0 space-y-4 rounded-2xl border p-3 sm:p-5 ${surface}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-base font-extrabold sm:text-lg">{t(tabs.find(item => item.id === tab)?.ar || '', tabs.find(item => item.id === tab)?.en || '')}</h3>
              <select value={league} onChange={event => { setLeague(event.target.value); setExpanded(false); }}
                aria-label={t('اختر البطولة', 'Choose competition')}
                className={`max-w-full rounded-xl border border-[#315d9d] bg-[#0a2146] px-3 py-2 text-xs font-bold text-white [color-scheme:dark] sm:text-sm`}>
                {(['club', 'national'] as const).map(kind =>
                  <optgroup key={kind} label={kind === 'club' ? t('بطولات الأندية', 'Club competitions') : t('بطولات المنتخبات', 'International competitions')}>
                    {Object.entries(COMPETITIONS).filter(([, competition]) => competition.kind === kind).map(([code, competition]) =>
                      <option key={code} value={code}>{competition[language]}</option>)}
                  </optgroup>)}
              </select>
            </div>

            {tab === 'standings' && (
              selectedCompetition?.searchOnly && !selectedCompetition.standingsSource
                ? <p className="text-sm">{t('لا تتوفر بيانات ترتيب مؤكدة لهذه البطولة عبر المصدر الحالي.', 'Verified standings are unavailable for this competition.')}{selectedCompetition.officialUrl && <a className="ms-2 text-cyan-300 underline" href={selectedCompetition.officialUrl} target="_blank" rel="noreferrer">{t('المصدر الرسمي', 'Official source')}</a>}</p>
                : <div className="space-y-3">
                    <h3 className="text-base font-extrabold">{t('🏆 جدول الترتيب', '🏆 League standings')}</h3>
                    {standingsLoading && <p role="status" className="text-sm text-slate-300">{t('جارٍ جلب الترتيب…', 'Loading standings…')}</p>}
                    {standingsError && !standingsLoading && <p role="status" className="text-sm">{t('تعذر جلب ترتيب موثوق حاليًا.', 'Verified standings are unavailable.')}</p>}
                    {!standingsLoading && !standingsError && <div className="overflow-hidden rounded-xl border border-[#315d9d]">
                      <div className="grid grid-cols-[24px_minmax(0,1fr)_29px_36px_31px] gap-1 bg-[#18375e] px-2 py-2 text-[10px] font-bold sm:grid-cols-[35px_minmax(0,1fr)_55px_80px_60px] sm:gap-2 sm:text-xs">
                        <span>#</span><span>{t('النادي', 'Club')}</span><span className="text-center">{t('لعب', 'P')}</span><span className="text-center">{t('فارق', 'GD')}</span><span className="text-center">{t('نقاط', 'Pts')}</span>
                      </div>
                      {standingsRows.slice(0,5).map((team,index) => <div key={team.id || index} className={`grid grid-cols-[24px_minmax(0,1fr)_29px_36px_31px] items-center gap-1 px-2 py-2 text-xs sm:grid-cols-[35px_minmax(0,1fr)_55px_80px_60px] sm:gap-2 sm:text-sm ${index%2 ? 'bg-[#122a4d]' : 'bg-[#0a1c39]'}`}>
                        <bdi className="text-center font-bold text-cyan-300">{team.position ?? index+1}</bdi>
                        <span className="flex min-w-0 items-center gap-1">
                          {team.logo && <img src={team.logo} alt="" className="h-5 w-5 shrink-0 object-contain sm:h-7 sm:w-7"/>}
                          <bdi className="truncate font-semibold">{team.name || '—'}</bdi>
                        </span>
                        <bdi className="text-center">{team.played ?? '—'}</bdi>
                        <bdi className="text-center">{team.goalDifference == null ? '—' : team.goalDifference>0 ? '+'+team.goalDifference : team.goalDifference}</bdi>
                        <bdi className="text-center font-extrabold">{team.points ?? '—'}</bdi>
                      </div>)}
                    </div>}
                    {!standingsLoading && !standingsError && <button type="button" aria-expanded={fullTable} className="rounded-xl px-1 py-2 text-sm font-bold text-cyan-300" onClick={() => setFullTable(!fullTable)}>{fullTable ? t('إخفاء الجدول الكامل', 'Hide full table') : t('عرض الجدول كامل', 'Show full table')} ‹</button>}
                    {fullTable && <div className="min-w-0 overflow-hidden rounded-xl border border-[#315d9d]"><LeagueDashboard key={league} leagueCode={league} isDark lang={language}/></div>}
                  </div>
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
                      {player.photo ? <img src={player.photo} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" /> : <span aria-hidden="true" className="h-9 w-9 shrink-0 rounded-full bg-cyan-400/15" />}
                      <span className="min-w-0 flex-1"><span dir="auto" className="block truncate text-sm font-bold">{player.name}</span><span dir="auto" className={`block truncate text-xs ${secondary}`}>{player.team}</span></span>
                      {player.logo && <img src={player.logo} alt="" className="h-6 w-6 shrink-0 object-contain" />}
                      <bdi className="min-w-9 rounded-lg bg-[#176b9c] px-2 py-1 text-center text-base font-extrabold text-white">{player.value}</bdi>
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
