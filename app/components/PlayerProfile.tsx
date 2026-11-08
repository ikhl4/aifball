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
  // Provider schema: matches | starts | substitute appearances | minutes | goals | assists | yellow | red.
  // Never shift fields when a value is blank, and never promote minutes/subs to appearances.
  const competitionLabels = ['المباريات', 'أساسي', 'دخل بديلاً', 'الدقائق', 'الأهداف', 'الصناعات', 'الإنذارات', 'الطرد'];
  const primaryLabels = ['المباريات', 'الأهداف', 'الصناعات'];
  const competitions = (details?.[seasonKey + '_competitions'] ?? '').split(';').flatMap(line => {
    const [team, competition, source, ...values] = line.split('|').map(value => value.trim());
    const href = safeSource(source);
    if (!team || !competition || !href || values.length !== competitionLabels.length) return [];

    // Fixed-position schema: GP | GS | SUB | MIN | G | A | YC | RC.
    // Blank means unknown, not zero. Reject malformed or impossible records.
    const parsed = values.map(value => /^\d+$/.test(value) ? Number(value) : null);
    if (values.some((value, index) => value !== '' && parsed[index] === null)) return [];
    const [matches, starts, substitutes, minutes, goals, assists, yellows, reds] = parsed;
    if (parsed.some(value => value !== null && (!Number.isSafeInteger(value) || value > 100000))) return [];
    if (matches !== null && (matches > 100 || (starts !== null && starts > matches) ||
      (substitutes !== null && substitutes > matches) ||
      (starts !== null && substitutes !== null && starts + substitutes > matches) ||
      (minutes !== null && minutes > matches * 130) ||
      (goals !== null && goals > matches * 8) ||
      (assists !== null && assists > matches * 8))) return [];
    if (minutes !== null && matches === null && minutes > 12000) return [];
    if (yellows !== null && yellows > 100 || reds !== null && reds > 100) return [];
    if (matches === null && goals === null && assists === null) return [];
    const numbers = parsed.flatMap((value, index) =>
      value === null ? [] : [{ label: competitionLabels[index], value: String(value) }]);
    return [{ team, competition, href, numbers }];
  });
  // Only a provider-verified all-competitions row may be used as the headline total.
  // League-only rows must never be presented as the entire club season.
  const allCompetitionRows = competitions.filter(item => /(?:جميع المسابقات|كل البطولات|all competitions|all comps|overall)/i.test(item.competition));
  const verifiedSeasonTotal = allCompetitionRows.length === 1 ? allCompetitionRows[0] : undefined;
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
  const retired = ['retired', 'معتزل', 'اعتزل'].includes((details?.status || details?.career_status || '').trim().toLowerCase());
  // Superstar cards emphasize career totals; other active players lead with their season.
  const careerFirst = retired || /(?:cristiano|ronaldo|رونالدو|messi|ميسي|neymar|نيمار)/i.test(playerName) || details?.default_view === 'career';
  const [view, setView] = useState<'career' | 'season' | null>(null);
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
  const careerHeadline = careerFields.map(({ label }) => ({
    label,
    value: careerTotals.find(item => item.label === label)?.value ?? '—',
  }));
  const trophySource = safeSource(details?.trophies_source || details?.honours_source);
  const trophyValue = details?.trophies_count || details?.honours_count;
  const trophyCount = trophySource && trophyValue && /^\\d+$/.test(normalizeDigits(trophyValue))
    ? normalizeDigits(trophyValue) : undefined;
  const contractDate = safeSource(details?.contract_source) && (/^\d{4}-\d{2}-\d{2}$/.test(details?.contract_end || '') || /^\d{4}$/.test(details?.contract_end || ''))
    ? details?.contract_end : undefined;
  const currentClub = details?.club || 'النادي الحالي غير متاح';

  const photo = [details?.image_url, details?.photo_url, details?.portrait_url].map(safeSource).find(Boolean);
  const knownWikipediaTitle = /(?:cristiano|ronaldo|رونالدو)/i.test(playerName) ? 'Cristiano_Ronaldo'
    : /(?:lionel|messi|ميسي)/i.test(playerName) ? 'Lionel_Messi'
    : /(?:neymar|نيمار)/i.test(playerName) ? 'Neymar' : undefined;
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
    if (knownWikipediaTitle) {
      fetch('https://en.wikipedia.org/api/rest_v1/page/summary/' + knownWikipediaTitle, { signal: controller.signal })
        .then(response => response.ok ? response.json() : null)
        .then(payload => {
          const source = safeSource(payload?.thumbnail?.source);
          if (!controller.signal.aborted && source) setWikiPhoto(previous => previous || source);
        }).catch(() => {});
    }
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

  const showCareer = Boolean(careerSource) && (view === 'career' || (view === null && (careerFirst || !season)));
  const showSeason = Boolean(season) && (view === 'season' || (view === null && !showCareer));
  const surface = isDark ? 'bg-[#183b2b] border-emerald-700/40 text-white' : 'bg-[#f0f7f2] border-emerald-800/15 text-[#153c29]';
  const metric = (label: string, value: string | number | undefined) => (
    <div key={label} className={`min-w-0 rounded-xl border px-1.5 py-2 sm:p-3 text-center ${surface}`}>
      <dd className="text-base sm:text-xl font-extrabold tabular-nums">{value ?? '—'}</dd>
      <dt className="mt-1 text-[10px] sm:text-[11px] leading-4 sm:leading-5 opacity-80 break-words">{label}</dt>
    </div>
  );
  return (
    <section dir="rtl" className="w-full min-w-0 max-w-full overflow-hidden space-y-3 sm:space-y-4 text-inherit">
      <div className="flex items-center gap-3 sm:gap-4 rounded-2xl border border-emerald-700/20 bg-emerald-800/5 p-2.5 sm:p-3">
        {visiblePhoto ? (
          <img src={visiblePhoto} alt={`صورة ${playerName}`} loading="lazy" referrerPolicy="no-referrer"
            onError={() => setPhotoFailed(true)}
            className="h-24 w-20 sm:h-36 sm:w-28 shrink-0 rounded-xl bg-black/10 object-cover object-top" />
        ) : null}
        <div className="min-w-0 flex-1">
          <h2 className="text-base sm:text-xl font-extrabold leading-snug break-words">{playerName}</h2>
          <p className="mt-1 text-xs sm:text-sm opacity-80 break-words">{[details?.club, details?.nationality].filter(Boolean).join(' · ')}</p>
        </div>
      </div>

      {careerSource && season && (
        <div className="flex gap-1.5 rounded-xl border border-emerald-700/20 p-1" role="group" aria-label="نطاق إحصائيات اللاعب">
          <button type="button" aria-pressed={showCareer} onClick={() => setView('career')} className={`flex-1 rounded-lg px-2 py-2 text-xs font-bold ${showCareer ? 'bg-emerald-700 text-white' : 'hover:bg-emerald-700/10'}`}>المسيرة كاملة</button>
          <button type="button" aria-pressed={showSeason} onClick={() => setView('season')} className={`flex-1 rounded-lg px-2 py-2 text-xs font-bold ${showSeason ? 'bg-emerald-700 text-white' : 'hover:bg-emerald-700/10'}`}>المواسم</button>
        </div>
      )}
      {showCareer && (
        <div className="space-y-2">
          <h3 className="font-bold">إحصائيات المسيرة</h3>
          <dl className="grid grid-cols-3 gap-1.5 sm:gap-2">
            {careerHeadline.map(({ label, value }) => metric(label, value))}
          </dl>
          <p className="text-[11px] leading-5 opacity-75">حسب نطاق المصدر الموثق، ولا تُجمع إحصائيات الدوريات مع جميع المسابقات.</p>
        </div>
      )}

      {showSeason && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-bold">إحصائيات موسم <bdi dir="ltr" className="inline-block">{season}</bdi></h3>
            <label className="flex items-center gap-2 text-xs">الموسم
              <select disabled={available.length < 2} className="max-w-32 rounded-lg border border-gray-500 bg-transparent p-2" value={season}
                onChange={event => setSelection(event.target.value)}>
                {(available.length ? available : [season]).map(value => <option className="text-gray-900" key={value} value={value}>{value}</option>)}
              </select>
            </label>
          </div>
          {verifiedSeasonTotal && (
            <div className="space-y-2">
              <p className="text-xs font-semibold opacity-80">{verifiedSeasonTotal.team} · جميع البطولات الرسمية هذا الموسم</p>
              <dl className="grid grid-cols-3 gap-1.5 sm:gap-2">
                {primaryLabels.map(label => metric(label, verifiedSeasonTotal.numbers.find(item => item.label === label)?.value))}
              </dl>
            </div>
          )}
          {!verifiedSeasonTotal && competitions.length > 0 && <p className="text-[11px] opacity-75">إجمالي الموسم بجميع البطولات غير متاح بعد. التفاصيل أدناه تخص كل بطولة منفردة، وليست إجمالي الموسم.</p>}
          {competitions.length ? competitions.filter(item => item !== verifiedSeasonTotal).map(({ team, competition, numbers }, index) => (
            <div key={index} className="space-y-2">
              <p className="text-xs opacity-70">{team} · {competition} (هذه البطولة فقط)</p>
              <dl className="grid grid-cols-3 gap-1.5 sm:gap-2">
                {primaryLabels.map(label => metric(label, numbers.find(item => item.label === label)?.value))}
              </dl>
            </div>
          )) : verifiedSeasonTotal ? null : stats.length ? (
            <div className="space-y-2">
              <p className="text-xs opacity-75">إحصائيات الدوري فقط من المصدر الاحتياطي؛ إجمالي الموسم بجميع البطولات غير متاح بعد.</p>
              <dl className="grid grid-cols-3 gap-1.5 sm:gap-2">
                {primaryLabels.map(label => metric(label, stats.find(item => item.label === label)?.value))}
              </dl>
            </div>
          ) : (
            <div className="space-y-2">
              <dl className="grid grid-cols-3 gap-1.5 sm:gap-2">
                {primaryLabels.map(label => metric(label, undefined))}
              </dl>
              <p role="status" className="text-xs opacity-65">{hasSeasonSummary ? seasonSummary : current ? 'لم يتم التحقق من إحصائيات الموسم بعد.' : 'جاري التحقق من أرقام الموسم…'}</p>
            </div>
          )}
        </div>
      )}

      {(trophyCount || contractDate) && (
        <div className="grid grid-cols-2 gap-2">
          {trophyCount && metric('البطولات الجماعية', trophyCount)}
          {contractDate && metric(`نهاية عقد ${currentClub}`, contractDate)}
        </div>
      )}

      {honours.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-bold">البطولات والإنجازات</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {honours.map(({ label, value }) => (
              <div key={label} className={`rounded-xl border p-3 ${surface}`}>
                <h4 className="mb-1 text-sm font-bold">{label}</h4>
                <p className="whitespace-pre-line break-words text-sm leading-6 opacity-85">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {facts.filter(fact => !['إجمالي المسيرة', 'أرقام الموسم المختار', 'الألقاب'].includes(fact.label)).length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {facts.filter(fact => !['إجمالي المسيرة', 'أرقام الموسم المختار', 'الألقاب'].includes(fact.label)).map(({ label, value }) => (
            <div key={label} className={`rounded-xl border p-3 ${surface}`}>
              <h4 className="text-xs opacity-65">{label}</h4>
              <p className="mt-2 break-words text-sm font-semibold leading-6">{value}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
