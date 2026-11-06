'use client';

import { useEffect, useRef, useState } from 'react';
import { youtubeVideoId } from '../../lib/summary-presentation';

type Props = {
  url: string;
  title?: string;
  channel?: string;
  isDark?: boolean;
  /** Only an explicit false from verified metadata disables inline playback. */
  canEmbed?: boolean;
};

/** Presentation only. Never fetches or chooses a different video. */
export default function ChatVideoCard({
  url, title = 'ملخص المباراة', channel, isDark = true, canEmbed,
}: Props) {
  const id = youtubeVideoId(url);
  const [playing, setPlaying] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [thumbnailFailed, setThumbnailFailed] = useState(false);
  const playerRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    setPlaying(false);
    setBlocked(false);
    setThumbnailFailed(false);
  }, [id]);

  useEffect(() => {
    if (!playing || !id) return;
    const handlePlayerMessage = (event: MessageEvent) => {
      if (!['https://www.youtube.com', 'https://www.youtube-nocookie.com'].includes(event.origin)) return;
      if (event.source !== playerRef.current?.contentWindow) return;
      let data: { event?: string; info?: unknown };
      try { data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data; }
      catch { return; }
      if (data?.event === 'onError' && [100, 101, 150, 153].includes(Number(data.info))) {
        setBlocked(true);
        setPlaying(false);
      }
    };
    window.addEventListener('message', handlePlayerMessage);
    return () => window.removeEventListener('message', handlePlayerMessage);
  }, [playing, id]);

  if (!id) return null;
  const watch = `https://www.youtube.com/watch?v=${id}`;
  // Search metadata may not establish embed permission. Try the official player first;
  // only a player error confirms that the viewer must use YouTube.
  const restricted = blocked;

  return (
    <section dir="rtl" className={`my-4 w-full min-w-0 overflow-hidden rounded-2xl border ${isDark ? 'border-emerald-500/30 bg-[#131b17] text-gray-100' : 'border-emerald-600/25 bg-white text-gray-900'}`}>
      <div className={`flex flex-wrap items-center justify-between gap-2 border-b px-3 py-3 text-xs ${isDark ? 'border-emerald-500/20 bg-emerald-950/35' : 'border-emerald-600/15 bg-emerald-50'}`}>
        <span className="font-bold text-emerald-400">🎥 مشاهدة الملخص المدمج</span>
        <a href={watch} target="_blank" rel="noopener noreferrer" className={`underline underline-offset-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
          فتح في تطبيق يوتيوب ↗
        </a>
      </div>

      <div className="relative aspect-video w-full overflow-hidden bg-black">
        {playing && !restricted ? (
          <iframe
            ref={playerRef}
            className="absolute inset-0 h-full w-full border-0"
            src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}`}
            title={title}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            onLoad={() => {
              // iframe load means only that a YouTube page loaded, not that
              // playback works. The official player API reports restrictions.
              const win = playerRef.current?.contentWindow;
              win?.postMessage(JSON.stringify({ event: 'listening', id: 'aifball-video' }), 'https://www.youtube-nocookie.com');
              win?.postMessage(JSON.stringify({ event: 'command', func: 'addEventListener', args: ['onError'] }), 'https://www.youtube.com');
            }}
          />
        ) : (
          <div className="relative h-full w-full">
            {!thumbnailFailed && (
              <img
                src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
                alt={title}
                className="absolute inset-0 h-full w-full object-cover"
                loading="lazy"
                onError={() => setThumbnailFailed(true)}
              />
            )}
            {restricted ? (
              <a href={watch} target="_blank" rel="noopener noreferrer" aria-label="مشاهدة الملخص على يوتيوب" className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/15 text-white">
                <span aria-hidden="true" className="flex h-14 w-16 items-center justify-center rounded-2xl bg-red-600 text-2xl shadow-lg">▶</span>
                <span className="rounded-lg bg-black/75 px-3 py-1.5 text-xs font-semibold">المشاهدة على يوتيوب</span>
              </a>
            ) : (
              <button type="button" onClick={() => setPlaying(true)} aria-label="تشغيل الفيديو داخل المحادثة" className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/15 text-white transition-colors hover:bg-black/30">
                <span aria-hidden="true" className="flex h-14 w-16 items-center justify-center rounded-2xl bg-red-600 text-2xl shadow-lg">▶</span>
                <span className="rounded-lg bg-black/75 px-3 py-1.5 text-xs font-semibold">تشغيل داخل المحادثة</span>
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 px-3 py-3 text-xs">
        <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>{channel || title}</span>
        <a href={watch} target="_blank" rel="noopener noreferrer" className="font-bold text-emerald-400">مشاهدة على يوتيوب ↗</a>
      </div>
    </section>
  );
}
