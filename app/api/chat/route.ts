import { groundedMatchStream } from '../../../lib/grounded-match-answer';
import { NextResponse } from 'next/server';
import { isDetailedMatchQuery, withMatchReportPresentation, withMatchConversationContext } from '../../../lib/match-report-prompt';
import { isAnalysisRequest } from '../../../lib/analysis-story';
import { withAnalysisPresentation } from '../../../lib/analysis-prompt';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

const PLAYER_CAREER_RULES = `
إذا كان السؤال عن لاعب ومسيرته، تحقق من هويته بالأدوات أولاً. عند تشابه الأسماء اطلب النادي أو المنتخب.
ابدأ ببطاقة مختصرة تلخص إجمالي المسيرة المثبت، ثم اعرض المواسم المتاحة بالأندية والبطولات والمباريات والدقائق والأهداف والصناعات والإنذارات والطرد. افصل المنتخب عن الأندية واذكر نطاق تغطية المصدر. اذكر الألقاب مع الفريق والموسم. لا تجمع الإجماليات مع تفاصيل البطولات المكررة، ولا تعامل الرقم المفقود كصفر.
إذا توفر اسم اللاعب كما يظهر في FBref ومواسم موثقة ضمن الدوريات الخمسة، ضع قبل السرد <aifball-player name="اسم FBref" seasons="2025-2026,2024-2025" /> واستبدل المواسم النموذجية بالمواسم المسترجعة فعلاً. وإلا اعرض البطاقة كتابةً من المصادر المتاحة.
بعد البطاقة، اسرد المسيرة بالعربية من بداياته حتى وضعه الحالي، مع الانتقالات ونقاط التحول. أضف قصصاً موثقة ومنشورة إن وجدت واربطها بمصادرها. سؤال أداء لاعب في مباراة يتبع سياق المباراة.
`;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const query = typeof body?.query === 'string' ? body.query.trim() : '';
    const detailedMatch=isDetailedMatchQuery(query);
    const analysis = body?.analysis_mode === true || isAnalysisRequest(query);
    const conversation_id = body?.conversation_id || '';
    
    // 🌟 إضافة: استقبال الملفات المرفقة من الواجهة
    const files = body?.files || []; 

    if (!query) {
      return NextResponse.json({ error: 'السؤال فارغ' }, { status: 400 });
    }

    // جلب المفتاح بأمان من إعدادات Vercel
    const apiKey = process.env.DIFY_API_KEY;
    const url = 'https://api.dify.ai/v1/chat-messages';

    if (!apiKey) {
      return NextResponse.json({ error: 'مفتاح Dify غير مهيأ في السيرفر' }, { status: 500 });
    }

    console.log('Sending to Dify:', { query, conversation_id, hasFiles: files.length > 0 });

    const apiRes = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      },
      signal: req.signal,
      body: JSON.stringify({
        inputs: {},
        query: detailedMatch ? withMatchReportPresentation(query) : analysis ? withAnalysisPresentation(query) : (conversation_id ? withMatchConversationContext(query) : query) + (/مسير|لاعب|بطاق|career|player|profile/i.test(query) ? PLAYER_CAREER_RULES : ''),
        response_mode: 'streaming',
        conversation_id: conversation_id || undefined,
        user: 'aifball-web-user', 
        files: files, // 🌟 إضافة: تمرير الملفات إلى Dify
      }),
    });

    if (!apiRes.ok) {
      const errorText = await apiRes.text();
      console.error('Dify Error:', apiRes.status, errorText);
      return NextResponse.json(
        { error: 'فشل الاتصال بـ Dify', details: errorText },
        { status: apiRes.status }
      );
    }

    // إرجاع الـ Stream مباشرة للواجهة الأمامية
    return new Response(apiRes.body && (detailedMatch || body?.has_match_context === true) ? groundedMatchStream(apiRes.body,query,req.signal) : apiRes.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
        'X-AiFBall-Presentation': detailedMatch ? 'match-report' : analysis ? 'analysis-story' : 'standard',
      },
    });

  } catch (err: any) {
    console.error('Server Error:', err);
    return NextResponse.json(
      { error: 'خطأ في السيرفر', message: err?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
