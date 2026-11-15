import { matchNameInArabic } from './match-display-ar';
import type { Scores365Report } from './scores365-report';

const nameKey = (name: string) => name.toLowerCase().replace(/ø/g, 'o').replace(/ł/g, 'l')
  .normalize('NFKD').replace(/\p{M}/gu, '').replace(/[^\p{L}\p{N}]/gu, '');

const sameName = (a: string, b: string) => nameKey(a) === nameKey(b);
const sameTeam = (a: string, b: string) => sameName(a, b) || sameName(matchNameInArabic(a), matchNameInArabic(b));
const numericId = (value: unknown) => /^\d{1,12}$/.test(String(value)) && Number(value) > 0;
const slug = (value: unknown) => typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) ? value : null;

export type HeatmapMatch = { home: string; away: string; date: string };

function sameKickoff(expected: string, actual: unknown) {
  return typeof actual === 'string' && Number.isFinite(Date.parse(expected)) &&
    Math.abs(Date.parse(expected) - Date.parse(actual)) <= 5 * 60 * 1000;
}

export function resolveHeatmapSource(raw: any, match: HeatmapMatch): string | null {
  const games = Array.isArray(raw?.games) ? raw.games : [];
  const candidates = games.filter((g: any) => g?.sportId === 1 && numericId(g.id) && numericId(g.competitionId) &&
    typeof g.homeCompetitor?.name === 'string' && typeof g.awayCompetitor?.name === 'string' &&
    sameTeam(match.home, g.homeCompetitor.name) && sameTeam(match.away, g.awayCompetitor.name) &&
    sameKickoff(match.date, g.startTime));
  if (candidates.length !== 1) return null;
  const game = candidates[0];
  const teams = [game.homeCompetitor, game.awayCompetitor].sort((a, b) => a.id - b.id);
  if (!teams.every(team => numericId(team.id) && slug(team.nameForURL)) || teams[0].id === teams[1].id) return null;
  const competitions = Array.isArray(raw.competitions) ? raw.competitions : [];
  const competition = slug(competitions.find((item: any) => item?.id === game.competitionId)?.nameForURL);
  if (!competition) return null;
  return `https://www.365scores.com/football/match/${competition}-${game.competitionId}/${teams[0].nameForURL}-${teams[1].nameForURL}-${teams[0].id}-${teams[1].id}-${game.competitionId}#id=${game.id}`;
}

export function heatmapPlayer(report: Scores365Report, match: HeatmapMatch, side: 'home' | 'away', player: string) {
  if (!sameTeam(report.home.name, match.home) || !sameTeam(report.away.name, match.away) ||
      !sameKickoff(match.date, report.date)) return null;
  const players = report[side].players.filter(candidate => sameName(candidate.name, player));
  return players.length === 1 && players[0].hasHeatmap ? players[0] : null;
}
