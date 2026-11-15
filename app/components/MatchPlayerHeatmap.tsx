'use client';

import { useEffect, useState } from 'react';
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
  return <section aria-label="الخريطة الحرارية" className="mt-5 rounded-xl border border-emerald-700/30 p-4">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h4 className="font-bold">الخريطة الحرارية</h4>
      {image && image !== failedImage && touches && <span className="text-xs opacity-75">{matchNumberInArabic(touches)} لمسة</span>}
    </div>
    {image && image !== failedImage ? <>
      {/* The same-origin image proxy validates match, player and format before serving the source image. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img key={image} src={image} alt={`خريطة حرارة ${matchNameInArabic(player)} في هذه المباراة`} className="mt-3 w-full rounded-lg"
        onError={() => setFailedImage(image)}/>
      <p className="mt-2 text-xs opacity-75">أماكن نشاط اللاعب على الملعب · المصدر ٣٦٥ سكورز</p>
    </> : <p role="status" className="mt-2 text-xs leading-6 opacity-75">
      {!started ? 'تظهر الخريطة بعد بدء المباراة إذا أتاحها المصدر.'
        : !date ? 'وقت المباراة غير متاح للتحقق من الخريطة.'
        : !current ? 'جارٍ التحقق من خريطة اللاعب…'
        : current.unavailable || failedImage === image ? 'تعذر جلب خريطة اللاعب من المصدر.'
        : 'لا توجد خريطة حرارية مؤكدة لهذا اللاعب في هذه المباراة.'}
    </p>}
  </section>;
}
