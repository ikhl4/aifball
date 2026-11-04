import Link from 'next/link';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
export const metadata = { title: 'مركز التحليلات | فوتبلاي', description: 'لوحة تحليلات كرة القدم مع بيانات مباريات موثقة من ESPN.' };
export default function AnalyticsPage() {
  return <main dir="rtl" className="min-h-screen bg-[#071711] text-white font-cairo">
    <div className="mx-auto max-w-6xl px-3 py-7 sm:px-6">
      <header className="flex justify-between items-center gap-3 mb-8">
        <Link href="/" className="rounded-xl px-4 py-2 border border-emerald-500/30 text-sm hover:bg-emerald-950">← الرئيسية</Link>
        <span className="text-emerald-400 font-black">AiFBall • من الرياض للعالم</span>
      </header>
      <AnalyticsDashboard />
    </div>
  </main>;
}
