'use client';
import React from 'react';

export default function FootPlayApp() {
  return (
    <div dir="rtl" className="flex flex-col h-screen bg-[#131314] text-[#E3E3E3] font-sans m-0 p-0 overflow-hidden">
      <header className="flex items-center justify-between px-6 py-4 bg-[#131314]/90 backdrop-blur-md z-10 border-b border-gray-800/50 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#006C35] flex items-center justify-center font-bold text-white shadow-lg shadow-[#006C35]/30">
            ⚽
          </div>
          <span className="text-xl font-bold tracking-wide bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            فوتبلاي
          </span>
        </div>
        <span className="text-xs text-[#8E918F] hidden sm:inline">
          منصة فوتبلاي للذكاء الاصطناعي الرياضي • by خالد العايش
        </span>
      </header>

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
