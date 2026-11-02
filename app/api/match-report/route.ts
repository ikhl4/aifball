import { NextResponse } from 'next/server';
import { COMPETITIONS } from '../../../lib/competitions';
import { normalizeReport } from '../../../lib/match-report';
export const dynamic='force-dynamic';
export async function GET(request:Request){
 const p=new URL(request.url).searchParams,league=p.get('league')||'',event=p.get('event')||'',date=p.get('date')||'';
 const search=p.get('action')==='search';
 if(!Object.prototype.hasOwnProperty.call(COMPETITIONS,league)||(!search&&!/^\d{1,12}$/.test(event))||(search&&!/^\d{4}-\d{2}-\d{2}$/.test(date)))return NextResponse.json({error:'حدد البطولة ومعرّف المباراة، أو تاريخ البحث.'},{status:400});
 if(search){const d=new Date(date+'T00:00:00Z');if(!Number.isFinite(d.getTime())||d.toISOString().slice(0,10)!==date)return NextResponse.json({error:'التاريخ غير صالح.'},{status:400});}
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);const abort=()=>controller.abort();request.signal.addEventListener('abort',abort,{once:true});if(request.signal.aborted)controller.abort();
 try{
 const url=search?`https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/scoreboard?dates=${date.replace(/-/g,'')}`:`https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/summary?event=${event}`;
 const response=await fetch(url,{signal:controller.signal,cache:'no-store'});
 if(!response.ok)return NextResponse.json({error:'المصدر لم يوفر بيانات مؤكدة لهذا الطلب.'},{status:502});
 const raw=await response.json();
 if(search){if(!Array.isArray(raw.events))throw Error('INVALID_SEARCH');return NextResponse.json({source:'ESPN',league,date,matches:raw.events.filter((e:any)=>/^\d{1,12}$/.test(String(e.id))).map((e:any)=>({event:String(e.id),league,name:String(e.name||''),date:e.date||null}))});}
 return NextResponse.json(normalizeReport(raw,event,league),{headers:{'Cache-Control':'no-store'}});
 }catch{return NextResponse.json({error:'تعذر جلب تقرير مؤكد. أعد المحاولة؛ لن نعرض مباراة بديلة.'},{status:502});}
 finally{clearTimeout(timer);request.signal.removeEventListener('abort',abort);}
}
