// Preserve source values: absence is never converted into a zero or a player rating.
export type MatchDetails = ReturnType<typeof normalizeMatchDetails>;
const list = (v: any): any[] => Array.isArray(v) ? v : [];
const value = (v: any): string | null => typeof v === 'string' || typeof v === 'number' ? String(v) : null;
const STAT_LABELS: Record<string, string> = { possessionPct: 'الاستحواذ', totalShots: 'التسديدات', shotsOnTarget: 'التسديدات على المرمى', wonCorners: 'الركنيات', foulsCommitted: 'الأخطاء', offsides: 'التسلل', yellowCards: 'البطاقات الصفراء', redCards: 'البطاقات الحمراء', saves: 'التصديات', accuratePasses: 'التمريرات الصحيحة', totalPasses: 'إجمالي التمريرات' };
const EVENT_LABELS: Record<string, string> = { 'Goal': '⚽ هدف', 'Own Goal': 'هدف عكسي', 'Penalty - Scored': '⚽ هدف من ركلة جزاء', 'Penalty - Missed': 'ركلة جزاء ضائعة', 'Penalty - Saved': 'ركلة جزاء تصدى لها الحارس', 'Yellow Card': '🟨 بطاقة صفراء', 'Red Card': '🟥 بطاقة حمراء', 'Second Yellow Card': '🟥 إنذار ثانٍ وطرد', 'Yellow-Red Card': '🟥 إنذار ثانٍ وطرد', 'Substitution': '🔄 تبديل' };
export function normalizeMatchDetails(raw: any, eventId: string, league: string) {
  const header = raw?.header;
  const competition = list(header?.competitions).find(c => String(c.id) === eventId);
  if (String(header?.id) !== eventId || header?.league?.slug !== league || !competition) throw new Error('MATCH_IDENTITY_MISMATCH');
  const competitors = list(competition.competitors);
  const team = (side: string) => {
    const c = competitors.find(c => c.homeAway === side);
    if (!c?.team?.id) throw new Error('MATCH_TEAMS_MISSING');
    const id = String(c.team.id);
    const box = list(raw.boxscore?.teams).find(t => String(t.team?.id) === id);
    const roster = list(raw.rosters).find(t => String(t.team?.id) === id);
    return { id, name: c.team.displayName || c.team.shortDisplayName || 'الفريق غير متاح', score: value(c.score),
      formation: value(roster?.formation),
      statistics: Object.fromEntries(list(box?.statistics).map(s => [s.name, value(s.displayValue)])),
      players: list(roster?.roster).map(p => ({ id: value(p.athlete?.id), name: p.athlete?.displayName || 'اسم اللاعب غير متاح', jersey: value(p.jersey), starter: typeof p.starter === 'boolean' ? p.starter : null, position: ({ G: 'حارس', D: 'دفاع', M: 'وسط', F: 'هجوم' } as Record<string,string>)[p.position?.abbreviation] || '' })) };
  };
  const home = team('home'), away = team('away');
  if (home.id === away.id) throw new Error('MATCH_TEAMS_MISSING');
  return { eventId, league, state: value(competition.status?.type?.state), home, away,
    venue: value(raw.gameInfo?.venue?.fullName),
    statistics: Object.entries(STAT_LABELS).filter(([key]) => home.statistics[key] != null || away.statistics[key] != null).map(([key, label]) => ({ key, label, home: home.statistics[key] ?? null, away: away.statistics[key] ?? null, percent: key === 'possessionPct' })),
    events: list(raw.keyEvents).filter(e => EVENT_LABELS[e.type?.text]).map((e, i) => ({ id: value(e.id) || String(i), label: EVENT_LABELS[e.type.text], minute: value(e.clock?.displayValue), teamId: value(e.team?.id), players: list(e.participants).map(p => p.athlete?.displayName).filter((n): n is string => typeof n === 'string'), shootout: e.shootout === true })),
    fetchedAt: new Date().toISOString(), source: 'ESPN' };
}
