import { findHighlightVideo } from './highlight-video';
import { youtubeVideoId } from './summary-presentation';

const decode = (s: string) => s.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export async function verifySummaryAnswer(answer: string, signal?: AbortSignal, lookup = findHighlightVideo): Promise<string> {
  const tags = [...answer.matchAll(/<aifball-summary\b([^>]*?)\/?\s*>/gi)];
  // A structured match identity is required; never guess a fixture from free prose.
  const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 35000);
  const abort = () => controller.abort(); signal?.addEventListener('abort', abort, { once: true }); if (signal?.aborted) abort();
  const replacements: string[] = []; let next = 0;
  const worker = async () => { while (next < tags.length) {
    const index = next++, tag = tags[index];
    const attrs: Record<string, string> = {};
    for (const m of tag[1].matchAll(/([\w_]+)\s*=\s*"([^"]*)"/g)) attrs[m[1]] = decode(m[2]);
    let result: Awaited<ReturnType<typeof findHighlightVideo>> = { status: 'unavailable' };
    if (!controller.signal.aborted) {
      try { result = await lookup({ home: attrs.home || '', away: attrs.away || '', date: attrs.date || '', competition: attrs.competition }, attrs.video_url || '', controller.signal); } catch { /* Keep a usable card with an honest verification status. */ }
    }
    // Dify's supplied title/channel are untrusted hints, not publisher
    // verification. The lookup independently validates an actual YouTube
    // channel and the requested fixture before displaying a video.
    const candidateId = youtubeVideoId(attrs.video_url || '');
    const candidateTitle = attrs.video_title || '';
    const candidateChannel = attrs.video_channel || '';
    const candidateSource = attrs.video_source_url || '';
    delete attrs.video_url; delete attrs.video_embed; delete attrs.video_channel;
    delete attrs.video_title; delete attrs.video_source_url;
    const video = result.status === 'found' ? result.video : null;
    attrs.video_status = video ? 'found' : result.status;
    if (video) {
      attrs.video_url = video.url;
      attrs.video_embed = String(video.embeddable);
      attrs.video_channel = video.channel;
      if (video.publishedAt) attrs.video_published = video.publishedAt;
    }
    if (process.env.VERCEL_ENV === 'preview') {
      console.info('[AIFBALL_VIDEO_HANDOFF_DEBUG]', JSON.stringify({
        date: attrs.date || '',
        difyProvidedVideo: Boolean(candidateId),
        difyProvidedTitle: Boolean(candidateTitle),
        difyProvidedChannel: Boolean(candidateChannel),
        difyProvidedSource: Boolean(candidateSource),
        lookupStatus: result.status,
        externalCandidateAccepted: false,
        finalStatus: attrs.video_status,
      }));
    }
    const replacement = '<aifball-summary ' + Object.entries(attrs).map(([key, value]) => `${key}="${esc(value)}"`).join(' ') + ' />';
    replacements[index] = replacement;
  } };
  try { await Promise.all(Array.from({ length: Math.min(4, tags.length) }, worker)); }
  finally { clearTimeout(timer); signal?.removeEventListener('abort', abort); }
  for (let i = 0; i < tags.length; i++) answer = answer.replace(tags[i][0], replacements[i]);
  return answer;
}

/** Buffer summary deltas until publisher/date verification finishes; keep Dify IDs and end order. */
export function verifiedSummaryStream(upstream: ReadableStream<Uint8Array>, signal?: AbortSignal, verify = verifySummaryAnswer): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder(), decoder = new TextDecoder(); let reader: ReadableStreamDefaultReader<Uint8Array>;
  return new ReadableStream({ async start(out) {
    reader = upstream.getReader(); let buffer = '', answer = '', meta: any = {}, end: any = null;
    const send = (e: any) => out.enqueue(encoder.encode('data: ' + JSON.stringify(e) + '\n\n'));
    const frame = (raw: string) => {
      const data = raw.split('\n').filter(l => l.startsWith('data:')).map(l => l.slice(5).trimStart()).join('\n');
      if (!data || data === '[DONE]') return; let e: any; try { e = JSON.parse(data); } catch { return; }
      if (e.event === 'message' || e.event === 'agent_message') { answer += typeof e.answer === 'string' ? e.answer : ''; meta = { ...e, answer: undefined }; }
      else if (e.event === 'message_end') end = e; else send(e);
    };
    try {
      while (true) {
        const { done, value } = await reader.read(); buffer += decoder.decode(value, { stream: !done });
        buffer = buffer.replace(/\r\n/g, '\n'); let boundary;
        while ((boundary = buffer.indexOf('\n\n')) >= 0) { frame(buffer.slice(0, boundary)); buffer = buffer.slice(boundary + 2); }
        if (done) break;
      }
      if (buffer.trim()) frame(buffer);
      if (!end) throw Error('INCOMPLETE_STREAM');
      const verified = await verify(answer, signal);
      if (signal?.aborted) throw Error('ABORTED');
      send({ ...meta, event: 'message', answer: verified }); send(end); out.close();
    } catch {
      if (signal?.aborted) out.error(new Error('ABORTED'));
      else { send({ event: 'error', message: 'لم يكتمل التحقق من الملخص. أعد المحاولة.' }); out.close(); }
    } finally { reader.releaseLock(); }
  }, cancel() { return reader?.cancel(); } });
}
