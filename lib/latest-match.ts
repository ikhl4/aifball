import { COMPETITIONS } from './competitions';
import { footballNameInArabic } from './football-names-ar';

type Match = { date: string; league: string; competition: string; home: string; away: string; homeScore: number; awayScore: number; id: string };
const norm = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[\u064b-\u065f]/g,'').replace(/[أإآ]/g,'ا').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
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
 if (/[0-9٠-٩۰-۹]|(?:^| )(?:ضد|امام|مقابل|في|ضمن|بين|الموسم|شهر|امس|اليوم|الاسبوع|لكل|فاز|خسر|تعادل|فوزه|خسارته|المصري|القطري|vs|versus|against|between|on|in)(?: |$)/i.test(q)) return null;
 const words = ' ' + q.replace(/(?:^| )لل(?=\p{Script=Arabic})/gu,' ال') + ' ';
 const found = Object.entries(aliases).filter(([, names]) => names.some(name => {
   const alias = norm(name);
   return words.includes(' ' + alias + ' ') ||
     (/^\p{Script=Arabic}/u.test(alias) && words.includes(' ل' + alias + ' '));
 }));
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
const fetchBudgetMs = 2500;
const lookupBudgetMs = 6500;
const monthFormat = (date: Date) => date.toISOString().slice(0, 7).replace('-', '');

function readScore(raw: unknown): number | null {
  const value = raw && typeof raw === 'object'
    ? (raw as { value?: unknown; displayValue?: unknown }).value ?? (raw as { displayValue?: unknown }).displayValue
    : raw;
  if (typeof value !== 'number' && !(typeof value === 'string' && /^\d+$/.test(value.trim()))) return null;
  const score = Number(value);
  return Number.isSafeInteger(score) && score >= 0 ? score : null;
}

function extract(event: any, league: string, teamAliases: Set<string>, month: string, now: number) {
  const competition = event?.competitions?.[0];
  const sides = competition?.competitors;
  const status = competition?.status?.type ?? event?.status?.type;
  if (!Array.isArray(sides) || sides.length !== 2 ||
      (status?.completed !== true && status?.state !== 'post') ||
      /POSTPONED|CANCEL|SUSPENDED|ABANDONED/i.test(status?.name ?? '')) return null;

  const date = String(event.date ?? '');
  const kickoff = Date.parse(date);
  if (!Number.isFinite(kickoff) || kickoff > now || monthFormat(new Date(kickoff)) !== month) return null;

  const home = sides.find(side => side.homeAway === 'home');
  const away = sides.find(side => side.homeAway === 'away');
  if (!home || !away) return null;
  const belongsToTeam = (side: any) => [side.team?.displayName, side.team?.name, side.team?.shortDisplayName]
    .some(name => typeof name === 'string' && teamAliases.has(norm(name).replace(/^fc | fc$/g, '')));
  if (belongsToTeam(home) === belongsToTeam(away)) return null;

  const homeScore = readScore(home.score);
  const awayScore = readScore(away.score);
  const id = String(event.id ?? '');
  const homeName = home.team?.displayName || home.team?.name || home.team?.shortDisplayName;
  const awayName = away.team?.displayName || away.team?.name || away.team?.shortDisplayName;
  if (homeScore === null || awayScore === null || !/^\d+$/.test(id) || !homeName || !awayName) return { kickoff, match: null };

  const match: Match = {
    id, date, league, competition: COMPETITIONS[league]?.ar || league,
    home: footballNameInArabic(homeName) || homeName, away: footballNameInArabic(awayName) || awayName,
    homeScore, awayScore,
  };
  return { kickoff, match };
}

export async function latestVerifiedMatch(team: string, signal?: AbortSignal): Promise<{ match: Match | null; complete: boolean }> {
  if (!aliases[team]) return { match: null, complete: false };
  const teamAliases = new Set(aliases[team].map(norm));
  const now = new Date();
  const leagues = competitionsByTeam(team);
  const deadline = AbortSignal.timeout(lookupBudgetMs);
  const lookupSignal = signal ? AbortSignal.any([signal, deadline]) : deadline;
  let complete = true;

  for (let offset = 0; offset < 5 && !lookupSignal.aborted; offset += 2) {
    const months = [offset, offset + 1].filter(index => index < 5).map(index =>
      monthFormat(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - index, 1))));
    const batchSignal = AbortSignal.any([lookupSignal, AbortSignal.timeout(fetchBudgetMs)]);
    const boards = await Promise.all(months.map(month => Promise.allSettled(leagues.map(async league => {
      const path = `https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/scoreboard?dates=${month}&limit=500`;
      const response = await fetch(path, { signal: batchSignal, next: { revalidate: 30 } });
      if (!response.ok) throw Error(`Scoreboard HTTP ${response.status}`);
      const data = await response.json();
      if (!Array.isArray(data.events) || data.events.length >= 500) throw Error('Incomplete scoreboard');
      return data.events
        .map((event: any) => extract(event, league, teamAliases, month, now.getTime()))
        .filter((event: ReturnType<typeof extract>): event is NonNullable<typeof event> => event !== null);
    }))));
    if (signal?.aborted) break;
    if (boards.every(board => board.every(result => result.status === 'rejected'))) return { match: null, complete: false };

    for (const board of boards) {
      complete = complete && board.every(result => result.status === 'fulfilled');
      const events = board.flatMap(result => result.status === 'fulfilled' ? result.value : []);
      const verified = events.filter(event => event.match !== null).sort((a, b) => b.kickoff - a.kickoff)[0];
      if (verified?.match) {
        return {
          match: verified.match,
          complete: complete && !events.some(event => event.match === null && event.kickoff >= verified.kickoff),
        };
      }
      if (events.some(event => event.match === null)) complete = false;
    }
  }
  return { match: null, complete: complete && !lookupSignal.aborted };
}
export function latestMatchText(team:string,m:Match):string {
 const day=new Intl.DateTimeFormat('ar-SA',{timeZone:'Asia/Riyadh',calendar:'gregory',year:'numeric',month:'long',day:'numeric'}).format(new Date(m.date));
 return '**آخر مباراة مكتملة عُثر عليها — '+team+'**\n\n**'+m.home+' '+m.homeScore+' – '+m.awayScore+' '+m.away+'**\n\n**البطولة:** '+m.competition+'\n\n**التاريخ:** '+day+'\n\n**المصدر:** ESPN · نتيجة مكتملة ضمن البطولات التي تم فحصها.';
}
