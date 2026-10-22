import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { query, conversation_id } = await req.json();

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
      console.error('Dify Error Data:', data);
      return NextResponse.json({ 
        answer: data.message || 'عذراً، واجه المحلل الذكي مشكلة في الاتصال.' 
      }, { status: 200 }); // نرسل 200 لكي تظهر الرسالة في الواجهة ولا يحدث كراش
    }

    const answer = data.answer || 'لم يتم استلام رد من المحلل.';

    return NextResponse.json({
      answer: answer,
      conversation_id: data.conversation_id || ''
    });

  } catch (err) {
    console.error('API Route Error:', err);
    return NextResponse.json({ answer: 'حدث خطأ غير متوقع في الخادم.' }, { status: 200 });
  }
}
