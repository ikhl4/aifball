const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
function load(file){const m={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports:m.exports,module:m});return m.exports;}
const prompt=load('lib/match-summary-prompt.ts');
const competitions=load('lib/competitions.ts');
test('detects match summary requests and daily highlights without catching ordinary stats',()=>{
 assert.equal(prompt.isMatchSummaryRequest('أعطني ملخص مباراة الهلال والنصر'),true);
 assert.equal(prompt.isMatchSummaryRequest('show me match highlights'),true);
 assert.equal(prompt.isMatchSummaryRequest('إحصائيات الهلال والنصر'),false);
 assert.equal(prompt.isTodayHighlightsRequest('ملخصات مباريات اليوم'),true);
 assert.equal(prompt.isTodayHighlightsRequest('ملخص آخر مباراة'),false);
});
test('summary instructions prioritize latest finished match and all verified daily videos from the selected channels',()=>{
 for(const value of ['أحدث مباراة مكتملة','ملخصات اليوم','https://www.youtube.com/@beinsports','https://www.youtube.com/@thmanyahsports','https://www.youtube.com/@tod_bybein','https://www.youtube.com/@seriea','https://www.youtube.com/@laliga','https://www.youtube.com/@mls','https://www.youtube.com/@adsportstv','https://www.youtube.com/@alkasstvsports','https://www.youtube.com/@stctvsports','https://youtu.be/CmYv3AtEPuI']) assert.ok(prompt.MATCH_SUMMARY_RULES.includes(value),value);
});
test('Jawwy U21 is recognized and standings requests stay on official search rather than ESPN widgets',()=>{
 assert.equal(prompt.isJawwyLeagueRequest('جدول دوري جوي للنخبة تحت 21'),true);
 assert.equal(prompt.isJawwyLeagueRequest('Jawwy Elite League U21 results'),true);
 assert.equal(competitions.COMPETITIONS['ksa.jawwy.u21'].searchOnly,true);
 assert.equal(competitions.resolveStandingsRequest('جدول دوري جوي للنخبة تحت 21 2026-2027'),null);
});
