import type { Metadata } from "next";
import React from "react";
import "./styles/globals.css";

export const metadata: Metadata = {
  title: "فوتبلاي | مساعدك الرياضي",
  description: "منصة فوتبلاي للذكاء الاصطناعي الرياضي",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className="h-full">
      <body className="h-full bg-[#131314] text-[#E3E3E3] antialiased selection:bg-[#006C35] selection:text-white">
        {children}
      </body>
    </html>
  );
}
