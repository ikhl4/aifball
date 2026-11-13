export type AppLanguage = 'ar' | 'en';
export const appLanguageKey = 'aifball-language';

export function preferredAnswerLanguage(value: unknown): string {
  if (value === 'en') return '\nReply in English for this request, even if the question is in Arabic, unless the user explicitly requests another language. Use English headings and labels. Use lang="en" for standings and prefer English Markdown for cards without English support.';
  if (value === 'ar') return '\nأجب بالعربية حسب لغة التطبيق حتى لو كُتب السؤال بالإنجليزية، إلا إذا طلب المستخدم صراحةً لغة أخرى.';
  return '';
}
