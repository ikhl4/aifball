const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
const cache = new Map();
function load(path) {
  if (cache.has(path)) return cache.get(path).exports;
  const module = { exports: {} }; cache.set(path, module);
  const js = ts.transpileModule(fs.readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  vm.runInNewContext(js, { module, exports: module.exports, URL, Date, require: name => {
    if (name === './football-names-ar') return load('lib/football-names-ar.ts');
    if (name === './live-match-filters') return load('lib/live-match-filters.ts');
    throw Error('unexpected import ' + name);
  } });
  return module.exports;
}
const {posterIntent, requestedPosterState, parsePosterEvent, selectPosterMatch} = load('lib/match-card-data.ts');
const event = (id,state,date,home='Al Ittihad',away='Al Hilal') => ({
  id, date, status:{type:{state,name:'STATUS_FINAL'}}, competitions:[{competitors:[
    {homeAway:'home',score:'2',team:{id:'1',displayName:home,color:'111111',logos:[{href:'https://example.com/home.png'}]}},
    {homeAway:'away',score:'1',team:{id:'2',displayName:away,logos:[{href:'https://example.com/away.png'}]}}
  ], venue:{fullName:'Stadium'}}]
});
test('design intent is distinct from commentary or ordinary results',()=>{
  assert.equal(posterIntent('صمم بطاقة مباراة الهلال والاتحاد'),true);
  assert.equal(posterIntent('ملخص مباراة الهلال والاتحاد'),false);
  assert.equal(requestedPosterState('صمم بطاقة نتيجة مباراة الاتحاد الأخيرة'),'finished');
  assert.equal(requestedPosterState('صمم مباراة الاتحاد القادمة'),'upcoming');
});
test('provider identity, status and scores bind to the correct home/away',()=>{
  const m = parsePosterEvent(event('33','post','2026-11-02T17:00:00Z'),'ksa.1','دوري روشن');
  assert.equal(m.home.name,'الاتحاد'); assert.equal(m.away.name,'الهلال');
  assert.equal(m.score.home,'2'); assert.equal(m.score.away,'1');
  assert.equal(m.status,'finished'); assert.equal(m.home.logo,'https://example.com/home.png');
});
test('rejects incomplete, cancelled and invented matches',()=>{
  assert.equal(parsePosterEvent({date:'invalid'},'ksa.1','دوري روشن'),null);
  const canceled=event('1','pre','2026-11-02T17:00:00Z');
  canceled.status.type.name='STATUS_POSTPONED';
  assert.equal(parsePosterEvent(canceled,'ksa.1','دوري روشن'),null);
  assert.equal(selectPosterMatch('صمم بطاقة مباراة الأهلي', [parsePosterEvent(event('1','pre','2026-11-02T17:00:00Z'),'ksa.1','دوري روشن')]),null);
});
test('match selection respects user team and desired state',()=>{
 const past=parsePosterEvent(event('1','post','2026-11-02T17:00:00Z'),'ksa.1','دوري روشن');
 const next=parsePosterEvent(event('2','pre','2026-11-09T17:00:00Z'),'ksa.1','دوري روشن');
 assert.equal(selectPosterMatch('صمم نتيجة مباراة الاتحاد والهلال الأخيرة',[past,next]).id,'1');
 assert.equal(selectPosterMatch('صمم مباراة الاتحاد والهلال القادمة',[past,next]).id,'2');
 assert.equal(selectPosterMatch('صمم مباراة الاتحاد والهلال مباشرة',[past,next]),null);
});
