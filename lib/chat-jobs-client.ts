export type ChatJob = { status: 'queued' | 'pending' | 'running' | 'completed' | 'failed'; answer: string; conversation_id: string };
export type JobPollResult = 'completed' | 'failed' | 'unauthenticated' | 'missing' | 'unavailable' | 'paused' | 'aborted';
export function parseChatJob(value: unknown): ChatJob | null {
  if (!value || typeof value !== 'object') return null;
  const job = value as Record<string, unknown>;
  if (!['queued', 'pending', 'running', 'completed', 'failed'].includes(String(job.status)) ||
    (job.answer !== undefined && job.answer !== null && (typeof job.answer !== 'string' || job.answer.length > 1000000)) ||
    (job.conversation_id !== undefined && job.conversation_id !== null && (typeof job.conversation_id !== 'string' || job.conversation_id.length > 100))) return null;
  const answer = typeof job.answer === 'string' ? job.answer : '';
  if (job.status === 'completed' && !answer.trim()) return null;
  return { status: job.status as ChatJob['status'], answer, conversation_id: typeof job.conversation_id === 'string' ? job.conversation_id : '' };
}
export function waitForJobRetry(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise(resolve => {
    if (signal.aborted) { resolve(); return; }
    const done = () => { clearTimeout(timer); signal.removeEventListener('abort', done); resolve(); };
    const timer = setTimeout(done, ms);
    signal.addEventListener('abort', done, { once: true });
  });
}
export async function pollChatJob(jobId: string, options: {
  signal: AbortSignal; onUpdate: (job: ChatJob) => void;
  fetcher?: typeof fetch; wait?: typeof waitForJobRetry; now?: () => number;
  requestTimeoutMs?: number; maxActiveMs?: number;
}): Promise<JobPollResult> {
  const { signal, onUpdate } = options, fetcher = options.fetcher || fetch;
  const wait = options.wait || waitForJobRetry, now = options.now || Date.now, started = now();
  let failures = 0, previous = '';
  while (!signal.aborted) {
    if (now() - started >= (options.maxActiveMs ?? 300000)) return 'paused';
    const controller = new AbortController(), abort = () => controller.abort();
    signal.addEventListener('abort', abort, { once: true });
    const timer = setTimeout(abort, options.requestTimeoutMs ?? 15000);
    let delay = 2500;
    try {
      const response = await fetcher('/api/chat/jobs/' + encodeURIComponent(jobId), { signal: controller.signal, cache: 'no-store' });
      if (signal.aborted) return 'aborted';
      if (response.status === 401) return 'unauthenticated';
      if (response.status === 403 || response.status === 404 || response.status === 400) return 'missing';
      if (response.status === 503) return 'unavailable';
      if (!response.ok) throw Error('POLL_RETRY');
      const job = parseChatJob(await response.json());
      if (!job) throw Error('INVALID_JOB');
      if (signal.aborted) return 'aborted';
      failures = 0;
      const snapshot = JSON.stringify(job);
      if (snapshot !== previous) { previous = snapshot; onUpdate(job); }
      if (job.status === 'completed' || job.status === 'failed') return job.status;
    } catch {
      if (signal.aborted) return 'aborted';
      failures++;
      if (failures >= 4) return 'unavailable';
      delay = Math.min(10000, 2500 * failures);
    } finally {
      clearTimeout(timer); signal.removeEventListener('abort', abort);
    }
    await wait(delay, signal);
  }
  return 'aborted';
}
