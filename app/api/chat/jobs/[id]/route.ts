import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  const base = process.env.AIFBALL_RENDER_API_URL?.replace(/\/$/, '');
  const token = process.env.CHAT_JOBS_TOKEN;
  if (!base || !token || !/^https:\/\//.test(base)) {
    return NextResponse.json({ error: 'Background jobs unavailable' }, { status: 503 });
  }
  if (!/^[0-9a-f-]{36}$/i.test(params.id)) return NextResponse.json({ error: 'Invalid job ID' }, { status: 400 });
  try {
    const url = base + '/internal/chat-jobs/' + params.id + '?owner=' + encodeURIComponent(userId);
    const response = await fetch(url, { headers: { Authorization: 'Bearer ' + token },
      cache: 'no-store', signal: AbortSignal.timeout(15000) });
    const payload = await response.json();
    return NextResponse.json(payload, { status: response.status });
  } catch {
    return NextResponse.json({ error: 'Background service unreachable' }, { status: 502 });
  }
}
