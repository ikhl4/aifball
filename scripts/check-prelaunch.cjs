#!/usr/bin/env node
/** Public GET-only audit. Coverage gaps are reported separately from unsafe output. */
const fs = require('node:fs');
const args = process.argv.slice(2);
const value = key => args[args.indexOf(key) + 1];
if (!args.includes('--base')) throw Error('Usage: node scripts/check-prelaunch.cjs --base https://preview.example [--out report.json]');
const base = new URL(value('--base'));
if (!['http:', 'https:'].includes(base.protocol)) throw Error('Invalid base URL');
const season = value('--season') && args.includes('--season') ? value('--season') : '2026-2027';
const pairs = [
 ['بيرغفال', 'Lucas Bergvall'], ['سكوت ماكتوميناي', 'Scott McTominay'],
 ['هاري كين', 'Harry Kane'], ['آدم وارتون', 'Adam Wharton'],
 ['لينارت كارل', 'Lennart Karl'], ['لوسيان أغومي', 'Lucien Agoume'],
 ['نيكو باز', 'Nico Paz'], ['جوليان ألفاريز', 'Julian Alvarez'],
 ['محمد نور', 'Mohammed Noor'], ['خافي غيرا', 'Javi Guerra'],
 ['Javi Guerra (Valencia)'],
];
const names = [...new Set(pairs.flat())], results = [];
async function check(name) {
 const started = Date.now(), issues = [];
 try {
  const url = new URL('/api/player-profile', base); url.search = new URLSearchParams({name, season});
  const response = await fetch(url, {signal: AbortSignal.timeout(25000)});
  if (!response.ok) throw Error('HTTP ' + response.status);
  const data = await response.json(), rows = data.rows;
  if (!['found','not_found','ambiguous','unavailable','conflict'].includes(data.status)) issues.push('invalid_status');
  if (data.season !== season) issues.push('wrong_season');
  if (!Array.isArray(rows)) issues.push('invalid_rows');
  if (data.status !== 'found' && (rows?.length || data.photo)) issues.push('unverified_data_leaked');
  if (data.status === 'found') {
   const id = data.identity;
   if (id?.provider !== 'ESPN' || !/^\d+$/.test(id?.id || '') || !id?.league) issues.push('missing_stable_identity');
   if (!data.source?.includes('/id/' + id?.id)) issues.push('source_identity_mismatch');
   const scopes = new Set();
   for (const row of rows || []) {
    if (!row.team || !row.league || !new RegExp('\\b' + season.split('-')[0] + '[-–/](' + season.split('-')[1] + '|' + season.split('-')[1]?.slice(-2) + ')\\b').test(row.competition || '') || !row.source?.includes('/id/' + id?.id + '/league/' + row.league)) issues.push('invalid_scope');
    const scope = row.team + ':' + row.league;
    if (scopes.has(scope)) issues.push('duplicate_scope'); scopes.add(scope);
    for (const field of ['matches','starts','substitutes','minutes','goals','assists','yellows','reds']) {
     if (row[field] !== null && (!Number.isSafeInteger(row[field]) || row[field] < 0)) issues.push('invalid_' + field);
    }
    if (row.matches !== null && (row.matches > 100 || row.starts > row.matches || row.substitutes > row.matches || row.minutes > row.matches * 130)) issues.push('impossible_counts');
   }
   if (data.photo && (!data.photo.artist || !data.photo.license || !data.photo.source || !data.photo.url)) issues.push('incomplete_photo_attribution');
  }
  results.push({name, status:data.status, identity:data.identity, canonicalName:data.canonicalName, club:data.club,
   coverage:data.status === 'found' ? (rows?.length ? 'scoped_statistics' : 'identity_only') : 'unavailable',
   rows:rows?.length || 0, photo:Boolean(data.photo), ms:Date.now()-started, issues});
 } catch(error) { results.push({name,status:'request_failed',ms:Date.now()-started,issues:[error.message]}); }
}
(async()=>{
 let cursor = 0;
 await Promise.all([0,1].map(async()=>{while(cursor < names.length) await check(names[cursor++]);}));
 for (const pair of pairs.filter(p=>p.length===2)) {
  const [a,b]=pair.map(n=>results.find(r=>r.name===n));
  if(a.status==='found' && b.status==='found' && a.identity?.id!==b.identity?.id) a.issues.push('arabic_english_identity_mismatch');
 }
 const report={checkedAt:new Date().toISOString(),base:base.origin,season,
  limits:['Structural and source-identity checks only; biography facts require independent review.','No paid chat POST requests, real Safari test, or signed-in background-job test.'],
  total:results.length,qualityFailures:results.filter(r=>r.issues.length).length,
  coverage:results.reduce((all,r)=>(all[r.coverage || r.status]=(all[r.coverage || r.status]||0)+1,all),{}),results};
 const json=JSON.stringify(report,null,2)+'\n';
 if(args.includes('--out')) fs.writeFileSync(value('--out'),json);
 console.log(json); process.exitCode=report.qualityFailures ? 1:0;
})();
