'use client';

import { useEffect, useRef, useState } from 'react';
import { youtubeVideoId } from '../../lib/summary-presentation';

interface Props {
  url: string;
  title?: string;
  channel?: string;
  isDark?: boolean;
  /** When false, the source explicitly reports that embedding is prohibited. */
  canEmbed?: boolean;
}

/**
 * UI only. Uses the exact video selected upstream without any search or
 * replacement. The thumbnail always remains available as a fallback.
 */
export default function ChatYouTubeCard({
  url,
  title = 'ملخص المباراة',
  channel,
  isDark = true,
  canEmbed,
}: Props) {
  const id = youtubeVideoId(url);
  const [playing, setPlaying] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const iframe = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    setPlaying(false);
    setBlocked(false);
    setImageFailed(false);
  }, [id]);

  useEffect(() => {
    if (!playing || !id) return;
    function onMessage(event: MessageEvent) {
      if (!['https://www.youtube.com', 'https://www.youtube-nocookie.com'].includes(event.origin)) return;
      if (event.source !== iframe.current?.contentWindow) return;
      let payload: { event?: string; info?: unknown };
      try {
        payload = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
      } catch { return; }
      // YouTube IFrame Player API errors: removed, embedding denied or
      // the player cannot be identified for playback in this context.
      if (payload?.event === 'onError' && [100, 101, 150, 153].includes(Number(payload.info))) {
        setBlocked(true);
        setPlaying(false);
      }
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [playing, id]);

  if (!id) return null;
  const youtubeUrl = `https://www.youtube.com/watch?v=${id}`;
  const cannotEmbed = canEmbed === false || blocked;

  return (
    <div dir="rtl" className={`my-4 w-full min-w-0 overflow-hidden rounded-2xl border shadow-lg ${isDark ? 'border-emerald-500/30 bg-[#131b17] text-gray-100' : 'border-emerald-600/20 bg-white text-gray-900'}`}>
      <div className={`flex flex-wrap items-center justify-between gap-2 border-b px-3 py-3 ${isDark ? 'border-emerald-500/20 bg-emerald-950/40' : 'border-emerald-100 bg-emerald-50'}`}>
        <span className="text-xs font-bold text-emerald-400">🎥 مشاهدة الملخص المدمج</span>
        <a href={youtubeUrl} target="_blank" rel="noopener noreferrer" className={`text-xs underline underline-offset-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          فتح في تطبيق يوتيوب ↗
        </a>
      </div>
      <div className="relative aspect-video w-full overflow-hidden bg-black">
        {playing && !cannotEmbed ? (
          <iframe
            ref={iframe}
            className="absolute inset-0 h-full w-full border-0"
            title={title}
            src={`https://www.youtube.com/embed/${id}?autoplay=1&rel=0&enablejsapi=1&playsinline=1`}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            onLoad={() => {
              const player = iframe.current?.contentWindow;
              // Listen for real YouTube playback errors; iframe onLoad alone
              // cannot determine whether a video is blocked by rights.
              player?.postMessage(JSON.stringify({ event: 'listening', id: 'aifball-player' }), 'https://www.youtube.com');
              player?.postMessage(JSON.stringify({ event: 'command', func: 'addEventListener', args: ['onError'] }), 'https://www.youtube.com');
            }}
          />
        ) : (
          <div className="relative h-full w-full">
            {!imageFailed && <img
              src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
              alt={title}
              loading="lazy"
              onError={() => setImageFailed(true)}
              className="absolute inset-0 h-full w-full object-cover"
            />}
            {cannotEmbed ? (
              <a href={youtubeUrl} target="_blank" rel="noopener noreferrer" className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/20 text-white" aria-label="فتح الملخص في يوتيوب">
                <span className="flex h-16 w-20 items-center justify-center rounded-2xl bg-red-600 text-3xl shadow-xl">▶</span>
                <span className="rounded-lg bg-black/75 px-3 py-2 text-xs font-bold">المشاهدة على يوتيوب</span>
              </a>
            ) : (
              <button type="button" onClick={() => setPlaying(true)} className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/15 text-white transition-colors hover:bg-black/30" aria-label="تشغيل الفيديو داخل المحادثة">
                <span className="flex h-16 w-20 items-center justify-center rounded-2xl bg-red-600 text-3xl shadow-xl">▶</span>
                <span className="rounded-lg bg-black/70 px-3 py-1.5 text-xs font-bold">تشغيل داخل المحادثة</span>
              </button>
            )}
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 px-3 py-3 text-xs">
        <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>{channel || title}</span>
        <a href={youtubeUrl} target="_blank" rel="noopener noreferrer" className="font-bold text-emerald-400">مشاهدة على يوتيوب ↗</a>
      </div>
    </div>
  );
}
