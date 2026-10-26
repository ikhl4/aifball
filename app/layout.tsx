import type { Metadata, Viewport } from "next";
import React from "react";
import "./styles/globals.css";

export const metadata: Metadata = {
  title: "فوتبلاي | مساعدك الرياضي",
  description: "منصة فوتبلاي للذكاء الاصطناعي الرياضي",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "فوتبلاي",
  },
  icons: {
    apple: "/IMG_0218.jpeg",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#1D6B35",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
