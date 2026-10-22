'use client';
import React, { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// دالة ذكية لتحويل النصوص الخام والرموز (## و ** و |) إلى جداول وتنسيقات احترافية
function renderFormattedText(text: string) {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let tableRows: string[][] = [];
  let inTable = false;

  const formatInline = (str: string) => {
    const parts = str.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={idx} className="font-bold text-white">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  const flushTable = (keyIndex: number) => {
    if (tableRows.length === 0) return;
    const headers = tableRows[0];
    const body = tableRows.slice(1);
    elements.push(
      <div key={`table-${keyIndex}`} className="my-3 overflow-x-auto rounded-xl border border-gray-700/80 shadow-md">
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

    // التعرف على أسطر الجداول التي تبدأ وتنتهي بـ |
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      // تجاهل سطر الفواصل مثل |---|---|
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

  const suggestions = [
    'ما هو جدول ترتيب دوري روشن السعودي لموسم 2026-2027 وأبرز الإحصائيات؟',
    'أعلى فريق في xG هذا الموسم في الدوريات الخمسة الكبرى',
    'مقارنة تكتيكية وإحصائية بين الاتحاد والنصر هذا الموسم',
    'من هم أبرز هدافي وصناع اللعب في دوري روشن حالياً؟',
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

      // قراءة الرد المتدفق أولاً بأول لعرضه فوراً بدون انتظار
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
            // تجاهل الأجزاء غير المكتملة
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
      {/* الهيدر */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-800/80 bg-[#131314]/95 backdrop-blur sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#006C35] flex items-center justify-center text-xl shadow-lg shadow-emerald-950/50">
            ⚽
          </div>
          <div>
            <h1 className="text-base font-bold text-white leading-tight">فوتبلاي</h1>
            <p className="text-xs text-emerald-400 font-medium">المحلل الذكي المعتمد</p>
          </div>
        </div>
        <button
          onClick={startNewChat}
          className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-[#1E1F20] hover:bg-gray-800 text-gray-300 border border-gray-700/70 transition"
        >
          + محادثة جديدة
        </button>
      </header>

      {/* منطقة المحادثة */}
      <main className="flex-1 overflow-y-auto px-4 py-5 space-y-5 max-w-3xl w-full mx-auto">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-10 space-y-6">
            <div className="w-16 h-16 rounded-3xl bg-[#006C35]/20 border border-[#006C35]/40 flex items-center justify-center text-3xl shadow-inner">
              ⚽
            </div>
            <div className="space-y-2 max-w-md">
              <h2 className="text-2xl font-bold text-white">أهلاً بك في فوتبلاي</h2>
              <p className="text-sm text-gray-400 leading-relaxed">
                مستشارك الكروي الذكي لتحليل المباريات، التكتيك، والأرقام والإحصائيات الدقيقة للدوري السعودي والدوريات العالمية.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-xl pt-2">
              {suggestions.map((item, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(item)}
                  className="text-right p-3.5 rounded-2xl bg-[#1E1F20] hover:bg-[#282A2C] border border-gray-800 text-xs sm:text-sm text-gray-200 transition leading-relaxed"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              className={`flex items-start gap-2.5 ${
                msg.role === 'user' ? 'justify-start' : 'justify-end flex-row-reverse'
              }`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-[#006C35] flex items-center justify-center text-sm flex-shrink-0 mt-1 shadow">
                  ⚽
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
          ))
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* شريط الإدخال السفلي */}
      <footer className="p-3 bg-[#131314] border-t border-gray-800/60">
        <div className="max-w-3xl mx-auto">
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
              className="w-9 h-9 rounded-full bg-[#006C35] hover:bg-emerald-600 disabled:opacity-40 flex items-center justify-center text-white transition flex-shrink-0"
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
