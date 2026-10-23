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
        response_mode: 'streaming',
        conversation_id: conversation_id || '',
        user: 'aifball-user',
      }),
    });

    if (!apiRes.ok || !apiRes.body) {
      const errData = await apiRes.json().catch(() => ({}));
      const msg = errData.message || 'حدث خطأ من خادم Dify.';
      return new Response(JSON.stringify({ text: msg }) + '\n', { status: 200 });
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder('utf-8');

    const stream = new ReadableStream({
      async start(controller) {
        const reader = apiRes.body!.getReader();
        let buffer = '';

        try {
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
                  if (
                    (parsed.event === 'agent_message' || parsed.event === 'message') &&
                    parsed.answer
                  ) {
                    controller.enqueue(
                      encoder.encode(
                        JSON.stringify({
                          text: parsed.answer,
                          conversation_id: parsed.conversation_id,
                        }) + '\n'
                      )
                    );
                  } else if (parsed.conversation_id) {
                    controller.enqueue(
                      encoder.encode(
                        JSON.stringify({ conversation_id: parsed.conversation_id }) + '\n'
                      )
                    );
                  }
                } catch {
                  // تجاهل الأجزاء غير المكتملة
                }
              }
            }
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ text: `خطأ في الاتصال: ${err.message}` }) + '\n',
      { status: 200 }
    );
  }
}
