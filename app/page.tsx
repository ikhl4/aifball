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

// دالة تحويل الأرقام الإنجليزية إلى عربية في واجهة المستخدم
function toArabicNumerals(text: string): string {
  if (!text) return '';
  const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return text.replace(/[0-9]/g, (w) => arabicNumbers[parseInt(w, 10)]);
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

function parseStatNumber(val: string): number | null {
  const cleaned = val.replace(/,/g, '').match(/-?\d+(\.\d+)?/);
  return cleaned ? parseFloat(cleaned[0]) : null;
}

// معالجة النصوص والروابط
function renderFormattedText(text: string) {
  let processedText = text.replace(/\]\s*\n\s*\(/g, '](');
  const lines = processedText.split('\n');
  const elements: React.ReactNode[] = [];
  let tableRows: string[][] = [];
  let inTable = false;

  const formatInline = (str: string) => {
    const regex = /(\*\*.*?\*\*|\[([^\]]+)\]\((https?:\/\/[^\)]+)\)|https?:\/\/[^\s]+)/g;
    const parts = str.split(regex);
    const result: React.ReactNode[] = [];

    let i = 0;
    while (i < parts.length) {
      const part = parts[i];
      if (!part) { i++; continue; }

      if (part.startsWith('**') && part.endsWith('**')) {
        result.push(<strong key={`strong-${i}`} className="font-bold text-white">{toArabicNumerals(part.slice(2, -2))}</strong>);
      } else if (parts[i + 1] !== undefined && parts[i + 2] !== undefined && parts[i + 1].length > 0 && parts[i + 2].startsWith('http')) {
        const label = parts[i + 1];
        const url = parts[i + 2];
        const isYoutube = url.includes('youtu');
        
        if (!isYoutube) {
          result.push(
            <a key={`link-${i}`} href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 my-1 px-3 py-1.5 rounded-xl bg-blue-900/25 hover:bg-blue-900/40 border border-blue-500/30 text-blue-400 hover:text-blue-300 text-sm font-bold transition shadow-sm">
              <span>🔗</span><span>{toArabicNumerals(label)}</span><span className="text-[10px] opacity-70">↗</span>
            </a>
          );
        }
        i += 2;
      } else if (/^https?:\/\//.test(part)) {
        const isYoutube = part.includes('youtu');
        
        if (!isYoutube) {
          result.push(
            <a key={`url-${i}`} href={part} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 my-1 px-3 py-1.5 rounded-xl bg-blue-900/25 hover:bg-blue-900/40 border border-blue-500/30 text-blue-400 hover:text-blue-300 text-sm font-bold transition shadow-sm">
              <span>🔗</span><span>فتح الرابط المباشر</span><span className="text-[10px] opacity-70">↗</span>
            </a>
          );
        }
      } else {
        result.push(toArabicNumerals(part));
      }
      i++;
    }
    return result;
  };

  const flushTable = (keyIndex: number) => {
    if (tableRows.length === 0) return;
    const headers = tableRows[0];
    const body = tableRows.slice(1);

    const isComparisonTable = headers.length === 3 && body.length > 0 && 
                              body.filter(r => r.length >= 3 && parseStatNumber(r[1]) !== null && parseStatNumber(r[2]) !== null).length >= Math.ceil(body.length * 0.5);

    if (isComparisonTable) {
      const p1Title = headers[1]?.replace(/\*\*/g, '').trim() || 'الطرف الأول';
      const p2Title = headers[2]?.replace(/\*\*/g, '').trim() || 'الطرف الثاني';

      elements.push(
        <div key={`datamb-${keyIndex}`} className="my-5 p-4 rounded-3xl bg-black/40 backdrop-blur-md border border-emerald-900/40 shadow-2xl">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
            <span className="text-sm font-bold text-emerald-400 flex items-center gap-2">
              <span>📊</span><span>مقارنة الأداء الإحصائي</span>
            </span>
            <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/50">
              AiFBall Pro
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-5 text-center">
            <div className="p-3 rounded-2xl bg-black/30 border border-emerald-900/30">
              <span className="text-sm font-bold text-emerald-400 block truncate">{toArabicNumerals(p1Title)}</span>
            </div>
            <div className="p-3 rounded-2xl bg-black/30 border border-sky-900/30">
              <span className="text-sm font-bold text-sky-400 block truncate">{toArabicNumerals(p2Title)}</span>
            </div>
          </div>

          <div className="space-y-4">
            {body.map((row, rIdx) => {
              const metric = row[0]?.replace(/\*\*/g, '') || '';
              const val1Str = row[1]?.replace(/\*\*/g, '') || '-';
              const val2Str = row[2]?.replace(/\*\*/g, '') || '-';
              const n1 = parseStatNumber(val1Str);
              const n2 = parseStatNumber(val2Str);

              if (n1 !== null && n2 !== null && n1 + n2 > 0) {
                const total = Math.abs(n1) + Math.abs(n2);
                const p1 = Math.round((Math.abs(n1) / total) * 100);
                const p2 = 100 - p1;
                const p1Wins = n1 >= n2;

                return (
                  <div key={rIdx} className="space-y-2">
                    <div className="flex items-center justify-between text-sm px-1">
                      <span className={`font-bold ${p1Wins ? 'text-emerald-400' : 'text-gray-400'}`}>{toArabicNumerals(val1Str)}</span>
                      <span className="text-gray-300 font-medium text-center text-xs">{toArabicNumerals(metric)}</span>
                      <span className={`font-bold ${!p1Wins ? 'text-sky-400' : 'text-gray-400'}`}>{toArabicNumerals(val2Str)}</span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-black/40 overflow-hidden flex gap-1 p-0.5">
                      <div style={{ width: `${p1}%` }} className={`h-full rounded-full transition-all duration-700 ${p1Wins ? 'bg-gradient-to-l from-emerald-400 to-emerald-600' : 'bg-emerald-900/40'}`} />
                      <div style={{ width: `${p2}%` }} className={`h-full rounded-full transition-all duration-700 ${!p1Wins ? 'bg-gradient-to-r from-sky-400 to-sky-600' : 'bg-sky-900/40'}`} />
                    </div>
                  </div>
                );
              }
              return (
                <div key={rIdx} className="flex items-center justify-between py-2 px-3 rounded-xl bg-black/30 text-sm">
                  <span className="text-emerald-400 font-bold">{toArabicNumerals(val1Str)}</span>
                  <span className="text-gray-400 text-xs">{toArabicNumerals(metric)}</span>
                  <span className="text-sky-400 font-bold">{toArabicNumerals(val2Str)}</span>
                </div>
              );
            })}
          </div>
        </div>
      );
    } else {
      elements.push(
        <div key={`table-${keyIndex}`} className="my-5 w-full overflow-x-auto custom-scrollbar rounded-2xl border border-white/10 shadow-xl bg-black/40 backdrop-blur-md">
          <table className="w-full text-right border-collapse text-sm min-w-max">
            <thead>
              <tr className="bg-emerald-950/60 text-emerald-300">
                {headers.map((h, idx) => (
                  <th key={idx} className="py-3.5 px-4 font-bold border-b border-white/10 whitespace-nowrap">{formatInline(h)}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 bg-black/20">
              {body.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-white/5 transition-colors">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="py-3 px-4 whitespace-nowrap text-gray-200">{formatInline(cell)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    tableRows = [];
    inTable = false;
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      if (/^\|[\s\-:|]+\|$/.test(trimmed)) { inTable = true; return; }
      inTable = true;
      const cells = trimmed.slice(1, -1).split('|').map((c) => c.trim());
      tableRows.push(cells);
      return;
    }

    if (inTable) flushTable(index);

    if (!trimmed) {
      elements.push(<div key={index} className="h-1.5" />);
    } else if (trimmed.startsWith('### ')) {
      elements.push(<h3 key={index} className="text-lg font-bold text-emerald-400 mt-5 mb-2">{formatInline(trimmed.replace(/^###\s+/, ''))}</h3>);
    } else if (trimmed.startsWith('## ')) {
      elements.push(<h2 key={index} className="text-xl font-bold text-emerald-400 mt-5 mb-2">{formatInline(trimmed.replace(/^##\s+/, ''))}</h2>);
    } else if (trimmed.startsWith('# ')) {
      elements.push(<h1 key={index} className="text-2xl font-bold text-emerald-400 mt-5 mb-3">{formatInline(trimmed.replace(/^#\s+/, ''))}</h1>);
    } 
    else if (/^[-*+]\s+/.test(trimmed) || /^\d+\.\s+/.test(trimmed)) {
      const isNumbered = /^\d+\.\s+/.test(trimmed);
      const textPart = trimmed.replace(/^[-*+]\s+/, '').replace(/^\d+\.\s+/, '');
      const bullet = isNumbered ? toArabicNumerals(trimmed.match(/^\d+\./)![0]) : '•';
      elements.push(
        <div key={index} className="flex items-start gap-2.5 my-2 pr-1.5">
          <span className="text-emerald-500 mt-0.5 font-bold whitespace-nowrap">{bullet}</span>
          <span className="flex-1 leading-relaxed text-base text-gray-200">{formatInline(textPart)}</span>
        </div>
      );
    } else {
      elements.push(<p key={index} className="leading-relaxed my-2 text-base text-gray-100">{formatInline(trimmed)}</p>);
    }
  });

  if (inTable) flushTable(lines.length);

  const youtubeIds = extractYouTubeIds(text);
  if (youtubeIds.length > 0) {
    elements.push(
      <div key="youtube-embeds" className="mt-5 space-y-4">
        {youtubeIds.map((vid) => (
          <div key={vid} className="rounded-2xl overflow-hidden border border-emerald-500/30 bg-black/40 backdrop-blur-md shadow-xl">
            <div className="flex items-center justify-between px-4 py-2.5 bg-emerald-950/50 border-b border-white/10">
              <span className="text-xs sm:text-sm font-bold text-emerald-400">🎥 مشاهدة الملخص المدمج</span>
              <a href={`https://www.youtube.com/watch?v=${vid}`} target="_blank" rel="noopener noreferrer" className="text-[11px] text-gray-300 hover:text-white underline transition">
                فتح في تطبيق يوتيوب ↗
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

const STORAGE_KEY = 'aifball_chat_history_v8';

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

  const suggestionCards = [
    {
      question: 'اسلوب لعب الاتحاد مع الالماني فيسينغ',
      tag: 'تحليل تكتيكي',
      icon: '📋',
    },
    {
      question: 'أهداف وملخصات أبرز المباريات في الدوريات الكبرى',
      tag: 'أهداف وملخصات المباريات',
      icon: '🎬',
    },
    {
      question: 'ما هو جدول ترتيب دوري روشن السعودي حتى اليوم لموسم 2026-2027 وأبرز الإحصائيات؟',
      tag: 'ترتيب دوري روشن',
      icon: '📊',
    },
    {
      question: 'ما هو السجل التاريخي الكامل لأبطال دوري أبطال أوروبا؟',
      tag: 'التاريخ والبطولات',
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

      if (!res.ok) throw new Error('Network response was not ok');

      const reader = res.body?.getReader();
      const decoder = new TextDecoder('utf-8');
      let finalAnswer = '';
      let newConvId = conversationId;
      let buffer = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine.startsWith('data:')) {
              const dataStr = trimmedLine.replace(/^data:\s*/, '');
              if (!dataStr || dataStr === '[DONE]') continue;

              try {
                const parsed = JSON.parse(dataStr);
                
                if (parsed.event === 'message' && typeof parsed.answer === 'string') {
                  setLoading(false);
                  finalAnswer += parsed.answer;
                  
                  setMessages(prev => {
                    const updated = [...prev];
                    const lastIndex = updated.length - 1;
                    if (updated[lastIndex].role === 'assistant') {
                      updated[lastIndex].content = finalAnswer;
                    }
                    return updated;
                  });
                }

                if (parsed.conversation_id) {
                  newConvId = parsed.conversation_id;
                }
              } catch (e) {}
            }
          }
        }
      }

      if (newConvId) setConversationId(newConvId);

    } catch (error) {
      setMessages(prev => {
        const updated = [...prev];
        const lastIndex = updated.length - 1;
        if (updated[lastIndex].role === 'assistant') {
          updated[lastIndex].content = 'عذراً، تعذر الاتصال بالخادم.';
        }
        return updated;
      });
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
    <div dir="rtl" className="flex flex-col h-[100dvh] relative overflow-hidden font-saudi bg-[#131314] text-[#E3E3E3]">
      {/* خلفية الملعب العامة لتغطي الشاشة بالكامل في جميع الحالات (أثناء الترحيب أو المحادثة) */}
      <div 
        className="absolute inset-0 bg-cover bg-center filter brightness-[0.38] pointer-events-none z-0"
        style={{ backgroundImage: `url('/IMG_0091.jpeg')` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#131314]/90 via-[#131314]/70 to-[#131314]/60 pointer-events-none z-0" />

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
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .custom-scrollbar::-webkit-scrollbar {
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1A1C1E; 
          border-radius: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1D6B35; 
          border-radius: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #22C55E; 
        }
      `}</style>

      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/60 z-30 transition-opacity" />}

      <aside className={`fixed top-0 right-0 h-full w-72 sm:w-80 bg-[#18191A]/95 backdrop-blur-md border-l border-white/10 z-40 transform transition-transform duration-300 flex flex-col ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <AiFBallLogo size="sm" />
            <span className="font-bold text-white text-sm">سجل البحوث والمحادثات</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 transition">✕</button>
        </div>
        <div className="p-3">
          <button onClick={startNewChat} className="w-full py-2.5 px-4 rounded-xl bg-[#1D6B35] hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow">
            <span>+</span><span>بدء محادثة جديدة</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-1 space-y-1.5">
          {sessions.map((s) => (
            <div key={s.id} onClick={() => { setCurrentSessionId(s.id); setConversationId(s.conversationId); setMessages(s.messages); setSidebarOpen(false); }} className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 cursor-pointer text-xs truncate transition border border-transparent hover:border-white/10">
              {toArabicNumerals(s.title)}
            </div>
          ))}
        </div>
      </aside>

      <header className="flex items-center justify-between px-3.5 sm:px-6 py-2.5 border-b border-white/10 bg-[#131314]/80 sticky top-0 z-20 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <button onClick={() => setSidebarOpen(true)} className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-gray-200 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h10" /></svg>
          </button>
          <AiFBallLogo size="md" />
          <div>
            <h1 className="text-base font-bold text-white leading-tight">فوتبلاي</h1>
            <p className="text-[10px] text-emerald-400 font-medium">صديقك الرياضي</p>
          </div>
        </div>
        <button onClick={startNewChat} className="px-3 py-1.5 rounded-full text-xs font-medium bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 transition">+ محادثة جديدة</button>
      </header>

      <main className="flex-1 overflow-y-auto px-3.5 sm:px-6 py-4 max-w-4xl w-full mx-auto flex flex-col relative z-10">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col justify-center my-auto py-2">
            
            {/* الهوية البصرية النصية "HOME OF FOOTBALL" بتصميم نظيف كخط ليشت يزين أعلى الملعب */}
            <div className="text-right space-y-3 mb-6 px-1">
              <div className="inline-flex items-center gap-2 text-emerald-400 text-xs sm:text-sm font-bold tracking-widest uppercase pb-1 border-b-2 border-emerald-500/40">
                <span>⚽</span>
                <span>HOME OF FOOTBALL</span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white drop-shadow-md">
                أهلاً بك في فوتبلاي
              </h2>
              <p className="text-base sm:text-lg text-gray-200 leading-relaxed max-w-2xl font-normal drop-shadow">
                تحليل تكتيكي، تشكيلات مباريات، مقارنات إحصائية متقدمة، أسلوب لعب الفرق وفلسفة المدربين ومتابعة أهداف وملخصات المباريات.. كيف أساعدك اليوم؟
              </p>
            </div>

            {/* البطاقات الأربع شفافة جداً جداً مع حدود خفيفة وأنيقة */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full">
              {suggestionCards.map((card, i) => (
                <div key={i} className="flex flex-col justify-between text-right p-4 sm:p-5 rounded-2xl bg-black/10 backdrop-blur-sm border border-white/10 shadow-lg min-h-[115px] hover:border-emerald-500/50 hover:bg-black/20 transition">
                  <p className="text-sm sm:text-base font-bold text-gray-100 leading-relaxed line-clamp-2">{toArabicNumerals(card.question)}</p>
                  <div className="flex items-center justify-between w-full mt-3 pt-1">
                    <span className="text-xs sm:text-sm font-bold text-[#22C55E] truncate pl-1">{toArabicNumerals(card.tag)}</span>
                    <span className="w-8 h-8 rounded-full bg-black/30 flex items-center justify-center text-sm shadow-inner">{card.icon}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map((msg, i) => (
              msg.content && msg.content.trim() !== '' ? (
                <div key={i} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-start' : 'justify-end flex-row-reverse'}`}>
                  {msg.role === 'assistant' && <div className="mt-1 flex-shrink-0"><AiFBallLogo size="sm" /></div>}
                  <div className={`flex flex-col ${msg.role === 'user' ? 'max-w-[85%]' : 'w-full max-w-[90%]'}`}>
                    <div className={`rounded-2xl px-5 py-4 shadow-xl backdrop-blur-md ${msg.role === 'user' ? 'bg-[#2A2C2E]/90 text-white text-base rounded-tr-sm border border-white/10' : 'bg-black/50 text-gray-100 border border-white/10 text-base'}`}>
                      {msg.role === 'user' ? <p>{toArabicNumerals(msg.content)}</p> : renderFormattedText(msg.content)}
                    </div>
                  </div>
                </div>
              ) : null
            ))}
            {loading && (
              <div className="flex items-center gap-3 justify-end flex-row-reverse mt-4">
                <AiFBallLogo size="sm" />
                <div className="bg-black/50 backdrop-blur-md border border-white/10 rounded-2xl px-5 py-3 shadow-xl">
                  <span className="text-emerald-400 text-sm font-bold animate-pulse-slow flex items-center gap-2">
                    <span>⏳</span> جاري البحث في المصادر الرياضيه ..
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      <footer className="p-3 bg-[#131314]/80 backdrop-blur-md border-t border-white/10 relative z-20">
        <div className="max-w-4xl mx-auto">
          {attachedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2 px-2">
              {attachedFiles.map((f, idx) => (
                <div key={idx} className="flex items-center gap-1.5 bg-black/40 border border-emerald-500/50 px-3 py-1.5 rounded-lg text-xs text-emerald-300 shadow-sm backdrop-blur-md">
                  <span>📎 {toArabicNumerals(f.name)}</span>
                  <button onClick={() => setAttachedFiles((prev) => prev.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-300 font-bold ml-1 transition">✕</button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md border border-white/10 rounded-full px-3 py-2 shadow-xl">
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} multiple accept="image/*,.pdf,.doc,.docx" className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} title="إرفاق ملف" className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white flex items-center justify-center font-bold text-xl flex-shrink-0 transition">
              +
            </button>

            <button onClick={handleVoiceSearch} title="بحث صوتي" className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition shadow-sm ${isListening ? 'bg-emerald-600 text-white animate-pulse' : 'bg-white/10 hover:bg-white/20 text-emerald-400 hover:text-emerald-300'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 10v1a7 7 0 01-14 0v-1M12 18.5V22M8 22h8" />
              </svg>
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder={isListening ? 'جاري الاستماع لصوتك...' : 'اسأل فوتبلاي عن أي مباراة، تحليل تكتيكي، أو إحصائيات...'}
              className="flex-1 bg-transparent px-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none"
            />

            <button onClick={() => sendMessage()} disabled={loading || (!input.trim() && attachedFiles.length === 0)} className="w-10 h-10 rounded-full bg-[#1D6B35] hover:bg-emerald-600 disabled:opacity-40 flex items-center justify-center text-white flex-shrink-0 transition shadow-md">
              ➤
            </button>
          </div>
          <p className="text-[11px] text-center text-gray-500 mt-2.5">منصة فوتبلاي للذكاء الاصطناعي الرياضي • by خالد العايش</p>
        </div>
      </footer>
    </div>
  );
}
