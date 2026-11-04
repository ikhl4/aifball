import test from 'node:test';
import assert from 'node:assert/strict';
import { parseSaffStandings, saffEdition, getSaffStandings } from '../lib/saff-standings.ts';
import { resolveStandingsRequest, COMPETITIONS } from '../lib/competitions.ts';

// Synthetic markup exercises the published SAFF columns, not live football results.
const row = i => `<tr><td>&nbsp;</td><td>${i}</td><td><img src="/test.png"></td><td><a href="team.php?id=${100 + i}">فريق ${i}</a></td><td>9</td><td>7</td><td>2</td><td>0</td><td>+12</td><td>23</td></tr>`;
const fixture = (date = '07-11-2026') => `<h1>دوري جوّي للنخبة تحت 21</h1><p>${date}</p><table><tr><td>نتائج المباريات</td></tr></table><h2>ترتيب دوري جوّي للنخبة تحت 21</h2><table><thead><tr><td></td><td></td><td></td><td></td>${['لعب','فاز','تعادل','خسر','فارق','نقاط'].map(s=>`<th>${s}</th>`).join('')}</tr></thead><tbody>${Array.from({length:24},(_,i)=>row(i+1)).join('')}</tbody></table>`;
test('reads all official columns, preserves rank and leaves absent goals unavailable', () => {
  const r = parseSaffStandings(fixture());
  assert.equal(r.source, 'SAFF'); assert.equal(r.rows.length, 24);
  assert.equal(r.rows[0].id, 'saff:101'); assert.equal(r.rows[0].pos, 1);
  assert.equal(r.rows[0].gd, 12); assert.equal(r.rows[0].pts, 23);
  assert.equal(r.rows[0].gf, null); assert.equal(r.rows[0].ga, null);
  assert.equal(r.season, '2026-2027'); assert.match(r.sourceUrl, /id=419/);
});
test('refuses wrong season, wrong league and incomplete or inconsistent tables', () => {
  assert.throws(()=>parseSaffStandings(fixture('07-11-2025')), /SEASON/);
  assert.throws(()=>parseSaffStandings(fixture().replaceAll('دوري جوّي للنخبة تحت 21','دوري آخر')), /COMPETITION/);
  assert.throws(()=>parseSaffStandings(fixture().replace(row(24),'')), /INCOMPLETE/);
  assert.throws(()=>parseSaffStandings(fixture().replace('<td>9</td>', '<td>8</td>')), /INVALID_ROW/);
  assert.throws(()=>parseSaffStandings(fixture().replace('team.php?id=124','team.php?id=101')), /INCOMPLETE/);
});
test('keeps editions isolated and routes Jawwy standings while preserving other search-only behavior', () => {
  assert.equal(saffEdition('2025-26').id,350); assert.equal(saffEdition('2026').id,419);
  assert.throws(()=>saffEdition('2027-2028'), /UNSUPPORTED/);
  assert.throws(()=>saffEdition('2026-2028'), /UNSUPPORTED/);
  assert.equal(COMPETITIONS['ksa.jawwy.u21'].searchOnly,true);
  assert.equal(resolveStandingsRequest('ترتيب دوري جوي')?.league,'ksa.jawwy.u21');
});
test('fetches only the configured official edition and rejects login/HTML error pages', async () => {
  const original = globalThis.fetch;
  try {
    let called='';
    globalThis.fetch=async url=>{called=url;return {ok:true,url,headers:new Headers({'content-type':'text/html'}),text:async()=>fixture()};};
    assert.equal((await getSaffStandings('2026-27')).rows.length,24);
    assert.match(called,/^https:\/\/www\.saff\.com\.sa\/championship\.php\?id=419/);
    globalThis.fetch=async url=>({ok:true,url,headers:new Headers({'content-type':'text/html'}),text:async()=>'<html>Sign in</html>'});
    await assert.rejects(getSaffStandings(),/COMPETITION/);
  } finally { globalThis.fetch=original; }
});
