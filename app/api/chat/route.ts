import { NextResponse } from 'next/server';

export const maxDuration = 60; // السماح بوقت كافٍ لوكيل Dify لإنهاء البحث والتحليل

export async function POST(req: Request) {
  try {
    const { query, conversation_id } = await req.json();

    const rawKey = process.env.NEXT_PUBLIC_APP_KEY || 'app-mVkeSPmFP8yJRvzW70QLWeTc';
    const apiKey = rawKey.replace(/['"\s]/g, '').replace(/^App-/, 'app-');
    const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'https://api.dify.ai/v1').replace(/['"\s]/g, '');

    const apiRes = await fetch(`${apiUrl}/chat-messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: {},
        query: query,
        response_mode: 'streaming', // إجباري لتطبيقات Agent في Dify
        conversation_id: conversation_id || '',
        user: 'aifball-user',
      }),
    });

    if (!apiRes.ok || !apiRes.body) {
      const errData = await apiRes.json().catch(() => ({}));
      return NextResponse.json(
        { text: `عذراً، حدث خطأ من خادم Dify (${apiRes.status}): ${errData.message || 'خطأ غير معروف'}` },
        { status: 200 }
      );
    }

    const reader = apiRes.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let fullAnswer = '';
    let finalConversationId = conversation_id || '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;

        const jsonStr = trimmed.replace(/^data:\s*/, '').trim();
        if (!jsonStr || jsonStr === '[DONE]') continue;

        try {
          const parsed = JSON.parse(jsonStr);
          if (parsed.conversation_id) {
            finalConversationId = parsed.conversation_id;
          }
          
          // الحل الجذري: التقاط الحدث النهائي فقط (message) وتجاهل تفكير الوكيل الفارغ والمكرر
          if (parsed.event === 'message' && typeof parsed.answer === 'string') {
            fullAnswer += parsed.answer;
          }
          
        } catch {
          // تجاهل الأسطر غير المكتملة
        }
      }
    }

    // تنظيف النص النهائي من أي مسافات فارغة قد تسبب فقاعات وهمية
    const finalText = fullAnswer.trim();

    return NextResponse.json({
      text: finalText || 'عذراً، لم يتم إرجاع نص من المحلل الذكي. حاول صياغة السؤال بشكل آخر.',
      conversation_id: finalConversationId,
    });
  } catch (err: any) {
    return NextResponse.json(
      { text: `خطأ في الاتصال بالسيرفر: ${err.message}` },
      { status: 200 }
    );
  }
}
