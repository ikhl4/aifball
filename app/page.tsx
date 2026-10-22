'use client';
import React, { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatSession {
  id: string;
  title: string;
  conversationId: string;
  messages: Message[];
  updatedAt: string;
}

// شعار AiFBall الرسمي (يعرض /logo.png أو يرسم الشعار بدقة عالية تلقائياً)
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
            strokeLinecap="round"
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
          fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
          letterSpacing="-1"
        >
          AiFBall
        </text>
      </svg>
    </div>
  );
}

// دالة تحويل النصوص الخام والرموز إلى جداول وتنسيقات احترافية
function renderFormattedText(text: string) {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let tableRows: string[][] = [];
  let inTable = false;

  const formatInline = (str: string) => {
    const parts = str.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={idx} className="font-bold text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  const flushTable = (keyIndex: number) => {
    if (tableRows.length === 0) return;
    const headers = tableRows[0];
    const body = tableRows.slice(1);
    elements.push(
      <div
        key={`table-${keyIndex}`}
        className="my-3 overflow-x-auto rounded-xl border border-gray-700/80 shadow-md"
      >
        <table className="w-full text-right border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="bg-[#006C35]/40 text-emerald-300 border-b border-gray-700">
              {headers.map((h, i) => (
                <th key={i} className="py-2.5 px-3 font-bold whitespace-nowrap">
                  {formatInline(h)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/80 bg-[#161718]">
            {body.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-gray-800/40 transition-colors">
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className="py-2 px-3 whitespace-nowrap text-gray-200">
                    {formatInline(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
    tableRows = [];
    inTable = false;
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      if (/^\|[\s\-:|]+\|$/.test(trimmed)) {
        inTable = true;
        return;
      }
      inTable = true;
      const cells = trimmed
        .slice(1, -1)
        .split('|')
        .map((c) => c.trim());
      tableRows.push(cells);
      return;
    }

    if (inTable) {
      flushTable(index);
    }

    if (!trimmed) {
      elements.push(<div key={index} className="h-2" />);
    } else if (trimmed === '---' || trimmed === '***') {
      elements.push(<hr key={index} className="my-3 border-gray-700/60" />);
    } else if (trimmed.startsWith('### ')) {
      elements.push(
        <h3 key={index} className="text-base font-bold text-emerald-400 mt-4 mb-1.5">
          {formatInline(trimmed.replace(/^###\s+/, ''))}
        </h3>
      );
    } else if (trimmed.startsWith('## ')) {
      elements.push(
        <h2 key={index} className="text-lg font-bold text-emerald-400 mt-4 mb-2">
          {formatInline(trimmed.replace(/^##\s+/, ''))}
        </h2>
      );
    } else if (trimmed.startsWith('# ')) {
      elements.push(
        <h1 key={index} className="text-xl font-bold text-emerald-400 mt-4 mb-2">
          {formatInline(trimmed.replace(/^#\s+/, ''))}
        </h1>
      );
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      elements.push(
        <div key={index} className="flex items-start gap-2 my-1 pr-2">
          <span className="text-emerald-500 mt-1">•</span>
          <span className="flex-1 leading-relaxed">{formatInline(trimmed.slice(2))}</span>
        </div>
      );
    } else {
      elements.push(
        <p key={index} className="leading-relaxed my-1">
          {formatInline(trimmed)}
        </p>
      );
    }
  });

  if (inTable) {
    flushTable(lines.length);
  }

  return elements;
}

const STORAGE_KEY = 'aifball_chat_history_v1';

export default function FootPlayChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState('');
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestionCards = [
    {
      question: 'ما هو جدول ترتيب دوري روشن السعودي لموسم 2026-2027 وأبرز الإحصائيات؟',
      tag: 'ترتيب دوري روشن',
      icon: '📊',
    },
    {
      question: 'قدم لي تحليلاً تكتيكياً لأسلوب لعب الاتحاد مع المدرب هذا الموسم',
      tag: 'تحليل تكتيكي',
      icon: '📋',
    },
    {
      question: 'ما هو السجل التاريخي الكامل لأبطال الدوري الإنجليزي؟',
      tag: 'سجل الأبطال التاريخي',
      icon: '🏆',
    },
    {
      question: 'أعلى فريق في xG هذا الموسم في الدوريات الخمسة الكبرى',
      tag: 'العمل الجماعي',
      icon: '⚽',
    },
  ];

  // تحميل سجل المحادثات المحفوظة عند فتح الموقع
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setSessions(JSON.parse(saved));
      }
    } catch {
      // تجاهل أخطاء التخزين المحلي
    }
  }, []);

  // حفظ المحادثة الحالية تلقائياً في السجل عند كل تحديث
  useEffect(() => {
    if (messages.length === 0) return;

    const sessionId = currentSessionId || Date.now().toString();
    if (!currentSessionId) {
      setCurrentSessionId(sessionId);
    }

    const firstUserMsg = messages.find((m) => m.role === 'user')?.content || 'محادثة جديدة';
    const nowStr = new Date().toLocaleDateString('ar-SA', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    setSessions((prev) => {
      const existingIndex = prev.findIndex((s) => s.id === sessionId);
      const updatedSession: ChatSession = {
        id: sessionId,
        title: firstUserMsg.slice(0, 55),
        conversationId,
        messages,
        updatedAt: nowStr,
      };

      let newList: ChatSession[];
      if (existingIndex >= 0) {
        newList = [...prev];
        newList[existingIndex] = updatedSession;
      } else {
        newList = [updatedSession, ...prev];
      }

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newList.slice(0, 30)));
      } catch {
        // تجاهل
      }
      return newList;
    });
  }, [messages, conversationId, currentSessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (textToSend?: string) => {
    const query = (textToSend ?? input).trim();
    if (!query || loading) return;

    const newMessages: Message[] = [...messages, { role: 'user', content: query }];
    setMessages([...newMessages, { role: 'assistant', content: '' }]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, conversation_id: conversationId }),
      });

      if (!res.ok || !res.body) {
        throw new Error('فشل الاتصال');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let accumulatedText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const parsed = JSON.parse(line);
            if (parsed.text) {
              accumulatedText += parsed.text;
              setMessages([
                ...newMessages,
                { role: 'assistant', content: accumulatedText },
              ]);
            }
            if (parsed.conversation_id) {
              setConversationId(parsed.conversation_id);
            }
          } catch {
            // تجاهل الأسطر غير المكتملة
          }
        }
      }
    } catch {
      setMessages([
        ...newMessages,
        { role: 'assistant', content: 'عذراً، تعذر استلام الرد، يرجى المحاولة مرة أخرى.' },
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
    setSidebarOpen(false);
  };

  const loadSession = (session: ChatSession) => {
    setCurrentSessionId(session.id);
    setConversationId(session.conversationId);
    setMessages(session.messages);
    setSidebarOpen(false);
  };

  const deleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSessions((prev) => {
      const filtered = prev.filter((s) => s.id !== id);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      } catch {
        // تجاهل
      }
      return filtered;
    });
    if (currentSessionId === id) {
      startNewChat();
    }
  };

  const clearAllHistory = () => {
    setSessions([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // تجاهل
    }
    startNewChat();
  };

  return (
    <div dir="rtl" className="flex flex-col h-[100dvh] bg-[#131314] text-[#E3E3E3] font-sans relative overflow-hidden">
      {/* القائمة الجانبية (Sidebar) لسجل البحوث والمحادثات القديمة */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-30 transition-opacity"
        />
      )}

      <aside
        className={`fixed top-0 right-0 h-full w-72 sm:w-80 bg-[#18191A] border-l border-gray-800 z-40 transform transition-transform duration-300 ease-in-out flex flex-col ${
          sidebarOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <AiFBallLogo size="sm" />
            <span className="font-bold text-white text-sm">سجل البحوث والمحادثات</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="w-8 h-8 rounded-lg bg-[#232527] hover:bg-gray-700 flex items-center justify-center text-gray-300 text-sm"
          >
            ✕
          </button>
        </div>

        <div className="p-3">
          <button
            onClick={startNewChat}
            className="w-full py-2.5 px-4 rounded-xl bg-[#1D6B35] hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow transition"
          >
            <span>+</span>
            <span>بدء محادثة جديدة</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-1 space-y-1.5">
          {sessions.length === 0 ? (
            <div className="text-center py-12 px-4 text-gray-500 text-xs leading-relaxed">
              لا توجد بحوث سابقة محفوظة حتى الآن. أي سؤال تطرحه سيُحفظ هنا تلقائياً للرجوع إليه في أي وقت.
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => loadSession(session)}
                className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition border ${
                  currentSessionId === session.id
                    ? 'bg-[#232628] border-emerald-500/40 text-white'
                    : 'bg-[#1E1F20]/60 hover:bg-[#232527] border-transparent text-gray-300'
                }`}
              >
                <div className="flex-1 min-w-0 pl-2">
                  <p className="text-xs font-bold truncate">{session.title}</p>
                  <span className="text-[10px] text-gray-500 mt-0.5 block">
                    {session.updatedAt} • {Math.ceil(session.messages.length / 2)} أسئلة
                  </span>
                </div>
                <button
                  onClick={(e) => deleteSession(e, session.id)}
                  title="حذف المحادثة"
                  className="opacity-60 group-hover:opacity-100 hover:text-red-400 text-gray-500 p-1 text-xs transition"
                >
                  🗑️
                </button>
              </div>
            ))
          )}
        </div>

        {sessions.length > 0 && (
          <div className="p-3 border-t border-gray-800">
            <button
              onClick={clearAllHistory}
              className="w-full py-2 rounded-lg text-xs text-gray-400 hover:text-red-400 hover:bg-red-950/20 transition"
            >
              مسح السجل بالكامل
            </button>
          </div>
        )}
      </aside>

      {/* الهيدر العلوي مع زر الخيارات والسجل */}
      <header className="flex items-center justify-between px-3.5 sm:px-6 py-2.5 border-b border-gray-800/80 bg-[#131314]/95 backdrop-blur sticky top-0 z-20">
        <div className="flex items-center gap-2.5">
          {/* زر فتح القائمة الجانبية للبحوث القديمة */}
          <button
            onClick={() => setSidebarOpen(true)}
            title="سجل البحوث والخيارات"
            className="w-9 h-9 rounded-xl bg-[#1E1F20] hover:bg-gray-800 border border-gray-700/70 flex items-center justify-center text-gray-200 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h10" />
            </svg>
          </button>

          <AiFBallLogo size="md" />
          <div>
            <h1 className="text-sm sm:text-base font-bold text-white leading-tight">فوتبلاي</h1>
            <p className="text-[10px] sm:text-[11px] text-emerald-400 font-medium">المحلل الذكي المعتمد</p>
          </div>
        </div>

        <button
          onClick={startNewChat}
          className="px-3 py-1.5 rounded-full text-xs font-medium bg-[#1E1F20] hover:bg-gray-800 text-gray-200 border border-gray-700/70 transition"
        >
          + محادثة جديدة
        </button>
      </header>

      {/* منطقة المحادثة والشاشة الرئيسية */}
      <main className="flex-1 overflow-y-auto px-3.5 sm:px-6 py-4 max-w-4xl w-full mx-auto flex flex-col">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col justify-center my-auto py-2">
            {/* العنوان والوصف بحجم متناسق يظهر بالكامل */}
            <div className="text-right space-y-1.5 mb-5 px-1">
              <h2 className="text-2xl sm:text-4xl font-extrabold text-[#22C55E] tracking-tight">
                أهلاً بك في فوتبلاي
              </h2>
              <p className="text-xs sm:text-lg font-bold text-gray-300 leading-relaxed">
                محللك التكتيكي ومرجعك الإحصائي والتاريخي لكرة القدم.. كيف أساعدك اليوم؟
              </p>
            </div>

            {/* شبكة البطاقات 2×2 بحجم ملموم وأنيق على الجوال والكمبيوتر */}
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5 w-full">
              {suggestionCards.map((card, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(card.question)}
                  className="group flex flex-col justify-between text-right p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-[#1E1F20] hover:bg-[#26282A] border border-gray-800/90 hover:border-emerald-500/40 transition-all duration-200 shadow-sm min-h-[88px] sm:min-h-[105px]"
                >
                  <p className="text-[11px] sm:text-sm font-bold text-gray-100 group-hover:text-white leading-snug line-clamp-2">
                    {card.question}
                  </p>
                  <div className="flex items-center justify-between w-full mt-2.5 pt-1">
                    <span className="text-[10px] sm:text-xs font-bold text-[#22C55E] truncate pl-1">
                      {card.tag}
                    </span>
                    <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-[#131314]/80 flex items-center justify-center text-xs sm:text-sm shadow-inner flex-shrink-0">
                      {card.icon}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex items-start gap-2.5 ${
                  msg.role === 'user' ? 'justify-start' : 'justify-end flex-row-reverse'
                }`}
              >
                {msg.role === 'assistant' && (
                  <div className="mt-1">
                    <AiFBallLogo size="sm" />
                  </div>
                )}
                <div
                  className={`rounded-2xl px-4 py-3 max-w-[90%] sm:max-w-[85%] text-sm ${
                    msg.role === 'user'
                      ? 'bg-[#282A2C] text-white rounded-tr-sm'
                      : 'bg-[#1E1F20] text-gray-100 border border-gray-800/90 w-full overflow-hidden'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <p className="leading-relaxed">{msg.content}</p>
                  ) : msg.content ? (
                    renderFormattedText(msg.content)
                  ) : (
                    <div className="flex items-center gap-2 py-1 text-emerald-400 text-xs">
                      <span className="animate-pulse">جاري تحليل البيانات والإحصائيات...</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      {/* شريط الإدخال السفلي */}
      <footer className="p-3 bg-[#131314] border-t border-gray-800/60">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 bg-[#1E1F20] border border-gray-700/70 rounded-full px-3 py-1.5">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="اسأل فوتبلاي عن التكتيك، الإحصائيات، أو المباريات..."
              className="flex-1 bg-transparent px-2 py-1.5 text-sm text-white placeholder-gray-400 focus:outline-none"
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              className="w-9 h-9 rounded-full bg-[#1D6B35] hover:bg-emerald-600 disabled:opacity-40 flex items-center justify-center text-white transition flex-shrink-0"
            >
              ➤
            </button>
          </div>
          <p className="text-[11px] text-center text-gray-500 mt-2">
            منصة فوتبلاي للذكاء الاصطناعي الرياضي • by خالد العايش
          </p>
        </div>
      </footer>
    </div>
  );
}
