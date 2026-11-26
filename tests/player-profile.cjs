const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), ts = require('typescript'), vm = require('node:vm');
function load(file, mocks = {}, fetcher = fetch) {
 const m = { exports: {} };
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText,
  { exports: m.exports, module: m, require: name => mocks[name] || {}, fetch: fetcher, URL, URLSearchParams, AbortSignal, Date, setTimeout, clearTimeout, console });
 return m.exports;
}
const data = load('lib/player-profile-data.ts');
const prompt = load('lib/player-prompt.ts', { './player-profile-data': data });
const stats = { names: ['starts','totalGoals','goalAssists'], splits: [
 { teamId: '114', leagueSlug: 'ita.1', displayName: '2026-27 Serie A', stats: ['8','3','0'] },
 { teamId: '114', leagueSlug: 'uefa.champions', displayName: '2026-27 Champions League', stats: ['4','3','0'] },
 { teamId: '580', leagueSlug: 'fifa.world', displayName: '2026 FIFA World Cup', stats: ['3','0','0'] },
 { teamId: '114', leagueSlug: 'ita.1', displayName: '2025-26 Serie A', stats: ['30','12','5'] } ] };
function detail(league = 'ita.1', season = '2026-27') { return { league: {slug: league}, season: {displayName: season}, athlete: { id:'255850', displayName:'Scott McTominay', team:{id:'114',displayName:'Napoli'}, statsSummary:{ displayName: season+' Stats', statistics:[{name:'starts-subIns',displayValue:'8 (1)'}] } } }; }

test('identity requires an exact unique soccer athlete; duplicated leagues do not create ambiguity', () => {
 const hit = {id:'1',type:'player',sport:'soccer',displayName:'Nicolò Barella'};
 assert.equal(data.uniqueEspnPlayer({items:[hit,{...hit,league:'cup'}]},['Nicolo Barella']).player.id,'1');
 assert.equal(data.uniqueEspnPlayer({items:[hit,{...hit,id:'2'}]},['Nicolo Barella']).ambiguous,true);
 assert.equal(data.uniqueEspnPlayer({items:[hit]},['Barella']).player,undefined);
 assert.equal(data.uniqueEspnPlayer({items:[{...hit,sport:'basketball'}]},['Nicolo Barella']).player,undefined);
});
test('seasons reject calendar/club mismatches and rollover correctly in July', () => {
 assert.equal(data.seasonMatches('2026-27 Serie A','2026-2027'),true);
 assert.equal(data.seasonMatches('2025-26 Serie A','2026-2027'),false);
 assert.equal(data.seasonMatches('2026 MLS','2026-2027'),false);
 assert.equal(data.seasonMatches('2026-27 Serie A','2026'),false);
 assert.equal(data.currentFootballSeason(new Date('2027-06-30T23:59:00Z')),'2026-2027');
 assert.equal(data.currentFootballSeason(new Date('2027-07-01T00:00:00Z')),'2027-2028');
});
test('scopes stay separate; zero assists preserved; unknown appearances are never replaced by starts', () => {
 const rows = data.normalizePlayerRows({statistics:stats},detail(),'114','2026-2027');
 assert.equal(rows.length,2); assert.equal(rows[0].matches,9); assert.equal(rows[0].assists,0);
 assert.equal(rows[1].starts,4); assert.equal(rows[1].matches,null);
 assert.ok(rows.every(r=>r.team==='Napoli')); assert.ok(rows.every(r=>!r.competition.includes('2025')));
 const old = data.normalizePlayerRows({statistics:stats},detail('ita.1','2025-26'),'114','2026-2027');
 assert.equal(old[0].matches,null);
});
test('malformed schemas and impossible counts fail without shifting columns or inventing zero', () => {
 const malformed = { ...stats, splits:[{...stats.splits[0],stats:['8']},{...stats.splits[0],stats:['8','-1','?']}] };
 const rows = data.normalizePlayerRows({statistics:malformed},detail(),'114','2026-2027');
 assert.equal(rows.length,1); assert.equal(rows[0].goals,null); assert.equal(rows[0].assists,null);
 assert.equal(data.normalizePlayerRows({statistics:{...stats,splits:[{...stats.splits[0],stats:['8','9999','0']}]}},detail(),'114','2026-2027').length,0);
});
test('Commons photos require matching returned file URLs and usable license plus attribution', () => {
 const file={thumburl:'https://upload.wikimedia.org/portrait.jpg',descriptionurl:'https://commons.wikimedia.org/wiki/File:Portrait.jpg',extmetadata:{LicenseShortName:{value:'CC BY-SA 4.0'},Artist:{value:'<a>Photographer</a>'}}};
 const photo=data.normalizeCommonsPhoto({query:{pages:{1:{imageinfo:[file]}}}});
 assert.equal(photo.artist,'Photographer'); assert.equal(photo.license,'CC BY-SA 4.0');
 assert.equal(data.normalizeCommonsPhoto({query:{pages:{1:{imageinfo:[{...file,thumburl:'https://example.org/fake.jpg'}]}}}}),undefined);
 assert.equal(data.normalizeCommonsPhoto({query:{pages:{1:{imageinfo:[{...file,extmetadata:{}}]}}}}),undefined);
});
test('compact player prompt preserves truthfulness and scoped fields while prioritizing first card', () => {
 const p=prompt.playerPresentationRules(new Date('2026-11-27T00:00:00Z'));
 assert.ok(p.length<3000); for(const term of ['lookup_name','2026-2027','الموسم المطلوب','قبل البحث الطويل','لا تجمع','المعتزل','contract_source'])assert.ok(p.includes(term),term);
});
test('public profile lookups coalesce and cache, preserve partial data when optional sources fail', async () => {
 let calls=0;
 const fake=async url=>{calls++; const u=String(url);
  if(u.includes('wikidata'))throw Error('blocked');
  if(u.includes('/search?'))return {ok:true,json:async()=>({items:[{id:'255850',displayName:'Scott McTominay',sport:'soccer',type:'player',league:'ita.1',teamRelationships:[{core:{id:'114',isNational:false,displayName:'Napoli'}}]}]})};
  if(u.includes('/overview?'))return {ok:true,json:async()=>({statistics:stats})};
  return {ok:true,json:async()=>detail(u.includes('uefa.champions')?'uefa.champions':'ita.1')};
 };
 const service=load('lib/player-profile-data.ts',{},fake);
 const [a,b]=await Promise.all([service.loadPlayerData('Scott McTominay','2026-2027'),service.loadPlayerData('Scott McTominay','2026-2027')]);
 assert.equal(a,b);assert.equal(a.status,'found');assert.equal(a.rows.length,2);assert.equal(a.photo,undefined);
 const previous=calls;await service.loadPlayerData('Scott McTominay','2026-2027');assert.equal(calls,previous);
});
test('roster enrichment rejects another team, season or competition and reads appearances explicitly', () => {
 const row=data.normalizePlayerRows({statistics:stats},detail(),'114','2026-2027')[1];
 const roster={team:{id:'114',isNational:false},season:{displayName:'2026-27 UEFA Champions League'},athletes:[{id:'255850',statistics:{splits:{categories:[{stats:[{name:'appearances',displayValue:'5'},{name:'subIns',displayValue:'1'},{name:'totalGoals',displayValue:'3'},{name:'goalAssists',displayValue:'0'}]}]}}}]};
 const r=data.scopedRosterRow(roster,row,'255850','114','2026-2027');assert.equal(r.matches,5);assert.equal(r.starts,4);assert.equal(r.assists,0);
 for(const bad of [{...roster,team:{id:'580',isNational:true}},{...roster,season:{displayName:'2025-26 UEFA Champions League'}},{...roster,season:{displayName:'2026-27 Serie A'}}])assert.equal(data.scopedRosterRow(bad,row,'255850','114','2026-2027'),undefined);
});
test('a shared nickname requests disambiguation instead of choosing the retired or active namesake', async () => {
 const fake=async url=>({ok:true,json:async()=>String(url).includes('wikidata')?{search:[{id:'Q1',label:'Javi Guerra',description:'Spanish footballer',match:{text:'Javi Guerra'}},{id:'Q2',label:'Javier Guerra Moreno',description:'Spanish footballer',match:{text:'Javi Guerra'}}]}:{items:[]}});
 const service=load('lib/player-profile-data.ts',{},fake);
 assert.equal((await service.loadPlayerData('Javi Guerra','2026-2027')).status,'ambiguous');
});
