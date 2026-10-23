import { NextResponse } from 'next/server';

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
        response_mode: 'blocking',
        conversation_id: conversation_id || '',
        user: 'aifball-user',
      }),
    });

    if (!apiRes.ok) {
      const errData = await apiRes.json().catch(() => ({}));
      return NextResponse.json({ 
        text: `عذراً، حدث خطأ من خادم Dify (${apiRes.status}): ${errData.message || 'خطأ غير معروف'}` 
      }, { status: 200 });
    }

    const data = await apiRes.json();

    return NextResponse.json({
      text: data.answer || 'تم الاتصال بنجاح ولكن لم يتم إرجاع نص.',
      conversation_id: data.conversation_id || ''
    });

  } catch (err: any) {
    return NextResponse.json({ 
      text: `خطأ في الاتصال: ${err.message}` 
    }, { status: 200 });
  }
}
