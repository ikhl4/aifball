'use client';
import React, { useState, useRef, useEffect } from 'react';
import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  userQuery?: string;
  imageUrls?: string[]; 
  feedback?: 'like' | 'dislike' | null;
  thoughts?: string[];
  thinkingTime?: number;
}

interface ChatSession {
  id: string;
  title: string;
  conversationId: string;
  messages: Message[];
  updatedAt: string;
}

const formatSeconds = (sec: number) => {
  if (sec === 0) return '0 ثانية';
  if (sec === 1) return 'ثانية واحدة';
  if (sec === 2) return 'ثانيتان';
  if (sec >= 3 && sec <= 10) return `${sec} ثوانٍ`;
  return `${sec} ثانية`;
};

function AiFBallLogo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const [imgError, setImgError] = useState(false);
  const dimensions = size === 'sm' ? 'w-8 h-8 rounded-lg' : size === 'lg' ? 'w-14 h-14 rounded-2xl' : 'w-10 h-10 rounded-xl';

  if (!imgError) {
    return <img src="/logo.png" alt="AiFBall" onError={() => setImgError(true)} className={`${dimensions} object-cover shadow-sm flex-shrink-0 select-none`} />;
  }

  return (
    <div className={`${dimensions} bg-[#1D6B35] flex items-center justify-center shadow-sm flex-shrink-0 select-none overflow-hidden`}>
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <rect width="200" height="200" rx="42" fill="#1D6B35" />
        <g transform="translate(100, 74)">
          <circle r="48" fill="#FFFFFF" />
          <polygon points="0,-19 18,-6 11,15 -11,15 -18,-6" fill="#FFFFFF" stroke="#1D6B35" strokeWidth="5.5" strokeLinejoin="round" />
          <path d="M0,-19 L0,-37 M18,-6 L35,-12 M11,15 L22,31 M-11,15 L-22,31 M-18,-6 L-35,-12" stroke="#1D6B35" strokeWidth="5.5" strokeLinecap="round" />
          <path d="M-19,-35 L0,-37 L19,-35 M19,-35 L35,-12 L37,8 M37,8 L22,31 L0,38 M0,38 L-22,31 L-37,8 M-37,8 L-35,-12 L-19,-35" fill="none" stroke="#1D6B35" strokeWidth="5" strokeLinejoin="round" />
          <path d="M-19,-35 L-26,-43 M19,-35 L26,-43 M35,-12 L46,-16 M37,8 L47,15 M22,31 L29,40 M0,38 L0,48 M-22,31 L-29,40 M-37,8 L-47,15 M-35,-12 L-46,-16" stroke="#1D6B35" strokeWidth="5" strokeLinecap="round" />
          <circle r="47" fill="none" stroke="#1D6B35" strokeWidth="4" />
        </g>
        <text x="100" y="168" textAnchor="middle" fill="#FFFFFF" fontSize="43" fontWeight="900" fontStyle="italic" fontFamily="system-ui, -apple-system, sans-serif" letterSpacing="-1">AiFBall</text>
      </svg>
    </div>
  );
}

function extractYouTubeIds(text: string): string[] {
  const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/g;
  const ids: string[] = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match[1] && !ids.includes(match[1])) ids.push(match[1]);
  }
  return ids;
}

function parseStatNumber(val: string): number | null {
  const cleaned = val.replace(/,/g, '').match(/-?\d+(\.\d+)?/);
  return cleaned ? parseFloat(cleaned[0]) : null;
}

function renderInlineText(text: string) {
  const linkParts = text.split(/(\[.*?\]\(.*?\))/g);
  
  return linkParts.map((part, pIdx) => {
    if (part.startsWith('[') && part.endsWith(')')) {
      const match = part.match(/\[(.*?)\]\((.*?)\)/);
      if (match) {
        return (
          <a key={pIdx} href={match[2]} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 my-1 mx-1 px-3 py-1 rounded-lg bg-blue-900/20 hover:bg-blue-900/40 border border-blue-500/20 text-blue-400 text-sm font-bold transition">
            <span>🔗</span><span>{match[1]}</span>
          </a>
        );
      }
    }

    const urlParts = part.split(/(https?:\/\/[^\s]+)/g);
    return urlParts.map((urlPart, uIdx) => {
      if (urlPart.match(/^https?:\/\//)) {
        return <a key={`${pIdx}-${uIdx}`} href={urlPart} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 underline font-medium break-all">{urlPart}</a>;
      }
      const boldParts = urlPart.split(/(\*\*.*?\*\*)/g);
      return boldParts.map((bPart, bIdx) => {
        if (bPart.startsWith('**') && bPart.endsWith('**')) {
           return <strong key={`${pIdx}-${uIdx}-${bIdx}`} className="font-extrabold text-emerald-400 mx-0.5">{bPart.slice(2, -2)}</strong>;
        }
        return <span key={`${pIdx}-${uIdx}-${bIdx}`}>{bPart}</span>;
      });
    });
  });
}

function renderFormattedText(text: string) {
  const youtubeIds = extractYouTubeIds(text);
  let processedText = text.replace(/\]\s*\n\s*\(/g, '](');
  const lines = processedText.split('\n');
  const elements: React.ReactNode[] = [];
  let tableRows: string[][] = [];
  let inTable = false;

  const cleanCell = (str: string) => str.replace(/\*\*/g, '').trim();

  const flushTable = (keyIndex: number) => {
    if (tableRows.length === 0) return;
    const headers = tableRows[0];
    const body = tableRows.slice(1);
    const isComparisonTable = headers.length === 3 && body.length > 0 && body.filter(r => r.length >= 3 && parseStatNumber(r[1]) !== null && parseStatNumber(r[2]) !== null).length >= Math.ceil(body.length * 0.5);

    if (isComparisonTable) {
      const p1Title = cleanCell(headers[1]) || 'الطرف الأول';
      const p2Title = cleanCell(headers[2]) || 'الطرف الثاني';
      elements.push(
        <div key={`datamb-${keyIndex}`} className="my-6 p-4 md:p-5 rounded-2xl bg-[#1A1C1E] border border-white/5 shadow-md w-full">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/5">
            <span className="text-sm font-bold text-gray-200 flex items-center gap-2"><span>📊</span><span>مقارنة الأداء الإحصائي</span></span>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-5 text-center">
            <div className="p-2.5 rounded-xl bg-black/20 border border-emerald-900/30"><span className="text-sm font-bold text-emerald-400 block truncate">{p1Title}</span></div>
            <div className="p-2.5 rounded-xl bg-black/20 border border-sky-900/30"><span className="text-sm font-bold text-sky-400 block truncate">{p2Title}</span></div>
          </div>
          <div className="space-y-4">
            {body.map((row, rIdx) => {
              const metric = cleanCell(row[0]);
              const val1Str = cleanCell(row[1]) || '-';
              const val2Str = cleanCell(row[2]) || '-';
              const n1 = parseStatNumber(val1Str);
              const n2 = parseStatNumber(val2Str);
              if (n1 !== null && n2 !== null && n1 + n2 > 0) {
                const total = Math.abs(n1) + Math.abs(n2);
                const p1 = Math.round((Math.abs(n1) / total) * 100);
                const p2 = 100 - p1;
                const p1Wins = n1 >= n2;
                return (
                  <div key={rIdx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm px-1">
                      <span className={`font-bold ${p1Wins ? 'text-emerald-400' : 'text-gray-400'}`}>{val1Str}</span>
                      <span className="text-gray-400 font-medium text-center text-xs">{metric}</span>
                      <span className={`font-bold ${!p1Wins ? 'text-sky-400' : 'text-gray-400'}`}>{val2Str}</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-black/30 overflow-hidden flex gap-1 p-0.5">
                      <div style={{ width: `${p1}%` }} className={`h-full rounded-full transition-all duration-700 ${p1Wins ? 'bg-emerald-500' : 'bg-emerald-900/40'}`} />
                      <div style={{ width: `${p2}%` }} className={`h-full rounded-full transition-all duration-700 ${!p1Wins ? 'bg-sky-500' : 'bg-sky-900/40'}`} />
                    </div>
                  </div>
                );
              }
              return (
                <div key={rIdx} className="flex items-center justify-between py-2 px-3 rounded-xl bg-black/20 text-sm">
                  <span className="text-emerald-400 font-bold">{val1Str}</span>
                  <span className="text-gray-400 text-xs">{metric}</span>
                  <span className="text-sky-400 font-bold">{val2Str}</span>
                </div>
              );
            })}
          </div>
        </div>
      );
    } else {
      elements.push(
        <div key={`table-${keyIndex}`} className="my-6 w-full max-w-full overflow-x-auto custom-scrollbar rounded-2xl border border-white/5 shadow-md bg-[#181A1C]">
          <table className="w-full text-right border-collapse text-sm min-w-max">
            <thead className="bg-[#131517]">
              <tr>
                {headers.map((h, idx) => (
                  <th key={idx} className="py-4 px-5 font-bold text-gray-300 border-b border-white/5 whitespace-nowrap">{cleanCell(h)}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {body.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-white/5 transition-colors even:bg-[#151719]">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="py-3.5 px-5 whitespace-nowrap text-gray-300 font-medium">{cleanCell(cell)}</td>
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
    if (trimmed.startsWith('```')) return;
    if (trimmed.startsWith('<api-sports-widget') && trimmed.includes('</api-sports-widget>')) {
      if (inTable) flushTable(index);
      const attrRegex = /data-([a-zA-Z0-9-]+)="([^"]+)"/g;
      let match;
      const props: any = {};
      while ((match = attrRegex.exec(trimmed)) !== null) {
        props[`data-${match[1]}`] = match[2];
      }
      elements.push(
        <div key={`widget-${index}`} className="my-6 w-full max-w-full overflow-hidden rounded-2xl border border-white/5 shadow-md bg-transparent relative min-h-[100px]">
          {React.createElement('api-sports-widget', props)}
        </div>
      );
      return;
    }

    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      if (/^\|[\s\-:|]+\|$/.test(trimmed)) { inTable = true; return; }
      inTable = true;
      const cells = trimmed.slice(1, -1).split('|').map((c) => c.trim());
      tableRows.push(cells);
      return;
    }
    if (inTable) flushTable(index);

    if (!trimmed) {
      elements.push(<div key={index} className="h-2" />);
    } else if (trimmed.startsWith('### ')) {
      elements.push(<h3 key={index} className="text-lg font-bold text-gray-100 mt-6 mb-3">{renderInlineText(trimmed.replace(/^###\s+/, ''))}</h3>);
    } else if (trimmed.startsWith('## ')) {
      elements.push(<h2 key={index} className="text-xl font-bold text-gray-100 mt-7 mb-4 border-b border-white/10 pb-2">{renderInlineText(trimmed.replace(/^##\s+/, ''))}</h2>);
    } else if (trimmed.startsWith('# ')) {
      elements.push(<h1 key={index} className="text-2xl font-black text-gray-100 mt-8 mb-4">{renderInlineText(trimmed.replace(/^#\s+/, ''))}</h1>);
    } else if (/^[-*+]\s+/.test(trimmed) || /^\d+\.\s+/.test(trimmed)) {
      const isNumbered = /^\d+\.\s+/.test(trimmed);
      const textPart = trimmed.replace(/^[-*+]\s+/, '').replace(/^\d+\.\s+/, '');
      const bullet = isNumbered ? trimmed.match(/^\d+\./)![0] : '•';
      elements.push(
        <div key={index} className="flex items-start gap-3 my-2.5 pr-2">
          <span className="text-emerald-500 font-bold whitespace-nowrap mt-0.5">{bullet}</span>
          <span className="flex-1 leading-relaxed text-base text-gray-300">{renderInlineText(textPart)}</span>
        </div>
      );
    } else {
      elements.push(<p key={index} className="leading-relaxed my-3 text-base text-gray-300">{renderInlineText(trimmed)}</p>);
    }
  });

  if (inTable) flushTable(lines.length);

  return elements;
}

const STORAGE_KEY = 'aifball_chat_history_v9';

export default function FootPlayChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingSeconds, setLoadingSeconds] = useState(0); 

  const [conversationId, setConversationId] = useState('');
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<{file: File, url: string}[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestionCards = [
    { question: 'تحليل أسلوب لعب الاتحاد مع لوران بلان', tag: 'تحليل تكتيكي', icon: '📋' },
    { question: 'ما هو جدول ترتيب دوري روشن السعودي؟', tag: 'ترتيب وإحصائيات', icon: '📊' },
    { question: 'قارن بين أرقام رونالدو وميتروفيتش هذا الموسم', tag: 'مقارنة لاعبين', icon: '⚔️' },
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      setLoadingSeconds(0);
      interval = setInterval(() => {
        setLoadingSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [loading]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setSessions(JSON.parse(saved));
    } catch {}
    if (!document.querySelector('script[src="[https://widgets.api-sports.io/2.0.0/widgets.js](https://widgets.api-sports.io/2.0.0/widgets.js)"]')) {
      const script = document.createElement('script');
      script.type = 'module';
      script.src = '[https://widgets.api-sports.io/2.0.0/widgets.js](https://widgets.api-sports.io/2.0.0/widgets.js)';
      document.body.appendChild(script);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleVoiceSearch = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return alert('متصفحك لا يدعم البحث الصوتي.');
    if (isListening) return setIsListening(false);
    
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
      const newFiles = Array.from(e.target.files).map(file => ({ file, url: URL.createObjectURL(file) }));
      setAttachedFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const sendMessage = async (textToSend?: string) => {
    const query = (textToSend ?? input).trim();
    if ((!query && attachedFiles.length === 0) || loading) return;

    const imageUrls = attachedFiles.map(f => f.url);
    const newMessages: Message[] = [...messages, { role: 'user', content: query, userQuery: query, imageUrls }];
    setMessages([...newMessages, { role: 'assistant', content: '', userQuery: query, thoughts: [] }]);
    setInput('');
    
    const filesToUpload = [...attachedFiles];
    setAttachedFiles([]);
    setLoading(true);

    let activeSessionId = currentSessionId || Date.now().toString();
    setCurrentSessionId(activeSessionId);
    let finalConvId = conversationId;
    let finalAnswer = '';
    const requestStartTime = Date.now();

    const saveSessionProgress = (msgs: Message[]) => {
      setSessions(prevSessions => {
        const idx = prevSessions.findIndex(s => s.id === activeSessionId);
        const title = msgs.find(m => m.role === 'user')?.content.slice(0, 30) || 'محادثة جديدة';
        const updatedSession = { id: activeSessionId, title: title + (title.length >= 30 ? '...' : ''), conversationId: finalConvId, messages: msgs, updatedAt: new Date().toISOString() };
        const newSessions = [...prevSessions];
        if (idx >= 0) newSessions[idx] = updatedSession; else newSessions.unshift(updatedSession);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newSessions));
        return newSessions;
      });
    };

    try {
      const requestBody: any = { query: query, conversation_id: conversationId };
      const res = await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody),
      });
      if (!res.ok) throw new Error('Network response was not ok');

      const reader = res.body?.getReader();
      const decoder = new TextDecoder('utf-8');
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
                if ((parsed.event === 'message' || parsed.event === 'agent_message') && typeof parsed.answer === 'string') {
                  finalAnswer += parsed.answer;
                }
                if (parsed.conversation_id) {
                  finalConvId = parsed.conversation_id; setConversationId(finalConvId);
                }
                if (parsed.event === 'error') {
                  finalAnswer = `خطأ في جلب البيانات: ${parsed.message || 'غير معروف'}`; break;
                }
              } catch (e) {}
            }
          }
          const elapsedSeconds = Math.max(1, Math.floor((Date.now() - requestStartTime) / 1000));
          setMessages(prev => {
            const updated = [...prev];
            const lastIndex = updated.length - 1;
            if (updated[lastIndex].role === 'assistant') {
              updated[lastIndex].content = finalAnswer;
              updated[lastIndex].thinkingTime = elapsedSeconds;
            }
            return updated;
          });
        }
      }
      saveSessionProgress(messages);
    } catch (error) {
      setMessages(prev => {
        const updated = [...prev];
        const lastIndex = updated.length - 1;
        if (updated[lastIndex].role === 'assistant' && !finalAnswer) {
          updated[lastIndex].content = 'عذراً، تعذر الاتصال بالخادم الرياضي. يرجى التأكد من اتصالك بالإنترنت.';
        }
        return updated;
      });
    } finally {
      setLoading(false);
    }
  };

  const startNewChat = () => {
    setMessages([]); setConversationId(''); setCurrentSessionId(''); setInput(''); setAttachedFiles([]); setSidebarOpen(false);
  };

  return (
    <div dir="rtl" className="flex flex-col h-[100dvh] relative overflow-hidden font-saudi bg-[#131314] text-[#E3E3E3]">
      <style jsx global>{`
        @import url('[https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap](https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap)');
        .font-saudi, body, input, button, textarea, h1, h2, h3, p, span { font-family: 'Cairo', sans-serif !important; font-feature-settings: "calt" 1, "liga" 1; }
        @keyframes pulse-slow { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        .animate-pulse-slow { animation: pulse-slow 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        .custom-scrollbar::-webkit-scrollbar { height: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #131517; border-radius: 8px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #2E3338; border-radius: 8px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #1D6B35; }
      `}</style>

      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/60 z-30 transition-opacity backdrop-blur-sm" />}
      <aside className={`fixed top-0 right-0 h-full w-72 sm:w-80 bg-[#181A1C]/95 backdrop-blur-2xl border-l border-white/5 z-40 transform transition-transform duration-300 flex flex-col shadow-2xl ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <AiFBallLogo size="sm"/>
            <span className="font-bold text-gray-200 text-sm">سجل المحادثات</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 transition flex items-center justify-center">✕</button>
        </div>
        <div className="p-4">
          <button onClick={startNewChat} className="w-full py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-gray-200 font-bold text-xs flex items-center justify-center gap-2 transition border border-white/5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
            <span>محادثة جديدة</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-1 space-y-2 custom-scrollbar">
          {sessions.map((s) => (
            <div key={s.id} onClick={() => { setCurrentSessionId(s.id); setConversationId(s.conversationId); setMessages(s.messages); setSidebarOpen(false); }} className="p-3 rounded-xl bg-transparent hover:bg-white/5 text-gray-400 hover:text-gray-200 cursor-pointer text-xs truncate transition border border-transparent">
              {s.title}
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-white/5 bg-[#131517] mt-auto">
          <SignedOut>
            <SignInButton mode="modal">
              <button className="w-full py-3 px-4 rounded-xl bg-[#1D6B35] hover:bg-emerald-600 text-white font-bold text-sm flex items-center justify-center gap-2 transition shadow-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>
                <span>تسجيل الدخول</span>
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
              <div className="flex items-center gap-3">
                <UserButton "w-9 afterSignOutUrl="/" appearance="{{" avatarBox: border-2 border-emerald-500/30" elements: h-9 { } }}/>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-gray-200">حسابي</span>
                  <span className="text-[10px] text-emerald-400">متصل الآن</span>
                </div>
              </div>
            </div>
          </SignedIn>
        </div>
      </aside>

      <header className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/5 bg-[#131314]/90 sticky top-0 z-20 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="w-10 h-10 rounded-full hover:bg-white/5 flex items-center justify-center text-gray-300 transition">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <AiFBallLogo size="md"/>
          <div>
            <h1 className="text-lg font-black text-white leading-none tracking-tight">فوتبلاي</h1>
          </div>
        </div>
        <button onClick={startNewChat} className="p-2 sm:px-4 sm:py-2 rounded-full text-xs font-bold bg-white/5 hover:bg-white/10 text-gray-300 transition hidden sm:flex items-center gap-2">
           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
           محادثة جديدة
        </button>
      </header>

      <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 max-w-4xl w-full mx-auto flex flex-col relative z-10 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col justify-center my-auto py-2">
            <div className="text-right space-y-4 mb-8">
              <AiFBallLogo size="lg"/>
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white mt-4">كيف أساعدك اليوم؟</h2>
              <p className="text-base sm:text-lg text-gray-400 font-medium max-w-2xl">
                اطرح أي سؤال رياضي، ابحث عن إحصائيات، قارن بين اللاعبين، أو اطلب تحليلاً تكتيكياً مفصلاً لمباراة.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
              {suggestionCards.map((card, i) => (
                <div key={i} className="flex flex-col text-right p-5 rounded-2xl bg-[#1A1C1E] border border-white/5 hover:bg-[#222528] transition cursor-pointer shadow-sm group" onClick={() => { setInput(card.question); sendMessage(card.question); }}>
                  <span className="text-2xl mb-3 opacity-80 group-hover:opacity-100 transition">{card.icon}</span>
                  <span className="text-[11px] font-bold text-emerald-500 mb-1">{card.tag}</span>
                  <p className="text-sm font-bold text-gray-200 leading-relaxed">{card.question}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-8 pb-4">
            {messages.map((msg, i) => (
              (msg.content && msg.content.trim() !== '') || (msg.imageUrls && msg.imageUrls.length > 0) ? (
                <div key={i} className="flex items-start gap-4 w-full">
                  <div className="flex-shrink-0 mt-1 hidden sm:block">
                     {msg.role === 'assistant' ? (
                        <AiFBallLogo size="sm"/>
                     ) : (
                        <div className="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center text-white text-[10px] font-bold shadow-sm">أنت</div>
                     )}
                  </div>
                  <div className="flex flex-col w-full min-w-0">
                     {msg.role === 'user' ? (
                        <div className="text-gray-100 text-lg sm:text-xl font-bold leading-relaxed break-words">
                           {msg.content}
                           {msg.imageUrls && msg.imageUrls.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {msg.imageUrls.map((url, idx) => (
                                <img key={idx} src={url} alt="مرفق" className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-xl border border-white/10 shadow-sm" />
                              ))}
                            </div>
                           )}
                        </div>
                     ) : (
                        <div className="w-full text-gray-300 text-base leading-relaxed break-words">
                           {msg.thinkingTime !== undefined && msg.thinkingTime > 0 && (
                             <div className="mb-5 w-full">
                               <details className="text-xs text-gray-400 cursor-pointer group select-none transition-all duration-300">
                                 <summary className="inline-flex items-center gap-2 bg-[#1A1C1E] hover:bg-[#222528] px-4 py-2 rounded-2xl border border-white/5 transition-colors shadow-sm">
                                   <span className="text-emerald-500 font-bold">✓</span>
                                   <span className="font-bold text-gray-300">تحليل المعلومات ({formatSeconds(msg.thinkingTime)})</span>
                                   <span className="opacity-50 group-open:rotate-180 transition-transform text-[8px] mr-auto pl-1">▼</span>
                                 </summary>
                                 <div className="mt-3 mr-4 pr-4 py-2 border-r-2 border-emerald-500/30 space-y-3 text-gray-400 font-medium text-[13px]">
                                   <p className="flex items-center gap-2"><span className="text-emerald-500 text-xs">✓</span> أتحقق من البيانات الرياضية المسترجعة…</p>
                                   <p className="flex items-center gap-2"><span className="text-emerald-500 text-xs">✓</span> أراجع الإحصائيات ذات الصلة…</p>
                                   <p className="flex items-center gap-2"><span className="text-emerald-500 text-xs">✓</span> أنظم المعلومات تمهيدًا لعرض النتيجة…</p>
                                 </div>
                               </details>
                             </div>
                           )}
                           {renderFormattedText(msg.content)}
                        </div>
                     )}
                  </div>
                </div>
              ) : null
            ))}
            
            {loading && (
              <div className="flex items-start gap-4 w-full mt-4">
                <div className="flex-shrink-0 mt-1 hidden sm:block"><AiFBallLogo size="sm"/></div>
                <div className="w-full min-w-0 flex items-center">
                   <span className="text-emerald-400 font-bold text-sm flex items-center gap-2 bg-[#1A1C1E] px-4 py-2.5 rounded-2xl border border-white/5 shadow-sm">
                     <svg className="animate-spin -ml-1 mr-1 h-4 w-4 text-emerald-500" xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                     </svg>
                     ⏳ جاري البحث في المصادر الرياضية… ({formatSeconds(loadingSeconds)})
                   </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      <footer className="px-3 sm:px-6 pt-2 bg-[#131314]/95 backdrop-blur-xl border-t border-white/5 sticky bottom-0 z-20" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 16px)' }}>
        <div className="max-w-3xl mx-auto relative">
          {attachedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3 px-2">
              {attachedFiles.map((f, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-[#1A1C1E] border border-white/10 p-1.5 pr-3 rounded-xl shadow-sm">
                  <img src={f.url} alt="مرفق" className="w-8 h-8 object-cover rounded-lg border border-white/5" />
                  <span className="text-xs text-gray-300 max-w-[120px] truncate" dir="ltr">{f.file.name}</span>
                  <button onClick={() => setAttachedFiles((prev) => prev.filter((_, i) => i !== idx))} className="text-gray-500 hover:text-red-400 font-bold ml-1 mr-1 transition">✕</button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-end gap-2 bg-[#1A1C1E] border border-white/10 rounded-[24px] px-2 py-2 shadow-lg focus-within:border-emerald-500/40 focus-within:bg-[#1E2124] transition-colors duration-300 min-h-[56px]">
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} multiple accept="image/*" className="hidden" />
            
            <button onClick={() => fileInputRef.current?.click()} title="إرفاق ملف" className="w-10 h-10 rounded-full hover:bg-white/5 text-gray-400 hover:text-white flex items-center justify-center transition flex-shrink-0 mb-0.5">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
            </button>

            <button onClick={handleVoiceSearch} title="بحث صوتي" className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mb-0.5 transition ${isListening ? 'bg-emerald-600 text-white animate-pulse' : 'hover:bg-white/5 text-gray-400 hover:text-white'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19 10v1a7 7 0 01-14 0v-1M12 18.5V22M8 22h8" /></svg>
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder={isListening ? 'جاري الاستماع لصوتك...' : 'اسأل عن أي تحليل أو إحصائية رياضية...'}
              className="flex-1 bg-transparent px-2 py-3 text-base text-white placeholder-gray-500 focus:outline-none min-w-0"
            />

            <button onClick={() => sendMessage()} disabled={loading || (!input.trim() && attachedFiles.length === 0)} className="w-10 h-10 rounded-full bg-[#1D6B35] hover:bg-emerald-600 disabled:bg-white/10 disabled:text-gray-500 flex items-center justify-center text-white flex-shrink-0 transition shadow-sm mb-0.5">
               <svg className="w-5 h-5 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
            </button>
          </div>
          <div className="text-center mt-3">
             <p className="text-[10px] text-gray-500 font-medium">يمكن لـ فوتبلاي ارتكاب بعض الأخطاء. يُرجى التحقق من المعلومات المهمة.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

