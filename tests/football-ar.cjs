const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const moduleObject = { exports: {} };
vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/football-names-ar.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText, { module: moduleObject, exports: moduleObject.exports });
const { footballNameInArabic: name, footballGroupInArabic: group } = moduleObject.exports;

test('Arabic display names cover national teams and priority Asian clubs', () => {
  for (const [source, expected] of [['Saudi Arabia', 'السعودية'], ['Argentina', 'الأرجنتين'], ['Al Ittihad', 'الاتحاد'], ['Al Hilal', 'الهلال'], ['UAE', 'الإمارات'], ['Brazil', 'البرازيل'], ['South Korea', 'كوريا الجنوبية'], ['Kashima', 'كاشيما أنتلرز'], ['Shabab Al Ahli', 'شباب الأهلي'], ['CF Montreal', 'مونتريال']]) assert.equal(name(source), expected);
  assert.equal(name('  St. Vincent '), 'سانت فنسنت والغرينادين');
  assert.equal(name('UNLISTED TEAM'), null);
});

test('Arabic group labels retain regional and hierarchical distinctions', () => {
  assert.equal(group('East Region'), 'منطقة الشرق');
  assert.equal(group('West Region'), 'منطقة الغرب');
  assert.equal(group('2026 FIFA World Cup CAF Qualifying - Group A'), 'المجموعة A');
  assert.equal(group('League A, Group B'), 'المستوى A، المجموعة B');
  assert.equal(group('League B / Group 2'), 'المستوى B / المجموعة 2');
});
