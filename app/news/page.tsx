'use client';
import { useState } from 'react';
import Link from 'next/link';
import FootballNewsCards from '../components/FootballNewsCards';

export default function WorldNewsPage() {
 const [query,setQuery]=useState('');
 return <main dir="rtl" className="min-h-screen bg-emerald-950 text-white px-4 py-7 sm:px-8" style={{fontFamily:"'Cairo',sans-serif"}}>
  <div className="mx-auto max-w-5xl">
   <header className="flex flex-wrap items-center justify-between gap-3 mb-5">
    <div><p className="text-emerald-300 text-sm">AiFBall · الأخبار العالمية</p><h1 className="text-2xl sm:text-3xl font-black mt-1">آخر أخبار كرة القدم خلال 24 ساعة</h1></div>
    <Link href="/" className="rounded-xl border border-emerald-400/50 px-4 py-2 text-sm">العودة إلى فوتبلاي</Link>
   </header>
   <p className="text-sm text-emerald-100/80 mb-4">أبرز العناوين من السعودية وأوروبا وآسيا والعالم، مرتبة حسب وقت النشر. الأخبار مجمعة من ناشرين مختلفين، وليست جميعها مؤكدة رسمياً.</p>
   <label htmlFor="world-news-search" className="block text-sm font-bold mb-2">ابحث في الأخبار</label>
   <input id="world-news-search" type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="الاتحاد، الهلال، برشلونة، ريال مدريد، انتقالات..." className="w-full rounded-xl border border-emerald-500/40 bg-emerald-900/70 p-3 text-white placeholder:text-emerald-200/60 outline-none focus:border-emerald-300"/>
   <p className="text-xs text-emerald-200/70 mt-2">البحث يفلتر الأخبار المحمّلة فقط. عناوين بعض المصادر بلغتها الأصلية، والصور لا تُعرض دون مصدر موثوق لها.</p>
   <FootballNewsCards category="world" query={query} isDark />
  </div>
 </main>;
}
