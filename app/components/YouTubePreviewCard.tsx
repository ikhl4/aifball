'use client';

import { useEffect, useRef, useState } from 'react';
import { youtubeVideoId } from '../../lib/summary-presentation';

type Props = {
  url: string;
  title?: string;
  channel?: string;
  isDark?: boolean;
  label?: string;
  /** false when the existing video lookup already knows embedding is blocked. */
  canEmbed?: boolean;
};

/**
 * Keep the previous in-chat video experience: click the thumbnail to play.
 * When YouTube rejects embedding, keep the card and offer its watch URL.
 * No fetching, searching, or selecting videos happens in this component.
 */
export default function YouTubePreviewCard({
  url, title, channel, isDark = true, label = 'ملخص المباراة بالفيديو', canEmbed,
}: Props) {
  const id = youtubeVideoId(url);
  const [playing, setPlaying] = useState(false);
  const [embedBlocked, setEmbedBlocked] = useState(false);
  const [thumbnailFailed, setThumbnailFailed] = useState(false);
  const frameRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    setPlaying(false);
    setEmbedBlocked(false);
    setThumbnailFailed(false);
  }, [id]);

  useEffect(() => {
    if (!playing || !id || canEmbed === false) return;

    const receive = (event: MessageEvent) => {
      if (event.origin !== 'https://www.youtube.com' && event.origin !== 'https://www.youtube-nocookie.com') return;
      if (event.source !== frameRef.current?.contentWindow) return;
      let data: { event?: string; info?: unknown };
      try { data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data; }
      catch { return; }
      if (!data || typeof data !== 'object') return;
      // Official YouTube IFrame Player API error codes, including videos
      // whose uploader has prohibited playback on third-party sites.
      if (data.event === 'onError' && [100, 101, 150, 153].includes(Number(data.info))) {
        setEmbedBlocked(true);
        setPlaying(false);
      }
    };

    window.addEventListener('message', receive);
    return () => window.removeEventListener('message', receive);
  }, [playing, id, canEmbed]);

  if (!id) return null;

  const watchUrl = `https://www.youtube.com/watch?v=${id}`;
  const image = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
  const blocked = canEmbed === false || embedBlocked;
  const tryPlaying = () => {
    if (blocked) window.open(watchUrl, '_blank', 'noopener,noreferrer');
    else setPlaying(true);
  };

  return (
    <div dir="rtl" className={`my-4 min-w-0 overflow-hidden rounded-2xl border ${isDark ? 'border-emerald-500/25 bg-black/70 text-gray-100' : 'border-emerald-600/20 bg-white text-gray-900'}`}>
      <div className={`flex flex-wrap items-center justify-between gap-2 px-3 py-3 text-xs ${isDark ? 'bg-emerald-950/40' : 'bg-emerald-50'}`}>
        <span className="font-bold text-emerald-500">🎥 مشاهدة الملخص المدمج</span>
        <a href={watchUrl} target="_blank" rel="noopener noreferrer" className={`font-semibold underline underline-offset-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
          فتح في تطبيق يوتيوب ↗
        </a>
      </div>

      <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
        {playing && !blocked ? (
          <iframe
            ref={frameRef}
            className="absolute inset-0 h-full w-full border-0"
            src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&enablejsapi=1&playsinline=1`}
            title={title || label}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
            onLoad={() => {
              // Register for YouTube's onError event. iframe onLoad alone
              // cannot tell whether playback is permitted.
              const frame = frameRef.current?.contentWindow;
              frame?.postMessage(JSON.stringify({ event: 'listening', id: 'aifball-video' }), 'https://www.youtube-nocookie.com');
              frame?.postMessage(JSON.stringify({ event: 'command', func: 'addEventListener', args: ['onError'] }), 'https://www.youtube-nocookie.com');
            }}
          />
        ) : (
          <button
            type="button"
            onClick={tryPlaying}
            className="group relative block h-full w-full overflow-hidden"
            aria-label={blocked ? 'فتح الفيديو في يوتيوب' : 'تشغيل الفيديو داخل المحادثة'}
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
            <span className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors group-hover:bg-black/35">
              <span aria-hidden="true" className="flex h-14 w-16 items-center justify-center rounded-2xl bg-red-600 text-2xl text-white shadow-lg">▶</span>
            </span>
            <span className="absolute bottom-3 right-3 rounded-lg bg-black/75 px-3 py-1.5 text-xs font-semibold text-white">
              {blocked ? 'شاهد على يوتيوب' : 'تشغيل داخل فوتبلاي'}
            </span>
          </button>
        )}
      </div>

      <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 px-3 py-3 text-xs">
        <span className={`min-w-0 truncate ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
          {channel || title || label}
        </span>
        <a href={watchUrl} target="_blank" rel="noopener noreferrer" className="shrink-0 font-bold text-emerald-500 hover:underline">
          {blocked ? 'مشاهدة في يوتيوب ↗' : 'فتح في يوتيوب ↗'}
        </a>
      </div>
    </div>
  );
}
