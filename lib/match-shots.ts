const outcomes: Record<string,string> = {
  goal: 'هدف', 'goal-header': 'هدف بالرأس', 'goal-free-kick': 'هدف من ركلة حرة', 'penalty-scored': 'هدف من ركلة جزاء',
  'shot-on-target': 'تسديدة على المرمى', 'shot-off-target': 'تسديدة خارج المرمى',
  'shot-blocked': 'تسديدة محجوبة', 'shot-hit-woodwork': 'تسديدة في القائم أو العارضة',
  'penalty-missed': 'ركلة جزاء ضائعة', 'penalty-saved': 'ركلة جزاء تصدى لها الحارس',
};
const coordinate = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100;
const normalize = (value: unknown) => typeof value === 'string' ? value.trim().toLowerCase() : '';
type Team = { id: string; name: string };

export function matchCommentaryShots(commentary: unknown, home: Team, away: Team) {
  if (!Array.isArray(commentary)) return [];
  const seen = new Set<string>();
  return commentary.flatMap(entry => {
    const play = entry?.play;
    const kind = typeof play?.type?.type === 'string' ? play.type.type.replace(/-+/g,'-') : '';
    const x = play?.fieldPositionX;
    const y = play?.fieldPositionY;
    if (!Object.hasOwn(outcomes, kind) || !coordinate(x) || !coordinate(y)
      || typeof play.id !== 'string' || !play.id || seen.has(play.id) || !(play.period?.number >= 1 && play.period.number <= 4)) return [];
    const id = play.team?.id == null ? '' : String(play.team.id);
    const name = normalize(play.team?.displayName);
    const matches = (team: Team) => id ? id === team.id : !!name && name === normalize(team.name);
    const side = matches(home) ? 'home' as const : matches(away) ? 'away' as const : null;
    if (!side) return [];
    seen.add(play.id);
    return [{ id: play.id, x, y, side, xg: null, goal: kind.startsWith('goal') || kind === 'penalty-scored',
      outcome: outcomes[kind], playerName: String(play.participants?.[0]?.athlete?.displayName || ''),
      minute: String(play.clock?.displayValue || ''), period: play.period.number as number }];
  });
}
