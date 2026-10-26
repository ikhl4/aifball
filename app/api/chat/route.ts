import { NextResponse } from 'next/server';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { query, conversation_id, files } = await req.json();

    const apiKey = 'app-zkNGXfedLH1xJm11kJezunZC';
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
        response_mode: 'streaming',
        conversation_id: conversation_id || '',
        user: 'aifball-user',
        files: files || [],
      }),
    });

    if (!apiRes.ok) {
      // 🔴 هذا السطر سيجلب رسالة الخطأ الحقيقية من Dify
      const errorText = await apiRes.text();
      console.error('DIFY_EXACT_ERROR:', errorText);
      // إرجاع الخطأ للواجهة الأمامية
      return NextResponse.json({ error: 'Dify Error', details: errorText }, { status: 500 });
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
    console.error('SERVER_ERROR:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
