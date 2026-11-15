import { NextResponse } from 'next/server';
import { findHighlightVideo } from '../../../../lib/highlight-video';
import { teamMentioned } from '../../../../lib/single-match-highlights';

export const dynamic='force-dynamic';
export const maxDuration=45;

const leagues=[
 ['afc.champions','دوري أبطال آسيا للنخبة'],['ksa.1','دوري روشن السعودي'],
 ['uefa.champions','دوري أبطال أوروبا'],['eng.1','الدوري الإنجليزي الممتاز'],
 ['esp.1','الدوري الإسباني'],['ita.1','الدوري الإيطالي'],
 ['ger.1','الدوري الألماني'],['fra.1','الدوري الفرنسي'],
 ['uefa.nations','دوري الأمم الأوروبية'],['fifa.friendly','مباريات ودية دولية'],
] as const;
const day=(date:Date)=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Riyadh'}).format(date);
export async function POST(request:Request){
 let query='';
 try {const data=await request.json();query=typeof data.query==='string'?data.query.trim().slice(0,190):'';}
 catch {return NextResponse.json({status:'invalid'},{status:400});}
 if(!query || !/ملخص|هايلايت|highlights?/i.test(query))return NextResponse.json({status:'invalid'},{status:400});
 const controller=new AbortController();
 const timeout=setTimeout(()=>controller.abort(),39000);
 const abort=()=>controller.abort();
 request.signal.addEventListener('abort',abort,{once:true});
 try{
  const today=day(new Date());
  const explicit=query.match(/\\b(20\\d\\d-\\d\\d-\\d\\d)\\b/)?.[1];
  const latest=explicit||today;
  const currentMonth=new Date(latest.slice(0,7)+'-01T12:00:00Z');
  const monthKeys:string[]=[];
  // Search the last confirmed head-to-head, not an arbitrary 65-day window.
  // 18 months covers older rivalries; with an explicit date only check its month.
  const maxMonths=explicit?1:18;
  for(let i=0;i<maxMonths;i++){
    const d=new Date(currentMonth);
    d.setUTCMonth(d.getUTCMonth()-i);
    monthKeys.push(d.toISOString().slice(0,7).replace('-',''));
  }
  type Fixture={home:string;away:string;date:string;competition:string;started:string};
  const fixtures:Fixture[]=[];
  // Newest months first. Stop at the first month that contains a verified
  // finished meeting; avoid looking up a stale fixture when recent data exists.
  for(const month of monthKeys){
    if(controller.signal.aborted)break;
    const calls=await Promise.allSettled(leagues.map(async ([league,competition])=>{
      const r=await fetch('https://site.api.espn.com/apis/site/v2/sports/soccer/'+league+'/scoreboard?dates='+month,{
        signal:controller.signal,cache:'no-store'
      });
      if(!r.ok)throw Error('scoreboard');
      const data=await r.json();
      return (data.events||[]).flatMap((event:any)=>{
        if(!event.status?.type?.completed||!event.date)return [];
        const opponents=event.competitions?.[0]?.competitors||[];
        const names=opponents.map((o:any)=>o.team?.displayName||'').filter(Boolean);
        if(names.length!==2||!names.every((name:string)=>teamMentioned(query,name)))return [];
        const local=day(new Date(event.date));
        if(local>today || (explicit&&local!==explicit))return [];
        return [{home:names[0],away:names[1],date:local,competition,started:event.date}];
      }) as Fixture[];
    }));
    fixtures.push(...calls.flatMap(x=>x.status==='fulfilled'?x.value:[]));
    if(fixtures.length)break;
  }
  fixtures.sort((a,b)=>b.started.localeCompare(a.started));
  if(!fixtures.length)return NextResponse.json({status:'fixture_not_found'});
  const chosen=fixtures[0];
  const video=await findHighlightVideo({home:chosen.home,away:chosen.away,date:chosen.date,competition:chosen.competition},'',controller.signal);
  if(video.status!=='found')return NextResponse.json({status:video.status,fixture:{date:chosen.date,competition:chosen.competition}});
  return NextResponse.json({status:'found',video:{url:video.video.url,title:video.video.title,channel:video.video.channel,canEmbed:video.video.embeddable},fixture:{date:chosen.date,competition:chosen.competition}});
 }catch(error){
  console.warn('[AIFBALL_TYPED_HIGHLIGHTS]',error instanceof Error?error.name:'UNKNOWN');
  return NextResponse.json({status:'unavailable'},{status:503});
 }finally{clearTimeout(timeout);request.signal.removeEventListener('abort',abort);}
}
