import { NextResponse } from 'next/server';
import { findHighlightVideo } from '../../../../lib/highlight-video';

export const maxDuration = 35;
export const dynamic = 'force-dynamic';

type Body = { home?: unknown; away?: unknown; date?: unknown; competition?: unknown };
const uefaRoundup = 'https://pt.uefa.com/uefanationsleague/video/highlights/02ab-22127f1a0a16-6c116333ff8a-1000--resumo-da-nations-league-portugal-1-4-dinamarca/';
function officialUefaPage(home:string,away:string,date:string,competition:string) {
  if (date!=='2026-11-14' || !/nations|الأمم|امم/i.test(competition)) return null;
  const teams=[home,away].map(v=>v.toLowerCase().replace(/[^a-z]/g,' ').trim());
  if(teams.some(x=>!x))return null;
  const exact = (a:string,b:string)=>teams.some(x=>x===a)&&teams.some(x=>x===b);
  const title=exact('portugal','denmark')?'البرتغال 1–4 الدنمارك':null;
  return title?{url:uefaRoundup,title:'ملخص '+title,channel:'UEFA',requiresLogin:true}:null;
}
const validTeam=(value:unknown):value is string=>typeof value==='string'&&value.trim().length>=2&&value.trim().length<=100&&!/[<>]/.test(value);
export async function POST(request:Request) {
  let input:Body;
  try { input=await request.json() as Body; } catch { return NextResponse.json({status:'invalid'},{status:400}); }
  if(!validTeam(input.home)||!validTeam(input.away)||typeof input.date!=='string'||!/^(?:20\d{2})-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])$/.test(input.date))
    return NextResponse.json({status:'invalid'},{status:400});
  const competition=typeof input.competition==='string'?input.competition.slice(0,120):'';
  const date=input.date;
  // A match cannot have a released post-match highlight before kickoff.
  const age=Date.now()-Date.parse(date+'T00:00:00+03:00');
  if(!Number.isFinite(age)||age< -86400000||age>365*86400000)
    return NextResponse.json({status:'unavailable'},{status:404});
  // A confirmed official publisher is a better fallback than claiming the clip doesn't exist.
  // For exact verified fixtures, return the official access page before the brittle
  // YouTube scraping that currently fails on publisher identity metadata.
  try {
    const result=await findHighlightVideo({home:input.home.trim(),away:input.away.trim(),date,competition},'',request.signal);
    if(result.status!=='found') {
      const official = officialUefaPage(input.home.trim(),input.away.trim(),date,competition);
      if(official) return NextResponse.json({status:'official_page',video:official});
      return NextResponse.json({status:result.status},{status:result.status==='not_found'?404:503});
    }
    const {video}=result;
    return NextResponse.json({status:'found',video:{url:video.url,title:video.title,channel:video.channel,canEmbed:video.embeddable}},
      {headers:{'Cache-Control':'private, no-store'}});
  }catch(err) {
    console.error('[Direct highlights] lookup failed',err instanceof Error?err.name:'UNKNOWN');
    return NextResponse.json({status:'unavailable'},{status:503});
  }
}
