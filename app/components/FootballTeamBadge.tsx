'use client';

import { useState } from 'react';

export default function FootballTeamBadge({ name, logo, size = 32 }: {
  name: string;
  logo?: string | null;
  size?: number;
}) {
  const [failed, setFailed] = useState<string>();
  const initials = name.trim().split(/\s+/).slice(0, 2).map(part => Array.from(part)[0]).join('');
  return <span aria-hidden="true" className="inline-grid shrink-0 place-items-center rounded-full border border-emerald-500/25 bg-white/95 text-[10px] font-black text-emerald-900"
    style={{ width: size, height: size }}>
    {logo && failed !== logo ? <img src={logo} alt="" width={size-6} height={size-6}
      className="block object-contain" style={{width:size-6,height:size-6}} onError={()=>setFailed(logo)} /> : initials || '—'}
  </span>;
}
