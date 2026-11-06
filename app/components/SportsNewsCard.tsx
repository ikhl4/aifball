'use client';

import SportsImageCard from './SportsImageCard';

type Props = { attrs: Record<string, string>; isDark?: boolean };
function verifiedUrl(value?: string) {
  if (!value) return '';
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : '';
  } catch { return ''; }
}

/** Metadata-driven official news presentation; never claims verification
 * merely because the text or a link mentions a player or an official account. */
export default function SportsNewsCard({ attrs, isDark = true }: Props) {
  const title = attrs.title?.trim();
  const source = verifiedUrl(attrs.source_url);
  const publisher = attrs.source_name?.trim();
  const date = /^\d{4}-\d{2}-\d{2}$/.test(attrs.date || '') ? attrs.date : '';
  // Confirmed status must be supplied by the trusted news verification step.
  const confirmed = attrs.verified === 'true' && Boolean(source && publisher && date);
  if (!title || !attrs.summary?.trim() || !source) return null;
  return <article dir="rtl" className={`my-4 min-w-0 overflow-hidden rounded-2xl border p-3 sm:p-4 ${isDark ? 'border-emerald-600/25 bg-[#101913] text-gray-100' : 'border-gray-200 bg-white text-gray-900'}`}>
    <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs">
      <span className="font-semibold text-emerald-500">{confirmed ? 'خبر رسمي موثق' : 'خبر رياضي · راجع المصدر'}</span>
      {date && <time dateTime={date} className="opacity-70">{date}</time>}
    </div>
    <h3 className="text-base font-extrabold leading-7 sm:text-lg">{title}</h3>
    <SportsImageCard src={attrs.image_url} alt={attrs.image_alt || title} sourceUrl={attrs.image_source_url} sourceName={attrs.image_source_name} license={attrs.image_license} isDark={isDark} />
    <p className="mt-2 whitespace-pre-line text-sm leading-7">{attrs.summary}</p>
    {attrs.highlights && <ul className="mt-3 list-inside list-disc space-y-1 text-sm leading-6">
      {attrs.highlights.split(';').map(s => s.trim()).filter(Boolean).slice(0, 6).map((s, i) => <li key={i}>{s}</li>)}
    </ul>}
    <a href={source} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-xs font-bold text-emerald-500 underline">{publisher || 'المصدر الأصلي'} ↗</a>
  </article>;
}
