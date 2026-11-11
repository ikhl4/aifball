import { COMPETITIONS } from './competitions';

type Match = { date: string; league: string; competition: string; home: string; away: string; homeScore: number; awayScore: number; id: string };
const norm = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[\u064b-\u065f]/g,'').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const aliases: Record<string,string[]> = {
  'الاتحاد':['al ittihad','al-ittihad','الاتحاد'], 'الهلال':['al hilal','al-hilal','الهلال'],
  'برشلونة':['barcelona','barca','barça','برشلونة'], 'ريال مدريد':['real madrid','ريال مدريد'],
  'النصر':['al nassr','al-nassr','النصر'], 'الأهلي':['al ahli','al-ahli','الأهلي'],
  'مانشستر سيتي':['manchester city','مانشستر سيتي'], 'ليفربول':['liverpool','ليفربول'],
  'أرسنال':['arsenal','ارسنال','أرسنال'], 'باريس سان جيرمان':['paris saint germain','psg','باريس سان جيرمان'],
  'بايرن ميونخ':['bayern munich','bayern münchen','بايرن ميونخ']
};
export function requestedTeam(query:string):string|null {
 const q=norm(query);
 if(!/(?:آخر|اخر|احدث|أحدث|last|latest)/i.test(query)||!/(?:مباراة|مباريات|لقاء|مواجهة|نتيجة|match|game|result)/i.test(query))return null;
 if(/(?:ملخص|تحليل|تشكيل|احصائيات|إحصائيات|فيديو|القادم|القادمة|next|highlights)/i.test(query))return null;
 const found=Object.entries(aliases).filter(([,names])=>names.some(n=>q.includes(norm(n))));
 if(found.length===1)return found[0][0];
 // Arbitrary team names are not silently guessed from conversational prose.
 return null;
}
const competitionsByTeam=(team:string):string[]=>{
 const sa=['الاتحاد','الهلال','النصر','الأهلي'];
 if(sa.includes(team))return ['ksa.1','afc.champions','ksa.kings.cup','afc.cup'];
 if(team==='برشلونة'||team==='ريال مدريد')return ['esp.1','uefa.champions','esp.copa_del_rey','uefa.europa'];
 if(team==='بايرن ميونخ')return ['ger.1','uefa.champions','ger.dfb_pokal'];
 if(team==='باريس سان جيرمان')return ['fra.1','uefa.champions','fra.coupe_de_france'];
 return ['eng.1','uefa.champions','uefa.europa','uefa.europa.conf','eng.fa','eng.league_cup'];
};
function extract(event:any,league:string,team:string):Match|null {
 const comp=event?.competitions?.[0], sides=comp?.competitors;
 if(!Array.isArray(sides)||sides.length!==2)return null;
 const status=comp?.status?.type||event?.status?.type;
 if(status?.completed!==true&&status?.state!=='post')return null;
 const home=sides.find((x:any)=>x.homeAway==='home'),away=sides.find((x:any)=>x.homeAway==='away');
 if(!home||!away)return null;
 const names=(x:any)=>[x.team?.displayName,x.team?.name,x.team?.shortDisplayName].filter(Boolean).map((n:string)=>norm(n));
 const wanted=aliases[team].map(norm);
 const matches=(x:any)=>names(x).some((n:string)=>wanted.some(w=>n===w||n.includes(w)||w.includes(n)));
 if(!matches(home)&&!matches(away))return null;
 const score=(x:any)=>Number(typeof x.score==='object'?x.score?.displayValue??x.score?.value:x.score);
 const hs=score(home),as=score(away),date=String(event?.date||'');
 if(!Number.isInteger(hs)||!Number.isInteger(as)||!Number.isFinite(Date.parse(date))||Date.parse(date)>Date.now())return null;
 return {date,league,competition:COMPETITIONS[league]?.ar||league,home:String(home.team?.displayName||''),away:String(away.team?.displayName||''),homeScore:hs,awayScore:as,id:String(event.id||'')};
}
export async function latestVerifiedMatch(team:string,signal?:AbortSignal):Promise<{match:Match|null;complete:boolean}> {
 const leagues=competitionsByTeam(team),end=new Date(),start=new Date(end.getTime()-35*86400000);
 const dates=start.toISOString().slice(0,10).replace(/-/g,'')+'-'+end.toISOString().slice(0,10).replace(/-/g,'');
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),9000);
 const abort=()=>controller.abort();signal?.addEventListener('abort',abort,{once:true});if(signal?.aborted)abort();
 try {
  const result=await Promise.allSettled(leagues.map(async league=>{
   const url='https://site.api.espn.com/apis/site/v2/sports/soccer/'+encodeURIComponent(league)+'/scoreboard?dates='+dates+'&limit=500';
   const response=await fetch(url,{signal:controller.signal,cache:'no-store'});
   if(!response.ok)throw Error('HTTP '+response.status);
   const data=await response.json();if(!Array.isArray(data.events))throw Error('INVALID_EVENTS');
   return data.events.map((e:any)=>extract(e,league,team)).filter((m:Match|null):m is Match=>m!==null);
  }));
  const complete=result.every(r=>r.status==='fulfilled');
  const matches=result.flatMap(r=>r.status==='fulfilled'?r.value:[]).sort((a,b)=>Date.parse(b.date)-Date.parse(a.date));
  return {match:matches[0]||null,complete};
 }catch{return {match:null,complete:false};}
 finally{clearTimeout(timer);signal?.removeEventListener('abort',abort);}
}
export function latestMatchText(team:string,m:Match):string {
 const day=new Intl.DateTimeFormat('ar-SA',{timeZone:'Asia/Riyadh',year:'numeric',month:'long',day:'numeric'}).format(new Date(m.date));
 return '**آخر مباراة مكتملة عُثر عليها — '+team+'**\n\n**'+m.home+' '+m.homeScore+' – '+m.awayScore+' '+m.away+'**\n\n**البطولة:** '+m.competition+'\n\n**التاريخ:** '+day+'\n\n**المصدر:** ESPN · نتيجة مكتملة ضمن البطولات التي تم فحصها.';
}
