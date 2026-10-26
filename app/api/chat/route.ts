import { NextResponse } from 'next/server';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const query = body?.query;
    const conversation_id = body?.conversation_id;

    if (!query) {
      return NextResponse.json({ error: 'الاستعلام فارغ' }, { status: 400 });
    }

    const apiKey = 'App-3NlvwtpsjeTUXKG9wurQFF8E';
    const apiUrl = 'https://api.dify.ai/v1';

    const apiRes = await fetch(`${apiUrl}/chat-messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: {},
        query: query,
        response_mode: 'streaming',
        conversation_id: conversation_id || '',
        user: 'aifball-user',
      }),
    });

    if (!apiRes.ok) {
      const errorText = await apiRes.text();
      console.error('DIFY_API_FAIL:', errorText);
      return NextResponse.json({ error: `Dify Error: ${errorText}` }, { status: 500 });
    }

    return new Response(apiRes.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (err: any) {
    console.error('CRITICAL_SERVER_ERROR:', err?.message || err);
    return NextResponse.json({ error: err?.message || 'Unknown server error' }, { status: 500 });
  }
}
