import { POST } from '../typed/route';
import { NextResponse } from 'next/server';
export const dynamic='force-dynamic';
export const maxDuration=45;
export async function GET(request:Request){
 if(process.env.VERCEL_ENV!=='preview')return NextResponse.json({error:'disabled'},{status:404});
 const query=new URL(request.url).searchParams.get('q')||'ملخص مباراة الهلال و الاتحاد';
 const proxy=new Request(request.url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query})});
 return POST(proxy);
}
