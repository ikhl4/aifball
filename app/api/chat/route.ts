// Vercel preview rebuild trigger for PR #50 - 2026-11-05 rerun; no production merge.
// Preview redeploy trigger: structured highlights fallback, unrestricted discovery experiment; production unchanged.
import { verifiedSummaryStream, verifySummaryAnswer } from '../../../lib/verified-summary';
import { posterIntent } from '../../../lib/match-card-data';
import { buildSingleMatchHighlights } from '../../../lib/single-match-highlights';
import { historyMode, FOOTBALL_HISTORY_RULES, DOCUMENTARY_REQUEST_RULES, presentHistoryAnswer } from '../../../lib/football-history';
import { groundedMatchStream } from '../../../lib/grounded-match-answer';
import { NextResponse } from 'next/server';
import { isDetailedMatchQuery, withMatchReportPresentation, withMatchConversationContext } from '../../../lib/match-report-prompt';
import { isAnalysisRequest } from '../../../lib/analysis-story';
import { withAnalysisPresentation } from '../../../lib/analysis-prompt';
import { isMatchSummaryRequest, isJawwyLeagueRequest, MATCH_SUMMARY_RULES, JAWY_LEAGUE_RULES } from '../../../lib/match-summary-prompt';
import { buildDailyHighlights } from '../../../lib/daily-match-highlights';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

const TWEET_COMPOSER_RULES = `
عندما يطلب المستخدم كتابة تغريدة أو منشور:
- قدّم مسودة جاهزة للنشر فقط؛ لا تدّع أنك نشرتها أو أرسلتها.
- اكتب تغريدة واحدة افتراضياً بالعربية، موجزة وجذابة ومباشرة، وراعِ النبرة التي يحددها المستخدم (تحليلية، حماسية، رسمية، نقدية أو غيرها). إذا طلب ثريدًا أو لغة أخرى فاتبع طلبه.
- حدّد الفكرة والنادي أو اللاعب والمباراة والفترة من السؤال والسياق. لا تسأل عن معلومات يمكن استنتاجها بأمان من سياق المحادثة.
- إذا تضمنت التغريدة أرقاماً أو حقائق عن مباراة أو لاعب أو نادٍ، ابحث في الأدوات المتاحة عن مصادر موثوقة للمباراة والموسم المحددين، مثل SofaScore وFotMob و365Scores وESPN ومواقع الدوري أو النادي. طابق هوية اللاعب والبطولة والتاريخ قبل استخدام الرقم. لا تنقل أرقاماً من مباراة أخرى ولا تملأ البيانات المفقودة بالتخمين.
- إذا كان الموضوع عن انتقالات أو قيمة سوقية، افصل الإعلان الرسمي عن التقدير أو التقرير، واستخدم مصدرًا يثبت كل رقم. إذا كان الموضوع حديثاً أو قابلاً للتغير، ابحث عن أحدث المعلومات قبل الكتابة.
- إذا طلب رأياً أو صياغة عن موضوع عام، حافظ على فكرته ونبرته من دون إضافة وقائع غير مذكورة. ميّز الرأي عن الحقيقة.
- اعرض المسودة أولاً تحت عنوان «مسودة التغريدة». اجعل النص نفسه منفصلاً ونظيفاً للنسخ، ولا تحشر روابط المصادر أو الشروح داخله إلا إذا طلب المستخدم ذلك. ضع المصادر التي استخدمتها بعد المسودة، مع رابط مباشر لكل معلومة رقمية أو حديثة. إذا لم تجد مصدراً موثوقاً لرقم مطلوب، احذفه أو قل بوضوح إنه غير متاح.
- لا تضف هاشتاقات أو دعوة للإعجاب وإعادة النشر إلا إذا كانت مناسبة أو طلبها المستخدم. لا تحوّل التغريدة إلى ثريد من تلقاء نفسك.
`;

const PLAYER_CAREER_RULES = `
عند سؤال المستخدم عن لاعب أو كتابة اسمه فقط: تحقق أولاً من هوية اللاعب ومن مصادر حديثة مناسبة للاعب والموسم، ولا تخمن أي رقم أو صورة.

قالب الإجابة الإلزامي للاعب (بهذا الترتيب دون مقدمات طويلة):
1) بطاقة واحدة فقط عبر <aifball-player ... />، تتضمن الاسم والنادي والجنسية وصورة حقيقية متحققاً منها عند توفر رابط صورة مباشر صالح، وأبرز إجماليات المسيرة الموثقة. لا ترسل بطاقة فيها ألقاب فقط إذا عثرت على أرقام مسيرة موثقة: أدرج career_matches وcareer_goals وcareer_assists كلٌّ في حقل مستقل مع career_source، واكتب career_summary بالأرقام نفسها مع نطاقها. إذا تعذر إثبات الأرقام، اذكر عدم توفرها بوضوح ولا تخترعها. مرر image_url وclub وnationality عند التحقق منها. لا تستخدم صوراً عشوائية أو روابط صفحات بدلاً من الصورة.
2) بعد البطاقة مباشرة عنوان «قصة المسيرة»؛ اسرد 2 إلى 4 فقرات عربية ممتعة ومختصرة عن النشأة، الانطلاقة، الانتقالات، اللحظات الحاسمة والمنتخب. لا تكرر أرقام البطاقة ولا تحوّل القصة إلى جدول.
3) عنوان «أرقام صنعت التاريخ»؛ اعرض الأرقام والإنجازات المؤكدة التي لم تظهر في البطاقة على هيئة نقاط قصيرة ومشوقة، مع سياق الفترة والنادي أو المنتخب، دون جداول Markdown.
4) يمكن إضافة فقرة «لحظة لا تُنسى» عند وجود واقعة موثقة ومهمة.

ممنوع في النص المرئي: أي روابط URL، أو أسهم مصادر، أو قائمة مراجع، أو جدول مصادر، أو جداول Markdown، أو فواصل ---، أو عبارات «نطاق التحقق» و«المصدر:». استخدم الروابط داخلياً للتحقق فقط، ومررها في حقول source داخل وسم البطاقة إن احتاج المكوّن إليها؛ لا تعرضها في النص. لا تكرر بطاقة اللاعب في النص. إذا كانت البيانات غير متاحة، اذكر ذلك باختصار في موضعها ولا تملأها بصفر.

للمواسم: إذا طلب المستخدم موسماً محدداً فاعرضه أولاً في البطاقة. خلاف ذلك اعرض الموسم الحالي الموثق، مع اختيار المواسم المتاحة. افصل أرقام الأندية عن المنتخب، ولا تجمع البطولات المتداخلة أو أرقام المصادر مختلفة النطاق. اعرض المشاركات والأساسي والبديل والدقائق والأهداف والصناعات والإنذارات والطرد المتوفرة فقط. لا تُدخل أي رقم في البطاقة إلا إذا تأكدت من اللاعب والبطولة والفترة.

صيغة بيانات الموسم: <aifball-player name="اسم اللاعب" club="النادي" nationality="الجنسية" image_url="https://example.com/actual-player-photo.jpg" seasons="2026-2027" selected_season="2026-2027" career_matches="1181" career_goals="936" career_assists="408" trophies_count="46" trophies_source="https://example.com/verified-trophies" contract_end="2028-12-31" contract_source="https://example.com/verified-contract" career_summary="1181 مباراة، 936 هدفا، 408 صناعات" career_source="https://example.com/verified-career" season_2026_2027_competitions="الفريق|البطولة|https://example.com/verified-season|10|||783|7|0||" />.
هذه قيم شكلية توضيحية فقط، لا تنقلها إلى أي لاعب؛ اترك الحقول غير المثبتة تماماً. مصدر الصورة يجب أن يكون صورة مباشرة للاعب نفسه، وليس صفحة HTML. ابحث عبر DuckDuckGo أو مصادر الدوري/النادي/المنتخب أو مصادر صور موثوقة، وتحقق من صلاحية رابط الصورة.

عند ذكر نهاية العقد: إذا أعلن النادي «حتى نهاية موسم 2028» ولا يوجد تاريخ يوم وشهر مؤكد، مرر contract_end="2028" مع رابط بيان النادي في contract_source؛ لا تفترض 31 ديسمبر. لا تترك العقد فارغاً بسبب غياب اليوم والشهر. بالنسبة لميسي، بيان إنتر ميامي الرسمي يثبت الاستمرار حتى نهاية موسم MLS 2028.
إحصائيات MLS: اعتمد جدول اللاعب الرسمي MLSsoccer (players/lionel-messi/stats/) مثالاً على حقول GP, GS, Mins, G, A, YC, RC لموسم 2026. يجب البحث عن الصفحة الخاصة بكل لاعب، ثم ملء الموسم حتى لو كان المصدر لا يوفر كل الحقول. لا تعتمد على FBref وحده؛ إذا فشل انتقل إلى MLSsoccer ثم FotMob ثم SofaScore ثم موقع النادي. صيغة season_2026_competitions تتطلب 8 خانات إحصائية بعد رابط المصدر مرتبة: المشاركات|أساسي|دخل بديلاً|الدقائق|الأهداف|الصناعات|الإنذارات|الطرد؛ اترك القيمة الفارغة بين الفواصل ولا تحذف الفواصل.
بطاقة اللاعب يجب أن تتضمن صورة فوتوغرافية حقيقية: ابحث عن رابط صورة مباشر من Wikimedia Commons أو Wikipedia أو FotMob، ومرره في image_url أو photo_url، لا تستخدم رمز كرة القدم بديلاً إذا وجدت صورة. اعرض البطولات الجماعية بالتفصيل في team_honours والجوائز الفردية في individual_awards، لا تكتفِ بعدد البطولات أو بذكر الكرة الذهبية وحدها. اعرض المعلومات على شكل نصوص قصيرة مفصولة بأسطر، ولا تكرر قسم الإنجازات مرة أخرى خارج البطاقة. إذا كان عدد البطولات مؤكداً مرره في trophies_count وtrophies_source. اعرض أرقام الموسم في season_YYYY_competitions بصيغة الحقول الموثقة وليس فقط في سرد الرسالة. لا تضع روابط خام في النص الظاهر.
لا تُنهِ إجابة اللاعب قبل محاولة استرجاع نهاية عقده الحالي وإحصائيات موسمه الحالي. ابحث بشكل مستقل عن العقد في إعلان النادي الرسمي ثم Transfermarkt أو Capology، وعن إحصائيات الموسم الحالي في FotMob أو SofaScore أو 365Scores أو موقع الدوري أو النادي. الموسم الجاري 2026-2027 للدوريات الأوروبية والسعودية، و2026 للمسابقات ذات الموسم السنوي مثل MLS. لا تفترض أن كل الدوريات تتبع تقويم 2026-2027. في الوسم مرر current_season="2026" للموسم السنوي أو current_season="2026-2027" للموسم الممتد، وseasons بالقيم المتحققة، مع season_2026_competitions أو season_2026_2027_competitions بحسب البطولة. إذا وجدت رقماً موثقاً واحداً فقط مثل المشاركات أو الأهداف، مرره في صف البطولة حتى يظهر ولا تحذف صف الموسم بسبب نقص بقية الأرقام. إذا توفر تاريخ انتهاء العقد موثقاً فمرره بصيغة YYYY-MM-DD مع contract_source، وتحقق من أن العقد يخص النادي الحالي لا فريقاً سابقاً. لا تجعل أي رابط ظاهر للمستخدم.

في بطاقة اللاعب أعطِ الأولوية دائماً لهذه الخانات الست: المباريات والأهداف والصناعات والبطولات الجماعية والنادي الحالي ونهاية عقده. ابحث عن كل خانة في المصادر المتاحة قبل إتمام الإجابة. لا تسقط المباريات إن كان لها رقم موثق. ضع إجمالي البطولات في trophies_count مع trophies_source، وأضف honours نصاً مختصراً فقط إذا كان يفيد. ضع نهاية العقد بصيغة YYYY-MM-DD في contract_end مع contract_source، والنادي الحالي في club. عند اختلاف إجماليات البطولات حسب جهة الإحصاء اختر المصدر الذي يعرّف نطاق البطولات بوضوح ولا تخلط الجوائز الفردية بالبطولات الجماعية. لا تعرض تاريخاً أو رقماً غير متحقق منه.

للألقاب والجوائز والعقود والرواتب والقيم السوقية: تحقق من الجهة والفترة والعملة وتاريخ التقييم؛ استخدم فقط الأرقام المقروءة من المصدر. يمكن تمرير honours وhonours_source وcontract_end وcontract_source وmarket_value وmarket_date وmarket_source وsalary وsalary_source إلى الوسم، مع إبقاء المراجع غير ظاهرة للمستخدم. عند غياب مصدر كاف لا تعرض الرقم. اعرض اختلاف المصادر بعبارة موجزة عند الحاجة دون روابط.

تفصيل البطولات والجوائز إلزامي لكل لاعب، وليس لميسي فقط:
- بعد «قصة المسيرة» أنشئ قسم «🏆 خزينة البطولات» مفصلاً حسب كل نادٍ لعب له ثم المنتخب. لكل بطولة اذكر اسمها بالعربية وعدد مرات الفوز وسنوات أو مواسم التتويج، وأظهر مجموع كل فريق ثم إجمالي البطولات الجماعية المؤكد. لا تجمع بطولة الشباب أو الأولمبياد ضمن ألقاب المنتخب الأول دون توضيح الفئة. لا تخلط دروع الموسم العادي أو البطولات الودية مع الألقاب الرسمية دون بيان معيار العد. إذا اختلف إجمالي المصادر اذكر السبب باختصار ولا تختار رقماً غير مثبت.
- بعده قسم «🥇 الجوائز والإنجازات الفردية» مفصل: اسم الجائزة وعدد مرات الفوز والسنوات، ومنها الكرة الذهبية، The Best، الحذاء الذهبي، هداف الدوريات والبطولات، أفضل لاعب في البطولات، التشكيلات المثالية، الجوائز القارية، والجوائز المحلية ذات الصلة. لا تخلط الترشيحات مع الفوز، ولا الجوائز الفردية مع البطولات الجماعية.
- أظهر في بطاقة اللاعب إجمالي البطولات الجماعية المؤكد في trophies_count مع trophies_source، واختصر honours إلى قيمة مناسبة، لكن أبقِ التفصيل الكامل أدناه في الأقسام السردية. احرص على ألا تختفي أرقام المباريات والأهداف والصناعات ونهاية العقد. لا تختلق مواسم أو ألقاب غير متحققة.
- اعرض القوائم التفصيلية بشكل فقرات قصيرة أو نقاط مجمعة تحت النادي/المنتخب، دون جداول Markdown، ودون روابط ظاهرة. المصادر للبحث والتحقق الداخلي فقط.
- مثال لميسي: موقعه الرسمي messi.com/en/honours-and-achievements/ يفصل ألقاب برشلونة وباريس وإنتر ميامي والأرجنتين وجوائزه الفردية؛ استخدمه كمصدر أولي مع التحقق من تاريخ تحديثه ومن صفحات النادي والاتحاد، ولا تنسخ الأرقام النموذجية إلى لاعبين آخرين.

لا تُنشئ جدولاً زمنياً طويلاً لكل موسم تلقائياً؛ قدّم السرد ثم أبرز الأرقام. إذا طلب المستخدم إحصائيات كاملة تفصيلية، يمكن التوسع بالأقسام المطلوبة لكن يبقى العرض مقروءاً على الهاتف. سؤال أداء اللاعب في مباراة يتبع سياق المباراة.
`;

const TRANSFER_REPORT_RULES = `
قدّم تقرير سوق الانتقالات بالعربية. إذا طلب المستخدم نافذة سابقة، حدّد الموسم والفترة الفعلية للنافذة في كل دوري واستبدل قسم صفقات اليوم بصفقات تلك النافذة. فسّر «الصيف الماضي» بأنه أحدث نافذة صيفية مكتملة بتوقيت الرياض، واذكر السنة صراحة. استعمل تاريخ اليوم بتوقيت الرياض للطلبات الحالية فقط. ابحث بالأدوات عن إعلانات الأندية والمصادر الموثوقة قبل الإجابة.
1. صفقات الفترة: اعرض الصفقات التي أُعلن عنها في الفترة المطلوبة، مع اللاعب، النادي السابق، الوجهة، نوع الصفقة، والقيمة إن كانت معلنة. افصل تاريخ الإعلان عن تاريخ سريان الانتقال. إذا لم تجد إعلاناً مؤكداً، اذكر حدود البحث.
2. حركة الدوريات: رتّب الصفقات المؤكدة حسب الدوري المطلوب، أو الدوري السعودي والدوريات الخمسة الكبرى عند طلب نظرة عامة. بيّن الوافدين والمغادرين، واذكر الفترة المغطاة. لا تعد الصفقة نفسها مرتين في الإجمالي.
قبل صياغة التقرير نفّذ بحثاً مستقلاً لكل دوري مطلوب باسم الدوري والسنة وعبارة confirmed summer transfers arrivals departures. ابحث بلغة الدوري عند الحاجة. افتح قائمة الصفقات الرسمية واقرأ صفوف اللاعبين إن أمكن. إذا أعادت الأداة مواعيد النافذة فقط، أعد البحث عن صفقات الأندية في نفس الدوري والموسم، ثم راجع Transfermarkt أو إعلانات الأندية. اعرض الصفقات المقروءة حتى لو كانت التغطية جزئية، واربط كل صف بمصدر يذكر اللاعب والوجهة. لا تعتبر خبر موعد الإغلاق مصدراً لصفقة.
3. أبرز المغادرين: اذكر وجهة اللاعب ونوع الرحيل، وفسّر أهميته للفريق بمؤشر موثق مثل مشاركاته أو دوره أو أرقامه في الموسم السابق. أدرج المغادرين البارزين إلى دوريات خارج التغطية أيضاً.
افصل الإعلانات الرسمية عن التقارير والمفاوضات. اكتب «القيمة غير معلنة» إذا غابت، ولا تصف الانتقال بأنه مجاني إلا بمصدر. أرفق روابط المصادر المستخدمة في نهاية الرد، مع تفضيل إعلان النادي أو البطولة.
`;


const FANTASY_RULES = `
إذا كان السؤال عن الفانتازي، حدّد اللعبة والجولة المطلوبة (الجولة القادمة إذا لم يحددها المستخدم) وتحقق من موعد الإغلاق بتوقيت الرياض. استخدم رابط اللعبة المناسب: https://fantasy.spl.com.sa لفانتازي الدوري السعودي أو https://fantasy.premierleague.com/ar/ لفانتازي الدوري الإنجليزي، وضعه كرابط Markdown في الرد.
لكل جولة، ابحث من جديد في موقع اللعبة والمصادر الرسمية، واستخدم Google أو DuckDuckGo للعثور على منشورات عامة حديثة عبر site:x.com وsite:twitter.com من حسابات الأندية والدوري والصحفيين المعروفين. اذكر رابط المنشور وتاريخه عند استخدامه، وافصل خبر النادي المؤكد عن تقرير الصحفي وتوقع فوتبلاي. إذا تعذر فتح المنشور أو لم تجد تحديثاً موثوقاً، صرّح بذلك. تحقق من نادي كل لاعب وأهليته في اللعبة قبل ترشيحه. اذكر موعد الإغلاق فقط إذا أكدته اللعبة الرسمية للجولة ذاتها، وإلا قل إنه غير مؤكد. ابحث بالأدوات عن المباريات والأسعار والإصابات والمشاركة المتوقعة. اقترح كابتن ونائباً وخيارات اقتصادية وانتقالات حسب الميزانية والتشكيلة إن ذكرهما المستخدم. اشرح سبب الترشيح ومخاطره بإيجاز. افصل توقعاتك عن الأخبار المؤكدة ولا تخترع سعراً أو موعداً أو قاعدة. تحقق من قواعد اللعبة المعنية قبل شرحها، ولا تطبق قواعد لعبة على الأخرى.
`;

const OFFICIAL_COMPETITION_SOURCES = `
استخدم هذه المصادر الرسمية بحسب البطولة المطلوبة:
- السعودية: https://www.saff.com.sa/championships.php وhttps://saffplus.sa/ar. ابحث باسم البطولة والفئة العمرية والموسم، من البراعم والناشئين إلى المحترفين. لا تخلط الفئات أو الدرجات أو المواسم.
- مصر: https://www.egyptianproleague.com/league.
- قطر: https://www.qsl.qa.
- الإمارات: https://www.uaeproleague.ae/ar.
إذا ورد اسم النادي وحده في سؤال عن مباراته القادمة، ابحث باسم النادي وعبارة «المباراة القادمة» في دليل الاتحاد السعودي وSAFF+ أيضاً، حتى إذا لم يُذكر البلد أو اسم الدوري. تحقق من درجة الفريق الأول في الموسم المطلوب. لأندية الدرجات الثانية والثالثة والرابعة السعودية، اعرض أقرب مباراة مؤكدة لكل فئة متاحة، بدءاً بالفريق الأول ثم الفئات العمرية، واذكر اسم البطولة والفئة والموعد لكل مباراة. لأندية دوري روشن، اعرض مباراة الفريق الأول فقط افتراضياً. إذا طلب المستخدم فئة محددة مثل تحت 19 سنة، اعرض الفئة المطلوبة فقط لأي نادٍ. إذا طلب تحت 19 وما دون، اعرض تحت 19 والفئات الأصغر المتاحة فقط. إذا طلب جميع الفئات صراحةً، اعرضها لكل نادٍ. لا تنسب مباراة فئة إلى أخرى أو تخترع مباريات عند غياب الجدول. افتح صفحة البطولة أو الجدول المطابق قبل نقل المعلومات، واربط الصفحة المستخدمة. إذا غابت البيانات قل ما الذي تعذر تأكيده.
`;


const CLUB_NEWS_RULES = `
إذا طلب المستخدم «آخر أخبار» أو «أبرز أخبار» نادٍ دون تحديد فترة، تحقّق أولاً من آخر مباراة مكتملة للفريق المقصود عبر جدول النادي أو منظّم البطولة، ومن المباراة القادمة إن توفرت. ابحث عن الأخبار المنشورة بعد نهاية آخر مباراة وحتى وقت الإجابة بتوقيت الرياض، بما فيها تصريحات ما بعد المباراة، التدريبات، الإصابات، الجاهزية والتحضير للمواجهة القادمة. المباراة الجارية لا تُعد مكتملة. اذكر المواجهتين والتاريخ الذي بدأت منه التغطية ثم قدّم سرداً موجزاً مرتباً بالأحدث، مع رابط مباشر وتاريخ نشر كل خبر. إذا لم تتأكد من ساعة نهاية المباراة، فلا تضمّن خبراً من يوم المباراة إلا إذا ثبت أنه نُشر بعد نهايتها. إذا تعذر تأكيد آخر مباراة، اذكر ذلك وحدد نطاق التواريخ الذي أمكن التحقق منه. إذا حدّد المستخدم اليوم أو أمس أو فترة أخرى، اتبع الفترة التي طلبها.
ابدأ البحث عن الأخبار والتحديثات الكروية في منصة إكس عبر أدوات البحث باستخدام site:x.com وsite:twitter.com، وابحث باسم النادي بالعربية والإنجليزية وباسم اللاعب أو الموضوع عند ذكره. ابحث بشكل منفصل في الحساب الرسمي للنادي، وحساب المنظم، والصحفيين المختصين، وحسابات متابعة النادي. من أمثلة عبارات البحث: «هلال ستاف» للهلال، «تيميديا الاتحاد» للاتحاد، و«أخبار النصر» للنصر. تحقق من هوية الحساب قبل نسب الخبر ولا تخمّن معرّفه ولا تعتبر حساب متابعة ناطقاً باسم النادي.
استخدم روابط المنشورات المباشرة، لا صفحة الحساب ولا مقتطف بحث بلا تاريخ. تحقق من وقت النشر ومحتوى المنشور، واستبعد المعاد نشره والقديم من أخبار اليوم. «اليوم» و«أمس» بحسب توقيت الرياض. اعرض الأحدث أولاً مع التاريخ والوقت إذا توفر، وصنّف كل بند: إعلان رسمي، تقرير صحفي، أو نقل من حساب متابعة. انسب كل خبر لصاحبه الأصلي، واجمع المنشورات المكررة عن الخبر نفسه. عند تعارض التقارير وضّح الخلاف ولا تحسمه بالتخمين.
إذا لم تتمكن من قراءة منشور إكس أو التحقق من تاريخه، ابحث عن إعلان مطابق من النادي أو البطولة أو وسيلة موثوقة واذكر المصدر الذي تحققت منه فعلاً. إذا لم تجد خبراً مؤرخاً في الفترة المطلوبة، قل ذلك بوضوح. إذا أضفت سياقاً أقدم فافصله بعنوان وتاريخ واضحين. اعرض خلاصة عربية قصيرة مع الروابط. لا تَعِد بتغطية لحظية أو إشعارات.
`;

export async function POST(req: Request) {
  const requestStarted = performance.now();
  try {
    const body = await req.json();
    const hasImage = Array.isArray(body?.files) && body.files.some((file: { type?: string } | null) => file?.type === 'image');
    const query = (typeof body?.query === 'string' ? body.query.trim() : '') || (hasImage ? 'اقرأ الصورة المرفقة ووضح ما يظهر فيها.' : '');
    // Match artwork is built from independently verified provider data, not model-invented fixture rows.
    if (!hasImage && posterIntent(query)) {
      const conversation_id = typeof body?.conversation_id === 'string' ? body.conversation_id : '';
      const tag = '<aifball-match-poster query="' + encodeURIComponent(query) + '" />';
      const events = [{ event: 'message', answer: tag, conversation_id }, { event: 'message_end', conversation_id }];
      return new Response(events.map(event => 'data: ' + JSON.stringify(event) + '\n\n').join(''), {
        headers: { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache, no-transform' },
      });
    }
    const detailedMatch=isDetailedMatchQuery(query);
    const analysis = body?.analysis_mode === true || isAnalysisRequest(query);
    const conversation_id = body?.conversation_id || '';
    const documentaryContext = typeof body?.documentary_context === 'string' ? body.documentary_context.slice(0, 6000) : '';
    const historical = historyMode(query, documentaryContext);
    const matchSummary = historical === 'none' && isMatchSummaryRequest(query) && !/(?:صم[ّ]?م|تصميم|بوستر|ملصق|إنفوجرافيك)/i.test(query);

    if (matchSummary) console.info('[AIFBALL_SUMMARY_ROUTE]', JSON.stringify({ mode: 'match-summary', hasImage, historical, isDetailedMatch: detailedMatch }));
    const singleReport = matchSummary && !hasImage ? await buildSingleMatchHighlights(query, req.signal).catch(() => null) : null;
    if (matchSummary) console.info('[AIFBALL_FIXTURE_LOOKUP]', JSON.stringify({
      fixtureAvailable: Boolean(singleReport),
      verifiedVideoTagPresent: Boolean(singleReport && /\\bvideo_status="found"/.test(singleReport)),
    }));
    // Only short-circuit Dify when an actual official video was found.
    // Otherwise let Dify's connected DuckDuckGo search try the same fixture.
    if (singleReport && /\bvideo_status="found"/.test(singleReport)) {
      const events = [{ event: 'message', answer: singleReport, conversation_id }, { event: 'message_end', conversation_id }];
      return new Response(events.map(event => `data: ${JSON.stringify(event)}\n\n`).join(''), { headers: { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache, no-transform', 'X-AiFBall-Presentation': 'match-summary' } });
    }

    // Daily highlights use confirmed scoreboard data first, then match-scoped videos.
    // A request for one named match continues through the existing narrative-first Dify flow.
    const dailyReport = matchSummary ? await buildDailyHighlights(query, { includeVideos: true }) : null;
    if (matchSummary) console.info('[AIFBALL_DAILY_LOOKUP]', JSON.stringify({
      reportAvailable: Boolean(dailyReport),
      structuredCardsAvailable: Boolean(dailyReport && /<aifball-summary\\b/i.test(dailyReport)),
    }));
    if (dailyReport && !process.env.DIFY_API_KEY) {
        const events = [
          { event: 'message', answer: dailyReport, conversation_id },
          { event: 'message_end', conversation_id },
        ];
        const stream = events.map(event => `event: ${event.event}\ndata: ${JSON.stringify(event)}\n\n`).join('');
        return new Response(stream, {
          headers: {
            'Content-Type': 'text/event-stream; charset=utf-8',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no',
            'X-AiFBall-Presentation': 'daily-highlights',
          },
        });
    }
    const jawwyLeague = isJawwyLeagueRequest(query);
    
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

    const playerCareer = /مسير|لاعب|بطاق|راتب|عقد|سوقي|career|player|profile|salary|contract/i.test(query) || /^(?:[\p{L}\p{M}]+[ \t]+){1,4}[\p{L}\p{M}]+[؟?]?$/u.test(query.trim());
    const nameOnlyPlayer = !conversation_id && !hasImage && /^[\p{L}\p{M}]+(?:[ \t]+[\p{L}\p{M}]+){1,3}[؟?]?$/u.test(query.trim()) && !/^(?:متى|كيف|لماذا|وين|من|هل|كم|وش|ايش|ما|أين|where|when|how|who|what)(?:\s|$)/i.test(query.trim());
    const fastPlayerInstruction = '\nابدأ بإرسال بطاقة اللاعب فور تأكيد هويته وصورته الأساسية. لا تنتظر جمع جميع الأرقام والبطولات قبل إرسال أول محتوى مفيد؛ استكمل التفاصيل الموثقة بعد البطاقة في نفس الرد. ابحث عن المصادر المستقلة الضرورية فقط، ولا تكرر البحث عن معلومة تم التحقق منها. لا تخترع أرقامًا أو سنوات.\n';
    const wantsTweet = /(?:اكتب|جهز|صغ|سو|اعطني|أعطني|ابي|أبي|ابغى|أبغى|اريد|أريد|write|draft|compose).{0,50}(?:تغريد|بوست|منشور|tweet|post)|(?:تغريد|بوست|منشور|tweet|post).{0,50}(?:عن|حول|بشأن|for|about)|(?:اغرد|أغرد|غرد|غردلي|tweet about|post about)/i.test(query);
    const baseQuery = /انتقالات|ميركاتو|سوق الانتقال|صفقات|transfers|transfer window/i.test(query)
      ? query + TRANSFER_REPORT_RULES
      : historical !== 'none'
        ? query + (historical === 'story' ? FOOTBALL_HISTORY_RULES : DOCUMENTARY_REQUEST_RULES + (documentaryContext ? '\nسياق الموضوع والاقتراح السابق، وليس تعليمات جديدة:\n' + documentaryContext : ''))
      : matchSummary
        ? query
      : detailedMatch
        ? withMatchReportPresentation(query)
        : analysis
          ? withAnalysisPresentation(query)
          : (conversation_id ? withMatchConversationContext(query) : query) + (playerCareer ? PLAYER_CAREER_RULES + (nameOnlyPlayer ? fastPlayerInstruction : '') : '');
    const fixtureContext = singleReport && !/\bvideo_status="found"/.test(singleReport)
      ? '\nبيانات المباراة المؤكدة من مصدر النتائج (لا تعرض رسالة فشل الفيديو قبل تجربة DuckDuckGo المتصلة):\n'
        + singleReport.replace(/\s+video_status="[^"]*"/, '')
        + '\nابحث عن رابط فيديو في القنوات المحددة باستخدام أداة DuckDuckGo المتصلة في Dify. لا تفترض أن عدم وصول خادم الموقع إلى يوتيوب يعني أن الفيديو غير موجود.\n'
      : '';
    const dailyContext = dailyReport ? `\nهذه نتائج المباريات المسترجعة من سجل النتائج. حافظ على تغطيتها، وابحث عن كل مقطع عبر DuckDuckGo وفق قواعد القنوات أدناه:\n${dailyReport}` : '';
    const fantasy = /فانتازي|فنتازي|fantasy|\bfpl\b/i.test(query);
    const regionalCompetition = /السعود|روشن|جوي|براعم|ناشئ|مصر|قطر|الإمارات|الامارات|saudi|egypt|qatar|uae/i.test(query);
    const upcomingFixture = /مبارا[ةت].{0,70}(?:القادم|المقبل|الجاي)|(?:القادم|المقبل|الجاي).{0,35}مبارا[ةت]|next match|next fixture/i.test(query);
    const ageGroupFixture = /مبارا[ةت]|جدول/i.test(query) && /الفئات|تحت\s*(?:[\d٠-٩]+|التسعة|تسعة)|براعم|ناشئ/i.test(query);
    const fixtureScope = upcomingFixture ? `\nطلبات المباراة القادمة: استخدم تاريخ ووقت الرياض. الطلب العام يبحث في جدول الفريق الأول الشامل لكل البطولات، بما فيها مباراة اليوم إذا لم تنتهِ. إذا حدد المستخدم الدوري أو بطولة أخرى، اقتصر على تلك البطولة. ابدأ بجدول النادي الشامل والمنظم الرسمي للبطولة، وقارن أحدث صف مؤرخ من الاتحاد أو الرابطة أو الاتحاد القاري. ESPN مصدر مساعد فقط ولا يكفي لاستبعاد مباراة. لا تختَر صفاً غير مؤرخ إذا وجدت مباراة مؤكدة مجدولة أقرب. لا تعتمد صفحة قديمة أو تجريبية. إذا اختلفت الساعات، تحقق من المنطقة الزمنية أولاً، وإذا بقي الاختلاف اذكره مع المصدرين. افصل فئات النادي حسب القواعد التالية.\n` : '';
    const clubNews = !wantsTweet && /أخبار|اخبار|مستجد|تحديثات|تغريد|شائعات|وش صار|وش سوى|ماذا فعل|latest news|club news|\bx\.com\b|twitter|تويتر|منصة إكس|منصة اكس/i.test(query);
    const newsDate = clubNews ? new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Riyadh' }).format(new Date()) : '';
    const wantsDesign = /(?:صم[ّ]?م|تصميم|بوستر|ملصق|بطاقة مباراة|إنفوجرافيك|جدول.{0,20}(?:الجول[ةات]|الدور[ةات]|المباريات))/i.test(query);
    const wantsPhoto = /صور[هة]|صوّر|photo|picture/i.test(query) && !hasImage;
    const photoRules = wantsPhoto ? `ابحث عن صور منشورة عبر أداة البحث عن الصور والبحث في إكس وحساب النادي والبطولة والمصور أو ويكيميديا كومنز. عند طلب صورة من آخر مباراة، حدد آخر مباراة مكتملة شارك فيها اللاعب من سجل المشاركات، ثم تحقق من هوية اللاعب والمواجهة وتاريخ الصورة من وصف المصدر. فضّل معارض صور المباراة لدى النادي ومنظم البطولة، ثم معارض الصحف الرياضية مثل AS وMundo Deportivo. افتح المعرض واختر الصورة التي يذكر وصفها اللاعب والمباراة، واستخرج رابط ملفها المباشر من رابط الصورة داخل المعرض أو أداة البحث عن الصور. لا تستخدم صورة غلاف المعرض لمجرد أنها من نفس المباراة. إذا لم يوفر المصدر الأول رابط صورة صالحاً، تابع البحث في معرض آخر قبل استخدام معاينة صفحة المصدر. فرّق بين تاريخ التصوير وتاريخ النشر. عند طلب صورة حديثة، ابحث عن أحدث صورة موثقة واذكر التاريخ المتاح. لا تعرض صورة أرشيفية باعتبارها من آخر مباراة ولا تولد صورة بدل الصورة المنشورة. إذا أمكن التحقق من رابط ملف الصورة HTTPS وصفحة المصدر، أخرج الوسم في سطر مستقل: <aifball-photo image="رابط ملف الصورة المباشر" source="رابط المنشور أو صفحة الصورة" caption="اللاعب والمواجهة إن ثبتت" date="التاريخ المتحقق منه" />. إذا وجدت لقطة بديلة موثقة لنفس اللاعب والمباراة من مصدر آخر، أضف alternate_image برابط ملفها المباشر HTTPS في الوسم نفسه، كي تجربها الواجهة إذا فشل تحميل الأولى. استخدم علامات الاقتباس فقط لتحديد الحقول. إذا تأكدت من صفحة الصورة ولم يتوفر رابط ملف صالح، أخرج نفس الوسم مع image فارغاً وsource لصفحة الصورة نفسها كي تحاول الواجهة عرض معاينتها. لا تضع رابطاً نصياً بدل الصورة ولا تكرر الرد. إذا تعذّر التحقق، اذكر ذلك بوضوح.\n` : '';
    const visualRules = (hasImage || wantsDesign) ? `\nإذا أرفق المستخدم صورة، افحص الصورة نفسها واقرأ النص والشعارات الظاهرة. ميّز بوضوح ما قرأته من الصورة وما تحققت منه خارجياً. لا تخترع هوية أو موعداً أو نتيجة من جزء غير واضح. فرّق بين موعد انطلاق المباراة وموعد الاستوديو.\nعندما يطلب المستخدم تصميم بطاقة مباراة أو جدول أو نتائج أو قرعة، أخرج الوسم التالي في سطر مستقل: <aifball-match-design kind="schedule" competition="اسم البطولة" subtitle="الجولة أو التاريخ" rows="اليوم|الفريق على اليمين|الفريق على اليسار|الموعد أو النتيجة أو ضد|الملعب والقناة إن توفرا|رابط شعار الفريق الأول|رابط شعار الفريق الثاني" />. استخدم kind من match أو schedule أو results أو draw. في حقلي الشعارات استخدم روابط HTTPS المباشرة من بيانات المصدر أو من المرفق النصي فقط، واتركهما فارغين إذا لم يتوفرا. لا تخمّن الروابط. افصل الصفوف بفاصلة منقوطة ASCII واستعمل | للفصل بين الحقول. في النتائج اكتب قيمة النتيجة من اليسار إلى اليمين بحيث الرقم الأول يخص الفريق المكتوب أولاً في البيانات، واعرض تعيين الأهداف لكل فريق كتابةً بعد الوسم لتجنب اللبس. اترك الموعد فارغاً إذا تعذر توثيق ساعة الانطلاق أو منطقتها الزمنية. اترك البيانات الناقصة فارغة ولا تضع علامات اقتباس أو وسوماً داخل القيم. في طلب تصميم جدول أو بطاقة، استخدم فقط البيانات التي كتبها المستخدم أو أرفقها أو زودك بها سابقاً. اعرض التصميم مباشرة واترك الحقول الاختيارية الناقصة فارغة. إذا لم توجد مواجهات قابلة للتصميم، اطلب منه أسماء المواجهات أو صورة الجدول. إذا كان المطلوب من الصورة فاستخدم محتواها المقروء فقط. لا تجلب بيانات من الخارج عند طلب التصميم وحده. إذا طلب المستخدم جلب البيانات صراحةً، تحقّق من المصدر أولاً. هذه القوالب لكل البطولات والمنتخبات دون حصر جغرافي. للمباراة القادمة، ابحث في جدول الفريق لجميع البطولات ما لم يحدد المستخدم بطولة. إذا طلب المستخدم صراحةً جلب مباريات الجولة، اجلبها كاملة من جدول المنظم أو ESPN أو مصدر رياضي موثوق يغطي البطولة. إذا لم يغطها ESPN استخدم موقع الاتحاد أو الرابطة أو البطولة. تحقق من الموسم ورقم الجولة وقارنها مع تاريخ الطلب. اعرض المباريات الموثقة مرتبة حسب اليوم ووقت الانطلاق، واذكر المنطقة الزمنية، وأظهر حالة التأجيل إذا كانت مؤكدة. ضع كل يوم في حقل المجموعة. إذا كانت البيانات جزئية صرّح بذلك، وأرفق رابط جدول الجولة نفسه. لا تضف صور اللاعبين إلى التصميم.\n` : '';
    const gameStart = /اختبرني|تحد[ىي] الثلاثين|تحد[ىي] 30|لغز|لعبة من اللاعب|quiz/i.test(query);
    const gameRules = `إذا طلب المستخدم لعبة كروية أو كانت المحادثة في جولة لعبة نشطة، العب داخل الشات. في لغز اللاعب اختر جواباً موثقاً وقدّم قرائن عن أنديته أو زملائه دون كشفه. اقبل الأسماء المكافئة، وأعط تلميحاً واحداً عند الخطأ. في الاختبار أو تحدي الثلاثين اسأل سؤالاً واحداً كل مرة، سجّل النقاط واذكرها بعد الإجابة. لا تدّع وجود مؤقت فعلي. حافظ على نوع اللعبة والنقاط من سياق المحادثة، وأنهِ الجولة عند طلب المستخدم. إذا انتهت اللعبة أو غيّر الموضوع، أجب كالمعتاد.\n`;
    const guidedQuery = baseQuery + ((gameStart || conversation_id) ? gameRules : '') + photoRules + visualRules + fixtureScope + fixtureContext + dailyContext + (clubNews ? CLUB_NEWS_RULES + `\nتاريخ الرياض اليوم هو ${newsDate}. إذا طلب المستخدم أخبار اليوم صراحةً، استبعد أي بند منها إذا لم يثبت أن تاريخ نشره يساوي هذا التاريخ وأن رابطه يفتح المنشور أو المقال نفسه. تاريخ المباراة ليس تاريخ النشر. ارفض روابط الحسابات وصفحات التصنيفات. إذا لم يبق أي بند بعد التصفية، أجب فقط بأنك لم تجد أخباراً موثقة للفترة المطلوبة، دون جدول أو أخبار سابقة.\n` : '') + (fantasy ? FANTASY_RULES : '') + (!matchSummary && (regionalCompetition || fantasy || upcomingFixture || ageGroupFixture) ? OFFICIAL_COMPETITION_SOURCES : '') + (matchSummary ? MATCH_SUMMARY_RULES : '') + (jawwyLeague ? JAWY_LEAGUE_RULES : '') + (wantsTweet ? TWEET_COMPOSER_RULES : '');

    const difyStarted = performance.now();
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
        query: guidedQuery,
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

    // Preview-only stage timings: no user text, Dify content or credentials.
    const traceLatency = process.env.VERCEL_ENV === 'preview';
    const preDifyMs = Math.round(difyStarted - requestStarted);
    const difyHeadersMs = Math.round(performance.now() - difyStarted);
    if (traceLatency) console.info('[AiFBall latency]', JSON.stringify({
      stage: 'dify_headers', preDifyMs, difyHeadersMs, guidedQueryChars: guidedQuery.length,
    }));
    let observedBody = apiRes.body;
    if (observedBody && traceLatency) {
      let firstChunk = true;
      let chunkCount = 0;
      observedBody = observedBody.pipeThrough(new TransformStream<Uint8Array, Uint8Array>({
        transform(chunk, controller) {
          chunkCount++;
          if (firstChunk) {
            firstChunk = false;
            console.info('[AiFBall latency]', JSON.stringify({
              stage: 'dify_first_chunk', msFromRequest: Math.round(performance.now() - requestStarted),
              msAfterHeaders: Math.round(performance.now() - difyStarted - difyHeadersMs),
            }));
          }
          controller.enqueue(chunk);
        },
        flush() {
          console.info('[AiFBall latency]', JSON.stringify({
            stage: 'dify_stream_end', totalMs: Math.round(performance.now() - requestStarted), chunkCount,
          }));
        },
      }));
    }

    // إرجاع الـ Stream مباشرة للواجهة الأمامية
    return new Response(observedBody && historical !== 'none' && !hasImage && !wantsDesign ? verifiedSummaryStream(observedBody, req.signal, (answer, signal) => presentHistoryAnswer(answer, historical, signal)) : observedBody && matchSummary && !hasImage && !wantsDesign
      ? verifiedSummaryStream(observedBody, req.signal, async (answer, signal) => {
          if (/<aifball-summary\b/i.test(answer)) return verifySummaryAnswer(answer, signal);
          // When Dify returns prose only, retain its explanation and append independently
          // verified fixture cards so the existing inline video renderer can display them.
          if (dailyReport && /<aifball-summary\b/i.test(dailyReport)) {
            const verifiedCards = await verifySummaryAnswer(dailyReport, signal);
            return answer + '\n\n' + verifiedCards;
          }
          // Never fabricate structure from free prose. Use the independently
          // confirmed fixture only when the scoreboard lookup succeeded.
          if (process.env.VERCEL_ENV === 'preview') {
            console.info('[AIFBALL_SUMMARY_FORMAT_DEBUG]', JSON.stringify({
              difyEmittedTag: false, confirmedFixtureAvailable: Boolean(singleReport),
            }));
          }
          return singleReport ? verifySummaryAnswer(singleReport, signal) : answer;
        })
      : observedBody && !hasImage && !wantsPhoto && !wantsDesign && !upcomingFixture && (detailedMatch || body?.has_match_context === true) ? groundedMatchStream(observedBody,query,req.signal) : observedBody, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
        ...(traceLatency ? { 'Server-Timing': `pre_dify;dur=${preDifyMs}, dify_headers;dur=${difyHeadersMs}` } : {}),
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
