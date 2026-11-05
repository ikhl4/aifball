'use client';

import { useState } from 'react';
import { youtubeVideoId } from '../../lib/summary-presentation';

type Props = {
  url: string;
  title?: string;
  channel?: string;
  isDark?: boolean;
  label?: string;
};

/** A link-first preview: never embeds an iframe that can fail inside chat. */
export default function YouTubePreviewCard({
  url, title, channel, isDark = true, label = 'ملخص المباراة بالفيديو',
}: Props) {
  const id = youtubeVideoId(url);
  const [thumbnailFailed, setThumbnailFailed] = useState(false);
  if (!id) return null;

  const watchUrl = `https://www.youtube.com/watch?v=${id}`;
  const image = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
  return (
    <div dir="rtl" className={`my-4 min-w-0 overflow-hidden rounded-2xl border ${isDark ? 'border-white/10 bg-black/65 text-gray-100' : 'border-gray-200 bg-white text-gray-900'}`}>
      <a
        href={watchUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={title ? `مشاهدة ${title} على يوتيوب` : 'مشاهدة الفيديو على يوتيوب'}
        className="group relative block aspect-video w-full overflow-hidden bg-slate-900"
      >
        {!thumbnailFailed && (
          <img
            src={image}
            alt={title || label}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            onError={() => setThumbnailFailed(true)}
          />
        )}
        <span className="absolute inset-0 flex items-center justify-center bg-black/15 transition-colors group-hover:bg-black/30">
          <span aria-hidden="true" className="flex h-14 w-16 items-center justify-center rounded-2xl bg-red-600 text-2xl text-white shadow-lg">▶</span>
        </span>
        <span className="absolute bottom-3 right-3 rounded-lg bg-black/75 px-3 py-1.5 text-xs font-semibold text-white">
          شاهد على يوتيوب
        </span>
      </a>
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 px-3 py-3 text-xs">
        <span className={`min-w-0 truncate ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
          {channel || title || label}
        </span>
        <a href={watchUrl} target="_blank" rel="noopener noreferrer" className="shrink-0 font-bold text-emerald-500 hover:underline">
          مشاهدة على يوتيوب ↗
        </a>
      </div>
    </div>
  );
}
