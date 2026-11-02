type Metric={key:string;label:string;home:string|number|null;away:string|number|null;percent?:boolean};
export function matchNarrative(home:string,away:string,metrics:Metric[]):string[]{
 const keys=['expectedGoals','totalShots','shotsOnTarget','possessionPct','totalPasses','accuratePasses','saves','chancesCreated'];
 return keys.flatMap(key=>{const m=metrics.find(s=>s.key===key);if(!m)return [];const value=(v:string|number|null)=>v==null?'غير متاح':String(v)+(m.percent&&!String(v).includes('%')?'%':'');return [`${m.label}: ${home} ${value(m.home)}، مقابل ${away} ${value(m.away)}.`];});
}
export function uniquePlayer<T extends {name:string}>(players:T[],name?:string):T|null{
 if(!name)return null;
 const key=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f\u064b-\u065f]/g,'').trim().toLowerCase();
 const matches=players.filter(p=>key(p.name)===key(name));return matches.length===1?matches[0]:null;
}
