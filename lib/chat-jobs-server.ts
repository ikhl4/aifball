export const jobIdPattern = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
type Environment = Record<string, string | undefined>;
type Access = { ok: true; userId: string; base: string; token: string } | { ok: false; status: number; error: string };
export async function chatJobsAccess(authenticate: () => Promise<{ userId: string | null }>, env: Environment): Promise<Access> {
  if (!env.CLERK_SECRET_KEY) return { ok: false, status: 503, error: 'auth_unavailable' };
  let userId: string | null;
  try { userId = (await authenticate()).userId; } catch { return { ok: false, status: 503, error: 'auth_unavailable' }; }
  if (!userId) return { ok: false, status: 401, error: 'sign_in_required' };
  try {
    const url = new URL(env.AIFBALL_RENDER_API_URL || '');
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/' || !env.CHAT_JOBS_TOKEN) throw Error();
    return { ok: true, userId, base: url.origin, token: env.CHAT_JOBS_TOKEN };
  } catch { return { ok: false, status: 503, error: 'background_jobs_unavailable' }; }
}
