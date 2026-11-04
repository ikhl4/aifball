import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';

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
      <html lang="ar" dir="rtl">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
