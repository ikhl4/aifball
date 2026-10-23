'use client';
import React, { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  userQuery?: string;
  feedback?: 'like' | 'dislike' | null;
}

interface ChatSession {
  id: string;
  title: string;
  conversationId: string;
  messages: Message[];
  updatedAt: string;
}

// شعار AiFBall الرسمي
function AiFBallLogo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const [imgError, setImgError] = useState(false);

  const dimensions =
    size === 'sm'
      ? 'w-8 h-8 rounded-[9px]'
      : size === 'lg'
      ? 'w-14 h-14 rounded-[16px]'
      : 'w-10 h-10 rounded-[11px]';

  if (!imgError) {
    return (
      <img
        src="/logo.png"
        alt="AiFBall"
        onError={() => setImgError(true)}
        className={`${dimensions} object-cover shadow-md flex-shrink-0 select-none`}
      />
    );
  }

  return (
    <div
      className={`${dimensions} bg-[#1D6B35] flex items-center justify-center shadow-md flex-shrink-0 select-none overflow-hidden`}
    >
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <rect width="200" height="200" rx="42" fill="#1D6B35" />
        <g transform="translate(100, 74)">
          <circle r="48" fill="#FFFFFF" />
          <polygon
            points="0,-19 18,-6 11,15 -11,15 -18,-6"
            fill="#FFFFFF"
            stroke="#1D6B35"
            strokeWidth="5.5"
            strokeLinejoin="round"
          />
          <path
            d="M0,-19 L0,-37 M18,-6 L35,-12 M11,15 L22,31 M-11,15 L-22,31 M-18,-6 L-35,-12"
            stroke="#1D6B35"
            strokeWidth="5.5"
            strokeLinecap="round"
          />
          <path
            d="M-19,-35 L0,-37 L19,-35 M19,-35 L35,-12 L37,8 M37,8 L22,31 L0,38 M0,38 L-22,31 L-37,8 M-37,8 L-35,-12 L-19,-35"
            fill="none"
            stroke="#1D6B35"
            strokeWidth="5"
            strokeLinejoin="round"
          />
          <path
            d="M-19,-35 L-26,-43 M19,-35 L26,-43 M35,-12 L46,-16 M37,8 L47,15 M22,31 L29,40 M0,38 L0,48 M-22,31 L-29,40 M-37,8 L-47,15 M-35,-12 L-46,-16"
            stroke="#1D6B35"
            strokeWidth="5"
            strokeLinejoin="round"
          />
          <circle r="47" fill="none" stroke="#1D6B35" strokeWidth="4" />
        </g>
        <text
          x="100"
          y="168"
          textAnchor="middle"
          fill="#FFFFFF"
          fontSize="43"
          fontWeight="900"
          fontStyle="italic"
          fontFamily="system-ui, -apple-system, sans-serif"
          letterSpacing="-1"
        >
          AiFBall
        </text>
      </svg>
    </div>
  );
}

function extractYouTubeIds(text: string): string[] {
  const regex =
    /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/g;
  const ids: string[] = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match[1] && !ids.includes(match[1])) {
      ids.push(match[1]);
    }
  }
  return ids;
}

function extractTwitterLinks(text: string): { url: string; id: string }[] {
  const regex = /https?:\/(?:\/(?:www\.)?(?:twitter|x)\.com\/[a-zA-Z0-9_]+\/status\/([0-9]+))([^\s]*)?/g;
  const links: { url: string; id: string }[] = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match[1]) {
      const fullUrl = match[0].split(/[)\]}>,]/)[0];
      if (!links.some((l) => l.id === match[1])) {
        links.push({ url: fullUrl, id: match[1] });
      }
    }
  }
  return links;
}

function renderFormattedText(text: string) {
  let processedText = text.replace(/\]\s*\n\s*\(/g, '](');
  const lines = processedText.split('\n');
  const elements: React.ReactNode[] = [];

  const formatInline = (str: string) => {
    const regex = /(\*\*.*?\*\*|\[([^\]]+)\]\((https?:\/\/[^\)]+)\)|https?:\/\/[^\s]+)/g;
    const parts = str.split(regex);
    const result: React.ReactNode[] = [];

    let i = 0;
    while (i < parts.length) {
      const part = parts[i];
      if (!part) {
        i++;
        continue;
      }

      if (part.startsWith('**') && part.endsWith('**')) {
        result.push(
          <strong key={`strong-${i}`} className="font-bold text-white">
            {part.slice(2, -2)}
          </strong>
        );
      } else if (
        parts[i + 1] !== undefined &&
        parts[i + 2] !== undefined &&
        parts[i + 1].length > 0 &&
        parts[i + 2].startsWith('http')
      ) {
        const label = parts[i + 1];
        const url = parts[i + 2];
        result.push(
          <a
            key={`link-${i}`}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 my-0.5 px-2.5 py-1 rounded-lg bg-[#006C35]/25 hover:bg-[#006C35]/40 border border-emerald-500/40 text-emerald-300 hover:text-white text-xs font-bold transition shadow-sm"
          >
            <span>🔗</span>
            <span>{label}</span>
            <span className="text-[10px] opacity-70">↗</span>
          </a>
        );
        i += 2;
      } else if (/^https?:\/\//.test(part)) {
        result.push(
          <a
            key={`url-${i}`}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 my-0.5 px-2.5 py-1 rounded-lg bg-gray-800/80 hover:bg-gray-700 text-emerald-400 text-xs underline break-all font-medium transition"
          >
            <span>🔗 فتح الرابط المباشر ↗</span>
          </a>
        );
      } else {
        result.push(part);
      }
      i++;
    }
    return result;
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) {
      elements.push(<div key={index} className="h-2" />);
    } else if (trimmed.startsWith('### ')) {
      elements.push(
        <h3 key={index} className="text-lg font-bold text-emerald-400 mt-4 mb-1.5">
          {formatInline(trimmed.replace(/^###\s+/, ''))}
        </h3>
      );
    } else if (trimmed.startsWith('## ')) {
      elements.push(
        <h2 key={index} className="text-xl font-bold text-emerald-400 mt-4 mb-2">
          {formatInline(trimmed.replace(/^##\s+/, ''))}
        </h2>
      );
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      elements.push(
        <div key={index} className="flex items-start gap-2 my-1.5 pr-2">
          <span className="text-emerald-500 mt-0.5">•</span>
          <span className="flex-1 leading-relaxed text-base">{formatInline(trimmed.slice(2))}</span>
        </div>
      );
    } else {
      elements.push(
        <p key={index} className="leading-relaxed my-1 text-base">
          {formatInline(trimmed)}
        </p>
      );
    }
  });

  const youtubeIds = extractYouTubeIds(text);
  if (youtubeIds.length > 0) {
    elements.push(
      <div key="youtube-embeds" className="mt-4 space-y-3">
        {youtubeIds.map((vid) => (
          <div key={vid} className="rounded-2xl overflow-hidden border border-emerald-500/30 bg-[#131314] shadow-lg">
            <div className="flex items-center justify-between px-3.5 py-2 bg-[#1D6B35]/20 border-b border-gray-800">
              <span className="text-xs font-bold text-emerald-400">🎥 ملخص وأهداف المباراة</span>
              <a href={`https://www.youtube.com/watch?v=${vid}`} target="_blank" rel="noopener noreferrer" className="text-[11px] text-gray-300 underline">
                فتح في يوتيوب ↗
              </a>
            </div>
            <div className="relative w-full aspect-video">
              <iframe src={`https://www.youtube.com/embed/${vid}`} title="YouTube video player" className="w-full h-full border-0" allowFullScreen />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return elements;
}

const STORAGE_KEY = 'aifball_chat_history_v3';

export default function FootPlayChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState('');
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // البطاقات الأربع الأصلية المطابقة لطلبك تماماً
  const suggestionCards = [
    {
      question: 'قدم لي تحليلاً تكتيكياً وإحصائياً لأسلوب لعب الاتحاد وفلسفة المدربين',
      tag: 'تحليل تكتيكي',
      icon: '📋',
    },
    {
      question: 'اعرض لي أهداف وملخصات أبرز مباريات اليوم في الدوريات الكبرى',
      tag: 'أهداف وملخصات المباريات',
      icon: '🎬',
    },
    {
      question: 'ما هو جدول ترتيب دوري روشن السعودي لموسم 2026-2027 وأبرز الإحصائيات؟',
      tag: 'ترتيب دوري روشن',
      icon: '📊',
    },
    {
      question: 'ما هو السجل التاريخي الكامل لأبطال دوري أبطال أوروبا؟',
      tag: 'سجل الأبطال التاريخي',
      icon: '🏆',
    },
  ];

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setSessions(JSON.parse(saved));
    } catch {}
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleVoiceSearch = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('متصفحك لا يدعم البحث الصوتي.');
      return;
    }
    if (isListening) {
      setIsListening(false);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'ar-SA';
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      setInput((prev) => (prev ? `${prev} ${event.results[0][0].transcript}` : event.results[0][0].transcript));
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setAttachedFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const sendMessage = async (textToSend?: string) => {
    const query = (textToSend ?? input).trim();
    if ((!query && attachedFiles.length === 0) || loading) return;

    let fullQuery = query;
    if (attachedFiles.length > 0) {
      fullQuery = `${query} [مرفقات: ${attachedFiles.map(f => f.name).join(', ')}]`.trim();
    }

    const newMessages: Message[] = [...messages, { role: 'user', content: fullQuery, userQuery: fullQuery }];
    setMessages([...newMessages, { role: 'assistant', content: '', userQuery: fullQuery }]);
    setInput('');
    setAttachedFiles([]);
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: fullQuery, conversation_id: conversationId }),
      });

      const rawText = await res.text();
      let finalAnswer = '';
      let newConvId = '';

      try {
        const parsed = JSON.parse(rawText);
        finalAnswer = parsed.text || parsed.answer || '';
        newConvId = parsed.conversation_id || '';
      } catch {
        rawText.split('\n').forEach((line) => {
          const t = line.replace(/^data:\s*/, '').trim();
          if (t && t !== '[DONE]') {
            try {
              const p = JSON.parse(t);
              if (p.text || p.answer) finalAnswer += (p.text || p.answer);
              if (p.conversation_id) newConvId = p.conversation_id;
            } catch {}
          }
        });
      }

      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: finalAnswer || 'عذراً، لم يتم استلام رد صحيح من الخادم.',
          userQuery: fullQuery,
        },
      ]);

      if (newConvId) setConversationId(newConvId);
    } catch {
      setMessages([
        ...newMessages,
        { role: 'assistant', content: 'عذراً، تعذر الاتصال بالخادم.', userQuery: fullQuery },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setConversationId('');
    setCurrentSessionId('');
    setInput('');
    setAttachedFiles([]);
    setSidebarOpen(false);
  };

  return (
    <div dir="rtl" className="flex flex-col h-[100dvh] bg-[#131314] text-[#E3E3E3] relative overflow-hidden font-saudi">
      <style jsx global>{`
        @font-face {
          font-family: 'Saudi';
          src: url('/SaudiWeb-Regular.woff2') format('woff2');
          font-weight: 400;
          font-display: swap;
        }
        @font-face {
          font-family: 'Saudi';
          src: url('/SaudiWeb-Bold.woff2') format('woff2');
          font-weight: 700;
          font-display: swap;
        }
        .font-saudi, body, input, button, textarea, h1, h2, h3, p, span {
          font-family: 'Saudi', sans-serif !important;
          font-feature-settings: "calt" 1, "liga" 1;
        }
      `}</style>

      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/60 z-30" />}

      <aside className={`fixed top-0 right-0 h-full w-72 sm:w-80 bg-[#18191A] border-l border-gray-800 z-40 transform transition-transform duration-300 flex flex-col ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <AiFBallLogo size="sm" />
            <span className="font-bold text-white text-sm">سجل البحوث والمحادثات</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="w-8 h-8 rounded-lg bg-[#232527] text-gray-300">✕</button>
        </div>
        <div className="p-3">
          <button onClick={startNewChat} className="w-full py-2.5 px-4 rounded-xl bg-[#1D6B35] text-white font-bold text-xs flex items-center justify-center gap-2">
            <span>+</span><span>بدء محادثة جديدة</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-1 space-y-1.5">
          {sessions.map((s) => (
            <div key={s.id} onClick={() => { setCurrentSessionId(s.id); setConversationId(s.conversationId); setMessages(s.messages); setSidebarOpen(false); }} className="p-3 rounded-xl bg-[#1E1F20] text-gray-300 cursor-pointer text-xs truncate">
              {s.title}
            </div>
          ))}
        </div>
      </aside>

      <header className="flex items-center justify-between px-3.5 sm:px-6 py-2.5 border-b border-gray-800 bg-[#131314]/95 sticky top-0 z-20">
        <div className="flex items-center gap-2.5">
          <button onClick={() => setSidebarOpen(true)} className="w-9 h-9 rounded-xl bg-[#1E1F20] border border-gray-700 flex items-center justify-center text-gray-200">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h10" /></svg>
          </button>
          <AiFBallLogo size="md" />
          <div>
            <h1 className="text-base font-bold text-white leading-tight">فوتبلاي</h1>
            <p className="text-[10px] text-emerald-400 font-medium">صديقك الرياضي</p>
          </div>
        </div>
        <button onClick={startNewChat} className="px-3 py-1.5 rounded-full text-xs bg-[#1E1F20] border border-gray-700 text-gray-200">+ محادثة جديدة</button>
      </header>

      <main className="flex-1 overflow-y-auto px-3.5 sm:px-6 py-4 max-w-4xl w-full mx-auto flex flex-col">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col justify-center my-auto py-2">
            <div className="text-right space-y-3 mb-7 px-1">
              <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#22C55E]">أهلاً بك في فوتبلاي</h2>
              <p className="text-base sm:text-xl text-gray-200 leading-relaxed font-normal">
                تحليل تكتيكي، تشكيلات مباريات، مقارنات إحصائية متقدمة، أسلوب لعب الفرق وفلسفة المدربين ومتابعة أهداف وملخصات المباريات.. كيف أساعدك اليوم؟
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full">
              {suggestionCards.map((card, i) => (
                <button key={i} onClick={() => sendMessage(card.question)} className="group flex flex-col justify-between text-right p-4 sm:p-5 rounded-2xl bg-[#1E1F20] hover:bg-[#26282A] border border-gray-800 transition shadow-sm min-h-[115px]">
                  <p className="text-sm sm:text-base font-bold text-gray-100 group-hover:text-white leading-relaxed line-clamp-2">{card.question}</p>
                  <div className="flex items-center justify-between w-full mt-3 pt-1">
                    <span className="text-xs sm:text-sm font-bold text-[#22C55E] truncate pl-1">{card.tag}</span>
                    <span className="w-8 h-8 rounded-full bg-[#131314] flex items-center justify-center text-sm">{card.icon}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map((msg, i) => (
              <div key={i} className={`flex items-start gap-2.5 ${msg.role === 'user' ? 'justify-start' : 'justify-end flex-row-reverse'}`}>
                {msg.role === 'assistant' && <div className="mt-1"><AiFBallLogo size="sm" /></div>}
                <div className={`flex flex-col ${msg.role === 'user' ? 'max-w-[85%]' : 'w-full max-w-[90%]'}`}>
                  <div className={`rounded-2xl px-4 py-3 ${msg.role === 'user' ? 'bg-[#282A2C] text-white text-base' : 'bg-[#1E1F20] text-gray-100 border border-gray-800 text-base'}`}>
                    {msg.role === 'user' ? <p>{msg.content}</p> : renderFormattedText(msg.content)}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      <footer className="p-3 bg-[#131314] border-t border-gray-800">
        <div className="max-w-4xl mx-auto">
          {attachedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2 px-2">
              {attachedFiles.map((f, idx) => (
                <div key={idx} className="flex items-center gap-1 bg-[#1E1F20] border border-emerald-500 px-2.5 py-1 rounded-lg text-xs text-emerald-300">
                  <span>📎 {f.name}</span>
                  <button onClick={() => setAttachedFiles((prev) => prev.filter((_, i) => i !== idx))} className="text-red-400 font-bold ml-1">✕</button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 bg-[#1E1F20] border border-gray-700 rounded-full px-3 py-1.5 shadow-md">
            {/* زر الزائد (+) لرفع الصور والملفات */}
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} multiple accept="image/*,.pdf,.doc,.docx" className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} title="إرفاق ملف" className="w-9 h-9 rounded-full bg-[#2A2C2E] hover:bg-gray-700 text-gray-300 flex items-center justify-center font-bold text-lg flex-shrink-0">
              +
            </button>

            {/* زر البحث الصوتي (الميكروفون) */}
            <button onClick={handleVoiceSearch} title="بحث صوتي" className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-base ${isListening ? 'bg-red-600 text-white animate-pulse' : 'bg-[#2A2C2E] hover:bg-gray-700 text-gray-300'}`}>
              🎤
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder={isListening ? 'جاري الاستماع...' : 'اسأل فوتبلاي عن أي مباراة، تحليل تكتيكي، أو إحصائيات...'}
              className="flex-1 bg-transparent px-2 py-1.5 text-sm text-white placeholder-gray-400 focus:outline-none"
            />

            <button onClick={() => sendMessage()} disabled={loading || (!input.trim() && attachedFiles.length === 0)} className="w-9 h-9 rounded-full bg-[#1D6B35] hover:bg-emerald-600 disabled:opacity-40 flex items-center justify-center text-white flex-shrink-0">
              ➤
            </button>
          </div>
          <p className="text-[11px] text-center text-gray-500 mt-2">منصة فوتبلاي للذكاء الاصطناعي الرياضي • by خالد العايش</p>
        </div>
      </footer>
    </div>
  );
}
