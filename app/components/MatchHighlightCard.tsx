'use client';
import { youtubeVideoId } from '../../lib/summary-presentation';
import YouTubePreviewCard from './YouTubePreviewCard';

export default function MatchHighlightCard({ attrs, isDark = true }: { attrs: Record<string, string>; isDark?: boolean }) {
  const id = youtubeVideoId(attrs.video_url || ''), verified = attrs.video_status === 'found';
  const goals = (attrs.goals || '').split(';').map(s => s.split('|')).filter(row => row[0]?.trim() && row[1]?.trim());
  const sources = (() => { try { const u = new URL(attrs.source_url); return u.protocol === 'https:' ? u.href : ''; } catch { return ''; } })();
  const hasVerifiedVideo = Boolean(id && verified);
  const video = hasVerifiedVideo ? (
    <YouTubePreviewCard
      url={attrs.video_url}
      title={attrs.video_title || (attrs.home && attrs.away ? `ملخص ${attrs.home} ضد ${attrs.away}` : 'ملخص المباراة')}
      channel={attrs.video_channel}
      isDark={isDark}
    />
  ) : null;
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
    {hasVerifiedVideo && <><h4 className="mt-6 text-base font-bold text-emerald-500">ملخص المباراة بالفيديو</h4>{video}</>}
  </section>;
}
