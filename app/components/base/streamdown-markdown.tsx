'use client'
import { Streamdown } from 'streamdown'
import 'katex/dist/katex.min.css'
import rehypeRaw from 'rehype-raw' // 🌟 إضافة ضرورية لقراءة وسومنا

// 🌟 استيراد المكونات الخاصة بك (تأكد من تعديل مسارات الاستيراد حسب مجلداتك الفعلية)
import MatchSummary from '../MatchSummary' 
// import MatchReport from '../MatchReport'
// import Standings from '../Standings'
// import ShotMap from '../ShotMap'
// import PlayerComparison from '../PlayerComparison'
// import PlayerProfile from '../PlayerProfile'

interface StreamdownMarkdownProps {
  content: string
  className?: string
}

export function StreamdownMarkdown({ content, className = '' }: StreamdownMarkdownProps) {
  
  // 🌟 دالة لحماية الوسوم من الانكسار أثناء الـ Streaming
  // تقوم بإخفاء الوسم إذا كان لم يكتمل بعد لمنع ظهور الكود الخام للمستخدم
  const cleanStreamingContent = (text: string) => {
    const lastOpenTag = text.lastIndexOf('<aifball-');
    if (lastOpenTag !== -1) {
      const lastCloseTag = text.lastIndexOf('</aifball-');
      // إذا وجدنا بداية وسم ولم نجد نهايته، نقوم بإخفاء الجزء غير المكتمل
      if (lastCloseTag < lastOpenTag) {
        return text.substring(0, lastOpenTag);
      }
    }
    return text;
  };

  // 🌟 خريطة ربط وسوم Dify بمكونات React
  const components: any = {
    'aifball-summary': ({ node, ...props }: any) => <MatchSummary match={props.match} />,
    // 'aifball-match-report': ({ node, ...props }: any) => <MatchReport match={props.match} match_url={props.match_url} />,
    // 'aifball-standings': ({ node, ...props }: any) => <Standings league={props.league} season={props.season} />,
    // 'aifball-shotmap': ({ node, ...props }: any) => <ShotMap match={props.match} match_url={props.match_url} />,
    // 'aifball-compare': ({ node, ...props }: any) => <PlayerComparison player1={props.player1} player2={props.player2} />,
    // 'aifball-player': ({ node, ...props }: any) => <PlayerProfile name={props.name} />,
  };

  return (
    <div className={`streamdown-markdown ${className}`}>
      <Streamdown 
        rehypePlugins={[rehypeRaw]} 
        components={components}
      >
        {cleanStreamingContent(content)}
      </Streamdown>
    </div>
  )
}

export default StreamdownMarkdown
