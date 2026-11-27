const {test}=require('node:test'),assert=require('node:assert/strict');
const ts=require('typescript'),fs=require('node:fs'),vm=require('node:vm');
const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
const m={exports:{}};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('app/components/SeasonText.tsx','utf8'),{
 compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React,esModuleInterop:true}
}).outputText,{exports:m.exports,module:m,require});
test('Arabic prose isolates both season ranges without reordering values, dates or scores',()=>{
 const html=renderToStaticMarkup(React.createElement(m.exports.default,{text:'لاعب الموسم 2022-2023 و٢٠٢٣–٢٠٢٤. النتيجة 3-2 بتاريخ 2026-11-27 <script>'}));
 assert.ok(html.includes('<bdi dir="ltr">2022-2023</bdi>'));
 assert.ok(html.includes('<bdi dir="ltr">٢٠٢٣–٢٠٢٤</bdi>'));
 assert.equal((html.match(/<bdi/g)||[]).length,2);
 assert.ok(html.includes('3-2 بتاريخ 2026-11-27 &lt;script&gt;'));
});
