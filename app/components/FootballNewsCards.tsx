'use client';

import { useEffect, useMemo, useState } from 'react';

type NewsPost = {
  id: string;
  author: string;
  text: string;
  url: string;
  publishedAt: string | null;
  images: string[];
  classification: 'unverified_search_result' | 'unverified_report';
};
type Feed = { status: string; provider?: string; posts?: NewsPost[]; failedSearches?: number; windowHours?: number };

function normalizedText(text: string) {
  return text.toLocaleLowerCase().replace(/https?:\/\/\S+/g, '').replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
}
function uniquePosts(posts: NewsPost[]) {
  const seenIds = new Set<string>();
  const seenTexts: string[] = [];
  return posts.filter(post => {
    const key = post.url.match(/(?:x\.com|twitter\.com)\/[^/]+\/status\/(\d+)/i)?.[1] || post.id;
    const text = normalizedText(post.text);
    if (!text || seenIds.has(key)) return false;
    const duplicate = seenTexts.some(previous => text === previous ||
      (Math.min(text.length, previous.length) >= 65 && (text.includes(previous) || previous.includes(text))));
    if (duplicate) return false;
    seenIds.add(key);
    seenTexts.push(text);
    return true;
  });
}
function PostImage({ src }: { src: string }) {
  const [failed, setFailed] = useState(false);
  if (failed || !/^https:\/\//i.test(src)) return null;
  return <img src={src} alt="صورة مرفقة بالمنشور" loading="lazy" onError={() => setFailed(true)}
    className="mt-3 max-h-52 w-full rounded-xl object-cover" />;
}

export default function FootballNewsCards({ category = 'general', isDark = true }: { category?: 'general' | 'transfers'; isDark?: boolean }) {
  const [feed, setFeed] = useState<Feed | null>(null);
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setFeed(null);
    fetch('/api/football-news?provider=auto&category=' + category + '&refresh=' + refresh, { signal: controller.signal, cache: 'no-store' })
      .then(async response => { if (!response.ok) throw new Error('News unavailable'); return response.json() as Promise<Feed>; })
      .then(data => { if (!controller.signal.aborted) setFeed(data); })
      .catch(() => { if (!controller.signal.aborted) setFeed({ status: 'upstream_unavailable', posts: [] }); });
    return () => controller.abort();
  }, [category, refresh]);

  const posts = useMemo(() => {
    const now = Date.now();
    const fresh = (feed?.posts || []).filter(post => {
      if (!post.publishedAt) return false;
      const date = Date.parse(post.publishedAt);
      return Number.isFinite(date) && date <= now + 5 * 60_000 && date >= now - 72 * 3_600_000;
    });
    return uniquePosts(fresh).sort((a,b)=>Date.parse(b.publishedAt!) - Date.parse(a.publishedAt!)).slice(0, 6);
  }, [feed]);
  const panel = isDark ? 'bg-black/25 border-white/15 text-white' : 'bg-white border-gray-200 text-gray-900';


  return (
    <section dir="rtl" className="mt-4 space-y-3" aria-label={category === 'transfers' ? 'منشورات الانتقالات' : 'منشورات الأخبار الكروية'}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-bold text-sm">{category === 'transfers' ? 'منشورات الانتقالات' : 'منشورات الأخبار'}</h3>
        <button type="button" onClick={()=>setRefresh(n=>n+1)} className="text-xs font-bold text-emerald-400 underline underline-offset-2">تحديث الأخبار</button>
      </div>
      {!feed && <p className="text-xs opacity-70">جارٍ البحث في المصادر المختارة…</p>}
      {feed && <p className="text-xs opacity-75">{feed.provider === 'x' ? 'منشورات مؤرخة خلال آخر 72 ساعة · X' : 'نتائج بحث DuckDuckGo لا تتضمن تاريخ نشر موثقاً؛ لذلك لا نعرضها كأخبار حديثة.'}</p>}
      {feed && posts.length === 0 && <p className="text-xs opacity-75">لا توجد أخبار حديثة بتاريخ موثق من المصادر المتاحة حالياً. لن نعرض منشورات قديمة باعتبارها جديدة.</p>}
      {posts.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {posts.map(post => {
            const validDate = post.publishedAt && !Number.isNaN(Date.parse(post.publishedAt));
            const date = validDate ? new Date(post.publishedAt!).toLocaleDateString('ar-SA', { timeZone: 'Asia/Riyadh', day: 'numeric', month: 'long', year: 'numeric' }) : null;
            return (
              <article key={post.id} className={`min-w-0 rounded-2xl border p-3 ${panel}`}>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-xs font-bold" dir="ltr">@{post.author}</span>
                  <span className="text-[11px] opacity-65">{date || 'تاريخ غير متحقق'}</span>
                </div>
                <p className="whitespace-pre-wrap break-words text-sm leading-6">{post.text}</p>
                {post.images?.[0] && <PostImage key={post.images[0]} src={post.images[0]} />}
                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="text-[11px] opacity-65">منشور من حساب مختار · محتواه غير مؤكد</span>
                  {/^https:\/\/(?:www\.)?(?:x\.com|twitter\.com)\//i.test(post.url) && (
                    <a href={post.url} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-emerald-500 underline underline-offset-2">المصدر: X</a>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
      {posts.length > 0 && <p className="text-[11px] opacity-65">تاريخ المنشور موثق من واجهة X، لكن صحة محتوى الخبر تحتاج تأكيداً من مصدر رسمي.</p>}
      {feed?.status === 'partial' && <p className="text-xs opacity-65">تعذر البحث في بعض الحسابات.</p>}
    </section>
  );
}
