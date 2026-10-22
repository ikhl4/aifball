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
        response_mode: 'blocking', // تم تحويله إلى blocking لضمان استلام الرد كاملاً بدفعة واحدة وتجنب أي تقطيع
        conversation_id: conversation_id || '',
        user: 'aifball-user',
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Dify API Error:', errText);
      return NextResponse.json({ answer: 'عذراً، استجابة الخادم غير متوفرة حالياً.' }, { status: 500 });
    }

    const data = await response.json();
    
    // استخراج الإجابة بدقة من هيكل بيانات Dify
    const answerText = data.answer || data.data?.outputs?.text || 'لم يتم العثور على إجابة.';

    return NextResponse.json({
      answer: answerText,
      conversation_id: data.conversation_id || conversation_id
    });

  } catch (error) {
    console.error('Server Catch Error:', error);
    return NextResponse.json({ answer: 'عذراً، حدث خطأ في الاتصال بالمحلل الذكي.' }, { status: 500 });
  }
}
