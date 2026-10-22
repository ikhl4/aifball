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
      const errText = await response.text();
      console.error('Dify API Error:', errText);
      return NextResponse.json({ answer: 'عذراً، واجه المحلل الذكي مشكلة مؤقتة في الاستجابة.' }, { status: 500 });
    }

    const data = await response.json();
    
    // استخراج الإجابة بشكل دقيق ومتوافق مع وكلاء Dify
    const answerText = data.answer || data.data?.outputs?.text || 'تم استلام طلبك ولكن لم يتم إرجاع نص.';

    return NextResponse.json({
      answer: answerText,
      conversation_id: data.conversation_id || conversation_id
    });

  } catch (error) {
    console.error('Server Route Error:', error);
    return NextResponse.json({ answer: 'حدث خطأ في الاتصال بالخادم.' }, { status: 500 });
  }
}
