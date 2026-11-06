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
  const season = available.includes(selection) ? selection : available[0];
  const [result, setResult] = useState<{ name: string; season: string; row?: StatRow }>();
  const current = result?.name === playerName && result.season === season ? result : undefined;

  const seasonKey = season ? 'season_' + season.replace('-', '_') : '';
  const seasonSummary = seasonKey ? details?.[seasonKey] : undefined;
  const seasonSource = seasonKey ? details?.[seasonKey + '_source'] : undefined;
  const competitionLabels = ['المشاركات', 'أساسي', 'دخل بديلاً', 'الدقائق', 'الأهداف', 'الصناعات', 'الإنذارات', 'الطرد'];
  const competitions = (details?.[seasonKey + '_competitions'] ?? '').split(';').flatMap(line => {
    const [team, competition, source, ...values] = line.split('|').map(value => value.trim());
    const href = safeSource(source);
    if (!team || !competition || !href || values.length !== competitionLabels.length) return [];
    const numbers = values.flatMap((value, index) =>
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

  const playerImage = safeSource(details?.image_url ?? details?.photo_url ?? details?.player_image ?? details?.image);
  const factIcons: Record<string, string> = { 'إجمالي المسيرة': '⚽', 'الألقاب': '🏆', 'أرقام الموسم المختار': '📊', 'انتهاء العقد': '📅', 'القيمة السوقية': '💶', 'الراتب المنشور': '💰' };
  const maxStat = Math.max(1, ...stats.map(item => Number(item.value)).filter(Number.isFinite));

  const facts = [
    { label: 'إجمالي المسيرة', value: details?.career_summary, source: details?.career_source },
    { label: 'الألقاب', value: details?.honours, source: details?.honours_source },
    { label: 'أرقام الموسم المختار', value: competitions.length ? undefined : seasonSummary, source: seasonSource },
    { label: 'انتهاء العقد', value: details?.contract_end, source: details?.contract_source },
    { label: 'القيمة السوقية', value: details?.market_date && details?.market_value
      ? `${details.market_value} · ${details.market_date}` : undefined, source: details?.market_source },
    { label: 'الراتب المنشور', value: details?.salary, source: details?.salary_source },
  ].flatMap(({ label, value, source }) => {
    const href = safeSource(source);
    return value?.trim() && href ? [{ label, value, source: href }] : [];
  });
  if (!facts.length && !competitions.length && (!season || (current && !stats.length && available.length === 1))) return null;

  return (
    <section dir="rtl" className={`my-5 min-w-0 space-y-4 ${isDark ? 'text-white' : 'text-black'}` }>
      <header className="flex flex-wrap items-start justify-between gap-4">
        {playerImage && <img src={playerImage} alt={`صورة ${playerName}`} loading="lazy" referrerPolicy="no-referrer" className="h-32 w-28 rounded-2xl object-cover sm:h-40 sm:w-36" />}
        <div>
          <p className="text-sm text-emerald-500">⚽ {season && !hasSeasonSummary ? 'إحصائيات الموسم · FBref' : 'المسيرة الكروية'}</p>
          <h2 className="text-xl font-bold text-emerald-600">{playerName}</h2>
        </div>
        {season && (
          <label className="flex items-center gap-2 text-sm">
            الموسم
            <select className="rounded-lg border border-gray-500 bg-transparent p-2" value={season} onChange={event => setSelection(event.target.value)}>
              {available.map(value => <option className="text-gray-900" key={value} value={value}>{value}</option>)}
            </select>
          </label>
        )}
      </header>
      {facts.length > 0 && (
        <dl className="mt-4 divide-y divide-emerald-500/15">
          {facts.map(({ label, value, source }) => (
            <div key={label} className="py-3">
              <dt className="text-sm font-semibold text-emerald-500">{factIcons[label] ?? '✦'} {label}</dt>
              <dd className="mt-1 leading-8">{value}</dd>

            </div>
          ))}
        </dl>
      )}
      {competitions.map(({ team, competition, href, numbers }, index) => (
        <section key={index} className="mt-4 border-t border-emerald-500/20 pt-4">
          <h3 className="font-bold text-emerald-500">🏟️ {team} · {competition}</h3>
          <dl className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {numbers.map(({ label, value }) => (
              <div key={label}><dt className="text-sm opacity-75">{label}</dt><dd className="font-bold">{value}</dd></div>
            ))}
          </dl>

        </section>
      ))}
      {stats.length ? (
        <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {stats.map(({ label, value }) => (
            <div key={label} className="border-b border-emerald-500/20 py-3">
              <dt className="text-sm opacity-75">{label}</dt>
              <dd className="text-2xl font-bold text-emerald-500">{value}</dd>
            </div>
          ))}
        </dl>
      ) : season && !hasSeasonSummary ? (
        <p className="mt-4 text-sm opacity-75" role="status">
          {current ? 'أرقام هذا الموسم غير متاحة.' : 'جاري جلب أرقام الموسم…'}
        </p>
      ) : null}
    </section>
  );
}
