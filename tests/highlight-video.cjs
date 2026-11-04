const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), ts = require('typescript');
const modules = new Map();
function load(file) {
  file = path.resolve(file); if (modules.has(file)) return modules.get(file).exports;
  const m = { exports: {} }; modules.set(file, m);
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  vm.runInNewContext(code, { module: m, exports: m.exports, require: n => n.startsWith('.') ? load(path.resolve(path.dirname(file), n + '.ts')) : require(n), URL, process, fetch, AbortController, setTimeout, clearTimeout, ReadableStream, TextDecoder, TextEncoder });
  return m.exports;
}
const h = load('lib/highlight-video.ts'), v = load('lib/verified-summary.ts');
const match = { home: 'Villarreal', away: 'Paris Saint-Germain', date: '2026-11-03' };
const channelId = 'UC' + 'a'.repeat(22), id = 'abcdefghijk';
const title = 'ملخص مباراة فياريال وباريس سان جيرمان';
function watch({ channel = 'beinsports', date = '2026-11-03T22:30:00Z', embed = false, name = title, publisherId = channelId } = {}) {
  return 'var ytInitialPlayerResponse = ' + JSON.stringify({ videoDetails: { videoId: id, channelId: publisherId, title: name }, playabilityStatus: { status: 'OK', playableInEmbed: embed }, microformat: { playerMicroformatRenderer: { ownerProfileUrl: 'https://www.youtube.com/@' + channel, ownerChannelName: channel, publishDate: date } } }) + ';</script>';
}
function channelPage() {
  return 'var ytInitialData = ' + JSON.stringify({ metadata: { channelMetadataRenderer: { externalId: channelId, vanityChannelUrl: 'https://www.youtube.com/@beinsports' } }, contents: { lockupViewModel: { contentId: id, contentType: 'LOCKUP_CONTENT_TYPE_VIDEO', metadata: { lockupMetadataViewModel: { title: { content: title } } } } } }) + ';</script>';
}
test('disabled embedding does not reject a verified official highlight', () => {
  const video = h.videoMetadata(watch(), id, match, channelId);
  assert.equal(video.embeddable, false); assert.equal(video.url, 'https://www.youtube.com/watch?v=' + id);
});
test('rejects wrong channel, channel ID, teams, and previous-season videos', () => {
  for (const options of [{ channel: 'fakebeinsports' }, { date: '2025-11-03T22:30:00Z' }, { name: 'ملخص فياريال وبرشلونة' }, { publisherId: 'UC' + 'b'.repeat(22) }]) assert.throws(() => h.videoMetadata(watch(options), id, match, channelId));
});
test('recent channel uploads are discovered without oEmbed or a paid API key', async () => {
  const requested = [];
  const fetcher = async url => { requested.push(url); if (url.includes('/@beinsports/')) return new Response(channelPage()); if (url.includes('/watch?')) return new Response(watch()); return new Response('', { status: 503 }); };
  const result = await h.findHighlightVideo(match, '', undefined, fetcher);
  assert.equal(result.status, 'found'); assert.equal(result.video.id, id); assert.equal(result.video.embeddable, false);
  assert.ok(!requested.some(url => /oembed|googleapis/.test(url)));
});
test('fetch failure is reported separately from a successful search with no match', async () => {
  const result = await h.findHighlightVideo({ ...match, home: 'Unmatched team' }, '', undefined, async () => new Response('', { status: 503 }));
  assert.equal(result.status, 'unavailable');
});
test('the stream answer uses verified metadata and strips an unverified model URL', async () => {
  const answer = '<aifball-summary home="فياريال" away="باريس سان جيرمان" date="2026-11-03" video_url="https://youtu.be/abcdefghijk" />';
  const found = await v.verifySummaryAnswer(answer, undefined, async () => ({ status: 'found', video: { url: 'https://www.youtube.com/watch?v=lmnopqrstuv', embeddable: false, channel: 'beIN SPORTS', publishedAt: '2026-11-03T22:30:00Z' } }));
  assert.ok(found.includes('video_embed="false"')); assert.ok(found.includes('video_status="found"')); assert.ok(!found.includes('abcdefghijk'));
  const unavailable = await v.verifySummaryAnswer(answer, undefined, async () => ({ status: 'unavailable' }));
  assert.ok(!unavailable.includes('video_url=')); assert.ok(unavailable.includes('video_status="unavailable"'));
});
test('public metadata parser never executes scripts and handles braces in strings', () => {
  assert.equal(h.pageJson('var demo = {"title":"a } \\\" b"};</script>', 'demo').title, 'a } " b');
  assert.throws(() => h.pageJson('var demo = alert("bad");', 'demo'));
});
