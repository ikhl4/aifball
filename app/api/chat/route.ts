import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { query, conversation_id } = await req.json();

    // يأخذ المفتاح من Vercel أو يستخدم المفتاح الكامل الصحيح مباشرة كضمان إضافي
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
        response_mode: 'streaming', // أساسي لعمل الـ Agent في Dify
        conversation_id: conversation_id || '',
        user: 'aifball-user',
      }),
    });

    if (!apiRes.ok) {
      const errData = await apiRes.json().catch(() => ({}));
      return NextResponse.json({ 
        answer: `رد خادم Dify (${apiRes.status}): ${errData.message || errData.code || 'خطأ غير معروف'}` 
      }, { status: 200 });
    }

    const reader = apiRes.body?.getReader();
    const decoder = new TextDecoder('utf-8');
    let fullAnswer = '';
    let finalConvId = conversation_id || '';
    let buffer = '';

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data:')) {
            const jsonStr = trimmed.replace(/^data:\s*/, '');
            if (!jsonStr || jsonStr === '[DONE]') continue;
            try {
              const parsed = JSON.parse(jsonStr);
              if (parsed.event === 'agent_message' || parsed.event === 'message') {
                fullAnswer += (parsed.answer || '');
              }
              if (parsed.conversation_id) {
                finalConvId = parsed.conversation_id;
              }
            } catch {
              // تجاهل الأسطر غير المكتملة
            }
          }
        }
      }
    }

    return NextResponse.json({
      answer: fullAnswer || 'تم الاتصال بنجاح ولكن لم يرجع نص.',
      conversation_id: finalConvId
    });

  } catch (err: any) {
    return NextResponse.json({ 
      answer: `خطأ في الاتصال: ${err.message}` 
    }, { status: 200 });
  }
}
