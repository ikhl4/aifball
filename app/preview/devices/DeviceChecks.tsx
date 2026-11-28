'use client';
import { useState } from 'react';
export default function DeviceChecks() {
  const [width, setWidth] = useState(390), [path, setPath] = useState('/');
  return <main dir="rtl" className="min-h-screen bg-gray-100 p-4 text-gray-900">
    <h1 className="text-xl font-bold">فحص عرض فوتبلاي</h1>
    <p className="my-2 text-sm">هذه مقاسات عرض داخل المتصفح الحالي؛ لا تثبت توافق Safari أو جهاز آيفون فعلي.</p>
    <div className="my-3 flex flex-wrap gap-2" role="group" aria-label="مقاس الشاشة">
      {[375, 390, 430, 768].map(value => <button key={value} aria-pressed={width === value} className="rounded border bg-white p-2" onClick={() => setWidth(value)}>{value} بكسل</button>)}
    </div>
    <div className="my-3 flex gap-2" role="group" aria-label="صفحة الاختبار">
      {[['/', 'الشات'], ['/academy', 'الأكاديمية'], ['/analytics', 'الإحصائيات']].map(([value, label]) => <button key={value} aria-pressed={path === value} className="rounded border bg-white p-2" onClick={() => setPath(value)}>{label}</button>)}
    </div>
    <div className="max-w-full overflow-x-auto">
      <iframe title="معاينة فوتبلاي على الجوال" src={path} style={{ width, height: 844 }} className="mx-auto block shrink-0 rounded-xl border border-gray-400 bg-white" />
    </div>
  </main>;
}
