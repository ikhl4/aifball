import { NextResponse } from 'next/server';
import { findHighlightVideo } from '../../../../lib/highlight-video';
export const dynamic='force-dynamic';
export const maxDuration=35;
export async function GET(request:Request){
 if(process.env.VERCEL_ENV!=='preview')return NextResponse.json({error:'Not available'},{status:404});
 const result=await findHighlightVideo({home:'Portugal',away:'Denmark',date:'2026-11-14',competition:'دوري الأمم الأوروبية'},'',request.signal);
 return NextResponse.json(result.status==='found'?{status:'found',video:{url:result.video.url,title:result.video.title,channel:result.video.channel}}:{status:result.status});
}