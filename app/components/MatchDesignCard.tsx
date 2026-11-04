'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type MatchRow = { group: string; home: string; away: string; value: string; detail: string; homeLogo: string; awayLogo: string };
type StyleMode = 'official' | 'creative';
type SizeMode = 'portrait' | 'square';
const W = 1080;

function imageUrl(value: string) {
  try {
    const u = new URL(value);
    return u.protocol === 'https:' ? u.href : '';
  } catch { return ''; }
}
function textFit(ctx: CanvasRenderingContext2D, value: string, maxWidth: number) {
  const raw = value.replace(/[<>]/g, '').slice(0, 130);
  if (ctx.measureText(raw).width <= maxWidth) return raw;
  let result = raw;
  while (result.length && ctx.measureText(result + '…').width > maxWidth) result = result.slice(0, -1);
  return result + '…';
}
function rounded(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius = 26) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
}
async function loadLogo(src: string): Promise<HTMLImageElement | null> {
  if (!src) return null;
  return new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}
function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, font: string, color: string, maxWidth: number) {
  ctx.font = font; ctx.textAlign = 'center'; ctx.fillStyle = color;
  ctx.fillText(textFit(ctx, text, maxWidth), x, y);
}
function safeRows(raw: string): MatchRow[] {
  return (raw || '').split(';').slice(0, 60).flatMap(line => {
    const [group='', home='', away='', value='', detail='', homeLogo='', awayLogo=''] = line.split('|').map(s => s.trim());
    return home && away ? [{group, home, away, value, detail, homeLogo: imageUrl(homeLogo), awayLogo: imageUrl(awayLogo)}] : [];
  });
}
export default function MatchDesignCard({ attrs }: { attrs: Record<string,string> }) {
  const rows = safeRows(attrs.rows || '');
  const canvas = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<StyleMode>('official');
  const [size, setSize] = useState<SizeMode>('portrait');
  const [rendered, setRendered] = useState(false);
  const [error, setError] = useState('');
  const isResults = attrs.kind === 'results';
  const title = attrs.kind === 'draw' ? 'قرعة البطولة' : isResults ? 'نتائج المباريات' : attrs.kind === 'match' ? 'يوم المباراة' : 'جدول المباريات';

  const paint = useCallback(async () => {
    const target = canvas.current;
    if (!target || !rows.length) return;
    setRendered(false); setError('');
    try {
      await document.fonts.ready;
      const rowHeight = 180;
      const minHeight = size === 'square' ? 1080 : 1350;
      const height = Math.max(minHeight, 440 + rows.length * rowHeight + 180);
      target.width = W; target.height = height;
      const ctx = target.getContext('2d');
      if (!ctx) throw new Error('تعذّر تجهيز التصميم.');
      const gradient = ctx.createLinearGradient(0, 0, W, height);
      if (mode === 'creative') {
        gradient.addColorStop(0, '#011c18'); gradient.addColorStop(0.5, '#064e3b'); gradient.addColorStop(1, '#050c18');
      } else {
        gradient.addColorStop(0, '#0a1412'); gradient.addColorStop(1, '#07100e');
      }
      ctx.fillStyle = gradient; ctx.fillRect(0, 0, W, height);
      if (mode === 'creative') {
        ctx.save(); ctx.globalAlpha = 0.15; ctx.strokeStyle = '#7ee6b1'; ctx.lineWidth = 4;
        for (let i = -height; i < W + height; i += 78) {
          ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + height, height); ctx.stroke();
        }
        ctx.restore();
        const glow = ctx.createRadialGradient(890, 260, 30, 890, 260, 650);
        glow.addColorStop(0, '#16a34a66'); glow.addColorStop(1, '#16a34a00');
        ctx.fillStyle = glow; ctx.fillRect(0, 0, W, 900);
      }
      ctx.fillStyle = '#34d399'; ctx.fillRect(72, 94, 104, 10);
      label(ctx, 'AiFBall  |  فوتبلاي', 540, 137, 'bold 35px Cairo, sans-serif', '#8ff0be', 850);
      label(ctx, title, 540, 240, '900 78px Cairo, sans-serif', '#fff', 910);
      label(ctx, attrs.competition || 'كرة القدم', 540, 302, 'bold 35px Cairo, sans-serif', '#b6d1c7', 900);
      if (attrs.subtitle) label(ctx, attrs.subtitle, 540, 364, '30px Cairo, sans-serif', '#fde68a', 900);
      const urls = [...new Set(rows.flatMap(r => [r.homeLogo, r.awayLogo]).filter(Boolean))];
      const loaded = await Promise.all(urls.map(async url => [url, await loadLogo(url)] as const));
      const logos = new Map<string, HTMLImageElement | null>(loaded);
      const drawLogo = (url: string, name: string, x: number, y: number) => {
        const img = logos.get(url);
        if (img) {
          const ratio = Math.min(1, 92 / img.naturalWidth, 92 / img.naturalHeight);
          const width = img.naturalWidth * ratio; const height = img.naturalHeight * ratio;
          ctx.drawImage(img, x - width / 2, y - height / 2, width, height);
        } else {
          ctx.fillStyle = '#164c39'; rounded(ctx, x-42, y-42, 84, 84, 22); ctx.fill();
          label(ctx, name.slice(0, 2), x, y+12, 'bold 32px Cairo, sans-serif', '#c2ffe4', 70);
        }
      };
      rows.forEach((r, i) => {
        const y = 414 + i * rowHeight;
        ctx.fillStyle = mode === 'creative' ? '#03251fdd' : '#14221eee';
        rounded(ctx, 60, y, 960, 158, 30); ctx.fill();
        ctx.strokeStyle = mode === 'creative' ? '#34d39988' : '#ffffff20';
        ctx.lineWidth = 2; ctx.stroke();
        if (r.group) label(ctx, r.group, 540, y+29, 'bold 23px Cairo, sans-serif', '#a7f3d0', 900);
        drawLogo(r.homeLogo, r.home, 228, y+82);
        drawLogo(r.awayLogo, r.away, 852, y+82);
        label(ctx, r.home, 228, y+144, 'bold 27px Cairo, sans-serif', '#fff', 250);
        label(ctx, r.away, 852, y+144, 'bold 27px Cairo, sans-serif', '#fff', 250);
        label(ctx, r.value || 'ضد', 540, y+99, '900 53px Cairo, sans-serif', '#f5fbf8', 270);
        if (r.detail) label(ctx, r.detail, 540, y+137, '22px Cairo, sans-serif', '#c4d5cd', 278);
      });
      ctx.fillStyle = '#34d399'; ctx.fillRect(68, height-94, 944, 2);
      label(ctx, 'تصميم فوتبلاي  •  البيانات بحسب المعلومات المتاحة', 540, height-45, '25px Cairo, sans-serif', '#cbd5d1', 880);
      setRendered(true);
    } catch (e) { setError(e instanceof Error ? e.message : 'تعذّر إنشاء الصورة.'); }
  }, [attrs.competition, attrs.subtitle, mode, rows.length, attrs.rows, size, title]);

  useEffect(() => { void paint(); }, [paint]);
  const download = () => {
    if (!rendered || !canvas.current) return;
    try {
      const a = document.createElement('a');
      a.download = 'aifball-match-design.png';
      a.href = canvas.current.toDataURL('image/png');
      a.click();
    } catch { setError('تعذّر تصدير الشعارات من مصدرها. حاول مجددًا أو استخدم شعارات من مصدر يسمح بالتصدير.'); }
  };
  if (!rows.length) return <p dir="rtl" className="my-3 text-sm text-amber-500">لا توجد مواجهات موثقة يمكن تصميمها.</p>;
  return <section dir="rtl" className="my-4 w-full overflow-hidden rounded-2xl border border-emerald-500/30 bg-[#0b1513] p-3 text-white font-cairo sm:p-4" aria-label="تصميم كروي قابل للتنزيل">
    <h3 className="mb-3 text-base font-bold">تصميم فوتبلاي — {title}</h3>
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <button type="button" aria-pressed={mode === 'official'} onClick={() => setMode('official')} className={`rounded-lg px-3 py-2 text-xs font-bold ${mode === 'official' ? 'bg-emerald-600 text-white' : 'bg-white/10'}`}>قالب رسمي</button>
      <button type="button" aria-pressed={mode === 'creative'} onClick={() => setMode('creative')} className={`rounded-lg px-3 py-2 text-xs font-bold ${mode === 'creative' ? 'bg-emerald-600 text-white' : 'bg-white/10'}`}>تصميم إبداعي</button>
      <select aria-label="مقاس الصورة" value={size} onChange={e => setSize(e.target.value as SizeMode)} className="rounded-lg border border-white/20 bg-[#14221e] px-3 py-2 text-xs">
        <option value="portrait">عمودي 4:5</option><option value="square">مربع 1:1</option>
      </select>
    </div>
    <canvas ref={canvas} role="img" aria-label={`تصميم ${title}، ${rows.length} مباراة`} className="mx-auto h-auto max-h-[700px] w-full rounded-xl object-contain" />
    {rows.length > 5 && <p className="mt-2 text-xs text-amber-200">للحفاظ على وضوح جميع المباريات، يصبح ارتفاع الصورة أكبر من المقاس المختار.</p>}
    {error && <p role="alert" className="mt-2 text-xs text-red-300">{error}</p>}
    <button type="button" disabled={!rendered} onClick={download} className="mt-3 w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-extrabold text-white disabled:opacity-50">حفظ الصورة PNG</button>
    <p className="mt-2 text-[11px] text-gray-400">النتائج والمواعيد تُعرض فقط إذا كانت متاحة في بيانات الطلب. الخلفية الإبداعية مرسومة آليًا، وليست صورة مولدة بنموذج ذكاء اصطناعي.</p>
  </section>;
}
