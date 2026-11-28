const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript'),vm=require('node:vm');
function load(file,mocks={},extra={}){const m={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{module:m,exports:m.exports,require:n=>mocks[n]||{},URL,URLSearchParams,AbortController,setTimeout,clearTimeout,fetch,Date,...extra});return m.exports;}
const client=load('lib/chat-jobs-client.ts'),server=load('lib/chat-jobs-server.ts');
const id='12345678-1234-1234-1234-123456789abc';
const response=(status,body)=>({status,ok:status>=200&&status<300,json:async()=>body});
const state=(status,answer='')=>({status,answer,conversation_id:''});
test('polling stops immediately on expired login, missing job or unavailable configuration',async()=>{
 for(const [status,result]of [[401,'unauthenticated'],[403,'missing'],[404,'missing'],[503,'unavailable']]){let count=0;assert.equal(await client.pollChatJob(id,{signal:new AbortController().signal,onUpdate(){},fetcher:async()=>{count++;return response(status);},wait:async()=>{throw Error('should not retry');}}),result);assert.equal(count,1);}
});
test('network failures are bounded and do not resubmit a paid generation',async()=>{
 let calls=0;const result=await client.pollChatJob(id,{signal:new AbortController().signal,onUpdate(){},fetcher:async(path,options)=>{assert.ok(path.includes(id));assert.equal(options.method,undefined);calls++;throw Error('offline');},wait:async()=>{}});
 assert.equal(result,'unavailable');assert.equal(calls,4);
});
test('unchanged progress does not rewrite storage; a completed result is emitted once',async()=>{
 const values=[state('queued'),state('queued'),state('running','جزء'),state('completed','رد كامل')],seen=[];
 assert.equal(await client.pollChatJob(id,{signal:new AbortController().signal,onUpdate:j=>seen.push(j),fetcher:async()=>response(200,values.shift()),wait:async()=>{}}),'completed');
 assert.equal(seen.length,3);assert.equal(seen.at(-1).answer,'رد كامل');
});
test('aborted or timed-out requests never leave polling waiting indefinitely',async()=>{
 const parent=new AbortController();parent.abort();let calls=0;
 assert.equal(await client.pollChatJob(id,{signal:parent.signal,onUpdate(){},fetcher:async()=>{calls++;}}),'aborted');assert.equal(calls,0);
 const result=await client.pollChatJob(id,{signal:new AbortController().signal,onUpdate(){},requestTimeoutMs:2,fetcher:async(_,options)=>new Promise((_,reject)=>options.signal.addEventListener('abort',()=>reject(Error('timeout')),{once:true})),wait:async()=>{}});
 assert.equal(result,'unavailable');
});
test('background jobs pause after a bounded active window while retaining resumability',async()=>{
 let clock=0;const result=await client.pollChatJob(id,{signal:new AbortController().signal,onUpdate(){},maxActiveMs:10,now:()=>clock,fetcher:async()=>response(200,state('running')),wait:async()=>{clock+=10;}});assert.equal(result,'paused');
});
test('cancellation interrupts retry delay and releases its listener',async()=>{
 const c=new AbortController();const p=client.waitForJobRetry(60000,c.signal);c.abort();await p;
});
test('malformed and empty final results are rejected; queued null fields remain valid',()=>{
 assert.equal(client.parseChatJob({status:'completed',answer:''}),null);assert.equal(client.parseChatJob({status:'running',answer:123}),null);assert.equal(client.parseChatJob({status:'mystery'}),null);
 assert.equal(client.parseChatJob({status:'queued',answer:null,conversation_id:null}).answer,'');
});
test('server access fails closed on missing configuration, SDK failure and signed-out sessions',async()=>{
 assert.equal((await server.chatJobsAccess(async()=>{throw Error('must not call');},{})).status,503);
 assert.equal((await server.chatJobsAccess(async()=>{throw Error('SDK failure');},{CLERK_SECRET_KEY:'unit-test'})).status,503);
 assert.equal((await server.chatJobsAccess(async()=>({userId:null}),{CLERK_SECRET_KEY:'unit-test'})).status,401);
 for(const base of ['http://worker.invalid','https://user:pass@worker.invalid','https://worker.invalid/?token=x'])assert.equal((await server.chatJobsAccess(async()=>({userId:'owner'}),{CLERK_SECRET_KEY:'unit-test',AIFBALL_RENDER_API_URL:base,CHAT_JOBS_TOKEN:'unit-test'})).status,503);
});
test('job creation binds ownership to the verified session, and drops backend secrets from responses',async()=>{
 let submitted;
 const route=load('app/api/chat/jobs/route.ts',{'../../../../lib/chat-jobs-server':server,'../../../../lib/chat-intent':{playerPromptIntent:()=>({playerCareer:false})},'../../../../lib/player-prompt':{},'../../../../lib/app-language':{preferredAnswerLanguage:()=>''},'@clerk/nextjs/server':{auth:async()=>({userId:'verified-owner'})},'next/server':{NextResponse:{json:(body,options)=>({body,status:options.status})}}},{process:{env:{CLERK_SECRET_KEY:'unit-test',AIFBALL_RENDER_API_URL:'https://worker.invalid',CHAT_JOBS_TOKEN:'unit-test'}},AbortSignal,fetch:async(url,options)=>{submitted=JSON.parse(options.body);return response(200,{id,owner:'hidden',token:'not-for-client'});}});
 const result=await route.POST(new Request('https://app.invalid/api/chat/jobs',{method:'POST',body:JSON.stringify({query:'سؤال',idempotency_key:'unique-test-key',owner:'other-owner'})}));
 assert.equal(submitted.owner,'verified-owner');assert.equal(result.status,200);assert.equal(Object.keys(result.body).join(','),'id');
});
test('job polling forwards only the authenticated owner and rejects mismatched response IDs',async()=>{
 let url;
 const route=load('app/api/chat/jobs/[id]/route.ts',{'../../../../../lib/chat-jobs-server':server,'../../../../../lib/chat-jobs-client':client,'@clerk/nextjs/server':{auth:async()=>({userId:'verified-owner'})},'next/server':{NextResponse:{json:(body,options)=>({body,status:options.status})}}},{process:{env:{CLERK_SECRET_KEY:'unit-test',AIFBALL_RENDER_API_URL:'https://worker.invalid',CHAT_JOBS_TOKEN:'unit-test'}},AbortSignal,fetch:async target=>{url=target;return response(200,{...state('completed','رد'),id:'different-id',owner:'secret'});}});
 const result=await route.GET(new Request('https://app.invalid/api/chat/jobs/'+id+'?owner=attacker'),{params:{id}});
 assert.ok(url.endsWith('?owner=verified-owner'));assert.equal(result.status,502);assert.equal(result.body.error,'invalid_job_response');
});
