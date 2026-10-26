import { NextResponse } from 'next/server';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const query = body?.query || 'مرحبا';
    const conversation_id = body?.conversation_id || '';

    const apiKey = 'app-3NlvwtpsjeTUXKG9wurQFF8E'; 
    const url = 'https://api.dify.ai/v1/chat-messages';

    const apiRes = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify({
        inputs: {},
        query: query,
        response_mode: 'streaming',
        conversation_id: conversation_id ? conversation_id : undefined,
        user: 'aifball-user',
      }),
    });

    if (!apiRes.ok) {
      const errorText = await apiRes.text();
      console.error('DIFY_BAD_REQUEST_ERROR:', errorText);
      return NextResponse.json({ error: errorText }, { status: 500 });
    }

    const reader = apiRes.body?.getReader();
    const decoder = new TextDecoder('utf-8');
    let finalAnswer = '';
    let finalConvId = conversation_id;
    let buffer = '';

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (trimmedLine.startsWith('data:')) {
            const dataStr = trimmedLine.replace(/^data:\s*/, '');
            if (!dataStr || dataStr === '[DONE]') continue;

            try {
              const parsed = JSON.parse(dataStr);
              
              // طباعة كل حدث يصل من Dify في سجلات Vercel لنعرف ماذا يحدث
              console.log('DIFY_EVENT:', parsed.event);

              // قراءة الرسالة سواء كانت message أو agent_message
              if ((parsed.event === 'message' || parsed.event === 'agent_message') && typeof parsed.answer === 'string') {
                finalAnswer += parsed.answer;
              }
              
              if (parsed.conversation_id) {
                finalConvId = parsed.conversation_id;
              }

              if (parsed.event === 'error') {
                console.error('DIFY_STREAM_ERROR:', parsed);
                finalAnswer = `خطأ من Dify: ${parsed.message || parsed.code || 'غير معروف'}`;
              }
            } catch (e) {
              console.error('PARSE_ERROR:', e);
            }
          }
        }
      }
    }

    // إذا لم يتم استلام أي نص، نرسل رسالة الخطأ
    if (!finalAnswer) {
      return NextResponse.json({
        answer: 'لم يتم استلام رد نصي من Dify. (اذهب إلى Vercel Logs وابحث عن DIFY_EVENT لمعرفة السبب)',
        conversation_id: finalConvId
      });
    }

    return NextResponse.json({
      answer: finalAnswer,
      conversation_id: finalConvId
    });

  } catch (err: any) {
    console.error('ROUTE_CATCH_ERROR:', err?.message || err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
