import type { BoardPlayer } from './tactical-lessons';
export const MAX_PLAYERS_PER_SIDE = 11;
export function addBoardPlayers(players: BoardPlayer[], side: BoardPlayer['side'], count: number): { players: BoardPlayer[]; added: string[]; error: string } {
  if (!Number.isInteger(count) || count < 1 || count > MAX_PLAYERS_PER_SIDE) return { players, added: [], error: 'اختر عدداً من 1 إلى 11.' };
  const current = players.filter(p => p.side === side);
  if (current.length + count > MAX_PLAYERS_PER_SIDE) return { players, added: [], error: `المتاح لهذا الفريق ${MAX_PLAYERS_PER_SIDE - current.length} لاعب؛ الحد 11 لكل فريق.` };
  const next = players.map(p => ({ ...p }));
  const added: string[] = [];
  for (let i = 0; i < count; i++) {
    let serial = 1;
    while (next.some(p => p.id === `custom-${serial}`)) serial++;
    let number = 1;
    while (next.some(p => p.side === side && p.number === String(number))) number++;
    const id = `custom-${serial}`;
    const slot = current.length + i;
    next.push({ id, number: String(number), side, role: side === 'team' ? 'لاعب مضاف' : 'منافس مضاف', x: side === 'team' ? 16 + (slot % 3) * 8 : 73 + (slot % 3) * 8, y: 10 + Math.floor(slot / 3) * 14 });
    added.push(id);
  }
  return { players: next, added, error: '' };
}
export function updateBoardPlayer(players: BoardPlayer[], id: string, patch: Partial<Pick<BoardPlayer, 'number' | 'role' | 'x' | 'y'>>): BoardPlayer[] {
  return players.map(p => p.id !== id ? p : { ...p,
    number: patch.number === undefined ? p.number : patch.number.replace(/[٠-٩]/g, d => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))).replace(/[^0-9]/g, '').slice(0, 2),
    role: patch.role === undefined ? p.role : patch.role.slice(0, 40),
    x: patch.x === undefined || !Number.isFinite(patch.x) ? p.x : Math.max(4, Math.min(101, patch.x)),
    y: patch.y === undefined || !Number.isFinite(patch.y) ? p.y : Math.max(4, Math.min(64, patch.y)),
  });
}
export function removeBoardPlayer(players: BoardPlayer[], id: string): BoardPlayer[] { return players.filter(p => p.id !== id); }
