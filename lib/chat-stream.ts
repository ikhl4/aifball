export type ChatEvent = Record<string, unknown>;

export function parseSSEFrame(frame: string): ChatEvent | null {
  const data = frame.split(/\r?\n/).filter(line => line.startsWith('data:'))
    .map(line => line.slice(5).trimStart()).join('\n');
  if (!data || data === '[DONE]') return null;
  try {
    const value: unknown = JSON.parse(data);
    return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as ChatEvent : null;
  } catch { return null; }
}

/** Dify Agent's closing message is the full answer, after agent_message deltas.
 * https://docs.dify.ai/en/api-reference/guides/streaming
 */
export function createChatAnswer() {
  let answer = '', seed = '', card = '', agent = false;
  return {
    apply(event: ChatEvent): string | null {
      if (typeof event.answer !== 'string') return null;
      if (event.event === 'aifball_player_seed') { seed = event.answer; card = seed; }
      else if (event.event === 'message_replace') { card = seed; answer = event.answer; }
      else if (event.event === 'agent_message') { agent = true; answer += event.answer; }
      else if (event.event === 'message') answer = agent ? event.answer : answer + event.answer;
      else return null;
      if (!seed) return answer;
      // Render one independent card on its own line, even when the Agent wraps
      // its tag in prose/fences or omits it from a final message. Moderation still
      // replaces all model prose; the app-owned lookup widget remains separate.
      const tag = answer.match(/<aifball-player\b[^>]*\/?\s*>/i)?.[0];
      if (tag) {
        card = tag.replace(/[\r\n]+/g, ' ');
        const origin = seed.match(/\bname="([^"]*)"/)?.[1];
        const season = seed.match(/\bcurrent_season="([^"]*)"/)?.[1];
        // Model transliterations are hints, never a reason to discard an already
        // source-matched profile. Keep this request's lookup identity stable.
        if (origin) card = card.replace(/\slookup_origin="[^"]*"/g, '').replace(/\s*\/?>$/, ` lookup_origin="${origin}" />`);
        if (season && !/\bcurrent_season=/.test(card)) card = card.replace(/\s*\/?>$/, ` current_season="${season}" />`);
      }
      const prose = answer.replace(/<aifball-player\b[^>]*\/?\s*>/gi, '').trimStart();
      return card + '\n\n' + prose;
    },
  };
}

/** Decode UTF-8 across arbitrary network boundaries and release/cancel on exit. */
export async function consumeChatStream(stream: ReadableStream<Uint8Array>, onEvent: (event: ChatEvent) => boolean | void,
  onChunk?: () => void) {
  const reader = stream.getReader(), decoder = new TextDecoder();
  let buffer = '', exhausted = false;
  const frame = (raw: string) => { const event = parseSSEFrame(raw); return event ? onEvent(event) !== false : true; };
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) { exhausted = true; buffer += decoder.decode(); break; }
      onChunk?.();
      buffer += decoder.decode(value, { stream: true });
      let boundary: RegExpExecArray | null;
      while ((boundary = /\r?\n\r?\n/.exec(buffer))) {
        const raw = buffer.slice(0, boundary.index);
        buffer = buffer.slice(boundary.index + boundary[0].length);
        if (!frame(raw)) return;
      }
    }
    if (buffer.trim()) frame(buffer);
  } finally {
    if (!exhausted) await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}
