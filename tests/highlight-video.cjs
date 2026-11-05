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
test('official RSS metadata preserves a region-restricted upload', () => {
  const xml = `<feed><yt:channelId>${channelId}</yt:channelId><entry><yt:videoId>${id}</yt:videoId><title>${title}</title></entry></feed>`;
  assert.equal(h.feedVideos(xml, channelId)[0].id, id);
  assert.throws(() => h.feedVideos(xml, 'another-publisher'));
  const regionRestricted = watch().replace('"status":"OK"', '"status":"UNPLAYABLE"');
  assert.equal(h.videoMetadata(regionRestricted, id, match, channelId).embeddable, false);
});
test('named match uses source fixtures and goals even when model search misses it', async () => {
  const single = load('lib/single-match-highlights.ts');
  const date = new Date('2026-11-04T14:00:00Z');
  assert.equal(single.teamMentioned('ملخص فياريال وباريس', 'Paris Saint-Germain'), true);
  assert.equal(single.summaryDateRange('ملخص أمس', date).join(','), '2026-11-03,2026-11-03');
  const event = { id: '123456', date: '2026-11-03T20:00:00Z', status: { type: { completed: true } }, competitions: [{ competitors: [{ homeAway: 'home', team: { displayName: 'Villarreal' }, score: '0' }, { homeAway: 'away', team: { displayName: 'Paris Saint-Germain' }, score: '6' }] }] };
  const fetcher = async url => new Response(JSON.stringify(url.includes('/summary?') ? { header: { competitions: [{ id: '123456', details: [{ scoringPlay: true, ownGoal: false, clock: { displayValue: "17'" }, participants: [{ athlete: { displayName: 'Fabián Ruiz' } }] }] }] } } : { events: url.includes('/uefa.champions/') ? [event] : [] }));
  const lookup = async () => ({ status: 'found', video: { url: 'https://www.youtube.com/watch?v=' + id, channel: 'beIN SPORTS', embeddable: false, publishedAt: '2026-11-03T22:00:00Z' } });
  const answer = await single.buildSingleMatchHighlights('ملخص فياريال وباريس أمس', undefined, fetcher, lookup, date);
  assert.match(answer, /home_score="0" away_score="6"/); assert.match(answer, /goals="فابيان رويز\|17"/); assert.match(answer, /video_embed="false"/); assert.doesNotMatch(answer, /هدف عكسي/);
  assert.equal(await single.buildSingleMatchHighlights('ملخص فياريال وبرشلونة أمس', undefined, fetcher, lookup, date), null);
});

test('unavailable metadata preserves a Dify candidate as visibly unverified', async () => {
  const answer = '<aifball-summary home="بايرن ميونخ" away="أتلتيكو مدريد" date="2026-11-04" video_url="https://youtu.be/abcdefghijk" />';
  const result = await v.verifySummaryAnswer(answer, undefined, async () => ({ status: 'unavailable' }));
  assert.match(result, /video_status="candidate"/);
  assert.match(result, /video_url="https:\/\/www.youtube.com\/watch\?v=abcdefghijk"/);
  assert.match(result, /video_embed="false"/);
  const card = fs.readFileSync('app/components/MatchHighlightCard.tsx', 'utf8');
  assert.match(card, /الناشر غير مؤكد/);
});
test('wrong or absent video IDs remain hidden when verification is unavailable', async () => {
  const answer = '<aifball-summary home="A" away="B" date="2026-11-04" video_url="https://example.com/false" />';
  const result = await v.verifySummaryAnswer(answer, undefined, async () => ({ status: 'unavailable' }));
  assert.doesNotMatch(result, /video_url=/);
});
