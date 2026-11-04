const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
function load(path,fetcher){const m={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.React,esModuleInterop:true}}).outputText,{module:m,exports:m.exports,require:n=>n==='react'?React:n.includes('match-summary-prompt')?load('lib/match-summary-prompt.ts'):n.includes('daily-match-highlights')?{buildDailyHighlights:async()=>null}:n==='next/server'?{NextResponse:{json:(data,options)=>({data,status:options?.status||200})}}:load(n.includes('match-report-prompt')?'lib/match-report-prompt.ts':n.includes('analysis-motion')?'lib/analysis-motion.ts':n.includes('analysis-partial')?'lib/analysis-partial.ts':n.includes('analysis-prompt')?'lib/analysis-prompt.ts':n.includes('AnalysisPitch')?'app/components/AnalysisPitch.tsx':'lib/analysis-story.ts'),URL,fetch:fetcher,Response,process:{env:{DIFY_API_KEY:'test-placeholder'}},console:{log(){},error(){}},setTimeout,clearTimeout});return m.exports;}
const api=load('lib/analysis-story.ts');
const fixture=()=>({title:'شرح البناء والدفاع',scope:'مثال تعليمي عام لا ينسب لفريق',mode:'illustrative',intro:'الفكرة تبدأ بتوفير الدعم.',sources:[],sections:[{title:'البناء',explanation:'شرح قبل الملعب',after:'تفسير بعد الملعب',board:{caption:'مقتطف تعليمي',frames:[{title:'فتح الدعم',note:'المحور يتاح للتمرير.',players:[{id:'a',number:'6',side:'team',x:30,y:20,role:'محور'},{id:'b',number:'8',side:'team',x:50,y:30,role:'دعم'}],ball:[30,20],arrows:[{from:'a',to:'b',kind:'pass'}]}]}},{title:'الدفاع',explanation:'شرح دفاعي',after:'الغطاء يحمي العمق.'}]});
const fenced=d=>'```aifball-analysis\n'+JSON.stringify(d)+'\n```';
test('sourced analysis needs safe references; invalid scene geometry and links never pass',()=>{
 const d=fixture();assert.ok(api.validateAnalysisStory(d));d.mode='sourced';assert.equal(api.validateAnalysisStory(d),null);d.sources=[{title:'مرجع',url:'https://www.fifatrainingcentre.com/en/'}];assert.ok(api.validateAnalysisStory(d));
 for(const url of ['javascript:alert(1)','http://example.com','https://user:password@example.com','https://127.0.0.1/path']){d.sources[0].url=url;assert.equal(api.validateAnalysisStory(d),null);}
 const f=fixture();f.sections[0].board.frames[0].players[0].x=106;assert.equal(api.validateAnalysisStory(f),null);
 const dangling=fixture();dangling.sections[0].board.frames[0].arrows[0].to='absent';assert.equal(api.validateAnalysisStory(dangling),null);
 const duplicate=fixture();duplicate.sections[0].board.frames[0].players[1].id='a';assert.equal(api.validateAnalysisStory(duplicate),null);
});
test('stream chunks keep structured JSON hidden until complete, without swallowing surrounding prose',()=>{
 const value=fenced(fixture());for(let n=25;n<value.length;n+=83){const parts=api.splitAnalysisStory(value.slice(0,n));assert.ok(['pending','story'].includes(parts.at(-1).kind));}
 const parts=api.splitAnalysisStory('مقدمة\n'+value+'\nخاتمة');assert.equal(parts.map(p=>p.kind).join(','),'text,story,text');assert.match(parts[0].text,/مقدمة/);assert.match(parts[2].text,/خاتمة/);
 assert.equal(api.splitAnalysisStory('```aifball-analysis\n{broken}\n```')[0].kind,'invalid');
 const bad=fixture();bad.sections[0].board.frames[0].ball=[-1,5];const fallback=api.splitAnalysisStory(fenced(bad))[0];assert.equal(fallback.kind,'invalid');assert.match(fallback.text,/شرح قبل الملعب/);assert.doesNotMatch(fallback.text,/players|arrows/);
});
test('render order is explanation, independent pitch, then interpretation; nothing opens the exercise library',()=>{
 const Component=load('app/components/AnalysisStory.tsx').default;const html=renderToStaticMarkup(React.createElement(Component,{data:fixture()}));
 assert.ok(html.indexOf('شرح قبل الملعب')<html.indexOf('<figure'));assert.ok(html.indexOf('</figure>')<html.indexOf('تفسير بعد الملعب'));assert.match(html,/شرح دفاعي/);assert.doesNotMatch(html,/مكتبة التمارين/);
});
test('analysis route preserves the original question, conversation and files and forwards cancellation',async()=>{
 let payload,signal;const route=load('app/api/chat/route.ts',async(url,options)=>{payload=JSON.parse(options.body);signal=options.signal;return new Response('data: {}\n\n',{headers:{'content-type':'text/event-stream'}});});
 const req=new Request('https://example.test/api/chat',{method:'POST',body:JSON.stringify({query:'حلل أسلوب المدرب',conversation_id:'abc',files:[{id:'file'}]})});const r=await route.POST(req);assert.equal(r.headers.get('X-AiFBall-Presentation'),'analysis-story');assert.ok(payload.query.startsWith('حلل أسلوب المدرب'));assert.match(payload.query,/aifball-analysis/);assert.equal(payload.conversation_id,'abc');assert.equal(payload.files[0].id,'file');assert.equal(signal,req.signal);
 await route.POST(new Request('https://example.test/api/chat',{method:'POST',body:JSON.stringify({query:'مرحبا'})}));assert.equal(payload.query,'مرحبا');
 const invalid=await route.POST(new Request('https://example.test/api/chat',{method:'POST',body:JSON.stringify({query:12})}));assert.equal(invalid.status,400);
});

test('follow-up tactical questions retain story mode while standings/stats/drills stay separate',()=>{
 const previous=fenced(fixture());for(const q of ['وفي الدفاع؟','والكرات الثابتة؟','وإذا ضغط الخصم؟'])assert.equal(api.analysisModeForQuery(q,previous),true,q);
 for(const q of ['اعطني جدول الدوري','كم احصائياته','ابي تمرين','مرحبا'])assert.equal(api.analysisModeForQuery(q,previous),false,q);
 assert.equal(api.analysisModeForQuery('حلل اسلوب المدرب'),true);
});
test('actual Dify teaching response validates and renders two different contextual pitches',()=>{
 const raw=JSON.parse(fs.readFileSync('tests/fixtures/analysis-teaching.json','utf8'));
 const valid=api.validateAnalysisStory(raw);assert.ok(valid);assert.equal(valid.mode,'illustrative');assert.equal(valid.sections.length,2);
 assert.notEqual(JSON.stringify(valid.sections[0].board),JSON.stringify(valid.sections[1].board));
 const Component=load('app/components/AnalysisStory.tsx').default;const html=renderToStaticMarkup(React.createElement(Component,{data:valid}));assert.equal((html.match(/<figure/g)||[]).length,2);assert.doesNotMatch(html,/مكتبة التمارين/);
});

test('actual live Preview response supports movement into space without inventing player endpoints',()=>{
 const raw=JSON.parse(fs.readFileSync('tests/fixtures/analysis-live.json','utf8'));const original=JSON.stringify(raw);const valid=api.validateAnalysisStory(raw);assert.ok(valid);assert.equal(JSON.stringify(raw),original);
 assert.ok(valid.sections.some(s=>s.board.frames.some(f=>f.arrows.some(a=>Array.isArray(a.to)))));
 const bad=fixture();bad.sections[0].board.frames[0].arrows[0].to='55,900';assert.equal(api.validateAnalysisStory(bad),null);
 const Component=load('app/components/AnalysisStory.tsx').default;const html=renderToStaticMarkup(React.createElement(Component,{data:valid}));assert.equal((html.match(/<figure/g)||[]).length,2);
});

test('truncated structured answers preserve completed prose and complete sections only',()=>{
 const sample=fixture();const first=sample.sections[0];
 const raw='```aifball-analysis\n'+JSON.stringify({title:sample.title,scope:sample.scope,mode:'illustrative',intro:sample.intro,sources:[]}).slice(0,-1)+',"sections":['+JSON.stringify(first)+',{"title":"لم تكتمل';
 const part=api.splitAnalysisStory(raw)[0];assert.equal(part.kind,'pending');assert.equal(part.data.sections.length,1);assert.equal(part.data.sections[0].explanation,first.explanation);assert.doesNotMatch(JSON.stringify(part.data),/لم تكتمل/);
 const rawSourced=raw.replace('"illustrative"','"sourced"');const fallback=api.splitAnalysisStory(rawSourced)[0];assert.equal(fallback.data,undefined);assert.match(fallback.text,/شرح قبل الملعب/);
 const escaped={...sample,intro:'كلمة فيها "اقتباس" و قوس } داخل النص'};const cut='```aifball-analysis\n'+JSON.stringify(escaped).slice(0,-5);assert.match(api.splitAnalysisStory(cut)[0].text||api.splitAnalysisStory(cut)[0].data?.intro||'',/اقتباس/);
});

test('actual interrupted Enrique response retains explanation without fabricating missing sources',()=>{
 const raw=fs.readFileSync('tests/fixtures/analysis-interrupted.txt','utf8');const parts=api.splitAnalysisStory(raw);const part=parts.find(p=>p.kind==='pending');assert.ok(part);assert.ok(part.text.includes('لويس إنريكي'));assert.ok(part.text.length>1000);assert.equal(part.data,undefined);assert.doesNotMatch(part.text,/\"players\"|aifball-analysis/);
});

test('bounded player names render compact tokens while retaining full accessible labels',()=>{
 const raw=fixture();raw.sections[0].board.frames[0].players[0].number=' PlayerName';const original=JSON.stringify(raw);const valid=api.validateAnalysisStory(raw);assert.ok(valid);assert.equal(JSON.stringify(raw),original);
 const Component=load('app/components/AnalysisStory.tsx').default;const html=renderToStaticMarkup(React.createElement(Component,{data:valid}));assert.equal((html.match(/<figure/g)||[]).length,1);assert.match(html,/PlayerName/);assert.match(html,/>Pl<\/text>/);
 const bad=fixture();bad.sections[0].board.frames[0].players[0].number='x'.repeat(41);assert.equal(api.validateAnalysisStory(bad),null);
});

test('motion interpolates matching players, ball and labels without mutating or inventing paths',()=>{
 const motion=load('lib/analysis-motion.ts');const a=fixture().sections[0].board.frames[0];const b=JSON.parse(JSON.stringify(a));b.players[0].x=60;b.players[0].y=40;b.ball=[50,40];const original=JSON.stringify(a);const mid=motion.interpolateAnalysisFrame(a,b,0.5);assert.equal(mid.players[0].x,45);assert.equal(mid.players[0].y,30);assert.equal(mid.ball[0],40);assert.equal(JSON.stringify(a),original);assert.equal(motion.interpolateAnalysisFrame(a,b,1).players[0].x,60);b.players[0].id='new';assert.equal(motion.interpolateAnalysisFrame(a,b,0.5).players[0].x,60);
 assert.equal(motion.analysisStep(0,'previous',3),0);assert.equal(motion.analysisStep(2,'next',3),2);assert.equal(motion.analysisStep(2,'restart',3),0);
});
test('multi-frame pitch exposes Arabic playback controls while static replies remain honest',()=>{
 const Pitch=load('app/components/AnalysisPitch.tsx').default;const f=fixture().sections[0].board.frames[0];const html=renderToStaticMarkup(React.createElement(Pitch,{caption:'تفسير',frames:[f,{...f,title:'استلام'}]}));for(const label of ['السابق','التالي','تشغيل المشهد','من البداية','سرعة العرض','الخطوة'])assert.match(html,new RegExp(label));const staticHtml=renderToStaticMarkup(React.createElement(Pitch,{caption:'ثابت',frames:[f]}));assert.match(staticHtml,/مشهد ثابت/);assert.doesNotMatch(staticHtml,/تشغيل المشهد/);
});
test('authored motion review scene validates and changes the supplied ball and player positions',()=>{
 const data=JSON.parse(fs.readFileSync('tests/fixtures/analysis-motion.json','utf8'));const valid=api.validateAnalysisStory(data);assert.ok(valid);const frames=valid.sections[0].board.frames;assert.equal(frames.length,3);assert.notEqual(frames[0].players[1].y,frames[1].players[1].y);assert.notEqual(frames[1].ball[0],frames[2].ball[0]);assert.deepEqual(frames[0].players.map(p=>p.id),frames[2].players.map(p=>p.id));
});
