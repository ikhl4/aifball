export type JobStartResult = { kind: 'started'; id: string } | { kind: 'direct' } |
  { kind: 'blocked'; reason: 'uncertain' | 'auth' | 'rejected' };

/** A missing acknowledgement is not evidence that the worker did not start.
 * Only an explicit pre-dispatch configuration response allows direct fallback.
 * Never retry or create another generation here.
 */
export async function startChatJob(payload: Record<string, unknown>, signal: AbortSignal,
  fetcher: typeof fetch = fetch): Promise<JobStartResult> {
  try {
    const response = await fetcher('/api/chat/jobs', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload), signal,
    });
    if (response.status === 401 || response.status === 403) return { kind: 'blocked', reason: 'auth' };
    const data = await response.json().catch(() => null);
    if (response.status === 503 && ['auth_unavailable', 'background_jobs_unavailable'].includes(data?.error)) return { kind: 'direct' };
    if (!response.ok) return { kind: 'blocked', reason: response.status >= 500 ? 'uncertain' : 'rejected' };
    if (typeof data?.id !== 'string' || !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(data.id)) return { kind: 'blocked', reason: 'uncertain' };
    return { kind: 'started', id: data.id };
  } catch { return { kind: 'blocked', reason: 'uncertain' }; }
}
