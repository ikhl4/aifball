import { NextResponse } from 'next/server';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const query = body?.query || 'مرحبا';
    const conversation_id = body?.conversation_id || '';

    const apiKey = 'app-3NlvwtpsjeTUXKG9wurQFF8E'; 
    const url = 'https://api.dify.ai/v1/chat-messages';

    const apiRes = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify({
        inputs: {},
        query: query,
        response_mode: 'streaming',
        conversation_id: conversation_id ? conversation_id : undefined,
        user: 'aifball-user',
      }),
    });

    if (!apiRes.ok) {
      const errorText = await apiRes.text();
      console.error('DIFY_BAD_REQUEST_ERROR:', errorText);
      return NextResponse.json({ error: errorText }, { status: 500 });
    }

    return new Response(apiRes.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });

  } catch (err: any) {
    console.error('ROUTE_CATCH_ERROR:', err?.message || err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
