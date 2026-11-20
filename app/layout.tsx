import { ClerkProvider } from '@clerk/nextjs';
import localFont from 'next/font/local';
import './globals.css';

const thmanyah = localFont({
  src: [
    { path: './fonts/thmanyah/thmanyahsans-Light.woff2', weight: '300', style: 'normal' },
    { path: './fonts/thmanyah/thmanyahsans-Regular.woff2', weight: '400', style: 'normal' },
    { path: './fonts/thmanyah/thmanyahsans-Medium.woff2', weight: '500', style: 'normal' },
    { path: './fonts/thmanyah/thmanyahsans-Bold.woff2', weight: '700', style: 'normal' },
    { path: './fonts/thmanyah/thmanyahsans-Black.woff2', weight: '900', style: 'normal' },
  ],
  variable: '--font-thmanyah',
  display: 'swap',
});

export const metadata = {
  icons: {
    icon: [{ url: '/aifball-icon-180.png', sizes: '64x64', type: 'image/png' }],
    shortcut: '/aifball-icon-180.png',
    apple: [{ url: '/aifball-icon-180.png', sizes: '64x64', type: 'image/png' }],
  },
  title: 'AiFBall - فوتبلاي',
  description: 'منصة فوتبلاي للذكاء الاصطناعي الرياضي',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="ar" dir="rtl" className={thmanyah.variable}>
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
