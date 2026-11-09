'use client';

import { useEffect, useState } from 'react';

type NewsPost = {
  id: string;
  author: string;
  text: string;
  url: string;
  publishedAt: string | null;
  images: string[];
  classification: 'unverified_search_result' | 'unverified_report';
};
type Feed = { status: string; provider?: string; posts?: NewsPost[]; failedSearches?: number };

export default function FootballNewsCards({ category = 'general', isDark = true }: { category?: 'general' | 'transfers'; isDark?: boolean }) {
  const [feed, setFeed] = useState<Feed | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    setFeed(null);
    fetch('/api/football-news?provider=duckduckgo&category=' + category, { signal: controller.signal })
      .then(async response => { if (!response.ok) throw new Error('News unavailable'); return response.json() as Promise<Feed>; })
      .then(data => setFeed(data))
      .catch(() => { if (!controller.signal.aborted) setFeed({ status: 'upstream_unavailable', posts: [] }); });
    return () => controller.abort();
  }, [category]);

  const posts = (feed?.posts || []).slice(0, 8);
  const panel = isDark ? 'bg-black/25 border-white/15 text-white' : 'bg-white border-gray-200 text-gray-900';
  return (
    <section dir="rtl" className="mt-4 space-y-3" aria-label={category === 'transfers' ? 'مصادر أخبار الانتقالات' : 'مصادر الأخبار الكروية'}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-bold text-sm">{category === 'transfers' ? 'منشورات الانتقالات' : 'منشورات الأخبار'}</h3>
        <span className="text-xs opacity-65">بحث DuckDuckGo</span>
      </div>
      {!feed && <p className="text-xs opacity-70">جارٍ البحث في المصادر المختارة…</p>}
      {feed && !posts.length && <p className="text-xs opacity-70">لم نعثر على منشورات قابلة للعرض من الحسابات المحددة. لا يعني ذلك عدم وجود أخبار.</p>}
      {posts.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {posts.map(post => (
            <article key={post.id} className={`min-w-0 rounded-2xl border p-3 ${panel}`}>
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-xs font-bold" dir="ltr">@{post.author}</span>
                <span className="text-[11px] opacity-65">{post.publishedAt ? new Date(post.publishedAt).toLocaleString('ar-SA', { timeZone: 'Asia/Riyadh' }) : 'التاريخ غير متحقق'}</span>
              </div>
              <p className="line-clamp-4 whitespace-pre-wrap break-words text-sm leading-6">{post.text}</p>
              {post.images?.length > 0 && <img src={post.images[0]} alt="صورة من المنشور" loading="lazy" className="mt-2 max-h-48 w-full rounded-xl object-cover" />}
              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="text-[11px] opacity-65">نتيجة بحث غير مؤكدة</span>
                <a href={post.url} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-emerald-500 underline underline-offset-2">عرض المنشور الأصلي</a>
              </div>
            </article>
          ))}
        </div>
      )}
      {posts.length > 0 && <p className="text-[11px] opacity-65">هذه نتائج فهرسة وليست أخبارًا مؤكدة أو مرتبة زمنيًا. تحقق من تاريخ المنشور ومصدر الخبر قبل الاعتماد عليه.</p>}
      {feed?.status === 'partial' && <p className="text-xs opacity-65">تعذر البحث في بعض الحسابات.</p>}
    </section>
  );
}
