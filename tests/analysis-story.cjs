const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
function load(path,fetcher){const m={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.React,esModuleInterop:true}}).outputText,{module:m,exports:m.exports,require:n=>n==='react'?React:n==='next/server'?{NextResponse:{json:(data,options)=>({data,status:options?.status||200})}}:load(n.includes('analysis-prompt')?'lib/analysis-prompt.ts':n.includes('AnalysisPitch')?'app/components/AnalysisPitch.tsx':'lib/analysis-story.ts'),URL,fetch:fetcher,Response,process:{env:{DIFY_API_KEY:'test-placeholder'}},console:{log(){},error(){}},setTimeout,clearTimeout});return m.exports;}
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
 const value=fenced(fixture());for(let n=25;n<value.length;n+=83){const parts=api.splitAnalysisStory(value.slice(0,n));assert.equal(parts.at(-1).kind,'pending');}
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
