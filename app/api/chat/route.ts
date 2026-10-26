import { NextResponse } from 'next/server';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { query, conversation_id } = await req.json();

    const apiKey = 'app-mVkeSPmFP8yJRvzW70QLWeTc';
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
      console.error('Dify API Error Details:', errorText);
      return NextResponse.json({ error: `خطأ من خادم Dify: ${errorText}` }, { status: 500 });
    }

    return new Response(apiRes.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (err: any) {
    console.error('Server Catch Error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
