import {notFound} from 'next/navigation';
import MatchReport from '../../components/MatchReport';
export const dynamic='force-dynamic';
export default function Preview(){if(process.env.VERCEL_ENV==='production')notFound();return <main dir="rtl" className="min-h-screen bg-[#07110e] p-4 text-white"><div className="max-w-4xl mx-auto"><p className="text-xs text-emerald-500 p-4">فوتبلاي · معاينة تقرير متصل بالمصدر · ليست بيانات تجريبية</p><MatchReport matchName="ريال مدريد وبرشلونة · مراجعة التقرير" eventId="748236" leagueCode="esp.1"/></div></main>;}
