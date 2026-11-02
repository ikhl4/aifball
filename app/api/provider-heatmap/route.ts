import {NextResponse} from 'next/server';
import {scores365Identity} from '../../../lib/scores365-report';
export const dynamic='force-dynamic';
export const maxDuration=60;
export async function GET(request:Request){
 const p=new URL(request.url).searchParams,url=p.get('matchUrl')||'',player=p.get('playerId')||'',identity=scores365Identity(url);
 if(!identity||!/^\d{1,12}$/.test(player)||Number(player)<=0)return NextResponse.json({error:'هوية المباراة أو اللاعب غير صالحة.'},{status:400});
 const backend=new URL('/365scores/player-heatmap',process.env.LANUS_API_URL||'https://aifball-python-api.onrender.com');backend.searchParams.set('match_url',url);backend.searchParams.set('player_id',player);
 const c=new AbortController(),timer=setTimeout(()=>c.abort(),45000),abort=()=>c.abort();request.signal.addEventListener('abort',abort,{once:true});if(request.signal.aborted)abort();
 try{
  const r=await fetch(backend,{signal:c.signal,cache:'no-store',headers:process.env.LANUS_API_SECRET?{'x-api-key':process.env.LANUS_API_SECRET}:{}});
  if(!r.ok||!r.headers.get('content-type')?.startsWith('image/png')||r.headers.get('x-aifball-event')!==identity.event||r.headers.get('x-aifball-player')!==player||r.headers.get('x-aifball-source')!=='365Scores')return NextResponse.json({error:'لم تتوفر صورة مؤكدة لهذا اللاعب والمباراة.'},{status:r.status===404?404:502});
  const reader=r.body?.getReader();if(!reader)throw Error('EMPTY');const parts:Uint8Array[]=[];let size=0;
  try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>4*1024*1024){await reader.cancel();throw Error('SIZE');}parts.push(value);}}finally{reader.releaseLock();}
  const bytes=new Uint8Array(size);let offset=0;for(const part of parts){bytes.set(part,offset);offset+=part.length;}
  if(size<8||![137,80,78,71,13,10,26,10].every((v,i)=>bytes[i]===v))throw Error('PNG');
  return new Response(bytes,{headers:{'Content-Type':'image/png','Cache-Control':'private, max-age=60','X-Content-Type-Options':'nosniff'}});
 }catch{return NextResponse.json({error:'تعذر جلب صورة الخريطة من المصدر.'},{status:c.signal.aborted?504:502});}
 finally{clearTimeout(timer);request.signal.removeEventListener('abort',abort);}
}
