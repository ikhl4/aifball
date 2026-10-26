import { NextResponse } from 'next/server';

// هذه المهلة ضرورية للخطة المجانية في Vercel
export const maxDuration = 60; 
// لمنع Next.js من محاولة تخزين الاستجابة مؤقتاً
export const dynamic = 'force-dynamic';

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

    if (!apiRes.ok) {
      // طباعة الخطأ الحقيقي في سجلات Vercel لمعرفة السبب
      const errorText = await apiRes.text();
      console.error("Dify API Error:", errorText);
      return NextResponse.json({ error: 'خطأ في الاتصال بالخادم' }, { status: 500 });
    }

    // تمرير البث المباشر مع الهيدرات الصحيحة لمنع التقطيع
    return new Response(apiRes.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform', // أضفنا no-transform
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // 🔴 هذا هو السطر السحري لمنع Vercel من تقطيع البث
      },
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
