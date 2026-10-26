import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'فوتبلاي - مساعدك الرياضي',
    short_name: 'فوتبلاي',
    description: 'منصة فوتبلاي للذكاء الاصطناعي الرياضي',
    start_url: '/',
    display: 'standalone',
    background_color: '#131314',
    theme_color: '#1D6B35',
    icons: [
      {
        src: '/IMG_0218.jpeg', // اسم صورتك الأولى
        sizes: '192x192',
        type: 'image/jpeg',
      },
      {
        src: '/IMG_0219.jpeg', // اسم صورتك الثانية
        sizes: '512x512',
        type: 'image/jpeg',
      },
    ],
  };
}
