'use client';

import React, { useState, useEffect, useRef } from 'react';

// ==========================================
// تعريف الأنواع والهياكل البيانات الأساسية
// ==========================================
interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

interface TacticalData {
  formation?: string;
  possession?: string;
  xg?: string;
  keyPlayer?: string;
}

export default function AiFBallPage() {
  // ==========================================
  // حالات المكون (States)
  // ==========================================
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'أهلاً بك يا أبو سميرة في منصة فوتبلاي (AiFBall). أنا جاهز تماماً لتحليل المباريات، قراءة الخرائط التكتيكية، واستعراض إحصائيات موسم 2026-2027 بدقة واحترافية عالية!',
      timestamp: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'tactics' | 'stats'>('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ==========================================
  // الدوال المساعدة والتمرير التلقائي
  // ==========================================
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // ==========================================
  // معالجة إرسال الرسائل
  // ==========================================
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    const currentTime = new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
    
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage, timestamp: currentTime }]);
    setLoading(true);

    try {
      // المحاكاة الذكية للرد والتواصل مع الخادم أو الـ API
      setTimeout(() => {
        const responseTime = new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: `استلمت استفسارك التكتيكي حول: "${userMessage}". جاري مطابقة البيانات الحية واستخراج المؤشرات والخرائط الحرارية لموسم 2026-2027.\n\nform: 4-3-3\ntactical: الضغط العالي وتفعيل الأطراف بفاعلية.` ,
            timestamp: responseTime
          }
        ]);
        setLoading(false);
      }, 1200);
    } catch (error) {
      const errorTime = new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'عذراً، حدث خطأ أثناء الاتصال بالخادم. يرجى التحقق من الشبكة والمحاولة مرة أخرى.', timestamp: errorTime }
      ]);
      setLoading(false);
    }
  };

  // ==========================================
  // البحث الصوتي (Speech Recognition)
  // ==========================================
  const handleVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('متصفحك لا يدعم خاصية البحث الصوتي مباشرة.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'ar-SA';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const speechToText = event.results[0][0].transcript;
      setInput(speechToText);
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  // ==========================================
  // تحليل النصوص وعرض الويدجت التكتيكي المتقدم
  // ==========================================
  const renderParsedContent = (content: string) => {
    const cleanedContent = content.replace(/\*\*/g, '');
    const trimmed = cleanedContent.trim();
    
    const formMatch = trimmed.match(/form:\s*(.*)/i);
    const tacticalMatch = trimmed.match(/tactical:\s*(.*)/i);

    // تنظيف النص الأساسي من أسطر الويدجت المعروضة لتجنب التكرار
    const mainText = trimmed
      .replace(/form:\s*(.*)/gi, '')
      .replace(/tactical:\s*(.*)/gi, '')
      .trim();

    return (
      <div className="space-y-3 font-['Cairo',sans-serif]">
        {mainText && <p className="whitespace-pre-wrap leading-relaxed">{mainText}</p>}
        
        {formMatch && formMatch[1] ? (
          <div className="p-3 bg-slate-800/90 rounded-xl border border-emerald-500/40 text-emerald-400 text-sm flex items-center justify-between shadow-inner">
            <span className="font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              مؤشر التشكيل والخطط:
            </span>
            <span className="bg-emerald-500/20 px-3 py-1 rounded-lg text-xs font-mono font-bold tracking-wider">{formMatch[1]}</span>
          </div>
        ) : null}

        {tacticalMatch && tacticalMatch[1] ? (
          <div className="p-3 bg-slate-900/95 rounded-xl border border-sky-500/40 text-sky-400 text-sm shadow-inner">
            <span className="font-bold block mb-1">تحليل الحالة العميقة:</span>
            <p className="text-slate-300">{tacticalMatch[1]}</p>
          </div>
        ) : null}
      </div>
    );
  };

  // ==========================================
  // الواجهة الرسومية الكاملة (JSX)
  // ==========================================
  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 font-['Cairo',sans-serif] overflow-hidden">
      
      {/* 1. الهيدر العلوي الاحترافي */}
      <header className="flex items-center justify-between px-6 py-4 bg-slate-900/90 border-b border-slate-800/80 backdrop-blur-md z-10 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-3.5 h-3.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.7)]"></div>
          <div>
            <h1 className="text-xl font-bold tracking-wide text-emerald-400 flex items-center gap-2">
              AiFBall <span className="text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">فوتبلاي</span>
            </h1>
          </div>
        </div>

        {/* أتبات التنقل العلوية */}
        <div className="hidden md:flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
          <button 
            onClick={() => setActiveTab('chat')} 
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === 'chat' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            المحادثة التكتيكية
          </button>
          <button 
            onClick={() => setActiveTab('tactics')} 
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === 'tactics' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            اللوحة التكتيكية
          </button>
          <button 
            onClick={() => setActiveTab('stats')} 
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === 'stats' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            الإحصائيات المتقدمة
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20 font-medium">
            موسم 2026-2027
          </span>
        </div>
      </header>

      {/* 2. المحتوى الرئيسي حسب التبويب */}
      <main className="flex-1 overflow-y-auto relative flex flex-col">
        {activeTab === 'chat' ? (
          <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-4 py-6 space-y-5">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-end gap-2 max-w-[88%] md:max-w-[78%]">
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-xs shrink-0 mb-1 shadow">
                      AI
                    </div>
                  )}
                  <div
                    className={`rounded-2xl px-5 py-4 shadow-xl ${
                      msg.role === 'user'
                        ? 'bg-emerald-600 text-white rounded-br-none shadow-emerald-900/20'
                        : 'bg-slate-900/90 border border-slate-800/80 text-slate-200 rounded-bl-none shadow-black/40'
                    }`}
                  >
                    {renderParsedContent(msg.content)}
                  </div>
                </div>
                {msg.timestamp && (
                  <span className={`text-[10px] text-slate-500 mt-1 px-2 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                    {msg.timestamp}
                  </span>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-start gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-xs shrink-0 shadow animate-pulse">
                  AI
                </div>
                <div className="bg-slate-900/90 border border-slate-800/80 text-slate-400 rounded-2xl rounded-bl-none px-5 py-3.5 shadow-xl flex items-center gap-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  <span className="text-sm font-medium mr-1">جاري معالجة البيانات وتحليل المقاطع التكتيكية...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        ) : activeTab === 'tactics' ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-2xl mx-auto">
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center text-emerald-400 mb-4 text-2xl">
              ⚽
            </div>
            <h2 className="text-xl font-bold text-slate-100 mb-2">لوحة التكتيك والخرائط الحرارية</h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              هنا يتم عرض الرسوم التوضيحية للتشكيلات والتحركات الفنية للمباريات بناءً على بيانات الأداء الحية لموسم 2026-2027.
            </p>
            <div className="w-full h-64 bg-slate-900/80 border border-slate-800 rounded-2xl flex items-center justify-center text-slate-500 border-dashed">
              [ملعب العرض التكتيكي التفاعلي جاهز للربط]
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-2xl mx-auto">
            <div className="w-16 h-16 bg-sky-500/10 border border-sky-500/30 rounded-2xl flex items-center justify-center text-sky-400 mb-4 text-2xl">
              📊
            </div>
            <h2 className="text-xl font-bold text-slate-100 mb-2">الإحصائيات المتقدمة وقياسات الأداء</h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              استعراض معدلات الأهداف المتوقعة (xG)، نسبة الاستحواذ، وخرائط التمريرات الحاسمة للفرق واللاعبين.
            </p>
            <div className="w-full h-64 bg-slate-900/80 border border-slate-800 rounded-2xl flex items-center justify-center text-slate-500 border-dashed">
              [لوحة الإحصائيات الشاملة جاهزة للربط]
            </div>
          </div>
        )}
      </main>

      {/* 3. شريط الإدخال والتحكم السفلي */}
      <footer className="p-4 bg-slate-900/95 border-t border-slate-800/80 backdrop-blur-md z-10 shadow-2xl">
        <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex items-center gap-3">
          <button
            type="button"
            onClick={handleVoiceSearch}
            className={`p-3.5 rounded-xl border transition-all shadow-md ${
              isListening
                ? 'bg-rose-600 border-rose-500 text-white animate-pulse shadow-rose-900/50'
                : 'bg-slate-950 border-slate-800/80 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/50'
            }`}
            title="بحث صوتي مباشر"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z"></path>
            </svg>
          </button>

          <div className="flex-1 relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="اسأل عن تحليل المباريات، التكتيك، أو إحصائيات اللاعبين..."
              className="w-full bg-slate-950 border border-slate-800/80 rounded-xl px-4 py-3.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm shadow-inner"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-7 py-3.5 rounded-xl font-medium transition-all flex items-center justify-center min-w-[110px] shadow-lg shadow-emerald-900/30 text-sm"
          >
            <span>إرسال</span>
          </button>
        </form>
      </footer>

    </div>
  );
}
