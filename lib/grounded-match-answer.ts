import {scores365Identity,normalize365Report} from './scores365-report';
import { COMPETITIONS } from './competitions';
import { normalizeReport } from './match-report';
import { normalizeSpatialReport,sofaMatchId } from './spatial-report';
import { footballNameInArabic } from './football-names-ar';
import { uniquePlayer } from './match-narrative';
const ar=(s:string)=>footballNameInArabic(s)||s;
const xClip=(raw:string)=>{try{const u=new URL(raw);if(!['x.com','www.x.com','twitter.com','www.twitter.com'].includes(u.hostname.toLowerCase())||u.protocol!=='https:')return '';if(!/^\/[A-Za-z0-9_]{1,15}\/status\/\d+\/?$/.test(u.pathname))return '';return 'https://x.com'+u.pathname.replace(/\/$/,'');}catch{return '';}};
const esc=(s:string)=>s.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const number=(v:unknown)=>typeof v==='number'||typeof v==='string'?String(v):'غير متاح';
const failure='تعذر جلب بيانات مؤكدة من المصدر لهذه المباراة. لن أعرض أرقاماً أو مشاركة لاعب غير متحقق منها. يمكنك إعادة المحاولة داخل الشات.';
/** Replace model statistics with verified source values; keep provider identities scoped. */
export async function groundedMatchAnswer(answer:string,_query:string,signal?:AbortSignal,fetcher:typeof fetch=fetch):Promise<string>{
 const tag=answer.match(/<aifball-match-report\b([^>]*?)\/?\s*>/i);
 if(!tag)return answer;
 const attrs:Record<string,string>={};for(const m of tag[1].matchAll(/([a-z_]+)\s*=\s*"([^"]*)"/g))attrs[m[1]]=m[2].replace(/&amp;/g,'&');
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),45000);const abort=()=>controller.abort();signal?.addEventListener('abort',abort,{once:true});if(signal?.aborted)abort();
 try{
  const get=async(url:string,headers?:HeadersInit)=>{const r=await fetcher(url,{headers,signal:controller.signal,cache:'no-store'});if(!r.ok)throw Error('SOURCE_UNAVAILABLE');return r.json();};
  let title='',source='',date='',state='',score='',outputTag='',metrics:{label:string;home:unknown;away:unknown;percent?:boolean}[]=[],players:{name:string;statistics:{label:string;value:unknown}[]}[]=[];
  let home='',away='';
  const sofa=attrs.match_url&&sofaMatchId(attrs.match_url);
  const scores=attrs.match_url&&scores365Identity(attrs.match_url);
  if(attrs.match_url&&/^https:\/\/(?:www\.)?365scores\.com\//i.test(attrs.match_url)&&!scores)return failure;
  if(scores){
   const backend=new URL('/365scores/match-analysis',process.env.LANUS_API_URL||'https://aifball-python-api.onrender.com');backend.searchParams.set('match_url',attrs.match_url);
   const d=normalize365Report(await get(backend.toString(),process.env.LANUS_API_SECRET?{'x-api-key':process.env.LANUS_API_SECRET}:undefined),attrs.match_url);
   home=ar(d.home.name);away=ar(d.away.name);date=d.date;title=d.competition||'البطولة غير متاحة';state=d.state==='post'?'انتهت':d.state==='in'?'جارية':d.state==='pre'?'لم تبدأ':'الحالة غير مؤكدة';score=`${number(d.home.score)} — ${number(d.away.score)}`;source=d.sourceUrl;metrics=d.statistics;players=[...d.home.players,...d.away.players];outputTag=`match_url="${esc(source)}"`;
  }else if(sofa){
   const backend=new URL('/sofascore/match-analysis',process.env.LANUS_API_URL||'https://aifball-python-api.onrender.com');backend.searchParams.set('match_url',attrs.match_url);
   const d=normalizeSpatialReport(await get(backend.toString(),process.env.LANUS_API_SECRET?{'x-api-key':process.env.LANUS_API_SECRET}:undefined),sofa);
   home=ar(d.home);away=ar(d.away);date=d.date||'';title=d.competition||'البطولة غير متاحة';state=d.status==='finished'?'انتهت':d.status==='inprogress'?'جارية':'الحالة غير مؤكدة';score=`${number(d.homeScore)} — ${number(d.awayScore)}`;source=attrs.match_url;metrics=d.statistics;players=d.players.map(p=>({name:p.name,statistics:p.stats}));outputTag=`match_url="${esc(source)}"`;
  }else if(/^\d{1,12}$/.test(attrs.event||'')&&Object.prototype.hasOwnProperty.call(COMPETITIONS,attrs.league)){
   const d=normalizeReport(await get(`https://site.api.espn.com/apis/site/v2/sports/soccer/${attrs.league}/summary?event=${attrs.event}`),attrs.event,attrs.league);
   home=ar(d.home.name);away=ar(d.away.name);date=d.date||'';title=COMPETITIONS[attrs.league].ar;state=d.state==='post'?'انتهت':d.state==='in'?'جارية':'لم تبدأ';score=`${number(d.home.score)} — ${number(d.away.score)}`;source=d.sourceUrl;metrics=d.statistics;players=[...d.home.players,...d.away.players];outputTag=`event="${d.eventId}" league="${esc(d.league)}"`;
  }else return failure;
  const timestamp=Date.parse(date);if(!Number.isFinite(timestamp)||timestamp>Date.now()||state==='لم تبدأ')return 'المصدر لم يؤكد مباراة بدأت بالفعل بهذا المعرّف؛ لن أقدّمها على أنها آخر مواجهة.';
  if(state!=='انتهت')return 'لم أتمكن من تأكيد مباراة مكتملة بهذا المعرّف.';
  const heading=`**${home} ضد ${away} — ${date.slice(0,10)} — ${title} — ${state}**\n\nالنتيجة (${home} ثم ${away}): **${score}**.`;
  let prose='';let playerAttr='';
  if(attrs.player_name){const p=uniquePlayer(players,attrs.player_name);if(p){prose=`\n\n**أداء ${p.name} في هذه المباراة:**\n\n`+(p.statistics.length?p.statistics.map(s=>`- ${s.label}: ${number(s.value)}.`).join('\n'):'الأرقام الفردية غير متاحة في استجابة المصدر.');playerAttr=` player_name="${esc(p.name)}"`;const clip=xClip(attrs.clip_url||'');if(clip){playerAttr+=` clip_url="${esc(clip)}"`;prose+=`\n\n**مقطع من المباراة على X:** [مشاهدة أداء ${p.name}](${clip})`;}}else prose=`\n\nلم أتمكن من تأكيد ${attrs.player_name.replace(/[<>]/g,'')} في قائمة هذه المباراة بالاسم المسترجع. لن أنسب له مشاركة أو أرقاماً؛ يمكنك تحديد الاسم داخل الشات.`;}
  else prose='\n\n**إحصائيات المباراة من المصدر:**\n\n'+(metrics.length?metrics.map(m=>`- ${m.label}: ${home} ${number(m.home)}${m.percent&&m.home!=null?'%':''}، مقابل ${away} ${number(m.away)}${m.percent&&m.away!=null?'%':''}.`).join('\n'):'الإحصائيات التفصيلية غير متاحة.');
  return heading+prose+'\n\nالأرقام الغائبة ليست صفراً. لا تتوفر خريطة حرارية أو مسارات تحرك إلا عند وصول إحداثيات مصدرية؛ أرقام المباراة وحدها لا تثبت أسلوب اللعب.\n\n[فتح مصدر المباراة]('+source+')\n\n'+`<aifball-match-report match="${esc(home+' ضد '+away+' · '+date.slice(0,10))}" ${outputTag}${playerAttr} />`;
 }catch{return failure;}finally{clearTimeout(timer);signal?.removeEventListener('abort',abort);}
}
/** Hold unverified answer deltas; preserve conversation/message identifiers and end order. */
export function groundedMatchStream(upstream:ReadableStream<Uint8Array>,query:string,signal?:AbortSignal):ReadableStream<Uint8Array>{
 const encoder=new TextEncoder(),decoder=new TextDecoder();let reader:ReadableStreamDefaultReader<Uint8Array>;
 return new ReadableStream({async start(out){reader=upstream.getReader();let buffer='',answer='',meta:any={},end:any=null;
  const send=(event:any)=>out.enqueue(encoder.encode('data: '+JSON.stringify(event)+'\n\n'));
  const frame=(text:string)=>{const data=text.split('\n').filter(l=>l.startsWith('data:')).map(l=>l.slice(5).trimStart()).join('\n');if(!data||data==='[DONE]')return;let e:any;try{e=JSON.parse(data);}catch{return;}
   if(e.event==='message'||e.event==='agent_message'){answer+=typeof e.answer==='string'?e.answer:'';meta={...e,answer:undefined};}else if(e.event==='message_end')end=e;else send(e);
  };
  try{while(true){const {done,value}=await reader.read();buffer+=decoder.decode(value,{stream:!done}).replace(/\r\n/g,'\n');let boundary;while((boundary=buffer.indexOf('\n\n'))>=0){frame(buffer.slice(0,boundary));buffer=buffer.slice(boundary+2);}if(done)break;}if(buffer.trim())frame(buffer);
   if(!end)throw Error('INCOMPLETE_STREAM');
   send({...meta,event:'message',answer:await groundedMatchAnswer(answer,query,signal)});send(end);out.close();
  }catch{if(!signal?.aborted){send({event:'error',message:'لم يكتمل التحقق من الرد. أعد المحاولة؛ لم نعرض أرقاماً غير مكتملة.'});out.close();}else out.error(new Error('ABORTED'));}finally{reader.releaseLock();}
 },cancel(){return reader?.cancel();}});
}
