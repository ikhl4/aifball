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
import ChatImageCard from '../ChatImageCard'
import ChatVideoCard from '../ChatVideoCard'
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
            return typeof props.src === 'string' ? (
              <ChatImageCard url={props.src} alt={props.alt || 'صورة'} />
            ) : null
          },
          
          a({ node, href, children, ...props }: any) {
            if (!href) return null;

            // 1. هل الرابط يوتيوب؟ (عرض المقطع مباشرة داخل المحادثة)
            const ytMatch = href.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
            
            if (ytMatch && ytMatch[1]) {
              return <ChatVideoCard url={href} title={String(children || 'ملخص المباراة')} />;
            }

            // 2. هل الرابط صورة أو لوحة تكتيكية؟ (عرض الصور مفرودة)
            const isVisualAsset = href.includes('upload.dify.ai') || 
                                  href.includes('dify.ai/files') ||
                                  href.includes('/files/tools/') ||
                                  /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(href);

            if (isVisualAsset) {
              return <ChatImageCard url={href} alt={String(children || 'صورة')} />;
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
