import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { query, conversation_id } = await req.json();

    // استخدام رابط تطبيق الويب المباشر الخاص بك في Dify
    const apiRes = await fetch('https://udify.app/v1/chat-messages', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer xSpnNgWgRTmqQ0A3', // توكن الـ Web App الخاص بك
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
      console.error('Dify WebApp Error:', data);
      return NextResponse.json({ 
        answer: data.message || 'عذراً، حدث خطأ في استجابة المحلل الذكي.' 
      }, { status: 200 });
    }

    return NextResponse.json({
      answer: data.answer || 'تم الرد بنجاح.',
      conversation_id: data.conversation_id || ''
    });

  } catch (err) {
    console.error('Server Route Error:', err);
    return NextResponse.json({ answer: 'حدث خطأ في الاتصال بالخادم.' }, { status: 200 });
  }
}
