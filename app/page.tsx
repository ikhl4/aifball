'use client';
import React, { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// أيقونة شعار AiFBall المطابقة للصورة تماماً (SVG عالي الدقة)
function AiFBallLogo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const dimensions =
    size === 'sm' ? 'w-8 h-8 rounded-lg' : size === 'lg' ? 'w-14 h-14 rounded-2xl' : 'w-10 h-10 rounded-xl';

  return (
    <div
      className={`${dimensions} bg-[#236B38] flex flex-col items-center justify-center shadow-md border border-emerald-500/20 flex-shrink-0 select-none overflow-hidden p-1`}
    >
      <svg viewBox="0 0 100 105" className="w-full h-full">
        {/* الكرة البيضاء المضلعة */}
        <circle cx="50" cy="38" r="27" fill="#FFFFFF" stroke="#236B38" strokeWidth="2" />
        {/* المضلع الأوسط */}
        <polygon
          points="50,24 63,33 58,48 42,48 37,33"
          fill="none"
          stroke="#236B38"
          strokeWidth="3.2"
          strokeLinejoin="round"
        />
        {/* الخطوط والمضلعات المحيطة */}
        <line x1="50" y1="24" x2="50" y2="11" stroke="#236B38" strokeWidth="3.2" />
        <line x1="63" y1="33" x2="75" y2="27" stroke="#236B38" strokeWidth="3.2" />
        <line x1="58" y1="48" x2="68" y2="59" stroke="#236B38" strokeWidth="3.2" />
        <line x1="42" y1="48" x2="32" y2="59" stroke="#236B38" strokeWidth="3.2" />
        <line x1="37" y1="33" x2="25" y2="27" stroke="#236B38" strokeWidth="3.2" />
        <path
          d="M38,14 L50,18 L62,14 M73,20 L74,30 L77,38 M64,61 L50,57 L36,61 M23,38 L26,30 L27,20"
          fill="none"
          stroke="#236B38"
          strokeWidth="2.8"
          strokeLinecap="round"
        />
        {/* نص AiFBall في الأسفل */}
        <text
          x="50"
          y="91"
          textAnchor="middle"
          fill="#FFFFFF"
          fontSize="24"
          fontWeight="900"
          fontStyle="italic"
          fontFamily="sans-serif"
          letterSpacing="-0.5"
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

export default function FootPlayChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // البطاقات التفاعلية الأربع بنفس تصميم الشاشة الرئيسية القديمة مع الإيموجيز والوسوم
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
    setInput('');
  };

  return (
    <div dir="rtl" className="flex flex-col h-[100dvh] bg-[#131314] text-[#E3E3E3] font-sans">
      {/* الهيدر مع شعار AiFBall الجديد */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-gray-800/80 bg-[#131314]/95 backdrop-blur sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <AiFBallLogo size="md" />
          <div>
            <h1 className="text-base sm:text-lg font-bold text-white leading-tight">فوتبلاي</h1>
            <p className="text-[11px] text-emerald-400 font-medium">المحلل الذكي المعتمد</p>
          </div>
        </div>
        <button
          onClick={startNewChat}
          className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-[#1E1F20] hover:bg-gray-800 text-gray-200 border border-gray-700/70 transition"
        >
          + محادثة جديدة
        </button>
      </header>

      {/* منطقة المحادثة والشاشة الرئيسية */}
      <main className="flex-1 overflow-y-auto px-4 py-6 max-w-4xl w-full mx-auto flex flex-col">
        {messages.length === 0 ? (
          /* الشاشة الرئيسية المطابقة للصورة تماماً */
          <div className="flex-1 flex flex-col justify-center my-auto py-6">
            <div className="text-right space-y-2 mb-8 px-1">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#22C55E] tracking-tight">
                أهلاً بك في فوتبلاي
              </h2>
              <p className="text-base sm:text-xl font-bold text-gray-200 leading-relaxed">
                محللك التكتيكي ومرجعك الإحصائي والتاريخي لكرة القدم.. كيف أساعدك اليوم؟
              </p>
            </div>

            {/* شبكة البطاقات الأربع مع الإيموجيز والوسوم الخضراء */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full">
              {suggestionCards.map((card, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(card.question)}
                  className="group flex flex-col justify-between text-right p-4 sm:p-5 rounded-2xl bg-[#1E1F20] hover:bg-[#26282A] border border-gray-800/90 hover:border-emerald-500/40 transition-all duration-200 shadow-sm min-h-[115px]"
                >
                  <p className="text-sm sm:text-base font-bold text-gray-100 group-hover:text-white leading-relaxed line-clamp-2">
                    {card.question}
                  </p>
                  <div className="flex items-center justify-between w-full mt-4 pt-1">
                    <span className="text-xs font-bold text-[#22C55E]">
                      {card.tag}
                    </span>
                    <span className="w-7 h-7 rounded-lg bg-[#131314]/80 flex items-center justify-center text-base shadow-inner">
                      {card.icon}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* عرض الرسائل والجداول */
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
              className="w-9 h-9 rounded-full bg-[#236B38] hover:bg-emerald-600 disabled:opacity-40 flex items-center justify-center text-white transition flex-shrink-0"
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
