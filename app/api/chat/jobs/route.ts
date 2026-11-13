import { preferredAnswerLanguage } from '../../../../lib/app-language';
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function config() {
  const base = process.env.AIFBALL_RENDER_API_URL?.replace(/\/$/, '');
  const token = process.env.CHAT_JOBS_TOKEN;
  if (!base || !token || !/^https:\/\//.test(base)) return null;
  return { base, token };
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  const service = config();
  if (!service) return NextResponse.json({ error: 'Background jobs unavailable' }, { status: 503 });
  let body: { language?: unknown; query?: string; conversation_id?: string; idempotency_key?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }
  if (typeof body.query !== 'string' || !body.query.trim() || body.query.length > 12000 ||
      typeof body.idempotency_key !== 'string' || body.idempotency_key.length < 8 || body.idempotency_key.length > 160) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
  try {
    const response = await fetch(service.base + '/internal/chat-jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + service.token },
      body: JSON.stringify({ owner: userId, idempotency_key: body.idempotency_key,
        query: body.query.trim() + preferredAnswerLanguage(body.language), conversation_id: body.conversation_id || '' }),
      cache: 'no-store',
      signal: AbortSignal.timeout(15000),
    });
    const payload = await response.json();
    return NextResponse.json(payload, { status: response.status });
  } catch {
    return NextResponse.json({ error: 'Background service unreachable' }, { status: 502 });
  }
}
