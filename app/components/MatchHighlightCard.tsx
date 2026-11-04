'use client';
import { useState } from 'react';
import { youtubeVideoId } from '../../lib/summary-presentation';

export default function MatchHighlightCard({ attrs, isDark = true }: { attrs: Record<string, string>; isDark?: boolean }) {
  const [playing, setPlaying] = useState(false);
  const [thumbnailFailed, setThumbnailFailed] = useState(false);
  const id = youtubeVideoId(attrs.video_url || ''), verified = attrs.video_status === 'found';
  const goals = (attrs.goals || '').split(';').map(s => s.split('|')).filter(row => row[0]?.trim() && row[1]?.trim());
  const sources = (() => { try { const u = new URL(attrs.source_url); return u.protocol === 'https:' ? u.href : ''; } catch { return ''; } })();
  const video = <div className="mt-4">
    {id && (verified || !attrs.video_status) ? <div className={`overflow-hidden rounded-xl border ${isDark ? 'border-white/10 bg-black' : 'border-gray-200 bg-white'}`}>
      {playing && attrs.video_embed === 'true' ? <iframe className="aspect-video w-full" src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`} title={`ملخص ${attrs.match || ''}`} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen /> :
        <a className={`relative block ${thumbnailFailed ? 'min-h-32 bg-gradient-to-l from-emerald-950 to-slate-900' : 'aspect-video bg-black'}`} href={`https://www.youtube.com/watch?v=${id}`} target="_blank" rel="noopener noreferrer" aria-label="مشاهدة الملخص على يوتيوب">
          {!thumbnailFailed && <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt={`ملخص ${attrs.match || ''}`} className="h-full w-full object-cover" loading="lazy" onError={() => setThumbnailFailed(true)} />}
          <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/15"><span className="rounded-full bg-red-600 px-5 py-3 text-xl text-white">▶</span>{thumbnailFailed && <span className="text-sm font-bold text-white">مشاهدة ملخص المباراة على يوتيوب</span>}</span>
        </a>}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 text-xs">
        <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>{attrs.video_channel || 'القناة الرسمية'}</span>
        <div className="flex gap-3">
          {!playing && attrs.video_embed === 'true' && <button type="button" onClick={() => setPlaying(true)} className="font-bold text-emerald-500">تشغيل هنا</button>}
          <a href={`https://www.youtube.com/watch?v=${id}`} target="_blank" rel="noopener noreferrer" className="font-bold text-emerald-500">شاهد على يوتيوب ↗</a>
        </div>
      </div>
      {attrs.video_embed !== 'true' && <p className={`px-3 pb-3 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>المقطع متوفر؛ المشاهدة على يوتيوب حسب إعدادات القناة.</p>}
    </div> : <p className={`rounded-lg px-3 py-2 text-xs ${isDark ? 'bg-white/5 text-gray-400' : 'bg-gray-50 text-gray-500'}`}>
      {attrs.video_status === 'not_found' ? 'لم أعثر على مقطع مطابق ضمن القنوات المحددة وقت البحث.' : 'تعذّر التحقق من المقطع حاليًا؛ هذا لا يعني أنه غير منشور.'}
    </p>}
  </div>;
  const written = <div className="mt-4 space-y-5 text-[15px] leading-8">
    {attrs.summary && <div><h4 className="mb-1 text-base font-bold text-emerald-500">قصة المباراة</h4><p className="whitespace-pre-line">{attrs.summary}</p></div>}
    {!!goals.length && <div><h4 className="mb-2 text-base font-bold text-emerald-500">الأهداف</h4><ul className="list-inside list-disc space-y-1">{goals.map((row, i) => <li key={i}><span>{row[0].trim()}</span> — الدقيقة <bdi dir="ltr" className="font-semibold">{row[1].trim()}′</bdi></li>)}</ul></div>}
    {attrs.moments && <div><h4 className="mb-1 text-base font-bold text-emerald-500">أبرز الأحداث</h4><ul className="list-inside list-disc space-y-1">{attrs.moments.split(';').filter(Boolean).map((s, i) => <li key={i}>{s}</li>)}</ul></div>}
  </div>;
  return <section dir="rtl" aria-label="ملخص المباراة" className={`my-4 w-full min-w-0 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
    <h3 className="text-lg font-bold leading-8 text-emerald-500">{attrs.home && attrs.away ? <>{attrs.home} {/^\d+$/.test(attrs.home_score || '') && <bdi>{attrs.home_score}</bdi>} — {attrs.away} {/^\d+$/.test(attrs.away_score || '') && <bdi>{attrs.away_score}</bdi>}</> : attrs.match || 'ملخص المباراة'}</h3>
    <p className={`mt-1 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{attrs.competition}{attrs.date && <> · <bdi dir="ltr">{attrs.date}</bdi></>}</p>
    {written}
    {sources && <a href={sources} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-xs text-emerald-500 underline">{attrs.source_name || 'مصدر تفاصيل المباراة'} ↗</a>}
    <h4 className="mt-6 text-base font-bold text-emerald-500">ملخص المباراة بالفيديو</h4>
    {video}
  </section>;
}
