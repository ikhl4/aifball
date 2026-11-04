/** Verified SAFF edition IDs. Never reuse one edition's table for another season. */
const EDITIONS: Record<string, number> = { '2025-2026': 350, '2026-2027': 419 };
const LATEST_SEASON = '2026-2027';
const LEAGUE = 'ksa.jawwy.u21';

export function saffEdition(requested?: string | null) {
  const match = requested?.match(/^(20\d{2})(?:[-/](\d{2}|20\d{2}))?$/);
  const season = requested ? match ? `${match[1]}-${Number(match[1]) + 1}` : '' : LATEST_SEASON;
  if (requested && (!match || (match[2] && Number(match[2]) !== (match[2].length === 2 ? (Number(match[1]) + 1) % 100 : Number(match[1]) + 1)))) throw Error('SAFF_UNSUPPORTED_SEASON');
  const id = EDITIONS[season];
  if (!id) throw Error('SAFF_UNSUPPORTED_SEASON');
  return { season, id, url: `https://www.saff.com.sa/championship.php?id=${id}&type=all` };
}

function clean(html: string): string {
  return html.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<[^>]*>/g, ' ').replace(/&#(x[\da-f]+|\d+);/gi, (_, value: string) => {
      const code = value[0].toLowerCase() === 'x' ? parseInt(value.slice(1), 16) : Number(value);
      return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : '';
    }).replace(/&(nbsp|amp|quot|apos|lt|gt);/gi, (_, key: string) => (({nbsp:' ',amp:'&',quot:'"',apos:"'",lt:'<',gt:'>'} as Record<string, string>)[key.toLowerCase()] || ' '))
    .replace(/[٠-٩]/g, d => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/[\u200e\u200f\u202a-\u202e]/g, '').replace(/−/g, '-').replace(/\s+/g, ' ').trim();
}
const normalized = (value: string) => clean(value).replace(/[\u064b-\u065fـ]/g, '').replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه');
function integer(value: string): number | null {
  const input = clean(value).replace(/\s+/g, '');
  return /^[+-]?\d+$/.test(input) && Number.isSafeInteger(Number(input)) ? Number(input) : null;
}
function attribute(html: string, name: string): string {
  return html.match(new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'))?.slice(1).find(Boolean)?.replace(/&amp;/g, '&') || '';
}
function teamLink(cell: string): { id: string; name: string } | null {
  for (const anchor of cell.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/gi)) {
    try {
      const url = new URL(attribute(anchor[0], 'href'), 'https://www.saff.com.sa');
      const id = url.searchParams.get('id');
      const name = clean(anchor[0]);
      if (['www.saff.com.sa', 'saff.com.sa'].includes(url.hostname) && url.pathname === '/team.php' && /^\d+$/.test(id || '') && name) return { id: `saff:${id}`, name };
    } catch { /* Ignore unrelated source links. */ }
  }
  return null;
}

export function parseSaffStandings(html: string, requested?: string | null) {
  const edition = saffEdition(requested);
  const pageText = normalized(html);
  if (!/ترتيب\s+دوري\s+جوي\s+للنخبه\s+تحت\s+21/.test(pageText)) throw Error('SAFF_COMPETITION_MISMATCH');
  const dateArea = pageText.split(/ترتيب\s+دوري\s+جوي/)[0];
  const start = Number(edition.season.slice(0, 4));
  const editionDate = [...dateArea.matchAll(/\b(\d{1,2})[-/](\d{1,2})[-/](20\d{2})\b/g)]
    .some(m => (Number(m[3]) === start && Number(m[2]) >= 7) || (Number(m[3]) === start + 1 && Number(m[2]) <= 6));
  if (!editionDate) throw Error('SAFF_SEASON_NOT_VERIFIED');
  const required = ['لعب', 'فاز', 'تعادل', 'خسر', 'فارق', 'نقاط'];
  const candidates = [];
  for (const table of html.matchAll(/<table\b[^>]*>[\s\S]*?<\/table>/gi)) {
    const trs = [...table[0].matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map(tr =>
      [...tr[1].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].flatMap(cell => {
        const span = Math.min(12, Math.max(1, Number(attribute(cell[0], 'colspan')) || 1));
        return [cell[1], ...Array<string>(span - 1).fill('')];
      }));
    const headerIndex = trs.findIndex(cells => required.every(label => cells.some(cell => normalized(cell) === label)));
    if (headerIndex < 0) continue;
    const header = trs[headerIndex].map(normalized);
    const cols = required.map(label => header.indexOf(label));
    const rows = [];
    for (const cells of trs.slice(headerIndex + 1)) {
      // Only complete source rows are accepted; reject the whole table on corruption.
      const teamCellIndex = cells.findIndex(cell => teamLink(cell) !== null);
      if (teamCellIndex < 0) continue;
      if (cells.length !== header.length) throw Error('SAFF_INVALID_ROW');
      const team = teamLink(cells[teamCellIndex])!;
      const pos = cells.slice(0, teamCellIndex).map(integer).find(value => value !== null);
      const stats = cols.map(index => integer(cells[index]));
      if (!pos || stats.some(value => value === null)) throw Error('SAFF_INVALID_ROW');
      const [played, won, draw, lost, gd, pts] = stats as number[];
      const gfIndex = header.indexOf('له'), gaIndex = header.indexOf('عليه');
      const gf = gfIndex >= 0 ? integer(cells[gfIndex]) : null;
      const ga = gaIndex >= 0 ? integer(cells[gaIndex]) : null;
      if ((gfIndex >= 0 && (gf === null || gf < 0)) || (gaIndex >= 0 && (ga === null || ga < 0)) || (gf !== null && ga !== null && gf - ga !== gd)) throw Error('SAFF_INVALID_ROW');
      if ([played, won, draw, lost].some(n => n < 0) || won + draw + lost !== played) throw Error('SAFF_INVALID_ROW');
      const image = cells.join(' ').match(/<img\b[^>]*>/i)?.[0];
      let logo: string | null = null;
      try { if (image) { const url = new URL(attribute(image, 'src'), edition.url); if (url.protocol === 'https:' && /(^|\.)saff\.com\.sa$/.test(url.hostname)) logo = url.href; } } catch { /* A logo is optional. */ }
      rows.push({ ...team, pos, logo, played, won, draw, lost, gf, ga, gd, pts });
    }
    if (rows.length) candidates.push(rows.sort((a, b) => a.pos - b.pos));
  }
  const rows = candidates[0];
  if (!rows || rows.length !== 24 || new Set(rows.map(r => r.id)).size !== 24 || rows.some((r, i) => r.pos !== i + 1)) throw Error('SAFF_INCOMPLETE_TABLE');
  if (candidates.some(candidate => JSON.stringify(candidate) !== JSON.stringify(rows))) throw Error('SAFF_AMBIGUOUS_TABLE');
  const groups = [{ id: 'saff-jawwy-league-phase', name: 'مرحلة الدوري', rows }];
  return { source: 'SAFF' as const, sourceUrl: edition.url, league: LEAGUE, leagueName: 'دوري جوّي للنخبة تحت 21', season: edition.season, seasonName: edition.season, groups, rows, groupCount: 1, updatedAt: new Date().toISOString() };
}

export async function getSaffStandings(season?: string | null, signal?: AbortSignal) {
  const edition = saffEdition(season);
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort, { once: true });
  if (signal?.aborted) abort();
  const timer = setTimeout(abort, 20000);
  try {
  const response = await fetch(edition.url, { cache: 'no-store', signal: controller.signal, headers: { Accept: 'text/html', 'Accept-Language': 'ar' } });
  if (!response.ok || !response.headers.get('content-type')?.includes('text/html')) throw Error('SAFF_SOURCE_UNAVAILABLE');
  const finalUrl = new URL(response.url);
  if (!['www.saff.com.sa', 'saff.com.sa'].includes(finalUrl.hostname) || finalUrl.pathname !== '/championship.php' || finalUrl.searchParams.get('id') !== String(edition.id)) throw Error('SAFF_COMPETITION_MISMATCH');
  if (Number(response.headers.get('content-length')) > 2_000_000) throw Error('SAFF_RESPONSE_TOO_LARGE');
  const bytes = await response.arrayBuffer();
  if (bytes.byteLength > 2_000_000) throw Error('SAFF_RESPONSE_TOO_LARGE');
  const charset = response.headers.get('content-type')?.match(/charset\s*=\s*[\"']?([^;\s\"']+)/i)?.[1] || 'utf-8';
  const html = new TextDecoder(charset).decode(bytes);
  return parseSaffStandings(html, edition.season);
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abort);
  }
}
