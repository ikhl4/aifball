import { playerPromptIntent } from '../../../../lib/chat-intent';
import { playerPresentationRules } from '../../../../lib/player-prompt';
import { preferredAnswerLanguage } from '../../../../lib/app-language';
import { chatJobsAccess, jobIdPattern } from '../../../../lib/chat-jobs-server';
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
const reply = (body: unknown, status: number) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
export async function POST(req: Request) {
  const access = await chatJobsAccess(auth, process.env);
  if (!access.ok) return reply({ error: access.error }, access.status);
  let body;
  try { body = await req.json(); } catch { return reply({ error: 'invalid_json' }, 400); }
  if (!body || typeof body !== 'object' || Array.isArray(body) || typeof body.query !== 'string' || !body.query.trim() || body.query.length > 12000 ||
    typeof body.idempotency_key !== 'string' || body.idempotency_key.length < 8 || body.idempotency_key.length > 160 ||
    (body.conversation_id !== undefined && (typeof body.conversation_id !== 'string' || body.conversation_id.length > 100))) return reply({ error: 'invalid_request' }, 400);
  try {
    const response = await fetch(access.base + '/internal/chat-jobs', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + access.token },
      body: JSON.stringify({ owner: access.userId, idempotency_key: body.idempotency_key,
        query: body.query.trim() + (playerPromptIntent(body.query, { conversationId: body.conversation_id }).playerCareer ? playerPresentationRules() : '') + preferredAnswerLanguage(body.language),
        conversation_id: body.conversation_id || '' }), cache: 'no-store', signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) return reply({ error: 'background_service_unavailable' }, 502);
    const payload = await response.json();
    if (typeof payload?.id !== 'string' || !jobIdPattern.test(payload.id)) return reply({ error: 'invalid_job_response' }, 502);
    return reply({ id: payload.id }, response.status);
  } catch { return reply({ error: 'background_service_unavailable' }, 502); }
}
