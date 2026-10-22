import './styles/globals.css';
import React from 'react';

export const metadata = {
  title: 'AiFBall | المحلل الرياضي الذكي',
  description: 'منصة الذكاء الاصطناعي للتحليل الفني وإحصائيات وتاريخ كرة القدم',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className="bg-[#131314] text-[#E3E3E3] antialiased selection:bg-[#006C35] selection:text-white">
        {children}
      </body>
    </html>
  );
}