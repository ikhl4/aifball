'use client';
import React, { useState, useRef, useEffect } from 'react';

export default function FootPlayPro() {
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const suggestions = [
    { icon: '📊', title: 'ترتيب دوري روشن', prompt: 'ما هو جدول ترتيب دوري روشن السعودي لموسم 2026-2027 وأبرز الإحصائيات؟' },
    { icon: '📋', title: 'تحليل تكتيكي', prompt: 'قدم لي تحليلاً تكتيكياً لأسلوب لعب الاتحاد مع الالماني فيسينغ.' },
    { icon: '🏆', title: 'سجل الأبطال', prompt: 'ما هو السجل التاريخي الكامل لأبطال الدوري الإنجليزي؟' },
    { icon: '⚽', title: 'إحصائيات متقدمة', prompt: 'أعلى xg لفريق هذا الموسم في الدوريات الخمسة الكبرى' },
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
    <div dir="rtl" className="flex flex-col h-screen bg-[#131314] text-[#E3E3E3] font-sans antialiased overflow-hidden">
      {/* شريط العرض العلوي الاحترافي */}
      <header className="flex items-center justify-between px-6 py-3.5 bg-[#131314]/95 backdrop-blur-md border-b border-gray-800/60 z-20 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#00A859] to-[#006C35] flex items-center justify-center font-bold text-white shadow-lg shadow-[#006C35]/20">
            ⚽
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-wide leading-none">فوتبلاي</h1>
            <span className="text-[11px] text-[#4ADE80] font-medium">المحلل الذكي المعتمد</span>
          </div>
        </div>
        <button
          onClick={() => { setMessages([]); setConversationId(''); }}
          className="text-xs bg-[#1E1F20] hover:bg-[#282A2C] text-gray-300 px-3.5 py-2 rounded-full transition border border-gray-800 flex items-center gap-1.5"
        >
          <span>+</span> محادثة جديدة
        </button>
      </header>

      {/* منطقة المحادثة والرسائل */}
      <main className="flex-1 overflow-y-auto px-4 sm:px-6">
        <div className="max-w-3xl mx-auto py-8">
          {messages.length === 0 ? (
            <div className="mt-12 sm:mt-20 space-y-10 text-center sm:text-right">
              <div className="space-y-3">
                <h2 className="text-3xl sm:text-5xl font-black bg-gradient-to-l from-[#00A859] via-[#4ADE80] to-white bg-clip-text text-transparent pb-1">
                  أهلاً بك في فوتبلاي
                </h2>
                <p className="text-lg sm:text-xl text-[#8E918F] font-medium leading-relaxed">
                  مرجعك الذكي للتحليل الفني، التكتيكي، وإحصائيات وتاريخ كرة القدم.
                </p>
              </div>

              {/* أزرار المقترحات السريعة */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {suggestions.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => sendMessage(item.prompt)}
                    className="flex flex-col justify-between p-4 rounded-2xl bg-[#1E1F20] hover:bg-[#25282A] text-right transition-all duration-200 border border-gray-800/80 hover:border-[#006C35] group h-28 shadow-sm"
                  >
                    <span className="text-sm font-semibold text-gray-200 group-hover:text-white line-clamp-2">
                      {item.prompt}
                    </span>
                    <div className="flex items-center justify-between w-full mt-2">
                      <span className="text-xs text-[#4ADE80] font-medium">{item.title}</span>
                      <span className="text-base bg-[#131314] px-2 py-1 rounded-lg">{item.icon}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6 pb-28">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-3 sm:gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'ai' && (
                    <div className="w-8 h-8 rounded-xl bg-[#006C35] flex-shrink-0 flex items-center justify-center text-sm shadow-md mt-1">
                      ⚽
                    </div>
                  )}
                  <div
                    className={`max-w-[88%] sm:max-w-[82%] rounded-2xl px-4 sm:px-5 py-3.5 leading-relaxed whitespace-pre-wrap text-sm sm:text-base shadow-sm ${
                      msg.role === 'user'
                        ? 'bg-[#282A2C] text-white rounded-tl-sm border border-gray-700/50'
                        : 'bg-[#1E1F20] border border-gray-800 text-[#E3E3E3] rounded-tr-sm w-full'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex gap-4 items-center text-gray-400 animate-pulse py-2">
                  <div className="w-8 h-8 rounded-xl bg-[#006C35] flex items-center justify-center text-sm shadow-md">⚽</div>
                  <span className="text-xs sm:text-sm font-medium">جاري التحليل واستخراج الإحصائيات الرياضية...</span>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>
      </main>

      {/* شريط الإدخال السفلي */}
      <footer className="p-3 sm:p-4 bg-gradient-to-t from-[#131314] via-[#131314] to-transparent flex-shrink-0">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center bg-[#1E1F20] focus-within:bg-[#25282A] rounded-2xl px-4 py-2 border border-gray-800 focus-within:border-[#006C35] transition-all shadow-2xl">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="اسأل فوتبلاي عن التكتيك، الإحصائيات، أو المباريات..."
              className="flex-1 bg-transparent text-white placeholder-[#8E918F] focus:outline-none text-sm sm:text-base py-2 px-1"
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              className="w-10 h-10 rounded-xl bg-[#006C35] hover:bg-[#008542] disabled:bg-gray-800 disabled:text-gray-600 text-white flex items-center justify-center transition-all shadow-md flex-shrink-0 mr-2"
            >
              ➤
            </button>
          </div>
          <p className="text-center text-[10px] sm:text-[11px] text-[#8E918F] mt-2 font-medium">
            منصة فوتبلاي للذكاء الاصطناعي الرياضي • by خالد العايش
          </p>
        </div>
      </footer>
    </div>
  );
}
