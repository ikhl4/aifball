export type LessonId = 'build-up' | 'counterpress' | 'rondo';
export type BoardPlayer = { id: string; number: string; side: 'team' | 'opponent'; x: number; y: number; role: string };
export type BoardArrow = { from: string; to: string; kind: 'pass' | 'run' };
export type LessonFrame = { title: string; instruction: string; players: BoardPlayer[]; ball: [number, number]; arrows: BoardArrow[] };
export type TacticalLessonData = {
  id: LessonId; title: string; query: string; aliases: string[]; intro: string; objective: string;
  frames: LessonFrame[]; coaching: string[];
  drill: { players: string; area: string; duration: string; equipment: string; rules: string[]; easier: string; harder: string; observe: string };
  reference: { title: string; url: string };
};
const player = (id: string, number: string, side: BoardPlayer['side'], x: number, y: number, role: string): BoardPlayer => ({id, number, side, x, y, role});
const move = (players: BoardPlayer[], positions: Record<string, [number, number]>) => players.map(p => positions[p.id] ? {...p, x:positions[p.id][0], y:positions[p.id][1]} : {...p});
const build = [player('g','1','team',12,34,'حارس'),player('a','4','team',28,18,'قلب دفاع'),player('b','5','team',28,50,'قلب دفاع'),player('c','6','team',46,34,'محور'),player('d','2','team',48,9,'دعم طرفي'),player('e','9','team',75,34,'هدف التقدم'),player('x','9','opponent',36,24,'ضاغط'),player('y','10','opponent',37,46,'ضاغط'),player('z','8','opponent',57,34,'تغطية')];
const press = [player('a','6','team',46,30,'أقرب لاعب'),player('b','8','team',58,20,'إغلاق التمرير'),player('c','4','team',32,36,'حماية العمق'),player('d','7','team',60,48,'تضييق المساحة'),player('x','10','opponent',54,32,'حامل الكرة'),player('y','9','opponent',70,22,'خيار أمامي'),player('z','8','opponent',65,45,'خيار دعم'),player('w','4','opponent',79,38,'تغطية')];
const rondo = [player('a','1','team',28,20,'مستحوذ'),player('b','2','team',76,20,'دعم'),player('c','3','team',52,52,'دعم متحرك'),player('x','4','opponent',50,31,'مدافع')];

// Authored teaching scenarios, not tracking data or reconstructions of real matches.
export const TACTICAL_LESSONS: Record<LessonId, TacticalLessonData> = {
  'build-up': { id:'build-up', title:'كسر الضغط والبناء من الخلف', query:'اعرض لوحة تكتيكية لكسر الضغط', aliases:['لوحة تكتيكية لكسر الضغط','كسر الضغط','البناء من الخلف','build up','playing through pressure'], intro:'مشهد مبسّط يوضح جذب الضغط، فتح زاوية دعم ثم التقدم. القرار يتغير بحسب تمركز المنافس؛ التمرير الأمامي ليس إلزامياً.', objective:'إيجاد لاعب حر خلف خط الضغط دون فقدان خيار العودة.',
    frames:[
      {title:'1. تهيئة زوايا الاستلام',instruction:'قلبا الدفاع يتباعدان، والمحور يتحرك خارج ظل التغطية.',players:build,ball:[14,34],arrows:[]},
      {title:'2. جذب الضاغط',instruction:'تنتقل الكرة إلى قلب الدفاع، مع بقاء الحارس خياراً آمناً للعودة.',players:move(build,{x:[31,22],c:[43,38]}),ball:[29,18],arrows:[{from:'g',to:'a',kind:'pass'},{from:'c',to:'b',kind:'run'}]},
      {title:'3. توفير الدعم',instruction:'يتحرك المحور قطرياً لفتح خط تمرير. إن أُغلق المسار، استخدم العودة أو الطرف.',players:move(build,{x:[30,20],c:[45,26],z:[56,39]}),ball:[45,26],arrows:[{from:'a',to:'c',kind:'pass'},{from:'c',to:'d',kind:'pass'}]},
      {title:'4. التقدم مع التأمين',instruction:'الاستلام بجسم مفتوح يسمح برؤية اللاعب المتقدم، ويبقى دعم خلف الكرة.',players:move(build,{c:[53,27],d:[62,10],e:[78,30],z:[59,39]}),ball:[78,30],arrows:[{from:'c',to:'e',kind:'pass'}]},
    ], coaching:['افحص خلفك قبل الاستلام.','لا تختبئ خلف اللاعب الضاغط.','احتفظ بخيار آمن إذا أُغلق التقدم.'],
    drill:{players:'6 مستحوذين ضد 3 مدافعين',area:'30 × 24 م، منطقتان',duration:'8 دقائق: 3 جولات × دقيقتين، وراحة دقيقة بين الجولات',equipment:'كرات، أقماع، صديريات',rules:['ابدأ من خط الخلف وحاول إيصال الكرة إلى لاعب الهدف.','عند قطع الكرة، تبدأ محاولة جديدة وتُبدّل الأدوار دورياً.','راقب جودة الزاوية قبل زيادة سرعة اللعب.'],easier:'وسّع المنطقة واسمح بلمسات حرة.',harder:'ضيّق المنطقة أو قلّل اللمسات حسب مستوى المجموعة.',observe:'سجّل المحاولات الناجحة إلى لاعب الهدف وأسباب فقد الكرة.'},
    reference:{title:'FIFA — التقدم بالكرة عبر الضغط',url:'https://www.fifatrainingcentre.com/en/practice/talent-coach-programme/build-and-progress/2-zone-transitional-rondo-prioritising-vertical-play.php'} },
  counterpress:{id:'counterpress',title:'الضغط العكسي بعد فقد الكرة',query:'اعرض لوحة تكتيكية للضغط العكسي',aliases:['لوحة تكتيكية للضغط العكسي','الضغط العكسي','counter pressing','counterpress'],intro:'مثال على رد فعل جماعي عند فقد الكرة: ضغط قريب وتغطية للمسارات وحماية للعمق. إذا تعذر الوصول للكرة، تكون الأولوية لإعادة التنظيم.',objective:'إبطاء خروج المنافس أو استعادة الكرة دون كشف العمق.',
    frames:[
      {title:'1. لحظة الفقد',instruction:'الكرة مع المنافس. حدّد أقرب لاعب وخيارات التمرير التي يراها.',players:press,ball:[55,32],arrows:[]},
      {title:'2. ضغط أقرب لاعب',instruction:'اللاعب 6 يقترب، بينما يتحرك اللاعب 8 لإغلاق خيار التمرير الأمامي.',players:move(press,{a:[51,31],b:[64,23],d:[62,43]}),ball:[55,32],arrows:[{from:'a',to:'x',kind:'run'},{from:'b',to:'y',kind:'run'}]},
      {title:'3. حماية العمق',instruction:'تتقارب المجموعة، ويبقى اللاعب 4 خلف الضغط بدلاً من اندفاع الجميع إلى الكرة.',players:move(press,{a:[52,31],b:[65,23],c:[40,34],d:[63,42]}),ball:[55,32],arrows:[{from:'d',to:'z',kind:'run'}]},
      {title:'4. قرار الاستمرار أو الرجوع',instruction:'إن خرج المنافس من الضغط، استعد الشكل الدفاعي وأغلق العمق. استرجاع الكرة ليس مضموناً.',players:move(press,{a:[44,28],b:[49,20],c:[34,34],d:[48,44],x:[61,34]}),ball:[62,34],arrows:[]},
    ],coaching:['أقرب لاعب يبدأ الضغط والآخرون يؤمّنون خلفه.','لا تطارد الكرة على حساب العمق.','إذا كُسر الضغط، أعد التنظيم.'],
    drill:{players:'4 ضد 4',area:'24 × 20 م، منطقتان',duration:'8 دقائق: 3 جولات × دقيقتين، وراحة دقيقة بين الجولات',equipment:'كرات، أقماع، صديريات بلونين',rules:['يلعب الفريق المستحوذ داخل منطقة واحدة.','عند الاسترجاع، يحاول الفريق الجديد نقل الكرة إلى المنطقة الأخرى.','الفريق الذي فقد الكرة يمنع الخروج بالضغط والتغطية.'],easier:'كبّر المنطقة ومنح المستحوذ وقتاً أطول لاتخاذ القرار.',harder:'قلّل المساحة مع الحفاظ على قدرة اللاعبين على تنفيذ التمرين.',observe:'دوّن مرات منع الخروج، وميّزها عن مرات استعادة الكرة فعلياً.'},
    reference:{title:'FIFA — التحضير للضغط العكسي وتنفيذه',url:'https://www.fifatrainingcentre.com/en/practice/elite-sessions/transition-to-defending/preparing-and-executing-counter-pressing.php'} },
  rondo:{id:'rondo',title:'روندو 3 ضد 1: التحرك لفتح زوايا التمرير',query:'اعرض تمرين روندو 3 ضد 1',aliases:['تمرين روندو 3 ضد 1','روندو 3 ضد 1','روندو','rondo','3v1 rondo'],intro:'ثلاثة مستحوذين ومدافع واحد؛ الهدف تعديل التمركز بعد كل تمريرة لإبقاء خيارات الدعم مفتوحة.',objective:'تحسين المسح البصري والاستلام وتوفير خيارين لحامل الكرة.',
    frames:[
      {title:'1. مثلث الدعم',instruction:'توزّع كمثلث، وحدّد موقع المدافع قبل استلام الكرة.',players:rondo,ball:[29,20],arrows:[{from:'a',to:'b',kind:'pass'},{from:'a',to:'c',kind:'pass'}]},
      {title:'2. نقل الكرة',instruction:'مرّر للاعب الحر. يتحرك المدافع نحو جهة الكرة.',players:move(rondo,{x:[61,26]}),ball:[76,20],arrows:[{from:'a',to:'b',kind:'pass'}]},
      {title:'3. إعادة فتح الزاوية',instruction:'يعدل اللاعب 3 موقعه بعيداً عن خط تغطية المدافع.',players:move(rondo,{c:[65,51],a:[30,26],x:[63,28]}),ball:[76,20],arrows:[{from:'b',to:'c',kind:'pass'}]},
      {title:'4. استمرار المساندة',instruction:'بعد التمرير، تحرك مرة أخرى لتصبح خياراً واضحاً، ثم بدّل المدافع دورياً.',players:move(rondo,{c:[65,51],a:[30,33],b:[78,25],x:[61,40]}),ball:[65,51],arrows:[{from:'c',to:'a',kind:'pass'}]},
    ],coaching:['انظر إلى المدافع والكرة معاً.','تحرّك بعد التمرير ولا تبقَ في ظل المدافع.','اختر سرعة التمرير بحسب المساحة.'],
    drill:{players:'3 مستحوذين + مدافع واحد',area:'مثلث تقريبي داخل مساحة 10 × 10 م',duration:'8 دقائق: 3 جولات × دقيقتين، وراحة دقيقة بين الجولات',equipment:'كرة وأقماع',rules:['احتفظ بالكرة مع توفير خيارين للمستحوذ.','بدّل المدافع بعد القطع أو خروج الكرة، مع توزيع الأدوار بالتساوي.','ابدأ بلمسات حرة ثم عدّل القيد حسب قدرة المجموعة.'],easier:'وسّع المساحة أو خفّف ضغط المدافع.',harder:'صغّر المساحة تدريجياً أو استخدم لمستين.',observe:'راقب عدد المرات التي وفّر فيها المستحوذان خيارين واضحين، وليس طول سلسلة التمرير فقط.'},
    reference:{title:'FIFA — روندو 3 ضد 1 وإعادة التمركز',url:'https://www.fifatrainingcentre.com/en/practice/talent-coach-programme/secure-possession/3v1-rondo-fast-readjustments.php'} },
};
export const LESSON_CHOICES = Object.values(TACTICAL_LESSONS);
const normalized = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f\u064b-\u065f\u0640]/g,'').replace(/[أإآ]/g,'ا').replace(/[?!؟،.,]/g,'').replace(/\s+/g,' ').trim();
export function lessonByName(name: string): LessonId | null {
  if (Object.prototype.hasOwnProperty.call(TACTICAL_LESSONS,name)) return name as LessonId;
  const n=normalized(name);
  return LESSON_CHOICES.find(lesson=>[lesson.title,lesson.query,...lesson.aliases].some(alias=>normalized(alias)===n))?.id || null;
}
// Only explicit, supported lesson requests bypass live assistant research.
export function resolveTacticalRequest(query: string): LessonId | null {
  const n=normalized(query).replace(/^(اعرض|اشرح|اريد|ابي|ابغي|ابغى|show|explain)\s+/,'');
  return lessonByName(n);
}
