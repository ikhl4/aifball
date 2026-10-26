'use client';
import React, { useState, useRef, useEffect } from 'react';

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
  const dimensions = size === 'sm' ? 'w-8 h-8 rounded-[9px]' : size === 'lg' ? 'w-14 h-14 rounded-[16px]' : 'w-10 h-10 rounded-[11px]';

  if (!imgError) {
    return <img src="/logo.png" alt="AiFBall" onError={() => setImgError(true)} className={`${dimensions} object-cover shadow-md flex-shrink-0 select-none`} />;
  }

  return (
    <div className={`${dimensions} bg-[#1D6B35] flex items-center justify-center shadow-md flex-shrink-0 select-none overflow-hidden`}>
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

function TacticalPitch({ teamName, formation }: { teamName?: string, formation?: string }) {
  const [loading, setLoading] = useState(true);
  const mockPlayers = [
    { num: '1', name: 'الحارس', x: 50, y: 8 },
    { num: '2', name: 'ظهير أيمن', x: 85, y: 25 },
    { num: '3', name: 'قلب دفاع', x: 65, y: 20 },
    { num: '4', name: 'قلب دفاع', x: 35, y: 20 },
    { num: '5', name: 'ظهير أيسر', x: 15, y: 25 },
    { num: '6', name: 'محور', x: 60, y: 45 },
    { num: '8', name: 'محور', x: 40, y: 45 },
    { num: '7', name: 'جناح أيمن', x: 85, y: 70 },
    { num: '10', name: 'صانع لعب', x: 50, y: 65 },
    { num: '11', name: 'جناح أيسر', x: 15, y: 70 },
    { num: '9', name: 'مهاجم', x: 50, y: 88 },
  ];

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="my-5 p-4 rounded-3xl bg-black/40 backdrop-blur-md border border-emerald-900/40 shadow-2xl max-w-md mx-auto">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
        <span className="text-sm font-bold text-emerald-400 flex items-center gap-2">
          <span>📋</span><span>التشكيل التكتيكي {teamName ? `- ${teamName.replace(/\*\*/g, '')}` : ''}</span>
        </span>
        <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/50">
          {formation ? formation.replace(/\*\*/g, '') : '4-2-3-1'}
        </span>
      </div>
      
      {loading ? (
        <div className="w-full aspect-[2/3] flex items-center justify-center bg-emerald-900/20 rounded-xl border border-white/5">
          <span className="text-emerald-500 font-bold text-sm animate-pulse">جاري سحب التمركزات...</span>
        </div>
      ) : (
        <div className="relative w-full aspect-[2/3] bg-[#2E7D32] rounded-xl overflow-hidden shadow-inner border-2 border-white/20 select-none">
          <div className="absolute inset-2 border-2 border-white/40"></div>
          <div className="absolute top-1/2 left-2 right-2 border-t-2 border-white/40 -translate-y-1/2"></div>
          <div className="absolute top-1/2 left-1/2 w-24 h-24 border-2 border-white/40 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-white/60 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-2 left-1/2 w-1/2 h-1/6 border-2 border-white/40 border-b-0 -translate-x-1/2"></div>
          <div className="absolute top-2 left-1/2 w-1/2 h-1/6 border-2 border-white/40 border-t-0 -translate-x-1/2"></div>

          {mockPlayers.map((player, idx) => (
            <div 
              key={idx} 
              className="absolute flex flex-col items-center justify-center transform -translate-x-1/2 -translate-y-1/2 transition-all duration-700"
              style={{ left: `${player.x}%`, bottom: `${player.y}%` }}
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black border-2 border-emerald-400 flex items-center justify-center shadow-lg mb-1 relative group cursor-pointer">
                <span className="text-white text-[10px] sm:text-xs font-bold">{player.num}</span>
                <div className="absolute bottom-full mb-1 bg-black/80 text-emerald-300 text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                  {player.name}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
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
          <a key={pIdx} href={match[2]} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 my-1 mx-1 px-3 py-1.5 rounded-xl bg-blue-900/25 hover:bg-blue-900/40 border border-blue-500/30 text-blue-400 hover:text-blue-300 text-sm font-bold transition shadow-sm">
            <span>🔗</span>
            <span>{match[1]}</span>
            <span className="text-[10px] opacity-70">↗</span>
          </a>
        );
      }
    }

    const urlParts = part.split(/(https?:\/\/[^\s]+)/g);
    return urlParts.map((urlPart, uIdx) => {
      if (urlPart.match(/^https?:\/\//)) {
        return (
          <a key={`${pIdx}-${uIdx}`} href={urlPart} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline font-medium break-all transition">
            {urlPart}
          </a>
        );
      }

      const boldParts = urlPart.split(/(\*\*.*?\*\*)/g);
      return boldParts.map((bPart, bIdx) => {
        if (bPart.startsWith('**') && bPart.endsWith('**')) {
           return <strong key={`${pIdx}-${uIdx}-${bIdx}`} className="font-extrabold text-emerald-400">{bPart.slice(2, -2)}</strong>;
        }
        return <span key={`${pIdx}-${uIdx}-${bIdx}`}>{bPart}</span>;
      });
    });
  });
}

function renderFormattedText(text: string) {
  const youtubeIds = extractYouTubeIds(text);
  
  let processedText = text;
  processedText = processedText.replace(/\]\s*\n\s*\(/g, '](');
  
  const lines = processedText.split('\n');
  const elements: React.ReactNode[] = [];
  let tableRows: string[][] = [];
  let inTable = false;

  const cleanCell = (str: string) => str.replace(/\*\*/g, '').trim();

  const flushTable = (keyIndex: number) => {
    if (tableRows.length === 0) return;
    const headers = tableRows[0];
    const body = tableRows.slice(1);
    const isComparisonTable = headers.length === 3 && body.length > 0 && 
                              body.filter(r => r.length >= 3 && parseStatNumber(r[1]) !== null && parseStatNumber(r[2]) !== null).length >= Math.ceil(body.length * 0.5);

    if (isComparisonTable) {
      const p1Title = cleanCell(headers[1]) || 'الطرف الأول';
      const p2Title = cleanCell(headers[2]) || 'الطرف الثاني';
      elements.push(
        <div key={`datamb-${keyIndex}`} className="my-5 p-4 rounded-3xl bg-black/40 backdrop-blur-md border border-emerald-900/40 shadow-2xl">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
            <span className="text-sm font-bold text-emerald-400 flex items-center gap-2"><span>📊</span><span>مقارنة الأداء الإحصائي</span></span>
            <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/50">AiFBall Pro</span>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-5 text-center">
            <div className="p-3 rounded-2xl bg-black/30 border border-emerald-900/30"><span className="text-sm font-bold text-emerald-400 block truncate">{p1Title}</span></div>
            <div className="p-3 rounded-2xl bg-black/30 border border-sky-900/30"><span className="text-sm font-bold text-sky-400 block truncate">{p2Title}</span></div>
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
                  <div key={rIdx} className="space-y-2">
                    <div className="flex items-center justify-between text-sm px-1">
                      <span className={`font-bold ${p1Wins ? 'text-emerald-400' : 'text-gray-400'}`}>{val1Str}</span>
                      <span className="text-gray-300 font-medium text-center text-xs">{metric}</span>
                      <span className={`font-bold ${!p1Wins ? 'text-sky-400' : 'text-gray-400'}`}>{val2Str}</span>
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
        <div key={`table-${keyIndex}`} className="my-5 w-full overflow-x-auto custom-scrollbar rounded-2xl border border-white/10 shadow-xl bg-black/40 backdrop-blur-md">
          <table className="w-full text-right border-collapse text-sm min-w-max">
            <thead>
              <tr className="bg-emerald-950/60 text-emerald-300">
                {headers.map((h, idx) => (
                  <th key={idx} className="py-3.5 px-4 font-bold border-b border-white/10 whitespace-nowrap">{cleanCell(h)}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 bg-black/20">
              {body.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-white/5 transition-colors">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="py-3 px-4 whitespace-nowrap text-gray-200">{cleanCell(cell)}</td>
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
        <div key={`widget-${index}`} className="my-5 w-full rounded-2xl overflow-hidden border border-emerald-900/40 shadow-xl bg-transparent relative z-10 min-h-[100px]">
          {React.createElement('api-sports-widget', props)}
        </div>
      );
      return;
    }

    if (trimmed.startsWith('<aifball-pitch') && trimmed.includes('</aifball-pitch>')) {
      if (inTable) flushTable(index);
      const teamMatch = trimmed.match(/team="([^"]+)"/);
      const formMatch = trimmed.match(/formation="([^"]+)"/);
      elements.push(
        <TacticalPitch : ? formMatch[1] formation="{formMatch" key="{`pitch-${index}`}" teamMatch[1] teamName="{teamMatch" undefined}/>
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
      elements.push(<div key={index} className="h-1.5" />);
    } else if (trimmed.startsWith('### ')) {
      elements.push(<h3 key={index} className="text-lg font-bold text-emerald-400 mt-5 mb-2">{renderInlineText(trimmed.replace(/^###\s+/, ''))}</h3>);
    } else if (trimmed.startsWith('## ')) {
      elements.push(<h2 key={index} className="text-xl font-bold text-emerald-400 mt-5 mb-2">{renderInlineText(trimmed.replace(/^##\s+/, ''))}</h2>);
    } else if (trimmed.startsWith('# ')) {
      elements.push(<h1 key={index} className="text-2xl font-bold text-emerald-400 mt-5 mb-3">{renderInlineText(trimmed.replace(/^#\s+/, ''))}</h1>);
    } else if (/^[-*+]\s+/.test(trimmed) || /^\d+\.\s+/.test(trimmed)) {
      const isNumbered = /^\d+\.\s+/.test(trimmed);
      const textPart = trimmed.replace(/^[-*+]\s+/, '').replace(/^\d+\.\s+/, '');
      const bullet = isNumbered ? trimmed.match(/^\d+\./)![0] : '•';
      elements.push(
        <div key={index} className="flex items-start gap-2.5 my-2 pr-1.5">
          <span className="text-emerald-500 mt-0.5 font-bold whitespace-nowrap">{bullet}</span>
          <span className="flex-1 leading-relaxed text-base text-gray-200">{renderInlineText(textPart)}</span>
        </div>
      );
    } else if (trimmed.startsWith('![') && trimmed.includes('](') && trimmed.endsWith(')')) {
      const altMatch = trimmed.match(/!\[(.*?)\]/);
      const urlMatch = trimmed.match(/\((.*?)\)/);
      if (urlMatch && urlMatch[1]) {
        elements.push(
          <div key={index} className="my-4 rounded-2xl overflow-hidden border border-white/10 shadow-lg bg-black/40 p-2 relative group">
            <img src={urlMatch[1]} alt={altMatch ? altMatch[1] : 'صورة رياضية'} onError={(e) => { e.currentTarget.src = '/logo.png'; e.currentTarget.alt = 'تعذر تحميل الصورة من المصدر'; }} className="w-full h-auto rounded-xl object-contain max-h-[28rem] bg-black/30" />
          </div>
        );
      }
    } else {
      elements.push(<p key={index} className="leading-relaxed my-2 text-base text-gray-100">{renderInlineText(trimmed)}</p>);
    }
  });

  if (inTable) flushTable(lines.length);

  if (youtubeIds.length > 0) {
    elements.push(
      <div key="youtube-embeds" className="mt-5 space-y-4">
        {youtubeIds.map((vid) => (
          <div key={vid} className="rounded-2xl overflow-hidden border border-emerald-500/30 bg-black/40 backdrop-blur-md shadow-xl">
            <div className="flex items-center justify-between px-4 py-2.5 bg-emerald-950/50 border-b border-white/10">
              <span className="text-xs sm:text-sm font-bold text-emerald-400">🎥 مشاهدة الملخص المدمج</span>
              <a href={`[https://www.youtube.com/watch?v=$](https://www.youtube.com/watch?v=$){vid}`} target="_blank" rel="noopener noreferrer" className="text-[11px] text-gray-300 hover:text-white underline transition">
                فتح في تطبيق يوتيوب ↗
              </a>
            </div>
            <div className="relative w-full aspect-video">
              <iframe 
                src={`[https://www.youtube-nocookie.com/embed/$](https://www.youtube-nocookie.com/embed/$){vid}?rel=0`} 
                title="YouTube video player" 
                className="w-full h-full border-0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen 
              />
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
  const [loadingSeconds, setLoadingSeconds] = useState(0); 
  const [expandedThoughts, setExpandedThoughts] = useState<number | null>(null);

  const [conversationId, setConversationId] = useState('');
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<{file: File, url: string}[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestionCards = [
    { question: 'اسلوب لعب الاتحاد مع الالماني فيسينغ', tag: 'تحليل تكتيكي', icon: '📋' },
    { question: 'أهداف وملخصات أبرز مباريات اليوم في الدوريات الكبرى', tag: 'أهداف وملخصات المباريات', icon: '🎬' },
    { question: 'ما هو جدول ترتيب دوري روشن السعودي حتى اليوم لموسم 2026-2027 وأبرز الإحصائيات؟', tag: 'ترتيب دوري روشن', icon: '📊' },
    { question: 'ما هو السجل التاريخي الكامل لأبطال دوري أبطال أوروبا؟', tag: 'التاريخ والبطولات', icon: '🏆' },
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      setLoadingSeconds(0);
      setExpandedThoughts(-1);
      interval = setInterval(() => {
        setLoadingSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
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
      const newFiles = Array.from(e.target.files).map(file => ({
        file,
        url: URL.createObjectURL(file) 
      }));
      setAttachedFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const sendMessage = async (textToSend?: string) => {
    const query = (textToSend ?? input).trim();
    if ((!query && attachedFiles.length === 0) || loading) return;

    const cleanQuery = query.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?؟]/g, "").trim();
    const greetings = ['مرحبا', 'هلا', 'السلام عليكم', 'هاي', 'hi', 'hello', 'صباح الخير', 'مساء الخير'];
    
    if (greetings.includes(cleanQuery) && attachedFiles.length === 0) {
      const assistantReply = 'مرحبا، الله حيه، أنا فوتبلاي مساعدك الرياضي. ماذا تريد أن تعرف؟';
      const newMsgs: Message[] = [
        ...messages, 
        { role: 'user', content: query, userQuery: query },
        { role: 'assistant', content: assistantReply }
      ];
      setMessages(newMsgs);
      setInput('');
      
      let activeSessionId = currentSessionId;
      if (!activeSessionId) {
        activeSessionId = Date.now().toString();
        setCurrentSessionId(activeSessionId);
      }

      setSessions(prevSessions => {
        const idx = prevSessions.findIndex(s => s.id === activeSessionId);
        const updatedSession = {
          id: activeSessionId,
          title: 'محادثة جديدة',
          conversationId: conversationId,
          messages: newMsgs,
          updatedAt: new Date().toISOString()
        };
        const newSessions = [...prevSessions];
        if (idx >= 0) newSessions[idx] = updatedSession;
        else newSessions.unshift(updatedSession);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newSessions));
        return newSessions;
      });
      return; 
    }

    const imageUrls = attachedFiles.map(f => f.url);
    const newMessages: Message[] = [...messages, { role: 'user', content: query, userQuery: query, imageUrls }];
    setMessages([...newMessages, { role: 'assistant', content: '', userQuery: query, thoughts: [] }]);
    setInput('');
    
    const filesToUpload = [...attachedFiles];
    setAttachedFiles([]);
    setLoading(true);

    let activeSessionId = currentSessionId;
    if (!activeSessionId) {
      activeSessionId = Date.now().toString();
      setCurrentSessionId(activeSessionId);
    }
    
    let finalConvId = conversationId;
    let finalAnswer = '';
    let currentThoughts: string[] = [];
    const requestStartTime = Date.now();

    const saveSessionProgress = (msgs: Message[]) => {
      setSessions(prevSessions => {
        const idx = prevSessions.findIndex(s => s.id === activeSessionId);
        const title = msgs.find(m => m.role === 'user')?.content.slice(0, 30) || 'محادثة جديدة';
        const updatedSession = {
          id: activeSessionId!,
          title: title + (title.length >= 30 ? '...' : ''),
          conversationId: finalConvId,
          messages: msgs,
          updatedAt: new Date().toISOString()
        };
        const newSessions = [...prevSessions];
        if (idx >= 0) newSessions[idx] = updatedSession;
        else newSessions.unshift(updatedSession);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newSessions));
        return newSessions;
      });
    };

    try {
      const uploadedDifyFiles = [];
      for (const item of filesToUpload) {
        const formData = new FormData();
        formData.append('file', item.file);
        try {
          const uploadRes = await fetch('/api/files/upload', {
            method: 'POST',
            body: formData
          });
          if(uploadRes.ok) {
            const uploadData = await uploadRes.json();
            if (uploadData && uploadData.id) {
              uploadedDifyFiles.push({ type: 'image', transfer_method: 'local_file', upload_file_id: uploadData.id });
            }
          }
        } catch (e) {
          console.error("خطأ أثناء رفع الصورة:", e);
        }
      }

      const requestBody: any = { query: query, conversation_id: conversationId };
      if (uploadedDifyFiles.length > 0) {
        requestBody.files = uploadedDifyFiles;
      }

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) throw new Error('Network response was not ok');

      const reader = res.body?.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      if (reader) {
        while (true) {
          let readResult;
          try {
             readResult = await reader.read();
          } catch (streamError) {
             console.log("Stream interrupted.");
             break; 
          }
          
          const { done, value } = readResult;
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
                
                if (parsed.event === 'agent_thought' && parsed.thought) {
                  if (!currentThoughts.includes(parsed.thought)) {
                    currentThoughts.push(parsed.thought);
                    setMessages(prev => {
                      const updated = [...prev];
                      const lastIndex = updated.length - 1;
                      if (updated[lastIndex].role === 'assistant') {
                        updated[lastIndex].thoughts = [...currentThoughts];
                      }
                      return updated;
                    });
                  }
                }

                if (parsed.event === 'message' && typeof parsed.answer === 'string') {
                  if (loading) {
                    setLoading(false); 
                    const elapsedSeconds = Math.floor((Date.now() - requestStartTime) / 1000);
                    
                    setMessages(prev => {
                      const updated = [...prev];
                      const lastIndex = updated.length - 1;
                      if (updated[lastIndex].role === 'assistant') {
                        updated[lastIndex].thinkingTime = elapsedSeconds; 
                      }
                      return updated;
                    });
                    setExpandedThoughts(null);
                  }

                  finalAnswer += parsed.answer;
                  
                  setMessages(prev => {
                    const updated = [...prev];
                    const lastIndex = updated.length - 1;
                    if (updated[lastIndex].role === 'assistant') {
                      updated[lastIndex].content = finalAnswer;
                    }
                    saveSessionProgress(updated);
                    return updated;
                  });
                }
                if (parsed.conversation_id) {
                  finalConvId = parsed.conversation_id;
                  setConversationId(finalConvId);
                }
              } catch (e) {}
            }
          }
        }
      }

    } catch (error) {
      setMessages(prev => {
        const updated = [...prev];
        const lastIndex = updated.length - 1;
        if (updated[lastIndex].role === 'assistant') {
          if (!finalAnswer) {
            updated[lastIndex].content = 'عذراً، تعذر الاتصال بالخادم. يرجى التأكد من اتصالك بالإنترنت.';
          }
        }
        return updated;
      });
    } finally {
      setLoading(false);
      setMessages(currentMessages => {
        saveSessionProgress(currentMessages);
        return currentMessages;
      });
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
      <div className="absolute inset-0 bg-cover bg-center filter brightness-[0.55] pointer-events-none z-0" style={{ backgroundImage: `url('/IMG_0091.jpeg')` }} />
      <div className="absolute inset-0 bg-[#131314]/75 pointer-events-none z-0" />

      <div style={{ display: 'none' }}>
        {React.createElement('api-sports-widget', {
          'data-type': 'config',
          'data-key': 'c1940d93074f34c797f1321047e21e12',
          'data-sport': 'football',
          'data-lang': 'en',
          'data-theme': 'dark',
          'data-timezone': 'Asia/Riyadh',
          'data-show-errors': 'true'
        })}
      </div>

      <style jsx global>{`
        @import url('[https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap](https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap)');
        .font-saudi, body, input, button, textarea, h1, h2, h3, p, span { font-family: 'Cairo', sans-serif !important; font-feature-settings: "calt" 1, "liga" 1; }
        @keyframes pulse-slow { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        .animate-pulse-slow { animation: pulse-slow 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        .custom-scrollbar::-webkit-scrollbar { height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #1A1C1E; border-radius: 8px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1D6B35; border-radius: 8px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #22C55E; }
      `}</style>

      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/60 z-30 transition-opacity" />}

      <aside className={`fixed top-0 right-0 h-full w-72 sm:w-80 bg-[#18191A]/95 backdrop-blur-md border-l border-white/10 z-40 transform transition-transform duration-300 flex flex-col ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <AiFBallLogo size="sm"/>
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
              {s.title}
            </div>
          ))}
        </div>
      </aside>

      <header className="flex items-center justify-between px-3.5 sm:px-6 py-2.5 border-b border-white/10 bg-[#131314]/80 sticky top-0 z-20 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <button onClick={() => setSidebarOpen(true)} className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-gray-200 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h10" /></svg>
          </button>
          <AiFBallLogo size="md"/>
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
            <div className="text-right space-y-3 mb-6 px-1">
              <div className="inline-flex items-center gap-2 text-emerald-400 text-xs sm:text-sm font-bold tracking-widest uppercase pb-1 border-b-2 border-emerald-500/40">
                <span>⚽</span>
                <span>HOME OF FOOTBALL</span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white drop-shadow-md">أهلاً بك في فوتبلاي</h2>
              <p className="text-base sm:text-lg text-gray-200 leading-relaxed max-w-2xl font-normal drop-shadow">
                تحليل تكتيكي، تشكيلات مباريات، مقارنات إحصائية متقدمة، أسلوب لعب الفرق وفلسفة المدربين ومتابعة أهداف وملخصات المباريات.. كيف أساعدك اليوم؟
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full">
              {suggestionCards.map((card, i) => (
                <div key={i} className="flex flex-col justify-between text-right p-4 sm:p-5 rounded-2xl bg-black/10 backdrop-blur-sm border border-white/10 shadow-lg min-h-[115px] hover:border-emerald-500/50 hover:bg-black/20 transition cursor-pointer" onClick={() => { setInput(card.question); sendMessage(card.question); }}>
                  <p className="text-sm sm:text-base font-bold text-gray-100 leading-relaxed line-clamp-2">{card.question}</p>
                  <div className="flex items-center justify-between w-full mt-3 pt-1">
                    <span className="text-xs sm:text-sm font-bold text-[#22C55E] truncate pl-1">{card.tag}</span>
                    <span className="w-8 h-8 rounded-full bg-black/30 flex items-center justify-center text-sm shadow-inner">{card.icon}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map((msg, i) => (
              msg.content && msg.content.trim() !== '' || (msg.imageUrls && msg.imageUrls.length > 0) || (msg.thoughts && msg.thoughts.length > 0) ? (
                <div key={i} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-start' : 'justify-end flex-row-reverse'}`}>
                  {msg.role === 'assistant' && <div className="mt-1 flex-shrink-0"><AiFBallLogo size="sm"/></div>}
                  <div className={`flex flex-col ${msg.role === 'user' ? 'max-w-[85%]' : 'w-full max-w-[90%]'}`}>
                    
                    {msg.role === 'assistant' && msg.thinkingTime !== undefined && msg.thinkingTime > 0 && (
                      <div className="mb-2 w-full">
                        <details className="text-[11px] text-gray-400 cursor-pointer group select-none transition-all duration-300">
                          <summary className="inline-flex items-center gap-1.5 bg-black/30 hover:bg-black/50 px-3 py-1.5 rounded-xl border border-white/5 transition-colors">
                            <span className="text-emerald-500 text-sm">💡</span>
                            <span className="font-bold text-gray-300">تم البحث والتحليل في {formatSeconds(msg.thinkingTime)}</span>
                            <span className="opacity-50 group-open:rotate-180 transition-transform text-[8px] mr-1">▼</span>
                          </summary>
                          <div className="mt-2 mr-2 pr-3 py-1.5 border-r-2 border-emerald-900/30 space-y-1.5 text-gray-400 font-medium">
                            <p className="flex items-center gap-1.5"><span className="text-emerald-500">✓</span> الاتصال بخوادم فوتبلاي الذكية</p>
                            {msg.thoughts && msg.thoughts.map((t, idx) => (
                              <p key={idx} className="flex items-center gap-1.5"><span className="text-emerald-500">✓</span> {t}</p>
                            ))}
                          </div>
                        </details>
                      </div>
                    )}

                    <div className={`rounded-2xl px-5 py-4 shadow-xl backdrop-blur-md border border-white/10 text-base bg-black/50 ${msg.role === 'user' ? 'text-white rounded-tr-sm' : 'text-gray-100'}`}>
                      {msg.role === 'user' ? (
                        <div>
                          {msg.imageUrls && msg.imageUrls.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                              {msg.imageUrls.map((url, idx) => (
                                <img key={idx} src={url} alt="مرفق" className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-xl border border-white/20 shadow-sm" />
                              ))}
                            </div>
                          )}
                          <p>{msg.content}</p>
                        </div>
                      ) : renderFormattedText(msg.content)}
                    </div>
                  </div>
                </div>
              ) : null
            ))}
            
            {loading && (
              <div className="flex items-start gap-3 justify-end flex-row-reverse mt-4">
                <div className="mt-1 flex-shrink-0"><AiFBallLogo size="sm"/></div>
                <div className="w-full max-w-[85%]">
                  <div className="rounded-2xl px-4 py-3 shadow-lg backdrop-blur-md border border-white/10 bg-black/40 text-gray-300">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between cursor-pointer select-none" onClick={() => setExpandedThoughts(expandedThoughts === -1 ? null : -1)}>
                        <span className="text-emerald-400 font-bold text-sm flex items-center gap-2">
                           <svg className="animate-spin -ml-1 mr-1 h-4 w-4 text-emerald-500" xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                           </svg>
                           جاري البحث والتفكير... ({formatSeconds(loadingSeconds)})
                        </span>
                        <span className="text-emerald-500 text-xs bg-white/5 px-2 py-1 rounded-md transition-transform">{expandedThoughts === -1 ? '▲' : '▼'}</span>
                      </div>
                      
                      {expandedThoughts === -1 && (
                        <div className="pt-3 pb-1 mt-1 border-t border-white/5 space-y-2.5 text-xs font-medium">
                          <div className="flex items-center gap-2">
                            <span className="text-emerald-400 font-bold">✓</span>
                            <span className="text-gray-300">الاتصال بخوادم فوتبلاي الذكية...</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-emerald-500/70 animate-pulse text-[10px]">⬤</span>
                            <span className="text-gray-400">جاري تفعيل أدوات البحث والتحليل الرياضي...</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
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
                <div key={idx} className="flex items-center gap-2 bg-black/40 border border-emerald-500/50 p-1.5 pr-3 rounded-lg shadow-sm backdrop-blur-md">
                  <img src={f.url} alt="مرفق" className="w-8 h-8 object-cover rounded-md border border-white/10" />
                  <span className="text-xs text-emerald-300 max-w-[120px] truncate" dir="ltr">{f.file.name}</span>
                  <button onClick={() => setAttachedFiles((prev) => prev.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-300 font-bold ml-1 mr-1 transition">✕</button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md border border-white/10 rounded-full px-3 py-2 shadow-xl">
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} multiple accept="image/*" className="hidden" />
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
