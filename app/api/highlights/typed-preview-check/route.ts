import { NextResponse } from 'next/server';
import { teamMentioned } from '../../../../lib/single-match-highlights';
export const dynamic='force-dynamic';
export async function GET() {
 if(process.env.VERCEL_ENV!=='preview')return NextResponse.json({error:'disabled'},{status:404});
 const q='ملخص مباراة الاتحاد والعين الاماراتي';
 const windows=['20260911-20261115','20260916-20261115','20261102'];
 return NextResponse.json(await Promise.all(windows.map(async dates=>{
   try{
     const r=await fetch('https://site.api.espn.com/apis/site/v2/sports/soccer/afc.champions/scoreboard?dates='+dates,{cache:'no-store',signal:AbortSignal.timeout(9000)});
     const d=await r.json();
     const games=(d.events||[]).map((e:any)=>({date:e.date,completed:e.status?.type?.completed,teams:(e.competitions?.[0]?.competitors||[]).map((c:any)=>({name:c.team?.displayName,matches:teamMentioned(q,c.team?.displayName||'')}))}));
     return {dates,status:r.status,count:games.length,matching:games.filter((g:any)=>g.teams.every((t:any)=>t.matches)).slice(0,5),sample:games.slice(0,2)};
   }catch(e){return {dates,error:e instanceof Error?e.message:'unknown'};}
 })));
}
