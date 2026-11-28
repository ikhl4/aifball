const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), vm = require('node:vm'), ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

const identityModule = { exports: {} };
vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/player-identity.ts', 'utf8'), {
 compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
}).outputText, { exports: identityModule.exports, module: identityModule });

function renderProfile(status, requestQuery) {
  let hook = 0;
  const react = { ...React, useEffect() {}, useState(initial) {
    const value = hook++ === 1 ? { key: requestQuery ? 'Javi Guerra (Valencia):2026-2027' : 'Javi Guerra:2026-2027', data: { status, rows: [] } } : initial;
    return [value, () => {}];
  } };
  const m = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync('app/components/PlayerProfile.tsx', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 }
  }).outputText;
  vm.runInNewContext(code, { exports: m.exports, module: m, URL, URLSearchParams, AbortController,
    require(name) {
      if (name === 'react') return react;
      if (name.endsWith('player-identity')) return identityModule.exports;
      if (name === 'react/jsx-runtime') return require(name);
      if (name.endsWith('player-profile-status')) return { playerProfileStatus: () => 'الاسم يطابق أكثر من لاعب' };
      if (name.endsWith('football-names-ar')) return { footballNameInArabic: x => x };
      if (name.endsWith('competitions')) return { COMPETITIONS: {} };
      if (name.endsWith('SeasonText')) return { default: ({ children }) => children };
      return {};
    }
  });
  return renderToStaticMarkup(React.createElement(m.exports.default, {
    playerName: 'خافي غيرا', requestQuery, details: { lookup_name: 'Javi Guerra', current_season: '2026-2027',
      image_url: 'https://example.org/unverified.jpg', club: 'نادي غير محسوم',
      season_2026_2027_competitions: 'نادي|بطولة|https://example.org/stats|10|8|2|700|3|1|0|0' }
  }));
}

test('ambiguous source identity suppresses season controls, model facts and photo', () => {
  const html = renderProfile('ambiguous');
  assert.match(html, /توضيح هوية اللاعب/);
  assert.match(html, /أكثر من لاعب/);
  for (const text of ['<img', '<button', '<select', '<dd', 'نادي غير محسوم', 'example.org']) assert.ok(!html.includes(text), text);
});
test('a uniquely identified player retains normal season controls', () => {
  const html = renderProfile('found');
  assert.match(html, /نطاق إحصائيات اللاعب/);
  assert.match(html, /أرقام الموسم/);
});

test('a qualified identity with missing or conflicting source data does not ask the user to identify it again', () => {
 for (const status of ['not_found','ambiguous','unavailable']) {
  const html = renderProfile(status, 'نعم خافي غيرا لاعب فالنسيا');
  assert.match(html, /تم تحديد اللاعب والنادي/);
  assert.ok(!html.includes('الاسم يطابق أكثر من لاعب'));
  for (const marker of ['<img','<button','<select','<dd']) assert.ok(!html.includes(marker), marker);
 }
});
