'use client';
import React, { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
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

// استخراج معرفات يوتيوب
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

// استخراج روابط تويتر / X
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

// معالجة النصوص والروابط لجعلها أزرار ضغط مباشر
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
      } else if (parts[i + 1] !== undefined && parts[i + 2] !== undefined && parts[i + 1].length > 0 && parts[i + 2].startsWith('http')) {
        const label = parts[i + 1];
        const url = parts[i + 2];
        result.push(
          <a
            key={`link-${i}`}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 my-0.5 px-2.5 py-1 rounded-lg bg-[#006C35]/20 hover:bg-[#006C35]/40 border border-emerald-500/40 text-emerald-300 hover:text-white text-xs font-bold transition shadow-sm"
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
            <span>🔗 رابط المصدر ↗</span>
          </a>
        );
      } else {
        result.push(part);
      }
      i++;
    }
    return result;
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
              {headers.map((h, idx) => (
                <th key={idx} className="py-2.5 px-3 font-bold whitespace-nowrap">
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
        <div key={index} className="flex items-start gap-2 my-1.5 pr-2">
          <span className="text-emerald-500 mt-0.5">•</span>
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

  const youtubeIds = extractYouTubeIds(text);
  if (youtubeIds.length > 0) {
    elements.push(
      <div key="youtube-embeds" className="mt-4 space-y-3">
        {youtubeIds.map((vid) => (
          <div
            key={vid}
            className="rounded-2xl overflow-hidden border border-emerald-500/30 bg-[#131314] shadow-lg"
          >
            <div className="flex items-center justify-between px-3.5 py-2 bg-[#1D6B35]/20 border-b border-gray-800">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <span>🎥</span>
                <span>ملخص وفيديو المباراة (يوتيوب)</span>
              </span>
              <a
                href={`https://www.youtube.com/watch?v=${vid}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-gray-300 hover:text-white underline"
              >
                فتح في يوتيوب ↗
              </a>
            </div>
            <div className="relative w-full aspect-video">
              <iframe
                src={`https://www.youtube.com/embed/${vid}`}
                title="YouTube video player"
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const twitterLinks = extractTwitterLinks(text);
  if (twitterLinks.length > 0) {
    elements.push(
      <div key="twitter-embeds" className="mt-4 space-y-3">
        {twitterLinks.map((item) => (
          <div
            key={item.id}
            className="rounded-2xl overflow-hidden border border-sky-500/30 bg-[#15202B] p-4 shadow-lg text-right"
          >
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-800">
              <span className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
                <span>𝕏</span>
                <span>مقاطع وفيديو من منصة X (تويتر)</span>
              </span>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-gray-300 hover:text-white underline"
              >
                عرض التغريدة الأصلية ↗
              </a>
            </div>
            <div className="text-sm text-gray-200 py-2">
              <p>تم جلب التغريدة المرئية بنجاح عبر المحلل الرياضي.</p>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-3 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition shadow"
              >
                شاهد الفيديو على تويتر ↗
              </a>
            </div>
          </div>
        ))}
      </div>
    );
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

  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const [openMenuIndex, setOpenMenuIndex] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestionCards = [
    {
      question: 'قدم لي تحليلاً تكتيكياً وإحصائياً لأسلوب لعب الاتحاد وفلسفة المدرب الألماني فيسينغ هذا الموسم',
      tag: 'تحليل تكتيكي (فيسينغ والاتحاد)',
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
      if (saved) {
        setSessions(JSON.parse(saved));
      }
    } catch {
      // تجاهل
    }
  }, []);

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

  const cleanTextForShareOrSpeech = (raw: string) =>
    raw
      .replace(/[#*|]/g, ' ')
      .replace(/-{2,}/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const handleCopy = async (text: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(idx);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      // تجاهل
    }
  };

  const handleShare = async (text: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'فوتبلاي - صديقك الرياضي',
          text: `${text}\n\nعبر منصة فوتبلاي (aifball.com)`,
        });
        return;
      } catch {
        // تجاهل
      }
    }
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // تجاهل
    }
  };

  const handleSpeak = (text: string, idx: number) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (speakingIndex === idx) {
      window.speechSynthesis.cancel();
      setSpeakingIndex(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(cleanTextForShareOrSpeech(text));
    utterance.lang = 'ar-SA';
    utterance.rate = 1.0;
    utterance.onend = () => setSpeakingIndex(null);
    utterance.onerror = () => setSpeakingIndex(null);
    setSpeakingIndex(idx);
    window.speechSynthesis.speak(utterance);
  };

  const handleFeedback = (idx: number, type: 'like' | 'dislike') => {
    setMessages((prev) =>
      prev.map((m, i) =>
        i === idx ? { ...m, feedback: m.feedback === type ? null : type } : m
      )
    );
  };

  const handleRegenerate = (assistantIdx: number) => {
    setOpenMenuIndex(null);
    for (let i = assistantIdx - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        sendMessage(messages[i].content);
        break;
      }
    }
  };

  const getRelatedUserQuery = (assistantIdx: number) => {
    for (let i = assistantIdx - 1; i >= 0; i--) {
      if (messages[i]?.role === 'user') {
        return messages[i].content;
      }
    }
    return 'تحليل تكتيكي للمباريات';
  };

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
            // تجاهل
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
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setSpeakingIndex(null);
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

      <header className="flex items-center justify-between px-3.5 sm:px-6 py-2.5 border-b border-gray-800/80 bg-[#131314]/95 backdrop-blur sticky top-0 z-20">
        <div className="flex items-center gap-2.5">
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
            <h1 className="text-sm sm:text-base font-extrabold text-white leading-tight flex items-center gap-1.5 tracking-wide">
              <span>فوتبلاي</span>
              <span className="text-sm sm:text-base font-extrabold text-white tracking-wide">FootBall Ai</span>
            </h1>
            <p className="text-[10px] sm:text-[11px] text-emerald-400 font-medium">صديقك الرياضي</p>
          </div>
        </div>

        <button
          onClick={startNewChat}
          className="px-3 py-1.5 rounded-full text-xs font-medium bg-[#1E1F20] hover:bg-gray-800 text-gray-200 border border-gray-700/70 transition"
        >
          + محادثة جديدة
        </button>
      </header>

      <main className="flex-1 overflow-y-auto px-3.5 sm:px-6 py-4 max-w-4xl w-full mx-auto flex flex-col">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col justify-center my-auto py-2">
            <div className="text-right space-y-1.5 mb-5 px-1">
              <h2 className="text-2xl sm:text-4xl font-black text-[#22C55E] tracking-tight flex flex-wrap items-center gap-2">
                <span>أهلاً بك في فوتبلاي</span>
                <span className="text-2xl sm:text-3xl font-black text-white tracking-wide">FootBall Ai</span>
              </h2>
              <p className="text-xs sm:text-lg font-bold text-gray-300 leading-relaxed">
                تحليل تكتيكي وإحصائي لأسلوب لعب الفرق وفلسفة المدربين ومتابعة أهداف وملخصات المباريات.. كيف أساعدك اليوم؟
              </p>
            </div>

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
          <div className="space-y-6">
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
                  className={`flex flex-col ${
                    msg.role === 'user' ? 'max-w-[85%]' : 'w-full max-w-[90%] sm:max-w-[85%]'
                  }`}
                >
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm ${
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
                        <span className="animate-pulse">جاري إعداد التحليل التكتيكي وإحصائيات المدربين...</span>
                      </div>
                    )}
                  </div>

                  {msg.role === 'assistant' && msg.content && (
                    <div className="flex flex-wrap items-center justify-between gap-2 mt-1.5 px-1 text-gray-400 relative select-none">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleCopy(msg.content, i)}
                          title="نسخ النص"
                          className="p-1.5 rounded-lg hover:bg-gray-800/70 hover:text-white transition"
                        >
                          {copiedIndex === i ? (
                            <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" strokeWidth={1.8} />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                            </svg>
                          )}
                        </button>

                        <button
                          onClick={() => handleShare(msg.content)}
                          title="مشاركة"
                          className="p-1.5 rounded-lg hover:bg-gray-800/70 hover:text-white transition"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 3v12m0-12L8 7m4-4l4 4" />
                          </svg>
                        </button>

                        <button
                          onClick={() => handleSpeak(msg.content, i)}
                          title={speakingIndex === i ? 'إيقاف القراءة' : 'استماع للرد'}
                          className={`p-1.5 rounded-lg hover:bg-gray-800/70 transition ${
                            speakingIndex === i ? 'text-emerald-400 bg-gray-800/50' : 'hover:text-white'
                          }`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.8}
                              d="M11 5L6 9H2v6h4l5 4V5zM15.54 8.46a5 5 0 010 7.07M19.07 4.93a10 10 0 010 14.14"
                            />
                          </svg>
                        </button>

                        <button
                          onClick={() => handleFeedback(i, 'like')}
                          title="أعجبني"
                          className={`p-1.5 rounded-lg hover:bg-gray-800/70 transition ${
                            msg.feedback === 'like' ? 'text-emerald-400' : 'hover:text-white'
                          }`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.8}
                              d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3zM7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"
                            />
                          </svg>
                        </button>

                        <button
                          onClick={() => handleFeedback(i, 'dislike')}
                          title="لم يعجبني"
                          className={`p-1.5 rounded-lg hover:bg-gray-800/70 transition ${
                            msg.feedback === 'dislike' ? 'text-red-400' : 'hover:text-white'
                          }`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.8}
                              d="M10 15v4a3 3 0 003 3l4-9V2H5.72a2 2 0 00-2 1.7l-1.38 9a2 2 0 002 2.3zm7-13h2.67A2.31 2.31 0 0122 4v7a2.31 2.31 0 01-2.33 2H17"
                            />
                          </svg>
                        </button>

                        <div className="relative">
                          <button
                            onClick={() => setOpenMenuIndex(openMenuIndex === i ? null : i)}
                            title="خيارات إضافية"
                            className="p-1.5 rounded-lg hover:bg-gray-800/70 hover:text-white transition"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <circle cx="5" cy="12" r="1.8" />
                              <circle cx="12" cy="12" r="1.8" />
                              <circle cx="19" cy="12" r="1.8" />
                            </svg>
                          </button>

                          {openMenuIndex === i && (
                            <div className="absolute right-0 bottom-9 w-44 rounded-xl bg-[#232527] border border-gray-700 shadow-xl py-1.5 z-20 text-xs text-gray-200">
                              <button
                                onClick={() => handleRegenerate(i)}
                                className="w-full text-right px-3.5 py-2 hover:bg-gray-700/60 transition flex items-center gap-2"
                              >
                                <span>🔄</span>
                                <span>إعادة توليد الرد</span>
                              </button>
                              <button
                                onClick={() => {
                                  handleCopy(msg.content, i);
                                  setOpenMenuIndex(null);
                                }}
                                className="w-full text-right px-3.5 py-2 hover:bg-gray-700/60 transition flex items-center gap-2"
                              >
                                <span>📋</span>
                                <span>نسخ النص الكامل</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <a
                          href={`https://www.youtube.com/results?search_query=${encodeURIComponent(
                            'تحليل تكتيكي أهداف ' + getRelatedUserQuery(i)
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#1E1F20] hover:bg-[#1D6B35]/30 border border-gray-700/80 hover:border-emerald-500/50 text-[11px] text-emerald-400 font-medium transition"
                        >
                          <span>🎬</span>
                          <span>يوتيوب</span>
                        </a>
                        <a
                          href={`https://x.com/search?q=${encodeURIComponent(
                            getRelatedUserQuery(i) + ' تكتيك تحليل'
                          )}&f=live`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#1E1F20] hover:bg-sky-500/20 border border-gray-700/80 hover:border-sky-500/50 text-[11px] text-sky-400 font-medium transition"
                        >
                          <span>𝕏</span>
                          <span>مقاطع X</span>
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      <footer className="p-3 bg-[#131314] border-t border-gray-800/60">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 bg-[#1E1F20] border border-gray-700/70 rounded-full px-3 py-1.5">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="اسأل عن فلسفة المدربين، تكتيك الفرق، أو ملخصات المباريات..."
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
