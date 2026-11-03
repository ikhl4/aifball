'use client';

import { useEffect, useState } from 'react';

interface PlayerProfileProps {
  playerName: string;
  seasons?: string;
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

export default function PlayerProfile({ playerName, seasons, isDark = true }: PlayerProfileProps) {
  const available = [...new Set((seasons ?? '').split(',').map(value => value.trim())
    .filter(value => /^\d{4}(?:-\d{4})?$/.test(value)))].sort().reverse();
  const [selection, setSelection] = useState('');
  const season = available.includes(selection) ? selection : available[0];
  const [result, setResult] = useState<{ name: string; season: string; row?: StatRow }>();
  const current = result?.name === playerName && result.season === season ? result : undefined;

  useEffect(() => {
    if (!season) return;
    const controller = new AbortController();
    const params = new URLSearchParams({ source: 'fbref', action: 'player-stats', playerName, season });
    async function load() {
      let row: StatRow | undefined;
      try {
        const response = await fetch('/api/advanced?' + params, { signal: controller.signal });
        if (!response.ok) throw new Error('Player statistics unavailable');
        const payload = await response.json();
        if (Array.isArray(payload.data)) {
          const matches = payload.data.filter((entry: StatRow | null) =>
            entry && String(read(entry, ['player', 'Player', 'player_name']) ?? '')
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
  }, [playerName, season]);

  const stats = current?.row
    ? fields.flatMap(([label, keys]) => {
        const value = read(current.row!, keys);
        return value === undefined ? [] : [{ label, value }];
      })
    : [];

  return (
    <section dir="rtl" className={`rounded-3xl border p-5 ${isDark ? 'bg-[#101714] border-white/10 text-white' : 'bg-white border-gray-200 text-gray-900'}`}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-emerald-500">أرقام الموسم · FBref</p>
          <h2 className="text-2xl font-bold">{playerName}</h2>
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
      {stats.length ? (
        <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {stats.map(({ label, value }) => (
            <div key={label} className="rounded-xl border border-gray-500/30 p-3">
              <dt className="text-sm opacity-75">{label}</dt>
              <dd className="text-xl font-bold">{value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="mt-4 text-sm opacity-75" role="status">
          {season && !current ? 'جاري جلب أرقام الموسم…' : 'أرقام الموسم المؤكدة غير متاحة في البطاقة.'}
        </p>
      )}
    </section>
  );
}
