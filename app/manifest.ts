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
    icons: [{ src: '/app-icon.svg', sizes: 'any', type: 'image/svg+xml' }],
  };
}
