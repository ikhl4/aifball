import { normalizeMatchDetails } from './match-details';
const list=(v:any):any[]=>Array.isArray(v)?v:[];
const val=(v:any):string|null=>typeof v==='string'||typeof v==='number'?String(v):null;
export const REPORT_STATS:Record<string,string>={totalGoals:'الأهداف',goalAssists:'صناعة الأهداف',totalShots:'التسديدات',shotsOnTarget:'على المرمى',saves:'التصديات',goalsConceded:'الأهداف المستقبلة',foulsCommitted:'الأخطاء المرتكبة',foulsSuffered:'الأخطاء المكتسبة',yellowCards:'إنذارات',redCards:'طرد',ownGoals:'أهداف عكسية',totalPasses:'التمريرات',accuratePasses:'تمريرات صحيحة',totalTackles:'التدخلات',effectiveTackles:'تدخلات ناجحة',interceptions:'الاعتراضات',totalClearance:'التشتيت',blockedShots:'تسديدات محجوبة',totalCrosses:'العرضيات',accurateCrosses:'عرضيات صحيحة',totalLongBalls:'كرات طويلة',accurateLongBalls:'كرات طويلة صحيحة',expectedGoals:'الأهداف المتوقعة xG',expectedAssists:'الصناعة المتوقعة xA',minutesPlayed:'دقائق اللعب',chancesCreated:'فرص مصنوعة'};
export function reportIdentity(url:string):{event:string;league:string}|null {
 try{const u=new URL(url);if(u.protocol!=='https:'||u.username||u.password||!/(^|\.)espn\.com$/.test(u.hostname))return null;
 const event=u.pathname.match(/\/(?:gameId|matchId)\/(\d{1,12})(?:\/|$)/)?.[1]||u.searchParams.get('gameId');const league=u.searchParams.get('league');return event&&/^\d{1,12}$/.test(event)?{event,league:league||''}:null;
 }catch{return null;}
}
export function normalizeReport(raw:any,event:string,league:string){
 const base=normalizeMatchDetails(raw,event,league);
 const team=(side:typeof base.home)=>{
 const roster=list(raw.rosters).find(r=>String(r.team?.id)===side.id);
 const positions:Record<string,string>={CB:'قلب دفاع',LCB:'قلب دفاع أيسر',RCB:'قلب دفاع أيمن',LB:'ظهير أيسر',RB:'ظهير أيمن',LWB:'ظهير جناح أيسر',RWB:'ظهير جناح أيمن',CM:'وسط',LCM:'وسط أيسر',RCM:'وسط أيمن',DM:'محور',CDM:'محور',AM:'وسط هجومي',CAM:'وسط هجومي',LM:'وسط أيسر',RM:'وسط أيمن',LW:'جناح أيسر',RW:'جناح أيمن',ST:'مهاجم',CF:'مهاجم',SS:'مهاجم ثانٍ'};
 return {...side,players:side.players.map(p=>{const original=list(roster?.roster).find(x=>String(x.athlete?.id)===p.id);return {...p,position:p.position||positions[original?.position?.abbreviation]||val(original?.position?.displayName)||'',statistics:list(original?.stats).filter(s=>REPORT_STATS[s.name]&&val(s.displayValue)!==null&&(!['saves','goalsConceded','shotsFaced'].includes(s.name)||original?.position?.abbreviation==='G')).sort((a,b)=>Object.keys(REPORT_STATS).indexOf(a.name)-Object.keys(REPORT_STATS).indexOf(b.name)).map(s=>({key:s.name,label:REPORT_STATS[s.name],value:val(s.displayValue)!}))};})};};
 const home=team(base.home),away=team(base.away);
 const extras=Object.entries(REPORT_STATS).filter(([key])=>!base.statistics.some(s=>s.key===key)&&(home.statistics[key]!=null||away.statistics[key]!=null)).map(([key,label])=>({key,label,home:home.statistics[key]??null,away:away.statistics[key]??null,percent:false}));
 const competition=raw.header.competitions.find((c:any)=>String(c.id)===event);
 return {...base,home,away,statistics:[...base.statistics,...extras],date:val(competition.date),competition:val(raw.header.league?.name),status:val(competition.status?.type?.description),sourceUrl:`https://www.espn.com/soccer/match/_/gameId/${event}`,coverage:{xg:home.statistics.expectedGoals!=null||away.statistics.expectedGoals!=null,heatmap:false,passesMap:false,tracking:false},scope:'أرقام المباراة فقط؛ البيانات الغائبة لا تعني صفراً.'};
}
export type DetailedMatchReport=ReturnType<typeof normalizeReport>;
