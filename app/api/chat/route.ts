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
        query: query,
        response_mode: 'blocking', // استخدام الاستجابة المباشرة لضمان وصول الرد كاملاً وسلساً
        conversation_id: conversation_id || '',
        user: 'aifball-user',
      }),
    });

    if (!apiRes.ok) {
      const errorText = await apiRes.text();
      console.error('DIFY_API_FAIL:', errorText);
      return NextResponse.json({ error: `Dify Error: ${errorText}` }, { status: 500 });
    }

    const data = await apiRes.json();

    return NextResponse.json({
      answer: data.answer || 'لم يتم استلام رد من الوكيل.',
      conversation_id: data.conversation_id || ''
    });

  } catch (err: any) {
    console.error('CRITICAL_SERVER_ERROR:', err?.message || err);
    return NextResponse.json({ error: err?.message || 'Unknown server error' }, { status: 500 });
  }
}
