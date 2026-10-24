import ReactMarkdown from 'react-markdown'
import 'katex/dist/katex.min.css'
import RemarkMath from 'remark-math'
import RemarkBreaks from 'remark-breaks'
import RehypeKatex from 'rehype-katex'
import RemarkGfm from 'remark-gfm'
import SyntaxHighlighter from 'react-syntax-highlighter'
import { atelierHeathLight } from 'react-syntax-highlighter/dist/esm/styles/hljs'

export function Markdown(props: { content: string }) {
  return (
    <div className="markdown-body">
      <ReactMarkdown
        remarkPlugins={[RemarkMath, RemarkGfm, RemarkBreaks]}
        rehypePlugins={[
          RehypeKatex,
        ]}
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '')
            return (!inline && match)
              ? (
                <SyntaxHighlighter
                  {...props}
                  children={String(children).replace(/\n$/, '')}
                  style={atelierHeathLight}
                  language={match[1]}
                  showLineNumbers
                  PreTag="div"
                />
              )
              : (
                <code {...props} className={className}>
                  {children}
                </code>
              )
          },
          // 1. تحسين عرض الصور المباشرة لتظهر بشكل أنيق ومناسب للمنصة الرياضية
          img({ node, ...props }) {
            return (
              <img 
                {...props} 
                className="w-full max-h-[500px] object-contain rounded-xl my-4 shadow-md"
                loading="lazy"
              />
            )
          },
          // 2. اصطياد الروابط القادمة من Dify وتحويلها إلى داشبورد بصري بدلاً من زر
          a({ node, href, children, ...props }) {
            const isVisualAsset = href && (
              href.includes('upload.dify.ai') || 
              href.includes('dify.ai/files') ||
              href.includes('/files/tools/') ||
              /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(href)
            );

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

            // للروابط العادية (مثل يوتيوب أو مواقع أخرى) تظل كما هي
            return (
              <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
                {children}
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
