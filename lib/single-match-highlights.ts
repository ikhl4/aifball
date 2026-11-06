import { findHighlightVideo } from './highlight-video';
import { footballNameInArabic } from './football-names-ar';
import { isDailyHighlightsRequest } from './daily-match-highlights';
const leagues = [['eng.1','الدوري الإنجليزي الممتاز'],['esp.1','الدوري الإسباني'],['ita.1','الدوري الإيطالي'],['ger.1','الدوري الألماني'],['fra.1','الدوري الفرنسي'],['ksa.1','دوري روشن السعودي'],['uefa.champions','دوري أبطال أوروبا'],['uefa.europa','الدوري الأوروبي'],['uefa.europa.conf','دوري المؤتمر الأوروبي'],['afc.champions','دوري أبطال آسيا للنخبة'],['usa.1','الدوري الأمريكي']];
const norm = (s: string) => s.normalize('NFKD').toLowerCase().replace(/[\u0300-\u036f\u064b-\u065f\u0670ـ]/g,'').replace(/[أإآ]/g,'ا').replace(/ى/g,'ي').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const esc = (s: string) => s.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
export function teamMentioned(query: string, name: string): boolean {
 const q = ' '+norm(query)+' ', names = [name, footballNameInArabic(name) || name].map(norm);
 if(names.includes('paris saint germain'))names.push('باريس','psg');
 return names.some(n=>n.length>=3&&(q.includes(' '+n+' ')||q.includes(' و'+n+' ')));
}
export function summaryDateRange(query: string, now = new Date()): [string,string] {
 const today = new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Riyadh'}).format(now), q=norm(query);
 const explicit = query.match(/\b(\d{4}-\d{2}-\d{2})\b/)?.[1];
 if(explicit && !Number.isNaN(Date.parse(explicit)))return [explicit,explicit];
 const end = new Date(today+'T12:00:00Z');
 if(/الامس|امس|yesterday/.test(q))end.setUTCDate(end.getUTCDate()-1);
 const last=end.toISOString().slice(0,10), start=new Date(end);
 if(!/الامس|امس|yesterday|اليوم|today/.test(q))start.setUTCDate(start.getUTCDate()-60);
 return [start.toISOString().slice(0,10),last];
}
/** Use source fixtures for an unambiguous named match even when search indexing misses it. */
export async function buildSingleMatchHighlights(query: string, signal?: AbortSignal, fetcher: typeof fetch = fetch, lookup = findHighlightVideo, now = new Date()): Promise<string|null> {
 if(isDailyHighlightsRequest(query))return null;
 const [start,end]=summaryDateRange(query,now);
 const controller = new AbortController(), timer=setTimeout(()=>controller.abort(),45000), abort=()=>controller.abort();
 signal?.addEventListener('abort',abort,{once:true});if(signal?.aborted)abort();
 const get=async(url:string)=>{const r=await fetcher(url,{signal:controller.signal,cache:'no-store'});if(!r.ok)throw Error('SOURCE');return r.json();};
 let selected:any;
 try {
  // Without an explicit date, search backwards from the latest completed
  // fixture in successive 60-day windows, rather than assuming the last
  // meeting occurred in the previous two weeks.
  const explicitDate = start===end || /الامس|امس|yesterday|اليوم|today/.test(norm(query));
  const latest = new Date(end+'T12:00:00Z');
  const candidates:any[]=[];
  const rounds=explicitDate?1:12; // Up to about two years for old rivalries.
  for(let round=0;round<rounds;round++){
   const windowEnd=explicitDate?end:new Date(latest.getTime()-round*60*86400000).toISOString().slice(0,10);
   const windowStart=explicitDate?start:new Date(latest.getTime()-(round+1)*60*86400000).toISOString().slice(0,10);
   const windowDates=windowStart===windowEnd?windowStart.replace(/-/g,''):windowStart.replace(/-/g,'')+'-'+windowEnd.replace(/-/g,'');
   const results=await Promise.allSettled(leagues.map(async ([league,competition])=>({league,competition,raw:await get(`https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/scoreboard?dates=${windowDates}`)})));
   for(const r of results){if(r.status!=='fulfilled')continue;for(const event of r.value.raw.events||[]){
    const c=event.competitions?.[0], home=c?.competitors?.find((t:any)=>t.homeAway==='home'),away=c?.competitors?.find((t:any)=>t.homeAway==='away');
    if(!event.status?.type?.completed||!/^\d{1,12}$/.test(event.id)||!home?.team?.displayName||!away?.team?.displayName||!/^\d+$/.test(String(home.score))||!/^\\d+$/.test(String(away.score)))continue;
    const date=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Riyadh'}).format(new Date(event.date));if(date<windowStart||date>windowEnd)continue;
    if(teamMentioned(query,home.team.displayName)&&teamMentioned(query,away.team.displayName))candidates.push({event,home,away,date,league:r.value.league,competition:r.value.competition});
   }}
   if(candidates.length)break;
  }
  candidates.sort((a,b)=>Date.parse(b.event.date)-Date.parse(a.event.date));
  if(!candidates.length)return null;
  // Distinct pairings in one question are not silently collapsed into one match.
  if(new Set(candidates.map(c=>[c.home.team.displayName,c.away.team.displayName].sort().join('|'))).size!==1)return null;
  selected=candidates[0];
  try{selected.details=await get(`https://site.api.espn.com/apis/site/v2/sports/soccer/${selected.league}/summary?event=${selected.event.id}`);}catch{}
 } finally {clearTimeout(timer);signal?.removeEventListener('abort',abort);}
 if(!selected)return null;
 const {home,away,date,event,competition}=selected;
 const homeName=footballNameInArabic(home.team.displayName)||home.team.displayName,awayName=footballNameInArabic(away.team.displayName)||away.team.displayName;
 const attrs:Record<string,string>={order:'video-last',match:homeName+' ضد '+awayName,home:homeName,away:awayName,home_score:String(home.score),away_score:String(away.score),date,competition,event:event.id,league:selected.league,summary:home.score===away.score?'انتهت المواجهة بالتعادل.':`انتهت المواجهة بفوز ${Number(home.score)>Number(away.score)?homeName:awayName}.`,source_url:`https://www.espn.com/soccer/match/_/gameId/${event.id}`,source_name:'ESPN — تفاصيل المباراة'};
 const goals:string[]=[];
 const plays = selected.details?.scoringPlays?.length ? selected.details.scoringPlays : selected.details?.header?.competitions?.find((c:any)=>String(c.id)===String(event.id))?.details || event.competitions?.[0]?.details || [];
 for(const p of plays){
  if(p.shootout===true || p.scoringPlay !== true)continue;
  const name=p.participants?.[0]?.athlete?.displayName||p.athletesInvolved?.[0]?.displayName||'',minute=p.clock?.displayValue||'';
  if(name&&minute)goals.push((footballNameInArabic(name)||name)+(p.ownGoal===true?' (هدف عكسي)':'')+'|'+String(minute).replace(/[′']/g,''));
 }
 if(goals.length){
  attrs.goals=goals.join(';');
  if(goals.length===Number(home.score)+Number(away.score)){
    const first=goals[0].split('|'),last=goals[goals.length-1].split('|');
    attrs.summary+=` افتتح ${first[0]} التسجيل في الدقيقة ${first[1]}${goals.length>1?`، واختتم ${last[0]} الأهداف في الدقيقة ${last[1]}`:''}.`;
  }
 }
 const video=await lookup({home:home.team.displayName,away:away.team.displayName,date,competition},'',signal,fetcher);attrs.video_status=video.status;
 if(video.status==='found')Object.assign(attrs,{video_url:video.video.url,video_embed:String(video.video.embeddable),video_channel:video.video.channel,video_published:video.video.publishedAt});
 return '<aifball-summary '+Object.entries(attrs).map(([k,v])=>`${k}="${esc(v)}"`).join(' ')+' />';
}
