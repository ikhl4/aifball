/** Public provider data only. Never infer a player's identity from the first search hit. */
import { footballNameForSearch } from './football-names-ar';
import { playerNameSearchHint } from './chat-intent';
import { qualifiedPlayerLookup } from './player-identity';
export type PlayerSeasonRow = {
  team: string; competition: string; league: string; source: string;
  matches: number | null; starts: number | null; substitutes: number | null;
  minutes: number | null; goals: number | null; assists: number | null;
  yellows: number | null; reds: number | null;
};
export type PlayerPhoto = { url: string; source: string; artist: string; license: string; licenseUrl?: string };
export type PlayerData = {
  status: 'found' | 'not_found' | 'ambiguous' | 'unavailable';
  canonicalName?: string; arabicName?: string; club?: string; nationality?: string;
  season: string; rows: PlayerSeasonRow[]; photo?: PlayerPhoto; source?: string; checkedAt: string;
};
type ObjectData = Record<string, any>;
const list = (value: unknown): ObjectData[] => Array.isArray(value) ? value.filter(x => x && typeof x === 'object') : [];
export const normalizePlayerName = (name: string) => name.normalize('NFKD').toLowerCase()
  .replace(/[\u0300-\u036f\u064b-\u065f\u0670\u0640]/g, '').replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي')
  .replace(/ø/g, 'o').replace(/ł/g, 'l').replace(/đ/g, 'd').replace(/ß/g, 'ss')
  .replace(/[^\p{L}\p{N}]+/gu, ' ').trim().replace(/\s+/g, ' ');
// Search spellings only: an alias never supplies identity, statistics or a photo.
// ESPN's exact unique athlete match and detail checks still apply below.
const searchSpellings: Record<string, string> = {
  'مارتن اوديغارد': 'Martin Ødegaard', 'مارتين اوديغارد': 'Martin Ødegaard',
  'مارتن اوديجارد': 'Martin Ødegaard', 'مارتين اوديجارد': 'Martin Ødegaard',
  'سكوت مكتوميناي': 'Scott McTominay', 'سكوت ماكتوميناي': 'Scott McTominay',
  'سكوت ماكتومناي': 'Scott McTominay',
  // This spelling remains ambiguous until the provider establishes one identity.
  'خافي غيرا': 'Javi Guerra', 'خافي غويرا': 'Javi Guerra',
};
export const playerLookupName = (name: string) => playerNameSearchHint(name) || searchSpellings[normalizePlayerName(name)] || footballNameForSearch(name);
export function currentFootballSeason(now = new Date()) {
  const year = now.getUTCFullYear() - (now.getUTCMonth() < 6 ? 1 : 0);
  return `${year}-${year + 1}`;
}
export function seasonMatches(label: unknown, season: string): boolean {
  if (typeof label !== 'string') return false;
  const [start, end] = season.split('-');
  // A calendar season (MLS etc.) remains a calendar season, never relabelled 2026-27.
  return end ? new RegExp(`\\b${start}[-–/](${end}|${end.slice(-2)})\\b`).test(label)
    : new RegExp(`\\b${start}\\b`).test(label) && !/\d{4}[-–/]\d{2,4}/.test(label);
}
export function uniqueEspnPlayer(payload: ObjectData, names: string[], clubHint?: string) {
  const exact = new Set(names.map(normalizePlayerName));
  const candidates = list(payload?.items).filter(item => item.type === 'player' && item.sport === 'soccer' &&
    /^\d{1,12}$/.test(String(item.id)) && [item.displayName, item.fullName].some(name => typeof name === 'string' && exact.has(normalizePlayerName(name))));
  const clubName = (value: string) => normalizePlayerName(value).replace(/\b(?:cf|fc)\b/g, '').trim();
  const scoped = clubHint ? candidates.filter(item => list(item.teamRelationships).some(relation =>
    relation.core?.isNational === false && typeof relation.core?.displayName === 'string' &&
    clubName(relation.core.displayName) === clubName(clubHint))) : candidates;
  const ids = [...new Set(scoped.map(item => String(item.id)))];
  return { player: ids.length === 1 ? scoped.find(item => String(item.id) === ids[0]) : undefined, ambiguous: ids.length > 1 };
}
const integer = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '' || !/^\d+$/.test(String(value))) return null;
  const n = Number(value); return Number.isSafeInteger(n) && n <= 100000 ? n : null;
};
export function normalizePlayerRows(overview: ObjectData, detail: ObjectData, clubId: string, season: string): PlayerSeasonRow[] {
  const athlete = detail?.athlete, statistics = overview?.statistics;
  const names = Array.isArray(statistics?.names) ? statistics.names : [];
  if (!clubId || !athlete || !Array.isArray(statistics?.splits)) return [];
  const teamOptions = list(list(statistics.filters).find(f => f.name === 'team')?.options);
  const teamName = teamOptions.find(t => String(t.value) === clubId)?.displayValue || (String(athlete.team?.id) === clubId ? athlete.team?.displayName : '');
  if (typeof teamName !== 'string' || !teamName) return [];
  const rows: PlayerSeasonRow[] = [];
  for (const split of statistics.splits) {
    if (String(split?.teamId) !== clubId || !seasonMatches(split.displayName, season) || !/^[a-z0-9._-]{1,50}$/.test(split.leagueSlug || '') || !Array.isArray(split.stats) || split.stats.length !== names.length) continue;
    const values = Object.fromEntries(names.map((name: string, i: number) => [name, integer(split.stats[i])]));
    const summary = athlete.statsSummary;
    // The summary can supply appearances only when team, league and season all match this split.
    if (String(athlete.team?.id) === clubId && detail.league?.slug === split.leagueSlug &&
      seasonMatches(detail.season?.displayName, season) && seasonMatches(summary?.displayName, season)) {
      for (const stat of list(summary.statistics)) {
        if (stat.name === 'starts-subIns') {
          const pair = String(stat.displayValue || '').match(/^(\d+)\s*\((\d+)\)$/);
          if (pair) { values.starts = integer(pair[1]); values.subIns = integer(pair[2]); }
        } else if (values[stat.name] === undefined) values[stat.name] = integer(stat.displayValue);
      }
    }
    const starts = values.starts ?? null, substitutes = values.subIns ?? null;
    const matches = values.appearances ?? (starts !== null && substitutes !== null ? starts + substitutes : null);
    const row: PlayerSeasonRow = { team: teamName, competition: split.displayName, league: split.leagueSlug,
      source: `https://www.espn.com/soccer/player/stats/_/id/${athlete.id}/league/${split.leagueSlug}`,
      matches, starts, substitutes, minutes: values.minutes ?? values.minutesPlayed ?? null,
      goals: values.totalGoals ?? null, assists: values.goalAssists ?? null,
      yellows: values.yellowCards ?? null, reds: values.redCards ?? null };
    if ((matches !== null && (matches > 100 || (starts !== null && starts > matches) || (substitutes !== null && substitutes > matches))) ||
      (row.goals !== null && matches !== null && row.goals > matches * 8) ||
      (row.assists !== null && matches !== null && row.assists > matches * 8) ||
      (row.minutes !== null && matches !== null && row.minutes > matches * 130)) continue;
    if ([row.matches, row.goals, row.assists].every(value => value === null) || rows.some(r => r.league === row.league)) continue;
    rows.push(row);
  }
  // These are per-competition rows. Coverage of every cup is not established, so never sum a season total.
  return rows;
}
export function scopedRosterRow(payload: ObjectData, row: PlayerSeasonRow, athleteId: string, clubId: string, season: string): PlayerSeasonRow | undefined {
  const competitionName = (label: string) => normalizePlayerName(label.replace(/\b\d{4}[-–/]\d{2,4}\b/g, '')).replace(/\buefa\b/g, '').trim();
  const expected = competitionName(row.competition), actual = competitionName(payload.season?.displayName || '');
  if (String(payload.team?.id) !== clubId || payload.team?.isNational !== false || !seasonMatches(payload.season?.displayName, season) ||
    !expected || !actual || !(expected.includes(actual) || actual.includes(expected))) return undefined;
  const players = list(payload.athletes).filter(a => String(a.id) === athleteId);
  if (players.length !== 1) return undefined;
  const categories = players[0].statistics?.splits?.categories;
  const numbers = Object.fromEntries(list(categories).flatMap(c => list(c.stats)).map(s => [s.name, integer(s.displayValue)]));
  const matches = numbers.appearances ?? null, substitutes = numbers.subIns ?? row.substitutes;
  if (matches === null || matches > 100 || (substitutes !== null && substitutes > matches)) return undefined;
  // The roster fills gaps in this exact scope; omitted fields must not erase
  // verified overview figures. Explicit zero remains a real value.
  const goals = numbers.totalGoals ?? row.goals, assists = numbers.goalAssists ?? row.assists;
  if (goals !== null && goals > matches * 8 || assists !== null && assists > matches * 8) return undefined;
  const starts = substitutes !== null ? matches - substitutes : row.starts;
  const minutes = numbers.minutes ?? numbers.minutesPlayed ?? row.minutes;
  if (starts !== null && starts > matches || minutes !== null && minutes > matches * 130) return undefined;
  return { ...row, matches, substitutes, starts, goals, assists, minutes,
    yellows: numbers.yellowCards ?? row.yellows, reds: numbers.redCards ?? row.reds };
}
const safeUrl = (value: unknown, hosts: string[]) => {
  try { const u = new URL(String(value)); return u.protocol === 'https:' && !u.username && !u.password && hosts.includes(u.hostname) ? u.href : undefined; } catch { return undefined; }
};
const text = (s: unknown) => typeof s === 'string' ? s.replace(/<[^>]*>/g, '').replace(/&(?:nbsp|amp);/g, ' ').trim().slice(0, 250) : '';
export function normalizeCommonsPhoto(payload: ObjectData): PlayerPhoto | undefined {
  const pages = Object.values(payload?.query?.pages || {}) as ObjectData[];
  const file = pages[0]?.imageinfo?.[0], metadata = file?.extmetadata;
  const url = safeUrl(file?.thumburl || file?.url, ['upload.wikimedia.org', 'thumb.wikimedia.org']);
  const source = safeUrl(file?.descriptionurl, ['commons.wikimedia.org']);
  const license = text(metadata?.LicenseShortName?.value), artist = text(metadata?.Artist?.value);
  // A known file and usable attribution are required; do not treat every public photo as freely reusable.
  if (!url || !source || !artist || !/^(?:CC (?:BY(?:-SA)?(?: [\d.]+)?|0)|Public domain)/i.test(license)) return undefined;
  const licenseAddress = typeof metadata?.LicenseUrl?.value === 'string' ? metadata.LicenseUrl.value.replace(/^http:\/\/(www\.)?creativecommons\.org\//, 'https://creativecommons.org/') : undefined;
  return { url, source, artist, license, licenseUrl: safeUrl(licenseAddress, ['creativecommons.org', 'www.creativecommons.org']) };
}
async function json(url: string, signal: AbortSignal): Promise<ObjectData> {
  const response = await fetch(url, { signal, headers: { 'User-Agent': 'AiFBall/1.0 (https://aifball.com; football profiles)', Accept: 'application/json' }, next: { revalidate: 600 } });
  if (!response.ok) throw new Error('PROVIDER_UNAVAILABLE');
  const result = await response.json();
  if (!result || typeof result !== 'object' || Array.isArray(result) || result.error) throw new Error('PROVIDER_SCHEMA');
  return result;
}
const wikidata = (params: Record<string, string>) => 'https://www.wikidata.org/w/api.php?' + new URLSearchParams({ format: 'json', ...params });
async function entityForName(name: string, signal: AbortSignal) {
  const language = /[\u0600-\u06ff]/.test(name) ? 'ar' : 'en';
  const search = await json(wikidata({ action: 'wbsearchentities', search: name, language, uselang: 'en', limit: '4' }), signal);
  const matches = list(search.search).filter(item => /^Q\d+$/.test(item.id) &&
    [item.match?.text, item.label].some(label => typeof label === 'string' && normalizePlayerName(label) === normalizePlayerName(name)) && /football|soccer|كرة قدم/i.test(item.description || ''));
  if (matches.length > 1) return { ambiguous: true };
  if (matches.length !== 1) return undefined;
  const data = await json(wikidata({ action: 'wbgetentities', ids: matches[0].id, props: 'labels|claims|aliases', languages: 'ar|en' }), signal);
  const entity = data.entities?.[matches[0].id];
  if (!list(entity?.claims?.P31).some(c => c.mainsnak?.datavalue?.value?.id === 'Q5')) return undefined;
  return entity;
}
async function commonsPhoto(entity: ObjectData | undefined, signal: AbortSignal) {
  const filename = list(entity?.claims?.P18).find(c => c.rank !== 'deprecated')?.mainsnak?.datavalue?.value;
  if (typeof filename !== 'string' || filename.length > 240) return undefined;
  const params = new URLSearchParams({ action: 'query', format: 'json', prop: 'imageinfo', titles: 'File:' + filename,
    iiprop: 'url|extmetadata', iiurlwidth: '420', iiextmetadatafilter: 'Artist|LicenseShortName|LicenseUrl' });
  return normalizeCommonsPhoto(await json('https://commons.wikimedia.org/w/api.php?' + params, signal));
}
const cache = new Map<string, { until: number; value: PlayerData }>();
const pending = new Map<string, Promise<PlayerData>>();
export async function loadPlayerData(name: string, season = currentFootballSeason()): Promise<PlayerData> {
  const qualifier = qualifiedPlayerLookup(name);
  const lookup = qualifier?.name || playerLookupName(name);
  const key = normalizePlayerName(lookup) + ':' + season + ':' + (qualifier?.club || '');
  const existing = cache.get(key); if (existing && existing.until > Date.now()) return existing.value;
  const inflight = pending.get(key); if (inflight) return inflight;
  if (pending.size >= 64) return { status: 'unavailable', season, rows: [], checkedAt: new Date().toISOString() };
  const task = lookupPlayerData(lookup, season, qualifier?.club).then(value => {
    if (cache.size >= 128) cache.delete(cache.keys().next().value!);
    if (value.status !== 'unavailable') cache.set(key, { until: Date.now() + (value.status === 'found' && value.rows.length > 0 ? 600000 : 15000), value });
    return value;
  }).finally(() => pending.delete(key));
  pending.set(key, task); return task;
}
async function lookupPlayerData(name: string, season: string, clubHint?: string): Promise<PlayerData> {
  const signal = AbortSignal.timeout(12000);
  const result: PlayerData = { status: 'not_found', season, rows: [], checkedAt: new Date().toISOString() };
  try {
    // English hints can search ESPN immediately while multilingual identity/photo lookup runs in parallel.
    const entityTask = entityForName(name, AbortSignal.any([signal, AbortSignal.timeout(8000)])).catch(() => undefined);
    const directSearch = !/[\u0600-\u06ff]/.test(name) ? json('https://site.web.api.espn.com/apis/common/v3/search?' + new URLSearchParams({ query: name, type: 'player', sport: 'soccer', limit: '4' }), signal) : undefined;
    const entity = directSearch ? undefined : await entityTask;
    const canonical = entity?.labels?.en?.value || name;
    const search = directSearch ? await directSearch : await json('https://site.web.api.espn.com/apis/common/v3/search?' + new URLSearchParams({ query: canonical, type: 'player', sport: 'soccer', limit: '4' }), signal);
    let selected = uniqueEspnPlayer(search, [canonical, name], clubHint);
    if (!selected.player && !selected.ambiguous) {
      const aliases = await entityTask;
      if (aliases?.ambiguous && !clubHint) return { ...result, status: 'ambiguous' };
      const names = [aliases?.labels?.en?.value, ...list(aliases?.aliases?.en).map(alias => alias.value)].filter((value): value is string => typeof value === 'string');
      selected = uniqueEspnPlayer(search, [canonical, name, ...names], clubHint);
    }
    if (!selected.player) return { ...result, status: selected.ambiguous ? 'ambiguous' : 'not_found' };
    const candidate = selected.player;
    const league = /^[a-z0-9._-]{1,50}$/.test(candidate.league || '') ? candidate.league : null;
    if (!league) return result;
    const endpoint = `https://site.web.api.espn.com/apis/common/v3/sports/soccer/${league}/athletes/${candidate.id}`;
    // A club-qualified ESPN identity does not prove a same-name Wikidata photo identity.
    const photoTask = clubHint ? Promise.resolve(undefined) : entityTask.then(e => commonsPhoto(e, signal)).catch(() => undefined);
    const [detail, overview] = await Promise.all([json(endpoint + '?season=' + season.split('-')[0], signal), json(endpoint + '/overview?season=' + season.split('-')[0], signal).catch(() => ({}))]);
    const athlete = detail.athlete;
    if (String(athlete?.id) !== String(candidate.id) || normalizePlayerName(athlete.displayName || '') !== normalizePlayerName(candidate.displayName)) return result;
    const club = list(candidate.teamRelationships).map(r => r.core).find(t => t?.isNational === false) || (athlete.team?.isNational === false ? athlete.team : undefined);
    if (clubHint && (!club || (athlete.team?.id && String(athlete.team.id) !== String(club.id)))) return result;
    let rows = normalizePlayerRows(overview, detail, String(club?.id || ''), season);
    // Retrieve explicitly scoped appearance summaries in parallel, never treating starts as matches.
    const summaries = await Promise.all(rows.filter(row => row.matches === null).slice(0, 4).map(async row => {
      try {
        const roster = await json(`https://site.api.espn.com/apis/site/v2/sports/soccer/${row.league}/teams/${club.id}/roster?season=${season.split('-')[0]}`, signal);
        return scopedRosterRow(roster, row, String(candidate.id), String(club.id), season);
      } catch { return undefined; }
    }));
    rows = rows.map(row => summaries.find(scoped => scoped?.league === row.league && scoped.matches !== null) || row);
    const resolvedEntity = await entityTask;
    if (resolvedEntity?.ambiguous && !clubHint) return { ...result, status: 'ambiguous' };
    const photo = await photoTask;
    return { ...result, status: 'found', canonicalName: athlete.displayName,
      arabicName: clubHint ? undefined : resolvedEntity?.labels?.ar?.value, club: club?.displayName,
      nationality: athlete.citizenship, rows, photo,
      source: `https://www.espn.com/soccer/player/_/id/${candidate.id}` };
  } catch { return { ...result, status: 'unavailable' }; }
}
