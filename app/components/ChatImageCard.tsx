'use client';

import { useState } from 'react';

type Props = { url: string; alt?: string; isDark?: boolean };

/** Present an already-supplied image in chat; never searches for one. */
export default function ChatImageCard({ url, alt = 'صورة', isDark = true }: Props) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null;
  } catch { return null; }
  return (
    <figure className={`my-4 min-w-0 overflow-hidden rounded-2xl border p-2 ${isDark ? 'border-white/10 bg-black/20' : 'border-gray-200 bg-gray-50'}`}>
      <img
        src={url}
        alt={alt}
        loading="lazy"
        referrerPolicy="no-referrer"
        className="block h-auto max-h-[32rem] w-full rounded-xl object-contain"
        onError={() => setFailed(true)}
      />
    </figure>
  );
}
