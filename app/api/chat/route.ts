import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { query, conversation_id } = await req.json();

    if (!query) {
      return NextResponse.json({ answer: 'الرجاء إدخال سؤال.' }, { status: 400 });
    }

    const response = await fetch('https://api.dify.ai/v1/chat-messages', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer app-SPmFP8yJRvzW70QLWeTc',
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

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Dify API Error Response:', errorBody);
      return NextResponse.json({ answer: 'عذراً، حدث خطأ من خادم المحلل الذكي.' }, { status: 500 });
    }

    const data = await response.json();
    
    // استخراج النص بجميع الاحتمالات الممكنة لضمان عدم ظهور أي خطأ
    const answerText = data.answer || data.data?.outputs?.text || data.outputs?.text || 'تم استلام الرد ولكن فارغ.';

    return NextResponse.json({
      answer: answerText,
      conversation_id: data.conversation_id || conversation_id
    });

  } catch (error) {
    console.error('Server Route Crash:', error);
    return NextResponse.json({ answer: 'حدث خطأ في الاتصال بالخادم الداخلي.' }, { status: 500 });
  }
}
