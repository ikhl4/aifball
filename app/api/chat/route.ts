import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { query, conversation_id } = await req.json();

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
      const errData = await response.text();
      console.error('Dify Backend Error:', errData);
      return NextResponse.json({ answer: 'عذراً، تعذر الاتصال بالمحلل الذكي.' }, { status: 500 });
    }

    const data = await response.json();
    const answerText = data.answer || data.data?.outputs?.text || 'لم يتم العثور على إجابة.';

    return NextResponse.json({
      answer: answerText,
      conversation_id: data.conversation_id || conversation_id
    });

  } catch (error) {
    console.error('Server Error:', error);
    return NextResponse.json({ answer: 'حدث خطأ في الاتصال بالخادم.' }, { status: 500 });
  }
}
