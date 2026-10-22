import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { query, conversation_id } = await req.json();

    const response = await fetch('https://api.dify.ai/v1/chat-messages', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer app-pNLwAcQVrAoXmAaCM7EF7pfL',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: {},
        query: query,
        response_mode: 'blocking', // استخدام blocking لضمان استقبال الرد كاملاً ومباشرة
        conversation_id: conversation_id || '',
        user: 'aifball-user',
      }),
    });

    if (!response.ok) {
      const errDetail = await response.text();
      console.error('Dify Agent API Error:', errDetail);
      return NextResponse.json({ answer: 'عذراً، لمطابقة الـ Agent حدث خطأ في الخادم.' }, { status: 500 });
    }

    const data = await response.json();
    
    // استخراج الإجابة بدقة تناسب هيكل رد الـ Agent في Dify
    const answerText = data.answer || data.data?.outputs?.text || 'لم يتم العثور على إجابة من المحلل.';

    return NextResponse.json({
      answer: answerText,
      conversation_id: data.conversation_id || conversation_id
    });

  } catch (error) {
    console.error('API Route Catch Error:', error);
    return NextResponse.json({ answer: 'حدث خطأ في الاتصال بالخادم.' }, { status: 500 });
  }
}
