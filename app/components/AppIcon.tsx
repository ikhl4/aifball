import React from 'react';
const paths:Record<string,React.ReactNode>={
 copy:<><rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></>,
 share:<><path d="M12 16V3m-5 5 5-5 5 5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/></>,
 like:<path d="M7 10H3v11h4m0-11 5-7a2 2 0 0 1 2 2l-1 5h5a3 3 0 0 1 3 3l-2 7a2 2 0 0 1-2 1H7V10Z"/>,
 dislike:<path d="M7 14H3V3h4m0 11 5 7a2 2 0 0 0 2-2l-1-5h5a3 3 0 0 0 3-3l-2-7a2 2 0 0 0-2-1H7v11Z"/>,
 volume:<><path d="m11 4-6 5H2v6h3l6 5V4Zm4 4a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/></>,
 stop:<rect x="5" y="5" width="14" height="14" rx="2"/>,more:<><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></>,
 refresh:<><path d="M20 7v5h-5M4 17v-5h5"/><path d="M6 6a8 8 0 0 1 13 3M5 15a8 8 0 0 0 13 3"/></>,
 trophy:<><path d="M7 3h10v5a5 5 0 0 1-10 0V3Zm0 2H3v2a4 4 0 0 0 4 4m10-6h4v2a4 4 0 0 1-4 4M12 13v5m-5 3h10m-8-3h6v3"/></>,
 pitch:<><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M12 4v16M2 9h4v6H2m20-6h-4v6h4"/><circle cx="12" cy="12" r="3"/></>,
 search:<><circle cx="10" cy="10" r="7"/><path d="m15 15 6 6"/></>,
 chart:<><path d="M4 3v17h17M8 15v-4m5 4V7m5 8V4"/></>,
 activity:<path d="M2 12h4l3-8 5 16 3-8h5"/>,
 clipboard:<><rect x="5" y="4" width="14" height="18" rx="2"/><rect x="9" y="2" width="6" height="4" rx="1"/><path d="M9 11h6m-6 5h6"/></>,
 briefcase:<><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M8 7V3h8v4M2 12a25 25 0 0 0 20 0M12 12v3"/></>,
 history:<><path d="M3 11a9 9 0 1 1 2 7M3 4v7h7m2-5v6l4 2"/></>,
 network:<><rect x="9" y="2" width="6" height="5" rx="1"/><rect x="2" y="17" width="6" height="5" rx="1"/><rect x="16" y="17" width="6" height="5" rx="1"/><path d="M12 7v5H5v5m7-5h7v5"/></>,
 globe:<><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/></>,
 target:<><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/></>,
 shield:<path d="m12 2 8 4v6c0 5-8 10-8 10S4 17 4 12V6l8-4Z"/>,
 cap:<><path d="m2 8 10-5 10 5-10 5L2 8Zm4 2v7q6 5 12 0v-7m4-2v9"/></>,
 menu:<path d="M4 6h16M4 12h16M4 18h16"/>,close:<path d="m6 6 12 12M6 18 18 6"/>,
 sun:<><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1"/></>,moon:<path d="M21 13A9 9 0 0 1 11 3a9 9 0 1 0 10 10Z"/>,clock:<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>
};
export type AppIconName=keyof typeof paths;
export default function AppIcon({name,size=20,className=''}:{name:AppIconName;size?:number;className?:string}){return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" className={`inline-block shrink-0 align-middle ${className}`}>{paths[name]||paths.pitch}</svg>;}
export function SportIconText({text}:{text:string}){return <>{text.split(/(🏆|🏟️?|⚽)/u).map((part,i)=>/^(🏆|🏟️?|⚽)$/u.test(part)?<span key={i} role="img" aria-label={part==='🏆'?'بطولة':'ملعب'}><AppIcon name={part==='🏆'?'trophy':'pitch'} size={18} className="mx-1"/></span>:<React.Fragment key={i}>{part}</React.Fragment>)}</>;}
