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
      <ReactMarkdown '') 'text' ( (!inline) (الأكواد) (مثل ...props // 1. : <div ? RehypeKatex, RemarkBreaks]} RemarkGfm, ]} children, className="my-4 rounded-xl overflow-hidden bg-[#131415] border border-gray-800 shadow-lg w-full" className, code({ components="{{" const dir="rtl" if inline, language="match" match="/language-(\w+)/.exec(className" match[1] node, rehypePlugins="{[" remarkPlugins="{[RemarkMath," return { || }) إذا الأسطر التكتيكية التكتيكية) الخرائط الرسمة النصية كان كسبورة كود لتظهر متعدد مدرب معالجة>
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
            // إذا كان نص كود قصير وسط الكلام
            return (
              <code {...props} className="bg-gray-800 text-emerald-300 px-1.5 py-0.5 rounded text-sm font-mono mx-1">
                {children}
              </code>
            )
          },
          
          // 2. تحسين عرض الصور
          img({ node, ...props }) {
            return (
              <img 
                {...props} 
                className="w-full max-h-[500px] object-contain rounded-xl my-4 shadow-md"
                loading="lazy"
              />
            )
          },
          
          // 3. اصطياد الروابط القادمة من Dify وتحويلها إلى داشبورد بصري بدلاً من زر
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

            // للروابط العادية
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
