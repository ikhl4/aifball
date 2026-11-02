export function scores365Identity(value:string):{event:string;teams:string[];competition:string}|null {
 try{const u=new URL(value);if(u.protocol!=='https:'||!['365scores.com','www.365scores.com'].includes(u.hostname)||u.username||u.password||(u.port&&u.port!=='443'))return null;
 const ids=u.pathname.match(/-(\d{1,12})-(\d{1,12})-(\d{1,12})\/?$/),event=u.hash.match(/^#id=(\d{1,12})$/);return ids&&event&&Number(event[1])>0&&ids[1]!==ids[2]?{event:event[1],teams:[ids[1],ids[2]],competition:ids[3]}:null;
 }catch{return null;}
}
export type ScoresMetric={key:string;label:string;value:string};
export type ScoresPlayer={id:string;name:string;jersey:string|null;starter:boolean;status:string;position:string;statistics:ScoresMetric[];hasHeatmap:boolean};
export type ScoresTeam={id:string;name:string;score:string|null;formation:string|null;players:ScoresPlayer[]};
export type Scores365Report={source:'365Scores';eventId:string;competitionId:string;sourceUrl:string;date:string;competition:string|null;state:string;home:ScoresTeam;away:ScoresTeam;statistics:{key:string;label:string;home:string|null;away:string|null}[];shots:{id:string;side:'home'|'away';playerId:string;x:number;y:number;xg:number|null;minute:string|null;outcome:string}[];warnings:unknown[];fetchedAt:string};
const string=(v:unknown):string|null=>typeof v==='string'?v:null;
const list=(v:unknown):any[]=>Array.isArray(v)?v:[];
export function normalize365Report(raw:any,url:string):Scores365Report {
 const identity=scores365Identity(url);
 if(!identity||raw?.source!=='365Scores'||raw.eventId!==identity.event||raw.competitionId!==identity.competition||!raw.home||!raw.away||raw.home.id===raw.away.id||!identity.teams.includes(raw.home.id)||!identity.teams.includes(raw.away.id)||raw.coordinates!=='percent-100-attacking-right'||typeof raw.date!=='string'||!Number.isFinite(Date.parse(raw.date)))throw Error('لم يؤكد المصدر هوية مباراة 365Scores المطلوبة.');
 const team=(t:any):ScoresTeam=>({id:t.id,name:string(t.name)||'الفريق غير متاح',score:string(t.score),formation:string(t.formation),players:list(t.players).filter(p=>/^\d{1,12}$/.test(p?.id)&&typeof p.name==='string'&&typeof p.starter==='boolean').map(p=>({id:p.id,name:p.name,jersey:string(p.jersey),starter:p.starter,status:string(p.status)||'حالة المشاركة غير متاحة',position:string(p.position)||'المركز غير متاح',hasHeatmap:p.hasHeatmap===true,statistics:list(p.statistics).filter(s=>typeof s?.key==='string'&&typeof s.label==='string'&&typeof s.value==='string').map(s=>({key:s.key,label:s.label,value:s.value}))}))});
 return {source:'365Scores',eventId:identity.event,competitionId:identity.competition,sourceUrl:url,date:raw.date,competition:string(raw.competition),state:string(raw.state)||'unknown',home:team(raw.home),away:team(raw.away),statistics:list(raw.statistics).filter(s=>typeof s?.key==='string'&&typeof s.label==='string').map(s=>({key:s.key,label:s.label,home:string(s.home),away:string(s.away)})),shots:list(raw.shots).filter(s=>s&&['home','away'].includes(s.side)&&['x','y'].every(k=>typeof s[k]==='number'&&Number.isFinite(s[k])&&s[k]>=0&&s[k]<=100)).map(s=>({id:String(s.id),side:s.side,playerId:String(s.playerId),x:s.x,y:s.y,xg:typeof s.xg==='number'&&Number.isFinite(s.xg)&&s.xg>=0&&s.xg<=1?s.xg:null,minute:string(s.minute),outcome:string(s.outcome)||'غير محدد'})),warnings:list(raw.warnings),fetchedAt:string(raw.fetchedAt)||''};
}
