'use client';
import React from 'react';

export default function FootPlayEmbed() {
  return (
    <div dir="rtl" className="flex flex-col h-screen bg-[#131314] text-[#E3E3E3] font-sans m-0 p-0 overflow-hidden">
      {/* شاشة العرض المباشر للـ Agent الأصلي */}
      <div className="flex-1 w-full h-full">
        <iframe
          src="https://udify.app/agent/xSpnNgWgRTmqQ0A3"
          style={{ width: '100%', height: '100%', border: 'none' }}
          allow="microphone; clipboard-write"
        />
      </div>
    </div>
  );
}
