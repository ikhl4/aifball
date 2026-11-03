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
إذا وجدت أرقام الموسم المطلوب في أي مصدر قابل للتحقق، أخرج وسم البطاقة قبل السرد حتى لو تعذر الوصول إلى WhoScored أو FBref. استخدم هذا الشكل واستبدل القيم الوصفية ببيانات المصدر: <aifball-player name="اسم اللاعب" seasons="2007-2008" selected_season="2007-2008" season_2007_2008="النادي · البطولة · الأرقام المتاحة" season_2007_2008_source="رابط الصفحة التي تعرض الأرقام" />. لا تستخدم وسم الموسم إذا لم تجد أرقاماً أو رابطاً يدعمها. إذا لم تتوفر بيانات للبطاقة، قدّم السرد الموثق كتابةً. أدرج فقط روابط الصفحات التي استندت إليها فعلياً، وتجنب تكرار رابط البطاقة في نهاية النص وروابط نتائج البحث التي لم توفر بيانات مستخدمة.
إذا طلب المستخدم موسماً محدداً، مثل 2007-2008 أو 26-27، افصل أرقامه عن إجمالي المسيرة. حوّل اختصار الموسم إلى أربع خانات لكل سنة، واستخدم selected_season في وسم اللاعب ليبدأ الفلتر بالموسم المطلوب إذا كان ضمن المواسم الموثقة. اذكر النادي والبطولة ونطاق كل رقم. إذا لم تتوفر أرقام الموسم في البطاقة فابحث عنها في مصادر أخرى وأظهرها كتابةً.
استخدم DuckDuckGo للعثور على صفحة اللاعب في موقع الدوري أو النادي (مثل دوري روشن والبريميرليغ والليغا)، وابحث عن موسم 2026–2027 عند طلب الأرقام الحالية. تحقق من الاسم والنادي والموسم من محتوى المصدر. إذا تعذّر عرض أرقام الدوري في البطاقة، اذكر الأرقام المسترجعة كتابةً مع مصدرها.
جرّب WhoScored عبر DuckDuckGo عند نقص أرقام اللاعب، بما فيه sport360.whoscored.com. ابحث بالاسم والنادي والبطولة والموسم. استخدم الأرقام المقروءة من الصفحة المطابقة فقط، وتابع إلى مصدر آخر إذا تعذّر الوصول.
ابحث عبر DuckDuckGo عن العقد في إعلان النادي أو Transfermarkt، والقيمة السوقية المؤرخة في Transfermarkt، والراتب المنشور في Capology. أضف إلى وسم aifball-player فقط الحقول التي قرأتها من المصدر المطابق: contract_end وcontract_source، market_value وmarket_date وmarket_source، salary وsalary_source. كل حقل يحتاج رابط صفحته الفعلي HTTPS. اذكر العملة والفترة للراتب، وهل الرقم تقديري أو إجمالي بحسب المصدر. اكتب تاريخ القيمة السوقية بصيغة YYYY-MM-DD. يمكن استخدام الوسم دون seasons لعرض هذه الحقول عند توفرها. لا تخترع القيم أو الروابط.
لنقل أرقام المسيرة والمواسم إلى البطاقة، استخدم career_summary لنص مختصر بالأرقام المؤكدة مع تحديد نطاقها، وcareer_source لرابطها. لكل موسم تتوفر أرقامه من مصدر، استخدم حقلاً مثل season_2007_2008 للنادي والبطولة والمباريات والأهداف والصناعات والبطاقات المتاحة، وseason_2007_2008_source لرابطه. استخدم سنة واحدة في اسم الحقل للمواسم السنوية. أدرج المواسم التي لها أرقام موثقة في seasons حتى لو كانت خارج الدوريات الخمسة. يمكن إضافة honours وhonours_source للألقاب الموثقة. لا تضع علامات اقتباس مزدوجة داخل قيم الوسم.
داخل وسم البطاقة أضف season_2026_2027_competitions للموسم 2026–2027، وغيّر اسم الحقل للموسم المطلوب. قيمة الحقل صفوف تفصلها فاصلة منقوطة ASCII، وكل صف بهذا الترتيب: الفريق|البطولة|رابط HTTPS للمصدر|المشاركات|أساسي|دخل بديلاً|الدقائق|الأهداف|الصناعات|الإنذارات|الطرد. استخدم أرقاماً صحيحة فقط في حقول الأرقام واترك المفقود فارغاً مع إبقاء الفواصل. استخدم صفاً منفصلاً لكل فريق وبطولة، وافتح صفحة إحصاءات الموسم أو سجل المباريات عندما يتاح ذلك.
رتّب الرد بعنوان «بطاقة اللاعب — اسم اللاعب». إذا تعذّر إنشاء بطاقة تفاعلية مدعومة ببيانات، اكتب تحت العنوان «البطاقة التفاعلية غير متوفرة حالياً»، ثم اعرض البيانات الموثقة كتابةً.
ابدأ بالموسم المطلوب أو الحالي. اعرض إجمالي النادي ضمن البطولات المغطاة، ثم صفاً لكل بطولة يبيّن الفريق والمباريات والأهداف والصناعات والبطاقات المتاحة. لكل بطولة، ابحث عن إجمالي المشاركات، مرات البدء أساسياً، مرات الدخول بديلاً، الدقائق، الأهداف، الصناعات، الإنذارات والطرد. إذا أعاد البحث عدد المباريات فقط، ابحث مجدداً عن سجل مباريات اللاعب أو صفحة إحصاءات البطولة للموسم نفسه لاستكمال الحقول. احسب الدخول بديلاً من الإجمالي ناقص مرات البدء فقط إذا كان الرقمان لنفس اللاعب والبطولة والفترة ومن نفس المصدر. الجلوس على الدكة دون مشاركة لا يُحسب. عند طلب دقائق الأهداف، اذكر دقيقة كل هدف من سجل أحداث المباراة إن توفرت، وافصلها عن إجمالي دقائق اللعب. اعرض كل رقم مؤكد ولو بقيت حقول أخرى ناقصة، واحذف الأعمدة الفارغة بالكامل. ضع الألقاب في قسم الإنجازات. ضع المنتخب في قسم مستقل بحسب بطولاته، واذكر الفترة التي يغطيها المصدر. عند اختلاف المصادر، اذكر الاختلاف ولا تخلط إجمالياتها.
بعد الموسم المختار، أدرج سجلاً زمنياً من أول موسم احترافي موثق إلى الموسم الحالي، بموسم لكل صف، وبيّن النادي والأرقام المتاحة ونطاقها. اذكر الانتقال في منتصف الموسم عند وقوعه، ولا تسقط المواسم التي تعذرت أرقامها إذا كانت المحطة موثقة.
اختم بسرد عربي يبدأ بالناشئين وأول ظهور احترافي ثم الانتقالات والألقاب والمنتخب والوضع الحالي. أضف قسماً بعنوان «قصص من المسيرة» يتضمن عناوين قصيرة وروابط مباشرة إلى القصص الموثقة عند توفرها، مثل قصة جائزة أو انتقال. تحقق من ترتيب الأندية وتواريخها من المصادر، واكتف برابط مباشر لكل قصة وروابط الأرقام التي استخدمتها. سؤال أداء لاعب في مباراة يتبع سياق المباراة.
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
