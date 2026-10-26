import { NextResponse } from 'next/server';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { query, conversation_id, files } = await req.json();

    const apiKey = 'App-zkNGXfedLH1xJm11kJezunZC';
    const apiUrl = 'https://api.dify.ai/v1';

    const apiRes = await fetch(`${apiUrl}/chat-messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: {},
        query: query || 'مرحبا',
        response_mode: 'blocking',
        conversation_id: conversation_id || '',
        user: 'aifball-user',
        files: files || [],
      }),
    });

    if (!apiRes.ok) {
      const errorText = await apiRes.text();
      console.error('DIFY_ERROR:', errorText);
      return NextResponse.json({ error: errorText }, { status: 500 });
    }

    const data = await apiRes.json();

    return NextResponse.json({
      answer: data.answer,
      conversation_id: data.conversation_id
    });

  } catch (err: any) {
    console.error('SERVER_ERROR:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
