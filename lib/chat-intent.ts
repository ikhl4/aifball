// Conservative, dependency-free intent routing shared by the chat UI and preview tests.
// Ambiguous requests stay on the regular Dify route. Never infer facts here.
const dailyHighlights = /ملخصات|مباريات (?:اليوم|أمس|امس)|أبرز (?:المباريات|الملخصات)|(?:today|yesterday)(?:'s|s)? (?:matches|highlights)|highlights (?:today|yesterday)|ملخص (?:اليوم|أمس|امس)/i;
const videoWord = /ملخص|هايلايت|highlight(?:s)?/i;
const pairing = /(?:\bvs?\.?\b|\bversus\b|\bagainst\b|\bمباراة\b|\bضد\b|\bو\b|\s[×x]\s)/i;
const researchWords = /بحث|ابحث|فتش|مقارنة|قارِن|قارن|تحليل|حلل|وثائقي|تفصيلي|تقرير|أخبار|اخبار|آخر|اخر|حالي|جديد|اليوم|أمس|امس|انجازات|إحصائيات|احصائيات|مسيرة|انتقالات|سوق|صور|صورة|راتب|عقد|قيمة سوقية|إصابات|اصابات|research|analy[sz]e|compare|latest|news|recent|today|yesterday|report|career|statistics|stats|transfer|photo|injur|salary|contract|highlights?/i;

/** Only confident single-match VIDEO requests bypass the model. */
export function isNamedVideoHighlights(query: string): boolean {
  const q=query.trim();
  if(!q || !videoWord.test(q) || dailyHighlights.test(q)) return false;
  if(/(?:ملخص|summary) (?:موسم|بطولة|دوري|مسيرة|مباريات|season|league|career)/i.test(q)) return false;
  return pairing.test(q);
}

/** Long-running work keeps the resumable jobs workflow on signed-in accounts. */
export function needsDurableResearch(query:string):boolean {
  const q=query.trim();
  if(q.length>175) return true;
  return researchWords.test(q);
}
