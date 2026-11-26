/** Conservative prompt selection; this is a hint, never a player identity lookup. */
export function playerPromptIntent(query: string, options: { conversationId?: string; hasImage?: boolean } = {}) {
  const q = query.normalize('NFKC').replace(/[\u064B-\u065F\u0670\u0640]/g, '').replace(/[؟?!.,،]/g, ' ').replace(/\s+/g, ' ').trim();
  const none = { playerCareer: false, nameOnlyPlayer: false };
  if (options.hasImage) return none;
  // These flows already have their own presentation and verification rules.
  if (/(?:مباراة|مباريات|المباراة|المباريات|ترتيب|الترتيب|جدول|الجدول|الدوري|دوري|تدريب|تدريبات|تمرين|تمارين|فانتازي|فنتازي|ملخص|ملخصات|هايلايت|أخبار|اخبار|تغريد|منشور|انتقالات|ميركاتو|قارن|مقارنة|تشكيل|تكتيك|تحليل|\b(?:match|matches|standings|table|league|training|drill|drills|fantasy|highlights?|news|tweet|post|transfers?|compare|comparison|formation|tactics?)\b)/i.test(q)) return none;
  const explicit = /مسير|لاعب|بطاق|راتب|عقد|سوقي|\b(?:career|player|profile|salary|contract)\b/i.test(q);
  const question = /^(?:متى|كيف|لماذا|وين|من|هل|كم|وش|ايش|ما|أين|اين|ابي|أبي|ابغى|أبغى|اعطني|أعطني|اكتب|وشلون|where|when|how|who|what|why|can|is|show|give|tell)(?:\s|$)/i.test(q);
  const club = /(?:ريال مدريد|بايرن ميونخ|كريستال بالاس|توتنهام|إشبيلية|اشبيلية|فالنسيا|كومو|نابولي|الاتحاد|الهلال|النصر|الأهلي|الاهلي|برشلونة|برشلونه|منتخب|نادي|\b(?:real madrid|bayern munich|crystal palace|tottenham|sevilla|valencia|como|napoli|barcelona|club|fc|united|city)\b)/i.test(q);
  // Bare names are inferred only at the start of a conversation; short followups
  // such as «كم عمره» retain their existing conversation context.
  const bareName = !options.conversationId && !question && !club && /^[\p{L}\p{M}]+(?:[ \t]+[\p{L}\p{M}]+){1,3}$/u.test(q);
  return { playerCareer: explicit || bareName, nameOnlyPlayer: bareName };
}
