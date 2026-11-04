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
