'use client';
import { useState } from 'react';
import { youtubeVideoId } from '../../lib/summary-presentation';

export default function MatchHighlightCard({ attrs, isDark = true }: { attrs: Record<string, string>; isDark?: boolean }) {
  const [playing, setPlaying] = useState(false);
  const id = youtubeVideoId(attrs.video_url || ''), verified = attrs.video_status === 'found';
  const goals = (attrs.goals || '').split(';').map(s => s.split('|')).filter(row => row[0]?.trim() && row[1]?.trim());
  const sources = (() => { try { const u = new URL(attrs.source_url); return u.protocol === 'https:' ? u.href : ''; } catch { return ''; } })();
  const video = <div className="mt-4">
    {id && (verified || !attrs.video_status) ? <div className={`overflow-hidden rounded-xl border ${isDark ? 'border-white/10 bg-black' : 'border-gray-200 bg-white'}`}>
      {playing && attrs.video_embed === 'true' ? <iframe className="aspect-video w-full" src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`} title={`ملخص ${attrs.match || ''}`} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen /> :
        <a className="relative block aspect-video bg-black" href={`https://www.youtube.com/watch?v=${id}`} target="_blank" rel="noopener noreferrer" aria-label="مشاهدة الملخص على يوتيوب">
          <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt={`ملخص ${attrs.match || ''}`} className="h-full w-full object-cover" loading="lazy" />
          <span className="absolute inset-0 grid place-items-center bg-black/15"><span className="rounded-full bg-red-600 px-5 py-3 text-xl text-white">▶</span></span>
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
  const written = <div className="mt-4 space-y-4">
    {attrs.summary && <div><h4 className="mb-1 text-xs font-bold text-emerald-500">خلاصة المباراة</h4><p className="whitespace-pre-line text-[15px] leading-7">{attrs.summary}</p></div>}
    {!!goals.length && <div><h4 className="mb-2 text-xs font-bold text-emerald-500">الأهداف</h4><ol className="space-y-1.5">{goals.map((row, i) => <li key={i} className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}><bdi dir="ltr" className="min-w-10 text-center font-bold text-emerald-500">{row[1].trim()}′</bdi><span>{row[0].trim()}</span></li>)}</ol></div>}
    {attrs.moments && <div><h4 className="mb-1 text-xs font-bold text-emerald-500">أبرز الأحداث</h4><ul className="list-inside list-disc space-y-1 text-sm leading-7">{attrs.moments.split(';').filter(Boolean).map((s, i) => <li key={i}>{s}</li>)}</ul></div>}
  </div>;
  return <section dir="rtl" aria-label="ملخص المباراة" className={`my-4 w-full overflow-hidden rounded-2xl border p-4 sm:p-5 ${isDark ? 'border-white/10 bg-[#101820] text-gray-200' : 'border-gray-200 bg-white text-gray-800'}`}>
    <div className="flex flex-wrap items-center justify-between gap-2 text-xs"><span className="font-bold text-emerald-500">ملخص المباراة</span><span>{attrs.competition}</span></div>
    {attrs.home && attrs.away ? <div className={`mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-xl p-3 ${isDark ? 'bg-white/5' : 'bg-emerald-50'}`}>
      <div className="text-center"><h3 className="text-sm font-bold">{attrs.home}</h3>{/^\d+$/.test(attrs.home_score || '') && <bdi className="mt-1 block text-2xl font-black">{attrs.home_score}</bdi>}</div>
      <span className="text-gray-500">—</span>
      <div className="text-center"><h3 className="text-sm font-bold">{attrs.away}</h3>{/^\d+$/.test(attrs.away_score || '') && <bdi className="mt-1 block text-2xl font-black">{attrs.away_score}</bdi>}</div>
    </div> : <h3 className="mt-3 text-base font-bold">{attrs.match}</h3>}
    {attrs.date && <p className="mt-2 text-center text-xs text-gray-500"><bdi dir="ltr">{attrs.date}</bdi></p>}
    {attrs.order === 'video-first' ? <>{video}{written}</> : <>{written}{video}</>}
    {sources && <a href={sources} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block text-xs text-emerald-500 underline">{attrs.source_name || 'مصدر تفاصيل المباراة'} ↗</a>}
  </section>;
}
