import type { PlayerData } from './player-profile-data';

/** Transport failure is not evidence of an unknown or ambiguous identity. */
export function playerProfileStatus(complete: boolean, status?: PlayerData['status']) {
  if (!complete) return 'جاري التحقق من هوية اللاعب وبياناته…';
  if (!status || status === 'unavailable') return 'تعذر الاتصال بمصدر بيانات اللاعب مؤقتًا؛ يمكنك إعادة جلب البطاقة.';
  if (status === 'ambiguous') return 'الاسم يطابق أكثر من لاعب؛ حدّد الاسم الكامل والنادي لتأكيد الهوية.';
  if (status === 'not_found') return 'لم يُعثر على اسم مطابق في المصدر؛ جرّب الاسم الكامل بالعربية أو الإنجليزية.';
  return 'لم تصل أرقام موثقة لهذا الموسم. لن نعرض موسمًا آخر أو نستبدل القيم الغائبة بصفر.';
}
