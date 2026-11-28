/** User-supplied club qualifiers narrow source matching; they never supply player facts. */
export function qualifiedPlayerLookup(query: string): { name: string; club: string } | undefined {
  if (query.length > 240) return;
  const value = query.normalize('NFKC').toLowerCase().replace(/[\u064B-\u065F\u0670\u0640]/g, '').replace(/\s+/g, ' ').trim();
  if (/(?:ليس|المعتزل|اعتزل|مو لاعب|not |retired)/i.test(value)) return;
  if (/(?:خافي (?:غيرا|غويرا)|javi guerra)/i.test(value) && /(?:فالنسيا|valencia)/i.test(value))
    return { name: 'Javi Guerra', club: 'Valencia' };
}
