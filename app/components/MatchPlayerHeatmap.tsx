'use client';

import { useEffect, useRef, useState } from 'react';
import { matchNameInArabic, matchNumberInArabic } from '../../lib/match-display-ar';
import { heatmapPlayer, type HeatmapMatch } from '../../lib/match-heatmap-source';
import { normalize365Report, type Scores365Report } from '../../lib/scores365-report';

type Lookup = { key: string; report?: Scores365Report; unavailable?: boolean; revision?: number };

export default function MatchPlayerHeatmap({ home, away, date, side, player, started, live }: HeatmapMatch & {
  side: 'home' | 'away';
  player: string;
  started: boolean;
  live: boolean;
}) {
  const [lookup, setLookup] = useState<Lookup>();
  const [failedImage, setFailedImage] = useState<string>();
  const [failedExport, setFailedExport] = useState<string>();
  const heatmap = useRef<HTMLImageElement>(null);
  const key = JSON.stringify([home, away, date]);
  useEffect(() => {
    if (!date || !started) return;
    const controller = new AbortController();
    async function load() {
      try {
        const resolution = await fetch('/api/match-heatmap-source?' + new URLSearchParams({ home, away, date }), { signal: controller.signal });
        if (!resolution.ok) throw new Error('Match resolution failed');
        const { matchUrl } = await resolution.json();
        if (!matchUrl) {
          if (!controller.signal.aborted) setLookup({ key });
          return;
        }
        const response = await fetch('/api/advanced?' + new URLSearchParams({ source: '365', action: 'analysis', matchUrl }), { signal: controller.signal });
        if (!response.ok) throw new Error('Provider report unavailable');
        const report = normalize365Report(await response.json(), matchUrl);
        if (!controller.signal.aborted) setLookup({ key, report, revision: live ? Date.now() : undefined });
      } catch {
        if (!controller.signal.aborted) setLookup({ key, unavailable: true });
      }
    }
    void load();
    const timer = live ? window.setInterval(load, 60000) : undefined;
    return () => { controller.abort(); window.clearInterval(timer); };
  }, [home, away, date, key, started, live]);

  const current = lookup?.key === key ? lookup : undefined;
  const mappedPlayer = current?.report && heatmapPlayer(current.report, { home, away, date }, side, player);
  const image = mappedPlayer && current?.report
    ? '/api/provider-heatmap?' + new URLSearchParams({ matchUrl: current.report.sourceUrl, playerId: mappedPlayer.id, ...(current.revision ? { updated: String(current.revision) } : {}) })
    : null;
  const touches = mappedPlayer && mappedPlayer.statistics.find(stat => /^اللمسات$/.test(stat.label))?.value;
  async function exportHeatmap() {
    const artwork = heatmap.current;
    if (!image || !current?.report || !artwork) return;
    setFailedExport(undefined);
    try {
      await artwork.decode();
      if (!artwork.naturalWidth || !artwork.naturalHeight) throw new Error();
      const canvas = document.createElement('canvas');
      canvas.width = 1600;
      canvas.height = 900;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error();
      const green = ctx.createLinearGradient(0, 0, 1600, 900);
      green.addColorStop(0, '#0c271e');
      green.addColorStop(1, '#18513b');
      ctx.fillStyle = green;
      ctx.fillRect(0, 0, 1600, 900);
      ctx.fillStyle = '#e2fbed';
      ctx.textAlign = 'center';
      ctx.direction = 'rtl';
      ctx.font = '800 48px Cairo, Tahoma, sans-serif';
      ctx.fillText(matchNameInArabic(player), 800, 110, 1350);
      ctx.font = '700 27px Cairo, Tahoma, sans-serif';
      ctx.fillText('الخريطة الحرارية · ' + matchNameInArabic(home) + ' × ' + matchNameInArabic(away), 800, 160, 1400);
      const scale = Math.min(1350 / artwork.naturalWidth, 572 / artwork.naturalHeight);
      const width = artwork.naturalWidth * scale;
      const height = artwork.naturalHeight * scale;
      ctx.drawImage(artwork, (1600-width)/2, 193+(572-height)/2, width, height);
      ctx.fillText('فوتبلاي', 800, 824, 1400);
      const blob = await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,'image/png'));
      if (!blob) throw new Error();
      const href = URL.createObjectURL(blob);
      const a = Object.assign(document.createElement('a'), {href,download:'aifball-player-heatmap.png'});
      document.body.append(a);
      a.click();
      a.remove();
      window.setTimeout(()=>URL.revokeObjectURL(href),1500);
    } catch { setFailedExport(image); }
  }

  return <section aria-label="الخريطة الحرارية" className="mt-5 rounded-xl border border-emerald-700/30 p-4">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h4 className="font-bold">الخريطة الحرارية</h4>
      {image && image !== failedImage && touches && <span className="text-xs opacity-75">{matchNumberInArabic(touches)} لمسة</span>}
    </div>
    {image && image !== failedImage ? <>
      {/* The same-origin image proxy validates match, player and format before serving the source image. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img key={image} ref={heatmap} src={image} alt={`خريطة حرارة ${matchNameInArabic(player)} في هذه المباراة`} className="mx-auto mt-3 max-h-[480px] w-full rounded-lg object-contain"
        onError={() => setFailedImage(image)}/>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <button type="button" onClick={()=>void exportHeatmap()} className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white">تنزيل الخريطة بالعرض</button>
      </div>
      {failedExport === image && <p role="alert" className="mt-2 text-xs text-amber-600">تعذر تجهيز صورة الخريطة.</p>}
    </> : <p role="status" className="mt-2 text-xs leading-6 opacity-75">
      {!started ? 'يمكن عرض الخريطة بعد بدء المباراة عند توفرها.'
        : !date ? 'وقت المباراة غير متاح للتحقق من الخريطة.'
        : !current ? 'جارٍ التحقق من خريطة اللاعب…'
        : current.unavailable || failedImage === image ? 'خريطة اللاعب غير متاحة حاليًا.'
        : 'لا توجد خريطة حرارية مؤكدة لهذا اللاعب في هذه المباراة.'}
    </p>}
  </section>;
}
