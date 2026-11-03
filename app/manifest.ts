import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'فوتبلاي',
    short_name: 'فوتبلاي',
    lang: 'ar',
    dir: 'rtl',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#071812',
    theme_color: '#071812',
    icons: [
      { src: '/aifball-icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/aifball-icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
