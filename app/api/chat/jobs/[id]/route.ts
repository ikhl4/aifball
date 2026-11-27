import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { chatJobsAccess, jobIdPattern } from '../../../../../lib/chat-jobs-server';
import { parseChatJob } from '../../../../../lib/chat-jobs-client';
export const dynamic = 'force-dynamic';
const reply = (body: unknown, status: number) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const access = await chatJobsAccess(auth, process.env);
  if (!access.ok) return reply({ error: access.error }, access.status);
  if (!jobIdPattern.test(params.id)) return reply({ error: 'invalid_job_id' }, 400);
  try {
    const response = await fetch(access.base + '/internal/chat-jobs/' + params.id + '?owner=' + encodeURIComponent(access.userId), {
      headers: { Authorization: 'Bearer ' + access.token }, cache: 'no-store', signal: AbortSignal.timeout(15000),
    });
    if (response.status === 404) return reply({ error: 'job_not_found' }, 404);
    if (!response.ok) return reply({ error: 'background_service_unavailable' }, 503);
    const payload = await response.json(), job = parseChatJob(payload);
    if (!job || (payload.id !== undefined && payload.id !== params.id)) return reply({ error: 'invalid_job_response' }, 502);
    return reply({ ...job, ...(job.status === 'failed' ? { error: 'تعذر إكمال البحث.' } : {}) }, 200);
  } catch { return reply({ error: 'background_service_unavailable' }, 503); }
}
