import { POST } from '../typed/route';
import { NextResponse } from 'next/server';
export const dynamic='force-dynamic';
export const maxDuration=45;
export async function GET(request:Request){
 if(process.env.VERCEL_ENV!=='preview')return NextResponse.json({status:'disabled'},{status:404});
 const url=new URL(request.url);
 const q=url.searchParams.get('q');
 if(!q||q.length>160)return NextResponse.json({status:'missing'},{status:400});
 const r=new Request(request.url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query:q})});
 return POST(r);
}
