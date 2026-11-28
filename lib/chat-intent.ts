/** Conservative prompt selection; this is a hint, never a player identity lookup. */
const shortPlayerNames: Record<string, string> = {
  'سورلوث': 'Alexander Sørloth', 'سورلوت': 'Alexander Sørloth',
  'sorloth': 'Alexander Sørloth', 'sørloth': 'Alexander Sørloth',
};
/** Explicit search spellings only; never fuzzy-match an arbitrary one-word topic. */
export function playerNameSearchHint(query: string): string | undefined {
  const key = query.normalize('NFKC').toLowerCase().replace(/[\u064B-\u065F\u0670\u0640]/g, '').trim();
  return Object.prototype.hasOwnProperty.call(shortPlayerNames, key) ? shortPlayerNames[key] : undefined;
}
/** These exact bare spellings were verified to match multiple provider athletes.
 * Do not extend this guard to names with a club/full-name qualifier or arbitrary names.
 */
export function ambiguousPlayerQuestion(query: string, options: { hasImage?: boolean; english?: boolean } = {}): string | undefined {
  if (options.hasImage) return;
  const key = query.normalize('NFKC').toLowerCase().replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/\s+/g, ' ').trim();
  if (!['خافي غيرا', 'خافي غويرا', 'javi guerra'].includes(key)) return;
  return options.english
    ? 'Do you mean Javi Guerra, the Valencia midfielder, or the retired Spanish striker?'
    : 'هل تقصد خافي غيرا لاعب وسط فالنسيا، أم خافي غيرا المهاجم الإسباني المعتزل؟';
}
export function playerPromptIntent(query: string, options: { conversationId?: string; hasImage?: boolean } = {}) {
  const q = query.normalize('NFKC').replace(/[\u064B-\u065F\u0670\u0640]/g, '').replace(/[؟?!.,،]/g, ' ').replace(/\s+/g, ' ').trim();
  const none = { playerCareer: false, nameOnlyPlayer: false };
  if (options.hasImage) return none;
  // These flows already have their own presentation and verification rules.
  if (/(?:مباراة|مباريات|المباراة|المباريات|ترتيب|الترتيب|جدول|الجدول|الدوري|دوري|تدريب|تدريبات|تمرين|تمارين|فانتازي|فنتازي|ملخص|ملخصات|هايلايت|أخبار|اخبار|تغريد|منشور|انتقالات|ميركاتو|قارن|مقارنة|تشكيل|تكتيك|تحليل|الضغط|دفاع|هجوم|استحواذ|لياقة|إحماء|احماء|\b(?:match|matches|standings|table|league|training|drill|drills|fantasy|highlights?|news|tweet|post|transfers?|compare|comparison|formation|tactics?)\b)/i.test(q)) return none;
  const explicit = /مسير|لاعب|بطاقة|بطاقه|راتب|عقد|سوقي|\b(?:career|player|profile|salary|contract)\b/i.test(q);
  const question = /^(?:متى|كيف|لماذا|وين|من|هل|كم|وش|ايش|ما|أين|اين|ابي|أبي|ابغى|أبغى|اعطني|أعطني|اكتب|اشرح|أشرح|وضح|عرّف|عرف|وشلون|where|when|how|who|what|why|can|is|show|give|tell)(?:\s|$)/i.test(q);
  const club = /(?:ريال مدريد|بايرن ميونخ|كريستال بالاس|توتنهام|إشبيلية|اشبيلية|فالنسيا|كومو|نابولي|الاتحاد|الهلال|النصر|الأهلي|الاهلي|برشلونة|برشلونه|منتخب|نادي|\b(?:real madrid|bayern munich|crystal palace|tottenham|sevilla|valencia|como|napoli|barcelona|club|fc|united|city)\b)/i.test(q);
  // Bare names are inferred only at the start of a conversation; short followups
  // such as «كم عمره» retain their existing conversation context.
  const bareName = !question && !club && (Boolean(playerNameSearchHint(q)) ||
    (!options.conversationId && /^[\p{L}\p{M}]+(?:[ \t]+[\p{L}\p{M}]+){1,3}$/u.test(q)));
  const statistics = /^(?:أرقام|ارقام|إحصائيات|احصائيات|stats|statistics)(?:\s|$)/i.test(q);
  return { playerCareer: explicit || (statistics && !club) || bareName, nameOnlyPlayer: bareName && !explicit && !statistics };
}

/** Fact-free lookup placeholder: safe to show before any paid model request. */
export function playerLookupSeed(query: string, options: { conversationId?: string; hasImage?: boolean } = {}, now = new Date()): string {
  if (ambiguousPlayerQuestion(query, options) || !playerPromptIntent(query, options).nameOnlyPlayer) return '';
  const escape = (value: string) => value.replace(/[&"<>]/g, c => ({ '&': '&amp;', '"': '&quot;', '<': '&lt;', '>': '&gt;' }[c] || c));
  const year = now.getUTCFullYear() - (now.getUTCMonth() < 6 ? 1 : 0);
  return `<aifball-player name="${escape(query.trim())}" current_season="${year}-${year + 1}" lookup_pending="true" />`;
}
