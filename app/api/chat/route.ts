import { playerPresentationRules } from '../../../lib/player-prompt';
import { parseSSEFrame } from '../../../lib/chat-stream';
import { playerPromptIntent } from '../../../lib/chat-intent';
import { preferredAnswerLanguage } from '../../../lib/app-language';
// Vercel preview rebuild trigger for PR #50 - 2026-11-05 rerun; no production merge.
// Preview redeploy trigger: structured highlights fallback, unrestricted discovery experiment; production unchanged.
import { verifiedSummaryStream, verifySummaryAnswer } from '../../../lib/verified-summary';
import { posterIntent } from '../../../lib/match-card-data';
import { buildSingleMatchHighlights } from '../../../lib/single-match-highlights';
import { historyMode, FOOTBALL_HISTORY_RULES, DOCUMENTARY_REQUEST_RULES, presentHistoryAnswer } from '../../../lib/football-history';
import { resolveDatedMatchReport, requestedReportPlayer } from '../../../lib/dated-match-report';
import { groundedMatchAnswer, groundedMatchStream } from '../../../lib/grounded-match-answer';
import { requestedTeam, latestVerifiedMatch, latestMatchText } from '../../../lib/latest-match';
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
أنت محرر أخبار كروية داخل فوتبلاي، لا دليل روابط. إذا طلب المستخدم أخبار نادٍ أو لاعب أو انتقالات، يجب أن يعرف مضمون الخبر من إجابتك دون مغادرة المحادثة.
1) اجلب أولاً الأخبار الحديثة: آخر 48 ساعة بتوقيت الرياض، ثم 72 ساعة، ثم 7 أيام فقط عند قلة الأخبار مع توضيح الفترة. افصل تاريخ نشر المقال عن تاريخ الحدث. لا تنسب تاريخاً لمقال من تخمين أو من تاريخ المباراة.
2) ابحث عبر المصادر الرسمية والصحف الموثوقة ومنشورات X التي أمكن التحقق منها. استخدم DuckDuckGo لاكتشاف المقالات والمنشورات، ثم افتح المصدر الأصلي واقرأ محتواه عندما تسمح الأدوات. مقتطف نتائج البحث وحده ليس المقال الكامل. إذا لم تتمكن من قراءة النص الكامل، صرّح باختصار «ملخص من المعلومات المتاحة» ولا توحِ بأنك قرأت المقال.
3) اعرض 3–5 أخبار مختلفة فقط، مرتبة بالأهمية والحداثة: الملكية والقرارات الإدارية، الإصابات والتدريبات، الانتقالات، التصريحات والمباريات. لكل خبر عنوان واضح ثم فقرة عربية موجزة من 2–4 جمل (نحو 40–80 كلمة بحسب المعلومات المتاحة) تشرح ماذا حدث، من المعني، أهم التفاصيل، وما أثرها إن كان الأثر موثقاً. لا تكتف بعنوان الخبر أو بنسخ مقتطف بحث أو قائمة بيانات تصنيف/تاريخ/رابط/الخبر.
4) ضع بعد كل فقرة سطراً خفيفاً: «المصدر: اسم الجهة · تاريخ النشر المتحقق · رسمي/تقرير/غير مؤكد». اجعل اسم المصدر رابط Markdown واحداً قصيراً إلى المقال الأصلي إن كان الرابط مؤكداً، ولا تعرض أي URL خام أو قسماً بعنوان «الرابط» أو قائمة طويلة من المراجع. إذا لم تتوفر وصلة مؤكدة، اذكر اسم المصدر فقط. لا تُخفِ عدم اليقين.
5) صورة حقيقية مرتبطة بالخبر فقط إذا كان رابط الصورة المباشر صالحاً ومتحققاً منه وتدعم الواجهة عرضها داخل الشات؛ لا تختلق رابط صورة أو تعرض مساحة فارغة. لا تجعل الصورة شرطاً لعرض الخبر.
6) ادمج التغطيات المتكررة للحدث نفسه في خبر واحد، حتى مع اختلاف العناوين والمصادر، واذكر أكثر من مصدر عند الحاجة. افصل الصفقات الرسمية عن الشائعات والتفاوض، ولا تخترع مبالغ أو مواعيد أو تصريحات.
7) لا تعرض «نطاق التغطية» أو «تصنيف: تقرير صحفي» أو «الخبر:» أو سرد روابط منفصلة أو خلاصة طويلة تكرر البطاقات. إذا كانت هناك معلومات موثقة إضافية مهمة، اختم بسطر «وضع الفريق»؛ والمباراة القادمة تذكر منفصلة فقط إذا تحقق موعدها رسمياً.
8) إذا لم تجد أخباراً حديثة موثقة، لا تخلط بين فشل الأداة وعدم وجود أخبار. جرّب أداة البحث البديلة المتاحة (DuckDuckGo ثم GoogleSearch أو العكس)، مع توسيع البحث إلى مصادر النادي والصحف. إذا بقيت النتائج بلا تواريخ نشر مؤكدة، يمكن عرض معلومات مفيدة بعنوان «نتائج بحث لم يتأكد تاريخ نشرها» دون وصفها بأنها أخبار اليوم. إذا لم تصل أي نتائج قابلة للتحقق بعد المحاولتين، صرّح بتعذر البحث، ولا تستخدم أخباراً قديمة على أنها جديدة، ولا تدّع قراءة مقال أو تنفيذ أداة أو التحقق من تاريخ أو صورة دون نتيجة فعلية.
9) مثال البنية المرئية (ليس خبراً حقيقياً): «عنوان الخبر» ثم «ملخص يشرح الحدث والتفاصيل الأساسية بلغة سهلة.» ثم «المصدر: [اسم الصحيفة](رابط مؤكد) · تاريخ مؤكد · تقرير». كرر لكل خبر دون جدول أو روابط خام.
`;


function anyTeamLatestMatchIntent(query: string): boolean {
  const q = query.replace(/[؟?!.,،]/g, ' ').replace(/\s+/g, ' ').trim();
  return /(?:آخر|اخر|أحدث|احدث|last|latest|most recent)/i.test(q)
    && /(?:مباراة|مباريات|لقاء|مواجهة|نتيجة|match|game|result)/i.test(q)
    && !/(?:ملخص|تحليل|تشكيل|إحصائيات|احصائيات|فيديو|موعد|القادمة|القادم|next|highlights)/i.test(q);
}

// Fail closed on clearly stale answers for ANY team, not only hard-coded clubs.
// This is a safety net; it does not replace independently verified fixture discovery.
function rejectStaleLatestMatch(answer: string): string {
  const dates = [...answer.matchAll(/\b(20\d{2})[-\/]([01]?\d)[-\/]([0-3]?\d)\b/g)]
    .map(m => Date.parse(`${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}T00:00:00Z`))
    .filter(Number.isFinite);
  const arabicMonths: Record<string, number> = { يناير:1, فبراير:2, مارس:3, أبريل:4, ابريل:4, مايو:5, يونيو:6, يوليو:7, أغسطس:8, اغسطس:8, سبتمبر:9, أكتوبر:10, اكتوبر:10, نوفمبر:11, ديسمبر:12 };
  for (const m of answer.matchAll(/\b([0-3]?\d)\s+(يناير|فبراير|مارس|أبريل|ابريل|مايو|يونيو|يوليو|أغسطس|اغسطس|سبتمبر|أكتوبر|اكتوبر|نوفمبر|ديسمبر)\s+(20\d{2})\b/g)) {
    dates.push(Date.UTC(Number(m[3]), arabicMonths[m[2]] - 1, Number(m[1])));
  }
  const recent = dates.filter(d => d <= Date.now() + 86400000);
  if (recent.length && Math.max(...recent) < Date.now() - 60 * 86400000) {
    return 'لم أتمكن من تأكيد آخر مباراة مكتملة للفريق من بيانات حديثة. النتيجة التي وصلت من البحث قديمة، ولذلك لن أعرضها على أنها آخر مباراة. يرجى إعادة المحاولة عند توفر مصدر مباريات محدث.';
  }
  return answer;
}

function latestClubMatchIntent(query: string): string | null {
  const q = query.replace(/[؟?!.,،]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!/(?:آخر|اخر|أحدث|احدث|last|latest|recent)/i.test(q) ||
      !/(?:مباراة|مباريات|لقاء|نتيجة|match|game|result)/i.test(q) ||
      /(?:ملخص|تحليل|تشكيل|إحصائيات|احصائيات|فيديو|هدف|أهداف|اهداف|موعد|القادمة|القادم|next|highlights)/i.test(q)) return null;
  const clubs: Array<[RegExp, string]> = [
    [/(?:الاتحاد|الإتحاد|ittihad|al[ -]?ittihad)/i, 'al ittihad'],
    [/(?:الهلال|hilal|al[ -]?hilal)/i, 'al hilal'],
    [/(?:برشلونة|برشلونه|barcelona|barca|barça)/i, 'barcelona'],
  ];
  const found = clubs.filter(([pattern]) => pattern.test(q));
  return found.length === 1 ? found[0][1] : null;
}

type LatestMatch = {
  date_utc: string; competition: string; home_team: string; away_team: string;
  home_score: number; away_score: number; verification: string; source: string;
};

function espnEventToMatch(event: any, competition: string, club: string): LatestMatch | null {
  const fixture = event?.competitions?.[0];
  const sides = fixture?.competitors;
  if (!Array.isArray(sides) || sides.length !== 2) return null;
  const home = sides.find((x: any) => x.homeAway === 'home');
  const away = sides.find((x: any) => x.homeAway === 'away');
  // ESPN may report completion on either the competition or event status.
  // Never treat scheduled, postponed, or live fixtures as final results.
  const completed = fixture?.status?.type?.completed === true || event?.status?.type?.completed === true;
  if (!home || !away || !completed) return null;
  const homeName = String(home.team?.displayName || home.team?.name || '');
  const awayName = String(away.team?.displayName || away.team?.name || '');
  const teamMatches = (side: any) => {
    const names = [side.team?.displayName, side.team?.name, side.team?.shortDisplayName, side.team?.abbreviation]
      .map((n: unknown) => String(n || '').toLowerCase());
    return club === 'barcelona'
      ? names.some(n => /barcelona|barça|barca/.test(n))
      : club === 'al hilal'
        ? names.some(n => /hilal/.test(n))
        : names.some(n => /ittihad/.test(n));
  };
  if (!teamMatches(home) && !teamMatches(away)) return null;
  const score = (side: any): number => Number(typeof side.score === 'object' ? side.score?.displayValue ?? side.score?.value : side.score);
  const hs = score(home), as = score(away);
  const date = String(event?.date || '');
  if (!Number.isInteger(hs) || !Number.isInteger(as) || !/^\d{4}-\d{2}-\d{2}T/.test(date) ||
      new Date(date).getTime() > Date.now()) return null;
  return { date_utc: date, competition, home_team: homeName, away_team: awayName,
    home_score: hs, away_score: as, verification: 'espn_only_unverified', source: 'ESPN scoreboard' };
}

async function espnLatestMatchAnswer(club: string): Promise<string | null> {
  // Query the isolated backend first. ESPN remains a bounded fallback when that
  // service is unavailable; neither feed is described as independently verified.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 18000);
  try {
    const clubName = club === 'barcelona' ? 'برشلونة' : club === 'al ittihad' ? 'الاتحاد' : 'الهلال';
    const leagues: Array<[string, string]> = club === 'barcelona'
      ? [['esp.1', 'La Liga'], ['uefa.champions', 'UEFA Champions League'], ['esp.copa_del_rey', 'Copa del Rey']]
      : [['ksa.1', 'Saudi Pro League'], ['afc.champions', 'AFC Champions League Elite'], ['ksa.kings.cup', 'King Cup'], ['fifa.cwc', 'FIFA Club World Cup']];
    const end = new Date();
    const begin = new Date(end.getTime() - 42 * 86400000);
    const fromBackend = async (): Promise<LatestMatch[]> => {
      const base = (process.env.AIFBALL_PYTHON_API_URL || 'https://aifball-python-api.onrender.com').replace(/\/$/, '');
      // Keep outbound requests limited to our Render services.
      if (!/^https:\/\/aifball-python-(?:api|test)\.onrender\.com$/.test(base)) return [];
      const url = new URL(base + '/research/live/club-latest-match');
      url.searchParams.set('club', club);
      url.searchParams.set('days', '42');
      const response = await fetch(url, { signal: controller.signal, cache: 'no-store', headers: { Accept: 'application/json' } });
      if (!response.ok) return [];
      const data = await response.json();
      const rows = Array.isArray(data?.matches) ? data.matches : data?.latest_match ? [data.latest_match] : [];
      return rows.map((row: any): LatestMatch | null => {
        if (row?.completed !== true) return null;
        const date = String(row.date_utc || '');
        const home = String(row.home_team || ''), away = String(row.away_team || '');
        const hs = Number(row.home_score), as = Number(row.away_score);
        if (!/^\d{4}-\d{2}-\d{2}T/.test(date) || !Number.isFinite(Date.parse(date)) ||
            Date.parse(date) > Date.now() || Date.parse(date) < begin.getTime() ||
            !Number.isInteger(hs) || !Number.isInteger(as) || !home || !away) return null;
        const names = (home + ' ' + away).toLowerCase();
        if (!(club === 'al hilal' ? /hilal/.test(names) : club === 'barcelona' ? /barcelona|barça|barca/.test(names) : /ittihad/.test(names))) return null;
        return { date_utc: date, competition: String(row.competition || ''),
          home_team: home, away_team: away, home_score: hs, away_score: as,
          verification: 'espn_only_unverified', source: 'ESPN scoreboard' };
      }).filter((m: LatestMatch | null): m is LatestMatch => m !== null);
    };
    const fromEspn = async (): Promise<LatestMatch[]> => {
      // ESPN's documented date filter accepts explicit YYYYMMDD ranges.
      // The previous YYYYMM month request was not supported by the evidence.
      const windows: Array<[string, string]> = [];
      const day = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, '');
      for (let cursor = begin.getTime(); cursor <= end.getTime(); cursor += 14 * 86400000) {
        windows.push([day(new Date(cursor)), day(new Date(Math.min(cursor + 14 * 86400000 - 1, end.getTime())))]);
      }
      const requests = leagues.flatMap(([code, label]) => windows.map(async ([first, last]) => {
        const url = new URL('https://site.api.espn.com/apis/site/v2/sports/soccer/' + code + '/scoreboard');
        url.searchParams.set('dates', first + '-' + last);
        url.searchParams.set('limit', '500');
        const response = await fetch(url, { signal: controller.signal, cache: 'no-store', headers: { Accept: 'application/json' } });
        if (!response.ok) throw new Error('ESPN scoreboard HTTP ' + response.status + ' for ' + code);
        const data = await response.json();
        if (!Array.isArray(data?.events)) throw new Error('ESPN scoreboard missing events for ' + code);
        return data.events.map((event: any) => espnEventToMatch(event, label, club))
          .filter((m: LatestMatch | null): m is LatestMatch => m !== null && Date.parse(m.date_utc) >= begin.getTime() && Date.parse(m.date_utc) <= end.getTime());
      }));
      const results = await Promise.allSettled(requests);
      // A failed month/competition means the search is incomplete. Never
      // advertise an older fixture as the latest on the strength of partial data.
      if (results.some(r => r.status === 'rejected')) {
        console.warn('[AIFBALL_ESPN_INCOMPLETE]', JSON.stringify({
          club, total: results.length, failed: results.filter(r => r.status === 'rejected').length,
        }));
        return [];
      }
      return results.flatMap(r => r.status === 'fulfilled' ? r.value : []);
    };
    // Run the backend and direct ESPN discovery concurrently. A partial backend
    // window must not hide a newer match from another competition.
    const [backendResult, espnResult] = await Promise.allSettled([fromBackend(), fromEspn()]);
    const backendMatches = backendResult.status === 'fulfilled' ? backendResult.value : [];
    const directMatches = espnResult.status === 'fulfilled' ? espnResult.value : [];
    if (backendMatches.length && !directMatches.length) console.warn('[AIFBALL_BACKEND_ONLY_UNVERIFIED]', JSON.stringify({ club, count: backendMatches.length }));
    // Backend results alone cannot establish recency across all competitions.
    // Let Dify search its other providers if ESPN coverage is incomplete.
    const matches = directMatches.length ? directMatches : [];
    const unique = new Set<string>();
    const deduped = matches.filter(m => {
      const key = [m.date_utc.slice(0, 10), m.home_team.toLowerCase(), m.away_team.toLowerCase(), m.home_score, m.away_score].join('|');
      if (unique.has(key)) return false;
      unique.add(key);
      return true;
    });
    deduped.sort((a, b) => Date.parse(b.date_utc) - Date.parse(a.date_utc));
    const m = deduped[0];
    if (!m) return null;
    return [
      '### آخر مباراة — ' + clubName,
      '**' + m.home_team + ' ' + m.home_score + ' – ' + m.away_score + ' ' + m.away_team + '**',
      '**البطولة:** ' + m.competition,
      '**التاريخ (UTC):** ' + m.date_utc.slice(0, 10),
      '**حالة المعلومة:** نتيجة منشورة في ESPN، ولم تُطابق بعد مع مصدر مستقل.',
      'هذه أحدث مباراة مكتملة عُثر عليها ضمن البطولات التي شملها البحث، وقد تكون التغطية غير مكتملة.',
    ].join('\n\n');
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(req: Request) {
  const requestStarted = performance.now();
  try {
    let body;
    try { body = await req.json(); } catch { return NextResponse.json({ error: 'صيغة الطلب غير صالحة.' }, { status: 400 }); }
    if (!body || typeof body !== 'object' || Array.isArray(body) || (body.query !== undefined && typeof body.query !== 'string') ||
      (typeof body.query === 'string' && body.query.length > 12000) || (body.files !== undefined && (!Array.isArray(body.files) || body.files.length > 10))) {
      return NextResponse.json({ error: 'السؤال أو المرفقات غير صالحة.' }, { status: 400 });
    }
    const english = body?.language === 'en';
    const hasImage = Array.isArray(body?.files) && body.files.some((file: { type?: string } | null) => file?.type === 'image');
    const query = (typeof body?.query === 'string' ? body.query.trim() : '') || (hasImage ? 'اقرأ الصورة المرفقة ووضح ما يظهر فيها.' : '');
    if (!query) return NextResponse.json({ error: 'السؤال فارغ' }, { status: 400 });
    // Fast path: same ESPN scoreboard data family used by the live match center.
    // Never claim a latest result when one of the relevant competitions failed.
    const directTeam = !english && !hasImage ? requestedTeam(query) : null;
    if (directTeam) {
      const found = await latestVerifiedMatch(directTeam, req.signal);
      const conversation_id = typeof body?.conversation_id === 'string' ? body.conversation_id : '';
      // Never send a recognized latest-match question to a second, slow Dify
      // discovery path after a provider failure.
      const answer = found.match
        ? latestMatchText(directTeam, found.match) + (found.complete ? '' : '\\n\\n**تنبيه:** بعض البطولات لم تستجب؛ هذه أحدث نتيجة عُثر عليها، وليست بالضرورة آخر مباراة في جميع البطولات.')
        : 'تعذر استرجاع نتيجة مكتملة حديثة لـ' + directTeam + ' من مصدر المباريات حالياً. لا توجد نتيجة مؤكدة يمكن عرضها.';
      console.info('[AIFBALL_LATEST_DIRECT]', JSON.stringify({team:directTeam,complete:found.complete,hasMatch:Boolean(found.match)}));
      const events = [{event:'message',answer,conversation_id},{event:'message_end',conversation_id}];
      return new Response(events.map(event => 'data: '+JSON.stringify(event)+'\n\n').join(''), {
        headers: {'Content-Type':'text/event-stream; charset=utf-8','Cache-Control':'no-cache, no-transform'}
      });
    }
    // Direct, bounded ESPN lookup for explicit latest-match questions. Fallback to Dify on failure.
    const latestClub = !english && !hasImage ? latestClubMatchIntent(query) : null;
    const anyLatestMatch = !hasImage && anyTeamLatestMatchIntent(query);
    // Experimental ESPN path is isolated by default; ordinary questions continue to Dify.
    if (latestClub && (process.env.VERCEL_ENV !== 'production' || process.env.ENABLE_EXPERIMENTAL_ESPN_LATEST_MATCH === 'true')) {
      const answer = await espnLatestMatchAnswer(latestClub);
      if (answer) {
        // Return only a completed match backed by an actual provider response.
        const conversation_id = typeof body?.conversation_id === 'string' ? body.conversation_id : '';
        const events = [
          { event: 'message', answer, conversation_id },
          { event: 'message_end', conversation_id },
        ];
        return new Response(events.map(event => 'event: ' + event.event + '\ndata: ' + JSON.stringify(event) + '\n\n').join(''), {
          headers: { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache, no-transform' },
        });
      }
      // A missing ESPN/Render result is not evidence that no match exists.
      // Allow the existing Dify source-discovery pipeline to try other providers.
      console.warn('[AIFBALL_LATEST_MATCH_FALLBACK]', JSON.stringify({ club: latestClub, reason: 'provider_no_completed_match' }));
    }
    // Match artwork is built from independently verified provider data, not model-invented fixture rows.
    if (!english && !hasImage && posterIntent(query)) {
      const conversation_id = typeof body?.conversation_id === 'string' ? body.conversation_id : '';
      const tag = '<aifball-match-poster query="' + encodeURIComponent(query) + '" />';
      const events = [{ event: 'message', answer: tag, conversation_id }, { event: 'message_end', conversation_id }];
      return new Response(events.map(event => 'data: ' + JSON.stringify(event) + '\n\n').join(''), {
        headers: { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache, no-transform' },
      });
    }
    const detailedMatch=isDetailedMatchQuery(query);
    if (detailedMatch && !english && !hasImage) {
      const fixture = await resolveDatedMatchReport(query, req.signal);
      if (fixture) {
        const { report, raw } = fixture;
        const playerName = requestedReportPlayer(report, query);
        const escapeAttribute = (value: string) => value.replace(/[&"<>]/g, character =>
          ({ '&': '&amp;', '"': '&quot;', '<': '&lt;', '>': '&gt;' }[character] || character));
        const player = playerName ? ` player_name="${escapeAttribute(playerName)}"` : '';
        const tag = `<aifball-match-report match="المباراة" event="${report.eventId}" league="${report.league}"${player} />`;
        const answer = await groundedMatchAnswer(tag, report.state === 'in' ? query + ' مباشر' : query,
          req.signal, async () => Response.json(raw));
        const conversation_id = typeof body?.conversation_id === 'string' ? body.conversation_id : '';
        const events = [{ event: 'message', answer, conversation_id }, { event: 'message_end', conversation_id }];
        return new Response(events.map(event => `data: ${JSON.stringify(event)}\n\n`).join(''), {
          headers: { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache, no-transform', 'X-AiFBall-Presentation': 'match-report' },
        });
      }
    }
    const analysis = body?.analysis_mode === true || isAnalysisRequest(query);
    const conversation_id = body?.conversation_id || '';
    const documentaryContext = typeof body?.documentary_context === 'string' ? body.documentary_context.slice(0, 6000) : '';
    const historical = historyMode(query, documentaryContext);
    const matchSummary = !english && historical === 'none' && isMatchSummaryRequest(query) && !/(?:صم[ّ]?م|تصميم|بوستر|ملصق|إنفوجرافيك)/i.test(query);

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

    // Queries, conversation IDs and provider errors must stay out of public diagnostics.

    const { playerCareer } = playerPromptIntent(query, { conversationId: conversation_id, hasImage });

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
          : (conversation_id ? withMatchConversationContext(query) : query) + (playerCareer ? playerPresentationRules() : '');
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
    const OUTPUT_LANGUAGE_RULES = '\nبروتوكول اللغة: اتبع طلب اللغة الصريح أولاً، وإلا لغة السؤال الحالي، وإلا سياق المحادثة، وإلا العربية. الأسماء الأجنبية لا تغيّر لغة الرد. إذا أخرجت aifball-standings فاستخدم lang=\"ar\" أو lang=\"en\" بحسب لغة الرد؛ لا تضف lang لوسم آخر. لا تختلق إحصائيات أو روابط أو ألقاب. إذا تعذّر المكوّن لكن البيانات موثقة، استخدم جدول Markdown دون تكرار.\n';
    // Entity identity and intent quality guardrails for club-news and club-profile queries.
    const clubEntity = /(?:الهلال|al[ -]?hilal|alhilal)/i.test(query) ? 'الهلال السعودي (Al Hilal SFC)' :
      /(?:الاتحاد|الإتحاد|al[ -]?ittihad)/i.test(query) ? 'الاتحاد السعودي (Al Ittihad Club)' :
      /(?:برشلونة|barcelona|barça|barca)/i.test(query) ? 'برشلونة الإسباني (FC Barcelona)' : '';
    const clubIdentityRules = clubEntity ? `\nضبط هوية الكيان: المقصود حصراً ${clubEntity} لكرة القدم. لا تخلطه بمؤسسات تحمل الاسم نفسه مثل الهلال الأحمر المصري أو فرق أخرى. لا تستخدم صورة أو شعاراً إلا إذا أكد عنوان المصدر ووصف الصورة والنادي/الدولة تطابق الكيان؛ عند الشك احذف الصورة نهائياً. لا تعرض وسوم المكونات أو أسماءها التقنية أو رسائل تشخيص للمستخدم. إذا كان السؤال اسم النادي فقط، قدّم تعريفاً موجزاً بالنادي ولا تفترض أن المستخدم طلب أخباراً أو مباريات.\n` : '';
    const clubNewsIntentRules = clubNews ? `\nأولوية النية: سؤال «آخر أخبار» يعني أخباراً ومستجدات فعلية، وليس جدول مباريات. لا تجعل مواعيد المباريات عنوان الإجابة أو محتواها الرئيسي. إذا لم تتوفر أخبار موثقة، صرّح بذلك باختصار، ولا تعوضها بأخبار قديمة أو مواعيد فقط. لا تظهر اسم مكوّن تقني مثل aifball-club-news، ولا تُدرج صورة تعريفية غير مرتبطة مباشرة بالخبر.\n` : '';
    const latestMatchSourceRules = anyLatestMatch ? `\nسؤال آخر مباراة مكتملة: ابحث أولاً في نتائج الفريق الأول بجميع البطولات للموسم الحالي عبر FotMob و365Scores وSofaScore ثم موقع البطولة أو النادي الرسمي. فشل ESPN أو Render وحده ليس دليلاً على عدم وجود مباراة. لا تعرض مباراة قديمة باعتبارها الأحدث دون مقارنة تواريخ النتائج المكتملة، ولا تخترع نتيجة أو تاريخاً. إذا تحققت من المباراة، ابدأ بالنتيجة ثم التاريخ والبطولة وملخص خفيف؛ لا تذكر الهدافين أو التفاصيل غير الموثقة إلا إذا طلبها المستخدم. إذا تعذر التحقق بعد البحث البديل، صرّح بذلك باختصار.\n` : '';
    const guidedQuery = baseQuery + latestMatchSourceRules + OUTPUT_LANGUAGE_RULES + clubIdentityRules + clubNewsIntentRules + ((gameStart || conversation_id) ? gameRules : '') + photoRules + visualRules + fixtureScope + fixtureContext + dailyContext + (clubNews ? CLUB_NEWS_RULES + `\nتاريخ الرياض اليوم هو ${newsDate}. إذا طلب المستخدم أخبار اليوم صراحةً، استبعد أي بند منها إذا لم يثبت أن تاريخ نشره يساوي هذا التاريخ وأن رابطه يفتح المنشور أو المقال نفسه. تاريخ المباراة ليس تاريخ النشر. ارفض روابط الحسابات وصفحات التصنيفات. إذا لم يبق أي بند بعد التصفية، أجب فقط بأنك لم تجد أخباراً موثقة للفترة المطلوبة، دون جدول أو أخبار سابقة.\n` : '') + (fantasy ? FANTASY_RULES : '') + (!matchSummary && (regionalCompetition || fantasy || upcomingFixture || ageGroupFixture) ? OFFICIAL_COMPETITION_SOURCES : '') + (matchSummary ? MATCH_SUMMARY_RULES : '') + (jawwyLeague ? JAWY_LEAGUE_RULES : '') + (wantsTweet ? TWEET_COMPOSER_RULES : '') + preferredAnswerLanguage(body?.language);

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
      await apiRes.body?.cancel();
      console.error('[AiFBall upstream failure]', { status: apiRes.status });
      return NextResponse.json(
        { error: 'تعذر الاتصال بخدمة المساعد. حاول مرة أخرى بعد قليل.' },
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
      let firstAnswerLogged = false;
      let firstToolLogged = false;
      const decoder = new TextDecoder();
      let eventBuffer = '';
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
          // Inspect only Dify SSE event types, never log content, queries or identifiers.
          if (!firstAnswerLogged || !firstToolLogged) {
            eventBuffer = (eventBuffer + decoder.decode(chunk, { stream: true })).slice(-16384);
            const events = eventBuffer.split(/\r?\n\r?\n/);
            eventBuffer = events.pop() ?? '';
            for (const eventText of events) {
              const event = parseSSEFrame(eventText);
              const kind = event?.event;
              if (!kind) continue;
              if (!firstToolLogged && (kind === 'agent_thought' || kind === 'node_started')) {
                firstToolLogged = true;
                console.info('[AiFBall latency]', JSON.stringify({ stage: 'first_tool_or_node_event', msFromRequest: Math.round(performance.now() - requestStarted) }));
              }
              if (!firstAnswerLogged && (kind === 'message' || kind === 'agent_message' || kind === 'message_replace') && typeof event?.answer === 'string' && event.answer.trim().length > 0) {
                firstAnswerLogged = true;
                console.info('[AiFBall latency]', JSON.stringify({ stage: 'first_answer_event', msFromRequest: Math.round(performance.now() - requestStarted) }));
              }
            }
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
    return new Response(observedBody && !english && historical !== 'none' && !hasImage && !wantsDesign ? verifiedSummaryStream(observedBody, req.signal, (answer, signal) => presentHistoryAnswer(answer, historical, signal)) : observedBody && matchSummary && !hasImage && !wantsDesign
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
      : observedBody && !english && anyLatestMatch && !wantsDesign && !wantsPhoto ? verifiedSummaryStream(observedBody, req.signal, async (answer) => rejectStaleLatestMatch(answer))
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
