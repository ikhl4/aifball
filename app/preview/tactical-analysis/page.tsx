import { notFound } from 'next/navigation';
import AnalysisStory from '../../components/AnalysisStory';
import { validateAnalysisStory } from '../../../lib/analysis-story';
import example from '../../../tests/fixtures/analysis-motion.json';
export const dynamic = 'force-dynamic';
export default function TacticalAnalysisPreview() {
  if (process.env.VERCEL_ENV === 'production') notFound();
  const data = validateAnalysisStory(example);
  if (!data) notFound();
  return <main dir="rtl" className="min-h-screen bg-[#101815] text-gray-100 px-4 py-8">
    <div className="max-w-3xl mx-auto">
      <nav className="flex justify-between items-center mb-6 text-sm"><strong className="text-emerald-400">فوتبلاي</strong><a href="/" className="text-emerald-400 underline">العودة للمحادثة</a></nav>
      <p className="text-xs leading-7 mb-5 text-gray-400">معاينة تعليمية لأسلوب عرض التحليل داخل الرد. هذا المثال عام ولا ينسب لفريق أو مدرب حقيقي.</p>
      <div className="rounded-3xl border border-emerald-900/50 p-4 sm:p-6 bg-[#131e18]"><AnalysisStory data={data}/></div>
    </div>
  </main>;
}
