'use client';

import { useEffect, useState } from 'react';

type Props = {
  src?: string;
  alt: string;
  sourceUrl?: string;
  sourceName?: string;
  license?: string;
  artist?: string;
  isDark?: boolean;
};

/** This component deliberately does not scrape social media or infer rights.
 * It only shows images with explicit reusable-license provenance. */
export default function SportsImageCard({ src, alt, sourceUrl, sourceName, license, artist, isDark = true }: Props) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  let image = '', source = '';
  try {
    if (src) {
      const url = new URL(src);
      if (url.protocol === 'https:' && !url.username && !url.password) image = url.href;
    }
    if (sourceUrl) {
      const url = new URL(sourceUrl);
      if (url.protocol === 'https:' && !url.username && !url.password) source = url.href;
    }
  } catch { return null; }

  const freelyLicensed = /^(?:CC0|CC BY(?:-SA)?(?: \d(?:\.\d)?)?|Public Domain)$/i.test((license || '').trim());
  // Linked source and explicit license must both exist; never infer that a
  // search engine thumbnail or a public social post is freely reusable.
  if (!image || !source || !alt.trim() || !freelyLicensed || failed) return null;
  return <figure dir="rtl" className={`my-3 overflow-hidden rounded-2xl border ${isDark ? 'border-emerald-500/20 bg-black/30' : 'border-gray-200 bg-gray-50'}`}>
    <img src={image} alt={alt} loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(true)} className="aspect-video w-full object-contain bg-black/20" />
    <figcaption className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-xs opacity-80">
      <span>{sourceName || 'مصدر الصورة'} · {artist ? `${artist} · ` : ''}<a href={/^CC BY-SA/i.test(license || '') ? `https://creativecommons.org/licenses/by-sa/${(license || '').match(/\d\.\d/)?.[0] || '4.0'}/` : /^CC BY/i.test(license || '') ? `https://creativecommons.org/licenses/by/${(license || '').match(/\d\.\d/)?.[0] || '4.0'}/` : source} target="_blank" rel="noopener noreferrer" className="underline">{license}</a></span>
      <a href={source} target="_blank" rel="noopener noreferrer" className="text-emerald-500 underline">المصدر ↗</a>
    </figcaption>
  </figure>;
}
