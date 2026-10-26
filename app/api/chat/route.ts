import { NextResponse } from 'next/server';

export const maxDuration = 60;

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
      },
      body: JSON.stringify({
        inputs: {},
        query: query,
        response_mode: 'blocking',
        conversation_id: conversation_id,
        user: 'aifball-user',
      }),
    });

    const responseText = await apiRes.text();

    if (!apiRes.ok) {
      console.error('DIFY_ERROR_RESPONSE:', responseText);
      return NextResponse.json({ error: responseText }, { status: 500 });
    }

    const data = JSON.parse(responseText);

    return NextResponse.json({
      answer: data.answer || 'تم الاستلام بنجاح',
      conversation_id: data.conversation_id || ''
    });

  } catch (err: any) {
    console.error('ROUTE_CATCH_ERROR:', err?.message || err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
