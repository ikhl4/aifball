'use client';

import { useMemo, useState } from 'react';

type Row = { name: string; age: number; club: string; destination?: string; value: number; position: string; league: string; photo?: string; badge?: string; fee?: string; status?: string };
const summer: Row[] = [
  { name: 'جورجينيو فينالدوم', age: 35, club: 'الاتفاق', destination: 'الاتحاد', value: 3, position: 'وسط', league: 'السعودي', photo: '108038', badge: '8577', fee: 'انتقال حر' },
  { name: 'تيجاني ريندرز', age: 28, club: 'مانشستر سيتي', destination: 'القادسية', value: 45, position: 'وسط', league: 'السعودي', photo: '868344', badge: '101919', fee: 'غير معلنة' },
  { name: 'كريسينسيو سامرفيل', age: 25, club: 'وست هام', destination: 'الهلال', value: 28, position: 'جناح', league: 'السعودي', photo: '941213', badge: '2529', fee: 'غير معلنة' },
  { name: 'مورغان روجرز', age: 24, club: 'أستون فيلا', destination: 'تشيلسي', value: 70, position: 'وسط هجومي', league: 'الإنجليزي', photo: '883080', badge: '8455', fee: 'غير مؤكدة' },
];
const ending: Row[] = [
  { name: 'برونو فرنانديز', age: 32, club: 'مانشستر يونايتد', value: 35, position: 'وسط هجومي', league: 'الإنجليزي', photo: '424863', badge: '10260', status: 'تحقق من تاريخ العقد' },
  { name: 'جواو فيليكس', age: 27, club: 'النصر', value: 28, position: 'مهاجم', league: 'السعودي', photo: '932732', badge: '101918', status: 'تحقق من تاريخ العقد' },
  { name: 'فيرجيل فان دايك', age: 35, club: 'ليفربول', value: 15, position: 'قلب دفاع', league: 'الإنجليزي', photo: '289136', badge: '8650', status: 'تحقق من تاريخ العقد' },
];
const free: Row[] = [
  { name: 'جادون سانشو', age: 26, club: 'آخر نادٍ: يُتحقق منه', value: 10, position: 'جناح', league: 'الإنجليزي', photo: '798977', status: 'حالة اللاعب تحتاج تحققًا مباشرًا' },
  { name: 'بول بوغبا', age: 33, club: 'آخر نادٍ: يُتحقق منه', value: 2, position: 'وسط', league: 'الفرنسي', photo: '19555', status: 'حالة اللاعب تحتاج تحققًا مباشرًا' },
];
type Tab = 'summer' | 'winter' | 'ending' | 'free';
const tabs: {id:Tab;title:string}[] = [
  {id:'summer',title:'انتقالات صيف 2026'}, {id:'winter',title:'انتقالات يناير 2027'},
  {id:'ending',title:'نهاية العقود'}, {id:'free',title:'اللاعبون الأحرار'}
];
const leagues = ['الكل','السعودي','الإنجليزي','الإسباني','الإيطالي','الألماني','الفرنسي'];
const format = (n:number) => '€' + n.toFixed(1) + ' مليون';
export default function TransfersPreview() {
  const [tab,setTab] = useState<Tab>('summer');
  const [league,setLeague] = useState('الكل');
  const [query,setQuery] = useState('');
  const [sort,setSort] = useState<'value'|'age'|'name'>('value');
  const source = tab==='summer'?summer:tab==='ending'?ending:tab==='free'?free:[];
  const rows = useMemo(()=>source.filter(r=>(league==='الكل'||r.league===league)&&(`${r.name} ${r.club} ${r.destination||''}`.toLowerCase().includes(query.trim().toLowerCase()))).sort((a,b)=>sort==='value'?b.value-a.value:sort==='age'?a.age-b.age:a.name.localeCompare(b.name,'ar')),[source,league,query,sort]);
  return <main dir="rtl" className="transferPreview">
    <header className="top"><a href="/" className="back">العودة للرئيسية</a><strong>AiFBall · فوتبلاي</strong></header>
    <div className="intro"><span>مركز الانتقالات العالمي · موسم 2026/27</span><h1>سوق الانتقالات<span> بالأرقام.</span></h1><p>الصفقات، القيمة السوقية، نهاية العقود واللاعبون الأحرار — في جداول عربية سهلة التصفح.</p></div>
    <nav className="tabs" aria-label="أقسام سوق الانتقالات">{tabs.map(t=><button key={t.id} className={tab===t.id?'active':''} onClick={()=>{setTab(t.id);setLeague('الكل');setQuery('')}}>{t.title}</button>)}</nav>
    <section className="panel">
      <div className="panelTitle"><div><small>مركز بيانات فوتبلاي</small><h2>{tabs.find(t=>t.id===tab)?.title}</h2><p>{tab==='winter'?'لا توجد صفقات شتوية مؤكدة مدخلة في هذه المعاينة.':tab==='summer'?'من النادي السابق إلى النادي الجديد، مع القيمة السوقية ورسوم الانتقال.':tab==='ending'?'أسماء مرشحة للمتابعة؛ لا يُعتمد انتهاء العقد قبل التحقق من تاريخه.':'قائمة عرض تجريبية؛ حالة اللاعب الحر تحتاج تحققًا من المصدر.'}</p></div><span className="count">{rows.length} لاعب</span></div>
      <div className="tools"><input aria-label="البحث" placeholder="ابحث باسم لاعب أو نادٍ..." value={query} onChange={e=>setQuery(e.target.value)}/><select aria-label="الترتيب" value={sort} onChange={e=>setSort(e.target.value as typeof sort)}><option value="value">الأعلى قيمة سوقية</option><option value="age">الأصغر عمرًا</option><option value="name">ترتيب الاسم</option></select></div>
      <div className="filters">{leagues.map(l=><button key={l} onClick={()=>setLeague(l)} className={league===l?'selected':''}>{l}</button>)}</div>
      <div className="tableScroller"><table><thead><tr><th>اللاعب</th><th>العمر</th><th>{tab==='summer'?'من النادي':'النادي / آخر نادٍ'}</th>{tab==='summer'&&<th>إلى النادي</th>}<th>القيمة السوقية</th><th>{tab==='summer'?'قيمة الصفقة':'الحالة'}</th></tr></thead><tbody>{rows.map(r=><tr key={r.name}><td><div className="player"><div className="avatar">{r.photo?<img src={`https://images.fotmob.com/image_resources/playerimages/${r.photo}.png`} alt="" onError={e=>{e.currentTarget.style.display='none'}}/>:null}</div><div><b>{r.name}</b><small>{r.position} · {r.league}</small></div></div></td><td>{r.age}</td><td>{r.club}</td>{tab==='summer'&&<td><span className="club">{r.badge&&<img src={`https://images.fotmob.com/image_resources/logo/teamlogo/${r.badge}.png`} alt="" onError={e=>{e.currentTarget.style.display='none'}}/>}{r.destination}</span></td>}<td className="marketValue">{format(r.value)}</td><td className="status">{r.fee||r.status||'—'}</td></tr>)}</tbody></table>{!rows.length&&<div className="empty"><b>{tab==='winter'?'لا توجد صفقات مؤكدة للعرض حاليًا':'لا توجد نتائج مطابقة'}</b><p>{tab==='winter'?'يبقى القسم جاهزًا، ولا نضيف إليه شائعات أو صفقات صيفية.':'غيّر الدوري أو عبارة البحث.'}</p></div>}</div>
      <div className="notice"><b>معاينة تصميمية وليست قاعدة بيانات حية.</b> الأسماء والقيم المعروضة عينات لتوضيح الشكل، وبعض الحالات غير محققة. لا تُعامل القائمة على أنها تصنيف ترانسفير ماركت الرسمي أو بيانات محدثة. قبل النشر النهائي سنربط الصفوف بمصادر موثقة، مع الفصل بين القيمة السوقية ورسوم الانتقال.</div>
    </section>
    <style jsx>{`
      *{box-sizing:border-box}.transferPreview{min-height:100vh;background:#06130e;color:#f5fff9;font-family:Cairo,Tahoma,Arial,sans-serif;padding:24px max(16px,calc((100vw - 1120px)/2)) 80px}.top{display:flex;align-items:center;justify-content:space-between;padding:12px 0 22px;border-bottom:1px solid #24483a;color:#88e7bb}.back{color:#d8f9e6;text-decoration:none;border:1px solid #3c6856;border-radius:12px;padding:9px 15px}.intro{padding:50px 0 28px}.intro>span,.panelTitle small{color:#c6ef7d;font-weight:700}.intro h1{font-size:clamp(34px,6vw,62px);line-height:1.3;margin:10px 0}.intro h1 span{color:#c8f47b}.intro p,.panelTitle p{color:#9db9ab;font-size:15px;line-height:1.9}.tabs{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-bottom:26px}.tabs button{background:#0e251b;color:white;border:1px solid #345a47;border-radius:14px;padding:16px 8px;font:700 15px Cairo,Tahoma,Arial;cursor:pointer}.tabs button.active{background:#c7f47a;color:#0a2218;border-color:#c7f47a}.panel{background:#0c2018;border:1px solid #315744;border-radius:24px;padding:22px}.panelTitle{display:flex;justify-content:space-between;align-items:start;gap:12px}.panelTitle h2{font-size:27px;margin:4px 0}.panelTitle p{margin:0 0 20px}.count{color:#d0f58e;white-space:nowrap;font-size:13px}.tools{display:flex;gap:10px;margin:12px 0}.tools input,.tools select{background:#102b20;border:1px solid #3b6953;border-radius:12px;padding:13px;color:white;font:inherit;min-width:0}.tools input{flex:1}.tools select{max-width:190px}.filters{display:flex;gap:8px;overflow-x:auto;padding:8px 0 18px}.filters button{white-space:nowrap;background:transparent;color:#d2e6d9;border:1px solid #466a57;border-radius:99px;padding:8px 16px;font:inherit;cursor:pointer}.filters button.selected{background:#8fe3b7;color:#062316}.tableScroller{overflow-x:auto;border:1px solid #2b4c3d;border-radius:14px}table{width:100%;border-collapse:collapse;min-width:690px;text-align:right}th{background:#16382a;color:#bce9cd;padding:15px 12px;font-size:13px;white-space:nowrap}td{border-top:1px solid #284638;padding:12px;font-size:14px}tbody tr:nth-child(even){background:#10271d}.player{display:flex;align-items:center;gap:11px;min-width:180px}.player b,.player small{display:block}.player small{font-size:11px;color:#a3bcae;margin-top:3px}.avatar{width:43px;height:49px;flex-shrink:0;border-radius:8px;background:#254d3b;overflow:hidden}.avatar img{width:100%;height:100%;object-fit:cover}.club{display:flex;align-items:center;gap:8px;white-space:nowrap}.club img{width:25px;height:25px;object-fit:contain}.marketValue{font-weight:800;color:#cbf482;white-space:nowrap}.status{color:#b6c8be;min-width:105px}.empty{text-align:center;padding:52px 12px;color:#d4e7d8}.empty p{color:#9cb4a5}.notice{color:#a8beaf;font-size:12px;line-height:2;padding:18px 4px}.notice b{color:#d0f48a}@media(max-width:620px){.transferPreview{padding:16px 12px 55px}.intro{padding:32px 4px 22px}.tabs{grid-template-columns:repeat(2,minmax(0,1fr))}.tabs button{font-size:13px;padding:13px 5px}.panel{padding:14px}.panelTitle h2{font-size:22px}.tools{flex-wrap:wrap}.tools input{flex-basis:100%}.tools select{max-width:none;width:100%}}
    `}</style>
  </main>;
}
