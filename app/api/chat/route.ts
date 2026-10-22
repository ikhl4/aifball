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
        response_mode: 'streaming', // ضروري جداً لتطبيقات الـ Agent
        conversation_id: conversation_id || '',
        user: 'aifball-user',
      }),
    });

    if (!response.ok) {
      return NextResponse.json({ answer: 'تعذر الاتصال بالمحلل الذكي.' }, { status: 500 });
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let fullAnswer = '';
    let newConversationId = conversation_id;

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const json = JSON.parse(line.substring(6));
              if (json.answer) fullAnswer += json.answer;
              if (json.conversation_id) newConversationId = json.conversation_id;
            } catch (e) {
              // تجاوز الأجزاء غير المكتملة
            }
          }
        }
      }
    }

    return NextResponse.json({
      answer: fullAnswer || 'عذراً، لم أتمكن من استخراج الإجابة.',
      conversation_id: newConversationId
    });

  } catch (error) {
    return NextResponse.json({ answer: 'حدث خطأ في الاتصال بالخادم.' }, { status: 500 });
  }
}
