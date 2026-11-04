'use client';
import { useState } from 'react';
import { youtubeVideoId } from '../../lib/summary-presentation';
export default function DocumentaryVideo({ attrs }: { attrs: Record<string, string> }) {
  const [playing, setPlaying] = useState(false), id = youtubeVideoId(attrs.url || '');
  if (!id || attrs.verified !== 'true') return <p className="my-3 text-sm text-gray-500">تعذّر التحقق من رابط الوثائقي.</p>;
  return <section dir="rtl" aria-label="الوثائقي المطلوب" className="my-5">
    <h3 className="text-base font-bold text-emerald-500">{attrs.title}</h3>
    <p className="my-2 text-xs text-gray-500">{attrs.channel}</p>
    {playing && attrs.embed === 'true' && <iframe className="aspect-video w-full rounded-xl" title={attrs.title} src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />}
    <div className="mt-3 flex flex-wrap gap-3 text-sm font-semibold text-emerald-500">
      {!playing && attrs.embed === 'true' && <button type="button" onClick={() => setPlaying(true)}>تشغيل الوثائقي هنا</button>}
      <a href={`https://www.youtube.com/watch?v=${id}`} target="_blank" rel="noopener noreferrer">مشاهدة الوثائقي على يوتيوب ↗</a>
    </div>
  </section>;
}
