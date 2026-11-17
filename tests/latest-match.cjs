const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

const source = ts.transpileModule(fs.readFileSync('lib/latest-match.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;

function load(fetch) {
  class Clock extends Date {
    constructor(...args) { super(...(args.length ? args : ['2026-11-17T10:00:00Z'])); }
  }
  const exports = {};
  vm.runInNewContext(source, {
    exports, fetch, Date: Clock, Intl, AbortSignal,
    require: name => name === './competitions' ? { COMPETITIONS: {} } : { footballNameInArabic: name => name },
  });
  return exports;
}

function event(id, date, score, homeName = 'Al Ittihad FC', state = 'post') {
  return { id, date, status: { type: { state } }, competitions: [{ competitors: [
    { homeAway: 'home', team: { displayName: homeName }, score },
    { homeAway: 'away', team: { displayName: 'Al Fayha' }, score: '1' },
  ] }] };
}

test('routes Arabic club inflections and keeps opponents and filters out of the generic lookup', () => {
  const { requestedTeam } = load();
  assert.equal(requestedTeam('وش آخر مباراة للاتحاد؟'), 'الاتحاد');
  assert.equal(requestedTeam('آخر مباراة لبرشلونة؟'), 'برشلونة');
  for (const query of ['آخر مباراة للاتحاد ضد الشباب', 'آخر مباراة الاتحاد في آسيا', 'آخر مباراة فاز فيها الاتحاد', 'آخر مباراة الاتحاد في ٢٠٢٥', 'آخر مباراة للاتحاد السكندري في أغسطس']) {
    assert.equal(requestedTeam(query), null, query);
  }
});

test('keeps a true zero, ignores live or unrelated games and marks a newer incomplete score', async () => {
  const requested = [];
  const { latestVerifiedMatch } = load(async (url, options) => {
    const request = new URL(url);
    requested.push(request.searchParams.get('dates'));
    assert.equal(options.next.revalidate, 30);
    const events = request.pathname.includes('/ksa.1/') && request.searchParams.get('dates') === '202611' ? [
      event('1', '2026-11-10T18:00Z', '0'),
      event('2', '2026-11-11T18:00Z', null),
      event('3', '2026-11-12T18:00Z', '2', 'Al Ittihad Alexandria'),
      event('4', '2026-11-13T18:00Z', '2', 'Al Ittihad FC', 'in'),
    ] : [];
    return { ok: true, json: async () => ({ events }) };
  });
  const result = await latestVerifiedMatch('الاتحاد');
  assert.equal(result.match?.id, '1');
  assert.equal(result.match?.homeScore, 0);
  assert.equal(result.complete, false);
  assert.deepEqual([...new Set(requested)], ['202611', '202610']);
});

test('extends the search when the first two months contain no completed match', async () => {
  const { latestVerifiedMatch } = load(async url => {
    const request = new URL(url);
    const events = request.pathname.includes('/ksa.1/') && request.searchParams.get('dates') === '202609'
      ? [event('1', '2026-09-05T18:00Z', { value: 3 })] : [];
    return { ok: true, json: async () => ({ events }) };
  });
  const result = await latestVerifiedMatch('الاتحاد');
  assert.equal(result.match?.id, '1');
  assert.equal(result.complete, true);
});
