import { notFound } from 'next/navigation';
import MatchHighlightCard from '../../components/MatchHighlightCard';
import { findHighlightVideo, pageJson } from '../../../lib/highlight-video';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;
export default async function HighlightsPreview({searchParams}: {searchParams: {diagnostics?: string}}) {
  if (process.env.VERCEL_ENV === 'production') notFound();
  // Reproduce the user's reported match; video metadata is fetched live, never hardcoded.
  const match = { home: 'فياريال', away: 'باريس سان جيرمان', date: '2026-11-03', competition: 'دوري أبطال أوروبا' };
  const result = await findHighlightVideo(match);
  const diagnostics = searchParams.diagnostics === '1' ? await Promise.all(['https://www.youtube.com/@beinsports/videos', 'https://www.youtube.com/watch?v=UfH2Wnw_Kb8'].map(async url => {
    try { const r = await fetch(url, {cache:'no-store', signal: AbortSignal.timeout(8000)}); const s = await r.text(); let details:any={}; try {const p=pageJson(s,'ytInitialPlayerResponse');details={status:p.playabilityStatus,videoId:p.videoDetails?.videoId,owner:p.microformat?.playerMicroformatRenderer?.ownerProfileUrl};}catch{} try{const p=pageJson(s,'ytInitialData');details.channel=p.metadata?.channelMetadataRenderer;}catch{} return {url, status:r.status, title:s.match(/<title>([^<]*)/)?.[1], metadata:s.includes('ytInitialData'), player:s.includes('ytInitialPlayerResponse'), size:s.length,details}; } catch(e) {return {url,error:String(e)}}
  })) : null;
  const attrs: Record<string, string> = { ...match, match: 'فياريال ضد باريس سان جيرمان', home_score: '0', away_score: '6', order: 'video-last', summary: 'حسم باريس سان جيرمان المواجهة بسداسية نظيفة، بعد تقدمه بأربعة أهداف في الشوط الأول وإضافة هدفين بعد الاستراحة.', goals: 'جواو نيفيز|9;ديزيري دوي|12;سيني مايولو|13;فابيان رويز|17;فابيان رويز|50;ديفيد بولي|78', source_url: 'https://www.psg.fr/en/matches/mens-football/20262027/villarreal-vs-paris-2026-11-03', source_name: 'باريس سان جيرمان — صفحة المباراة الرسمية', video_status: result.status };
  if (result.status === 'found') Object.assign(attrs, { video_url: result.video.url, video_channel: result.video.channel, video_embed: String(result.video.embeddable) });
  return <main dir="rtl" className="min-h-screen bg-[#07110e] p-4 text-white"><div className="mx-auto max-w-2xl"><p className="py-3 text-sm text-emerald-400">فوتبلاي · اختبار إصلاح الملخص المرسل · التحقق من الفيديو مباشر</p>{diagnostics && <pre dir="ltr">{JSON.stringify(diagnostics,null,2)}</pre>}<MatchHighlightCard attrs={attrs} /><div className="rounded-2xl bg-gray-50 p-3"><MatchHighlightCard attrs={attrs} isDark={false} /></div></div></main>;
}
