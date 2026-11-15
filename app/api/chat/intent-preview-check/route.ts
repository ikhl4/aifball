import { NextResponse } from 'next/server';
import { isNamedVideoHighlights, needsDurableResearch } from '../../../../lib/chat-intent';
export const dynamic='force-dynamic';
const checks: Array<[string,boolean,boolean]> = [
 ['ملخص الاتحاد والعين',true,true],
 ['ملخص مباراة الهلال و الاتحاد',true,true],
 ['Match highlights Ittihad KSA vs Al Ain UAE',true,true],
 ['ملخصات أمس',false,false],
 ['ملخص موسم الاتحاد',false,false],
 ['أعطني إحصائيات محمد نور الكاملة',false,true],
 ['آخر مباراة للاتحاد',false,false],
 ['كيف تأسست كرة القدم؟',false,false],
 ['أخبار برشلونة اليوم',false,true],
 ['ملخص مباراة اليابان والبرازيل',true,true],
 ['ما هي نتيجة مباراة الاتحاد؟',false,false],
];
export async function GET(){
 if(process.env.VERCEL_ENV!=='preview')return NextResponse.json({error:'not found'},{status:404});
 const results=checks.map(([query,video,durable])=>({query,expected:{video,durable},actual:{video:isNamedVideoHighlights(query),durable:needsDurableResearch(query)}}));
 return NextResponse.json({passed:results.filter(x=>x.expected.video===x.actual.video&&x.expected.durable===x.actual.durable).length,total:results.length,results});
}
