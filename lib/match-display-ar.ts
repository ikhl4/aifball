import { footballNameInArabic } from './football-names-ar';

const names: Record<string, string> = {
  'zion suzuki': 'زيون سوزوكي', 'koki machida': 'كوكي ماتشيدا', 'ayumu seko': 'أيومو سيكو',
  'hiroki ito': 'هيروكي إيتو', 'shuto nakano': 'شوتو ناكانو', 'daichi kamada': 'دايتشي كامادا',
  'ao tanaka': 'آو تاناكا', 'takefusa kubo': 'تاكيفوسا كوبو', 'daizen maeda': 'دايزن مايدا',
  'keito nakamura': 'كيتو ناكامورا', 'ritsu doan': 'ريتسو دوان', 'koki ogawa': 'كوكي أوغاوا',
  'tsuyoshi watanabe': 'تسويوشي واتانابي', 'kodai sano': 'كوداي سانو', 'yuki soma': 'يوكي سوما',
  'yukinari sugawara': 'يوكيناري سوغاوارا', 'junya ito': 'جونيا إيتو', 'takumi minamino': 'تاكومي مينامينو',
  'kaishu sano': 'كايشو سانو', 'tatsuhiro sakamoto': 'تاتسوهيرو ساكاموتو', 'kou itakura': 'كو إيتاكورا',
  'junnosuke suzuki': 'جونّوسوكي سوزوكي', 'yuito suzuki': 'يويتو سوزوكي', 'leo brian kokubo': 'ليو برايان كوكوبو',
  'tomoki hayakawa': 'توموكي هاياكاوا', 'keisuke goto': 'كيسوكي غوتو',
  'vinicius junior': 'فينيسيوس جونيور', 'bruno guimaraes': 'برونو غيمارايش', raphinha: 'رافينيا',
  'gabriel magalhaes': 'غابرييل ماغالايش', 'pedro luccas': 'بيدرو لوكاس', 'pedro morisco': 'بيدرو موريسكو',
  'jair cunha': 'جاير كونيا', 'carlos augusto': 'كارلوس أوغوستو', wesley: 'ويسلي', 'andrey santos': 'أندري سانتوس',
  andre: 'أندريه', estevao: 'إستيفاو', bento: 'بينتو', 'allan elias': 'آلان إلياس',
  'alisson santana': 'أليسون سانتانا', rayan: 'رايان', 'joao gomes': 'جواو غوميش',
  'gabriel bontempo': 'غابرييل بونتيمبو', 'marlon gomes': 'مارلون غوميش', 'douglas santos': 'دوغلاس سانتوس',
  endrick: 'إندريك', vanderson: 'فانديرسون', 'vitor reis': 'فيتور ريس', 'jonathan jesus': 'جوناثان جيسوس',
  'lucas perri': 'لوكاس بيري', 'arthur dias': 'آرثر دياس',
  'pierre-emile hojbjerg': 'بيير هويبيرغ', 'rasmus hojlund': 'راسموس هويلوند',
  'bruno fernandes': 'برونو فيرنانديز', 'bernardo silva': 'بيرناردو سيلفا',
  'singapore national stadium': 'ملعب سنغافورة الوطني',
  'estadio municipal de braga': 'ملعب بلدية براغا',
  'international friendly': 'مباراة دولية ودية',
  'international friendly games': 'مباريات دولية ودية',
};
const latin: Record<string,string> = {
  sch:'ش', sh:'ش', ch:'تش', th:'ث', ph:'ف', kh:'خ', gh:'غ', zh:'ج', ck:'ك', qu:'ك',
  ai:'اي', ay:'اي', ee:'ي', oo:'و', ou:'و', ei:'ي', ng:'نغ', nh:'ني', lh:'لي',
  a:'ا', b:'ب', c:'ك', d:'د', e:'ي', f:'ف', g:'غ', h:'ه', i:'ي', j:'ج', k:'ك', l:'ل',
  m:'م', n:'ن', o:'و', p:'ب', q:'ق', r:'ر', s:'س', t:'ت', u:'و', v:'ف', w:'و', x:'كس', y:'ي', z:'ز',
};
const key = (value: string) => value.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '')
  .replace(/ø/g, 'o').replace(/ł/g, 'l').replace(/đ/g, 'd').replace(/ß/g, 'ss').replace(/ı/g, 'i');

export function matchNameInArabic(value: string): string {
  if (!value) return value;
  const text = key(value);
  return footballNameInArabic(value) || names[text] || text.replace(/[a-z]+/g, word =>
    word.replace(/sch|sh|ch|th|ph|kh|gh|zh|ck|qu|ai|ay|ee|oo|ou|ei|ng|nh|lh|[a-z]/g, part => latin[part]));
}

export function matchNumberInArabic(value: string | number | null | undefined): string {
  return value == null ? '—' : String(value).replace(/\d/g, digit => '٠١٢٣٤٥٦٧٨٩'[Number(digit)])
    .replace(/(\p{Nd})\.(?=\p{Nd})/gu, '$1٫').replace(/%/g, '٪');
}

export function matchDateInArabic(value: string | null | undefined, time = false): string {
  if (!value || !Number.isFinite(Date.parse(value))) return 'التاريخ غير متاح';
  return new Intl.DateTimeFormat('ar-SA-u-ca-gregory', {
    timeZone: 'Asia/Riyadh', dateStyle: 'medium', ...(time ? { timeStyle: 'short' } : {}),
  }).format(new Date(value));
}
