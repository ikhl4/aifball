import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { query, conversation_id } = await req.json();

    // الاتصال المباشر برابط المحلل الذكي المعتمد في Dify
    const apiRes = await fetch('https://api.dify.ai/v1/chat-messages', {
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

    const data = await apiRes.json();

    if (!apiRes.ok) {
      console.error('Dify Error Response:', data);
      return NextResponse.json({ 
        answer: 'عذراً يا أبو سميرة، المحلل الذكي مشغول حالياً، حاول مرة أخرى.' 
      }, { status: 200 });
    }

    return NextResponse.json({
      answer: data.answer || 'تم استلام الرد بنجاح.',
      conversation_id: data.conversation_id || ''
    });

  } catch (err) {
    console.error('Server Route Error:', err);
    return NextResponse.json({ answer: 'حدث خطأ في الاتصال بالخادم.' }, { status: 200 });
  }
}
