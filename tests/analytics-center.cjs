const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
const cache = new Map();
function load(path) {
  if (cache.has(path)) return cache.get(path).exports;
  const module = { exports: {} };
  cache.set(path, module);
  const js = ts.transpileModule(fs.readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  vm.runInNewContext(js, { module, exports: module.exports, URL, Date, require: name => {
    if (name === './football-scoreboard') return load('lib/football-scoreboard.ts');
    if (name === './football-names-ar') return load('lib/football-names-ar.ts');
    throw Error('unexpected import: ' + name);
  } });
  return module.exports;
}
const { normalizeAnalyticsEvent, aggregateAnalytics } = load('lib/analytics-core.ts');
const event = (id,state,homeScore,awayScore) => ({
  id, date:'2026-11-04T18:00:00Z', status:{type:{state,name:'STATUS_FINAL'}},
  competitions:[{ competitors:[
    {homeAway:'home',score:homeScore,team:{id:'10',displayName:'Al Ittihad',logos:[{href:'https://example.com/a.png'}]}},
    {homeAway:'away',score:awayScore,team:{id:'20',displayName:'Al Hilal'}}
  ] }]
});
test('match identity, home/away goals and Arabic team names are source-bound', () => {
  const m = normalizeAnalyticsEvent(event('1','post','3','1'),'ksa.1','دوري روشن');
  assert.equal(m.home, 'الاتحاد'); assert.equal(m.away,'الهلال');
  assert.equal(m.homeScore,3); assert.equal(m.awayScore,1);
  assert.equal(m.homeLogo,'https://example.com/a.png');
});
test('no guesses for unplayed games or malformed events', () => {
  const m = normalizeAnalyticsEvent(event('2','pre','0','0'),'ksa.1','دوري روشن');
  assert.equal(m.homeScore,null); assert.equal(m.awayScore,null);
  assert.equal(normalizeAnalyticsEvent({date:'unknown'},'ksa.1','دوري روشن'),null);
  const postponed = event('3','pre',null,null); postponed.status.type.name='STATUS_POSTPONED';
  assert.equal(normalizeAnalyticsEvent(postponed,'ksa.1','دوري روشن'),null);
});
test('completed-match aggregation never includes live or missing goals', () => {
  const matches = [
    normalizeAnalyticsEvent(event('1','post',3,1),'ksa.1','دوري روشن'),
    normalizeAnalyticsEvent(event('2','post',2,2),'ksa.1','دوري روشن'),
    normalizeAnalyticsEvent(event('3','in',1,0),'ksa.1','دوري روشن'),
    normalizeAnalyticsEvent(event('4','pre',null,null),'ksa.1','دوري روشن')
  ];
  const stats = aggregateAnalytics(matches);
  assert.equal(stats.games,4); assert.equal(stats.completed,2);
  assert.equal(stats.live,1); assert.equal(stats.upcoming,1);
  assert.equal(stats.goals,8); assert.equal(stats.averageGoals,4);
  assert.equal(stats.teams.find(t => t.name==='الاتحاد').wins,1);
});

test('daily all limits leagues and keeps featured official and friendly matches on the Riyadh date', async () => {
  const mod = { exports: {} };
  class Clock extends Date {
    constructor(...args) { super(...(args.length ? args : ['2026-11-15T21:15:00Z'])); }
  }
  const previousLive = { ...event('17','in',2,0), date:'2026-11-15T20:00:00Z' };
  const previousFinal = { ...event('18','post',1,0), date:'2026-11-15T18:00:00Z' };
  const requests = [];
  const riyadhDay = '20261116';
  const early = { ...event('10','pre',null,null), date:'2026-11-15T22:30:00Z' };
  const saudi = { ...event('12','in',2,0), date:'2026-11-16T17:30:00Z' };
  const nations = { ...event('13','post',2,1), date:'2026-11-16T18:30:00Z' };
  const outside = { ...event('14','pre',null,null), date:'2026-11-16T22:30:00Z' };
  early.competitions[0].competitors[0].team.displayName='Comoros';
  nations.competitions[0].competitors[0].team.displayName='Spain';
  const lowPriority = { ...event('15','post',2,1), date:'2026-11-16T19:30:00Z' };
  const friendly = { ...event('16','pre',null,null), date:'2026-11-16T20:30:00Z' };
  friendly.competitions[0].competitors[1].team.abbreviation='JPN';
  outside.competitions[0].competitors[0].team.abbreviation='ENG';
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('app/api/analytics/route.ts','utf8'), {
    compilerOptions:{ module:ts.ModuleKind.CommonJS, target:ts.ScriptTarget.ES2020 },
  }).outputText, {
    exports:mod.exports, module:mod, URL, Date:Clock, AbortSignal,
    require: id => id === 'next/server' ? {NextResponse:{json:(data,options)=>Response.json(data,options)}} : load('lib/analytics-core.ts'),
    fetch: async path => {
      const url = new URL(path);
      const league = url.pathname.split('/').at(-2);
      const interval = url.searchParams.get('dates');
      requests.push([league,interval]);
      const boards = {
        'ksa.1':interval===riyadhDay?[saudi]:[previousLive,previousFinal],
        'uefa.nations':interval===riyadhDay?[nations,lowPriority,outside]:[nations],
        'fifa.friendly':interval===riyadhDay?[friendly]:[early],
      };
      return Response.json({events:boards[league]||[]});
    },
  });
  const response = await mod.exports.GET(new Request('https://test/api/analytics?date=2026-11-16'));
  const body = await response.json();
  assert.equal(response.status,200);
  assert.equal(body.period.days,1);
  assert.deepEqual(body.matches.map(m=>[m.id,m.league]),[['10','fifa.friendly'],['12','ksa.1'],['13','uefa.nations'],['16','fifa.friendly']]);
  assert.ok(requests.some(([league,interval])=>league==='fra.1'&&interval===riyadhDay));
  assert.ok(!requests.some(([league])=>['all','jpn.1','usa.1','fifa.world.u20','uefa.champions'].includes(league)));
  requests.length=0;
  const leagueResponse=await mod.exports.GET(new Request('https://test/api/analytics?league=ksa.1&date=2026-11-16'));
  assert.deepEqual((await leagueResponse.json()).matches.map(m=>m.league),['ksa.1']);
  assert.deepEqual(requests.map(([league])=>league),['ksa.1','ksa.1']);
  const nationalResponse=await mod.exports.GET(new Request('https://test/api/analytics?league=uefa.nations&date=2026-11-16'));
  assert.deepEqual((await nationalResponse.json()).matches.map(m=>m.id),['13','15']);
  const now = await mod.exports.GET(new Request('https://test/api/analytics?league=ksa.1&live=1'));
  assert.deepEqual((await now.json()).matches.map(m=>m.id),['17','12']);
  const today = await mod.exports.GET(new Request('https://test/api/analytics?league=ksa.1'));
  assert.deepEqual((await today.json()).matches.map(m=>m.id),['17','12']);
});
