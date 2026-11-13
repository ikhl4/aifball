'use client';

import { useEffect, useState } from 'react';
import AppleSportsCenter from './AppleSportsCenter';
import MatchSummary from './MatchSummary';
import { filterLiveMatches, MATCH_FILTERS, matchFilterState, type MatchFilter } from '../../lib/live-match-filters';
import { footballNameInArabic } from '../../lib/football-names-ar';
import { footballGroups, footballLeagues, type FootballBoard, type FootballEvent, type FootballTeam, type ScoresLanguage } from '../../lib/football-scoreboard';

const dateOptions = [
  ['yesterday', 'أمس', 'Yesterday'], ['today', 'اليوم', 'Today'], ['tomorrow', 'غدًا', 'Tomorrow'],
] as const;
const englishFilters = { all: 'All', live: 'Live now', scheduled: 'Upcoming', finished: 'Finished' };
const nationalPriority = new Set(['Argentina', 'Brazil', 'England', 'France', 'Germany', 'Italy', 'Spain', 'Portugal', 'Netherlands', 'Uruguay', 'Egypt', 'Morocco', 'Japan', 'South Korea', 'Qatar', 'Iraq', 'United Arab Emirates', 'Kuwait', 'Jordan']);
const topLeagues = new Set<string>(footballGroups[0].leagues.map(([id]) => id));
const internationalLeagues = new Set<string>(footballGroups[1].leagues.map(([id]) => id));
const teamName = (team?: FootballTeam) => team?.displayName || team?.shortDisplayName || team?.name || '';
const getTeams = (event: FootballEvent) => (event.competitions?.[0]?.competitors ?? []).flatMap(side => side.team ? [side.team] : []);
const favoriteKey = 'aifball-scoreboard-favorites';

export default function LiveMatchCenter({ isDark = true, language = 'ar' }: { isDark?: boolean; language?: ScoresLanguage }) {
  const [other, setOther] = useState(false);
  const ar = language === 'ar';
  const toggleStyle = (active: boolean) => `rounded-xl px-4 py-2 text-sm font-bold ${active ? 'bg-emerald-700 text-white' : 'border border-emerald-600/30'}`;
  return (
    <div dir={ar ? 'rtl' : 'ltr'} lang={language}>
      <div role="group" aria-label={ar ? 'الرياضة' : 'Sport'} className="mx-auto flex max-w-4xl gap-2 px-2">
        <button type="button" aria-pressed={!other} onClick={() => setOther(false)} className={toggleStyle(!other)}>{ar ? 'كرة القدم' : 'Football'}</button>
        <button type="button" aria-pressed={other} onClick={() => setOther(true)} className={toggleStyle(other)}>{ar ? 'الرياضات الأخرى' : 'Other sports'}</button>
      </div>
      {other ? <AppleSportsCenter isDark={isDark} language={language} /> : <FootballMatchCenter isDark={isDark} language={language} />}
    </div>
  );
}

function FootballMatchCenter({ isDark, language }: { isDark: boolean; language: ScoresLanguage }) {
  const ar = language === 'ar';
  const t = (arabic: string, english: string) => ar ? arabic : english;
  const [date, setDate] = useState<(typeof dateOptions)[number][0]>('today');
  const [board, setBoard] = useState<FootballBoard>();
  const [failed, setFailed] = useState(false);
  const [expanded, setExpanded] = useState('');
  const [search, setSearch] = useState('');
  const [league, setLeague] = useState('all-leagues');
  const [status, setStatus] = useState<MatchFilter>('all');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [favoriteOnly, setFavoriteOnly] = useState(false);

  useEffect(() => {
    try {
      const saved: unknown = JSON.parse(localStorage.getItem(favoriteKey) ?? '[]');
      if (Array.isArray(saved)) setFavorites(saved.filter(id => typeof id === 'string'));
    } catch {}
  }, []);

  function toggleFavorite(id: string) {
    const next = favorites.includes(id) ? favorites.filter(value => value !== id) : [...favorites, id];
    setFavorites(next);
    try { localStorage.setItem(favoriteKey, JSON.stringify(next)); } catch {}
  }

  useEffect(() => {
    const controller = new AbortController();
    let pending = false;
    const refresh = async () => {
      if (pending) return;
      pending = true;
      try {
        const response = await fetch('/api/espn?league=all&grouped=1&date=' + date, { signal: controller.signal });
        if (!response.ok) throw new Error('Scoreboard unavailable');
        const data: FootballBoard = await response.json();
        if (!controller.signal.aborted) { setBoard(data); setFailed(false); }
      } catch {
        if (!controller.signal.aborted) setFailed(true);
      } finally {
        pending = false;
      }
    };
    void refresh();
    const timer = date === 'today' ? setInterval(refresh, 30000) : undefined;
    return () => { controller.abort(); clearInterval(timer); };
  }, [date]);

  const { all: otherWorld, ...specific } = board?.matches ?? {};
  const matches = { ...specific, 'other-world': otherWorld ?? [] };
  const input = favoriteOnly ? Object.fromEntries(Object.entries(matches).map(([id, events]) =>
    [id, events.filter(event => getTeams(event).some(team => favorites.includes(team.id)))])) : matches;
  const filtered = filterLiveMatches(input, league === 'all-leagues' ? 'all' : league === 'all' ? 'other-world' : league, search, status);
  const visible = filtered.visible;
  const display = (team: FootballTeam) => ar ? footballNameInArabic(teamName(team)) || teamName(team) : teamName(team);
  const timeFormat = new Intl.DateTimeFormat(ar ? 'ar-SA' : 'en-GB', { timeZone: 'Asia/Riyadh', hour: 'numeric', minute: '2-digit' });
  const priorities = Object.entries(visible).flatMap(([code, events]) => events.map((event: FootballEvent) => {
    const teams = getTeams(event);
    const names = teams.map(teamName);
    const score = teams.some(team => team.id === '655') ? 100
      : teams.some(team => favorites.includes(team.id)) ? 90
      : internationalLeagues.has(code) && names.some(name => nationalPriority.has(name)) ? 60
      : topLeagues.has(code) ? 35 : 0;
    return { code, event, score };
  })).filter(item => item.score > 0).sort((a, b) =>
    b.score - a.score || Number(matchFilterState(b.event) === 'live') - Number(matchFilterState(a.event) === 'live') || a.event.date.localeCompare(b.event.date)
  ).slice(0, 6);
  const prioritized = new Set(priorities.map(item => item.event.id));
  const box = `rounded-2xl border ${isDark ? 'border-white/15 bg-white/5' : 'border-emerald-900/15 bg-white'}`;
  const chip = (active: boolean) => `rounded-xl border px-3 py-2 text-sm font-bold ${active ? 'border-emerald-700 bg-emerald-700 text-white' : 'border-emerald-600/25'}`;

  function row(event: FootballEvent, code: string) {
    const competitors = event.competitions?.[0]?.competitors ?? [];
    const sides = ['home', 'away'].flatMap(key => competitors.filter(side => side.homeAway === key && side.team));
    const state = matchFilterState(event);
    const open = expanded === event.id;
    const timing = state === 'live' ? event.status?.type?.name === 'STATUS_HALFTIME' ? t('استراحة', 'Half-time')
      : event.status?.displayClock ? t('مباشر', 'Live') + ' · ' + event.status.displayClock : t('مباشر', 'Live')
      : state === 'finished' ? t('انتهت', 'Finished')
      : state === 'scheduled' ? timeFormat.format(new Date(event.date))
      : /POSTPONED/i.test(event.status?.type?.name ?? '') ? t('مؤجلة', 'Postponed')
      : /CANCEL/i.test(event.status?.type?.name ?? '') ? t('ملغاة', 'Cancelled') : t('متوقفة أو غير مؤكدة', 'Interrupted or unconfirmed');
    return (
      <article key={event.id} className={`overflow-hidden ${box}`}>
        <div className="grid grid-cols-[1fr_auto] items-start gap-2 p-3">
          <button type="button" aria-expanded={open} onClick={() => setExpanded(open ? '' : event.id)} className="min-w-0 space-y-2 text-start">
            <span className="block text-xs font-bold text-emerald-600">{timing}</span>
            {sides.map(({ team, score }) => team && (
              <span key={team.id} className="flex items-center justify-between gap-3 font-semibold">
                <span className="flex min-w-0 items-center gap-2">{team.logo && <img src={team.logo} alt="" className="h-6 w-6 object-contain" />}<bdi>{display(team)}</bdi></span>
                {(state === 'live' || state === 'finished') && score != null && <bdi className={`min-w-8 rounded-md px-2 py-0.5 text-center font-bold ${isDark ? "bg-white/15 text-white" : "bg-gray-100 text-gray-700"}`}>{ar && /^\d+$/.test(score) ? Number(score).toLocaleString("ar-SA") : score}</bdi>}
              </span>
            ))}
          </button>
          <div className="flex flex-col gap-1">
            {sides.map(({ team }) => team && <button type="button" key={team.id} aria-pressed={favorites.includes(team.id)}
              aria-label={t('الفريق المفضل: ', 'Favorite team: ') + display(team)} onClick={() => toggleFavorite(team.id)}
              className="h-8 w-8 rounded-lg text-lg text-emerald-600 hover:bg-emerald-500/15">{favorites.includes(team.id) ? '★' : '☆'}</button>)}
          </div>
        </div>
        {open && <MatchSummary eventId={event.id} league={code === 'other-world' ? 'all' : code} isDark={isDark} language={language} />}
      </article>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4 p-2 pt-4 sm:p-4">
      <div className="flex flex-wrap gap-2">
        {dateOptions.map(([id, label, english]) => <button type="button" key={id} className={chip(date === id)} aria-pressed={date === id} onClick={() => {
          if (id === date) return;
          setDate(id); setBoard(undefined); setFailed(false); setExpanded('');
        }}>{t(label, english)}</button>)}
        <button type="button" className={chip(favoriteOnly)} aria-pressed={favoriteOnly} onClick={() => setFavoriteOnly(!favoriteOnly)}>{t('فرق مفضلة', 'Favorite teams')}</button>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <input type="search" aria-label={t('ابحث عن فريق', 'Search teams')} placeholder={t('ابحث عن فريق', 'Search teams')} value={search} onChange={e => setSearch(e.target.value)} className={`p-2 ${box}`} />
        <select aria-label={t('البطولة', 'Competition')} value={league} onChange={e => { setLeague(e.target.value); setExpanded(''); }} className={`p-2 ${box} ${isDark ? '[color-scheme:dark]' : ''}`}>
          <option value="all-leagues">{t('كل البطولات', 'All competitions')}</option>
          {footballGroups.map(group => <optgroup key={group.id} label={t(group.ar, group.en)}>{group.leagues.map(([id, label, english]) =>
            <option key={id} value={id}>{t(label, english)}</option>)}</optgroup>)}
        </select>
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label={t('حالة المباراة', 'Match status')}>
        {MATCH_FILTERS.map(filter => <button type="button" key={filter.id} className={chip(status === filter.id)} aria-pressed={status === filter.id} onClick={() => setStatus(filter.id)}>{t(filter.label, englishFilters[filter.id])}</button>)}
      </div>
      <p className="text-xs opacity-70">{t('توقيت الرياض', 'Riyadh time')}{date === 'today' ? t(' · تحديث كل ٣٠ ثانية', ' · Refreshes every 30 seconds') : ''}</p>
      {(failed || !!board?.failed) && <p role="status" className="text-sm text-emerald-600">{t('تعذّر تحديث بعض النتائج.', 'Some scores could not be refreshed.')}</p>}
      {!board && !failed && <p role="status">{t('جارٍ جلب المباريات…', 'Loading matches…')}</p>}
      {board && !Object.values(visible).some(events => events.length) && <p role="status">{favoriteOnly && !favorites.length ? t('اضغط النجمة بجانب أي فريق لإضافته للمفضلة.', 'Select the star next to a team to favorite it.') : t('لا توجد مباريات مطابقة في البيانات المتاحة.', 'No matching matches in the available data.')}</p>}
      {league === 'all-leagues' && priorities.length > 0 && <section className="space-y-2">
        <h3 className="font-bold text-emerald-600">{t('أهم المباريات', 'Top matches')}</h3>
        {priorities.map(({ event, code }) => row(event, code))}
      </section>}
      {footballLeagues.map(([code, label, english]) => {
        const events = (visible[code === 'all' ? 'other-world' : code] ?? [])
          .filter((event: FootballEvent) => league !== 'all-leagues' || !prioritized.has(event.id));
        return events.length > 0 && <section key={code} className="space-y-2"><h3 className="font-bold">{t(label, english)}</h3>{events.map(event => row(event, code))}</section>;
      })}
    </div>
  );
}
