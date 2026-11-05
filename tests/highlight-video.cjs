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
test('official publisher name still works when YouTube exposes a /channel/ URL', () => {
  const page = watch({ channel: 'beinsports' }).replace('https://www.youtube.com/@beinsports', 'https://www.youtube.com/channel/' + channelId);
  assert.equal(h.videoMetadata(page, id, match).id, id);
});
test('channel page can use a verified channel ID without a vanity URL', () => {
  const page = channelPage().replace('https://www.youtube.com/@beinsports', '');
  assert.equal(h.channelIndex(page, 'beinsports').channelId, channelId);
});
test('direct YouTube search accepts ordinary eleven-character video IDs', async () => {
  const player = watch();
  const searchPage = 'var ytInitialData = ' + JSON.stringify({ contents: {
    twoColumnSearchResultsRenderer: { primaryContents: { sectionListRenderer: {
      contents: [{ itemSectionRenderer: { contents: [{
        videoRenderer: { videoId: id, title: { runs: [{ text: title }] } }
      }] } }]
    } } }
  } }) + ';</script>';
  const urls = [];
  const fetcher = async url => {
    urls.push(url);
    if (url.includes('/results?')) return new Response(searchPage);
    if (url.includes('/watch?')) return new Response(player);
    return new Response('', { status: 503 });
  };
  const result = await h.findHighlightVideo(match, '', undefined, fetcher);
  assert.equal(result.status, 'found');
  assert.equal(result.video.id, id);
  assert.ok(urls.some(url => url.includes('/results?')));
  assert.ok(!urls.some(url => url.includes('/@beinsports/videos')));
});
test('DuckDuckGo preserves an official highlight when YouTube refuses server-side access', async () => {
  const page = '<div class="result results_links"><div class="result__body">'
    + '<a class="result__a" href="//duckduckgo.com/l/?uddg='
    + encodeURIComponent('https://www.youtube.com/watch?v=' + id)
    + '">ملخص مباراة فياريال وباريس سان جيرمان</a>'
    + '<a class="result__snippet">YouTube · beIN SPORTS · Official football highlights</a>'
    + '</div></div>';
  const parsed = h.duckDuckGoVideos(page);
  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].id, id);
  assert.equal(h.trustedSearchVideo(parsed[0], match).channel, 'beIN SPORTS');
  const requests = [];
  const fetcher = async url => {
    requests.push(url);
    if (url.includes('duckduckgo.com/html/')) return new Response(page);
    return new Response('', { status: 403 });
  };
  const result = await h.findHighlightVideo(match, '', undefined, fetcher);
  assert.equal(result.status, 'found');
  assert.equal(result.video.url, 'https://www.youtube.com/watch?v=' + id);
  assert.equal(result.video.embeddable, false);
  assert.ok(requests[0].includes('duckduckgo.com/html/'));
});
test('DuckDuckGo results parse across HTML and Lite layouts without enclosing result divs', () => {
  const direct = 'https://www.youtube.com/watch?v=' + id;
  const html = '<section><a class="result__a" href="//duckduckgo.com/l/?uddg='
    + encodeURIComponent(direct) + '">ملخص مباراة فياريال وباريس سان جيرمان</a>'
    + '<div class="result__snippet">YouTube · beIN SPORTS · highlights</div></section>';
  const lite = '<table><tr><td><a class="result-link" href="' + direct
    + '">ملخص مباراة فياريال وباريس سان جيرمان</a></td></tr>'
    + '<tr><td class="result-snippet">YouTube · beIN SPORTS</td></tr></table>';
  for (const page of [html, lite]) {
    const results = h.duckDuckGoVideos(page);
    assert.equal(results.length, 1);
    assert.equal(results[0].id, id);
    assert.equal(h.trustedSearchVideo(results[0], match).channel, 'beIN SPORTS');
  }
});
test('DuckDuckGo Lite fallback works when HTML endpoint is blocked', async () => {
  const direct = 'https://www.youtube.com/watch?v=' + id;
  const lite = '<table><tr><td><a class="result-link" href="' + direct
    + '">ملخص مباراة فياريال وباريس سان جيرمان</a></td></tr>'
    + '<tr><td class="result-snippet">YouTube · beIN SPORTS</td></tr></table>';
  const requested = [];
  const fetcher = async url => {
    requested.push(url);
    return url.includes('lite.duckduckgo.com/lite/')
      ? new Response(lite)
      : new Response('', { status: 403 });
  };
  const result = await h.findHighlightVideo(match, '', undefined, fetcher);
  assert.equal(result.status, 'found');
  assert.equal(result.video.embeddable, false);
  assert.ok(requested.some(url => url.includes('lite.duckduckgo.com/lite/')));
});
test('DuckDuckGo cannot pass an unofficial publisher or wrong fixture', () => {
  const candidate = { id, url: 'https://www.youtube.com/watch?v=' + id,
    title: 'ملخص مباراة فياريال وباريس سان جيرمان', snippet: 'YouTube · unofficial clips' };
  assert.equal(h.trustedSearchVideo(candidate, match), null);
  assert.equal(h.trustedSearchVideo({ ...candidate, title: 'ملخص برشلونة وريال مدريد', snippet: 'beIN SPORTS' }, match), null);
  assert.equal(h.duckDuckGoVideos('<div class="result"><a class="result__a" href="https://evil.example/watch?v=abcdefghijk">beIN SPORTS highlights</a></div>').length, 0);
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
