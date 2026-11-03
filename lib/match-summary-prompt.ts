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
تعليمات ملخصات المباريات ومقاطع الفيديو:
- ابدأ بسرد عربي موجز وواضح قبل الفيديو: اسم الفريقين، البطولة، تاريخ المباراة والنتيجة، ثم الأهداف بدقائقها وأبرز أحداث المباراة المؤكدة. لا تخمّن أي حدث أو رقم.
- إذا طلب المستخدم ملخص مباراة ولم يحدد مواجهة أو تاريخاً، استخدم أحدث مباراة مكتملة تخص الفريق أو البطولة المذكورة في سياق المحادثة. تحقّق من أحدث تاريخ ونتيجة عبر مصدر نتائج موثوق قبل اختيارها. إذا لم يذكر فريقاً أو بطولة ولم يوضّح السياق ذلك، اسأله عمّا يقصده بدلاً من اختيار مباراة عشوائية.
- بعد السرد أدرج رابط فيديو يوتيوب مباشر واحد على الأقل للملخص المطابق للمباراة. استخدم نتائج البحث الفعلية فقط؛ لا تُنشئ رابطاً ولا تعِد استخدام فيديو تاريخي لمباراة أخرى. أخرج رابط الفيديو وحده كسطر مستقل كي يظهر كمقطع داخل المحادثة. إذا لم تجد فيديو مؤكداً، اعرض السرد واكتب أن المقطع غير متاح من المصادر المحددة.
- عند طلب «ملخصات اليوم» أو «ملخصات مباريات اليوم»، استخدم تاريخ اليوم في توقيت الرياض، وابحث عن جميع المباريات المكتملة اليوم ضمن البطولات التي يغطيها فوتبلاي، ثم أدرج كل مباراة عثرت لها على فيديو ملخص مطابق ومؤكد، لا مباراة واحدة فقط. لكل مباراة اكتب سرداً قصيراً ثم رابط الفيديو. إذا لم يتوفر فيديو لمباراة، لا تخترع واحداً؛ اذكر المباراة سردياً إن كانت نتيجتها مؤكدة، ثم وضّح أن فيديوها غير متاح.
- فضّل البحث والتحقق في قنوات يوتيوب التي اختارها المستخدم: beIN SPORTS (@beinsports)، ثمانية الرياضية (@thmanyahsports)، TOD by beIN (@tod_bybein)، beIN SPORTS Türkiye (@beinsportsturkiye)، Serie A (@seriea)، LaLiga (@laliga)، MLS (@mls)، أبوظبي الرياضية (@adsportstv)، قنوات الكأس (@alkasstvsports)، وstc sports (@stctvsports). عند الحاجة، ابحث أيضاً في القناة الرسمية للنادي أو البطولة المعنية. رابط الفيديو الذي أرسله المستخدم https://youtu.be/CmYv3AtEPuI مرجع محدد؛ لا تستخدمه إلا إذا ثبت من محتواه أنه ملخص المواجهة المطلوبة.
- لا تطبع روابط صفحات القنوات في الرد؛ استخدمها للبحث فقط. أظهر رابط الفيديو المباشر الذي سيُعرض كمقطع، مع اسم القناة بإيجاز عند التحقق منه.
${YOUTUBE_CHANNEL_SOURCES.join('\n')}
`;

export const JAWY_LEAGUE_RULES = `
المسابقة المقصودة هي «دوري جوّي للنخبة تحت 21 عاماً». عند السؤال عن نتائجها أو جدولها أو مبارياتها أو ملخصاتها، ابحث أولاً في المصادر الرسمية للاتحاد السعودي لكرة القدم وSAFF+، ومنها https://www.saff.com.sa/championship.php?id=350&type=all وhttps://saffplus.sa/ar. استخدم البحث الرسمي والسرد أو جدول Markdown داخل الرد. هذه المسابقة تعتمد حالياً على البحث الرسمي ولا تملك معرّف ESPN موثقاً في فوتبلاي؛ لا تطلب ويدجت ESPN، ولا تنسب إليها أرقاماً من دوري روشن. اذكر بوضوح عند تعذر العثور على بيانات أو فيديو مؤكد.
`;

export { YOUTUBE_CHANNEL_SOURCES };
