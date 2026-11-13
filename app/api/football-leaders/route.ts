import { NextResponse } from 'next/server';

// FotMob's public web endpoints are unofficial and can change or block server traffic.
// Never present partial/mismatched-season numbers as verified statistics.
const fotmobIds: Record<string, number> = {
  'ksa.1': 536, 'eng.1': 47, 'esp.1': 87, 'ita.1': 55,
  'ger.1': 54, 'fra.1': 53, 'usa.1': 130,
  'uefa.champions': 42, 'uefa.europa': 73, 'uefa.europa.conf': 10216,
};
type Leader = { id: number; name: string; team: string; photo: string | null; logo: string | null; value: number };
type LeaderResponse = { players: Leader[]; source: string; season: number; league: string; kind: string };
type AnyRecord = Record<string, unknown>;
const record = (v: unknown): AnyRecord => v && typeof v === 'object' && !Array.isArray(v) ? v as AnyRecord : {};
const array = (v: unknown): unknown[] => Array.isArray(v) ? v : [];
const str = (v: unknown) => typeof v === 'string' ? v : '';
const number = (v: unknown) => typeof v === 'number' && Number.isFinite(v) ? v : typeof v === 'string' && v.trim() && Number.isFinite(Number(v)) ? Number(v) : null;
const fotmobBase = 'https://www.fotmob.com/api/data/';
async function fotmobJson(endpoint: string, params: Record<string,string>): Promise<AnyRecord> {
  const url = new URL(fotmobBase + endpoint);
  Object.entries(params).forEach(([key, val]) => url.searchParams.set(key, val));
  const response = await fetch(url, {
    headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0 (compatible; AiFBall/1.0)' },
    next: { revalidate: 1800 },
    signal: AbortSignal.timeout(8500),
  });
  if (!response.ok) throw new Error('FotMob HTTP ' + response.status);
  return record(await response.json());
}
const playerImage = (id: number) => 'https://images.fotmob.com/image_resources/playerimages/' + id + '.png';
function normalize(list: unknown[], stat: string): Leader[] {
  const seen = new Set<number>();
  const output: Leader[] = [];
  for (const raw of list) {
    const row = record(raw);
    const participant = record(row.participant);
    const athlete = Object.keys(participant).length ? participant : row;
    const id = number(athlete.id ?? athlete.playerId);
    const name = str(athlete.name);
    const type = str(record(athlete.statValue).name || record(athlete.stat).name);
    const value = number(record(athlete.statValue).value ?? record(athlete.stat).value ?? athlete.value);
    // If the stat name is present it must match the requested metric.
    if (type && type !== stat) continue;
    if (id === null || !Number.isSafeInteger(id) || id <= 0 || !name || value === null || !Number.isInteger(value) || value < 0 || seen.has(id)) continue;
    seen.add(id);
    const team = str(athlete.teamName ?? record(athlete.team).name);
    output.push({ id, name, team, photo: playerImage(id), logo: null, value });
  }
  return output.sort((a,b) => b.value - a.value).slice(0,20);
}
async function fotmobLeaders(league: string, kind: 'goals'|'assists', season: number): Promise<Leader[]> {
  const id = fotmobIds[league];
  if (!id) return [];
  const stat = kind === 'goals' ? 'goals' : 'goal_assist';
  const seasonLabel = league === 'usa.1' ? String(season) : season + '/' + (season+1);
  // Resolve FotMob's internal numeric season ID instead of guessing it.
  const categories = await fotmobJson('leagueseasondeepstats',{id:String(id),type:'players'});
  const seasons = array(categories.seasons).map(record);
  const match = seasons.find(row => str(row.name) === seasonLabel);
  const selectedId = match && number(match.id);
  const currentId = number(categories.currentSeasonId);
  const currentName = seasons.find(row => number(row.id) === currentId);
  if (selectedId === null || selectedId === undefined) {
    // Some newer leagues use a large synthetic season label; permit it only
    // when the API explicitly identifies the current season as the requested one.
    if (!currentId || str(currentName?.name) !== seasonLabel) return [];
  }
  const seasonId = selectedId || currentId;
  if (!seasonId) return [];
  const data = await fotmobJson('leagueseasondeepstats', {
    id: String(id), season:String(seasonId), type:'players', stat,
  });
  if (number(data.currentSeasonId) !== null && number(data.currentSeasonId) !== seasonId) return [];
  if (str(data.currentStatName) && str(data.currentStatName) !== stat) return [];
  const statsData = array(data.statsData);
  const players = normalize(statsData,stat);
  if (!players.length) return [];
  // Enrich with club names from the league hub; never fail the ranked list if that endpoint is unavailable.
  try {
    const hub=await fotmobJson('leagues',{id:String(id)});
    const clubNames=new Map<number,string>();
    for(const table of array(hub.table)){
      // FotMob nests the actual league table under data.table.all.
      const entries=array(record(record(record(table).data).table).all);
      for(const entry of entries){
        const team=record(entry), teamId=number(team.id), teamName=str(team.name);
        if(teamId!==null && teamName)clubNames.set(teamId,teamName);
      }
    }
    const playerTeams=new Map<number,number>();
    for(const raw of statsData){
      const athlete=record(raw);
      const playerId=number(athlete.id),teamId=number(athlete.teamId);
      if(playerId!==null && teamId!==null)playerTeams.set(playerId,teamId);
    }
    return players.map(p=>{
      const teamId=playerTeams.get(p.id), team=teamId?clubNames.get(teamId):undefined;
      return team ? {...p,team,logo:teamId?'https://images.fotmob.com/image_resources/logo/teamlogo/'+teamId+'.png':null}:p;
    });
  }catch{return players;}
}
async function apiFootballLeaders(league: string, kind: 'goals'|'assists', season: number): Promise<Leader[]> {
  const ids: Record<string,number> = { 'ksa.1':307,'eng.1':39,'esp.1':140,'ita.1':135,'ger.1':78,'fra.1':61,'usa.1':253 };
  const leagueId = ids[league];
  const direct = process.env.API_SPORTS_KEY;
  const rapid = process.env.RAPIDAPI_KEY;
  if (!leagueId || (!direct && !rapid)) return [];
  const url = new URL((direct ? 'https://v3.football.api-sports.io/players/' : 'https://api-football-v1.p.rapidapi.com/v3/players/') + (kind === 'goals' ? 'topscorers':'topassists'));
  url.searchParams.set('league', String(leagueId));
  url.searchParams.set('season',String(season));
  const response=await fetch(url,{
    headers: direct ? {'x-apisports-key':direct} : {'x-rapidapi-key':rapid!, 'x-rapidapi-host':'api-football-v1.p.rapidapi.com'},
    next:{revalidate:3600},signal:AbortSignal.timeout(7500)
  });
  if (!response.ok) { console.warn('[Leaders] API-Football unavailable',{league,kind,status:response.status});return []; }
  const raw=record(await response.json());
  if (Object.keys(record(raw.errors)).length || !Array.isArray(raw.response)) return [];
  return normalizeApiFootball(array(raw.response),kind);
}
function normalizeApiFootball(items: unknown[], kind:'goals'|'assists'):Leader[] {
  const output:Leader[]=[];
  for(const entry of items){
    const row=record(entry), player=record(row.player), stats=record(array(row.statistics)[0]);
    const goals=record(stats.goals), team=record(stats.team);
    const id=number(player.id), value=number(goals[kind==='goals'?'total':'assists']),name=str(player.name);
    if(id===null || value===null || !name || !Number.isInteger(value)) continue;
    const photo=str(player.photo),logo=str(team.logo);
    output.push({id,name,value,team:str(team.name),photo:photo.startsWith('https://')?photo:null,logo:logo.startsWith('https://')?logo:null});
  }
  return output.sort((a,b)=>b.value-a.value).slice(0,20);
}
export async function GET(request: Request) {
  const params=new URL(request.url).searchParams;
  const league=params.get('league')||'ksa.1';
  const kind=params.get('kind');
  if (!(league in fotmobIds) || (kind!=='goals' && kind!=='assists')) return NextResponse.json({error:'Unsupported competition',players:[]},{status:400});
  const now=new Date(), year=now.getUTCFullYear();
  const season=league==='usa.1'?year:(now.getUTCMonth()<6?year-1:year);
  try{
    const players=await fotmobLeaders(league,kind,season);
    if(players.length) return NextResponse.json({players,source:'FotMob',season,league,kind} satisfies LeaderResponse);
    console.warn('[Leaders] FotMob has no validated stats',{league,kind,season});
  }catch(err){console.warn('[Leaders] FotMob unavailable',{league,kind,reason:err instanceof Error?err.message:'unknown'});}
  try{
    const players=await apiFootballLeaders(league,kind,season);
    if(players.length) return NextResponse.json({players,source:'API-Football',season,league,kind} satisfies LeaderResponse);
  }catch(err){console.warn('[Leaders] API-Football fallback failed',{league,kind,reason:err instanceof Error?err.message:'unknown'});}
  return NextResponse.json({error:'Verified season leaders unavailable',players:[],code:'SOURCES_UNAVAILABLE'},{status:503});
}
