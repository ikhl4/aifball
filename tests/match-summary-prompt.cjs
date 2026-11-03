const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
function load(file){const m={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports:m.exports,module:m});return m.exports;}
const prompt=load('lib/match-summary-prompt.ts');
const presentation=load('lib/summary-presentation.ts');
const competitions=load('lib/competitions.ts');
test('detects match summary requests and daily highlights without catching ordinary stats',()=>{
 assert.equal(prompt.isMatchSummaryRequest('أعطني ملخص مباراة الهلال والنصر'),true);
 assert.equal(prompt.isMatchSummaryRequest('show me match highlights'),true);
 assert.equal(prompt.isMatchSummaryRequest('إحصائيات الهلال والنصر'),false);
 assert.equal(prompt.isTodayHighlightsRequest('ملخصات مباريات اليوم'),true);
 assert.equal(prompt.isTodayHighlightsRequest('ملخص آخر مباراة'),false);
});
test('daily requests play video before its recap; a specific match recaps before its video',()=>{
 assert.equal(presentation.summaryPresentationMode('ملخصات مباريات الأمس'),'date');
 assert.equal(presentation.summaryPresentationMode('ملخصات اليوم'),'date');
 assert.equal(presentation.summaryPresentationMode('ملخص مباراة الهلال والنصر'),'single');
 assert.equal(presentation.summaryPresentationMode('إحصائيات الهلال والنصر'),'none');
 assert.equal(presentation.youtubeVideoId('https://youtu.be/abcdefghijk'),'abcdefghijk');
 assert.equal(presentation.youtubeVideoId('https://www.youtube.com/watch?v=abcdefghijk'),'abcdefghijk');
 assert.equal(presentation.youtubeVideoId('https://example.com/watch?v=abcdefghijk'),null);
 for(const value of ['order="video-first"','order="video-last"','video_url=']) assert.ok(prompt.MATCH_SUMMARY_RULES.includes(value),value);
});
test('summary instructions prioritize latest finished match and all verified daily videos from the selected channels',()=>{
 for(const value of ['أحدث مباراة مكتملة','ملخصات اليوم','ملخصات الأمس','الدوري الإنجليزي الممتاز','الدوري الإسباني','الدوري الإيطالي','الدوري الألماني','الدوري الفرنسي','دوري روشن السعودي','دوري أبطال أوروبا','دوري أبطال آسيا للنخبة','في أي بطولة','لا تسأل المستخدم عن فريق أو بطولة','نفّذ بحثاً فعلياً متعدد الخطوات','لا تكتفِ باستعلام عام','مصادر البحث التي جُرّبت','https://www.youtube.com/@beinsports','https://www.youtube.com/@thmanyahsports','https://www.youtube.com/@tod_bybein','https://www.youtube.com/@seriea','https://www.youtube.com/@laliga','https://www.youtube.com/@mls','https://www.youtube.com/@adsportstv','https://www.youtube.com/@alkasstvsports','https://www.youtube.com/@stctvsports','https://youtu.be/CmYv3AtEPuI']) assert.ok(prompt.MATCH_SUMMARY_RULES.includes(value),value);
});
test('Jawwy U21 is recognized and standings requests stay on official search rather than ESPN widgets',()=>{
 assert.equal(prompt.isJawwyLeagueRequest('جدول دوري جوي للنخبة تحت 21'),true);
 assert.equal(prompt.isJawwyLeagueRequest('Jawwy Elite League U21 results'),true);
 assert.equal(competitions.COMPETITIONS['ksa.jawwy.u21'].searchOnly,true);
 assert.equal(competitions.resolveStandingsRequest('جدول دوري جوي للنخبة تحت 21 2026-2027'),null);
});
