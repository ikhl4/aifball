const {test}=require('node:test');
const assert=require('node:assert/strict');
const ts=require('typescript'),fs=require('node:fs'),vm=require('node:vm');
const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
function load(path){const m={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.React,esModuleInterop:true}}).outputText,{module:m,exports:m.exports,require:name=>name==='react'?React:name.includes('tactical-board-editor')?load('lib/tactical-board-editor.ts'):load('lib/tactical-lessons.ts'),setTimeout,clearTimeout});return m.exports;}
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
 assert.match(html,/كسر الضغط والبناء من الخلف/);assert.match(html,/تشغيل المراحل/);assert.match(html,/مخطط تعليمي/);assert.match(html,/تحرير اللاعبين/);
 const unknown=renderToStaticMarkup(React.createElement(Component,{name:'تمرين مجهول'}));assert.match(unknown,/لا يوجد درس جاهز مطابق/);assert.doesNotMatch(unknown,/<svg/);
 const drill=renderToStaticMarkup(React.createElement(Component,{name:'rondo',trainingFirst:true}));assert.match(drill,/3 مستحوذين/);assert.match(drill,/نقاط المدرب/);assert.match(drill,/المدة المقترحة/);
});

test('library contains twelve distinct drills across nine categories and supports Arabic search',()=>{
 assert.equal(catalog.LESSON_CHOICES.length,12);
 assert.equal(new Set(catalog.LESSON_CHOICES.map(l=>l.category)).size,9);
 assert.equal(catalog.resolveTacticalRequest('اعرض مكتبة التمارين'),'library');
 assert.equal(catalog.filterTacticalLessons('الحارس','all')[0].id,'goalkeeping');
 assert.equal(catalog.filterTacticalLessons('الانهاء','الإنهاء')[0].id,'finishing');
 assert.equal(catalog.filterTacticalLessons('الانهاء','الدفاع').length,0);
 for(const l of catalog.LESSON_CHOICES)assert.equal(catalog.filterTacticalLessons(l.title,'all').length,1);
});
const editor=load('lib/tactical-board-editor.ts');
test('bulk add supports eleven on each side, unique identities and atomic capacity validation',()=>{
 const original=catalog.TACTICAL_LESSONS.rondo.frames[0].players;
 const a=editor.addBoardPlayers(original,'team',8);assert.equal(a.error,'');assert.equal(a.players.filter(p=>p.side==='team').length,11);assert.equal(original.length,4);
 const b=editor.addBoardPlayers(a.players,'opponent',10);assert.equal(b.error,'');assert.equal(b.players.length,22);assert.equal(new Set(b.players.map(p=>p.id)).size,22);
 const over=editor.addBoardPlayers(b.players,'team',1);assert.ok(over.error);assert.equal(over.players,b.players);assert.equal(over.added.length,0);
 for(const n of [0,-1,1.5,NaN,12])assert.ok(editor.addBoardPlayers(original,'team',n).error);
});
test('editing and deletion preserve templates and other players while bounding positions',()=>{
 const original=catalog.TACTICAL_LESSONS.rondo.frames[0].players;
 const added=editor.addBoardPlayers(original,'team',2);
 const id=added.added[0];
 const moved=editor.updateBoardPlayer(added.players,id,{number:'٢٢',role:'محور',x:1000,y:-10});
 assert.equal(moved.find(p=>p.id===id).number,'22');assert.equal(moved.find(p=>p.id===id).x,101);assert.equal(moved.find(p=>p.id===id).y,4);
 assert.equal(added.players.find(p=>p.id===id).role,'لاعب مضاف');assert.equal(original.length,4);
 const removed=editor.removeBoardPlayer(moved,id);assert.equal(removed.length,5);assert.equal(removed.some(p=>p.id===id),false);
 const readd=editor.addBoardPlayers(removed,'team',1);assert.equal(new Set(readd.players.map(p=>p.id)).size,readd.players.length);
});
