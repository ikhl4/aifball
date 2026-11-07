'use client';

import { useEffect, useState } from 'react';

interface PlayerProfileProps {
  playerName: string;
  seasons?: string;
  selectedSeason?: string;
  details?: Record<string, string>;
  isDark?: boolean;
}

type StatRow = Record<string, unknown>;

const fields = [
  ['المباريات', ['matches', 'MP', 'Playing Time MP']],
  ['الدقائق', ['minutes', 'Min', 'Playing Time Min']],
  ['الأهداف', ['goals', 'Gls', 'Performance Gls']],
  ['الصناعات', ['assists', 'Ast', 'Performance Ast']],
  ['البطاقات الصفراء', ['yellow_cards', 'CrdY', 'Performance CrdY']],
  ['البطاقات الحمراء', ['red_cards', 'CrdR', 'Performance CrdR']],
] as const;

function read(row: StatRow, keys: readonly string[]) {
  return keys.map(key => row[key]).find(value =>
    typeof value === 'number' && Number.isFinite(value) ||
    typeof value === 'string' && value.trim() !== ''
  ) as string | number | undefined;
}

function normalizeSourceRow(row: StatRow): StatRow {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => {
    // Python serializes FBref's two-level column labels as tuple strings.
    const pair = key.match(/^\('([^']*)', '([^']*)'\)$/);
    return [pair ? [pair[1], pair[2]].filter(Boolean).join(' ') : key, value];
  }));
}

function safeSource(source?: string) {
  if (!source) return undefined;
  try {
    const url = new URL(source);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : undefined;
  } catch {
    return undefined;
  }
}

export default function PlayerProfile({ playerName, seasons, selectedSeason, details, isDark = true }: PlayerProfileProps) {
  const available = [...new Set((seasons ?? '').split(',').map(value => value.trim())
    .filter(value => /^\d{4}(?:-\d{4})?$/.test(value)))].sort().reverse();
  const [selection, setSelection] = useState(selectedSeason ?? '');
  const inferredSeason = details?.current_season && /^\d{4}(?:-\d{4})?$/.test(details.current_season) ? details.current_season : undefined;
  const season = available.includes(selection) ? selection : (available[0] || inferredSeason);
  const [result, setResult] = useState<{ name: string; season: string; row?: StatRow }>();
  const current = result?.name === playerName && result.season === season ? result : undefined;

  const seasonKey = season ? 'season_' + season.replace('-', '_') : '';
  const seasonSummary = seasonKey ? details?.[seasonKey] : undefined;
  const seasonSource = seasonKey ? details?.[seasonKey + '_source'] : undefined;
  const competitionLabels = ['المشاركات', 'أساسي', 'دخل بديلاً', 'الدقائق', 'الأهداف', 'الصناعات', 'الإنذارات', 'الطرد'];
  const competitions = (details?.[seasonKey + '_competitions'] ?? '').split(';').flatMap(line => {
    const [team, competition, source, ...values] = line.split('|').map(value => value.trim());
    const href = safeSource(source);
    if (!team || !competition || !href || !values.length) return [];
    const numbers = values.slice(0, competitionLabels.length).flatMap((value, index) =>
      /^\d+$/.test(value) ? [{ label: competitionLabels[index], value }] : []);
    return numbers.length ? [{ team, competition, href, numbers }] : [];
  });
  const hasSeasonSummary = competitions.length > 0 || Boolean(seasonSummary?.trim() && safeSource(seasonSource));

  useEffect(() => {
    if (!season || hasSeasonSummary) return;
    const controller = new AbortController();
    const params = new URLSearchParams({ source: 'fbref', action: 'player-stats', playerName, season });
    async function load() {
      let row: StatRow | undefined;
      try {
        const response = await fetch('/api/advanced?' + params, { signal: controller.signal });
        if (!response.ok) throw new Error('Player statistics unavailable');
        const payload = await response.json();
        if (Array.isArray(payload.data)) {
          const matches = payload.data
            .filter((entry: unknown): entry is StatRow =>
              entry !== null && typeof entry === 'object' && !Array.isArray(entry)
            )
            .map(normalizeSourceRow)
            .filter((entry: StatRow) => String(read(entry, ['player', 'Player', 'player_name']) ?? '')
              .trim().toLowerCase() === playerName.trim().toLowerCase()
          );
          if (matches.length === 1) row = matches[0];
        }
      } catch {
        // Missing source data is displayed as unavailable.
      }
      if (!controller.signal.aborted) setResult({ name: playerName, season, row });
    }
    void load();
    return () => controller.abort();
  }, [playerName, season, hasSeasonSummary]);

  const stats = current?.row
    ? fields.flatMap(([label, keys]) => {
        const value = read(current.row!, keys);
        return value === undefined ? [] : [{ label, value }];
      })
    : [];

  // Career totals come only from the explicitly sourced career summary.
  // Do not combine them with single-season figures or invent missing values.
  const careerSource = safeSource(details?.career_source);
  const careerText = careerSource ? (details?.career_summary ?? '') : '';
  // Accept verified numeric fields first, then extract totals from the sourced summary.
  // Both Arabic- and Latin-digit spellings and either word order are supported.
  const normalizeDigits = (value: string) => value.replace(/[٠-٩]/g, digit => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit))).replace(/[۰-۹]/g, digit => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)));
  const careerFields = [
    { label: 'المباريات', explicit: details?.career_matches, terms: '(?:مباراة|مباريات|المباريات|المشاركات)' },
    { label: 'الأهداف', explicit: details?.career_goals, terms: '(?:هدف(?:ًا|ا|اً)?|أهداف|الأهداف)' },
    { label: 'التمريرات الحاسمة', explicit: details?.career_assists, terms: '(?:صناعة|صناعات|الصناعات|تمريرة حاسمة|تمريرات حاسمة)' },
  ];
  const careerTotals = careerSource ? careerFields.flatMap(({ label, explicit, terms }) => {
    const cleanText = normalizeDigits(careerText);
    const before = new RegExp('([0-9][0-9,]*)\\s*' + terms, 'i');
    const after = new RegExp(terms + '\\s*[:：]?\\s*([0-9][0-9,]*)', 'i');
    const candidate = explicit || cleanText.match(before)?.[1] || cleanText.match(after)?.[1];
    const value = candidate && normalizeDigits(candidate).replace(/,/g, '');
    return value && /^\d+$/.test(value) ? [{ label, value: Number(value).toLocaleString('en-US') }] : [];
  }) : [];
  const trophySource = safeSource(details?.trophies_source || details?.honours_source);
  const trophyValue = details?.trophies_count || details?.honours_count;
  const trophyCount = trophySource && trophyValue && /^\\d+$/.test(normalizeDigits(trophyValue))
    ? normalizeDigits(trophyValue) : undefined;
  const contractDate = safeSource(details?.contract_source) && (/^\d{4}-\d{2}-\d{2}$/.test(details?.contract_end || '') || /^\d{4}$/.test(details?.contract_end || ''))
    ? details?.contract_end : undefined;
  const currentClub = details?.club || 'النادي الحالي غير متاح';

  const photo = safeSource(details?.image_url || details?.photo_url || details?.portrait_url);
  const [wikiPhoto, setWikiPhoto] = useState<string>();
  const [photoFailed, setPhotoFailed] = useState(false);
  useEffect(() => {
    setWikiPhoto(undefined);
    setPhotoFailed(false);
    const controller = new AbortController();
    const params = new URLSearchParams({
      action: 'query', generator: 'search', gssearch: playerName + ' footballer',
      gsrlimit: '5', prop: 'pageimages', piprop: 'thumbnail', pithumbsize: '420',
      format: 'json', origin: '*',
    });
    fetch('https://en.wikipedia.org/w/api.php?' + params, { signal: controller.signal })
      .then(response => response.ok ? response.json() : null)
      .then(payload => {
        const pages = Object.values(payload?.query?.pages ?? {}) as Array<{ thumbnail?: { source?: string } }>;
        const source = pages.map(page => safeSource(page.thumbnail?.source)).find(Boolean);
        if (!controller.signal.aborted && source) setWikiPhoto(source);
      }).catch(() => {});
    return () => controller.abort();
  }, [playerName, photo]);
  const visiblePhoto = photo && !photoFailed ? photo : wikiPhoto;
  const individualHonours = details?.individual_awards || details?.individual_honours || details?.individual_achievements;
  const teamHonours = details?.trophies_detail || details?.team_honours || details?.honours;
  const honours = [
    ...(teamHonours ? [{ label: 'البطولات الجماعية', value: teamHonours }] : []),
    ...(individualHonours ? [{ label: 'الإنجازات الفردية', value: individualHonours }] : []),
  ];

  const facts = [
    { label: 'إجمالي المسيرة', value: details?.career_summary, source: details?.career_source },
    { label: 'الألقاب', value: trophyCount ? undefined : details?.honours, source: details?.honours_source },
    { label: 'أرقام الموسم المختار', value: competitions.length ? undefined : seasonSummary, source: seasonSource },
    { label: 'انتهاء العقد', value: undefined, source: details?.contract_source },
    { label: 'القيمة السوقية', value: details?.market_date && details?.market_value
      ? `${details.market_value} · ${details.market_date}` : undefined, source: details?.market_source },
    { label: 'الراتب المنشور', value: details?.salary, source: details?.salary_source },
  ].flatMap(({ label, value, source }) => {
    const href = safeSource(source);
    return value?.trim() && href ? [{ label, value, source: href }] : [];
  });
  if (!facts.length && !competitions.length && !careerTotals.length && !trophyCount && !contractDate && !season && !honours.length) return null;

  return (
    <section dir="rtl" className={`w-full min-w-0 overflow-hidden rounded-3xl border ${isDark ? 'bg-[#101714] border-white/10 text-white' : 'bg-white border-gray-200 text-gray-900'}`}>
      <header className="flex items-center gap-4 border-b border-white/10 p-4 sm:p-5">
        {visiblePhoto ? (
          <img src={visiblePhoto} alt={`صورة ${playerName}`} loading="lazy" referrerPolicy="no-referrer"
            onError={() => setPhotoFailed(true)}
            className="h-28 w-24 shrink-0 rounded-2xl object-cover bg-white/5" />
        ) : (
          <div aria-label="صورة اللاعب غير متاحة" className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-3xl text-emerald-400">⚽</div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-emerald-400">بطاقة اللاعب</p>
          <h2 className="mt-1 break-words text-xl font-extrabold sm:text-2xl">{playerName}</h2>
          {details?.club && <p className="mt-1 text-sm opacity-70">{details.club}</p>}
          {details?.nationality && <p className="text-xs opacity-60">{details.nationality}</p>}
        </div>
      </header>
      {(trophyCount || contractDate) && (
        <div className="grid grid-cols-2 gap-2 px-4 pt-4 sm:px-5">
          {trophyCount && <div className="rounded-xl bg-[#242625] p-3 text-center"><p className="text-2xl font-extrabold text-white">{trophyCount}</p><p className="mt-1 text-xs opacity-75">البطولات الجماعية</p></div>}
          {contractDate && <div className="rounded-xl bg-emerald-500/10 p-3 text-center"><p className="text-base font-extrabold text-white" dir="ltr">{contractDate}</p><p className="mt-1 text-xs opacity-75">نهاية عقد {currentClub}</p></div>}
        </div>
      )}
      {careerTotals.length > 0 && (
        <div className="p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="font-bold">إجمالي المسيرة</h3>
            
          </div>
          <dl className="grid grid-cols-3 gap-2">
            {careerTotals.map(({ label, value }) => (
              <div key={label} className="min-w-0 rounded-xl bg-emerald-500/10 p-3 text-center">
                <dd className="text-xl font-extrabold tabular-nums text-white">{value}</dd>
                <dt className="mt-1 text-[11px] leading-5 opacity-75">{label}</dt>
              </div>
            ))}
          </dl>
          <p className="mt-2 text-xs opacity-60">الأرقام حسب نطاق المصدر المذكور، وليست إحصاءات الموسم الحالي.</p>
        </div>
      )}
      {season && (
        <div className="px-4 pb-4 sm:px-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="font-bold">أرقام الموسم الحالي</h3>
            <label className="flex items-center gap-2 text-xs">الموسم
              <select disabled={available.length < 2} className="max-w-32 rounded-lg border border-gray-500 bg-transparent p-2" value={season}
                onChange={event => setSelection(event.target.value)}>
                {(available.length ? available : [season]).map(value => <option className="text-gray-900" key={value} value={value}>{value}</option>)}
              </select>
            </label>
          </div>
          {competitions.length > 0 ? competitions.map(({ team, competition, numbers }, index) => (
            <div key={index} className="mb-4">
              <p className="mb-3 text-xs opacity-70">{team} · {competition}</p>
              <dl className="grid grid-cols-3 gap-2">
                {numbers.map(({ label, value }) => (
                  <div key={label} className="min-w-0 rounded-xl bg-emerald-500/10 p-3 text-center">
                    <dd className="text-xl font-extrabold tabular-nums text-white">{value}</dd>
                    <dt className="mt-1 text-[11px] leading-5 opacity-75">{label}</dt>
                  </div>
                ))}
              </dl>
            </div>
          )) : stats.length ? (
            <dl className="grid grid-cols-3 gap-2">
              {stats.map(({ label, value }) => (
                <div key={label} className="min-w-0 rounded-xl bg-emerald-500/10 p-3 text-center">
                  <dd className="text-xl font-extrabold tabular-nums text-white">{value}</dd>
                  <dt className="mt-1 text-[11px] leading-5 opacity-75">{label}</dt>
                </div>
              ))}
            </dl>
          ) : hasSeasonSummary ? (
            <p className="text-sm opacity-75">{seasonSummary}</p>
          ) : <p role="status" className="text-sm opacity-65">{current ? 'أرقام هذا الموسم غير متاحة من المصدر.' : 'جاري التحقق من أرقام الموسم…'}</p>}
        </div>
      )}
      {honours.length > 0 && (
        <div className="border-t border-white/10 px-4 py-4 sm:px-5">
          <h3 className="mb-3 font-bold">البطولات والإنجازات</h3>
          <div className="grid gap-2">
            {honours.map(({ label, value }) => (
              <div key={label} className="rounded-xl bg-[#242625] p-3">
                <h4 className="mb-1 text-sm font-bold text-white">{label}</h4>
                <p className="whitespace-pre-line break-words text-sm leading-6 text-white/85">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {facts.filter(f => f.label !== 'إجمالي المسيرة' && f.label !== 'أرقام الموسم المختار' && f.label !== 'الألقاب').length > 0 && (
        <div className="grid grid-cols-2 gap-2 border-t border-white/10 p-4 sm:p-5">
          {facts.filter(f => f.label !== 'إجمالي المسيرة' && f.label !== 'أرقام الموسم المختار').map(({ label, value }) => (
            <div key={label} className="min-w-0 rounded-xl border border-gray-500/20 p-3">
              <div className="flex items-start justify-between gap-2"><h4 className="text-xs opacity-65">{label}</h4>
                </div>
              <p className="mt-2 break-words text-sm font-semibold leading-6">{value}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
