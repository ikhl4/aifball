import type { PlayerData } from './player-profile-data';

/** Only idempotent profile GETs retry; never create another chat generation. */
export async function fetchPlayerProfile(params: URLSearchParams, signal: AbortSignal, fetcher: typeof fetch = fetch, timeoutMs = 16000): Promise<PlayerData | undefined> {
  for (let attempt = 0; attempt < 2 && !signal.aborted; attempt++) {
    const controller = new AbortController(), abort = () => controller.abort();
    signal.addEventListener('abort', abort, { once: true });
    const timer = setTimeout(abort, timeoutMs);
    try {
      const response = await fetcher('/api/player-profile?' + params, { signal: controller.signal });
      if (signal.aborted) return;
      if (!response.ok) {
        if (response.status >= 500 || response.status === 408 || response.status === 429) continue;
        return;
      }
      const data = await response.json() as PlayerData;
      if (signal.aborted) return;
      if (!data || !['found', 'not_found', 'ambiguous', 'unavailable'].includes(data.status) || !Array.isArray(data.rows)) return;
      if (data?.status === 'unavailable') continue;
      return data;
    } catch { if (signal.aborted) return; }
    finally { clearTimeout(timer); signal.removeEventListener('abort', abort); }
  }
}
