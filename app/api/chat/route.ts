import { NextResponse } from 'next/server';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { query, conversation_id, files } = await req.json();

    const apiKey = 'App-3NlvwtpsjeTUXKG9wurQFF8E';
    const apiUrl = 'https://api.dify.ai/v1';

    // إرسال الطلب بالهيكل المتوافق تماماً مع Agents في Dify
    const apiRes = await fetch(`${apiUrl}/chat-messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: {},
        query: query || 'مرحبا',
        response_mode: 'streaming',
        conversation_id: conversation_id || '',
        user: 'aifball-user',
        files: files || [],
      }),
    });

    if (!apiRes.ok) {
      const errorText = await apiRes.text();
      console.error('DIFY_AGENT_ERROR:', errorText);
      return NextResponse.json({ error: errorText }, { status: 500 });
    }

    return new Response(apiRes.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (err: any) {
    console.error('SERVER_ERROR:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
