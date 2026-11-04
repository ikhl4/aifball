const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
const cache=new Map();
function load(file){file=path.resolve(file);if(cache.has(file))return cache.get(file).exports;const m={exports:{}};cache.set(file,m);vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,{module:m,exports:m.exports,require:n=>n.startsWith('.')?load(path.resolve(path.dirname(file),n+'.ts')):require(n),URL,process,fetch,AbortController,setTimeout,clearTimeout});return m.exports;}
const api=load('lib/football-history.ts');
const id='abcdefghijk',title='History of Football — Documentary',channel='FIFA';
const tag=kind=>`<aifball-documentary${kind==='offer'?'-offer':''} title="${title}" channel="${channel}" url="https://www.youtube.com/watch?v=${id}" />`;
const metadata=()=>`var ytInitialPlayerResponse = ${JSON.stringify({videoDetails:{videoId:id,title,author:channel,channelId:'UC'+'a'.repeat(22)},playabilityStatus:{status:'OK',playableInEmbed:false},microformat:{playerMicroformatRenderer:{ownerChannelName:channel}}})};</script>`;
test('history and documentary follow-ups do not hijack match summaries or new topics',()=>{
 assert.equal(api.historyMode('من اخترع كرة القدم؟'),'story');
 assert.equal(api.historyMode('متى تأسس الاتحاد؟'),'story');
 assert.equal(api.historyMode('من مؤسس كرة القدم؟'),'story');
 assert.equal(api.historyMode('من أسس نادي الاتحاد؟'),'story');
 assert.equal(api.historyMode('ملخص تاريخ كرة القدم'),'story');
 assert.equal(api.historyMode('متى تاريخ المباراة القادمة؟'),'none');
 assert.equal(api.historyMode('ملخص مباراة فياريال وباريس'),'none');
 assert.equal(api.historyMode('اجلبه','يتوفر وثائقي عن نشأة كرة القدم إذا رغبت'),'documentary');
 assert.equal(api.historyMode('نعم','يتوفر وثائقي عن نشأة كرة القدم إذا رغبت'),'documentary');
 assert.equal(api.historyMode('ابي ملخص مباراة باريس','يتوفر وثائقي إذا رغبت'),'none');
 assert.equal(api.historyMode('اجلبه'),'none');
});
test('a verified documentary is only offered as text in the initial historical answer',async()=>{
 const result=await api.presentHistoryAnswer('قصة مختصرة.\n'+tag('offer'),'story',undefined,async()=>new Response(metadata()));
 assert.match(result,/قصة مختصرة/);assert.match(result,/يتوفر وثائقي/);assert.match(result,/إذا رغبت/);
 assert.doesNotMatch(result,/https:\/\/.*youtu|<aifball-documentary|iframe/);
});
test('explicit request gets a verified documentary, with a watch link when embedding is disabled',async()=>{
 const result=await api.presentHistoryAnswer(tag('video'),'documentary',undefined,async()=>new Response(metadata()));
 assert.match(result,/verified="true"/);assert.match(result,/embed="false"/);assert.match(result,/watch\?v=abcdefghijk/);
});
test('lookup failures and wrong publishers never create an availability claim or unverified video',async()=>{
 for(const body of ['',metadata().replace('"videoId":"abcdefghijk"','"videoId":"wrongvideo1"'),metadata().replaceAll('"FIFA"','"Fake FIFA"')]){
  const result=await api.presentHistoryAnswer('قصة مختصرة.\nيتوفر وثائقي جاهز.\n'+tag('offer'),'story',undefined,async()=>new Response(body));
  assert.equal(result.trim(),'قصة مختصرة.');
 }
});
test('unsolicited raw YouTube links are removed from historical answers',async()=>{
 const result=await api.presentHistoryAnswer('قصة مختصرة.\n[وثائقي](https://www.youtube.com/watch?v=abcdefghijk)','story');
 assert.doesNotMatch(result,/youtu|iframe/);
});
test('match recap renders ordinary prose and bullets before video without a score card',()=>{
 const file='app/components/MatchHighlightCard.tsx',m={exports:{}};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX}}).outputText,{module:m,exports:m.exports,require:n=>n.startsWith('.')?load('lib/summary-presentation.ts'):require(n),URL});
 const html=renderToStaticMarkup(React.createElement(m.exports.default,{attrs:{home:'فياريال',away:'باريس سان جيرمان',home_score:'0',away_score:'6',summary:'قصة المواجهة',goals:'جواو نيفيز|9',video_status:'found',video_url:'https://www.youtube.com/watch?v=abcdefghijk',video_embed:'false'}}));
 assert.ok(html.indexOf('قصة المواجهة')<html.indexOf('ملخص المباراة بالفيديو'));
 assert.match(html,/<ul/);assert.match(html,/جواو نيفيز/);assert.doesNotMatch(html,/grid-cols-\[1fr_auto_1fr\]|text-2xl|bg-\[#101820\]/);
});
