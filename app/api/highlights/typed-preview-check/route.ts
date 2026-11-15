import { POST } from '../typed/route';
export const dynamic='force-dynamic';
export const maxDuration=45;
export async function GET(request:Request){
 if(process.env.VERCEL_ENV!=='preview')return new Response(null,{status:404});
 const req=new Request(request.url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query:'ملخص الهلال وشباب الأهلي الإماراتي'})});
 return POST(req);
}
