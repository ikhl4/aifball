import { pageJson } from './highlight-video';
import { youtubeVideoId } from './summary-presentation';
export type HistoryMode = 'none' | 'story' | 'documentary';
const normalize = (s: string) => s.normalize('NFKD').toLowerCase().replace(/[\u0300-\u036f\u064b-\u065f\u0670ـ]/g, '').replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي');
export function historyMode(query: string, context = ''): HistoryMode {
  const q = normalize(query);
  if (/وثا[ئي]قي|documentar/i.test(q)) return 'documentary';
  if (q.length < 100 && !/ملخص|مباراة|احصا|ترتيب|انتقال|تغريد|خبر|تدريب|match|standings|stats|transfer/i.test(q) && /يتوفر وثا[ئي]قي|وثا[ئي]قي.{0,80}(?:اذا رغبت|اذا اردت|ان رغبت|طلبت)/i.test(normalize(context)) && /^(?:ايه|نعم|ايوه|اجلبه|اجلب|جيبه|جيب|هات|ارسل|ابحث|اعرض|ابي|ابغى|yes|find|show|fetch|send)(?:\s|[.!؟?،]|$)/i.test(q.trim())) return 'documentary';
  if (/المباراة القادمة|موعد|جدول|انتقالات|احصائيات|نتيجة|تاريخ المباراة|تاريخ اليوم/i.test(q)) return 'none';
  return /تاريخ|قصة|حكاية|موسس|اسس|كيف بدات|من وضع.{0,30}قوانين|تطور.{0,35}(?:كرة القدم|قوانين|الخطط)|تاسيس|تاسس|نشاة|نشات|نشوء|اصل كرة القدم|اخترع|مخترع|اول.{0,25}(?:بطولة|كاس|دوري|نادي|مباراة|كرة القدم)|تاريخ.{0,40}(?:كرة|كاس|دوري|نادي|نادي|منتخب|الاتحاد|الهلال|النصر|الاهلي|برشلونة|ريال)|قصة.{0,30}(?:نادي|لاعب|بطولة|كرة)|football history|history of|origins? of|founded|invented/i.test(q) ? 'story' : 'none';
}
export const FOOTBALL_HISTORY_RULES = `
أسلوب الأسئلة التاريخية الكروية:
- ابدأ بجواب مباشر ومقدمة جذابة من جملتين كحد أقصى، ثم 3 إلى 6 نقاط قصيرة مرتبة زمنياً؛ اجعل كل نقطة محطة أو فكرة واحدة، وأبرز السنوات والأسماء المهمة فقط. اختم بأثر الحدث عند الحاجة. لا تحول الرد إلى مقال طويل أو بطاقة أو جدول أو تقرير إحصائي للاعب.
- تحقّق بالأدوات من السنوات والأسماء والوقائع في مصادر موثوقة، وفضّل الاتحاد أو النادي أو منظم البطولة والمراجع التاريخية المعروفة. افصل نشأة الألعاب القديمة عن تقنين كرة القدم الحديثة، وافصل المعلومة المثبتة عن الرواية المختلف عليها. لا تخترع تفاصيل لإكمال القصة. ضع روابط المصادر المستخدمة بإيجاز بعد السرد.
- لا ترفق وثائقياً أو رابط يوتيوب أو مشغلاً تلقائياً مع الجواب التاريخي. إذا تأكدت أثناء البحث من وجود وثائقي مناسب للموضوع، أخرج في نهاية الرد وسم تحقق داخلي واحداً: <aifball-documentary-offer title="عنوان الفيديو الفعلي" channel="اسم القناة الفعلي" url="رابط الفيديو المباشر" />. لا تطبع عبارة توفر الوثائقي بنفسك؛ المنصة تتحقق من بياناته ثم تعرض اقتراحاً نصياً فقط دون الرابط. إذا لم تجد وثائقياً مؤكداً، لا تزعم أنه يتوفر ولا تضف اقتراحاً افتراضياً. لا يشترط وجود وثائقي لكل سؤال.
`;
export const DOCUMENTARY_REQUEST_RULES = `
المستخدم يطلب البحث عن وثائقي كروي، أو يوافق على جلب الوثائقي المعروض في السياق:
- استخرج الموضوع من السؤال والسياق المرفق. لا تسأله عن الموضوع مرة أخرى إذا كان واضحاً. إذا غاب الموضوع والسياق فعلاً، اطلب تحديده.
- حاول البحث بالأدوات في يوتيوب والمصادر الرسمية والناشرين الموثوقين. فضّل وثائقياً مرتبطاً مباشرة بالموضوع، وبيّن لغته ومدته فقط إذا تحققتهما. لا تطبق قائمة قنوات ملخصات المباريات على الوثائقيات التاريخية.
- افتح المصدر المطابق وتحقق من عنوان الفيديو والناشر وصلته بالموضوع؛ لا تنشئ معرف فيديو ولا تنقل رابطاً من الذاكرة. أخرج مقطعاً واحداً موثقاً فقط بوسم <aifball-documentary title="عنوان الفيديو كما في يوتيوب" channel="اسم القناة كما في يوتيوب" url="رابط الفيديو المباشر" /> في سطر مستقل بعد وصف قصير لأهميته. لا تكرر رابط يوتيوب خاماً خارج الوسم.
- إذا تعذر العثور على رابط مطابق أو التحقق منه، قل ذلك بوضوح دون وعد بوجوده أو إرفاق مقطع عشوائي. منع التضمين لا يعني غياب الفيديو؛ المشاهدة على يوتيوب بديل مناسب.
`;
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const decode = (s: string) => s.replace(/&quot;/g, '"').replace(/&amp;/g, '&');
const comparable = (s: string) => normalize(s).replace(/[^\p{L}\p{N}]/gu, '');
/** Do not expose model-supplied video URLs until publisher metadata has been read. */
export async function presentHistoryAnswer(answer: string, mode: HistoryMode, signal?: AbortSignal, fetcher: typeof fetch = fetch): Promise<string> {
  const tags = [...answer.matchAll(/<aifball-documentary(?:-offer)?\b([^>]*?)\/?\s*>/gi)];
  let clean = answer.replace(/<aifball-documentary(?:-offer)?\b[^>]*\/?\s*>/gi, '')
    .replace(/\[[^\]]*\]\(https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)\/[^\s)]*\)/gi, '')
    .replace(/https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)\/[^\s<>]*/gi, '')
    .replace(/^.*يتوفر وثائقي[^\n]*$/gm, '').trim();
  for (const tag of tags.slice(0, 1)) {
    const attrs: Record<string, string> = {}; for (const a of tag[1].matchAll(/(\w+)\s*=\s*"([^"]*)"/g)) attrs[a[1]] = decode(a[2]);
    const id = youtubeVideoId(attrs.url || ''); if (!id || !attrs.title || !attrs.channel) continue;
    const c = new AbortController(), timer = setTimeout(() => c.abort(), 10000), abort = () => c.abort();
    signal?.addEventListener('abort', abort, { once: true }); if (signal?.aborted) abort();
    try {
      const r = await fetcher(`https://www.youtube.com/watch?v=${id}`, { signal: c.signal, cache: 'no-store' }); if (!r.ok) continue;
      const html = await r.text(); if (html.length > 4_000_000) continue;
      const p = pageJson(html, 'ytInitialPlayerResponse'), d = p.videoDetails, m = p.microformat?.playerMicroformatRenderer;
      const title = d?.title || '', channel = m?.ownerChannelName || d?.author || '';
      if (d?.videoId !== id || !/^UC[\w-]{22}$/.test(d.channelId || '') || !['OK', 'UNPLAYABLE'].includes(p.playabilityStatus?.status) || comparable(title) !== comparable(attrs.title) || comparable(channel) !== comparable(attrs.channel)) continue;
      if (mode === 'story') return clean + '\n\nيتوفر وثائقي عن هذا الموضوع على يوتيوب بعنوان «' + title + '» من ' + channel + '؛ أقدر أبحث لك عن رابط مشاهدته إذا رغبت.';
      return clean + '\n\n<aifball-documentary title="' + esc(title) + '" channel="' + esc(channel) + '" url="https://www.youtube.com/watch?v=' + id + '" verified="true" embed="' + String(p.playabilityStatus.playableInEmbed === true) + '" />';
    } catch { /* Failure to verify is not permission to invent or attach another video. */ }
    finally { clearTimeout(timer); signal?.removeEventListener('abort', abort); }
  }
  return mode === 'documentary' && tags.length ? clean + '\n\nتعذّر التحقق من رابط الوثائقي حاليًا، لذلك لم أرفق مقطعًا غير مؤكد.' : clean;
}
