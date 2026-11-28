const { test } = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript'), fs = require('node:fs'), vm = require('node:vm');
function load(file, mocks = {}) {
  const m = { exports: {} };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText,
    { exports: m.exports, module: m, require: name => mocks[name] || {}, ReadableStream, TextEncoder, TextDecoder, AbortController, setTimeout, clearTimeout, console });
  return m.exports;
}
const intent = load('lib/chat-intent.ts').playerPromptIntent;
const stream = load('lib/chat-stream.ts');
const summary = load('lib/verified-summary.ts', { './chat-stream': stream });
test('known single-word player requests get the same immediate card path in a fresh or existing chat', () => {
 const {playerPromptIntent,playerLookupSeed}=load('lib/chat-intent.ts');
 for(const name of ['سورلوث','سورلوت','Sorloth','Sørloth'])for(const options of [{},{conversationId:'existing'}]){
  assert.equal(playerPromptIntent(name,options).playerCareer,true);
  assert.equal(playerPromptIntent(name,options).nameOnlyPlayer,true);
  assert.ok(playerLookupSeed(name,options).includes('lookup_pending="true"'));
 }
 for(const topic of ['مرحبا','هلا','شكرا','ساعدني','التدريب','النرويج','كيف','تحليل','مباراة','Sorloth news','غوران','sorlothson'])assert.equal(playerPromptIntent(topic).nameOnlyPlayer,false,topic);
 assert.equal(playerLookupSeed('سورلوث',{hasImage:true}),'');
});
test('local lookup card exists before upstream traffic and remains single when the server seed arrives', () => {
 const seed=load('lib/chat-intent.ts').playerLookupSeed;
 const tag=seed('هاري كين',{},new Date('2026-11-27T00:00:00Z'));
 assert.ok(tag.includes('name="هاري كين"'));assert.ok(tag.includes('lookup_pending="true"'));
 assert.equal(seed('كم عمره'), '');assert.equal(seed('هاري كين',{conversationId:'previous'}),'');assert.equal(seed('هاري كين',{hasImage:true}),'');
 const accumulated=stream.createChatAnswer();
 assert.equal(accumulated.apply({event:'aifball_player_seed',answer:tag}).split('<aifball-player').length-1,1);
 accumulated.apply({event:'aifball_player_seed',answer:tag});
 const final=accumulated.apply({event:'agent_message',answer:'<aifball-player name="هاري كين" lookup_name="Harry Kane" />\nقصة المسيرة'});
 assert.equal(final.split('<aifball-player').length-1,1);assert.ok(final.includes('lookup_origin="هاري كين"'));
});

test('non-player requests never get long player research instructions', () => {
  for (const q of ['ترتيب الدوري السعودي', 'جدول مباريات اليوم', 'أخبار محمد صلاح', 'قارن ميسي ورونالدو', 'تمارين ضد الضغط', 'ملخص مباراة نابولي', 'الهلال والاتحاد', 'ريال مدريد', 'بايرن ميونخ', 'كم عمره', 'وش الأفضل', 'اكتب تغريدة', 'Premier League table', 'Crystal Palace', 'training drills']) {
    assert.equal(intent(q).playerCareer, false, q);
  }
});
test('known ambiguous bare names ask before lookup or generation; qualifiers and other intents remain untouched', () => {
  const { ambiguousPlayerQuestion, playerLookupSeed } = load('lib/chat-intent.ts');
  for (const q of ['خافي غيرا', 'خَافي غويرا', 'Javi Guerra', '  JAVI   GUERRA  ']) {
    assert.match(ambiguousPlayerQuestion(q), /فالنسيا.*المعتزل/);
    assert.equal(playerLookupSeed(q), '');
  }
  assert.match(ambiguousPlayerQuestion('Javi Guerra', { english: true }), /Valencia.*retired/);
  for (const q of ['خافي غيرا لاعب فالنسيا', 'Javi Guerra retired striker', 'مسيرة خافي غيرا', 'أخبار خافي غيرا', 'Lucas Bergvall', 'كم عمره']) assert.equal(ambiguousPlayerQuestion(q), undefined, q);
  assert.equal(ambiguousPlayerQuestion('Javi Guerra', { hasImage: true }), undefined);
});
test('Arabic and English names still use player rules; followups and images retain context', () => {
  for (const q of ['لينارت كارل', 'محمد نور', 'كريستيانو رونالدو', 'Lionel Messi', 'Cole Palmer']) assert.equal(intent(q).nameOnlyPlayer, true, q);
  for (const q of ['راتب ميسي', 'مسيرة محمد نور', 'عقد اللاعب', 'player profile Lionel Messi']) assert.equal(intent(q).playerCareer, true, q);
  assert.equal(intent('لينارت كارل', { conversationId: 'existing' }).playerCareer, false);
  assert.equal(intent('من هو اللاعب محمد نور').playerCareer, true);
  assert.equal(intent('لينارت كارل', { hasImage: true }).playerCareer, false);
});
test('SSE skips ping and malformed data; joins multiline JSON', () => {
  for (const raw of ['event: ping', ': heartbeat', 'data: [DONE]', 'data: null', 'data: []', 'data: invalid']) assert.equal(stream.parseSSEFrame(raw), null);
  assert.equal(stream.parseSSEFrame('event: message\r\ndata: {"event":"message",\r\ndata: "answer":"هلا"}').answer, 'هلا');
});
test('Agent final answer replaces deltas; moderation replaces prior text and custom cards survive', () => {
  const a = stream.createChatAnswer();
  assert.equal(a.apply({ event: 'agent_message', answer: 'مرحبا ' }), 'مرحبا ');
  const card = 'مرحبا <aifball-player name="محمد نور" />';
  assert.equal(a.apply({ event: 'agent_message', answer: '<aifball-player name="محمد نور" />' }), card);
  assert.equal(a.apply({ event: 'message', answer: card }), card);
  assert.equal(a.apply({ event: 'message_replace', answer: 'رد بديل' }), 'رد بديل');
  assert.equal(a.apply({ event: 'agent_thought', answer: 'private' }), null);
  const chatbot = stream.createChatAnswer();
  chatbot.apply({ event: 'message', answer: 'أ' });
  assert.equal(chatbot.apply({ event: 'message', answer: 'ب' }), 'أب');
});
test('byte-sized UTF8/CRLF chunks preserve Arabic and stop at end even if connection stays open', async () => {
  const wire = 'event: ping\r\n\r\ndata: {"event":"message","answer":"هلا ⚽"}\r\n\r\ndata: {"event":"message_end"}\r\n\r\ndata: {"event":"message","answer":"ignored"}\r\n\r\n';
  let cancelled = false, index = 0;
  const bytes = new TextEncoder().encode(wire), events = [];
  const body = new ReadableStream({ pull(c) { if (index < bytes.length) c.enqueue(bytes.slice(index, ++index)); }, cancel() { cancelled = true; } });
  await stream.consumeChatStream(body, e => { events.push(e); return e.event !== 'message_end'; });
  assert.equal(events.length, 2); assert.equal(events[0].answer, 'هلا ⚽');
  assert.equal(cancelled, true); assert.equal(body.locked, false);
});
test('reader errors release lock and unterminated final JSON is consumed', async () => {
  const failure = new ReadableStream({ start(c) { c.error(new Error('offline')); } });
  await assert.rejects(stream.consumeChatStream(failure, () => {}), /offline/);
  assert.equal(failure.locked, false);
  let answer;
  const body = new ReadableStream({ start(c) { c.enqueue(new TextEncoder().encode('data: {"event":"message","answer":"نهاية"}')); c.close(); } });
  await stream.consumeChatStream(body, e => { answer = e.answer; });
  assert.equal(answer, 'نهاية');
});
test('verification wrapper verifies the final replacement and does not leak unverified deltas', async () => {
  const events = [{event:'agent_message',answer:'old'}, {event:'message',answer:'old full'}, {event:'message_replace',answer:'replacement'}, {event:'message_end',conversation_id:'same'}];
  const body = new ReadableStream({ start(c) { c.enqueue(new TextEncoder().encode(events.map(e => 'data: '+JSON.stringify(e)+'\n\n').join(''))); c.close(); } });
  let verified;
  const checked = summary.verifiedSummaryStream(body, undefined, async answer => { verified = answer; return 'checked '+answer; });
  const received = [];
  await stream.consumeChatStream(checked, e => { received.push(e); });
  assert.equal(verified, 'replacement'); assert.equal(received.length, 2);
  assert.equal(received[0].answer, 'checked replacement'); assert.equal(received[1].conversation_id, 'same');
});
test('independent player lookup card survives an Agent final answer that omits it, without duplicate cards', () => {
 const a=stream.createChatAnswer();const seed='<aifball-player name="نيكو باز" lookup_pending="true" />';
 assert.equal(a.apply({event:'aifball_player_seed',answer:seed}),seed+'\n\n');
 a.apply({event:'agent_message',answer:'سيرة اللاعب'});
 assert.equal(a.apply({event:'message',answer:'السيرة النهائية'}),seed+'\n\nالسيرة النهائية');
 const full='<aifball-player name="نيكو باز" lookup_name="Nico Paz" lookup_origin="نيكو باز" />\n\nقصة المسيرة';
 assert.equal(a.apply({event:'message',answer:full}),full);
 assert.equal(a.apply({event:'message_replace',answer:'بديل'}),seed+'\n\nبديل');
});

test('inline and multiline model card tags become one standalone widget, never a disappearing inline tag', () => {
 const a=stream.createChatAnswer();a.apply({event:'aifball_player_seed',answer:'<aifball-player name="نيكو باز" />'});
 const output=a.apply({event:'agent_message',answer:'<aifball-player\n name="نيكو باز" lookup_name="Nico Paz" />قصة المسيرة'});
 assert.equal(output,'<aifball-player  name="نيكو باز" lookup_name="Nico Paz" lookup_origin="نيكو باز" />\n\nقصة المسيرة');
 assert.equal((output.match(/<aifball-player/g)||[]).length,1);
 assert.equal(a.apply({event:'message',answer:'قصة المسيرة'}),output);
});

test('later English spellings cannot replace the source lookup identity or remove its season', () => {
 const a=stream.createChatAnswer();a.apply({event:'aifball_player_seed',answer:'<aifball-player name="نيكو باز" current_season="2026-2027" />'});
 const text=a.apply({event:'agent_message',answer:'<aifball-player name="نيكو باز" lookup_name="Nicolas Paz" />سيرة'});
 assert.ok(text.includes('lookup_origin="نيكو باز"'));assert.ok(text.includes('current_season="2026-2027"'));
 assert.ok(text.endsWith('\n\nسيرة'));
});

test('saved and background replies normalize fenced/inline cards without changing ordinary code or prose', () => {
 const tag='<aifball-player name="نيكو باز" lookup_name="Nico Paz" />';
 assert.equal(stream.normalizePlayerMarkup(tag+'قصة المسيرة'),tag+'\nقصة المسيرة');
 assert.equal(stream.normalizePlayerMarkup('```html\n'+tag+'\n```\nقصة المسيرة'),tag+'\nقصة المسيرة');
 assert.equal(stream.normalizePlayerMarkup('شرح\n```js\nconst x = 1;\n```'),'شرح\n```js\nconst x = 1;\n```');
 assert.equal(stream.normalizePlayerMarkup('نص عادي'),'نص عادي');
});

test('explicit player requests never seed a lookup with request words included in the name', () => {
 for(const q of ['راتب ميسي','بطاقة محمد نور','مسيرة نيكو باز','أرقام محمد نور','إحصائيات نيكو باز']){assert.equal(intent(q).playerCareer,true,q);assert.equal(intent(q).nameOnlyPlayer,false,q);}
 assert.equal(intent('أرقام الهلال').playerCareer,false);
});

test('a silent broken stream times out, preserves received text and cancels without another request', async()=>{
 let cancelled=false;const accumulated=stream.createChatAnswer();let text='';
 const body=new ReadableStream({start(c){c.enqueue(new TextEncoder().encode('data: {"event":"agent_message","answer":"جزء محفوظ"}\n\n'));},cancel(){cancelled=true;}});
 await assert.rejects(stream.consumeChatStream(body,e=>{text=accumulated.apply(e)||text;},undefined,{idleTimeoutMs:10}),/CHAT_STREAM_IDLE/);
 assert.equal(text,'جزء محفوظ');assert.equal(cancelled,true);assert.equal(body.locked,false);
});
