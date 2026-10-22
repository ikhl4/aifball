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
        response_mode: 'blocking',
        conversation_id: conversation_id || '',
        user: 'aifball-user',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Dify Error Response:', errorText);
      return NextResponse.json({ answer: 'عذراً، تعذر استجابة المحلل الذكي حالياً.' }, { status: 500 });
    }

    const data = await response.json();
    
    // استخراج الإجابة من هيكل بيانات Dify الـ Agent
    const answerText = data.answer || data.data?.outputs?.text || 'لم يتم العثور على إجابة.';

    return NextResponse.json({
      answer: answerText,
      conversation_id: data.conversation_id || conversation_id
    });

  } catch (error) {
    console.error('API Route Error:', error);
    return NextResponse.json({ answer: 'حدث خطأ في الاتصال بالخادم.' }, { status: 500 });
  }
}
