'use client';
import React, { useState, useRef, useEffect } from 'react';
import { SignInButton, SignedIn, SignedOut, UserButton, useUser } from '@clerk/nextjs';
import TacticalPitch from './components/TacticalPitch';
import LiveSportsWidget from './components/LiveSportsWidget';
import LiveMatchCenter from './components/LiveMatchCenter'; 
import ShotMap from './components/ShotMap';
import PlayerProfile from './components/PlayerProfile';
import MatchReport from './components/MatchReport';
import TrainingDrillWidget from './components/TrainingDrillWidget';
import PlayerComparison from './components/PlayerComparison'; // 🌟 استدعاء مكون المقارنة

interface Message {
  role: 'user' | 'assistant';
  content: string;
  userQuery?: string;
  imageUrls?: string[]; 
  feedback?: 'like' | 'dislike' | null;
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
  const dimensions = size === 'sm' ? 'w-8 h-8 rounded-[9px]' : size === 'lg' ? 'w-14 h-14 rounded-[16px]' : 'w-10 h-10 rounded-[11px]';

  return (
    <div className={`${dimensions} bg-[#1D6B35] flex items-center justify-center shadow-md flex-shrink-0 select-none overflow-hidden`}>
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <rect width="200" height="200" rx="42" fill="#1D6B35" />
        <g transform="translate(100, 74)">
          <circle r="48" fill="#FFFFFF" />
          <polygon points="0,-19 18,-6 11,15 -11,15 -18,-6" fill="#FFFFFF" stroke="#1D6B35" strokeWidth="5.5" strokeLinejoin="round" />
          <path d="M0,-19 L0,-37 M18,-6 L35,-12 M11,15 L22,31 M-11,15 L-22,31 M-18,-6 L-35,-12" stroke="#1D6B35" strokeWidth="5.5" strokeLinecap="round" />
          <path d="M-19,-35 L0,-37 L19,-35 M19,-35 L35,-12 L37,8 M37,8 L22,31 L0,38 M0,38 L-22,31 L-37,8 M0,38 L-22,31 L-37,8 L-35,-12 L-19,-35" fill="none" stroke="#1D6B35" strokeWidth="5" strokeLinejoin="round" />
          <path d="M-19,-35 L-26,-43 M19,-35 L26,-43 M35,-12 L46,-16 M37,8 L47,15 M22,31 L29,40 M0,38 L0,48 M-22,31 L-29,40 M-37,8 L-47,15 M-35,-12 L-46,-16" stroke="#1D6B35" strokeWidth="5" strokeLinecap="round" />
          <circle r="47" fill="none" stroke="#1D6B35" strokeWidth="4" />
        </g>
        <text x="100" y="168" textAnchor="middle" fill="#FFFFFF" fontSize="43" fontWeight="900" fontStyle="italic" fontFamily="system-ui, -apple-system, sans-serif" letterSpacing="-1">AiFBall</text>
      </svg>
    </div>
  );
}

function parseStatNumber(val: string): number | null {
  const cleaned = val.replace(/,/g, '').match(/-?\d+(\.\d+)?/);
  return cleaned ? parseFloat(cleaned[0]) : null;
}

function deduplicateText(rawText: string): string {
  if (!rawText) return '';
  let text = rawText;
  text = text.replace(/(\|\s*\d+\s*\|[^\n]+\|)\s*([^\n|]+)/g, '$1\n\n$2');
  const trimmed = text.trim();
  const half = Math.floor(trimmed.length / 2);
  if (half > 12) {
    const firstHalf = trimmed.slice(0, half).trim();
    const secondHalf = trimmed.slice(half).trim();
    if (firstHalf === secondHalf) { text = firstHalf; }
  }
  text = text.split('\n').map(line => {
    const tLine = line.trim();
    if (tLine.length > 15 && !tLine.startsWith('|')) {
      const h = Math.floor(tLine.length / 2);
      const p1 = tLine.slice(0, h).trim();
      const p2 = tLine.slice(h).trim();
      if (p1 === p2) return p1;
    }
    return line.replace(/([^.\n]{10,}\.)\s*\1+/g, '$1');
  }).join('\n');
  return text;
}

function renderInlineText(text: string, isDark: boolean) {
  const linkParts = text.split(/(\[.*?\]\(.*?\))/g);
  return linkParts.map((part, pIdx) => {
    if (part.startsWith('[') && part.endsWith(')')) {
      const match = part.match(/\[(.*?)\]\((.*?)\)/);
      if (match) {
        return (
          <a key={pIdx} href={match[2]} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-1.5 my-1 mx-1 px-3 py-1.5 rounded-xl border text-sm font-bold transition shadow-sm ${isDark ? 'bg-blue-900/25 hover:bg-blue-900/40 border-blue-500/30 text-blue-400 hover:text-blue-300' : 'bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-600'}`}>
            <span>🔗</span><span>{match[1]}</span><span className="text-[10px] opacity-70">↗</span>
          </a>
        );
      }
    }
    const urlParts = part.split(/(https?:\/\/[^\s]+)/g);
    return urlParts.map((urlPart, uIdx) => {
      if (urlPart.match(/^https?:\/\//)) {
        return (
          <a key={`${pIdx}-${uIdx}`} href={urlPart} target="_blank" rel="noopener noreferrer" className={`underline font-medium break-all transition ${isDark ? 'text-emerald-400 hover:text-emerald-300' : 'text-emerald-600 hover:text-emerald-700'}`}>
            {urlPart}
          </a>
        );
      }
      const boldParts = urlPart.split(/(\*\*.*?\*\*)/g);
      return boldParts.map((bPart, bIdx) => {
        if (bPart.startsWith('**') && bPart.endsWith('**')) {
           return <strong key={`${pIdx}-${uIdx}-${bIdx}`} className={`font-extrabold mx-0.5 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>{bPart.slice(2, -2)}</strong>;
        }
        return <span key={`${pIdx}-${uIdx}-${bIdx}`}>{bPart}</span>;
      });
    });
  });
}

function renderFormattedText(text: string, isDark: boolean, onSuggestionClick?: (q: string) => void) {
  const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/g;
  const youtubeIds: string[] = [];
  const suggestedQuestions: string[] = [];
  
  let processedText = text.replace(youtubeRegex, (url, id) => {
    if (id && id.length === 11 && !youtubeIds.includes(id)) { youtubeIds.push(id); }
    return ''; 
  });

  processedText = processedText.replace(/<a\s+href=.*?<\/a>/gi, '');
  processedText = processedText.replace(/a\s*href=[^\s>]+/gi, '');
  processedText = deduplicateText(processedText);

  // 🌟 خوارزمية إصلاح الوسوم المكسورة من Dify (خاصة aifball-compare)
  processedText = processedText.replace(/aifball-compare[\s\S]*?(?:<\/aifball-compare>|$)/gi, (match) => {
      // إزالة أي أسطر جديدة أو أقواس زائدة كسرها الذكاء الاصطناعي
      let clean = match.replace(/[\n\r]+/g, ' ');
      clean = clean.replace(/></g, ' ');
      clean = clean.replace(/<|>/g, ' '); // مسح الأقواس العشوائية
      
      // استخراج الأسماء
      const p1 = clean.match(/player1\s*=\s*"?([^"]+)"?/i);
      const p2 = clean.match(/player2\s*=\s*"?([^"]+)"?/i);
      
      const name1 = p1 ? p1[1].trim().replace(/['"]/g, '') : 'Player 1';
      const name2 = p2 ? p2[1].trim().replace(/['"]/g, '') : 'Player 2';
      
      return `<aifball-compare player1="${name1}" player2="${name2}"></aifball-compare>`;
  });

  const paragraphs = processedText.split(/\n\s*\n/);
  const uniqueParagraphs = new Set();
  let finalText = '';

  for (const para of paragraphs) {
    const trimmedPara = para.trim();
    if (trimmedPara !== '' && !uniqueParagraphs.has(trimmedPara)) {
      uniqueParagraphs.add(trimmedPara);
      finalText += trimmedPara + '\n\n';
    }
  }
  
  processedText = finalText.replace(/\]\s*\n\s*\(/g, '](');
  const lines = processedText.split('\n');
  const elements: React.ReactNode[] = [];
  let tableRows: string[][] = [];
  let inTable = false;
  const renderedTables = new Set<string>();
  let expectedCols = 0;
  let tempRow: string[] = [];

  const cleanCell = (str: string) => str.replace(/\*\*/g, '').trim();

  const flushTable = (keyIndex: number) => {
    if (tableRows.length === 0) return;
    const tableSignature = JSON.stringify(tableRows.map(r => r.map(cleanCell)));
    if (renderedTables.has(tableSignature)) { tableRows = []; inTable = false; tempRow = []; expectedCols = 0; return; }
    renderedTables.add(tableSignature);

    const headers = tableRows[0];
    const body = tableRows.slice(1);
    const isComparisonTable = headers.length === 3 && body.length > 0 && 
                              body.filter(r => r.length >= 3 && parseStatNumber(r[1]) !== null && parseStatNumber(r[2]) !== null).length >= Math.ceil(body.length * 0.5);

    if (isComparisonTable) {
      const p1Title = cleanCell(headers[1]) || 'الطرف الأول';
      const p2Title = cleanCell(headers[2]) || 'الطرف الثاني';
      elements.push(
        <div key={`datamb-${keyIndex}`} className={`my-5 p-4 md:p-5 rounded-3xl backdrop-blur-md border shadow-2xl w-full ${isDark ? 'bg-black/40 border-emerald-900/40' : 'bg-white border-gray-200'}`}>
          <div className={`flex items-center justify-between pb-3 mb-4 border-b ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
            <span className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}><span>📊</span><span>مقارنة الأداء الإحصائي</span></span>
            <span className={`text-[10px] px-2.5 py-1 rounded-full border ${isDark ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/50' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>AiFBall Pro</span>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-5 text-center">
            <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-black/30 border-emerald-900/30' : 'bg-gray-50 border-gray-200'}`}><span className={`text-sm font-bold block truncate ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{p1Title}</span></div>
            <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-black/30 border-sky-900/30' : 'bg-gray-50 border-gray-200'}`}><span className={`text-sm font-bold block truncate ${isDark ? 'text-sky-400' : 'text-sky-600'}`}>{p2Title}</span></div>
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
                      <span className={`font-bold ${p1Wins ? (isDark ? 'text-emerald-400' : 'text-emerald-600') : (isDark ? 'text-gray-400' : 'text-gray-500')}`}>{val1Str}</span>
                      <span className={`font-medium text-center text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{metric}</span>
                      <span className={`font-bold ${!p1Wins ? (isDark ? 'text-sky-400' : 'text-sky-600') : (isDark ? 'text-gray-400' : 'text-gray-500')}`}>{val2Str}</span>
                    </div>
                    <div className={`w-full h-3 rounded-full overflow-hidden flex gap-1 p-0.5 ${isDark ? 'bg-black/40' : 'bg-gray-200'}`}>
                      <div style={{ width: `${p1}%` }} className={`h-full rounded-full transition-all duration-700 ${p1Wins ? 'bg-gradient-to-l from-emerald-400 to-emerald-600' : (isDark ? 'bg-emerald-900/40' : 'bg-emerald-200')}`} />
                      <div style={{ width: `${p2}%` }} className={`h-full rounded-full transition-all duration-700 ${!p1Wins ? 'bg-gradient-to-r from-sky-400 to-sky-600' : (isDark ? 'bg-sky-900/40' : 'bg-sky-200')}`} />
                    </div>
                  </div>
                );
              }
              return (
                <div key={rIdx} className={`flex items-center justify-between py-2 px-3 rounded-xl text-sm ${isDark ? 'bg-black/30' : 'bg-gray-50'}`}>
                  <span className={`font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{val1Str}</span>
                  <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{metric}</span>
                  <span className={`font-bold ${isDark ? 'text-sky-400' : 'text-sky-600'}`}>{val2Str}</span>
                </div>
              );
            })}
          </div>
        </div>
      );
    } else {
      elements.push(
        <div key={`table-${keyIndex}`} className={`my-5 w-full overflow-x-auto custom-scrollbar rounded-2xl border shadow-xl backdrop-blur-md ${isDark ? 'border-white/10 bg-black/40' : 'border-gray-200 bg-white'}`}>
          <table className="w-full text-right border-collapse text-sm min-w-max">
            <thead className={`${isDark ? 'bg-emerald-950/60 text-emerald-300' : 'bg-emerald-50 text-emerald-700'}`}>
              <tr>
                {headers.map((h, idx) => (
                  <th key={idx} className={`py-3 px-4 font-bold border-b whitespace-nowrap ${isDark ? 'border-white/10' : 'border-gray-200'}`}>{cleanCell(h)}</th>
                ))}
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-white/5 bg-black/20' : 'divide-gray-200 bg-white'}`}>
              {body.map((row, rIdx) => (
                <tr key={rIdx} className={`transition-colors ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}>
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className={`py-3 px-4 whitespace-nowrap ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{cleanCell(cell)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    tableRows = []; inTable = false; tempRow = []; expectedCols = 0;
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('```')) return;

    if (trimmed.includes('aifball-livescores')) {
      if (inTable) flushTable(index);
      const leagueMatch = trimmed.match(/league="([^"]+)"/);
      const leagueName = leagueMatch ? leagueMatch[1] : 'ksa.1'; 
      const dateMatch = trimmed.match(/date="([^"]+)"/);
      const matchDate = dateMatch ? dateMatch[1] : 'today'; 
      elements.push(
        <div key={`livescores-${index}`} className="my-5 w-full">
          <LiveSportsWidget league={leagueName} date={matchDate} isDark={isDark} />
        </div>
      );
      return;
    }

    if (trimmed.includes('aifball-match-report')) {
      if (inTable) flushTable(index);
      const matchMatch = trimmed.match(/match="([^"]+)"/);
      const matchName = matchMatch ? matchMatch[1] : 'تقرير المباراة';
      const idMatch = trimmed.match(/matchId="([^"]+)"/);
      const matchId = idMatch ? idMatch[1] : '3869685';
      
      const urlMatch = trimmed.match(/match_url="([^"]+)"/);
      const autoMatchUrl = urlMatch ? urlMatch[1] : undefined;

      elements.push(
        <div key={`match-report-${index}`} className="my-5 w-full">
          <MatchReport matchName={matchName} matchId={matchId} isDark={isDark} autoMatchUrl={autoMatchUrl} />
        </div>
      );
      return;
    }

    if (trimmed.startsWith('<aifball-player') && trimmed.includes('</aifball-player>')) {
      if (inTable) flushTable(index);
      const nameMatch = trimmed.match(/name="([^"]+)"/);
      const playerName = nameMatch ? nameMatch[1] : 'لاعب غير معروف';
      elements.push(
        <div key={`player-${index}`} className="my-5 w-full">
          <PlayerProfile playerName={playerName} isDark={isDark} />
        </div>
      );
      return;
    }

    if (trimmed.startsWith('<aifball-shotmap') && trimmed.includes('</aifball-shotmap>')) {
      if (inTable) flushTable(index);
      const matchMatch = trimmed.match(/match="([^"]+)"/);
      const matchName = matchMatch ? matchMatch[1] : 'تحليل تكتيكي متقدم';
      elements.push(
        <div key={`shotmap-${index}`} className="my-5 w-full">
          <ShotMap matchName={matchName} isDark={isDark} />
        </div>
      );
      return;
    }

    if (trimmed.startsWith('<aifball-pitch') && trimmed.includes('</aifball-pitch>')) {
      if (inTable) flushTable(index);
      const teamMatch = trimmed.match(/team="([^"]+)"/);
      const formationMatch = trimmed.match(/formation="([^"]+)"/);
      const team = teamMatch ? teamMatch[1] : '';
      const formation = formationMatch ? formationMatch[1] : '4-3-3';
      elements.push(
        <div key={`pitch-${index}`} className="my-5 w-full">
          <TacticalPitch team={team} formation={formation} />
        </div>
      );
      return;
    }

    if (trimmed.startsWith('<aifball-training') && trimmed.includes('</aifball-training>')) {
      if (inTable) flushTable(index);
      const nameMatch = trimmed.match(/name="([^"]+)"/);
      const drillName = nameMatch ? nameMatch[1] : 'تمرين تكتيكي';
      elements.push(
        <div key={`training-${index}`} className="my-5 w-full">
          <TrainingDrillWidget drillName={drillName} isDark={isDark} />
        </div>
      );
      return;
    }

    // 🌟 مكون المقارنة (يقرأ الوسم الذي تم إصلاحه)
    if (trimmed.startsWith('<aifball-compare') && trimmed.includes('</aifball-compare>')) {
      if (inTable) flushTable(index);
      const p1Match = trimmed.match(/player1="([^"]+)"/);
      const p2Match = trimmed.match(/player2="([^"]+)"/);
      
      const player1 = p1Match ? p1Match[1] : 'اللاعب الأول';
      const player2 = p2Match ? p2Match[1] : 'اللاعب الثاني';

      elements.push(
        <div key={`compare-${index}`} className="my-5 w-full">
          <PlayerComparison player1={player1} player2={player2} isDark={isDark} />
        </div>
      );
      return;
    }

    const isSuggestion = trimmed.startsWith('❓') || trimmed.includes('هل تريد') || trimmed.includes('هل ترغب') || trimmed.includes('هل تود');
    if (isSuggestion) {
      if (inTable) flushTable(index);
      const questionText = trimmed.replace(/^[-*•❓\s]+/, '').trim();
      if (questionText) suggestedQuestions.push(questionText);
      return;
    }

    if (trimmed.startsWith('|')) {
      if (/^\|[\s\-:|]+\|?$/.test(trimmed)) { inTable = true; return; }
      inTable = true;
      let cells = trimmed.split('|').map((c) => c.trim());
      if (cells[0] === '') cells.shift();
      if (cells[cells.length - 1] === '') cells.pop();
      
      if (tableRows.length === 0 && tempRow.length === 0) {
        expectedCols = cells.length;
        tableRows.push(cells);
      } else {
        tempRow.push(...cells);
        if (tempRow.length >= expectedCols) {
          tableRows.push(tempRow.slice(0, expectedCols));
          tempRow = [];
        }
      }
      return;
    }
    if (inTable && tempRow.length > 0) {
      while (tempRow.length < expectedCols) tempRow.push('-');
      tableRows.push(tempRow.slice(0, expectedCols));
      tempRow = [];
    }
    if (inTable) flushTable(index);

    if (!trimmed) {
      elements.push(<div key={index} className="h-1.5" />);
    } else if (trimmed.startsWith('### ')) {
      elements.push(<h3 key={index} className={`text-base sm:text-lg font-bold mt-4 mb-2 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>{renderInlineText(trimmed.replace(/^###\s+/, ''), isDark)}</h3>);
    } else if (trimmed.startsWith('## ')) {
      elements.push(<h2 key={index} className={`text-lg sm:text-xl font-bold mt-5 mb-2 pb-2 border-b ${isDark ? 'text-emerald-400 border-emerald-500/20' : 'text-emerald-700 border-emerald-200'}`}>{renderInlineText(trimmed.replace(/^##\s+/, ''), isDark)}</h2>);
    } else if (trimmed.startsWith('# ')) {
      elements.push(<h1 key={index} className={`text-xl sm:text-2xl font-bold mt-5 mb-3 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>{renderInlineText(trimmed.replace(/^#\s+/, ''), isDark)}</h1>);
    } else if (/^[-*+]\s+/.test(trimmed) || /^\d+\.\s+/.test(trimmed)) {
      const isNumbered = /^\d+\.\s+/.test(trimmed);
      const textPart = trimmed.replace(/^[-*+]\s+/, '').replace(/^\d+\.\s+/, '');
      const bullet = isNumbered ? trimmed.match(/^\d+\./)![0] : '•';
      elements.push(
        <div key={index} className={`flex items-start gap-2.5 my-1.5 pr-2 border-r-2 ${isDark ? 'border-emerald-500/40' : 'border-emerald-400'}`}>
          <span className={`mt-0.5 font-bold whitespace-nowrap text-xs sm:text-sm ${isDark ? 'text-emerald-500' : 'text-emerald-600'}`}>{bullet}</span>
          <span className={`flex-1 leading-relaxed text-sm sm:text-[15px] ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{renderInlineText(textPart, isDark)}</span>
        </div>
      );
    } else if (trimmed.startsWith('![') && trimmed.includes('](') && trimmed.endsWith(')')) {
      const altMatch = trimmed.match(/!\[(.*?)\]/);
      const urlMatch = trimmed.match(/\((.*?)\)/);
      if (urlMatch && urlMatch[1]) {
        elements.push(
          <div key={index} className={`my-4 rounded-2xl overflow-hidden border shadow-lg p-2 relative group w-full ${isDark ? 'border-white/10 bg-black/40' : 'border-gray-200 bg-white'}`}>
            <img src={urlMatch[1]} alt={altMatch ? altMatch[1] : 'صورة رياضية'} onError={(e) => { e.currentTarget.src = '/logo.png'; }} className={`w-full h-auto rounded-xl object-contain max-h-[28rem] ${isDark ? 'bg-black/30' : 'bg-gray-50'}`} />
          </div>
        );
      }
    } else {
      elements.push(<p key={index} className={`leading-relaxed my-1.5 text-sm sm:text-[15px] ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{renderInlineText(trimmed, isDark)}</p>);
    }
  });

  if (inTable) flushTable(lines.length);

  if (youtubeIds.length > 0) {
    elements.push(
      <div key="youtube-embeds" className={`mt-6 pt-4 border-t ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
        <h4 className={`font-bold mb-3 flex items-center gap-2 text-sm ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
          <span>🎥</span> روابط ملخصات اليوتيوب
        </h4>
        {youtubeIds.map((vid) => (
          <div key={vid} className={`rounded-2xl overflow-hidden border shadow-xl mb-6 ${isDark ? 'border-emerald-500/30 bg-black/40' : 'border-emerald-200 bg-white'}`}>
            <div className={`flex items-center justify-between px-4 py-3 border-b ${isDark ? 'bg-emerald-950/50 border-white/10' : 'bg-emerald-50 border-gray-200'}`}>
              <span className={`text-xs sm:text-sm font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>الملخص الرسمي</span>
              <a href={`https://www.youtube.com/watch?v=${vid}`} target="_blank" rel="noopener noreferrer" className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white`}>
                مشاهدة على يوتيوب ↗
              </a>
            </div>
            <div className="relative w-full aspect-video bg-black">
              <iframe src={`https://www.youtube-nocookie.com/embed/${vid}?rel=0&modestbranding=1`} title="AiFBall Live Video Match" className="absolute top-0 left-0 w-full h-full border-0 object-cover" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen />
            </div>
            <div className={`px-4 py-2 text-center text-[10px] sm:text-xs ${isDark ? 'bg-black/60 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
              إذا لم يعمل المشغل هنا، يمكنك الضغط على زر <strong className="text-red-500">"مشاهدة على يوتيوب"</strong> في الأعلى للمشاهدة مباشرة.
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (suggestedQuestions.length > 0) {
    elements.push(
      <div key="suggested-questions" className="mt-4 flex flex-wrap gap-2 w-full">
        {suggestedQuestions.map((q, idx) => (
          <button key={`sq-${idx}`} onClick={() => onSuggestionClick && onSuggestionClick(q)} className={`inline-block text-right p-2 px-3 rounded-xl border transition-all duration-200 shadow-sm font-bold text-[11px] sm:text-xs cursor-pointer hover:-translate-y-0.5 active:translate-y-0 ${isDark ? 'bg-emerald-900/40 hover:bg-emerald-800/60 border-emerald-700/50 text-emerald-300' : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700'}`}>
            {q}
          </button>
        ))}
      </div>
    );
  }

  return elements;
}

const STORAGE_KEY = 'aifball_chat_history_v12';
const THEME_KEY = 'aifball_theme';

export default function FootPlayChat() {
  const { user } = useUser(); 

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
  const [isDarkMode, setIsDarkMode] = useState(true);

  const [showLiveScores, setShowLiveScores] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestionCards = [
    { question: 'داشبورد لاسلوب لعب الاتحاد', tag: 'تحليل تكتيكي', icon: '📋' },
    { question: 'ما هو جدول ترتيب دوري روشن السعودي؟', tag: 'ترتيب وإحصائيات', icon: '📊' },
    { question: 'أهداف وملخصات أبرز مباريات اليوم', tag: 'أهداف وملخصات', icon: '🎬' },
    { question: 'قارن بين رونالدو وميسي', tag: 'مقارنة لاعبين', icon: '⚔️' },
  ];

  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_KEY);
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(prefersDark);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem(THEME_KEY, newTheme ? 'dark' : 'light');
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      setLoadingSeconds(0);
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

    if (!document.querySelector('script[src="https://widgets.api-sports.io/2.0.0/widgets.js"]')) {
      const script = document.createElement('script');
      script.type = 'module';
      script.src = 'https://widgets.api-sports.io/2.0.0/widgets.js';
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
        const updatedSession = { id: activeSessionId, title: 'محادثة جديدة', conversationId, messages: newMsgs, updatedAt: new Date().toISOString() };
        const newSessions = [...prevSessions];
        if (idx >= 0) newSessions[idx] = updatedSession; else newSessions.unshift(updatedSession);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newSessions));
        return newSessions;
      });
      return; 
    }

    const imageUrls = attachedFiles.map(f => f.url);
    const newMessages: Message[] = [...messages, { role: 'user', content: query, userQuery: query, imageUrls }];
    setMessages([...newMessages, { role: 'assistant', content: '', userQuery: query }]);
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
    const requestStartTime = Date.now();
    let isThinking = true;
    let finalThinkingTime = 0;

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
      const uploadedDifyFiles = [];
      for (const item of filesToUpload) {
        const formData = new FormData();
        formData.append('file', item.file);
        try {
          const uploadRes = await fetch('/api/files/upload', { method: 'POST', body: formData });
          if(uploadRes.ok) {
            const uploadData = await uploadRes.json();
            if (uploadData && uploadData.id) uploadedDifyFiles.push({ type: 'image', transfer_method: 'local_file', upload_file_id: uploadData.id });
          }
        } catch (e) { console.error("خطأ أثناء رفع الصورة:", e); }
      }

      const requestBody: any = { query: query, conversation_id: conversationId };
      if (uploadedDifyFiles.length > 0) requestBody.files = uploadedDifyFiles;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 90000); 

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

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
             break; 
          }
          
          const { done, value } = readResult;
          if (done) break;
          
          if (isThinking) {
             finalThinkingTime = Math.max(1, Math.floor((Date.now() - requestStartTime) / 1000));
             isThinking = false;
          }

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
                  
                  const chunk = parsed.answer;

                  if (chunk.length > 15 && finalAnswer.includes(chunk.trim())) {
                    continue;
                  }
                  if (finalAnswer.length > 15 && chunk.trim().startsWith(finalAnswer.trim())) {
                    finalAnswer = chunk;
                  } else {
                    finalAnswer += chunk;
                  }

                  finalAnswer = deduplicateText(finalAnswer);
                  
                  setMessages(prev => {
                    const updated = [...prev];
                    const lastIndex = updated.length - 1;
                    if (updated[lastIndex].role === 'assistant') {
                      updated[lastIndex].content = finalAnswer;
                      updated[lastIndex].thinkingTime = finalThinkingTime;
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

    } catch (error: any) {
      setMessages(prev => {
        const updated = [...prev];
        const lastIndex = updated.length - 1;
        if (updated[lastIndex].role === 'assistant') {
          if (!finalAnswer) {
            if (error.name === 'AbortError') {
              updated[lastIndex].content = 'عذراً، استغرق البحث وقتاً طويلاً جداً. حاول تقليل تعقيد السؤال.';
            } else {
              updated[lastIndex].content = 'عذراً، تعذر الاتصال بالخادم. يرجى التأكد من اتصالك بالإنترنت.';
            }
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
    setMessages([]); setConversationId(''); setCurrentSessionId(''); setInput(''); setAttachedFiles([]); setSidebarOpen(false);
  };

  return (
    <div dir="rtl" className={`flex flex-col h-[100dvh] relative overflow-hidden font-saudi transition-colors duration-300 ${isDarkMode ? 'bg-[#131314] text-[#E3E3E3]' : 'bg-gray-50 text-gray-900'}`}>
      
      {/* الخلفية */}
      <div className={`absolute inset-0 bg-cover bg-center filter pointer-events-none z-0 transition-opacity duration-300 ${isDarkMode ? 'brightness-[0.55]' : 'brightness-[0.9] opacity-20'}`} style={{ backgroundImage: "url('/IMG_0091.jpeg')" }} />
      <div className={`absolute inset-0 pointer-events-none z-0 transition-colors duration-300 ${isDarkMode ? 'bg-[#131314]/75' : 'bg-gray-50/85'}`} />

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');
        .font-saudi, body, input, button, textarea, h1, h2, h3, p, span { font-family: 'Cairo', sans-serif !important; font-feature-settings: "calt" 1, "liga" 1; }
        @keyframes pulse-slow { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        .animate-pulse-slow { animation: pulse-slow 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        .custom-scrollbar::-webkit-scrollbar { height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: ${isDarkMode ? '#2E3338' : '#D1D5DB'}; border-radius: 8px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #1D6B35; }
      `}</style>

      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/60 z-30 transition-opacity" />}

      <aside className={`fixed top-0 right-0 h-full w-72 sm:w-80 backdrop-blur-md border-l z-40 transform transition-all duration-300 flex flex-col ${isDarkMode ? 'bg-[#18191A]/95 border-white/10' : 'bg-white/95 border-gray-200'} ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className={`flex items-center justify-between p-4 border-b ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
          <div className="flex items-center gap-2.5">
            <AiFBallLogo size="sm"/>
            <span className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>سجل البحوث والمحادثات</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className={`w-8 h-8 rounded-lg transition ${isDarkMode ? 'bg-white/5 hover:bg-white/10 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}>✕</button>
        </div>
        <div className="p-3">
          <button onClick={startNewChat} className="w-full py-2.5 px-4 rounded-xl bg-[#1D6B35] hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow">
            <span>+</span><span>بدء محادثة جديدة</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-1 space-y-1.5">
          {sessions.map((s) => (
            <div key={s.id} onClick={() => { setCurrentSessionId(s.id); setConversationId(s.conversationId); setMessages(s.messages); setSidebarOpen(false); }} className={`p-3 rounded-xl cursor-pointer text-xs truncate transition border ${isDarkMode ? 'bg-white/5 hover:bg-white/10 text-gray-300 border-transparent hover:border-white/10' : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-100 hover:border-gray-300'}`}>
              {s.title}
            </div>
          ))}
        </div>
        <div className={`p-4 border-t mt-auto ${isDarkMode ? 'border-white/10 bg-[#131517]' : 'border-gray-200 bg-gray-50'}`}>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="w-full py-3 px-4 rounded-xl bg-[#1D6B35] hover:bg-emerald-600 text-white font-bold text-sm flex items-center justify-center gap-2 transition shadow-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>
                <span>تسجيل الدخول</span>
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <div className={`flex items-center justify-between p-3 rounded-xl border ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-white border-gray-200 shadow-sm'}`}>
              <div className="flex items-center gap-3 w-full">
                <UserButton afterSignOutUrl="/" appearance={{ elements: { userButtonAvatarBox: "w-9 h-9 rounded-full border-2 border-emerald-500/30 flex-shrink-0" } }} />
                <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex items-center justify-between w-full">
                    <span className={`text-xs font-bold truncate pr-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                      {user?.fullName || user?.firstName || 'حسابي'}
                    </span>
                    {user?.primaryEmailAddress?.emailAddress === 'khalidassaf44@gmail.com' ? (
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap shadow-sm ${isDarkMode ? 'bg-emerald-900/60 text-emerald-400 border-emerald-500/30' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>المالك</span>
                    ) : (
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap shadow-sm ${isDarkMode ? 'bg-gray-800 text-gray-400 border-gray-700' : 'bg-gray-100 text-gray-600 border-gray-300'}`}>عضو</span>
                    )}
                  </div>
                  <span className={`text-[10px] text-right mt-0.5 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>متصل الآن</span>
                </div>
              </div>
            </div>
          </SignedIn>
        </div>
      </aside>

      <header className={`flex items-center justify-between px-3.5 sm:px-6 py-2.5 border-b sticky top-0 z-20 backdrop-blur-md transition-colors duration-300 ${isDarkMode ? 'border-white/10 bg-[#131314]/80' : 'border-gray-200 bg-white/80'}`}>
        <div className="flex items-center gap-2.5">
          <button onClick={() => setSidebarOpen(true)} className={`w-9 h-9 rounded-xl border flex items-center justify-center transition ${isDarkMode ? 'bg-white/5 hover:bg-white/10 border-white/10 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 border-gray-200 text-gray-600'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h10" /></svg>
          </button>
          <AiFBallLogo size="md"/>
          <div>
            <h1 className={`text-base font-bold leading-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>فوتبلاي</h1>
            <p className={`text-[10px] font-medium ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>صديقك الرياضي</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button onClick={() => setShowLiveScores(true)} className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 transition font-bold text-xs ${isDarkMode ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-600/30' : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'}`}>
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            النتائج المباشرة
          </button>

          <button onClick={toggleTheme} className={`w-9 h-9 rounded-xl border flex items-center justify-center transition ${isDarkMode ? 'bg-white/5 hover:bg-white/10 border-white/10 text-yellow-400' : 'bg-gray-100 hover:bg-gray-200 border-gray-200 text-gray-600'}`} title="تغيير المظهر">
            {isDarkMode ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
            )}
          </button>
          <button onClick={startNewChat} className={`px-3 py-1.5 rounded-full text-xs font-medium border transition hidden sm:block ${isDarkMode ? 'bg-white/5 hover:bg-white/10 border-white/10 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 border-gray-200 text-gray-700'}`}>+ محادثة جديدة</button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 max-w-4xl w-full mx-auto flex flex-col relative z-10 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col justify-center my-auto py-2">
            <div className="text-right space-y-3 mb-6 px-1">
              <div className={`inline-flex items-center gap-2 text-xs sm:text-sm font-bold tracking-widest uppercase pb-1 border-b-2 ${isDarkMode ? 'text-emerald-400 border-emerald-500/40' : 'text-emerald-600 border-emerald-300'}`}>
                <span>⚽</span><span>HOME OF FOOTBALL</span>
              </div>
              <h2 className={`text-3xl sm:text-5xl font-extrabold tracking-tight drop-shadow-md ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>أهلاً بك في فوتبلاي</h2>
              <p className={`text-sm sm:text-base leading-relaxed max-w-2xl font-normal drop-shadow ${isDarkMode ? 'text-gray-200' : 'text-gray-600'}`}>
                تحليل تكتيكي، تشكيلات مباريات، مقارنات إحصائية متقدمة، وأهداف وملخصات المباريات.. كيف أساعدك اليوم؟
              </p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full">
              {suggestionCards.map((card, i) => (
                <div key={i} className={`flex flex-col justify-between text-right p-4 sm:p-5 rounded-2xl backdrop-blur-sm border shadow-lg min-h-[115px] select-none ${isDarkMode ? 'bg-black/20 border-white/10 opacity-80' : 'bg-white border-gray-200 opacity-90'}`}>
                  <p className={`text-sm font-bold leading-relaxed line-clamp-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>{card.question}</p>
                  <div className="flex items-center justify-between w-full mt-3 pt-1">
                    <span className="text-[10px] sm:text-xs font-bold text-[#22C55E] truncate pl-1">{card.tag}</span>
                    <span className="text-lg opacity-80">{card.icon}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6 pb-4">
            {messages.map((msg, i) => (
              (msg.content && msg.content.trim() !== '') || (msg.imageUrls && msg.imageUrls.length > 0) ? (
                <div key={i} className="flex items-start gap-4 w-full">
                  <div className="flex-shrink-0 mt-1 hidden sm:block">
                     {msg.role === 'assistant' ? <AiFBallLogo size="sm"/> : <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-[10px] font-bold shadow-sm ${isDarkMode ? 'bg-emerald-700' : 'bg-emerald-600'}`}>أنت</div>}
                  </div>
                  <div className="flex flex-col w-full min-w-0">
                     {msg.role === 'user' ? (
                        <div className={`text-base sm:text-lg font-bold leading-relaxed break-words ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                           {msg.content}
                           {msg.imageUrls && msg.imageUrls.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {msg.imageUrls.map((url, idx) => (
                                <img key={idx} src={url} alt="مرفق" className={`w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-xl border shadow-sm ${isDarkMode ? 'border-white/20' : 'border-gray-300'}`} />
                              ))}
                            </div>
                           )}
                        </div>
                     ) : (
                        <div className="w-full">
                           {msg.thinkingTime !== undefined && msg.thinkingTime > 0 && (
                             <div className="mb-3 w-full">
                               <details className={`text-xs cursor-pointer group select-none transition-all duration-300 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                 <summary className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-xl border transition-colors shadow-sm ${isDarkMode ? 'bg-[#1A1C1E]/80 hover:bg-[#222528] border-white/5' : 'bg-gray-100 hover:bg-gray-200 border-gray-200'}`}>
                                   <span className={`font-bold ${isDarkMode ? 'text-emerald-500' : 'text-emerald-600'}`}>✓</span>
                                   <span className={`font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>تم جلب المعلومات في ({formatSeconds(msg.thinkingTime)})</span>
                                   <span className="opacity-50 group-open:rotate-180 transition-transform text-[8px] mr-auto pl-1">▼</span>
                                 </summary>
                                 <div className={`mt-3 mr-4 pr-3 py-1.5 border-r-2 space-y-2 font-medium text-xs ${isDarkMode ? 'border-emerald-500/30 text-gray-400' : 'border-emerald-300 text-gray-500'}`}>
                                   <p className="flex items-center gap-2"><span className={`text-[10px] ${isDarkMode ? 'text-emerald-500' : 'text-emerald-600'}`}>✓</span> تم التحقق من البيانات الرياضية...</p>
                                   <p className="flex items-center gap-2"><span className={`text-[10px] ${isDarkMode ? 'text-emerald-500' : 'text-emerald-600'}`}>✓</span> تمت مراجعة الإحصائيات والمصادر...</p>
                                   <p className="flex items-center gap-2"><span className={`text-[10px] ${isDarkMode ? 'text-emerald-500' : 'text-emerald-600'}`}>✓</span> تم صياغة النتيجة النهائية بنجاح.</p>
                                 </div>
                               </details>
                             </div>
                           )}
                           <div className={`backdrop-blur-xl border rounded-3xl p-4 sm:p-5 shadow-2xl text-sm sm:text-[15px] leading-relaxed break-words transition-colors duration-300 ${isDarkMode ? 'bg-[#131814]/85 border-white/10 text-gray-200' : 'bg-white border-gray-200 text-gray-800'}`}>
                             {renderFormattedText(msg.content, isDarkMode, sendMessage)}
                           </div>
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
                   <div className={`rounded-2xl px-4 py-3 border shadow-sm max-w-sm ${isDarkMode ? 'bg-[#1A1C1E]/80 border-white/5 text-gray-300' : 'bg-white border-gray-200 text-gray-600'}`}>
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                           <svg className="animate-spin w-4 h-4 text-emerald-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                           </svg>
                           <span className={`font-bold text-xs sm:text-sm ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>جاري البحث والتحليل... ({formatSeconds(loadingSeconds)})</span>
                        </div>
                        <div className={`pt-3 border-t space-y-2 text-[11px] font-medium ${isDarkMode ? 'border-white/5' : 'border-gray-200'}`}>
                          <div className="flex items-center gap-2">
                            <span className={`font-bold ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>✓</span><span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>الاتصال بخوادم فوتبلاي...</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {loadingSeconds >= 2 ? <span className={`font-bold ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>✓</span> : <span className="text-emerald-500 animate-pulse text-[10px]">⬤</span>}
                            <span className={loadingSeconds >= 2 ? (isDarkMode ? 'text-gray-300' : 'text-gray-600') : (isDarkMode ? 'text-gray-500' : 'text-gray-400')}>أتحقق من الإحصائيات والمعلومات...</span>
                          </div>
                          {loadingSeconds >= 3 && (
                            <div className="flex items-center gap-2">
                              {loadingSeconds >= 5 ? <span className={`font-bold ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>✓</span> : <span className="text-emerald-500 animate-pulse text-[10px]">⬤</span>}
                              <span className={loadingSeconds >= 5 ? (isDarkMode ? 'text-gray-300' : 'text-gray-600') : (isDarkMode ? 'text-gray-500' : 'text-gray-400')}>أراجع البيانات والمصادر المتاحة...</span>
                            </div>
                          )}
                        </div>
                      </div>
                   </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      <footer className={`p-3 backdrop-blur-md border-t relative z-20 transition-colors duration-300 ${isDarkMode ? 'bg-[#131314]/90 border-white/10' : 'bg-white/90 border-gray-200'}`}>
        <div className="max-w-4xl mx-auto">
          {attachedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2 px-2">
              {attachedFiles.map((f, idx) => (
                <div key={idx} className={`flex items-center gap-2 p-1.5 pr-3 rounded-lg shadow-sm backdrop-blur-md border ${isDarkMode ? 'bg-black/40 border-emerald-500/50' : 'bg-gray-50 border-emerald-300'}`}>
                  <img src={f.url} alt="مرفق" className={`w-8 h-8 object-cover rounded-md border ${isDarkMode ? 'border-white/10' : 'border-gray-300'}`} />
                  <span className={`text-xs max-w-[120px] truncate ${isDarkMode ? 'text-emerald-300' : 'text-emerald-700'}`} dir="ltr">{f.file.name}</span>
                  <button onClick={() => setAttachedFiles((prev) => prev.filter((_, i) => i !== idx))} className={`font-bold ml-1 mr-1 transition ${isDarkMode ? 'text-red-400 hover:text-red-300' : 'text-red-500 hover:text-red-600'}`}>✕</button>
                </div>
              ))}
            </div>
          )}

          <div className={`flex items-center gap-2 border rounded-full px-3 py-2 shadow-xl transition-colors duration-300 ${isDarkMode ? 'bg-[#1A1C1E] border-white/10 focus-within:border-emerald-500/40' : 'bg-gray-50 border-gray-300 focus-within:border-emerald-500'}`}>
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} multiple accept="image/*" className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} title="إرفاق ملف" className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0 transition ${isDarkMode ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-gray-200 text-gray-500 hover:text-gray-800'}`}>
              +
            </button>

            <button onClick={handleVoiceSearch} title="بحث صوتي" className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition shadow-sm ${isListening ? 'bg-emerald-600 text-white animate-pulse' : (isDarkMode ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-gray-200 text-gray-500 hover:text-gray-800')}`}>
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
              placeholder={isListening ? 'جاري الاستماع لصوتك...' : 'اسأل عن أي مباراة، تحليل، أو إحصائية...'}
              className={`flex-1 bg-transparent px-3 py-2 text-sm focus:outline-none ${isDarkMode ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'}`}
            />

            <button onClick={() => sendMessage()} disabled={loading || (!input.trim() && attachedFiles.length === 0)} className="w-10 h-10 rounded-full bg-[#1D6B35] hover:bg-emerald-600 disabled:bg-gray-300 disabled:text-gray-500 flex items-center justify-center text-white flex-shrink-0 transition shadow-md">
              ➤
            </button>
          </div>
          <p className={`text-[11px] text-center mt-2.5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>منصة فوتبلاي للذكاء الاصطناعي الرياضي • by خالد العايش</p>
        </div>
      </footer>

      {showLiveScores && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className={`relative w-full max-w-3xl max-h-[90vh] overflow-y-auto custom-scrollbar rounded-3xl shadow-2xl ${isDarkMode ? 'bg-[#131314] border border-white/10' : 'bg-white border border-gray-200'}`}>
            <div className={`sticky top-0 z-10 flex items-center justify-between p-4 border-b backdrop-blur-md ${isDarkMode ? 'bg-[#131314]/90 border-white/10' : 'bg-white/90 border-gray-200'}`}>
              <h2 className={`font-bold text-lg flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                <span>⚽</span> مركز النتائج المباشرة
              </h2>
              <button onClick={() => setShowLiveScores(false)} className={`w-8 h-8 rounded-full flex items-center justify-center transition ${isDarkMode ? 'bg-white/10 hover:bg-white/20 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}>✕</button>
            </div>
            <div className="p-2 sm:p-4">
              <LiveMatchCenter isDark={isDarkMode} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
