
'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
  useUser,
} from '@clerk/nextjs';

import LiveSportsWidget from './components/LiveSportsWidget';
import LiveMatchCenter from './components/LiveMatchCenter';
import LeagueDashboard from './components/LeagueDashboard';
import StandingsExplorer from './components/StandingsExplorer';
import { COMPETITIONS, resolveStandingsRequest } from '../lib/competitions';
import MatchReport from './components/MatchReport';
import PlayerComparison from './components/PlayerComparison';
import PlayerProfile from './components/PlayerProfile';
import TacticalLesson from './components/TacticalLesson';
import TrainingDrillWidget from './components/TrainingDrillWidget';
import { LESSON_CHOICES, resolveTacticalRequest } from '../lib/tactical-lessons';

type Language = 'ar' | 'en';
type DataRecord = Record<string, unknown>;

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

interface AttachedFile {
  file: File;
  url: string;
}

interface SuggestionCard {
  question: string;
  tag: string;
  icon: string;
}

const STORAGE_KEY = 'aifball_chat_history_v12';
const THEME_KEY = 'aifball_theme';

const GREETING =
  'مرحبا، الله حيه، أنا فوتبلاي مساعدك الرياضي. ماذا تريد أن تعرف؟';

const LEAGUES: Record<string, string> = Object.fromEntries(Object.entries(COMPETITIONS).map(([code, item]) => [code, item.ar]));
const LEAGUES_EN: Record<string, string> = Object.fromEntries(Object.entries(COMPETITIONS).map(([code, item]) => [code, item.en]));

const DISCOVERY_QUESTIONS: SuggestionCard[] = [
  { question: 'ما الفروق بين الضغط العالي والضغط المتوسط والضغط العكسي؟', tag: 'المدارس التكتيكية', icon: '⚽' },
  { question: 'كيف يُبنى نموذج احترافي لاكتشاف المواهب باستخدام البيانات؟', tag: 'الكشافون والمواهب', icon: '🔎' },
  { question: 'كيف يؤثر ازدحام المباريات على الأحمال البدنية واحتمالات الإصابة؟', tag: 'علوم الأداء', icon: '🏃' },
  { question: 'ما المؤشرات التي تساعد على تقييم المدرب بعيدًا عن النتائج؟', tag: 'تقييم المدربين', icon: '📋' },
  { question: 'كيف نقيس جودة صناعة الفرص باستخدام xG وxA والتمريرات التقدمية؟', tag: 'الإحصاء المتقدم', icon: '📊' },
  { question: 'كيف تبني الأندية استراتيجية انتقالات مستدامة فنيًا وماليًا؟', tag: 'الإدارة الرياضية', icon: '💼' },
  { question: 'كيف تطورت الأدوار التكتيكية للاعبي الوسط عبر تاريخ كرة القدم؟', tag: 'التاريخ الكروي', icon: '🏛️' },
  { question: 'كيف نحلل البناء من الخلف أمام الضغط العالي؟', tag: 'التحليل التكتيكي', icon: '🧠' },
  { question: 'كيف تختلف نماذج ملكية الأندية والحوكمة الرياضية حول العالم؟', tag: 'حوكمة الأندية', icon: '🏟️' },
  { question: 'كيف نقارن بين لاعبين في أدوار مختلفة باستخدام إحصائيات لكل 90 دقيقة؟', tag: 'مقارنة اللاعبين', icon: '⚔️' },
  { question: 'كيف تطورت المدارس التكتيكية في الكرة السعودية والخليجية؟', tag: 'الكرة العربية', icon: '🌍' },
  { question: 'ما الفرق بين الاستحواذ الفعّال والاستحواذ السلبي؟', tag: 'تحليل الأداء', icon: '📈' },
  { question: 'كيف تُدار أكاديمية كرة قدم من الناحية الفنية والإدارية؟', tag: 'تطوير الأكاديميات', icon: '🎓' },
  { question: 'كيف نقارن القيمة السوقية للاعب بقيمته الفنية؟', tag: 'اقتصاد كرة القدم', icon: '💰' },
  { question: 'كيف يؤثر تغيير الرسم التكتيكي أثناء المباراة على توزيع المساحات؟', tag: 'المرونة التكتيكية', icon: '🗺️' },
  { question: 'كيف تصمم هيكلًا يجمع المدير الرياضي والمدرب والكشافين؟', tag: 'الهياكل الرياضية', icon: '🏢' },
  { question: 'ما المعايير الفنية لتقييم حراس المرمى الحديثة؟', tag: 'تحليل المراكز', icon: '🧤' },
  { question: 'كيف نحلل الركلات الثابتة ونقيس تأثيرها على إنتاج الفرص؟', tag: 'الكرات الثابتة', icon: '🎯' },
  { question: 'كيف تبني الأندية نموذجًا لاتخاذ قرارات التعاقد بناءً على المخاطر؟', tag: 'صناعة القرار', icon: '📑' },
  { question: 'كيف يمكن استخدام الذكاء الاصطناعي لتطوير التدريب الرياضي؟', tag: 'التقنيات الرياضية', icon: '🤖' },
];

const CARDS_PER_PAGE = 4;
const DISCOVERY_INTERVAL = 15000;

function getDiscoveryQuestions(page: number): SuggestionCard[] {
  const start = (page * CARDS_PER_PAGE) % DISCOVERY_QUESTIONS.length;
  return Array.from(
    { length: CARDS_PER_PAGE },
    (_, index) => DISCOVERY_QUESTIONS[(start + index) % DISCOVERY_QUESTIONS.length]
  );
}

function detectLanguage(query?: string): Language {
  if (!query?.trim()) return 'ar';

  const arabicCount = (query.match(/[\u0600-\u06FF]/g) || []).length;
  const latinCount = (query.match(/[a-zA-Z]/g) || []).length;

  return latinCount > arabicCount ? 'en' : 'ar';
}

function resolveLanguage(
  explicitLanguage: string | undefined,
  userQuery?: string
): Language {
  const value = explicitLanguage?.trim().toLowerCase();

  if (value === 'ar' || value?.startsWith('ar-')) return 'ar';
  if (value === 'en' || value?.startsWith('en-')) return 'en';

  return detectLanguage(userQuery);
}

function normalizeSeason(value?: string): string {
  const season = value?.trim() || '2026';

  if (/^\d{4}$/.test(season)) return season;

  const range = season.match(/^(\d{4})\s*[-/]\s*(\d{2}|\d{4})$/);

  if (range) return range[1];

  return '2026';
}

function formatSeconds(sec: number): string {
  if (sec === 0) return '0 ثانية';
  if (sec === 1) return 'ثانية واحدة';
  if (sec === 2) return 'ثانيتان';
  if (sec >= 3 && sec <= 10) return `${sec} ثوانٍ`;
  return `${sec} ثانية`;
}

function asRecord(value: unknown): DataRecord | null {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as DataRecord;
}

function AiFBallLogo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const dimensions =
    size === 'sm'
      ? 'w-8 h-8 rounded-[9px]'
      : size === 'lg'
        ? 'w-14 h-14 rounded-[16px]'
        : 'w-10 h-10 rounded-[11px]';

  return (
    <div className={`${dimensions} bg-[#1D6B35] flex items-center justify-center shadow-md flex-shrink-0 select-none overflow-hidden`}>
      <svg viewBox="0 0 200 200" className="w-full h-full" aria-hidden="true">
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
          fontFamily="system-ui, sans-serif"
        >
          AiFBall
        </text>
      </svg>
    </div>
  );
}

function safeUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:'
      ? url.href
      : null;
  } catch {
    return null;
  }
}

function attrsOf(tag: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const regex = /([a-zA-Z_][\w-]*)\s*=\s*(["'])(.*?)\2/g;

  for (const match of tag.matchAll(regex)) {
    attrs[match[1].toLowerCase()] = match[3];
  }

  return attrs;
}

function InlineText({ value, isDark }: { value: string; isDark: boolean }) {
  const pieces = value.split(
    /(\[[^\]]+\]\(https?:\/\/[^\s)]+\)|https?:\/\/[^\s<>]+|\*\*[^*]+\*\*)/g
  );

  return (
    <>
      {pieces.map((part, index) => {
        const mdLink = part.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/);

        if (mdLink) {
          const href = safeUrl(mdLink[2]);
          return href ? (
            <a
              key={index}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-500 underline break-all"
            >
              {mdLink[1]}
            </a>
          ) : <span key={index}>{part}</span>;
        }

        if (/^https?:\/\//.test(part)) {
          const href = safeUrl(part);
          return href ? (
            <a
              key={index}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-500 underline break-all"
            >
              {part}
            </a>
          ) : <span key={index}>{part}</span>;
        }

        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong
              key={index}
              className={isDark ? 'text-emerald-400' : 'text-emerald-700'}
            >
              {part.slice(2, -2)}
            </strong>
          );
        }

        return <React.Fragment key={index}>{part}</React.Fragment>;
      })}
    </>
  );
}

function MarkdownTable({
  lines,
  isDark,
  lang = 'ar',
}: {
  lines: string[];
  isDark: boolean;
  lang?: Language;
}) {
  const cells = (line: string) =>
    line.trim()
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split(/(?<!\\)\|/)
      .map((value) => value.trim().replace(/\\\|/g, '|'));

  const rows = lines.map(cells);
  const divider = (row: string[]) =>
    row.every((cell) => /^:?-{3,}:?$/.test(cell));

  const header = rows[0] || [];
  const hasSeparator = rows.length > 1 && divider(rows[1]);
  const data = rows.slice(hasSeparator ? 2 : 1);

  return (
    <div
      dir={lang === 'en' ? 'ltr' : 'rtl'}
      className={`my-4 w-full overflow-x-auto rounded-xl border custom-scrollbar ${
        isDark ? 'border-white/10' : 'border-gray-200'
      }`}
    >
      <table
        className={`w-full min-w-max text-xs sm:text-sm border-collapse ${
          lang === 'en' ? 'text-left' : 'text-right'
        }`}
      >
        <thead>
          <tr className={isDark ? 'bg-emerald-950/50' : 'bg-emerald-50'}>
            {header.map((cell, index) => (
              <th
                key={index}
                className="px-3 py-3 font-bold border-b border-emerald-500/20"
              >
                <InlineText value={cell} isDark={isDark} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr
              key={index}
              className={
                isDark
                  ? 'odd:bg-white/[0.025] border-b border-white/5'
                  : 'odd:bg-gray-50 border-b border-gray-100'
              }
            >
              {header.map((_, cellIndex) => (
                <td key={cellIndex} className="px-3 py-2.5">
                  <InlineText value={row[cellIndex] || '—'} isDark={isDark} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function renderFormattedText(
  text: string,
  isDark: boolean,
  onSuggestionClick?: (query: string) => void,
  userQuery?: string
): React.ReactNode[] {
  const defaultLanguage = detectLanguage(userQuery);
  const youtubeIds = new Set<string>();

  const youtubeRegex =
    /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/g;

  const withoutVideos = text.replace(
    youtubeRegex,
    (_full, id: string) => {
      youtubeIds.add(id);
      return '';
    }
  );

  const elements: React.ReactNode[] = [];
  const lines = withoutVideos.replace(/\r\n/g, '\n').split('\n');

  const tableLine = (line: string) => /^\s*\|.+\|\s*$/.test(line);
  const isDivider = (line: string) =>
    /^\s*\|(?:\s*:?-{3,}:?\s*\|)+\s*$/.test(line);

  let codeFence = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith('```')) {
      codeFence = !codeFence;
      continue;
    }

    if (codeFence) {
      elements.push(
        <pre key={i} className="whitespace-pre-wrap text-xs">
          {line}
        </pre>
      );
      continue;
    }

    if (!trimmed) {
      elements.push(<div key={i} className="h-2" />);
      continue;
    }

    if (tableLine(line)) {
      const group = [line];

      while (i + 1 < lines.length && tableLine(lines[i + 1])) {
        group.push(lines[++i]);
      }

      if (group.length >= 2 && isDivider(group[1])) {
        elements.push(
          <MarkdownTable
            key={`table-${i}`}
            lines={group}
            isDark={isDark}
            lang={defaultLanguage}
          />
        );
      } else {
        elements.push(
          <pre
            key={`raw-table-${i}`}
            className="overflow-x-auto whitespace-pre-wrap text-xs"
          >
            {group.join('\n')}
          </pre>
        );
      }
      continue;
    }

    const tag = trimmed.match(
      /^<(aifball-[\w-]+)\b[^>]*\/?>(?:<\/\1>)?$/i
    );

    if (tag) {
      const name = tag[1].toLowerCase();
      const attrs = attrsOf(trimmed);
      const league = attrs.league?.trim().toLowerCase() || 'ksa.1';
      const lang = resolveLanguage(
        attrs.lang || attrs.language || attrs.locale,
        userQuery
      );

      if (name === 'aifball-livescores') {
        const date = ['today', 'yesterday', 'tomorrow'].includes(attrs.date)
          ? attrs.date
          : 'today';

        elements.push(
          <div key={i} className="my-5 w-full">
            <LiveSportsWidget
              date={date}
              isDark={isDark}
              league={league}
            />
          </div>
        );
        continue;
      }

      if (name === 'aifball-standings') {
        const season = attrs.season?.trim() ? normalizeSeason(attrs.season) : '';
        const leagueName =
          lang === 'en'
            ? LEAGUES_EN[league] || league
            : LEAGUES[league] || league;

        elements.push(
          <div key={i} className="my-5 w-full">
            <LeagueDashboard
              isDark={isDark}
              leagueCode={league}
              leagueName={leagueName}
              season={season}
              lang={lang}
            />
          </div>
        );
        continue;
      }

      if (name === 'aifball-match-report' || name === 'aifball-shotmap') {
        const matchName = attrs.match;
        const matchUrl = safeUrl(attrs.match_url || '');
        const is365 =
          matchUrl &&
          /^([\w-]+\.)*365scores\.com$/i.test(
            new URL(matchUrl).hostname
          );

        if (!matchName || !is365) {
          elements.push(
            <p key={i} className="my-2 text-amber-500">
              {lang === 'en'
                ? 'Unable to display match details: a valid match link is required.'
                : `تعذر عرض ${
                    name === 'aifball-shotmap'
                      ? 'خريطة التسديدات'
                      : 'تقرير المباراة'
                  }: رابط المباراة غير متوفر أو غير صالح.`}
            </p>
          );
          continue;
        }

        elements.push(
          <div key={i} className="my-5 w-full">
            <MatchReport
              matchName={matchName}
              autoMatchUrl={matchUrl}
              isDark={isDark}
            />
          </div>
        );
        continue;
      }

      if (name === 'aifball-player') {
        const playerName = attrs.name || attrs.player;
        if (playerName) {
          elements.push(
            <div key={i} className="my-5">
              <PlayerProfile playerName={playerName} isDark={isDark} />
            </div>
          );
        }
        continue;
      }

      if (name === 'aifball-compare') {
        if (attrs.player1 && attrs.player2) {
          elements.push(
            <div key={i} className="my-5">
              <PlayerComparison
                player1={attrs.player1}
                player2={attrs.player2}
                isDark={isDark}
              />
            </div>
          );
        }
        continue;
      }

      if (name === 'aifball-tactics' || name === 'aifball-training') {
        const lessonName = attrs.lesson || attrs.name || attrs.drill || '';
        elements.push(name === 'aifball-training'
          ? <TrainingDrillWidget key={i} drillName={lessonName} isDark={isDark} />
          : <TacticalLesson key={i} name={lessonName} isDark={isDark} />);
        continue;
      }

      if (name === 'aifball-summary') {
        const title =
          name === 'aifball-summary'
            ? lang === 'en' ? '📺 Match highlights' : '📺 ملخص المباراة'
            : lang === 'en' ? '🏃‍♂️ Tactical training' : '🏃‍♂️ تمرين تكتيكي';

        const url = safeUrl(attrs.match_url || '');

        elements.push(
          <div
            key={i}
            className={`my-4 p-4 rounded-2xl border ${
              isDark
                ? 'bg-emerald-950/30 border-emerald-800/40'
                : 'bg-emerald-50 border-emerald-200'
            }`}
          >
            <strong>{title}</strong>
            <p>{attrs.match || attrs.name || ''}</p>
            {url && (
              <a
                className="text-emerald-500 underline"
                href={url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {lang === 'en' ? 'View details' : 'عرض التفاصيل'}
              </a>
            )}
          </div>
        );
        continue;
      }

      elements.push(
        <p key={i} className="text-amber-500 text-xs">
          {lang === 'en'
            ? `Unsupported component: ${name}`
            : `هذا المكون غير مدعوم حاليًا: ${name}`}
        </p>
      );
      continue;
    }

    if (trimmed.startsWith('<aifball-')) continue;

    const image = trimmed.match(
      /^!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)$/
    );

    if (image) {
      const url = safeUrl(image[2]);

      if (url) {
        elements.push(
          <div
            key={i}
            className={`my-4 rounded-2xl overflow-hidden border p-2 ${
              isDark ? 'border-white/10' : 'border-gray-200'
            }`}
          >
            <img
              src={url}
              alt={image[1] || (defaultLanguage === 'en' ? 'Football image' : 'صورة رياضية')}
              className="w-full h-auto rounded-xl object-contain max-h-[28rem]"
            />
          </div>
        );
      }
      continue;
    }

    if (/^#{1,3}\s/.test(trimmed)) {
      const depth = trimmed.match(/^#+/)![0].length;
      const heading = trimmed.replace(/^#{1,3}\s+/, '');

      elements.push(
        <div
          key={i}
          className={`${
            depth === 1 ? 'text-xl' : depth === 2 ? 'text-lg' : 'text-base'
          } font-extrabold mt-4 mb-2 ${
            isDark ? 'text-emerald-400' : 'text-emerald-700'
          }`}
        >
          <InlineText value={heading} isDark={isDark} />
        </div>
      );
      continue;
    }

    if (/^([-*+]\s+|\d+\.\s+)/.test(trimmed)) {
      const bullet = trimmed.match(/^\d+\./)?.[0] || '•';

      elements.push(
        <div
          key={i}
          className={`flex items-start gap-2 my-1.5 ${
            defaultLanguage === 'en'
              ? 'pl-2 border-l-2'
              : 'pr-2 border-r-2'
          } border-emerald-500/40`}
        >
          <span className="text-emerald-500 font-bold">{bullet}</span>
          <span className="flex-1">
            <InlineText
              value={trimmed.replace(/^([-*+]\s+|\d+\.\s+)/, '')}
              isDark={isDark}
            />
          </span>
        </div>
      );
      continue;
    }

    if (
      /^(❓\s*|هل تريد|هل ترغب|هل تود)/.test(trimmed) &&
      onSuggestionClick
    ) {
      const question = trimmed.replace(/^❓\s*/, '');

      elements.push(
        <button
          key={i}
          type="button"
          onClick={() => onSuggestionClick(question)}
          className="my-2 px-3 py-2 rounded-xl border border-emerald-500/30 text-emerald-500 text-xs font-bold hover:bg-emerald-500/10"
        >
          {question}
        </button>
      );
      continue;
    }

    elements.push(
      <p
        key={i}
        className={`my-1.5 leading-relaxed text-sm sm:text-[15px] ${
          isDark ? 'text-gray-300' : 'text-gray-700'
        }`}
      >
        <InlineText value={trimmed} isDark={isDark} />
      </p>
    );
  }

  if (youtubeIds.size) {
    elements.push(
      <div key="videos" className="mt-6 pt-4 border-t border-emerald-500/20">
        <h4 className="font-bold text-emerald-500 mb-3">
          {defaultLanguage === 'en'
            ? '🎥 YouTube highlights'
            : '🎥 روابط ملخصات يوتيوب'}
        </h4>
        {Array.from(youtubeIds).map((id) => (
          <div
            key={id}
            className="rounded-2xl overflow-hidden border border-emerald-500/20 mb-5"
          >
            <a
              className="block p-3 text-xs font-bold text-red-500"
              href={`https://www.youtube.com/watch?v=${id}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {defaultLanguage === 'en'
                ? 'Watch on YouTube ↗'
                : 'مشاهدة على يوتيوب ↗'}
            </a>
            <div className="relative aspect-video bg-black">
              <iframe
                className="absolute inset-0 w-full h-full border-0"
                src={`https://www.youtube-nocookie.com/embed/${id}?rel=0`}
                title="Match highlights"
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

function parseSSEFrame(frame: string): DataRecord | null {
  const data = frame
    .split(/\r?\n/)
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5).trimStart())
    .join('\n');

  if (!data || data === '[DONE]') return null;

  try {
    return asRecord(JSON.parse(data));
  } catch {
    return null;
  }
}

export default function FootPlayChat() {
  const { user } = useUser();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingSeconds, setLoadingSeconds] = useState(0);
  const [conversationId, setConversationId] = useState('');
  const [currentSessionId, setCurrentSessionId] = useState('');
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showLiveScores, setShowLiveScores] = useState(false);
  const [showStandings, setShowStandings] = useState(false);
  const [discoveryPage, setDiscoveryPage] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sessionsRef = useRef<ChatSession[]>([]);
  const activeRequest = useRef<AbortController | null>(null);
  const activeRequestSession = useRef<string | null>(null);

  const suggestionCards = getDiscoveryQuestions(discoveryPage);

  const exploreMore = useCallback(() => {
    setDiscoveryPage((previous) =>
      (previous + 1) %
      Math.ceil(DISCOVERY_QUESTIONS.length / CARDS_PER_PAGE)
    );
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_KEY);
    setIsDarkMode(savedTheme !== 'light');

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (Array.isArray(saved)) {
          sessionsRef.current = saved;
          setSessions(saved);
        }
      }
    } catch {
      // تجاهل سجل غير صالح.
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0) return;

    const interval = window.setInterval(exploreMore, DISCOVERY_INTERVAL);
    return () => window.clearInterval(interval);
  }, [messages.length, exploreMore]);

  useEffect(() => {
    if (!loading) return;

    setLoadingSeconds(0);
    const id = window.setInterval(
      () => setLoadingSeconds((number) => number + 1),
      1000
    );

    return () => window.clearInterval(id);
  }, [loading]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(
    () => () => {
      activeRequest.current?.abort();
    },
    []
  );

  const saveSession = useCallback(
    (id: string, conv: string, msgs: Message[]) => {
      const title =
        msgs.find((message) => message.role === 'user')?.content.slice(0, 30) ||
        'محادثة جديدة';

      const entry: ChatSession = {
        id,
        title: title + (title.length >= 30 ? '...' : ''),
        conversationId: conv,
        messages: msgs,
        updatedAt: new Date().toISOString(),
      };

      const next = [
        entry,
        ...sessionsRef.current.filter((session) => session.id !== id),
      ];

      sessionsRef.current = next;
      setSessions(next);

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // امتلاء مساحة التخزين.
      }
    },
    []
  );

  const startNewChat = () => {
    activeRequest.current?.abort();
    activeRequestSession.current = null;

    setLoading(false);
    setMessages([]);
    setConversationId('');
    setCurrentSessionId('');
    setInput('');
    setDiscoveryPage(0);

    setAttachedFiles((previous) => {
      previous.forEach((item) => URL.revokeObjectURL(item.url));
      return [];
    });

    setSidebarOpen(false);
  };

  const handleVoiceSearch = () => {
    const browserWindow = window as Window & {
      SpeechRecognition?: new () => any;
      webkitSpeechRecognition?: new () => any;
    };

    const Recognition =
      browserWindow.SpeechRecognition ||
      browserWindow.webkitSpeechRecognition;

    if (!Recognition) {
      alert('متصفحك لا يدعم البحث الصوتي.');
      return;
    }

    if (isListening) return;

    const recognition = new Recognition();
    recognition.lang = 'ar-SA';
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      setInput((previous) =>
        `${previous} ${event.results[0][0].transcript}`.trim()
      );
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []).filter(
      (file) => file.type.startsWith('image/')
    );

    setAttachedFiles((previous) => [
      ...previous,
      ...files.map((file) => ({
        file,
        url: URL.createObjectURL(file),
      })),
    ]);

    event.target.value = '';
  };

  const sendMessage = async (textToSend?: string) => {
    const query = (textToSend ?? input).trim();

    if ((!query && attachedFiles.length === 0) || loading) return;

    const id =
      currentSessionId ||
      `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    if (!currentSessionId) setCurrentSessionId(id);

    const files = [...attachedFiles];
    const imageUrls = files.map((file) => file.url);

    const userMsg: Message = {
      role: 'user',
      content: query,
      userQuery: query,
      imageUrls,
    };

    const base = [...messages, userMsg];

    setInput('');
    setAttachedFiles([]);

    const normalized = query
      .toLowerCase()
      .replace(/[.,\/#!$%^&*;:{}=_`~()?؟!،]/g, '')
      .trim();

    const greetings = [
      'مرحبا',
      'هلا',
      'السلام عليكم',
      'هاي',
      'hi',
      'hello',
      'صباح الخير',
      'مساء الخير',
    ];

    if (greetings.includes(normalized) && files.length === 0) {
      const result: Message[] = [
        ...base,
        { role: 'assistant', content: GREETING },
      ];

      setMessages(result);
      saveSession(id, conversationId, result);
      return;
    }

    const standingsRequest = files.length === 0 ? resolveStandingsRequest(query) : null;
    if (standingsRequest) {
      const language = detectLanguage(query);
      const seasonAttribute = standingsRequest.season ? ` season="${standingsRequest.season}"` : '';
      const content = `<aifball-standings league="${standingsRequest.league}"${seasonAttribute} lang="${language}" />`;
      const result: Message[] = [...base, { role: 'assistant', content, userQuery: query }];
      setMessages(result);
      saveSession(id, conversationId, result);
      return;
    }

    const tacticalRequest = files.length === 0 ? resolveTacticalRequest(query) : null;
    if (tacticalRequest) {
      const content = `<aifball-tactics lesson="${tacticalRequest}" />`;
      const result: Message[] = [...base, { role: 'assistant', content, userQuery: query }];
      setMessages(result);
      saveSession(id, conversationId, result);
      return;
    }

    const initial: Message[] = [
      ...base,
      { role: 'assistant', content: '', userQuery: query },
    ];

    setMessages(initial);
    setLoading(true);

    const controller = new AbortController();
    activeRequest.current = controller;
    activeRequestSession.current = id;

    const timeoutId = window.setTimeout(() => controller.abort(), 90000);
    const started = Date.now();

    let answer = '';
    let conv = conversationId;
    let receivedAnswer = false;
    let latest = initial;

    const update = (content: string, elapsed?: number) => {
      latest = [
        ...latest.slice(0, -1),
        {
          ...latest[latest.length - 1],
          content,
          thinkingTime: elapsed,
        },
      ];

      if (activeRequestSession.current === id) {
        setMessages(latest);
      }

      saveSession(id, conv, latest);
    };

    try {
      const difyFiles: {
        type: string;
        transfer_method: string;
        upload_file_id: string;
      }[] = [];

      for (const item of files) {
        const form = new FormData();
        form.append('file', item.file);

        const upload = await fetch('/api/files/upload', {
          method: 'POST',
          body: form,
          signal: controller.signal,
        });

        if (!upload.ok) throw new Error('تعذر رفع الصورة.');

        const data = await upload.json();

        if (!data?.id) {
          throw new Error('لم يرجع خادم الملفات معرفًا للصورة.');
        }

        difyFiles.push({
          type: 'image',
          transfer_method: 'local_file',
          upload_file_id: data.id,
        });
      }

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          conversation_id: conversationId,
          ...(difyFiles.length ? { files: difyFiles } : {}),
        }),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      if (!res.body) throw new Error('لا يوجد تدفق استجابة من الخادم.');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      let buffer = '';
      let responseDone = false;

      const handleFrame = (frame: string) => {
        const event = parseSSEFrame(frame);
        if (!event) return;

        if (typeof event.conversation_id === 'string') {
          conv = event.conversation_id;

          if (activeRequestSession.current === id) {
            setConversationId(conv);
          }
        }

        if (event.event === 'error') {
          throw new Error(
            typeof event.message === 'string'
              ? event.message
              : 'Dify stream error'
          );
        }

        if (event.event === 'message_end') {
          responseDone = true;
        }

        if (
          (event.event === 'message' || event.event === 'agent_message') &&
          typeof event.answer === 'string'
        ) {
          answer += event.answer;
          receivedAnswer = true;

          update(
            answer,
            Math.max(1, Math.floor((Date.now() - started) / 1000))
          );
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const frames = buffer.split(/\r?\n\r?\n/);
        buffer = frames.pop() ?? '';

        for (const frame of frames) handleFrame(frame);
        if (responseDone) break;
      }

      buffer += decoder.decode();

      if (buffer.trim()) handleFrame(buffer);

      if (!receivedAnswer) {
        update('عذراً، لم يصل رد من المساعد. حاول مرة أخرى.');
      }
    } catch (error) {
      const aborted = controller.signal.aborted;

      const message = aborted
        ? 'عذراً، انتهت مهلة البحث أو تم إيقاف الطلب.'
        : 'عذراً، تعذر إكمال الاتصال بالخادم. حاول مرة أخرى.';

      update(
        answer
          ? `${answer}\n\n⚠️ انقطع الاتصال قبل اكتمال الرد.`
          : message
      );

      console.error('AiFBall chat error:', error);
    } finally {
      window.clearTimeout(timeoutId);

      if (activeRequest.current === controller) {
        activeRequest.current = null;
      }

      if (activeRequestSession.current === id) {
        activeRequestSession.current = null;
        setLoading(false);
      }

      saveSession(id, conv, latest);
    }
  };

  const toggleTheme = () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    localStorage.setItem(THEME_KEY, next ? 'dark' : 'light');
  };

  const openSession = (session: ChatSession) => {
    activeRequest.current?.abort();
    activeRequestSession.current = null;
    setLoading(false);

    setCurrentSessionId(session.id);
    setConversationId(session.conversationId || '');
    setMessages(session.messages || []);
    setSidebarOpen(false);
  };

  return (
    <div
      dir="rtl"
      className={`flex flex-col h-[100dvh] relative overflow-hidden font-cairo transition-colors duration-300 ${
        isDarkMode
          ? 'bg-[#131314] text-[#E3E3E3]'
          : 'bg-gray-50 text-gray-900'
      }`}
    >
      {/* خلفية الملعب */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none z-0 overflow-hidden"
      >
        <div
          className={`absolute inset-0 bg-center bg-no-repeat transition-all duration-700 ease-in-out ${
            messages.length === 0
              ? 'opacity-100 scale-100'
              : 'opacity-45 scale-[1.03]'
          }`}
          style={{
            backgroundImage: "url('/IMG_0091.jpeg')",
            backgroundSize: 'cover',
          }}
        />

        <div
          className={`absolute inset-0 transition-all duration-700 ${
            isDarkMode
              ? messages.length === 0
                ? 'bg-[#07110b]/35'
                : 'bg-[#101312]/78'
              : messages.length === 0
                ? 'bg-white/35'
                : 'bg-white/72'
          }`}
        />

        <div
          className={`absolute inset-0 bg-gradient-to-b ${
            isDarkMode
              ? 'from-[#07110b]/15 via-transparent to-[#101312]/55'
              : 'from-white/10 via-transparent to-white/50'
          }`}
        />
      </div>

      {/* خط Cairo */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap');

        .font-cairo,
        .font-cairo * {
          font-family: 'Cairo', sans-serif !important;
          font-feature-settings: 'calt' 1, 'liga' 1;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${isDarkMode ? '#2E3338' : '#D1D5DB'};
          border-radius: 8px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #1D6B35;
        }
      `}</style>

      {/* طبقة القائمة الجانبية */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 z-30"
        />
      )}

      {/* القائمة الجانبية */}
      <aside
        className={`fixed top-0 right-0 h-full w-72 sm:w-80 backdrop-blur-md border-l z-40 transform transition-all duration-300 flex flex-col ${
          isDarkMode
            ? 'bg-[#18191A]/95 border-white/10'
            : 'bg-white/95 border-gray-200'
        } ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div
          className={`flex items-center justify-between p-4 border-b ${
            isDarkMode ? 'border-white/10' : 'border-gray-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <AiFBallLogo size="sm" />
            <span className="font-bold text-sm">
              سجل البحوث والمحادثات
            </span>
          </div>

          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="w-8 h-8 rounded-lg hover:bg-white/10"
            aria-label="إغلاق القائمة"
          >
            ✕
          </button>
        </div>

        <div className="p-3">
          <button
            type="button"
            onClick={startNewChat}
            className="w-full py-2.5 px-4 rounded-xl bg-[#1D6B35] hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow"
          >
            <span>+</span>
            <span>بدء محادثة جديدة</span>
          </button>
          <button type="button" onClick={() => { setSidebarOpen(false); setShowStandings(true); }}
            className="mt-2 w-full py-2.5 px-4 rounded-xl border border-emerald-500/30 bg-emerald-600/10 text-emerald-500 font-bold text-xs">
            جداول الترتيب
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-1 space-y-1.5 custom-scrollbar">
          {sessions.map((session) => (
            <button
              type="button"
              key={session.id}
              onClick={() => openSession(session)}
              className={`w-full text-right p-3 rounded-xl cursor-pointer text-xs truncate transition border ${
                isDarkMode
                  ? 'bg-white/5 hover:bg-white/10 text-gray-300 border-transparent'
                  : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-100'
              }`}
            >
              {session.title}
            </button>
          ))}
        </div>

        <div
          className={`p-4 border-t mt-auto ${
            isDarkMode
              ? 'border-white/10 bg-[#131517]'
              : 'border-gray-200 bg-gray-50'
          }`}
        >
          <SignedOut>
            <SignInButton mode="modal">
              <button
                type="button"
                className="w-full py-3 px-4 rounded-xl bg-[#1D6B35] hover:bg-emerald-600 text-white font-bold text-sm flex items-center justify-center gap-2 transition shadow-lg"
              >
                تسجيل الدخول
              </button>
            </SignInButton>
          </SignedOut>

          <SignedIn>
            <div
              className={`flex items-center justify-between p-3 rounded-xl border ${
                isDarkMode
                  ? 'bg-white/5 border-white/5'
                  : 'bg-white border-gray-200 shadow-sm'
              }`}
            >
              <div className="flex items-center gap-3 w-full">
                <UserButton
                  appearance={{
                    elements: {
                      userButtonAvatarBox:
                        'w-9 h-9 rounded-full border-2 border-emerald-500/30',
                    },
                  }}
                />

                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-xs font-bold truncate">
                    {user?.fullName || user?.firstName || 'حسابي'}
                  </span>
                  <span className="text-[10px] text-emerald-500 mt-1">
                    متصل الآن
                  </span>
                </div>
              </div>
            </div>
          </SignedIn>
        </div>
      </aside>

      {/* الشريط العلوي */}
      <header
        className={`flex items-center justify-between px-3.5 sm:px-6 py-2.5 border-b sticky top-0 z-20 backdrop-blur-md ${
          isDarkMode
            ? 'border-white/10 bg-[#131314]/80'
            : 'border-gray-200 bg-white/80'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className={`w-9 h-9 rounded-xl border flex items-center justify-center ${
              isDarkMode
                ? 'bg-white/5 border-white/10'
                : 'bg-gray-100 border-gray-200'
            }`}
            aria-label="فتح القائمة"
          >
            ☰
          </button>

          <AiFBallLogo size="md" />

          <div>
            <h1 className="text-base font-bold leading-tight">فوتبلاي</h1>
            <p className="text-[10px] font-medium text-emerald-500">
              صديقك الرياضي
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setShowStandings(true)} aria-label="جداول الترتيب" title="جداول الترتيب"
            className="hidden sm:flex h-9 px-3 rounded-xl border border-emerald-500/30 bg-emerald-600/10 text-emerald-500 items-center justify-center gap-2 font-bold text-xs">
            <span aria-hidden="true">▤</span><span className="hidden sm:inline">جداول الترتيب</span>
          </button>
          <button
            type="button"
            onClick={() => setShowLiveScores(true)}
            className="px-3 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-600/10 text-emerald-500 flex items-center gap-2 font-bold text-xs"
          >
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            النتائج المباشرة
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            className={`w-9 h-9 rounded-xl border flex items-center justify-center ${
              isDarkMode
                ? 'bg-white/5 border-white/10 text-yellow-400'
                : 'bg-gray-100 border-gray-200 text-gray-600'
            }`}
            aria-label="تغيير المظهر"
            title={
              isDarkMode
                ? 'الانتقال للوضع النهاري'
                : 'الانتقال للوضع الليلي'
            }
          >
            {isDarkMode ? '☀' : '☾'}
          </button>

          <button
            type="button"
            onClick={startNewChat}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border hidden sm:block ${
              isDarkMode
                ? 'bg-white/5 border-white/10'
                : 'bg-gray-100 border-gray-200'
            }`}
          >
            + محادثة جديدة
          </button>
        </div>
      </header>

      {/* المحتوى الرئيسي */}
      <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 max-w-4xl w-full mx-auto flex flex-col relative z-10 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col justify-center my-auto py-2">
            <div className="text-right space-y-3 mb-5 px-1">
              <div className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold tracking-widest uppercase pb-1 border-b-2 text-emerald-500 border-emerald-500/40">
                <span>⚽</span>
                <span>HOME OF FOOTBALL</span>
              </div>

              <h2
                className={`text-3xl sm:text-5xl font-extrabold tracking-tight drop-shadow-md ${
                  isDarkMode ? 'text-white' : 'text-gray-950'
                }`}
              >
                أهلاً بك في فوتبلاي
              </h2>

              <p
                className={`text-sm sm:text-base leading-relaxed max-w-2xl ${
                  isDarkMode ? 'text-gray-100' : 'text-gray-800'
                }`}
              >
                منصتك للمعرفة الرياضية والتحليل المتقدم.
                استكشف التكتيك والإحصاء والتاريخ الكروي
                والإدارة الرياضية والانتقالات وتطوير المواهب.
                كيف أساعدك اليوم؟
              </p>
            </div>

            <section aria-label="ابدأ درساً تفاعلياً" className="mb-5">
              <h3 className="text-sm font-bold text-emerald-500 mb-2">التكتيك والتدريب · جرّب داخل المحادثة</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {LESSON_CHOICES.map(lesson => <button key={lesson.id} onClick={() => { void sendMessage(lesson.query); }} className={`p-3 rounded-xl border text-right text-xs font-bold leading-6 transition hover:border-emerald-500 ${isDarkMode ? 'bg-emerald-950/50 border-emerald-800/60 text-white' : 'bg-white/80 border-emerald-200 text-emerald-950'}`}>{lesson.title} <span className="text-emerald-500">← افتح اللوحة</span></button>)}
              </div>
            </section>

            {/* بطاقات الاستكشاف الزخرفية */}
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 w-full">
              {suggestionCards.map((card, index) => (
                <div
                  key={`${discoveryPage}-${index}`}
                  aria-label={`${card.tag}: ${card.question}`}
                  className={`pointer-events-none select-none flex flex-col justify-between text-right p-3 sm:p-4 rounded-2xl border backdrop-blur-[6px] min-h-[112px] sm:min-h-[126px] transition-all duration-500 ${
                    isDarkMode
                      ? 'bg-[#07180f]/45 border-emerald-400/15 text-white shadow-md'
                      : 'bg-white/35 border-white/55 text-gray-950 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-lg sm:text-xl leading-none">
                      {card.icon}
                    </span>
                    <span
                      className={`text-[9px] sm:text-[10px] font-bold ${
                        isDarkMode ? 'text-emerald-400' : 'text-emerald-800'
                      }`}
                    >
                      {card.tag}
                    </span>
                  </div>

                  <p className="mt-3 text-[11px] sm:text-sm font-bold leading-[1.8] line-clamp-3">
                    {card.question}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between gap-3 mt-4 px-1">
              <span
                className={`text-[10px] sm:text-xs ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                استكشف مجالات المعرفة الرياضية
              </span>

              <button
                type="button"
                onClick={exploreMore}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-[11px] sm:text-xs font-bold transition ${
                  isDarkMode
                    ? 'bg-black/25 border-emerald-400/25 text-emerald-300 hover:bg-emerald-950/60'
                    : 'bg-white/65 border-emerald-700/20 text-emerald-800 hover:bg-white/90'
                }`}
              >
                <span>↻</span>
                <span>استكشف المزيد</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 pb-4">
            {messages.map((msg, index) =>
              msg.content.trim() || (msg.imageUrls?.length ?? 0) > 0 ? (
                <div key={index} className="flex items-start gap-4 w-full">
                  <div className="flex-shrink-0 mt-1 hidden sm:block">
                    {msg.role === 'assistant' ? (
                      <AiFBallLogo size="sm" />
                    ) : (
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[10px] font-bold bg-emerald-700">
                        أنت
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col w-full min-w-0">
                    {msg.role === 'user' ? (
                      <div
                        dir={detectLanguage(msg.content) === 'en' ? 'ltr' : 'rtl'}
                        className="text-base sm:text-lg font-bold leading-relaxed break-words"
                      >
                        {msg.content}

                        {msg.imageUrls && msg.imageUrls.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {msg.imageUrls.map((url, imageIndex) => (
                              <img
                                key={imageIndex}
                                src={url}
                                alt="مرفق"
                                className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-xl border border-white/20"
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-full">
                        {msg.thinkingTime !== undefined &&
                          msg.thinkingTime > 0 && (
                            <div className="mb-3">
                              <span
                                className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-xs ${
                                  isDarkMode
                                    ? 'bg-[#1A1C1E]/80 border-white/5 text-gray-300'
                                    : 'bg-gray-100 border-gray-200 text-gray-700'
                                }`}
                              >
                                <span className="text-emerald-500">◷</span>
                                زمن استقبال الإجابة:{' '}
                                {formatSeconds(msg.thinkingTime)}
                              </span>
                            </div>
                          )}

                        <div
                          dir={
                            detectLanguage(msg.userQuery) === 'en'
                              ? 'ltr'
                              : 'rtl'
                          }
                          className={`backdrop-blur-xl border rounded-3xl p-4 sm:p-5 shadow-2xl text-sm sm:text-[15px] leading-relaxed break-words ${
                            isDarkMode
                              ? 'bg-[#131814]/85 border-white/10 text-gray-200'
                              : 'bg-white/90 border-gray-200 text-gray-800'
                          }`}
                        >
                          {renderFormattedText(
                            msg.content,
                            isDarkMode,
                            sendMessage,
                            msg.userQuery
                          )}
                        </div>

                        {/* أدوات الرسالة */}
                        <div
                          className={`flex items-center gap-1.5 mt-3 pt-3 border-t ${
                            isDarkMode ? 'border-white/5' : 'border-gray-100'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              navigator.clipboard.writeText(msg.content)
                            }
                            className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-gray-400"
                            title="نسخ النص"
                          >
                            ▣
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              navigator.share?.({
                                title: 'فوتبلاي',
                                text: msg.content,
                                url: window.location.href,
                              })
                            }
                            className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-gray-400"
                            title="مشاركة"
                          >
                            ↗
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              const query = msg.userQuery;
                              if (query) sendMessage(query);
                            }}
                            disabled={loading}
                            className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-gray-400 disabled:opacity-40"
                            title="إعادة التوليد"
                          >
                            ↻
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setMessages((previous) => {
                                const next = previous.map((message, messageIndex) =>
                                  messageIndex === index
                                    ? {
                                        ...message,
                                        feedback:
                                          message.feedback === 'like'
                                            ? null
                                            : ('like' as const),
                                      }
                                    : message
                                );

                                saveSession(
                                  currentSessionId,
                                  conversationId,
                                  next
                                );

                                return next;
                              })
                            }
                            className={`p-1.5 rounded-lg ${
                              msg.feedback === 'like'
                                ? 'text-emerald-500'
                                : 'text-gray-400'
                            }`}
                            title="إعجاب"
                          >
                            👍
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setMessages((previous) => {
                                const next = previous.map((message, messageIndex) =>
                                  messageIndex === index
                                    ? {
                                        ...message,
                                        feedback:
                                          message.feedback === 'dislike'
                                            ? null
                                            : ('dislike' as const),
                                      }
                                    : message
                                );

                                saveSession(
                                  currentSessionId,
                                  conversationId,
                                  next
                                );

                                return next;
                              })
                            }
                            className={`p-1.5 rounded-lg ${
                              msg.feedback === 'dislike'
                                ? 'text-red-500'
                                : 'text-gray-400'
                            }`}
                            title="عدم إعجاب"
                          >
                            👎
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : null
            )}

            {loading && (
              <div className="flex items-start gap-4 w-full mt-4">
                <div className="flex-shrink-0 mt-1 hidden sm:block">
                  <AiFBallLogo size="sm" />
                </div>

                <div
                  className={`rounded-2xl px-4 py-3 border shadow-sm ${
                    isDarkMode
                      ? 'bg-[#1A1C1E]/80 border-white/5 text-gray-300'
                      : 'bg-white border-gray-200 text-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <svg
                      className="animate-spin w-4 h-4 text-emerald-500"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="3"
                        opacity=".25"
                      />
                      <path
                        d="M4 12a8 8 0 018-8"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                    </svg>

                    <span className="font-bold text-xs sm:text-sm text-emerald-500">
                      جاري البحث والتحليل... ({formatSeconds(loadingSeconds)})
                    </span>
                  </div>

                  <p className="text-[11px] text-gray-500 mt-2">
                    جاري انتظار البيانات من خادم فوتبلاي
                  </p>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      {/* شريط المحادثة السفلي */}
      <footer
        className={`p-3 backdrop-blur-md border-t relative z-20 ${
          isDarkMode
            ? 'bg-[#131314]/90 border-white/10'
            : 'bg-white/90 border-gray-200'
        }`}
      >
        <div className="max-w-4xl mx-auto">
          {attachedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2 px-2">
              {attachedFiles.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-1.5 pr-3 rounded-lg border border-emerald-500/40"
                >
                  <img
                    src={item.url}
                    alt="مرفق"
                    className="w-8 h-8 object-cover rounded-md"
                  />

                  <span className="text-xs max-w-[120px] truncate" dir="ltr">
                    {item.file.name}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      setAttachedFiles((previous) => {
                        URL.revokeObjectURL(previous[index].url);
                        return previous.filter(
                          (_, itemIndex) => itemIndex !== index
                        );
                      })
                    }
                    className="text-red-500"
                    aria-label="إزالة المرفق"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          <div
            className={`flex items-center gap-2 border rounded-full px-3 py-2 shadow-xl ${
              isDarkMode
                ? 'bg-[#1A1C1E] border-white/10 focus-within:border-emerald-500/40'
                : 'bg-gray-50 border-gray-300 focus-within:border-emerald-500'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              multiple
              accept="image/*"
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="إرفاق ملف"
              className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xl text-gray-400 hover:text-emerald-500"
            >
              +
            </button>

            <button
              type="button"
              onClick={handleVoiceSearch}
              title="بحث صوتي"
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isListening
                  ? 'bg-emerald-600 text-white animate-pulse'
                  : 'text-gray-400 hover:text-emerald-500'
              }`}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3zM19 10v1a7 7 0 01-14 0v-1M12 18.5V22M8 22h8"
                />
              </svg>
            </button>

            <input
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (
                  event.key === 'Enter' &&
                  !event.nativeEvent.isComposing
                ) {
                  sendMessage();
                }
              }}
              placeholder={
                isListening
                  ? 'جاري الاستماع لصوتك...'
                  : 'اسأل عن أي مباراة، تحليل، أو إحصائية...'
              }
              className={`flex-1 min-w-0 bg-transparent px-3 py-2 text-sm focus:outline-none ${
                isDarkMode
                  ? 'text-white placeholder-gray-500'
                  : 'text-gray-900 placeholder-gray-400'
              }`}
            />

            <button
              type="button"
              onClick={() => sendMessage()}
              disabled={loading || (!input.trim() && !attachedFiles.length)}
              className="w-10 h-10 rounded-full bg-[#1D6B35] hover:bg-emerald-600 disabled:bg-gray-500 flex items-center justify-center text-white flex-shrink-0"
              aria-label="إرسال الرسالة"
            >
              ➤
            </button>
          </div>

          <p
            className={`text-[11px] text-center mt-2.5 ${
              isDarkMode ? 'text-gray-500' : 'text-gray-400'
            }`}
          >
            منصة فوتبلاي للذكاء الاصطناعي الرياضي • by خالد العايش
          </p>
        </div>
      </footer>

      {showStandings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm" onClick={() => setShowStandings(false)}>
          <div role="dialog" aria-modal="true" aria-label="جداول الترتيب العالمية" onClick={event => event.stopPropagation()}
            className={`w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl ${isDarkMode ? 'bg-[#131314] border border-white/10' : 'bg-white border border-gray-200'}`}>
            <div className={`sticky top-0 z-30 flex justify-between items-center p-4 border-b ${isDarkMode ? 'bg-[#131314] border-white/10' : 'bg-white border-gray-200'}`}>
              <h2 className="font-bold">جداول الترتيب العالمية</h2>
              <button type="button" aria-label="إغلاق جداول الترتيب" onClick={() => setShowStandings(false)} className="w-8 h-8 rounded-full">✕</button>
            </div>
            <StandingsExplorer isDark={isDarkMode} />
          </div>
        </div>
      )}

      {/* نافذة النتائج المباشرة */}
      {showLiveScores && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setShowLiveScores(false)}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            className={`relative w-full max-w-3xl max-h-[90vh] overflow-y-auto custom-scrollbar rounded-3xl shadow-2xl ${
              isDarkMode
                ? 'bg-[#131314] border border-white/10'
                : 'bg-white border border-gray-200'
            }`}
          >
            <div
              className={`sticky top-0 z-10 flex items-center justify-between p-4 border-b ${
                isDarkMode
                  ? 'bg-[#131314] border-white/10'
                  : 'bg-white border-gray-200'
              }`}
            >
              <h2 className="font-bold text-lg">
                ⚽ مركز النتائج المباشرة
              </h2>

              <button
                type="button"
                onClick={() => setShowLiveScores(false)}
                className="w-8 h-8 rounded-full hover:bg-white/10"
                aria-label="إغلاق النتائج"
              >
                ✕
              </button>
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
