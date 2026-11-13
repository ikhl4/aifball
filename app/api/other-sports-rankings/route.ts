import { NextResponse } from 'next/server';

type Entry = { rank: number; name: string; value: string; secondary?: string; logo?: string };
type RankResult = { title: string; metric: string; source: string; entries: Entry[]; season?: string };
const leagues: Record<string, [string, string, string]> = {
  NBA: ['basketball','nba','ترتيب دوري كرة السلة NBA'],
  WNBA: ['basketball','wnba','ترتيب دوري السيدات WNBA'],
  NFL: ['football','nfl','ترتيب دوري كرة القدم الأمريكية'],
  MLB: ['baseball','mlb','ترتيب دوري البيسبول'],
  NHL: ['hockey','nhl','ترتيب دوري هوكي الجليد'],
  CFB: ['football','college-football','ترتيب كرة القدم الجامعية'],
  CBK: ['basketball','mens-college-basketball','ترتيب دوري الجامعات لكرة السلة'],
};
const numeric = (v: unknown): number | null => {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() && Number.isFinite(Number(v))) return Number(v);
  return null;
};
const str = (v: unknown) => typeof v === 'string' ? v.trim() : '';
const validImage = (v: unknown) => /^https:\/\//.test(str(v)) ? str(v) : undefined;
const arNames: Record<string, string> = {
  'Los Angeles Lakers':'لوس أنجلوس ليكرز','Golden State Warriors':'غولدن ستيت ووريورز',
  'Boston Celtics':'بوسطن سيلتكس','New York Knicks':'نيويورك نيكس',
  'Denver Nuggets':'دنفر ناغتس','Oklahoma City Thunder':'أوكلاهوما سيتي ثاندر',
  'Chicago Bulls':'شيكاغو بولز','Miami Heat':'ميامي هيت',
  'Cleveland Cavaliers':'كليفلاند كافالييرز',
  'Ferrari':'فيراري','McLaren':'مكلارين','Mercedes':'مرسيدس',
  'Red Bull':'ريد بُل','Williams':'ويليامز','Aston Martin':'أستون مارتن',
  'Haas F1 Team':'هاس','Alpine F1 Team':'ألبين',
  'Max Verstappen':'ماكس فيرستابن','Lewis Hamilton':'لويس هاميلتون',
  'Charles Leclerc':'شارل لوكلير','Lando Norris':'لاندو نوريس',
  'Oscar Piastri':'أوسكار بياستري','George Russell':'جورج راسل',
  'Carlos Sainz':'كارلوس ساينز','Fernando Alonso':'فرناندو ألونسو',
  'Carlos Alcaraz':'كارلوس ألكاراز','Jannik Sinner':'يانيك سينر',
  'Novak Djokovic':'نوفاك ديوكوفيتش','Alexander Zverev':'ألكسندر زفيريف',
  'Iga Swiatek':'إيغا شفيونتيك','Aryna Sabalenka':'أرينا سابالينكا',
  'Coco Gauff':'كوكو غوف','Elena Rybakina':'إيلينا ريباكينا',
};
const local = (v: unknown) => arNames[str(v)] || str(v);
async function json(url: string) {
  const response = await fetch(url, { next: { revalidate: 1800 }, signal: AbortSignal.timeout(9500), headers: { Accept: 'application/json' } });
  if (!response.ok) throw Error('Provider unavailable');
  return response.json() as Promise<any>;
}
async function tennis(code: string): Promise<RankResult> {
  const payload = await json('https://site.api.espn.com/apis/site/v2/sports/tennis/'+code.toLowerCase()+'/rankings');
  const ranks: any[] = payload?.rankings?.[0]?.ranks || [];
  const entries = ranks.flatMap(item => {
    const rank = numeric(item.current);
    const name = local(item?.athlete?.displayName);
    const pts = numeric(item.points);
    return rank && name && pts !== null ? [{rank, name, value: String(pts), secondary: str(item?.athlete?.citizenshipCountry), logo: validImage(item?.athlete?.flag)}] : [];
  }).sort((a: Entry,b: Entry) => a.rank-b.rank).slice(0,100);
  return { title:code==='ATP'?'التصنيف العالمي للتنس – رجال':'التصنيف العالمي للتنس – سيدات',metric:'النقاط',source:'ESPN (ATP/WTA)',entries };
}
async function f1(code: string): Promise<RankResult> {
  const kind = code === 'F1_DRIVERS' ? 'driverstandings' : 'constructorstandings';
  const season = new Date().getUTCFullYear();
  const payload = await json('https://api.jolpi.ca/ergast/f1/'+season+'/'+kind+'/?format=json&limit=100');
  const lists: any[] = payload?.MRData?.StandingsTable?.StandingsLists || [];
  const standings: any[] = lists[0]?.[kind === 'driverstandings' ? 'DriverStandings' : 'ConstructorStandings'] || [];
  const entries = standings.flatMap(item => {
    const rank=numeric(item.position), points=numeric(item.points);
    const person = item.Driver ? [item.Driver.givenName,item.Driver.familyName].filter(Boolean).join(' ') : item.Constructor?.name;
    return rank && points !== null && str(person) ? [{
      rank, name:local(person), value:String(points),
      secondary:kind==='driverstandings' ? local(item.Constructors?.[0]?.name) : String(item.wins ?? ''),
    }] : [];
  }).sort((a: Entry,b: Entry)=>a.rank-b.rank);
  return {title:code==='F1_DRIVERS'?'ترتيب سائقي الفورمولا 1':'ترتيب فرق الفورمولا 1',metric:'النقاط',source:'Jolpica F1',season:String(season),entries};
}
async function espn(code: string): Promise<RankResult> {
  const [sport,league,title] = leagues[code];
  const data=await json('https://site.api.espn.com/apis/v2/sports/'+sport+'/'+league+'/standings');
  const collected: any[]=[];
  function walk(group:any) {
    if(!group || typeof group!=='object') return;
    if(Array.isArray(group.standings?.entries)) collected.push(...group.standings.entries);
    if(Array.isArray(group.children)) group.children.forEach(walk);
  }
  walk(data);
  const seen=new Set<string>();
  const entries: Entry[] = collected.flatMap((entry:any) => {
    const team=entry.team || {};
    const id=str(team.id)||str(team.displayName)||str(team.name);
    if (!id || seen.has(id)) return [];
    seen.add(id);
    const stats:any[]=Array.isArray(entry.stats)?entry.stats:[];
    const stat=(keys:string[])=>stats.find(item=>keys.includes(str(item.name))||keys.includes(str(item.abbreviation)));
    const wins=stat(['wins','W']), losses=stat(['losses','L']), pct=stat(['winPercent','PCT']);
    const rankStat=stat(['playoffSeed','rank','seed']);
    const rank=numeric(rankStat?.value)||numeric(entry?.seed)||collected.indexOf(entry)+1;
    const name=local(team.displayName || team.name);
    const value=wins?.displayValue != null && losses?.displayValue != null ? String(wins.displayValue)+' - '+String(losses.displayValue) :
      str(pct?.displayValue) || '';
    if(!name || !value) return [];
    return [{rank,name,value,secondary:str(team.abbreviation),logo:validImage(team.logos?.[0]?.href)}];
  });
  return {title,metric:'فوز - خسارة',source:'ESPN',entries};
}
export async function GET(request: Request) {
  const code=new URL(request.url).searchParams.get('code') || 'NBA';
  if(!['ATP','WTA','F1_DRIVERS','F1_TEAMS',...Object.keys(leagues)].includes(code))
    return NextResponse.json({error:'بطولة غير مدعومة'}, {status:400});
  try {
    const result = code==='ATP'||code==='WTA' ? await tennis(code) : code.startsWith('F1_') ? await f1(code) : await espn(code);
    if(!result.entries.length) return NextResponse.json({error:'لا تتوفر بيانات تصنيف مؤكدة حاليًا',source:result.source,entries:[]}, {status:404});
    return NextResponse.json(result,{headers:{'Cache-Control':'public, s-maxage=600, stale-while-revalidate=1800'}});
  } catch {
    return NextResponse.json({error:'تعذر التحقق من التصنيف من المصدر الرياضي',entries:[]}, {status:502});
  }
}
