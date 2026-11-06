'use client';

import { useEffect, useState } from 'react';
import SportsImageCard from './SportsImageCard';

type LicensedPhoto = {
  url: string;
  sourceUrl: string;
  sourceName: string;
  license: string;
  artist?: string;
  alt: string;
};

/** Fetches a source-linked archive portrait only when Wikidata identity is
 * unique and Wikimedia reports a usable image license. */
export default function SportsAutoImage({ subject, isDark = true }: { subject: string; isDark?: boolean }) {
  const [image, setImage] = useState<LicensedPhoto | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    setImage(null);
    if (!subject.trim()) return () => controller.abort();
    fetch('/api/sports-image?subject=' + encodeURIComponent(subject.trim()), { signal: controller.signal })
      .then(response => response.ok ? response.json() as Promise<{ image?: LicensedPhoto | null }> : null)
      .then(data => { if (!controller.signal.aborted) setImage(data?.image || null); })
      .catch(() => { if (!controller.signal.aborted) setImage(null); });
    return () => controller.abort();
  }, [subject]);

  if (!image) return null;
  return <SportsImageCard
    src={image.url}
    alt={image.alt}
    sourceUrl={image.sourceUrl}
    sourceName={image.sourceName}
    license={image.license}
    artist={image.artist}
    isDark={isDark}
  />;
}
