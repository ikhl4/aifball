import { NextResponse } from 'next/server';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { query, conversation_id } = await req.json();

    const rawKey = process.env.NEXT_PUBLIC_APP_KEY || 'app-mVkeSPmFP8yJRvzW70QLWeTc';
    const apiKey = rawKey.replace(/['"\s]/g, '').replace(/^App-/, 'app-');
    const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'https://api.dify.ai/v1').replace(/['"\s]/g, '');

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
      return NextResponse.json({ error: 'خطأ في الاتصال بالخادم' }, { status: 500 });
    }

    // تمرير البث المباشر (Stream) إلى الواجهة مباشرة لتقليل وقت الانتظار
    return new Response(apiRes.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
