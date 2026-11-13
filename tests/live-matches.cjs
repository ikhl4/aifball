const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function support(path) {
  const module = {exports:{}};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path, 'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText, {module,exports:module.exports,require:()=>support('lib/football-names-ar.ts')});
  return module.exports;
}
const settle = () => new Promise(resolve => setImmediate(resolve));
const sample = (id = 'match', state = 'pre') => ({ id, date: '2026-11-02T18:00:00Z', status: { type: { state } }, competitions: [{ competitors: [
  { homeAway: 'home', team: { id: '1', shortDisplayName: 'Home' } },
  { homeAway: 'away', team: { id: '2', shortDisplayName: 'Away' } },
] }] });
const response = events => ({ ok: true, json: async () => ({ events }) });

// Minimal hook runner to exercise the components' actual request lifecycle.
function mount(path, fetcher) {
  const states = [], effects = [];
  let index = 0, tree, effectIndex = 0, props = {}, interval;
  const React = {
    createElement(type, props, ...children) { return { type, props: props || {}, children }; },
    useState(initial) { const slot = index++; if (!(slot in states)) states[slot] = initial;
      return [states[slot], value => { states[slot] = typeof value === 'function' ? value(states[slot]) : value; }]; },
    useEffect(fn, deps) { const slot = effectIndex++, previous = effects[slot];
      if (!previous || deps.some((value, i) => value !== previous.deps[i])) {
        previous?.cleanup?.(); effects[slot] = { deps, fn };
      }
    },
  };
  const module = { exports: {} };
  const source = fs.readFileSync(path, 'utf8') + (path.endsWith('/LiveMatchCenter.tsx') ? '\nmodule.exports.default = FootballMatchCenter;' : '');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true } }).outputText;
  vm.runInNewContext(code, { module, exports: module.exports, React, require: name => name.includes('football-scoreboard') ? support('lib/football-scoreboard.ts') : name.includes('live-match-filters') ? support('lib/live-match-filters.ts') : name.includes('football-names-ar') ? support('lib/football-names-ar.ts') : React, fetch: (...args) => fetcher(...args), AbortController, Intl, Date,
    setInterval: fn => { interval = fn; return 1; }, clearInterval() {}, console });
  function render(nextProps = props) { props = nextProps; index = 0; effectIndex = 0; tree = module.exports.default(props);
    effects.forEach(effect => { if (effect.fn) { const fn = effect.fn; effect.fn = null; effect.cleanup = fn(); } }); return tree; }
  return { render, refresh: () => interval(), unmount: () => effects.forEach(e => e.cleanup?.()), text: () => JSON.stringify(render()) };
}

test('center isolates league failures and retains results during refresh', async () => {
  let fail = false;
  const app = mount('app/components/LiveMatchCenter.tsx', async () => {
    if (fail) throw new Error('offline');
    return { ok: true, json: async () => ({ matches: { 'ksa.1': [sample()] }, failed: 1 }) };
  });
  app.render({language:'ar'}); await settle();
  assert.match(app.text(), /Home/); assert.match(app.text(), /تعذّر تحديث/);
  fail = true; app.refresh();
  assert.match(app.text(), /Home/); assert.doesNotMatch(app.text(), /جاري جلب المباريات/);
  await settle(); assert.match(app.text(), /Home/); app.unmount();
});

test('widget shows a dash for scheduled games and labels tomorrow', async () => {
  const app = mount('app/components/LiveSportsWidget.tsx', async () => response([sample()]));
  app.render({ date: 'tomorrow' }); await settle();
  assert.match(app.text(), /—/); assert.match(app.text(), /غداً/); assert.doesNotMatch(app.text(), /0 - 0/); app.unmount();
});

test('old date response cannot replace newly selected day', async () => {
  let finish;
  const app = mount('app/components/LiveSportsWidget.tsx', url => url.includes('yesterday') ? Promise.resolve(response([sample('new')])) : new Promise(resolve => { finish = resolve; }));
  app.render({ date: 'today' }); app.render({ date: 'yesterday' }); await settle();
  finish(response([sample('old')])); await settle();
  assert.match(app.text(), /new/); assert.doesNotMatch(app.text(), /"old"/); app.unmount();
});

test('missing competitors do not crash either component', async () => {
  for (const path of ['LiveSportsWidget', 'LiveMatchCenter']) {
    const app = mount(`app/components/${path}.tsx`, async () => path === 'LiveMatchCenter'
      ? { ok: true, json: async () => ({ matches: { 'ksa.1': [{ id: 'incomplete' }] }, failed: 0 }) }
      : response([{ id: 'incomplete' }]));
    app.render(); await settle(); assert.doesNotThrow(() => app.render()); app.unmount();
  }
});

function route(fetcher, now = '2026-12-31T22:30:00Z') {
  const module = { exports: {} };
  class Clock extends Date { constructor(...args) { super(...(args.length ? args : [now])); } }
  const code = ts.transpileModule(fs.readFileSync('app/api/espn/route.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  vm.runInNewContext(code, { module, exports: module.exports, require: () => ({ NextResponse: { json: (data, options) => ({ data, status: options?.status || 200 }) } }),
    fetch: fetcher, Date: Clock, Intl, URL, AbortController, AbortSignal, setTimeout, clearTimeout, console: { error() {} } });
  return date => module.exports.GET(new Request(`https://example.test/api/espn?league=ksa.1&date=${date}`));
}

test('Riyadh date handles midnight, month and year rollover', async () => {
  const urls = [];
  const get = route(async url => { urls.push(url); return response([]); });
  for (const day of ['yesterday', 'today', 'tomorrow']) assert.equal((await get(day)).status, 200);
  assert.ok(urls[0].includes('dates=20261231')); assert.ok(urls[1].includes('dates=20270101')); assert.ok(urls[2].includes('dates=20270102'));
});

test('route distinguishes invalid requests and upstream failures from no games', async () => {
  assert.equal((await route(async () => { throw Error('offline'); })('today')).status, 502);
  assert.equal((await route(async () => ({ ok: true, json: async () => ({}) }))('today')).status, 502);
  assert.equal((await route(() => { throw Error('must not fetch'); })('invalid')).status, 400);
});


test('match details retain the last success on refresh failure and abort on close', async () => {
  let fail = false, signal;
  const app = mount('app/components/MatchSummary.tsx', async (url, options) => {
    signal = options.signal;
    if (fail) throw new Error('offline');
    return { ok: true, json: async () => ({ eventId: '123', league: 'ksa.1', home: {id:'1',name:'Al Hilal'}, away: {id:'2',name:'Al Nassr'}, state:'post', events: [{id:'e',label:'هدف موثّق',players:['Player'],teamId:'1'}], fetchedAt: '2026-11-02T10:00:00Z' }) };
  });
  app.render({eventId:'123',league:'ksa.1'}); await settle();
  assert.match(app.text(), /هدف موثّق/);
  fail = true; await app.refresh();
  assert.match(app.text(), /هدف موثّق/);
  assert.match(app.text(), /آخر تحديث/);
  app.unmount(); assert.equal(signal.aborted, true);
});
