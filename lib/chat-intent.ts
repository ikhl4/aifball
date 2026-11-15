// Conservative, dependency-free intent routing shared by the chat UI and preview tests.
// Ambiguous requests stay on the regular Dify route. Never infer facts here.
const dailyHighlights = /ملخصات|مباريات (?:اليوم|أمس|امس)|أبرز (?:المباريات|الملخصات)|(?:today|yesterday)(?:'s|s)? (?:matches|highlights)|highlights (?:today|yesterday)|ملخص (?:اليوم|أمس|امس)/i;
const videoWord = /ملخص|هايلايت|highlight(?:s)?/i;
const pairing = /(?:\sو[\u0600-\u06FF]+|(?:^|\s)و(?:\s|$)|\bvs?\.?\b|\bversus\b|\bagainst\b|مباراة|ضد|\s[×x]\s)/i;
const researchWords = /بحث|ابحث|فتش|مقارنة|قارِن|قارن|تحليل|حلل|وثائقي|تفصيلي|تقرير|أخبار|اخبار|انجازات|إحصائيات|احصائيات|مسيرة|انتقالات|سوق|صور|صورة|راتب|عقد|قيمة سوقية|إصابات|اصابات|research|analy[sz]e|compare|news|report|career|statistics|stats|transfer|photo|injur|salary|contract|highlights?/i;

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
  // Brief club-news requests should stream immediately, without the signed-in
  // job-creation/polling round-trip. Deep research still uses resumable jobs.
  const briefClubNews=/^(?:آخر|اخر|أحدث|احدث)?\s*(?:أخبار|اخبار|مستجدات)\s+(?:ال)?[\p{L}\p{M}\s-]{2,45}(?:\s+اليوم)?[؟?!.]*$/iu.test(q)
    || /^(?:latest|recent)\s+(?:news|updates)\s+(?:about|on|for|of)?\s*[a-z\s-]{2,45}[?!.]*$/i.test(q);
  if(briefClubNews) return false;
  return researchWords.test(q);
}
