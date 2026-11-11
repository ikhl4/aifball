'use client';
import { useMemo, useState } from 'react';
type Deal={player:string;from:string;to:string;league:'السعودي'|'الإسباني';source:string;kind?:string};
const deals:Deal[]=[
 {player:'جورجينيو فينالدوم',from:'الاتفاق',to:'الاتحاد',league:'السعودي',kind:'انتقال حر',source:'https://www.ittihadclub.sa/ar/news/wijnaldum-signs-for-al-ittihad-arabic'},
 {player:'تيجاني رايندرز',from:'مانشستر سيتي',to:'القادسية',league:'السعودي',source:'https://www.spl.com.sa/en/news/al-qadsiah-bolster-ranks-by-bringing-reijnders-from-manchester-city'},
 {player:'إبراهيما كوناتي',from:'ليفربول',to:'ريال مدريد',league:'الإسباني',source:'https://www.laliga.com/en-US/news/repasa-el-mercado-de-fichajes-de-laliga-ea-sports-2026-27'},
 {player:'رودري',from:'مانشستر سيتي',to:'برشلونة',league:'الإسباني',source:'https://www.laliga.com/en-US/news/repasa-el-mercado-de-fichajes-de-laliga-ea-sports-2026-27'},
 {player:'غابرييل جيسوس',from:'أرسنال',to:'برشلونة',league:'الإسباني',source:'https://www.laliga.com/en-US/news/repasa-el-mercado-de-fichajes-de-laliga-ea-sports-2026-27'},
 {player:'أنتوني غوردون',from:'نيوكاسل',to:'برشلونة',league:'الإسباني',source:'https://www.laliga.com/en-US/news/repasa-el-mercado-de-fichajes-de-laliga-ea-sports-2026-27'},
 {player:'برناردو سيلفا',from:'مانشستر سيتي',to:'ريال مدريد',league:'الإسباني',source:'https://www.laliga.com/en-US/news/repasa-el-mercado-de-fichajes-de-laliga-ea-sports-2026-27'},
 {player:'مارك كوكوريّا',from:'تشيلسي',to:'ريال مدريد',league:'الإسباني',source:'https://www.laliga.com/en-US/news/repasa-el-mercado-de-fichajes-de-laliga-ea-sports-2026-27'},
 {player:'ريتشارد ريوس',from:'بنفيكا',to:'الاتحاد',league:'السعودي',kind:'إعارة',source:'https://www.ittihadclub.sa/en/news/richard-rios-joins-al-ittihad'},
 {player:'أولي واتكينز',from:'أستون فيلا',to:'الهلال',league:'السعودي',source:'https://www.spl.com.sa/en/2026-27-summer-transfer-watch'},
 {player:'غابرييل مارتينيلي',from:'أرسنال',to:'الهلال',league:'السعودي',source:'https://www.spl.com.sa/en/2026-27-summer-transfer-watch'},
 {player:'سفيان الكرواني',from:'أوتريخت',to:'القادسية',league:'السعودي',source:'https://www.spl.com.sa/en/2026-27-summer-transfer-watch'},
 {player:'ديوان لوبي',from:'ألميريا',to:'الاتحاد',league:'السعودي',source:'https://www.spl.com.sa/en/2026-27-summer-transfer-watch'},
 {player:'كانغ إن لي',from:'باريس سان جيرمان',to:'أتلتيكو مدريد',league:'الإسباني',source:'https://www.laliga.com/en-US/news/repasa-el-mercado-de-fichajes-de-laliga-ea-sports-2026-27'},
 {player:'يوسف فوفانا',from:'ميلان',to:'إشبيلية',league:'الإسباني',kind:'إعارة',source:'https://www.laliga.com/en-US/news/repasa-el-mercado-de-fichajes-de-laliga-ea-sports-2026-27'}
];
export default function ConfirmedSummerDeals(){
 const [league,setLeague]=useState('الكل');const [search,setSearch]=useState('');const [page,setPage]=useState(1);
 const filtered=useMemo(()=>deals.filter(d=>(league==='الكل'||d.league===league)&&(!search.trim()||[d.player,d.from,d.to].join(' ').includes(search.trim()))),[league,search]);
 return <section dir="rtl" className="mt-5" style={{fontFamily:"'Cairo',sans-serif"}}>
  <div className="rounded-2xl border border-emerald-300/20 bg-emerald-900/20 p-4 sm:p-6">
   <div className="flex flex-wrap justify-between gap-2 items-center"><h2 className="text-xl sm:text-2xl font-black">الانتقالات الرسمية · صيف 2026</h2><span className="text-xs text-lime-300">{filtered.length} انتقالاً موثقاً</span></div>
   <p className="text-sm text-emerald-100/70 mt-2">اللاعب والنادي السابق والجديد، وفق بيانات الأندية والدوريات الرسمية.</p>
   <input type="search" value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="ابحث عن لاعب أو نادٍ..." className="mt-4 w-full rounded-xl border border-emerald-300/30 bg-emerald-950 p-3 text-white placeholder:text-emerald-100/50"/>
   <div className="flex gap-2 mt-3">{['الكل','السعودي','الإسباني'].map(x=><button key={x} onClick={()=>{setLeague(x);setPage(1);}} className={'rounded-full px-4 py-2 text-xs border '+(league===x?'bg-lime-300 text-emerald-950 border-lime-300':'border-white/20 text-white')}>{x}</button>)}</div>
  </div>
  <div className="grid sm:grid-cols-2 gap-3 mt-4">{filtered.slice((page-1)*8,page*8).map(d=><article key={d.player} className="rounded-2xl border border-emerald-300/20 bg-[#10231a] p-4">
   <div className="flex justify-between items-center gap-2"><span className="text-xs text-lime-300 font-bold">انتقال رسمي · {d.league}</span><span className="text-xs text-emerald-100/70">{d.kind||'صيف 2026'}</span></div>
   <h3 className="text-lg font-black mt-3">{d.player}</h3>
   <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center mt-4 text-center"><div className="rounded-xl bg-emerald-950 p-3"><small className="block text-emerald-200/60">من</small><strong>{d.from}</strong></div><span className="text-lime-300 text-xl">←</span><div className="rounded-xl bg-emerald-950 p-3"><small className="block text-emerald-200/60">إلى</small><strong>{d.to}</strong></div></div>
   <a href={d.source} target="_blank" rel="noopener noreferrer" className="inline-block mt-4 text-sm text-emerald-300 underline underline-offset-4">المصدر الرسمي</a>
  </article>)}</div>
  {filtered.length>8&&<div className="flex justify-center items-center gap-4 mt-5"><button disabled={page===1} onClick={()=>setPage(p=>p-1)} className="disabled:opacity-30">السابق</button><span>صفحة {page} من {Math.ceil(filtered.length/8)}</span><button disabled={page*8>=filtered.length} onClick={()=>setPage(p=>p+1)} className="disabled:opacity-30">التالي</button></div>}
 </section>;
}
