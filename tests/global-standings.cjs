const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function load(path, fetcher) {
  const module = { exports: {} };
  const source = ts.transpileModule(fs.readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  vm.runInNewContext(source, {
    module, exports: module.exports, URL, Date, AbortController, setTimeout, clearTimeout,
    process: { env: {} }, console: { info() {}, warn() {} }, fetch: fetcher,
    require: name => name === 'next/server' ? { NextResponse: { json: (data, options) => ({ data, status: options?.status || 200 }) } } : catalog,
  });
  return module.exports;
}
const catalog = load('lib/competitions.ts');
const row = id => ({ team: { id, displayName: `Team ${id}` }, stats: Object.entries({ rank: 1, gamesPlayed: 2, wins: 1, ties: 1, losses: 0, pointsFor: 3, pointsAgainst: 1, points: 4 }).map(([name, value]) => ({ name, value })) });
const group = (name, id) => ({ name, standings: { entries: [row(id)] } });
const payload = (year, name, groups) => ({ name: 'Competition', season: { year, displayName: name }, children: groups });
const request = (league, season) => new Request(`https://example.test/api/standings?league=${league}${season ? `&season=${season}` : ''}`);
const response = data => ({ ok: true, headers: new Headers({ 'content-type': 'application/json' }), json: async () => data });

test('direct Arabic and English table requests resolve to exact competition', () => {
  for (const [query, league] of [
    ['ابغى جدول نخبة آسيا', 'afc.champions'], ['ترتيب الدوري الأمريكي', 'usa.1'],
    ['ترتيب كأس العالم ٢٠٢٦', 'fifa.world'], ['جدول تصفيات كأس العالم آسيا 2026', 'fifa.worldq.afc'],
    ['جدول تصفيات اليورو', 'uefa.euroq'], ['جدول الدوري الأوروبي', 'uefa.europa'],
    ['جدول دوري المؤتمر', 'uefa.europa.conf'], ['Premier League standings', 'eng.1'],
    ['جدول كأس آسيا 2027', 'afc.asian.cup'], ['ترتيب دوري أبطال آسيا 2', 'afc.cup'], ['جدول كأس العالم للأندية', 'fifa.cwc'],
  ]) assert.equal(catalog.resolveStandingsRequest(query)?.league, league, query);
  assert.equal(catalog.resolveStandingsRequest('ترتيب كأس العالم ٢٠٢٦').season, '2026');
});

test('rankings, analysis, ambiguous and multi-competition requests stay in assistant flow', () => {
  for (const query of ['تصنيف FIFA العالمي للمنتخبات', 'قارن ترتيب الدوري السعودي والدوري الإنجليزي', 'ترتيب الدوري السعودي والدوري الإنجليزي', 'لماذا تغير ترتيب الدوري السعودي', 'جدول تصفيات كأس العالم', 'جدول هدافي الدوري السعودي', 'جدول مباريات الدوري السعودي', 'ترتيب المنتخبات']) {
    assert.equal(catalog.resolveStandingsRequest(query), null, query);
  }
});

test('Elite regions, World Cup groups and MLS conferences stay separate', async () => {
  for (const [league, names] of [
    ['afc.champions', ['East Region', 'West Region']],
    ['fifa.world', Array.from({ length: 12 }, (_, i) => `Group ${String.fromCharCode(65 + i)}`)],
    ['usa.1', ['Eastern Conference', 'Western Conference']],
  ]) {
    const data = payload(2026, '2026 Competition', names.map((name, i) => group(name, String(i + 1))));
    const api = load('app/api/standings/route.ts', async () => response(data));
    const result = await api.GET(request(league));
    assert.equal(result.status, 200); assert.equal(result.data.groupCount, names.length);
    assert.deepEqual(Array.from(result.data.groups, g => g.name), names);
    assert.equal(new Set(result.data.groups.map(g => g.id)).size, names.length);
  }
});

test('nested groups preserve path labels and independent team rows', async () => {
  const data = payload(2026, '2026 Competition', [{ name: 'League A', children: [group('Group 1', '1'), group('Group 2', '2')] }, { name: 'League B', children: [group('Group 1', '3')] }]);
  const result = await load('app/api/standings/route.ts', async () => response(data)).GET(request('uefa.nations'));
  assert.equal(result.data.groups.length, 3);
  assert.equal(result.data.groups[0].name, 'League A / Group 1');
  assert.equal(result.data.groups[2].rows[0].id, '3');
});

test('national tournament edition may differ from internal start year, but wrong editions never pass', async () => {
  let calls = 0;
  const api = load('app/api/standings/route.ts', async url => {
    calls++;
    return response(new URL(url).searchParams.has('season') ? payload(2026, '2026', []) : payload(2023, '2026 World Cup Qualifying - AFC', [group('Group A', '1')]));
  });
  const result = await api.GET(request('fifa.worldq.afc', '2026'));
  assert.equal(result.status, 200); assert.equal(result.data.season, '2023'); assert.equal(calls, 2);
  const wrong = await api.GET(request('fifa.worldq.afc', '2030'));
  assert.equal(wrong.status, 404);
});

test('unknown competitions, invalid seasons and unavailable tables fail explicitly', async () => {
  const api = load('app/api/standings/route.ts', async () => response(payload(2026, '2026 Competition', [])));
  assert.equal((await api.GET(request('not.real'))).status, 400);
  assert.equal((await api.GET(request('afc.champions', 'invalid'))).status, 400);
  assert.equal((await api.GET(request('fifa.worldq.ofc'))).status, 404);
});
