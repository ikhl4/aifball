export type SummaryPresentationMode = 'date' | 'single' | 'none';

const SUMMARY_REQUEST = /\b(?:match\s+)?(?:highlights?|recaps?|summar(?:y|ies))\b|ملخص|هايلايت|أبرز اللقطات|أبرز أحداث المباراة/i;
const DATE_REQUEST = /(?:ملخصات?\s+(?:مباريات\s+)?(?:اليوم|(?:ال)?أمس|(?:ال)?امس)|(?:today|yesterday|tonight).{0,24}(?:highlights?|summar(?:y|ies))|(?:highlights?|summar(?:y|ies)).{0,24}(?:today|yesterday|tonight))/i;

export function summaryPresentationMode(query: string): SummaryPresentationMode {
  if (!SUMMARY_REQUEST.test(query)) return 'none';
  return DATE_REQUEST.test(query) ? 'date' : 'single';
}

export function youtubeVideoId(input: string): string | null {
  try {
    const url = new URL(input);
    const host = url.hostname.toLowerCase().replace(/^www\./, '');
    if (host === 'youtu.be') {
      const id = url.pathname.split('/').filter(Boolean)[0] || '';
      return /^[\w-]{11}$/.test(id) ? id : null;
    }
    if (host !== 'youtube.com' && host !== 'm.youtube.com' && host !== 'youtube-nocookie.com') return null;
    const segments = url.pathname.split('/').filter(Boolean);
    const id = url.pathname === '/watch'
      ? url.searchParams.get('v') || ''
      : ['embed', 'shorts', 'live'].includes(segments[0] || '')
        ? segments[1] || ''
        : '';
    return /^[\w-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}
