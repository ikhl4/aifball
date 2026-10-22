'use client';
import React, { useState, useRef, useEffect } from 'react';

export default function FootPlayGemini() {
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const suggestions = [
    { icon: '📊', title: 'ترتيب دوري روشن', prompt: 'ما هو جدول ترتيب دوري روشن السعودي لموسم 2026-2027 وأبرز الإحصائيات؟' },
    { icon: '📋', title: 'تحليل تكتيكي', prompt: 'قدم لي تحليلاً تكتيكياً لأسلوب لعب الاتحاد مع الالماني فيسينغ.' },
    { icon: '🏆', title: 'سجل الأبطال التاريخي', prompt: 'ما هو السجل التاريخي الكامل لأبطال الدوري الإنجليزي؟' },
    { icon: '⚽', title: 'العمل الجماعي', prompt: 'أعلى xg لفريق هذا الموسم في الدوريات الخمسة الكبرى' },
  ];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    setMessages((prev) => [...prev, { role: 'user', content: query }]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, conversation_id: conversationId }),
      });
      const data = await res.json();
      if (data.conversation_id) setConversationId(data.conversation_id);
      setMessages((prev) => [...prev, { role: 'ai', content: data.answer || 'لم أتمكن من جلب الإحصائيات حالياً.' }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'ai', content: 'تعذر الاتصال بالخادم، حاول مرة أخرى.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir="rtl" className="flex flex-col h-screen bg-[#131314] text-[#E3E3E3] font-sans">
      <header className="flex items-center justify-between px-6 py-4 bg-[#131314]/90 backdrop-blur-md sticky top-0 z-10 border-b border-gray-800/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#006C35] flex items-center justify-center font-bold text-white shadow-lg shadow-[#006C35]/30">
            ⚽
          </div>
          <span className="text-xl font-bold tracking-wide bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            فوتبلاي
          </span>
        </div>
        <button
          onClick={() => { setMessages([]); setConversationId(''); }}
          className="text-sm bg-[#1E1F20] hover:bg-[#282A2C] text-gray-300 px-4 py-2 rounded-full transition border border-gray-800"
        >
          + محادثة جديدة
        </button>
      </header>

      <main className="flex-1 overflow-y-auto px-4 md:px-0">
        <div className="max-w-3xl mx-auto py-8">
          {messages.length === 0 ? (
            <div className="mt-10 md:mt-16 space-y-10">
              <div className="space-y-3">
                <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-l from-[#00A859] via-[#4ADE80] to-white bg-clip-text text-transparent pb-2">
                  أهلاً بك في فوتبلاي
                </h1>
                <p className="text-xl md:text-2xl text-[#8E918F] font-medium">
                  محللك التكتيكي ومرجعك الإحصائي والتاريخي لكرة القدم.. كيف أساعدك اليوم؟
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
                {suggestions.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => sendMessage(item.prompt)}
                    className="flex flex-col justify-between p-4 rounded-2xl bg-[#1E1F20] hover:bg-[#282A2C] text-right transition duration-200 border border-transparent hover:border-[#006C35]/50 group h-28"
                  >
                    <span className="text-sm font-semibold text-gray-200 group-hover:text-white line-clamp-2">
                      {item.prompt}
                    </span>
                    <div className="flex items-center justify-between w-full mt-2">
                      <span className="text-xs text-[#4ADE80]">{item.title}</span>
                      <span className="text-lg bg-[#131314] p-1.5 rounded-full">{item.icon}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-8 pb-32">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'ai' && (
                    <div className="w-8 h-8 rounded-full bg-[#006C35] flex-shrink-0 flex items-center justify-center text-sm mt-1">
                      ⚽
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] rounded-3xl px-5 py-3.5 leading-relaxed whitespace-pre-wrap text-[15px] md:text-base ${
                      msg.role === 'user'
                        ? 'bg-[#282A2C] text-white rounded-tl-sm'
                        : 'bg-[#1E1F20]/60 border border-gray-800/60 text-[#E3E3E3] w-full'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex gap-4 items-center text-gray-400 animate-pulse">
                  <div className="w-8 h-8 rounded-full bg-[#006C35] flex items-center justify-center text-sm">⚽</div>
                  <span className="text-sm">جاري التحليل واستخراج الإحصائيات...</span>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>
      </main>

      <footer className="p-4 bg-gradient-to-t from-[#131314] via-[#131314] to-transparent">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center bg-[#1E1F20] focus-within:bg-[#282A2C] rounded-full px-5 py-2.5 border border-gray-800 focus-within:border-gray-600 transition shadow-xl">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="اسأل فوتبلاي عن أي إحصائية، تكتيك، أو تاريخ نادي..."
              className="flex-1 bg-transparent text-white placeholder-[#8E918F] focus:outline-none text-base px-2"
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              className="w-10 h-10 rounded-full bg-[#006C35] hover:bg-[#008542] disabled:bg-gray-700 text-white flex items-center justify-center transition flex-shrink-0"
            >
              ➤
            </button>
          </div>
          <p className="text-center text-[11px] text-[#8E918F] mt-2">
            منصة فوتبلاي للذكاء الاصطناعي الرياضي • جميع المواسم والتاريخ الكروي
          </p>
        </div>
      </footer>
    </div>
  );
}
