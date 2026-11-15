import { NextResponse } from 'next/server';
import { pageJson, youtubeSearchEntries, matchesTeams } from '../../../../lib/highlight-video';
export const dynamic='force-dynamic';
export async function GET() {
 if(process.env.VERCEL_ENV!=='preview')return NextResponse.json({error:'Not available'},{status:404});
 const match={home:'Portugal',away:'Denmark',date:'2026-11-14'};
 const q='beIN SPORTS Portugal Denmark highlights 2026';
 const r=await fetch('https://www.youtube.com/results?search_query='+encodeURIComponent(q),{cache:'no-store',signal:AbortSignal.timeout(9000)});
 if(!r.ok)return NextResponse.json({http:r.status});
 const entries=youtubeSearchEntries(pageJson(await r.text(),'ytInitialData'));
 return NextResponse.json({total:entries.length,entries:entries.filter(x=>matchesTeams(x.title,match)).slice(0,12).map(x=>({id:x.id,title:x.title.slice(0,125),channel:x.channelName,channelId:x.channelId,handle:x.handle,published:x.published}))});
}
