import { groundedMatchStream } from '../../../lib/grounded-match-answer';
import { NextResponse } from 'next/server';
import { isDetailedMatchQuery, withMatchReportPresentation, withMatchConversationContext } from '../../../lib/match-report-prompt';
import { isAnalysisRequest } from '../../../lib/analysis-story';
import { withAnalysisPresentation } from '../../../lib/analysis-prompt';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

const PLAYER_CAREER_RULES = `
إذا كان السؤال عن لاعب أو اقتصر على اسمه فقط، تحقق من هويته بالأدوات أولاً. عند تشابه الأسماء اطلب النادي أو المنتخب.
ابدأ ببطاقة مختصرة تلخص إجمالي المسيرة المثبت، ثم اعرض المواسم المتاحة بالأندية والبطولات والمباريات والدقائق والأهداف والصناعات والإنذارات والطرد. افصل المنتخب عن الأندية واذكر نطاق تغطية المصدر. اذكر الألقاب مع الفريق والموسم. لا تجمع الإجماليات مع تفاصيل البطولات المكررة، ولا تعامل الرقم المفقود كصفر.
إذا توفر اسم اللاعب كما يظهر في FBref ومواسم موثقة ضمن الدوريات الخمسة، ضع قبل السرد <aifball-player name="اسم FBref" seasons="2025-2026,2024-2025" /> واستبدل المواسم النموذجية بالمواسم المسترجعة فعلاً. وإلا اعرض البطاقة كتابةً من المصادر المتاحة.
إذا طلب المستخدم موسماً محدداً، مثل 2007-2008 أو 26-27، افصل أرقامه عن إجمالي المسيرة. حوّل اختصار الموسم إلى أربع خانات لكل سنة، واستخدم selected_season في وسم اللاعب ليبدأ الفلتر بالموسم المطلوب إذا كان ضمن المواسم الموثقة. اذكر النادي والبطولة ونطاق كل رقم. إذا لم تتوفر أرقام الموسم في البطاقة فابحث عنها في مصادر أخرى وأظهرها كتابةً.
استخدم DuckDuckGo للعثور على صفحة اللاعب في موقع الدوري أو النادي (مثل دوري روشن والبريميرليغ والليغا)، وابحث عن موسم 2026–2027 عند طلب الأرقام الحالية. تحقق من الاسم والنادي والموسم من محتوى المصدر. إذا تعذّر عرض أرقام الدوري في البطاقة، اذكر الأرقام المسترجعة كتابةً مع مصدرها.
ابحث عبر DuckDuckGo عن العقد في إعلان النادي أو Transfermarkt، والقيمة السوقية المؤرخة في Transfermarkt، والراتب المنشور في Capology. أضف إلى وسم aifball-player فقط الحقول التي قرأتها من المصدر المطابق: contract_end وcontract_source، market_value وmarket_date وmarket_source، salary وsalary_source. كل حقل يحتاج رابط صفحته الفعلي HTTPS. اذكر العملة والفترة للراتب، وهل الرقم تقديري أو إجمالي بحسب المصدر. اكتب تاريخ القيمة السوقية بصيغة YYYY-MM-DD. يمكن استخدام الوسم دون seasons لعرض هذه الحقول عند توفرها. لا تخترع القيم أو الروابط.
لنقل أرقام المسيرة والمواسم إلى البطاقة، استخدم career_summary لنص مختصر بالأرقام المؤكدة مع تحديد نطاقها، وcareer_source لرابطها. لكل موسم تتوفر أرقامه من مصدر، استخدم حقلاً مثل season_2007_2008 للنادي والبطولة والمباريات والأهداف والصناعات والبطاقات المتاحة، وseason_2007_2008_source لرابطه. استخدم سنة واحدة في اسم الحقل للمواسم السنوية. أدرج المواسم التي لها أرقام موثقة في seasons حتى لو كانت خارج الدوريات الخمسة. يمكن إضافة honours وhonours_source للألقاب الموثقة. لا تضع علامات اقتباس مزدوجة داخل قيم الوسم.
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
        query: detailedMatch ? withMatchReportPresentation(query) : analysis ? withAnalysisPresentation(query) : (conversation_id ? withMatchConversationContext(query) : query) + ((/مسير|لاعب|بطاق|راتب|عقد|سوقي|career|player|profile|salary|contract/i.test(query) || /^(?:[\p{L}\p{M}]+[ \t]+){1,4}[\p{L}\p{M}]+[؟?]?$/u.test(query.trim())) ? PLAYER_CAREER_RULES : ''),
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
