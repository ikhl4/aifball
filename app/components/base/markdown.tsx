import ReactMarkdown from 'react-markdown'
import 'katex/dist/katex.min.css'
import RemarkMath from 'remark-math'
import RemarkBreaks from 'remark-breaks'
import RehypeKatex from 'rehype-katex'
import RehypeRaw from 'rehype-raw' // 🌟 إضافة جديدة
import RemarkGfm from 'remark-gfm'
import SyntaxHighlighter from 'react-syntax-highlighter'
import { atelierHeathLight } from 'react-syntax-highlighter/dist/esm/styles/hljs'

// 🌟 استيراد المكونات الخاصة بك (تأكد من صحة المسارات)
import MatchSummary from '../MatchSummary' 
// import MatchReport from '../MatchReport'
// import Standings from '../Standings'
// import ShotMap from '../ShotMap'
// import PlayerComparison from '../PlayerComparison'
// import PlayerProfile from '../PlayerProfile'

export function Markdown(props: { content: string }) {
  return (
    <div className="markdown-body">
      <ReactMarkdown
        remarkPlugins={[RemarkMath, RemarkGfm, RemarkBreaks]}
        rehypePlugins={[
          RehypeKatex,
          RehypeRaw, // 🌟 ضروري جداً لتفعيل قراءة وسومنا المخصصة
        ]}
        components={{
          // 🌟 إضافة الوسوم المخصصة هنا
          'aifball-summary': ({ node, ...props }: any) => <MatchSummary match={props.match} />,
          // 'aifball-match-report': ({ node, ...props }: any) => <MatchReport match={props.match} match_url={props.match_url} />,
          // 'aifball-standings': ({ node, ...props }: any) => <Standings league={props.league} season={props.season} />,
          
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '')
            if (!inline && match) {
              return (
                <SyntaxHighlighter
                  {...props}
                  children={String(children).replace(/\n$/, '')}
                  style={atelierHeathLight}
                  language={match[1]}
                  showLineNumbers
                  PreTag="div"
                />
              )
            }
            
            // تصميم الخرائط النصية
            if (!inline) {
              return (
                <div className="my-4 rounded-xl overflow-hidden bg-[#131415] border border-gray-800 shadow-lg w-full">
                  <div className="px-4 py-2 bg-[#1A1C1E] border-b border-gray-800 flex justify-between items-center">
                    <span className="text-xs font-bold text-emerald-500">📋 رسم تكتيكي / بيانات</span>
                  </div>
                  <div className="p-4 overflow-x-auto custom-scrollbar w-full" dir="rtl">
                    <pre className="text-gray-300 font-mono text-[13px] leading-relaxed whitespace-pre min-w-max">
                      <code {...props} className={className}>
                        {String(children).replace(/\n$/, '')}
                      </code>
                    </pre>
                  </div>
                </div>
              )
            }

            return (
              <code {...props} className="bg-gray-800 text-emerald-300 px-1.5 py-0.5 rounded text-sm font-mono mx-1">
                {children}
              </code>
            )
          },
          
          img({ node, ...props }: any) {
            return (
              <img 
                {...props} 
                className="w-full max-h-[500px] object-contain rounded-xl my-4 shadow-md"
                loading="lazy"
              />
            )
          },
          
          a({ node, href, children, ...props }: any) {
            if (!href) return null;

            // 1. هل الرابط يوتيوب؟ (عرض المقطع مباشرة داخل المحادثة)
            const ytMatch = href.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
            
            if (ytMatch && ytMatch[1]) {
              const vidId = ytMatch[1];
              return (
                <div className="my-5 rounded-2xl overflow-hidden border border-emerald-500/30 bg-[#131314] shadow-xl w-full">
                  <div className="flex items-center justify-between px-4 py-2.5 bg-[#1D6B35]/20 border-b border-gray-800/80">
                    <span className="text-xs sm:text-sm font-bold text-emerald-400">🎥 مشاهدة الملخص المباشر</span>
                    <a href={href} target="_blank" rel="noopener noreferrer" className="text-[11px] text-gray-300 hover:text-white underline transition">
                      فتح في تطبيق يوتيوب ↗
                    </a>
                  </div>
                  <div className="relative w-full aspect-video">
                    <iframe 
                      src={`https://www.youtube.com/embed/${vidId}`} 
                      title="YouTube video player" 
                      className="w-full h-full border-0" 
                      allowFullScreen 
                    />
                  </div>
                </div>
              );
            }

            // 2. هل الرابط صورة أو لوحة تكتيكية؟ (عرض الصور مفرودة)
            const isVisualAsset = href.includes('upload.dify.ai') || 
                                  href.includes('dify.ai/files') ||
                                  href.includes('/files/tools/') ||
                                  /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(href);

            if (isVisualAsset) {
              return (
                <div className="my-4 rounded-xl overflow-hidden border border-gray-200 shadow-md bg-[#f8f9fa] dark:bg-[#131415] dark:border-gray-800">
                  <div className="bg-gray-100 dark:bg-emerald-900/20 px-3 py-2 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                     <span className="text-xs font-bold text-gray-700 dark:text-emerald-400">📊 اللوحة التكتيكية</span>
                     <a href={href} target="_blank" rel="noopener noreferrer" className="text-[10px] text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white underline">تكبير ↗</a>
                  </div>
                  <div className="p-2 flex justify-center">
                    <img src={href} alt={String(children)} className="w-full object-contain max-h-[500px] rounded-lg" />
                  </div>
                </div>
              );
            }

            // 3. للروابط العادية (مواقع إحصائيات خارجية مثلاً)
            return (
              <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline inline-flex items-center gap-1" {...props}>
                🔗 {children}
              </a>
            )
          }
        }}
        linkTarget={'_blank'}
      >
        {props.content}
      </ReactMarkdown>
    </div>
  )
}
