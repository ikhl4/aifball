'use client';

import { useEffect, useState } from 'react';
import ChatImageCard from './ChatImageCard';

type ImageResult = { image: string | null; alt?: string; caption?: string; source?: string };

export default function AutoChatImage({ query, isDark = true }: { query: string; isDark?: boolean }) {
  const [result, setResult] = useState<ImageResult | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    setResult(null);
    fetch('/api/chat-image?q=' + encodeURIComponent(query), { signal: controller.signal })
      .then(response => response.ok ? response.json() : null)
      .then(data => { if (!controller.signal.aborted) setResult(data); })
      .catch(() => {});
    return () => controller.abort();
  }, [query]);
  if (!result?.image) return null;
  return (
    <div className="my-4">
      <ChatImageCard url={result.image} alt={result.alt || 'صورة اللاعب'} isDark={isDark} />
      <p className="mt-1 text-xs text-gray-400">{result.caption}</p>
    </div>
  );
}
