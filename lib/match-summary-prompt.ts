const YOUTUBE_CHANNEL_SOURCES = [
  'https://www.youtube.com/@beinsports',
  'https://www.youtube.com/@thmanyahsports',
  'https://www.youtube.com/@tod_bybein',
  'https://www.youtube.com/@beinsportsturkiye',
  'https://www.youtube.com/@seriea',
  'https://www.youtube.com/@laliga',
  'https://www.youtube.com/@mls',
  'https://www.youtube.com/@adsportstv',
  'https://www.youtube.com/@alkasstvsports',
  'https://www.youtube.com/@stctvsports',
] as const;

export function isMatchSummaryRequest(query: string): boolean {
  return /\b(?:match\s+)?(?:highlights?|recaps?|summar(?:y|ies))\b|ملخص|هايلايت|أبرز اللقطات|أبرز أحداث المباراة/i.test(query);
}

export function isTodayHighlightsRequest(query: string): boolean {
  return isMatchSummaryRequest(query) && /اليوم|today|tonight/i.test(query);
}

export function isJawwyLeagueRequest(query: string): boolean {
  const normalized = query.normalize('NFKD')
    .replace(/[\u0300-\u036f\u064b-\u065f\u0670ـ]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .toLowerCase();
  return /دوري\s*جوي|جوي\s*للنخبه|jawwy|jawy|elite league.{0,12}u\s*[- ]?21|u\s*[- ]?21.{0,20}elite league/i.test(normalized);
}

export const MATCH_SUMMARY_RULES = `
بروتوكول ملخصات المباريات — أولوية لهذه التعليمات في طلب الملخص فقط:
1. حدد المواجهة الصحيحة وتاريخها وبطولتها، واجلب النتيجة والأهداف وأبرز الأحداث من مصدر موثوق. إذا لم يذكر المستخدم تاريخًا، اختر أحدث مباراة مكتملة مؤكدة. لا تختلق البيانات.
2. استخدم أداة DuckDuckGo Search المتصلة فعليًا في Dify لاكتشاف روابط يوتيوب. ابحث بأسماء الفريقين بالعربية والإنجليزية مع «ملخص» وhighlights والتاريخ أو البطولة. جرّب أكثر من استعلام مناسب ولا تعتبر فشل طلب واحد دليلًا على عدم وجود فيديو.
3. القنوات المسموحة حصريًا: beIN SPORTS (@beinsports)، ثمانية الرياضية (@thmanyahsports)، TOD by beIN (@tod_bybein)، beIN SPORTS Türkiye (@beinsportsturkiye)، Serie A (@seriea)، LaLiga (@laliga)، MLS (@mls)، أبوظبي الرياضية (@adsportstv)، قنوات الكأس (@alkasstvsports)، وstc sports (@stctvsports). تحقق من اسم الناشر الفعلي ومن أن عنوان الفيديو يطابق الفريقين والمباراة المقصودة. لا تخمن هوية القناة أو الرابط.
4. أخرج وسم aifball-summary واحدًا لكل مباراة في سطر مستقل، لا داخل Markdown code block. استخدم الحقول: order وmatch وhome وaway وhome_score وaway_score وdate وcompetition وsummary وgoals وmoments وsource_url وsource_name. قيمة match تحتوي «ضد» دائمًا. goals بصيغة «اسم اللاعب|الدقيقة» تفصلها فاصلة منقوطة. اترك القيم غير المؤكدة فارغة ولا تكرر الخلاصة خارج الوسم.
5. إذا أثبتت نتيجة DuckDuckGo أن الفيديو من ناشر معتمد ومطابق، أضف الحقول كلها: video_url (رابط watch أو youtu.be المباشر)، video_title (عنوان نتيجة البحث الفعلي)، video_channel (الناشر المؤكد)، video_source_url (رابط فيديو يوتيوب نفسه من نتيجة البحث). لا تستنتج هذه القيم من كلمات الاستعلام ولا تكتب رابط بحث أو قناة. يمكن استعمال video_embed="false" إن لم يكن التضمين مؤكدًا؛ فشل تضمين الفيديو لا يعني غيابه.
6. للمباراة المحددة استخدم order="video-last": الخلاصة والأهداف ثم الفيديو. لملخصات اليوم أو الأمس استخدم order="video-first"، وحدد تاريخ الرياض واستخرج المباريات المكتملة من مصدر نتائج أولًا ثم ابحث عن فيديو كل مباراة على حدة في الدوريات الخمسة وروشن وأبطال أوروبا ونخبة آسيا، مع البطولات الأخرى المطلوبة صراحةً.
7. إذا لم يتوفر فيديو موثوق، لا تضع video_url أو بيانات الفيديو، وقدّم الملخص الكتابي المؤكد في نفس الوسم؛ لا تضع روابط غير موثقة، ولا تكتب رسالة فشل خارج البطاقة. لا تستخدم رابط الفيديو الذي أرسله المستخدم في مواجهة أخرى دون التحقق من مطابقته.
8. هذه التعليمات تعلو على أي توجيه قديم بإخراج رابط يوتيوب مستقل: ممنوع وضع رابط الفيديو خارج aifball-summary. استدعاء الأداة يجب أن يحدث فعليًا؛ لا تدّعِ البحث إن لم تُرجع الأداة نتيجة.
صفحات القنوات مرجع للبحث فقط، وليست روابط مقاطع:
${YOUTUBE_CHANNEL_SOURCES.join('\\n')}
`;

export const JAWY_LEAGUE_RULES = `
المسابقة المقصودة هي «دوري جوّي للنخبة تحت 21 عاماً». عند السؤال عن نتائجها أو جدولها أو مبارياتها أو ملخصاتها، ابحث أولاً في المصادر الرسمية للاتحاد السعودي لكرة القدم وSAFF+، ومنها https://www.saff.com.sa/championship.php?id=419&type=all وhttps://saffplus.sa/ar. صفحة البطولة ذات المعرّف 419 تخص موسم 2026-2027؛ تحقّق من الموسم ولا تستخدمها لموسم آخر. لطلبات الترتيب، أخرج <aifball-standings league="ksa.jawwy.u21" /> ليُجلب جدول الاتحاد السعودي داخل لوحة فوتبلاي، وأضف season فقط عند طلب موسم محدد. النتائج والمباريات والملخصات تستمر عبر البحث الرسمي والسرد أو جدول Markdown. هذه المسابقة لا تملك معرّف ESPN موثقاً؛ لا تستخدم ويدجت نتائج ESPN لها ولا تنسب إليها أرقاماً من دوري روشن. اذكر بوضوح عند تعذر العثور على بيانات أو فيديو مؤكد.
`;

export { YOUTUBE_CHANNEL_SOURCES };

