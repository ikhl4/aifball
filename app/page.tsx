'use client';
import React from 'react';

export default function FootPlayEmbed() {
  return (
    <div dir="rtl" className="flex flex-col h-screen bg-[#131314] text-[#E3E3E3] font-sans m-0 p-0 overflow-hidden">
      {/* رأس الصفحة الاحترافي */}
      <header className="flex items-center justify-between px-6 py-3 bg-[#131314] border-b border-gray-800/60 z-10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#006C35] flex items-center justify-center font-bold text-white shadow-md">
            ⚽
          </div>
          <span className="text-lg font-bold tracking-wide text-white">
            فوتبلاي
          </span>
        </div>
        <span className="text-xs text-gray-400">
          منصة فوتبلاي للذكاء الاصطناعي الرياضي • by خالد العايش
        </span>
      </header>

      {/* شاشة العرض المباشر للـ Agent الأصلي */}
      <main className="flex-1 w-full h-full relative">
        <iframe
          src="https://udify.app/agent/xSpnNgWgRTmqQ0A3"
          style={{ width: '100%', height: '100%', border: 'none' }}
          allow="microphone; clipboard-write"
          title="فوتبلاي المحلل الذكي"
        />
      </main>
    </div>
  );
}
