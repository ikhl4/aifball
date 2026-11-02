const {test}=require('node:test');
const assert=require('node:assert/strict');
const ts=require('typescript'),fs=require('node:fs'),vm=require('node:vm');
const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
function load(path){const m={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.React,esModuleInterop:true}}).outputText,{module:m,exports:m.exports,require:name=>name==='react'?React:load('lib/tactical-lessons.ts'),setTimeout,clearTimeout});return m.exports;}
const catalog=load('lib/tactical-lessons.ts');
test('explicit supported Arabic/English lesson requests resolve; actual match/player analysis is not intercepted',()=>{
 for(const l of catalog.LESSON_CHOICES)assert.equal(catalog.resolveTacticalRequest(l.query),l.id);
 assert.equal(catalog.resolveTacticalRequest('اشرح الضغط العكسي'),'counterpress');
 assert.equal(catalog.resolveTacticalRequest('explain rondo'),'rondo');
 for(const q of ['حلل ضغط الاتحاد أمام الهلال','كيف بنى أرسنال اللعب أمس؟','اعطني إحصائيات تمرير ميسي','تمرين سرعة','روندو 4 ضد 2'])assert.equal(catalog.resolveTacticalRequest(q),null,q);
 assert.equal(catalog.lessonByName('unknown'),null);
});
test('every scene has unique players, valid arrow endpoints, bounded coordinates and distinct progression',()=>{
 for(const l of catalog.LESSON_CHOICES){
  assert.equal(l.frames.length,4); assert.ok(l.drill.rules.length); assert.ok(l.coaching.length);
  assert.equal(new URL(l.reference.url).hostname,'www.fifatrainingcentre.com');
  const ids=l.frames[0].players.map(p=>p.id).sort().join(',');
  for(const f of l.frames){assert.equal(new Set(f.players.map(p=>p.id)).size,f.players.length);assert.equal(f.players.map(p=>p.id).sort().join(','),ids);for(const p of f.players){assert.ok(p.x>=0&&p.x<=105&&p.y>=0&&p.y<=68);}for(const a of f.arrows){assert.ok(f.players.some(p=>p.id===a.from));assert.ok(f.players.some(p=>p.id===a.to));}assert.ok(f.ball[0]>=0&&f.ball[0]<=105&&f.ball[1]>=0&&f.ball[1]<=64);}
  assert.notEqual(JSON.stringify(l.frames[0].players),JSON.stringify(l.frames[3].players));
 }
});
test('a rondo scene really has three holders and one defender, never a generic eleven',()=>{for(const f of catalog.TACTICAL_LESSONS.rondo.frames){assert.equal(f.players.filter(p=>p.side==='team').length,3);assert.equal(f.players.filter(p=>p.side==='opponent').length,1);}});
test('lesson UI renders learning disclosure and controls; unknown requests do not receive a false matching drill',()=>{
 const Component=load('app/components/TacticalLesson.tsx').default;
 const html=renderToStaticMarkup(React.createElement(Component,{name:'build-up'}));
 assert.match(html,/كسر الضغط والبناء من الخلف/);assert.match(html,/تشغيل المراحل/);assert.match(html,/مخطط تعليمي/);assert.match(html,/تجربة التمركز/);
 const unknown=renderToStaticMarkup(React.createElement(Component,{name:'تمرين مجهول'}));assert.match(unknown,/لا يوجد درس جاهز مطابق/);assert.doesNotMatch(unknown,/<svg/);
 const drill=renderToStaticMarkup(React.createElement(Component,{name:'rondo',trainingFirst:true}));assert.match(drill,/3 مستحوذين/);assert.match(drill,/نقاط المدرب/);assert.match(drill,/المدة المقترحة/);
});
