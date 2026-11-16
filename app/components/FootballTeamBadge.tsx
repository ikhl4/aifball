'use client';

import { useState } from 'react';
import { officialClubBadge } from '../../lib/official-club-badges';

export default function FootballTeamBadge({ name, logo, size = 32 }: {
  name: string;
  logo?: string | null;
  size?: number;
}) {
  const [failed, setFailed] = useState<string>();
  const officialBadge = officialClubBadge(name);
  const imageUrl = officialBadge ?? logo;
  const initials = name.trim().split(/\s+/).slice(0, 2).map(part => Array.from(part)[0]).join('');
  return <span aria-hidden="true" className={`inline-grid shrink-0 place-items-center rounded-md border border-white/35 text-[10px] font-black ${officialBadge ? 'bg-emerald-950 text-white' : 'bg-emerald-100/90 text-emerald-900'}`}
    style={{ width: size, height: size }}>
    {imageUrl && failed !== imageUrl ? <img src={imageUrl} alt="" width={size-6} height={size-6}
      className="block object-contain" style={{width:size-6,height:size-6}} onError={()=>setFailed(imageUrl)} /> : initials || '—'}
  </span>;
}
