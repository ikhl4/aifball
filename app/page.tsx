
'use client';

import { introArtwork } from './intro-artwork';

import AppIcon, { SportIconText } from './components/AppIcon';
import ReadAloudButton from './components/ReadAloudButton';
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
import MatchHighlightCard from './components/MatchHighlightCard';
import ChatVideoCard from './components/ChatVideoCard';
import ChatImageCard from './components/ChatImageCard';
import AutoChatImage from './components/AutoChatImage';
import MatchPoster from './components/MatchPoster';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import DocumentaryVideo from './components/DocumentaryVideo';
import { MatchVisualDemo } from './components/MatchVisualReport';
import PlayerComparison from './components/PlayerComparison';
import PlayerProfile from './components/PlayerProfile';
import TacticalLesson from './components/TacticalLesson';
import TrainingDrillWidget from './components/TrainingDrillWidget';
import AnalysisStory from './components/AnalysisStory';
import { analysisModeForQuery, splitAnalysisStory } from '../lib/analysis-story';
import { LESSON_CHOICES, resolveTacticalRequest } from '../lib/tactical-lessons';
import { summaryPresentationMode, youtubeVideoId } from '../lib/summary-presentation';

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
type ThemePreference = 'system' | 'light' | 'dark';

const GREETING =
  'مرحبا، الله حيه، أنا فوتبلاي مساعدك الرياضي. ماذا تريد أن تعرف؟';

const LEAGUES: Record<string, string> = Object.fromEntries(Object.entries(COMPETITIONS).map(([code, item]) => [code, item.ar]));
const LEAGUES_EN: Record<string, string> = Object.fromEntries(Object.entries(COMPETITIONS).map(([code, item]) => [code, item.en]));

const DISCOVERY_QUESTIONS: SuggestionCard[] = [
  { question: 'ما الفروق بين الضغط العالي والضغط المتوسط والضغط العكسي؟', tag: 'المدارس التكتيكية', icon: 'pitch' },
  { question: 'كيف يُبنى نموذج احترافي لاكتشاف المواهب باستخدام البيانات؟', tag: 'الكشافون والمواهب', icon: 'search' },
  { question: 'كيف يؤثر ازدحام المباريات على الأحمال البدنية واحتمالات الإصابة؟', tag: 'علوم الأداء', icon: 'activity' },
  { question: 'ما المؤشرات التي تساعد على تقييم المدرب بعيدًا عن النتائج؟', tag: 'تقييم المدربين', icon: 'clipboard' },
  { question: 'كيف نقيس جودة صناعة الفرص باستخدام xG وxA والتمريرات التقدمية؟', tag: 'الإحصاء المتقدم', icon: 'chart' },
  { question: 'كيف تبني الأندية استراتيجية انتقالات مستدامة فنيًا وماليًا؟', tag: 'الإدارة الرياضية', icon: 'briefcase' },
  { question: 'كيف تطورت الأدوار التكتيكية للاعبي الوسط عبر تاريخ كرة القدم؟', tag: 'التاريخ الكروي', icon: 'history' },
  { question: 'كيف نحلل البناء من الخلف أمام الضغط العالي؟', tag: 'التحليل التكتيكي', icon: 'network' },
  { question: 'كيف تختلف نماذج ملكية الأندية والحوكمة الرياضية حول العالم؟', tag: 'حوكمة الأندية', icon: 'pitch' },
  { question: 'كيف نقارن بين لاعبين في أدوار مختلفة باستخدام إحصائيات لكل 90 دقيقة؟', tag: 'مقارنة اللاعبين', icon: 'chart' },
  { question: 'كيف تطورت المدارس التكتيكية في الكرة السعودية والخليجية؟', tag: 'الكرة العربية', icon: 'globe' },
  { question: 'ما الفرق بين الاستحواذ الفعّال والاستحواذ السلبي؟', tag: 'تحليل الأداء', icon: 'chart' },
  { question: 'كيف تُدار أكاديمية كرة قدم من الناحية الفنية والإدارية؟', tag: 'تطوير الأكاديميات', icon: 'cap' },
  { question: 'كيف نقارن القيمة السوقية للاعب بقيمته الفنية؟', tag: 'اقتصاد كرة القدم', icon: 'chart' },
  { question: 'كيف يؤثر تغيير الرسم التكتيكي أثناء المباراة على توزيع المساحات؟', tag: 'المرونة التكتيكية', icon: 'pitch' },
  { question: 'كيف تصمم هيكلًا يجمع المدير الرياضي والمدرب والكشافين؟', tag: 'الهياكل الرياضية', icon: 'network' },
  { question: 'ما المعايير الفنية لتقييم حراس المرمى الحديثة؟', tag: 'تحليل المراكز', icon: 'shield' },
  { question: 'كيف نحلل الركلات الثابتة ونقيس تأثيرها على إنتاج الفرص؟', tag: 'الكرات الثابتة', icon: 'target' },
  { question: 'كيف تبني الأندية نموذجًا لاتخاذ قرارات التعاقد بناءً على المخاطر؟', tag: 'صناعة القرار', icon: 'clipboard' },
  { question: 'كيف يمكن استخدام الذكاء الاصطناعي لتطوير التدريب الرياضي؟', tag: 'التقنيات الرياضية', icon: 'network' },
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
  const dimensions = size === 'sm' ? 'h-8 w-8' : size === 'lg' ? 'h-14 w-14' : 'h-10 w-10';
  return <img src="/IMG_1417.png" alt="شعار فوتبلاي" className={`${dimensions} shrink-0 object-contain`} decoding="async" />;
}

function OriginalBrandLogo({ size = 'sm' }: { size?: 'sm' | 'lg' }) {
  return <img src="/IMG_1417.png" alt="شعار فوتبلاي" width={size === 'lg' ? 112 : 40} height={size === 'lg' ? 112 : 40} className={size === 'lg' ? 'h-28 w-28 object-contain' : 'h-10 w-10 shrink-0 object-contain'} decoding="async" />;
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
              <SportIconText text={part.slice(2, -2)}/>
            </strong>
          );
        }

        return <React.Fragment key={index}><SportIconText text={part}/></React.Fragment>;
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
  userQuery?: string,
  isStreaming = false
): React.ReactNode[] {
  const storyParts = splitAnalysisStory(text);
  if (storyParts.some(part => part.kind !== 'text')) {
    return storyParts.flatMap((part, index): React.ReactNode[] => {
      if (part.kind === 'text') return [<React.Fragment key={`analysis-text-${index}`}>{renderFormattedText(part.text, isDark, onSuggestionClick, userQuery, isStreaming)}</React.Fragment>];
      if (part.kind === 'story') return [<AnalysisStory key={`analysis-${index}`} data={part.data} isDark={isDark} />];
      if (part.kind === 'pending' && (part.data || part.text)) return [<div key={`analysis-partial-${index}`}>{part.data ? <AnalysisStory data={part.data} isDark={isDark} /> : renderFormattedText(part.text || '', isDark, undefined, userQuery, false)}<p role={isStreaming ? 'status' : 'alert'} className="text-xs text-amber-600 my-3 leading-7">{isStreaming ? 'يستمر إعداد بقية التحليل…' : 'انقطع الرد قبل اكتماله؛ عُرض الجزء الذي وصل دون استكمال أو تخمين.'}</p></div>];
      if (part.kind === 'invalid' && part.text) return [<div key={`analysis-fallback-${index}`}><p className="text-xs text-amber-600 mb-3">تعذّر عرض الملاعب؛ يظهر الشرح المكتوب المتاح دون الرسم.</p>{renderFormattedText(part.text, isDark, undefined, userQuery, false)}</div>];
      return [<p key={`analysis-status-${index}`} role={isStreaming ? 'status' : 'alert'} className="my-3 text-sm text-emerald-500 leading-7">{part.kind === 'pending' && isStreaming ? 'يجري إعداد الشرح والملاعب التوضيحية…' : 'لم يكتمل تنسيق هذا التحليل أو لم تصل بيانات صالحة للملاعب. أعد طلب التحليل؛ لن تُعرض بيانات ناقصة.'}</p>];
    });
  }
  const defaultLanguage = detectLanguage(userQuery);
  const summaryMode = summaryPresentationMode(userQuery || text);
  const youtubeIds = new Set<string>();
  const imageUrls = new Set<string>();
  const summaryTags: string[] = [];

  // Preserve structured match-summary tags so their video URLs stay attached
  // to the correct match instead of being collected as unrelated page videos.
  // Shield all structured components before extracting prose media URLs.
  const protectedSummaryTags = text.replace(
    /<aifball-[\w-]+\b[^>]*\/?>/gi,
    (tag) => {
      const index = summaryTags.push(tag) - 1;
      return `AIFBALLSUMMARYTAGTOKEN${index}END`;
    }
  );

  const youtubeRegex =
    /(?:https?:\/\/)?(?:www\.)?(?:m\.)?(?:youtube\.com\/(?:watch\?[^\s)]*?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/gi;

  const removeYoutube = protectedSummaryTags
    .replace(/\[([^\]]*)\]\((https?:\/\/(?:www\.)?(?:m\.)?(?:youtube\.com|youtu\.be)\/[^\s)]+)\)/gi, (full, _label: string, url: string) => {
      const id = youtubeVideoId(url);
      if (!id) return full;
      youtubeIds.add(id);
      return '';
    })
    .replace(youtubeRegex, (_full, id: string) => {
      youtubeIds.add(id);
      return '';
    });

  // Display images already returned by the assistant; no image search.
  const imageCandidate = (raw: string) => {
    const cleaned = raw.replace(/[.,;!?]+$/, '');
    const parsed = safeUrl(cleaned);
    if (!parsed) return null;
    try {
      return /\.(?:png|jpe?g|gif|webp|avif|svg)$/i.test(new URL(parsed).pathname) ? parsed : null;
    } catch { return null; }
  };
  const withoutMedia = removeYoutube
    .replace(/\bimage_url\s*[:=]\s*["']?\s*(https?:\/\/[^\s"']+)/gi, (match, rawUrl: string) => {
      const url = safeUrl(rawUrl.replace(/[.,;!?]+$/, ''));
      if (!url) return match;
      imageUrls.add(url);
      return '';
    })
    .replace(/!?\[[^\]]*\]\((https?:\/\/[^\s)]+)\)|https?:\/\/[^\s<>"')\]]+/gi, (match, markdownUrl: string | undefined) => {
      const url = imageCandidate(markdownUrl || match);
      if (!url) return match;
      imageUrls.add(url);
      return '';
    })
    .replace(/AIFBALLSUMMARYTAGTOKEN(\d+)END/g, (_token, index: string) => summaryTags[Number(index)] || '');

  const elements: React.ReactNode[] = [];
  const lines = withoutMedia.replace(/\r\n/g, '\n').split('\n');
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

        if (COMPETITIONS[league]?.searchOnly) {
          const sourceUrl = COMPETITIONS[league]?.officialUrl;
          elements.push(<p key={i} className="my-3 text-sm text-amber-500">
            بيانات هذه البطولة تُسترجع من مصدرها الرسمي داخل الرد الكتابي، ولا تتوفر لها لوحة نتائج مباشرة موثقة حالياً.
            {sourceUrl && <> <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="underline">المصدر الرسمي</a></>}
          </p>);
          continue;
        }

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

        if (COMPETITIONS[league]?.searchOnly && !COMPETITIONS[league]?.standingsSource) {
          const sourceUrl = COMPETITIONS[league]?.officialUrl;
          elements.push(<p key={i} className="my-3 text-sm text-amber-500">
            جدول هذه البطولة يُعرض كسرد أو جدول مكتوب بعد التحقق من المصدر الرسمي؛ لا تتوفر لها لوحة ترتيب تفاعلية موثقة حالياً.
            {sourceUrl && <> <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="underline">المصدر الرسمي</a></>}
          </p>);
          continue;
        }
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

      if (name === 'aifball-analysis-demo') {
        elements.push(<MatchVisualDemo key={i} isDark={isDark} />);
        continue;
      }

      if (name === 'aifball-match-report' || name === 'aifball-shotmap') {
        const matchName = attrs.match;
        const matchUrl = safeUrl(attrs.match_url || '');
        const is365 =
          matchUrl &&
          /^([\w-]+\.)*(espn\.com|sofascore\.com|365scores\.com)$/i.test(
            new URL(matchUrl).hostname
          );

        if (!matchName || (matchUrl && !is365 && !(attrs.event && attrs.league))) {
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
              autoMatchUrl={matchUrl || undefined}
              playerName={attrs.player_name}
              clipUrl={attrs.clip_url}
              eventId={attrs.event}
              leagueCode={attrs.league}
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
              <PlayerProfile playerName={playerName} seasons={attrs.seasons} selectedSeason={attrs.selected_season} details={attrs} isDark={isDark} />
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

      if (name === 'aifball-photo') {
        const photo = safeUrl(attrs.image);
        const source = safeUrl(attrs.source);
        if (!source?.startsWith('https://')) continue;
        const preview = '/api/photo-preview?source=' + encodeURIComponent(source);
        const candidates = [...new Set([photo, safeUrl(attrs.alternate_image)]
          .filter((url): url is string => Boolean(url?.startsWith('https://'))))];
        candidates.push(preview);
        const imageSrc = candidates[0];
        elements.push(
          <figure key={i} dir="rtl" className="my-4 overflow-hidden rounded-2xl border border-emerald-700/50">
            <img src={imageSrc} alt={attrs.caption || 'صورة كروية'} loading="lazy" referrerPolicy="no-referrer"
              className="max-h-[36rem] w-full bg-black object-contain"
              onError={(event) => {
                const img = event.currentTarget;
                const next = candidates[candidates.indexOf(img.getAttribute('src') || '') + 1];
                if (next) img.src = next;
                else { img.hidden = true; const notice = img.nextElementSibling; if (notice instanceof HTMLElement) notice.hidden = false; }
              }} />
            <p hidden className="p-4 text-sm">تعذّر عرض الصورة من المصدر داخل الشات.</p>
            <figcaption className="space-y-2 p-4 text-sm">
              {attrs.caption && <p>{attrs.caption}</p>}
              {attrs.date && <p>{attrs.date}</p>}
            </figcaption>
          </figure>
        );
        continue;
      }

      if (name === 'aifball-match-poster') {
        const posterQuery = attrs.query ? decodeURIComponent(attrs.query) : '';
        if (posterQuery) elements.push(<MatchPoster key={i} query={posterQuery} />);
        continue;
      }

      if (name === 'aifball-match-design') {
        const rows = (attrs.rows || '').split(';').slice(0, 60).flatMap((row) => {
          const [group, home, away, value, detail, homeLogo, awayLogo] = row.split('|').map(part => part.trim());
          return home && away ? [{ group, home, away, value, detail, homeLogo, awayLogo }] : [];
        });
        if (!rows.length) continue;
        const groups = new Map<string, typeof rows>();
        for (const row of rows) groups.set(row.group, [...(groups.get(row.group) || []), row]);
        const normalizeLeague = (value: string) => value.trim().toLowerCase().replace(/[أإآ]/g, 'ا');
        const logoLeague = ['ksa.1', 'eng.1', 'esp.1', 'ita.1', 'ger.1', 'fra.1'].find(code => {
          const item = COMPETITIONS[code];
          return item && [code, item.ar, item.en, ...item.aliases].some(label =>
            normalizeLeague(label) === normalizeLeague(attrs.competition || ''));
        });
        const logoId = logoLeague ? COMPETITIONS[logoLeague].fotmobId : undefined;
        const crest = (value: string | undefined, team: string) => {
          const manchesterTeams: Record<string, number> = {
            'مانشستر سيتي': 8456, 'manchester city': 8456,
            'مانشستر يونايتد': 10260, 'manchester united': 10260,
          };
          const id = manchesterTeams[team.trim().toLowerCase()];
          const url = id ? `https://images.fotmob.com/image_resources/logo/teamlogo/${id}.png` : safeUrl(value || '');
          return url?.startsWith('https://') ? <img src={url} alt="" loading="lazy" referrerPolicy="no-referrer" className="mx-auto mb-1 h-9 w-9 object-contain" onError={event => { event.currentTarget.hidden = true; }} /> : null;
        };
        const heading = attrs.kind === 'results' ? 'نتائج المباريات' : attrs.kind === 'draw' ? 'قرعة البطولة' : attrs.kind === 'match' ? 'يوم المباراة' : 'جدول المباريات';
        elements.push(
          <section key={i} dir="rtl" aria-label={heading} style={{ fontFamily: "Cairo, sans-serif" }} className="my-4 overflow-hidden rounded-3xl border border-emerald-700 bg-gradient-to-br from-[#08140f] via-[#123b2c] to-black p-5 text-white sm:p-8">
            <div className="flex items-center gap-3 text-sm font-bold text-emerald-300">
              {logoId && <img src={`https://images.fotmob.com/image_resources/logo/leaguelogo/${logoId}.png`} alt="" className="h-10 w-10 rounded-md bg-white object-contain p-1" onError={event => { event.currentTarget.hidden = true; }} />}
              <span>{attrs.competition}</span>
            </div>
            <h3 className="my-3 text-3xl font-black sm:text-5xl">{heading}</h3>
            {attrs.subtitle && <p className="mb-4 text-sm text-amber-200">{attrs.subtitle}</p>}
            {[...groups.entries()].map(([group, matches]) => (
              <div key={group} className="mt-4">
                {group && <h4 className="mb-2 text-sm font-bold text-amber-200">{group}</h4>}
                <div className={matches.length > 1 ? "grid gap-2 sm:grid-cols-2" : "grid gap-2"}>
                  {matches.map((row, index) => (
                    <div key={index} className="rounded-xl border border-white/10 bg-black/55 p-3">
                      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-center font-bold">
                        <span>{crest(row.homeLogo, row.home)}{row.home}</span>
                        <bdi className="rounded bg-emerald-950 px-2 py-1 text-emerald-200">{row.value || 'ضد'}</bdi>
                        <span>{crest(row.awayLogo, row.away)}{row.away}</span>
                      </div>
                      {row.detail && <p className="mt-2 text-center text-xs text-gray-200">{row.detail}</p>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <p className="mt-5 border-t border-amber-300/50 pt-3 text-xs font-bold text-emerald-200">فوتبلاي</p>
          </section>
        );
        continue;
      }

      if (name === 'aifball-documentary') {
        const decoded = Object.fromEntries(Object.entries(attrs).map(([key, value]) => [key, value.replace(/&quot;/g, '"').replace(/&amp;/g, '&')]));
        elements.push(<DocumentaryVideo key={i} attrs={decoded} />);
        continue;
      }

      if (name === 'aifball-summary') {
        elements.push(<MatchHighlightCard key={i} attrs={Object.fromEntries(Object.entries(attrs).map(([key, value]) => [key, value.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')]))} isDark={isDark} />);
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

    // Promote only explicitly supplied, short numeric facts into compact cards.
    // Never synthesize statistics or change the model's numbers.
    const stat = trimmed.match(/^(?:[-•]\s*)?([^:：|]{2,26})\s*[:：]\s*(\d[\d,.٬٫]*\s*(?:%|٪|دقيقة|مباراة|هدف|تمريرة حاسمة)?)\s*$/);
    if (stat && !isStreaming) {
      elements.push(
        <div key={i} className={`inline-flex items-center justify-between gap-4 rounded-xl border px-3 py-2 my-1 mx-1 min-w-[135px] max-w-full align-top ${isDark ? 'bg-[#242625] border-white/10' : 'bg-gray-100 border-gray-200'}`}>
          <span className="text-xs text-gray-500 dark:text-gray-400"><InlineText value={stat[1].trim()} isDark={isDark} /></span>
          <strong dir="auto" className={`text-base font-extrabold tabular-nums ${isDark ? 'text-white' : 'text-gray-900'}`}>{stat[2].trim()}</strong>
        </div>
      );
      continue;
    }

    elements.push(
      <p
        key={i}
        className={`my-1.5 leading-relaxed text-sm sm:text-[15px] ${
          isDark ? 'text-gray-300' : 'text-black'
        }`}
      >
        <InlineText value={trimmed} isDark={isDark} />
      </p>
    );
  }

  if (imageUrls.size) {
    elements.push(
      <div key="chat-images" className="my-4 space-y-3">
        {Array.from(imageUrls).map((url) => (
          <ChatImageCard key={url} url={url} isDark={isDark} />
        ))}
      </div>
    );
  }

  if (!isStreaming && imageUrls.size === 0 && /لاعب|مسيرة|قصة|تاريخ|ملعب|استاد|ستاد|نادي|رونالدو|ميسي|مبابي|يامال|صلاح|بنزيما|نيمار|player|stadium|club|history|career|story/i.test(userQuery || '')) {
    elements.push(<AutoChatImage key="auto-player-image" query={userQuery} isDark={isDark} />);
  }

  if (youtubeIds.size) {
    const matchLabels = lines
      .map((line) => line.trim().replace(/^#+\s*/, '').replace(/^\*\*|\*\*$/g, ''))
      .filter((line) =>
        /\d{1,2}\s*[-–]\s*\d{1,2}/.test(line) &&
        !/^(?:النتيجة|score)\s*:/i.test(line)
      );
    const videoBlock = (
      <div key="videos" className="mt-6 pt-4 border-t border-emerald-500/20">
        <h4 className="font-bold text-emerald-500 mb-3">
          {defaultLanguage === 'en' ? '🎥 Match videos' : '🎥 مقاطع المباريات'}
        </h4>
        {Array.from(youtubeIds).map((id, index) => {
          const matchLabel = matchLabels.length === youtubeIds.size ? matchLabels[index] : '';
          return (
            <div key={id}>
              {matchLabel && <p className="mb-2 text-sm font-bold">{matchLabel}</p>}
              <ChatVideoCard
                url={`https://www.youtube.com/watch?v=${id}`}
                title={matchLabel || (defaultLanguage === 'en' ? 'Match highlights' : 'ملخص المباراة')}
                isDark={isDark}
              />
            </div>
          );
        })}
      </div>
    );
    if (summaryMode === 'date') elements.unshift(videoBlock);
    else elements.push(videoBlock);
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
  const [chatNotice, setChatNotice] = useState('');
  const [historySearch, setHistorySearch] = useState('');
  const [conversationId, setConversationId] = useState('');
  const [currentSessionId, setCurrentSessionId] = useState('');
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [themePreference, setThemePreference] = useState<ThemePreference>('system');
  const [showLiveScores, setShowLiveScores] = useState(false);
  const [homeScreen, setHomeScreen] = useState<'home' | 'analytics'>('home');
  const homeSwipe = useRef<{x:number;y:number} | null>(null);

  const [showInstallHelp, setShowInstallHelp] = useState(false);
  const [showFantasyChoices, setShowFantasyChoices] = useState(false);
  // Render the logo in the initial HTML, before client JavaScript is ready.
  const [intro, setIntro] = useState(true);
  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let seen = false;
    try {
      seen = sessionStorage.getItem('aifball-intro') === '1';
      sessionStorage.setItem('aifball-intro', '1');
    } catch {
      // A blocked storage API must never prevent entry.
    }
    if (reducedMotion || seen) {
      setIntro(false);
      return;
    }
    // Count from navigation, so hydration does not add another full intro.
    const timer = window.setTimeout(() => setIntro(false), Math.max(0, 1200 - performance.now()));
    return () => window.clearTimeout(timer);
  }, []);
  const [showStandings, setShowStandings] = useState(false);
  const [discoveryPage, setDiscoveryPage] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sessionsRef = useRef<ChatSession[]>([]);
  const activeRequest = useRef<AbortController | null>(null);
  const activeRequestSession = useRef<string | null>(null);
  // A server job survives iOS suspension; its identifier survives a full reload.
  const durableJobRef = useRef<{ jobId: string; sessionId: string } | null>(null);
  const DURABLE_JOB_KEY = 'aifball-active-durable-job';
  const pollDurableJob = useCallback(async (jobId: string, sessionId: string, signal: AbortSignal) => {
    while (!signal.aborted) {
      try {
        const response = await fetch('/api/chat/jobs/' + encodeURIComponent(jobId), { signal, cache: 'no-store' });
        if (!response.ok) throw new Error('Job polling failed');
        const job: { status: string; answer: string; conversation_id: string; error?: string } = await response.json();
        const stored = sessionsRef.current.find(item => item.id === sessionId);
        if (stored) {
          const msgs = [...stored.messages];
          if (msgs.length && msgs[msgs.length - 1].role === 'assistant') {
            msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], content: job.answer ||
              (job.status === 'failed' ? job.error || 'تعذر إكمال البحث.' : 'جاري البحث…') };
            const entry = { ...stored, messages: msgs, conversationId: job.conversation_id || stored.conversationId,
              updatedAt: new Date().toISOString() };
            sessionsRef.current = [entry, ...sessionsRef.current.filter(item => item.id !== sessionId)];
            setSessions([...sessionsRef.current]);
            try { localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionsRef.current)); } catch {}
            if (activeRequestSession.current === sessionId) {
              setMessages(msgs);
              setConversationId(entry.conversationId);
            }
          }
        }
        if (job.status === 'completed' || job.status === 'failed') {
          try { localStorage.removeItem(DURABLE_JOB_KEY); } catch {}
          durableJobRef.current = null;
          if (activeRequestSession.current === sessionId) {
            activeRequestSession.current = null;
            setLoading(false);
          }
          return;
        }
      } catch (error) {
        if (signal.aborted) return;
        // Transient network loss: keep the job identifier and retry.
      }
      await new Promise(resolve => setTimeout(resolve, 2500));
    }
  }, []);

  useEffect(() => {
    let saved: { jobId: string; sessionId: string } | null = null;
    try { saved = JSON.parse(localStorage.getItem(DURABLE_JOB_KEY) || 'null'); } catch {}
    if (!saved?.jobId || !saved?.sessionId) return;
    durableJobRef.current = saved;
    const controller = new AbortController();
    // Restore the last session when the page was terminated while searching.
    const session = sessionsRef.current.find(item => item.id === saved.sessionId);
    if (session) {
      activeRequestSession.current = saved.sessionId;
      setCurrentSessionId(saved.sessionId);
      setConversationId(session.conversationId);
      setMessages(session.messages);
      setLoading(true);
    }
    void pollDurableJob(saved.jobId, saved.sessionId, controller.signal);
    return () => controller.abort();
  }, [pollDurableJob]);


  const suggestionCards = getDiscoveryQuestions(discoveryPage);

  const exploreMore = useCallback(() => {
    setDiscoveryPage((previous) =>
      (previous + 1) %
      Math.ceil(DISCOVERY_QUESTIONS.length / CARDS_PER_PAGE)
    );
  }, []);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const stored = localStorage.getItem(THEME_KEY);
    const preference: ThemePreference = stored === 'light' || stored === 'dark' ? stored : 'system';
    setThemePreference(preference);
    setIsDarkMode(preference === 'system' ? media.matches : preference === 'dark');
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

    if (files.length === 0 && /^(?:اعرض\s+)?(?:معاينة|نموذج|تجربة)\s+(?:تقرير فوتبلاي|التقرير التفاعلي)[.!؟?]*$/.test(query.trim())) {
      const result: Message[] = [...base, {
        role: 'assistant',
        content: 'معاينة تقرير فوتبلاي. المباراة والقيم والإحداثيات افتراضية للتوضيح فقط.\n<aifball-analysis-demo />',
        userQuery: query,
      }];
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
    // Persist the question immediately so iOS page suspension cannot erase it.
    saveSession(id, conversationId, initial);
    setLoading(true);
    setChatNotice('');

    const controller = new AbortController();
    activeRequest.current = controller;
    activeRequestSession.current = id;

    const timeoutId = window.setTimeout(() => controller.abort(), 240000);
    const started = performance.now();
    let firstByteMs: number | null = null;
    let firstAnswerMs: number | null = null;
    let streamedChunks = 0;
    let responseDone = false;
    let durableHandled = false;

    let answer = '';
    let conv = conversationId;
    let receivedAnswer = false;
    let latest = initial;
    // Save the latest received tokens before Safari is backgrounded.
    const persistOnBackground = () => {
      if (activeRequestSession.current === id) saveSession(id, conv, latest);
    };
    window.addEventListener('pagehide', persistOnBackground);
    document.addEventListener('visibilitychange', persistOnBackground);
    let renderFrame = 0;
    const paintAnswer = () => {
      renderFrame = 0;
      if (activeRequestSession.current === id) setMessages(latest);
    };
    const update = (content: string, elapsed?: number) => {
      latest = [
        ...latest.slice(0, -1),
        { ...latest[latest.length - 1], content, thinkingTime: elapsed },
      ];
      // Keep the answer streaming while avoiding a React render and
      // localStorage write for every incoming token.
      if (!renderFrame) renderFrame = window.requestAnimationFrame(paintAnswer);
    };

    try {
      // Signed-in text requests use the durable Render worker when configured.
      // If not configured, preserve the existing streaming Dify behavior.
      if (user?.id && files.length === 0) {
        const key = crypto.randomUUID();
        const durable = await fetch('/api/chat/jobs', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, conversation_id: conversationId, idempotency_key: key }),
          signal: controller.signal,
        }).catch(() => null);
        if (durable?.ok) {
          const job: { id: string } = await durable.json();
          if (job.id) {
            const pending = { jobId: job.id, sessionId: id };
            durableJobRef.current = pending;
            localStorage.setItem(DURABLE_JOB_KEY, JSON.stringify(pending));
            // Polling is independent of the original request and resumes after reload.
            durableHandled = true;
            await pollDurableJob(job.id, id, controller.signal);
            return;
          }
        }
        if (durable && !durable.ok && durable.status !== 503) {
          setChatNotice('تعذر بدء البحث بالخلفية. سنستخدم الاتصال المباشر مؤقتًا؛ أبقِ الصفحة مفتوحة.');
        } else if (!durable) {
          setChatNotice('تعذر الوصول إلى خدمة البحث بالخلفية. سنحاول الاتصال المباشر.');
        }
      }
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
          documentary_context: (() => {
            const previous = [...messages].reverse().find(m => m.role === 'assistant');
            if (!previous || !/يتوفر وثائقي/.test(previous.content)) return '';
            const topic = [...messages].reverse().find(m => m.role === 'user');
            return [topic?.content || '', previous.content].join('\n').slice(0, 6000);
          })(),
          has_match_context: /<aifball-match-report\b/.test([...messages].reverse().find(m=>m.role==='assistant')?.content||''),
          analysis_mode: analysisModeForQuery(query, messages[messages.length - 1]?.role === 'assistant' ? messages[messages.length - 1].content : ''),
          ...(difyFiles.length ? { files: difyFiles } : {}),
        }),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      if (!res.body) throw new Error('لا يوجد تدفق استجابة من الخادم.');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      let buffer = '';
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
          if (firstAnswerMs === null && event.answer.length > 0) firstAnswerMs = performance.now() - started;
          receivedAnswer = true;

          update(
            answer,
            Math.max(1, Math.floor((performance.now() - started) / 1000))
          );
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        streamedChunks++;
        if (firstByteMs === null) firstByteMs = performance.now() - started;

        buffer += decoder.decode(value, { stream: true });
        const frames = buffer.split(/\r?\n\r?\n/);
        buffer = frames.pop() ?? '';

        for (const frame of frames) handleFrame(frame);
        if (responseDone) break;
      }

      buffer += decoder.decode();

      if (buffer.trim()) handleFrame(buffer);

      if (receivedAnswer && !responseDone) {
        update(`${answer}\n\n⚠️ انقطع الاتصال قبل اكتمال الرد.`);
      }

      if (!receivedAnswer) {
        update('عذراً، لم يصل رد من المساعد. حاول مرة أخرى.');
      }
    } catch (error) {
      const aborted = controller.signal.aborted;

      const message = aborted
        ? 'توقف الاتصال قبل اكتمال البحث. يمكنك إعادة إرسال السؤال.'
        : 'تعذر إكمال الاتصال. تحقق من الإنترنت، ثم اضغط إعادة المحاولة.';

      update(
        answer
          ? `${answer}\n\n⚠️ انقطع الاتصال قبل اكتمال الرد.`
          : message
      );

      console.error('AiFBall chat error:', error);
    } finally {
      window.removeEventListener('pagehide', persistOnBackground);
      document.removeEventListener('visibilitychange', persistOnBackground);
      window.clearTimeout(timeoutId);

      if (activeRequest.current === controller) {
        activeRequest.current = null;
      }

      if (renderFrame) window.cancelAnimationFrame(renderFrame);
      if (!durableHandled) {
        if (activeRequestSession.current === id) {
          setMessages(latest);
          activeRequestSession.current = null;
          setLoading(false);
        }
        saveSession(id, conv, latest);
      }
      // Opt-in, local-only diagnostics. No query, response or personal data logged.
      if (typeof window !== 'undefined' && window.localStorage.getItem('aifball_debug_performance') === '1') {
        console.info('[AiFBall chat performance]', {
          firstByteMs: firstByteMs === null ? null : Math.round(firstByteMs),
          firstAnswerMs: firstAnswerMs === null ? null : Math.round(firstAnswerMs),
          totalMs: Math.round(performance.now() - started),
          streamedChunks,
          completed: responseDone,
        });
      }
    }
  };

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (event: MediaQueryListEvent) => {
      if (themePreference === 'system') setIsDarkMode(event.matches);
    };
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [themePreference]);

  const toggleTheme = () => {
    const next: ThemePreference = themePreference === 'system' ? 'light' : themePreference === 'light' ? 'dark' : 'system';
    setThemePreference(next);
    setIsDarkMode(next === 'system' ? window.matchMedia('(prefers-color-scheme: dark)').matches : next === 'dark');
    localStorage.setItem(THEME_KEY, next);
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
          ? 'bg-[#022c22] text-white'
          : 'bg-white text-black'
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
            backgroundImage: isDarkMode ? "url('/IMG_0091.jpeg')" : messages.length === 0 ? "linear-gradient(90deg, transparent 49.8%, #16a34a 50%, transparent 50.2%), radial-gradient(circle at center, transparent 13%, #16a34a 13.2%, transparent 13.5%)" : 'none',
            backgroundColor: isDarkMode ? undefined : '#fff',
            backgroundSize: 'cover',
          }}
        />

        <div
          className={`absolute inset-0 transition-all duration-700 ${
            isDarkMode
              ? messages.length === 0
                ? 'bg-[#064e3b]/35'
                : 'bg-[#022c22]/75'
              : messages.length === 0
                ? 'bg-white/20'
                : 'bg-white'
          }`}
        />

        <div
          className={`absolute inset-0 bg-gradient-to-b ${
            isDarkMode
              ? 'from-emerald-700/10 via-transparent to-emerald-950/75'
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

        .aifball-day-reply h1, .aifball-day-reply h2, .aifball-day-reply h3,
        .aifball-day-reply h4, .aifball-day-reply h5, .aifball-day-reply h6 {
          color: #1D6B35 !important;
        }
        .aifball-day-reply p, .aifball-day-reply li { color: #000; }

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
            ? 'bg-emerald-950/55 backdrop-blur-2xl border-emerald-300/20'
            : 'bg-[#15543a] text-white border-emerald-800/30 shadow-2xl'
        } ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div
          className={`flex items-center justify-between p-4 border-b ${
            isDarkMode ? 'border-white/10' : 'border-white/20'
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
            <AppIcon name="close" size={18}/>
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
          <div className="mt-4 space-y-1.5">
            <p className={`px-2 pb-1 text-[10px] font-bold ${isDarkMode ? 'text-gray-500' : 'text-white'}`}>مراكز فوتبلاي</p>
            <button type="button" onClick={() => { setSidebarOpen(false); void sendMessage('اعرض مكتبة التمارين'); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-right text-xs font-bold transition ${isDarkMode ? 'text-gray-200 hover:bg-white/5' : 'text-white hover:bg-emerald-700/50'}`}>
              <AppIcon name="activity" size={19} className={isDarkMode ? "text-emerald-500" : "text-white"}/><span>التمارين</span>
            </button>
            <button type="button" onClick={() => { setSidebarOpen(false); window.location.assign('/preview/transfers'); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-right text-xs font-bold transition ${isDarkMode ? 'text-gray-200 hover:bg-white/5' : 'text-white hover:bg-emerald-700/50'}`}>
              <AppIcon name="activity" size={19} className={isDarkMode ? "text-emerald-500" : "text-white"}/><span>مركز الانتقالات</span>
            </button>
            <button type="button" onClick={() => { setSidebarOpen(false); setShowStandings(true); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-right text-xs font-bold transition ${isDarkMode ? 'text-gray-200 hover:bg-white/5' : 'text-white hover:bg-emerald-700/50'}`}>
              <AppIcon name="chart" size={19} className={isDarkMode ? "text-emerald-500" : "text-white"}/><span>الترتيب</span>
            </button>
            <button type="button" onClick={() => { setSidebarOpen(false); setShowLiveScores(true); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-right text-xs font-bold transition ${isDarkMode ? 'text-gray-200 hover:bg-white/5' : 'text-white hover:bg-emerald-700/50'}`}>
              <AppIcon name="pitch" size={19} className={isDarkMode ? "text-emerald-500" : "text-white"}/><span>النتائج المباشرة</span>
              <span className="mr-auto w-1.5 h-1.5 rounded-full bg-red-500" aria-hidden="true"/>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-1 space-y-1.5 custom-scrollbar">
          <input aria-label="البحث في المحادثات" placeholder="ابحث في المحادثات…" value={historySearch} onChange={event => setHistorySearch(event.target.value)} className={`w-full rounded-lg border px-3 py-2 text-sm mb-3 outline-none focus:border-emerald-600 ${isDarkMode ? 'border-emerald-700/30 bg-transparent text-white placeholder:text-gray-400' : 'border-emerald-900/20 bg-white text-slate-900 placeholder:text-slate-500'}` } />
          {sessions.filter(session => session.title.toLocaleLowerCase().includes(historySearch.trim().toLocaleLowerCase())).map((session) => (
            <button
              type="button"
              key={session.id}
              onClick={() => openSession(session)}
              className={`w-full text-right p-3 rounded-xl cursor-pointer text-xs truncate transition border ${
                isDarkMode
                  ? 'bg-white/5 hover:bg-white/10 text-gray-300 border-transparent'
                  : 'bg-emerald-800/50 hover:bg-emerald-700/70 text-white border-emerald-600/30'
              }`}
            >
              {session.title}
            </button>
          ))}
        </div>

        <div
          className={`p-4 border-t mt-auto ${
            isDarkMode
              ? 'border-emerald-500/40 bg-emerald-950/60 backdrop-blur-xl'
              : 'border-emerald-600/30 bg-[#10452f]'
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
                  : 'bg-emerald-800/60 border-emerald-600/30 text-white shadow-sm'
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
            ? 'border-emerald-500/40 bg-emerald-950/45 backdrop-blur-xl'
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
            <AppIcon name="menu"/>
          </button>

          <img src="/IMG_1417.png" alt="شعار فوتبلاي" width={48} height={48} className="h-12 w-12 shrink-0 object-contain" decoding="async" />

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
            aria-label={`المظهر: ${themePreference === 'system' ? 'تلقائي حسب الجوال' : themePreference === 'light' ? 'نهاري' : 'ليلي'}. اضغط للتبديل`}
            title={`المظهر: ${themePreference === 'system' ? 'تلقائي حسب الجوال' : themePreference === 'light' ? 'نهاري' : 'ليلي'}`}
          >
            <AppIcon name={themePreference === 'system' ? 'smartphone' : themePreference === 'dark' ? 'moon' : 'sun'}/>
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

      {intro && (
        <button type="button" aria-label="تخطي المقدمة" onClick={() => setIntro(false)} className="aifball-intro fixed inset-0 z-[100] grid place-items-center overflow-hidden bg-[radial-gradient(ellipse_at_center,#114333,#050e0b_70%)] text-white ">
          <style>{`@keyframes glass-orbit{from{transform:translateY(4vh);opacity:0}18%{opacity:1}70%{opacity:1}to{transform:translateY(-90vh);opacity:0}}`}</style>
          <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 -top-[30vh] grid h-[150vh] grid-cols-5 place-items-center gap-4 px-4 mix-blend-screen [animation:glass-orbit_1.2s_ease-in-out_both] sm:grid-cols-9">
            {Array.from({length: 28}, (_, index) => {
              const logos = [536,47,87,55,54,53,42];
              const slot = (index * 5) % 14;
              const artwork = slot - logos.length;
              const src = artwork < 0 ? `https://images.fotmob.com/image_resources/logo/leaguelogo/${logos[slot]}.png` : introArtwork[artwork];
              const filter = artwork < 2 ? 'brightness(0) invert(1)' : [2,5,6].includes(artwork) ? 'grayscale(1) invert(1) contrast(3)' : 'grayscale(1) contrast(3) brightness(1.4)';
              return <img key={index} src={src} alt="" width={80} height={56} decoding="async" style={{filter, opacity: .14 + (index % 4) * .04}} className="h-9 w-full max-w-20 object-contain sm:h-14" onError={event => { event.currentTarget.hidden = true; }} />;
            })}
          </span>
          <span className="relative flex flex-col items-center gap-6">
            <span className="my-4 scale-150 sm:scale-[1.8]"><OriginalBrandLogo size="lg" /></span>
            <span className="text-sm font-normal text-white/80">من الرياض إلى العالم</span>
          </span>
        </button>
      )}

      {/* المحتوى الرئيسي */}
      <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 max-w-4xl w-full mx-auto flex flex-col relative z-10 custom-scrollbar"
        onTouchStart={e => { if (messages.length === 0) homeSwipe.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }}
        onTouchEnd={e => {
          const start = homeSwipe.current;
          homeSwipe.current = null;
          if (!start || messages.length !== 0) return;
          const dx = e.changedTouches[0].clientX - start.x;
          const dy = e.changedTouches[0].clientY - start.y;
          if (Math.abs(dx) > 75 && Math.abs(dx) > Math.abs(dy) * 1.5) setHomeScreen(dx < 0 ? 'analytics' : 'home');
        }}>
        {messages.length === 0 && (
          <nav aria-label="شاشات فوتبلاي" className={`sticky top-0 z-20 mx-auto mb-5 flex w-full max-w-sm gap-1 rounded-2xl border p-1 shadow-lg backdrop-blur-lg ${isDarkMode ? "border-emerald-500/30 bg-emerald-950/60" : "border-emerald-800/25 bg-[#155c3e] shadow-emerald-950/10"}`}>
            <button type="button" aria-current={homeScreen === 'home' ? 'page' : undefined} onClick={() => setHomeScreen('home')}
              className={`flex-1 rounded-xl px-3 py-2 text-xs sm:text-sm font-bold transition ${homeScreen === 'home' ? 'bg-emerald-600 text-white' : (isDarkMode ? 'text-gray-300 hover:bg-white/10' : 'text-white hover:bg-emerald-700/60')}`}>الرئيسية</button>
            <button type="button" aria-current={homeScreen === 'analytics' ? 'page' : undefined} onClick={() => setHomeScreen('analytics')}
              className={`flex-1 rounded-xl px-3 py-2 text-xs sm:text-sm font-bold transition ${homeScreen === 'analytics' ? 'bg-emerald-600 text-white' : (isDarkMode ? 'text-gray-300 hover:bg-white/10' : 'text-white hover:bg-emerald-700/60')}`}><span className="inline-flex items-center justify-center gap-2">التحليلات <svg aria-hidden="true" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="4"/><path d="M7 16v-3m5 3V8m5 8v-5"/><path d="M6 19h12"/></svg></span></button>
          </nav>
        )}
        {messages.length === 0 ? (homeScreen === 'home' ? (
          <div className="flex-1 flex flex-col justify-center my-auto py-2" style={{ fontFamily: "Cairo, sans-serif" }}>
            <div className="text-right space-y-3 mb-5 px-1">
              <div className={`inline-flex items-center gap-2 text-xs sm:text-sm font-bold tracking-widest uppercase pb-1 border-b-2 border-emerald-500/40 ${isDarkMode ? 'text-emerald-300' : 'text-emerald-900'}`}>
                <AppIcon name="pitch"/>
                <span>HOME OF FOOTBALL</span>
              </div>

              <p
                className={`text-sm sm:text-base leading-relaxed max-w-2xl ${
                  isDarkMode ? 'text-gray-100' : 'text-gray-800'
                }`}
              >
                <span dir="ltr">From Riyadh to The World</span>
              </p>
            </div>

            <nav aria-label="اختصارات فوتبلاي" className="mb-6 grid grid-cols-4 gap-2">
              {[
                { title: 'إضافة التطبيق للرئيسية', icon: 'plus', install: true },
                { title: 'نماذج تمرين', icon: 'activity', query: 'اعرض مكتبة التمارين' },
                { title: 'FC 27', icon: 'pitch', href: 'https://www.futbin.com/' },
                { title: 'الفانتازي', icon: 'chart', fantasy: true },
              ].map(item => {
                const style = 'flex min-h-20 flex-col items-center justify-center gap-2 rounded-2xl border border-emerald-300/35 p-2 text-center text-[10px] font-bold backdrop-blur-md transition focus-visible:outline focus-visible:outline-emerald-600 sm:text-sm' + (isDarkMode ? ' bg-emerald-900/45 backdrop-blur-xl text-white hover:bg-emerald-950/45' : ' bg-white/60 text-gray-900 hover:bg-emerald-950/50 backdrop-blur-xl');
                const label = <>{item.href ? <svg aria-hidden="true" width="27" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={isDarkMode ? "text-emerald-300" : "text-emerald-800"}><path d="M7 7h10a4 4 0 0 1 4 3l1 5a2 2 0 0 1-3 2l-3-3H8l-3 3a2 2 0 0 1-3-2l1-5a4 4 0 0 1 4-3Z"/><path d="M7 9v4m-2-2h4m7-1h.01m3 2h.01"/></svg> : <AppIcon name={item.icon} size={23} className={isDarkMode ? "text-emerald-300" : "text-emerald-800"}/>}<span>{item.title}</span></>;
                return item.href ? <a key={item.title} href={item.href} className={style}>{label}</a> :
                  <button key={item.title} type="button" className={style} onClick={() => { if (item.install) setShowInstallHelp(open => !open); else if (item.fantasy) setShowFantasyChoices(open => !open); else if (item.query) void sendMessage(item.query); }}>{label}</button>;
              })}
            </nav>
            {showFantasyChoices && (
              <section aria-label="اختر مسابقة الفانتازي" className={`mb-4 rounded-2xl border border-emerald-500/30 p-4 text-right ${isDarkMode ? 'bg-emerald-950/50 backdrop-blur-xl text-white' : 'bg-white text-slate-900'}`}>
                <p className="mb-3 text-sm font-bold">أي فانتازي تبي؟</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { title: 'فانتازي روشن', query: 'أريد فانتازي دوري روشن السعودي: اعرض نصائح الجولة القادمة واللاعبين المقترحين مع رابط اللعبة الرسمي.' },
                    { title: 'فانتازي البريميرليغ', query: 'أريد فانتازي الدوري الإنجليزي الممتاز: اعرض نصائح الجولة القادمة واللاعبين المقترحين مع رابط اللعبة الرسمي.' },
                  ].map(choice => (
                    <button key={choice.title} type="button" onClick={() => { setShowFantasyChoices(false); void sendMessage(choice.query); }} className={`rounded-xl border border-emerald-400/40 px-3 py-4 text-center text-xs font-bold transition hover:border-emerald-400 sm:text-sm ${isDarkMode ? 'bg-emerald-950/50 hover:bg-emerald-800/70' : 'bg-emerald-50 hover:bg-emerald-100'}`}>
                      {choice.title}
                    </button>
                  ))}
                </div>
              </section>
            )}
            {showInstallHelp && (
              <section className={`mb-4 rounded-xl border border-emerald-500/30 p-3 text-sm leading-7 ${isDarkMode ? 'bg-emerald-950/60 backdrop-blur-xl text-white' : 'bg-white text-gray-900'}`}>
                <p>آيفون: من سفاري اضغط مشاركة، ثم إضافة إلى الشاشة الرئيسية.</p>
                <p>أندرويد: من قائمة المتصفح اختر تثبيت التطبيق أو إضافة إلى الشاشة الرئيسية.</p>
                <button type="button" onClick={() => setShowInstallHelp(false)} className="underline">إغلاق</button>
              </section>
            )}

            {/* بطاقات أسئلة الاستكشاف التفاعلية */}
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 w-full">
              {suggestionCards.map((card, index) => (
                <button
                  type="button"
                  key={`${discoveryPage}-${index}`}
                  disabled={loading}
                  onClick={() => { void sendMessage(card.question); }}
                  aria-label={`${card.tag}: ${card.question}`}
                  className={`flex flex-col justify-between text-right p-3 sm:p-4 rounded-2xl border backdrop-blur-[6px] min-h-[112px] sm:min-h-[126px] transition-all duration-500 cursor-pointer hover:border-emerald-400/60 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 disabled:cursor-wait disabled:opacity-60 ${
                    isDarkMode
                      ? 'bg-emerald-950/45 backdrop-blur-xl border-emerald-500/40 text-white shadow-md'
                      : 'bg-white/35 border-white/55 text-gray-950 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-lg sm:text-xl leading-none">
                      <AppIcon name={card.icon} size={22}/>
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
                </button>
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
                    ? 'bg-emerald-900/45 backdrop-blur-xl border-emerald-400 text-white hover:bg-emerald-950/60'
                    : 'bg-white/65 border-emerald-700/20 text-emerald-800 hover:bg-emerald-950/50 backdrop-blur-xl'
                }`}
              >
                <AppIcon name="refresh" size={16}/>
                <span>استكشف المزيد</span>
              </button>
            </div>
          </div>
        ) : (
          <div className={`w-full flex-1 rounded-2xl border backdrop-blur-xl p-3 sm:p-5 ${isDarkMode ? "border-emerald-500/20 bg-emerald-950/50" : "border-emerald-800/20 bg-[#176343] text-white"}`}>
            <p className={`mb-4 text-center text-xs ${isDarkMode ? "text-emerald-300" : "text-white"}`}>الشاشة الثانية • اسحب يمينًا للعودة للرئيسية</p>
            <AnalyticsDashboard />
          </div>
        )) : (
          <div className="space-y-6 pb-4">
            {messages.map((msg, index) =>
              msg.content.trim() || (msg.imageUrls?.length ?? 0) > 0 ? (
                <div key={index} className="flex items-start gap-4 w-full">
                  <div className="flex-shrink-0 mt-1" aria-hidden="true">
                    {msg.role === 'assistant' ? (
                      <OriginalBrandLogo size="sm" />
                    ) : (
                      <div className={`w-8 h-8 rounded-full border flex items-center justify-center ${
                        isDarkMode
                          ? 'bg-[#343638] border-white/15 text-gray-100'
                          : 'bg-gray-200 border-gray-300 text-gray-700'
                      }`}>
                        <AppIcon name="user" size={17} />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col w-full min-w-0">
                    {msg.role === 'user' ? (
                      <div
                        dir={detectLanguage(msg.content) === 'en' ? 'ltr' : 'rtl'}
                        className={`w-full rounded-3xl border p-4 sm:p-5 text-sm sm:text-[15px] font-normal leading-relaxed break-words ${
                          isDarkMode
                            ? 'bg-emerald-950/50 backdrop-blur-xl border-emerald-300/20 text-white'
                            : 'bg-white border-emerald-500/70 text-black shadow-sm'
                        }`}
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
                                    ? 'bg-emerald-950/50 backdrop-blur-xl border-emerald-300/20 text-white'
                                    : 'bg-gray-100 border-gray-200 text-gray-700'
                                }`}
                              >
                                <AppIcon name="clock" size={14} className="text-emerald-500"/>
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
                          className={`backdrop-blur-xl border rounded-3xl p-4 sm:p-5 shadow-sm text-sm sm:text-[15px] leading-relaxed break-words ${!isDarkMode ? 'aifball-day-reply ' : ''}${
                            isDarkMode
                              ? 'bg-emerald-950/50 backdrop-blur-xl border-emerald-300/20 text-white'
                              : 'bg-white border-emerald-500/70 text-black shadow-sm'
                          }`}
                        >
                          {renderFormattedText(
                            msg.content,
                            isDarkMode,
                            sendMessage,
                            msg.userQuery,
                            loading && index === messages.length - 1
                          )}
                        </div>

                        {!loading && index === messages.length - 1 && msg.content.trim() && (
                          <section dir="rtl" aria-label="أسئلة مقترحة" className="mt-3">
                            <p className="mb-2 text-sm font-bold text-emerald-500">أسئلة مقترحة</p>
                            <div className="flex flex-wrap gap-2">
                              {((msg.content.includes('<aifball-player') || /اللاعب|مسير|راتب|عقد|قيمة سوقية|player|career/i.test(msg.userQuery ?? '')) ? [
                                'ما أرقام هذا اللاعب في الموسم الحالي؟',
                                'ما أبرز بطولاته ومحطات مسيرته؟',
                                'متى ينتهي عقده وكم راتبه وقيمته السوقية؟',
                               ] : /مبار|إحصا|احصا|نتائج|تشكيل|match|stats/i.test(msg.userQuery ?? '') ? [
                                'أعطني ملخص المباريات المذكورة في الرد.',
                                'ما المباريات القادمة للفرق المذكورة؟',
                                'من أبرز لاعب في المباراة؟ اعرض أداءه بالأرقام.',
                                'ما آخر تغريدة من الحساب الرسمي للنادي عن المباراة؟',
                              ] : /نادي|فريق|club|team/i.test(msg.userQuery ?? '') ? [
                                'ما مباريات الفريق القادمة؟',
                                'لخّص آخر مباراة للفريق.',
                                'ما آخر تغريدة في حساب النادي الرسمي؟',
                              ] : [
                                'ما أهم التفاصيل الإضافية عن هذا الموضوع؟',
                                'هل فيه أرقام أو أمثلة موثقة توضح الإجابة؟',
                              ]).map(question => (
                                <button key={question} type="button" onClick={() => void sendMessage(question)}
                                  className="rounded-full border border-emerald-500/40 px-3 py-1.5 text-sm hover:border-emerald-500">
                                  {question}
                                </button>
                              ))}
                            </div>
                          </section>
                        )}

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
                            aria-label="نسخ النص" title="نسخ النص"
                          >
                            <AppIcon name="copy"/>
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
                            aria-label="مشاركة" title="مشاركة"
                          >
                            <AppIcon name="share"/>
                          </button>

                          <ReadAloudButton content={msg.content}/>
                          <details className="relative"><summary aria-label="خيارات الرد الأخرى" title="خيارات الرد الأخرى" className="list-none cursor-pointer p-2 rounded-lg text-gray-400 hover:bg-emerald-500/10 [&::-webkit-details-marker]:hidden"><AppIcon name="more"/></summary><div className={`absolute z-30 bottom-full mb-2 start-0 rounded-xl border shadow-lg p-2 whitespace-nowrap ${isDarkMode?'bg-emerald-950/60 backdrop-blur-xl border-emerald-600/40':'bg-white border-gray-200'}`}>
                          <button
                            type="button"
                            onClick={() => {
                              const query = msg.userQuery;
                              if (query) sendMessage(query);
                            }}
                            disabled={loading}
                            className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-gray-400 disabled:opacity-40"
                            aria-label="إعادة التوليد" title="إعادة التوليد"
                          >
                            <AppIcon name="refresh"/><span className="text-xs ms-2">إعادة التوليد</span>
                          </button></div></details>

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
                            aria-pressed={msg.feedback === 'like'} aria-label="إعجاب" title="إعجاب"
                          >
                            <AppIcon name="like"/>
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
                            aria-pressed={msg.feedback === 'dislike'} aria-label="عدم إعجاب" title="عدم إعجاب"
                          >
                            <AppIcon name="dislike"/>
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
                <div className="flex-shrink-0 mt-1 block">
                  <OriginalBrandLogo size="sm" />
                </div>

                <div
                  className={`rounded-2xl px-4 py-3 border shadow-sm ${
                    isDarkMode
                      ? 'bg-emerald-950/50 backdrop-blur-xl border-emerald-300/20 text-white'
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
                      {loadingSeconds < 8 ? 'جاري بدء البحث' : loadingSeconds < 25 ? 'جاري جمع البيانات والتحقق من المصادر' : 'جاري تجهيز الإجابة'}... ({formatSeconds(loadingSeconds)})
                    </span>
                  </div>

                  <p className="text-[11px] text-gray-500 mt-2">
                    جاري انتظار البيانات من خادم فوتبلاي
                  </p>
                </div>
              </div>
            )}

            {chatNotice && <div role="status" className="mx-auto my-2 max-w-xl rounded-lg border border-amber-500/30 px-3 py-2 text-xs text-amber-400">{chatNotice}</div>}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      {/* شريط المحادثة السفلي */}
      <footer
        className={`p-3 backdrop-blur-md border-t relative z-20 ${
          isDarkMode
            ? 'bg-[#131314]/90 border-white/10'
            : 'bg-white border-emerald-200'
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
                    <AppIcon name="close" size={18}/>
                  </button>
                </div>
              ))}
            </div>
          )}

          <div
            className={`flex items-end gap-1.5 sm:gap-2 border rounded-[24px] px-2.5 sm:px-3 py-2 shadow-lg transition-colors ${
              isDarkMode
                ? 'bg-emerald-950/60 backdrop-blur-xl border-emerald-500 focus-within:border-emerald-300'
                : 'bg-white border-emerald-500/70 focus-within:border-emerald-600'
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
              className={`w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-full flex items-center justify-center font-bold text-xl ${isDarkMode ? 'text-emerald-200 hover:text-white' : 'text-emerald-800 hover:text-emerald-600'}`}
            >
              +
            </button>

            <button
              type="button"
              onClick={handleVoiceSearch}
              title="بحث صوتي"
              className={`w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-full flex items-center justify-center ${
                isListening
                  ? 'bg-emerald-600 text-white animate-pulse'
                  : (isDarkMode ? 'text-emerald-200 hover:text-white' : 'text-emerald-800 hover:text-emerald-600')
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

            <textarea
              rows={1}
              value={input}
              onChange={(event) => {
                setInput(event.target.value);
                event.currentTarget.style.height = 'auto';
                event.currentTarget.style.height = Math.min(event.currentTarget.scrollHeight, 104) + 'px';
              }}
              onKeyDown={(event) => {
                // Enter inserts a newline on iPhone, Android and desktop.
                // Sending is intentionally restricted to the visible send button.
                if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
                  event.stopPropagation();
                }
              }}
              aria-label="اكتب رسالتك"
              enterKeyHint="enter"
              placeholder={
                isListening
                  ? 'جاري الاستماع لصوتك...'
                  : 'اسأل عن أي مباراة، تحليل، أو إحصائية...'
              }
              className={`flex-1 min-w-0 max-h-[104px] resize-none overflow-y-auto bg-transparent px-2 sm:px-3 py-2 text-sm leading-6 focus:outline-none ${
                isDarkMode
                  ? 'text-white placeholder-gray-500'
                  : 'text-gray-900 placeholder-gray-400'
              }`}
            />

            <button
              type="button"
              onClick={() => sendMessage()}
              disabled={loading || (!input.trim() && !attachedFiles.length)}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#1D6B35] hover:bg-emerald-600 disabled:bg-emerald-950/30 disabled:text-emerald-700 flex items-center justify-center text-white flex-shrink-0"
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
            className={`w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl ${isDarkMode ? 'bg-emerald-950/60 backdrop-blur-xl border border-emerald-600/40' : 'bg-white border border-gray-200'}`}>
            <div className={`sticky top-0 z-30 flex justify-between items-center p-4 border-b ${isDarkMode ? 'bg-emerald-950/60 backdrop-blur-xl border-emerald-600/40' : 'bg-white border-gray-200'}`}>
              <h2 className="font-bold">جداول الترتيب العالمية</h2>
              <button type="button" aria-label="إغلاق جداول الترتيب" onClick={() => setShowStandings(false)} className="w-8 h-8 rounded-full"><AppIcon name="close" size={18}/></button>
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
                ? 'bg-emerald-950/60 backdrop-blur-xl border border-emerald-600/40'
                : 'bg-white border border-gray-200'
            }`}
          >
            <div
              className={`sticky top-0 z-10 flex items-center justify-between p-4 border-b ${
                isDarkMode
                  ? 'bg-emerald-950/60 backdrop-blur-xl border-emerald-600/40'
                  : 'bg-white border-gray-200'
              }`}
            >
              <h2 className="font-bold text-lg">
                <AppIcon name="pitch"/> مركز النتائج المباشرة
              </h2>

              <button
                type="button"
                onClick={() => setShowLiveScores(false)}
                className="w-8 h-8 rounded-full hover:bg-white/10"
                aria-label="إغلاق النتائج"
              >
                <AppIcon name="close" size={18}/>
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


