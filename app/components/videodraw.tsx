'use client';
import React, { useRef, useState, useEffect } from 'react';

export default function VideoDraw() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#FF0000'); // أحمر افتراضي

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 3;
      }
    }
  }, []);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx) ctx.beginPath(); // بدء مسار جديد
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.strokeStyle = color;
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  return (
    <div className="w-full bg-[#0B0F19] rounded-3xl p-4 sm:p-6 shadow-2xl border border-gray-800 font-saudi text-white">
      
      {/* أدوات التحكم */}
      <div className="flex justify-between items-center mb-4 bg-[#131A2A] p-3 rounded-xl border border-gray-700">
        <div className="flex gap-2">
          <button onClick={() => setColor('#FF0000')} className={`w-6 h-6 rounded-full bg-red-500 ${color === '#FF0000' ? 'ring-2 ring-white' : ''}`}></button>
          <button onClick={() => setColor('#0000FF')} className={`w-6 h-6 rounded-full bg-blue-500 ${color === '#0000FF' ? 'ring-2 ring-white' : ''}`}></button>
          <button onClick={() => setColor('#FFFF00')} className={`w-6 h-6 rounded-full bg-yellow-400 ${color === '#FFFF00' ? 'ring-2 ring-white' : ''}`}></button>
        </div>
        <button 
          onClick={() => {
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext('2d');
            if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
          }}
          className="bg-red-600 hover:bg-red-700 px-4 py-1.5 rounded-lg text-xs font-bold transition-colors"
        >
          مسح الرسم
        </button>
      </div>

      {/* الفيديو والرسم */}
      <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-gray-700 cursor-crosshair">
        <video 
          controls 
          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
          poster="https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=2000&auto=format&fit=crop"
        >
          {/* يمكنك وضع رابط فيديو حقيقي هنا */}
          {/* <source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4" /> */}
        </video>

        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full z-10"
          width={800}
          height={450}
          onMouseDown={startDrawing}
          onMouseUp={stopDrawing}
          onMouseOut={stopDrawing}
          onMouseMove={draw}
          onTouchStart={startDrawing}
          onTouchEnd={stopDrawing}
          onTouchMove={draw}
        />
      </div>
      <p className="text-center text-xs text-gray-500 mt-3">استخدم الماوس أو إصبعك للرسم على الفيديو لتوضيح التحركات للاعبين</p>
    </div>
  );
}
