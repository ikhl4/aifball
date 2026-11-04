'use client';

import React, { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    twttr?: {
      widgets?: {
        createTweet: (
          id: string,
          element: HTMLElement,
          options?: { theme?: 'dark' | 'light'; dnt?: boolean }
        ) => Promise<HTMLElement | undefined>;
      };
    };
  }
}

function tweetId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (!['x.com', 'www.x.com', 'twitter.com', 'www.twitter.com'].includes(parsed.hostname.toLowerCase())) return null;
    const match = parsed.pathname.match(/^\/[A-Za-z0-9_]{1,15}\/status\/(\d+)\/?$/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

export default function XPostEmbed({ url, playerName, isDark = true }: { url: string; playerName: string; isDark?: boolean }) {
  const id = tweetId(url);
  const target = useRef<HTMLDivElement>(null);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    if (!id || !target.current) {
      setUnavailable(true);
      return;
    }
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const renderTweet = () => {
      const widgets = window.twttr?.widgets;
      if (!widgets?.createTweet || !target.current) return false;
      target.current.replaceChildren();
      void widgets.createTweet(id, target.current, { theme: isDark ? 'dark' : 'light', dnt: true })
        .then(embed => { if (!cancelled && !embed) setUnavailable(true); })
        .catch(() => { if (!cancelled) setUnavailable(true); });
      return true;
    };
    if (renderTweet()) return () => { cancelled = true; };
    let script = document.querySelector<HTMLScriptElement>('script[src="https://platform.twitter.com/widgets.js"]');
    const onLoad = () => { if (!renderTweet() && !cancelled) setUnavailable(true); };
    if (!script) {
      script = document.createElement('script');
      script.src = 'https://platform.twitter.com/widgets.js';
      script.async = true;
      document.head.appendChild(script);
    }
    script.addEventListener('load', onLoad);
    timer = setTimeout(() => { if (!renderTweet() && !cancelled) setUnavailable(true); }, 8000);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      script?.removeEventListener('load', onLoad);
    };
  }, [id, isDark]);

  return (
    <section dir="rtl" aria-label={`مقطع أداء ${playerName} على X`} className={`my-4 rounded-2xl border p-4 ${isDark ? 'border-emerald-900/60 bg-[#091812] text-gray-100' : 'border-emerald-200 bg-white text-gray-900'}`}>
      <h3 className="mb-3 font-bold text-emerald-500">مقطع أداء {playerName} من X</h3>
      <div ref={target} className="flex justify-center" />
      {unavailable && <p className="my-2 text-sm opacity-75">تعذّر تحميل التضمين؛ افتح المنشور لمشاهدة المقطع.</p>}
      <a href={id ? `https://x.com/i/status/${id}` : 'https://x.com'} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm text-emerald-500 underline">فتح المقطع على X ↗</a>
    </section>
  );
}
