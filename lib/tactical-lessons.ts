export type LessonId = 'build-up' | 'counterpress' | 'rondo' | 'third-man' | 'switch-play' | 'finishing' | 'wide-attack' | 'mid-block' | 'transition' | 'high-press' | 'corners' | 'goalkeeping';
export const LESSON_CATEGORIES = ['بناء اللعب', 'التمرير والاستحواذ', 'الضغط', 'الدفاع', 'الإنهاء', 'الأطراف', 'التحولات', 'الكرات الثابتة', 'حراسة المرمى'] as const;
export type LessonCategory = typeof LESSON_CATEGORIES[number];
export type BoardPlayer = { id: string; number: string; side: 'team' | 'opponent'; x: number; y: number; role: string };
export type BoardArrow = { from: string; to: string; kind: 'pass' | 'run' | 'shot' };
export type LessonFrame = { title: string; instruction: string; players: BoardPlayer[]; ball: [number, number]; arrows: BoardArrow[] };
export type TacticalLessonData = {
  id: LessonId; category: LessonCategory; title: string; query: string; aliases: string[]; intro: string; objective: string;
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
  'build-up': { id:'build-up', category:'بناء اللعب', title:'كسر الضغط والبناء من الخلف', query:'اعرض لوحة تكتيكية لكسر الضغط', aliases:['لوحة تكتيكية لكسر الضغط','كسر الضغط','البناء من الخلف','build up','playing through pressure'], intro:'مشهد مبسّط يوضح جذب الضغط، فتح زاوية دعم ثم التقدم. القرار يتغير بحسب تمركز المنافس؛ التمرير الأمامي ليس إلزامياً.', objective:'إيجاد لاعب حر خلف خط الضغط دون فقدان خيار العودة.',
    frames:[
      {title:'1. تهيئة زوايا الاستلام',instruction:'قلبا الدفاع يتباعدان، والمحور يتحرك خارج ظل التغطية.',players:build,ball:[14,34],arrows:[]},
      {title:'2. جذب الضاغط',instruction:'تنتقل الكرة إلى قلب الدفاع، مع بقاء الحارس خياراً آمناً للعودة.',players:move(build,{x:[31,22],c:[43,38]}),ball:[29,18],arrows:[{from:'g',to:'a',kind:'pass'},{from:'c',to:'b',kind:'run'}]},
      {title:'3. توفير الدعم',instruction:'يتحرك المحور قطرياً لفتح خط تمرير. إن أُغلق المسار، استخدم العودة أو الطرف.',players:move(build,{x:[30,20],c:[45,26],z:[56,39]}),ball:[45,26],arrows:[{from:'a',to:'c',kind:'pass'},{from:'c',to:'d',kind:'pass'}]},
      {title:'4. التقدم مع التأمين',instruction:'الاستلام بجسم مفتوح يسمح برؤية اللاعب المتقدم، ويبقى دعم خلف الكرة.',players:move(build,{c:[53,27],d:[62,10],e:[78,30],z:[59,39]}),ball:[78,30],arrows:[{from:'c',to:'e',kind:'pass'}]},
    ], coaching:['افحص خلفك قبل الاستلام.','لا تختبئ خلف اللاعب الضاغط.','احتفظ بخيار آمن إذا أُغلق التقدم.'],
    drill:{players:'6 مستحوذين ضد 3 مدافعين',area:'30 × 24 م، منطقتان',duration:'8 دقائق: 3 جولات × دقيقتين، وراحة دقيقة بين الجولات',equipment:'كرات، أقماع، صديريات',rules:['ابدأ من خط الخلف وحاول إيصال الكرة إلى لاعب الهدف.','عند قطع الكرة، تبدأ محاولة جديدة وتُبدّل الأدوار دورياً.','راقب جودة الزاوية قبل زيادة سرعة اللعب.'],easier:'وسّع المنطقة واسمح بلمسات حرة.',harder:'ضيّق المنطقة أو قلّل اللمسات حسب مستوى المجموعة.',observe:'سجّل المحاولات الناجحة إلى لاعب الهدف وأسباب فقد الكرة.'},
    reference:{title:'FIFA — التقدم بالكرة عبر الضغط',url:'https://www.fifatrainingcentre.com/en/practice/talent-coach-programme/build-and-progress/2-zone-transitional-rondo-prioritising-vertical-play.php'} },
  counterpress:{id:'counterpress',category:'الضغط',title:'الضغط العكسي بعد فقد الكرة',query:'اعرض لوحة تكتيكية للضغط العكسي',aliases:['لوحة تكتيكية للضغط العكسي','الضغط العكسي','counter pressing','counterpress'],intro:'مثال على رد فعل جماعي عند فقد الكرة: ضغط قريب وتغطية للمسارات وحماية للعمق. إذا تعذر الوصول للكرة، تكون الأولوية لإعادة التنظيم.',objective:'إبطاء خروج المنافس أو استعادة الكرة دون كشف العمق.',
    frames:[
      {title:'1. لحظة الفقد',instruction:'الكرة مع المنافس. حدّد أقرب لاعب وخيارات التمرير التي يراها.',players:press,ball:[55,32],arrows:[]},
      {title:'2. ضغط أقرب لاعب',instruction:'اللاعب 6 يقترب، بينما يتحرك اللاعب 8 لإغلاق خيار التمرير الأمامي.',players:move(press,{a:[51,31],b:[64,23],d:[62,43]}),ball:[55,32],arrows:[{from:'a',to:'x',kind:'run'},{from:'b',to:'y',kind:'run'}]},
      {title:'3. حماية العمق',instruction:'تتقارب المجموعة، ويبقى اللاعب 4 خلف الضغط بدلاً من اندفاع الجميع إلى الكرة.',players:move(press,{a:[52,31],b:[65,23],c:[40,34],d:[63,42]}),ball:[55,32],arrows:[{from:'d',to:'z',kind:'run'}]},
      {title:'4. قرار الاستمرار أو الرجوع',instruction:'إن خرج المنافس من الضغط، استعد الشكل الدفاعي وأغلق العمق. استرجاع الكرة ليس مضموناً.',players:move(press,{a:[44,28],b:[49,20],c:[34,34],d:[48,44],x:[61,34]}),ball:[62,34],arrows:[]},
    ],coaching:['أقرب لاعب يبدأ الضغط والآخرون يؤمّنون خلفه.','لا تطارد الكرة على حساب العمق.','إذا كُسر الضغط، أعد التنظيم.'],
    drill:{players:'4 ضد 4',area:'24 × 20 م، منطقتان',duration:'8 دقائق: 3 جولات × دقيقتين، وراحة دقيقة بين الجولات',equipment:'كرات، أقماع، صديريات بلونين',rules:['يلعب الفريق المستحوذ داخل منطقة واحدة.','عند الاسترجاع، يحاول الفريق الجديد نقل الكرة إلى المنطقة الأخرى.','الفريق الذي فقد الكرة يمنع الخروج بالضغط والتغطية.'],easier:'كبّر المنطقة ومنح المستحوذ وقتاً أطول لاتخاذ القرار.',harder:'قلّل المساحة مع الحفاظ على قدرة اللاعبين على تنفيذ التمرين.',observe:'دوّن مرات منع الخروج، وميّزها عن مرات استعادة الكرة فعلياً.'},
    reference:{title:'FIFA — التحضير للضغط العكسي وتنفيذه',url:'https://www.fifatrainingcentre.com/en/practice/elite-sessions/transition-to-defending/preparing-and-executing-counter-pressing.php'} },
  rondo:{id:'rondo',category:'التمرير والاستحواذ',title:'روندو 3 ضد 1: التحرك لفتح زوايا التمرير',query:'اعرض تمرين روندو 3 ضد 1',aliases:['تمرين روندو 3 ضد 1','روندو 3 ضد 1','روندو','rondo','3v1 rondo'],intro:'ثلاثة مستحوذين ومدافع واحد؛ الهدف تعديل التمركز بعد كل تمريرة لإبقاء خيارات الدعم مفتوحة.',objective:'تحسين المسح البصري والاستلام وتوفير خيارين لحامل الكرة.',
    frames:[
      {title:'1. مثلث الدعم',instruction:'توزّع كمثلث، وحدّد موقع المدافع قبل استلام الكرة.',players:rondo,ball:[29,20],arrows:[{from:'a',to:'b',kind:'pass'},{from:'a',to:'c',kind:'pass'}]},
      {title:'2. نقل الكرة',instruction:'مرّر للاعب الحر. يتحرك المدافع نحو جهة الكرة.',players:move(rondo,{x:[61,26]}),ball:[76,20],arrows:[{from:'a',to:'b',kind:'pass'}]},
      {title:'3. إعادة فتح الزاوية',instruction:'يعدل اللاعب 3 موقعه بعيداً عن خط تغطية المدافع.',players:move(rondo,{c:[65,51],a:[30,26],x:[63,28]}),ball:[76,20],arrows:[{from:'b',to:'c',kind:'pass'}]},
      {title:'4. استمرار المساندة',instruction:'بعد التمرير، تحرك مرة أخرى لتصبح خياراً واضحاً، ثم بدّل المدافع دورياً.',players:move(rondo,{c:[65,51],a:[30,33],b:[78,25],x:[61,40]}),ball:[65,51],arrows:[{from:'c',to:'a',kind:'pass'}]},
    ],coaching:['انظر إلى المدافع والكرة معاً.','تحرّك بعد التمرير ولا تبقَ في ظل المدافع.','اختر سرعة التمرير بحسب المساحة.'],
    drill:{players:'3 مستحوذين + مدافع واحد',area:'مثلث تقريبي داخل مساحة 10 × 10 م',duration:'8 دقائق: 3 جولات × دقيقتين، وراحة دقيقة بين الجولات',equipment:'كرة وأقماع',rules:['احتفظ بالكرة مع توفير خيارين للمستحوذ.','بدّل المدافع بعد القطع أو خروج الكرة، مع توزيع الأدوار بالتساوي.','ابدأ بلمسات حرة ثم عدّل القيد حسب قدرة المجموعة.'],easier:'وسّع المساحة أو خفّف ضغط المدافع.',harder:'صغّر المساحة تدريجياً أو استخدم لمستين.',observe:'راقب عدد المرات التي وفّر فيها المستحوذان خيارين واضحين، وليس طول سلسلة التمرير فقط.'},
    reference:{title:'FIFA — روندو 3 ضد 1 وإعادة التمركز',url:'https://www.fifatrainingcentre.com/en/practice/talent-coach-programme/secure-possession/3v1-rondo-fast-readjustments.php'} },
  "third-man": {
  "id": "third-man",
  "title": "اللعب بالرجل الثالث",
  "category": "التمرير والاستحواذ",
  "query": "اعرض تمرين الرجل الثالث",
  "aliases": [
    "تمرين الرجل الثالث",
    "الرجل الثالث",
    "third man"
  ],
  "intro": "ثلاثة زملاء يستخدمون لاعب ربط للوصول إلى لاعب يتحرك خلف المدافع.",
  "objective": "تحسين توقيت الدعم والتمرير من لمسة مناسبة.",
  "frames": [
    {
      "title": "1. الاستعداد",
      "instruction": "افحص موقع المدافع ووفّر زاوية للاعب الربط.",
      "players": [
        {
          "id": "a",
          "number": "4",
          "side": "team",
          "x": 25,
          "y": 34,
          "role": "بداية اللعب"
        },
        {
          "id": "b",
          "number": "6",
          "side": "team",
          "x": 48,
          "y": 30,
          "role": "لاعب الربط"
        },
        {
          "id": "c",
          "number": "8",
          "side": "team",
          "x": 48,
          "y": 52,
          "role": "الرجل الثالث"
        },
        {
          "id": "x",
          "number": "9",
          "side": "opponent",
          "x": 58,
          "y": 34,
          "role": "مدافع"
        }
      ],
      "ball": [
        26,
        34
      ],
      "arrows": []
    },
    {
      "title": "2. الربط",
      "instruction": "تصل الكرة للاعب الربط؛ لا تدُر تحت ضغط بلا رؤية.",
      "players": [
        {
          "id": "a",
          "number": "4",
          "side": "team",
          "x": 25,
          "y": 34,
          "role": "بداية اللعب"
        },
        {
          "id": "b",
          "number": "6",
          "side": "team",
          "x": 48,
          "y": 30,
          "role": "لاعب الربط"
        },
        {
          "id": "c",
          "number": "8",
          "side": "team",
          "x": 48,
          "y": 52,
          "role": "الرجل الثالث"
        },
        {
          "id": "x",
          "number": "9",
          "side": "opponent",
          "x": 53,
          "y": 32,
          "role": "مدافع"
        }
      ],
      "ball": [
        48,
        30
      ],
      "arrows": [
        {
          "to": "b",
          "kind": "pass",
          "from": "a"
        }
      ]
    },
    {
      "title": "3. انطلاق الزميل",
      "instruction": "يتحرك اللاعب 8 إلى الجانب الحر قبل إعادة الكرة.",
      "players": [
        {
          "id": "a",
          "number": "4",
          "side": "team",
          "x": 25,
          "y": 34,
          "role": "بداية اللعب"
        },
        {
          "id": "b",
          "number": "6",
          "side": "team",
          "x": 48,
          "y": 30,
          "role": "لاعب الربط"
        },
        {
          "id": "c",
          "number": "8",
          "side": "team",
          "x": 68,
          "y": 48,
          "role": "الرجل الثالث"
        },
        {
          "id": "x",
          "number": "9",
          "side": "opponent",
          "x": 53,
          "y": 32,
          "role": "مدافع"
        }
      ],
      "ball": [
        48,
        30
      ],
      "arrows": [
        {
          "to": "c",
          "kind": "pass",
          "from": "b"
        }
      ]
    },
    {
      "title": "4. الوصول",
      "instruction": "استقبل وأنت قادر على التقدم أو إعادة الدعم.",
      "players": [
        {
          "id": "a",
          "number": "4",
          "side": "team",
          "x": 25,
          "y": 34,
          "role": "بداية اللعب"
        },
        {
          "id": "b",
          "number": "6",
          "side": "team",
          "x": 57,
          "y": 31,
          "role": "لاعب الربط"
        },
        {
          "id": "c",
          "number": "8",
          "side": "team",
          "x": 75,
          "y": 43,
          "role": "الرجل الثالث"
        },
        {
          "id": "x",
          "number": "9",
          "side": "opponent",
          "x": 58,
          "y": 34,
          "role": "مدافع"
        }
      ],
      "ball": [
        75,
        43
      ],
      "arrows": []
    }
  ],
  "coaching": [
    "تحرك قبل وصول التمريرة.",
    "لا تجعل التسلسل إجبارياً إذا أغلقه المدافع."
  ],
  "drill": {
    "players": "3 مهاجمين ضد مدافع",
    "area": "24 × 18 م",
    "duration": "8 دقائق: 3 جولات × دقيقتين وراحة دقيقة بين الجولات",
    "equipment": "كرات وأقماع وصديريات؛ مرمى في تمارين الإنهاء والحراس",
    "rules": [
      "ابدأ بضغط مدافع محدود ثم اجعله حراً.",
      "أكمل التسلسل إلى اللاعب المتحرك ثم بدّل الأدوار."
    ],
    "easier": "نفّذ التسلسل دون مدافع أولاً.",
    "harder": "اسمح للمدافع باختيار مسار الضغط.",
    "observe": "سجّل وصول الكرة إلى اللاعب المتحرك مع زاوية استلام مناسبة."
  },
  "reference": {
    "title": "FIFA — الربط والتقدم عبر اللاعب الثالث",
    "url": "https://www.fifatrainingcentre.com/en/practice/talent-coach-programme/build-and-progress/3v3-plus-2-possession-game-playing-forward-as-a-priority.php"
  }
},
  "switch-play": {
  "id": "switch-play",
  "title": "تغيير جهة اللعب",
  "category": "بناء اللعب",
  "query": "اعرض تمرين تغيير جهة اللعب",
  "aliases": [
    "تمرين تغيير جهة اللعب",
    "تغيير جهة اللعب",
    "switch play"
  ],
  "intro": "اجذب المنافس لجهة ثم انقل الكرة للجهة الأقل ازدحاماً عبر لاعب رابط.",
  "objective": "خلق وقت ومساحة للمستقبل البعيد.",
  "frames": [
    {
      "title": "1. تجميع المنافس",
      "instruction": "احتفظ بالدعم الخلفي ولا تحصر حامل الكرة قرب الخط.",
      "players": [
        {
          "id": "a",
          "number": "2",
          "side": "team",
          "x": 35,
          "y": 10,
          "role": "طرف قريب"
        },
        {
          "id": "b",
          "number": "6",
          "side": "team",
          "x": 40,
          "y": 30,
          "role": "رابط"
        },
        {
          "id": "c",
          "number": "3",
          "side": "team",
          "x": 42,
          "y": 58,
          "role": "طرف بعيد"
        },
        {
          "id": "d",
          "number": "4",
          "side": "team",
          "x": 22,
          "y": 23,
          "role": "دعم خلفي"
        },
        {
          "id": "e",
          "number": "8",
          "side": "team",
          "x": 62,
          "y": 24,
          "role": "دعم أمامي"
        },
        {
          "id": "f",
          "number": "9",
          "side": "team",
          "x": 72,
          "y": 44,
          "role": "مهاجم"
        },
        {
          "id": "x",
          "number": "7",
          "side": "opponent",
          "x": 43,
          "y": 15,
          "role": "ضغط"
        },
        {
          "id": "y",
          "number": "8",
          "side": "opponent",
          "x": 52,
          "y": 28,
          "role": "تغطية"
        },
        {
          "id": "z",
          "number": "6",
          "side": "opponent",
          "x": 54,
          "y": 45,
          "role": "حماية"
        }
      ],
      "ball": [
        35,
        10
      ],
      "arrows": []
    },
    {
      "title": "2. إيجاد الرابط",
      "instruction": "انقل الكرة للمحور عندما تتاح له الرؤية.",
      "players": [
        {
          "id": "a",
          "number": "2",
          "side": "team",
          "x": 35,
          "y": 10,
          "role": "طرف قريب"
        },
        {
          "id": "b",
          "number": "6",
          "side": "team",
          "x": 38,
          "y": 33,
          "role": "رابط"
        },
        {
          "id": "c",
          "number": "3",
          "side": "team",
          "x": 42,
          "y": 58,
          "role": "طرف بعيد"
        },
        {
          "id": "d",
          "number": "4",
          "side": "team",
          "x": 22,
          "y": 23,
          "role": "دعم خلفي"
        },
        {
          "id": "e",
          "number": "8",
          "side": "team",
          "x": 62,
          "y": 24,
          "role": "دعم أمامي"
        },
        {
          "id": "f",
          "number": "9",
          "side": "team",
          "x": 72,
          "y": 44,
          "role": "مهاجم"
        },
        {
          "id": "x",
          "number": "7",
          "side": "opponent",
          "x": 38,
          "y": 13,
          "role": "ضغط"
        },
        {
          "id": "y",
          "number": "8",
          "side": "opponent",
          "x": 52,
          "y": 28,
          "role": "تغطية"
        },
        {
          "id": "z",
          "number": "6",
          "side": "opponent",
          "x": 54,
          "y": 45,
          "role": "حماية"
        }
      ],
      "ball": [
        38,
        33
      ],
      "arrows": [
        {
          "to": "b",
          "kind": "pass",
          "from": "a"
        }
      ]
    },
    {
      "title": "3. النقل للجهة الحرة",
      "instruction": "استفد من الطرف البعيد بدلاً من إجبار تمريرة وسط الزحام.",
      "players": [
        {
          "id": "a",
          "number": "2",
          "side": "team",
          "x": 35,
          "y": 10,
          "role": "طرف قريب"
        },
        {
          "id": "b",
          "number": "6",
          "side": "team",
          "x": 40,
          "y": 30,
          "role": "رابط"
        },
        {
          "id": "c",
          "number": "3",
          "side": "team",
          "x": 54,
          "y": 58,
          "role": "طرف بعيد"
        },
        {
          "id": "d",
          "number": "4",
          "side": "team",
          "x": 22,
          "y": 23,
          "role": "دعم خلفي"
        },
        {
          "id": "e",
          "number": "8",
          "side": "team",
          "x": 62,
          "y": 24,
          "role": "دعم أمامي"
        },
        {
          "id": "f",
          "number": "9",
          "side": "team",
          "x": 72,
          "y": 44,
          "role": "مهاجم"
        },
        {
          "id": "x",
          "number": "7",
          "side": "opponent",
          "x": 43,
          "y": 15,
          "role": "ضغط"
        },
        {
          "id": "y",
          "number": "8",
          "side": "opponent",
          "x": 52,
          "y": 28,
          "role": "تغطية"
        },
        {
          "id": "z",
          "number": "6",
          "side": "opponent",
          "x": 51,
          "y": 42,
          "role": "حماية"
        }
      ],
      "ball": [
        54,
        58
      ],
      "arrows": [
        {
          "to": "c",
          "kind": "pass",
          "from": "b"
        }
      ]
    },
    {
      "title": "4. دعم الجهة الجديدة",
      "instruction": "تحرك خلف الكرة بعد التحويل لاستمرار اللعب.",
      "players": [
        {
          "id": "a",
          "number": "2",
          "side": "team",
          "x": 35,
          "y": 10,
          "role": "طرف قريب"
        },
        {
          "id": "b",
          "number": "6",
          "side": "team",
          "x": 51,
          "y": 38,
          "role": "رابط"
        },
        {
          "id": "c",
          "number": "3",
          "side": "team",
          "x": 66,
          "y": 56,
          "role": "طرف بعيد"
        },
        {
          "id": "d",
          "number": "4",
          "side": "team",
          "x": 22,
          "y": 23,
          "role": "دعم خلفي"
        },
        {
          "id": "e",
          "number": "8",
          "side": "team",
          "x": 62,
          "y": 24,
          "role": "دعم أمامي"
        },
        {
          "id": "f",
          "number": "9",
          "side": "team",
          "x": 79,
          "y": 45,
          "role": "مهاجم"
        },
        {
          "id": "x",
          "number": "7",
          "side": "opponent",
          "x": 43,
          "y": 15,
          "role": "ضغط"
        },
        {
          "id": "y",
          "number": "8",
          "side": "opponent",
          "x": 52,
          "y": 28,
          "role": "تغطية"
        },
        {
          "id": "z",
          "number": "6",
          "side": "opponent",
          "x": 54,
          "y": 45,
          "role": "حماية"
        }
      ],
      "ball": [
        66,
        56
      ],
      "arrows": []
    }
  ],
  "coaching": [
    "المسح البصري قبل استلام الرابط.",
    "الطرف البعيد يبقى خياراً واضحاً."
  ],
  "drill": {
    "players": "6 ضد 3",
    "area": "36 × 28 م، قناتان طرفيتان",
    "duration": "8 دقائق: 3 جولات × دقيقتين وراحة دقيقة بين الجولات",
    "equipment": "كرات وأقماع وصديريات؛ مرمى في تمارين الإنهاء والحراس",
    "rules": [
      "حاول نقل الكرة من قناة إلى الأخرى دون قطعها.",
      "بدّل أدوار الضغط وأوقف اللعب لمراجعة زاوية الرابط."
    ],
    "easier": "وسّع المنطقة واسمح بلمسات حرة.",
    "harder": "ضيّق القناة أو زد ضغط المدافعين.",
    "observe": "قارن التحويلات الناجحة والتمريرات القسرية المقطوعة."
  },
  "reference": {
    "title": "FIFA — تغيير جهة اللعب",
    "url": "https://www.fifatrainingcentre.com/en/practice/elite-sessions/in-possession/switching_play.php"
  }
},
  "finishing": {
  "id": "finishing",
  "title": "الإنهاء بعد مواجهة 1 ضد 1",
  "category": "الإنهاء",
  "query": "اعرض تمرين الإنهاء 1 ضد 1",
  "aliases": [
    "تمرين الإنهاء 1 ضد 1",
    "الانهاء",
    "الإنهاء",
    "finishing"
  ],
  "intro": "مهاجم يستقبل ويواجه مدافعاً قبل اتخاذ قرار التسديد.",
  "objective": "خلق زاوية تسديد مع الحفاظ على السيطرة.",
  "frames": [
    {
      "title": "1. قبل الاستلام",
      "instruction": "حدّد المساحة والمدافع وموقع الحارس.",
      "players": [
        {
          "id": "a",
          "number": "8",
          "side": "team",
          "x": 60,
          "y": 42,
          "role": "ممرر"
        },
        {
          "id": "b",
          "number": "9",
          "side": "team",
          "x": 76,
          "y": 29,
          "role": "مهاجم"
        },
        {
          "id": "x",
          "number": "4",
          "side": "opponent",
          "x": 83,
          "y": 30,
          "role": "مدافع"
        },
        {
          "id": "k",
          "number": "1",
          "side": "opponent",
          "x": 100,
          "y": 34,
          "role": "حارس"
        }
      ],
      "ball": [
        60,
        42
      ],
      "arrows": []
    },
    {
      "title": "2. اللمسة الأولى",
      "instruction": "استقبل نحو مساحة تسمح بمواجهة المدافع.",
      "players": [
        {
          "id": "a",
          "number": "8",
          "side": "team",
          "x": 60,
          "y": 42,
          "role": "ممرر"
        },
        {
          "id": "b",
          "number": "9",
          "side": "team",
          "x": 78,
          "y": 29,
          "role": "مهاجم"
        },
        {
          "id": "x",
          "number": "4",
          "side": "opponent",
          "x": 84,
          "y": 31,
          "role": "مدافع"
        },
        {
          "id": "k",
          "number": "1",
          "side": "opponent",
          "x": 100,
          "y": 34,
          "role": "حارس"
        }
      ],
      "ball": [
        78,
        29
      ],
      "arrows": [
        {
          "to": "b",
          "kind": "pass",
          "from": "a"
        }
      ]
    },
    {
      "title": "3. خلق الزاوية",
      "instruction": "غيّر الاتجاه إن سمحت المسافة؛ لا تسدد بلا نافذة.",
      "players": [
        {
          "id": "a",
          "number": "8",
          "side": "team",
          "x": 60,
          "y": 42,
          "role": "ممرر"
        },
        {
          "id": "b",
          "number": "9",
          "side": "team",
          "x": 87,
          "y": 24,
          "role": "مهاجم"
        },
        {
          "id": "x",
          "number": "4",
          "side": "opponent",
          "x": 86,
          "y": 29,
          "role": "مدافع"
        },
        {
          "id": "k",
          "number": "1",
          "side": "opponent",
          "x": 99,
          "y": 31,
          "role": "حارس"
        }
      ],
      "ball": [
        87,
        24
      ],
      "arrows": []
    },
    {
      "title": "4. قرار التسديد",
      "instruction": "اختر الزاوية المتاحة؛ الرسم لا يفترض تسجيل هدف.",
      "players": [
        {
          "id": "a",
          "number": "8",
          "side": "team",
          "x": 60,
          "y": 42,
          "role": "ممرر"
        },
        {
          "id": "b",
          "number": "9",
          "side": "team",
          "x": 89,
          "y": 24,
          "role": "مهاجم"
        },
        {
          "id": "x",
          "number": "4",
          "side": "opponent",
          "x": 87,
          "y": 29,
          "role": "مدافع"
        },
        {
          "id": "k",
          "number": "1",
          "side": "opponent",
          "x": 100,
          "y": 34,
          "role": "حارس"
        }
      ],
      "ball": [
        99,
        33
      ],
      "arrows": [
        {
          "to": "k",
          "kind": "shot",
          "from": "b"
        }
      ]
    }
  ],
  "coaching": [
    "ارفع الرأس قبل القرار.",
    "تدرّج في ضغط المدافع."
  ],
  "drill": {
    "players": "ممرر ومهاجم ضد مدافع وحارس",
    "area": "28 × 22 م أمام المرمى",
    "duration": "8 دقائق: 3 جولات × دقيقتين وراحة دقيقة بين الجولات",
    "equipment": "كرات وأقماع وصديريات؛ مرمى في تمارين الإنهاء والحراس",
    "rules": [
      "مرّر للمهاجم وابدأ مواجهة حرة.",
      "أنه المحاولة عند التسديد أو القطع ثم أعد التنظيم."
    ],
    "easier": "ابدأ بمدافع متأخر قليلاً.",
    "harder": "ابدأ المدافع أقرب مع بقاء فرصة اتخاذ القرار.",
    "observe": "دوّن جودة اللمسة وزاوية التسديد بجانب النتيجة."
  },
  "reference": {
    "title": "FIFA — الإنهاء في مواجهة 1 ضد 1",
    "url": "https://www.fifatrainingcentre.com/en/practice/talent-coach-programme/create-and-finish/1v1-finishing-beating-the-defender-and-score.php"
  }
},
  "wide-attack": {
  "id": "wide-attack",
  "title": "الهجوم الطرفي والتمرير للخلف",
  "category": "الأطراف",
  "query": "اعرض تمرين الهجوم الطرفي",
  "aliases": [
    "تمرين الهجوم الطرفي",
    "الهجوم الطرفي",
    "التمرير للخلف",
    "cutback"
  ],
  "intro": "استخدم العرض لخلق مسار تمرير للخلف مع وصول زميل من العمق.",
  "objective": "تنسيق توقيت التمرير ووصول المهاجمين.",
  "frames": [
    {
      "title": "1. توفير العرض",
      "instruction": "الجناح واسع والمهاجم يراقب المدافع.",
      "players": [
        {
          "id": "a",
          "number": "7",
          "side": "team",
          "x": 69,
          "y": 9,
          "role": "جناح"
        },
        {
          "id": "b",
          "number": "9",
          "side": "team",
          "x": 80,
          "y": 32,
          "role": "مهاجم"
        },
        {
          "id": "c",
          "number": "8",
          "side": "team",
          "x": 65,
          "y": 45,
          "role": "قادم من الخلف"
        },
        {
          "id": "x",
          "number": "3",
          "side": "opponent",
          "x": 78,
          "y": 14,
          "role": "ظهير"
        },
        {
          "id": "y",
          "number": "4",
          "side": "opponent",
          "x": 87,
          "y": 32,
          "role": "قلب دفاع"
        },
        {
          "id": "k",
          "number": "1",
          "side": "opponent",
          "x": 100,
          "y": 34,
          "role": "حارس"
        }
      ],
      "ball": [
        69,
        9
      ],
      "arrows": []
    },
    {
      "title": "2. التقدم الطرفي",
      "instruction": "تحرك نحو خط النهاية إذا فُتح المسار.",
      "players": [
        {
          "id": "a",
          "number": "7",
          "side": "team",
          "x": 91,
          "y": 12,
          "role": "جناح"
        },
        {
          "id": "b",
          "number": "9",
          "side": "team",
          "x": 90,
          "y": 27,
          "role": "مهاجم"
        },
        {
          "id": "c",
          "number": "8",
          "side": "team",
          "x": 65,
          "y": 45,
          "role": "قادم من الخلف"
        },
        {
          "id": "x",
          "number": "3",
          "side": "opponent",
          "x": 85,
          "y": 16,
          "role": "ظهير"
        },
        {
          "id": "y",
          "number": "4",
          "side": "opponent",
          "x": 87,
          "y": 32,
          "role": "قلب دفاع"
        },
        {
          "id": "k",
          "number": "1",
          "side": "opponent",
          "x": 100,
          "y": 34,
          "role": "حارس"
        }
      ],
      "ball": [
        91,
        12
      ],
      "arrows": []
    },
    {
      "title": "3. الوصول من الخلف",
      "instruction": "يصل اللاعب 8 إلى مساحة التمرير الخلفي دون تزاحم.",
      "players": [
        {
          "id": "a",
          "number": "7",
          "side": "team",
          "x": 94,
          "y": 15,
          "role": "جناح"
        },
        {
          "id": "b",
          "number": "9",
          "side": "team",
          "x": 94,
          "y": 25,
          "role": "مهاجم"
        },
        {
          "id": "c",
          "number": "8",
          "side": "team",
          "x": 82,
          "y": 39,
          "role": "قادم من الخلف"
        },
        {
          "id": "x",
          "number": "3",
          "side": "opponent",
          "x": 78,
          "y": 14,
          "role": "ظهير"
        },
        {
          "id": "y",
          "number": "4",
          "side": "opponent",
          "x": 93,
          "y": 29,
          "role": "قلب دفاع"
        },
        {
          "id": "k",
          "number": "1",
          "side": "opponent",
          "x": 100,
          "y": 34,
          "role": "حارس"
        }
      ],
      "ball": [
        94,
        15
      ],
      "arrows": [
        {
          "to": "c",
          "kind": "pass",
          "from": "a"
        }
      ]
    },
    {
      "title": "4. الإنهاء",
      "instruction": "استقبل التمرير للخلف واتخذ القرار حسب زاوية الحارس.",
      "players": [
        {
          "id": "a",
          "number": "7",
          "side": "team",
          "x": 69,
          "y": 9,
          "role": "جناح"
        },
        {
          "id": "b",
          "number": "9",
          "side": "team",
          "x": 94,
          "y": 25,
          "role": "مهاجم"
        },
        {
          "id": "c",
          "number": "8",
          "side": "team",
          "x": 85,
          "y": 38,
          "role": "قادم من الخلف"
        },
        {
          "id": "x",
          "number": "3",
          "side": "opponent",
          "x": 78,
          "y": 14,
          "role": "ظهير"
        },
        {
          "id": "y",
          "number": "4",
          "side": "opponent",
          "x": 87,
          "y": 32,
          "role": "قلب دفاع"
        },
        {
          "id": "k",
          "number": "1",
          "side": "opponent",
          "x": 100,
          "y": 34,
          "role": "حارس"
        }
      ],
      "ball": [
        98,
        34
      ],
      "arrows": [
        {
          "to": "k",
          "kind": "shot",
          "from": "c"
        }
      ]
    }
  ],
  "coaching": [
    "وزّع الوصول ولا تجمع المهاجمين على خط واحد.",
    "اختر نوع التمرير بحسب حركة الدفاع."
  ],
  "drill": {
    "players": "3 مهاجمين ضد مدافعين وحارس",
    "area": "32 × 30 م مع قناة طرفية",
    "duration": "8 دقائق: 3 جولات × دقيقتين وراحة دقيقة بين الجولات",
    "equipment": "كرات وأقماع وصديريات؛ مرمى في تمارين الإنهاء والحراس",
    "rules": [
      "ابدأ من الجناح وابحث عن تمرير مناسب إلى الداخل.",
      "بدّل أماكن الوصول ولا تفرض التمرير للخلف إذا أغلقه الدفاع."
    ],
    "easier": "ابدأ دون ضغط مباشر على الجناح.",
    "harder": "اجعل الدفاع حراً منذ اللمسة الأولى.",
    "observe": "راقب توافق وصول الزميل مع توقيت إرسال الكرة."
  },
  "reference": {
    "title": "FIFA — صناعة الفرص أمام الدفاع المتكتل",
    "url": "https://www.fifatrainingcentre.com/en/practice/elite-sessions/in-possession/boothroyd-breaking-down-a-low-block.php"
  }
},
  "mid-block": {
  "id": "mid-block",
  "title": "التكتل الدفاعي وحماية العمق",
  "category": "الدفاع",
  "query": "اعرض تمرين التكتل الدفاعي",
  "aliases": [
    "تمرين التكتل الدفاعي",
    "التكتل الدفاعي",
    "الدفاع المتوسط",
    "mid block"
  ],
  "intro": "خطّان دفاعيان يتحركان مع الكرة لمنع اللعب بينهما.",
  "objective": "التنسيق بين الضغط والتغطية وحماية الوسط.",
  "frames": [
    {
      "title": "1. حماية المركز",
      "instruction": "حافظ على مسافات تسمح بالتغطية.",
      "players": [
        {
          "id": "a",
          "number": "6",
          "side": "team",
          "x": 55,
          "y": 24,
          "role": "وسط"
        },
        {
          "id": "b",
          "number": "8",
          "side": "team",
          "x": 55,
          "y": 44,
          "role": "وسط"
        },
        {
          "id": "c",
          "number": "4",
          "side": "team",
          "x": 39,
          "y": 25,
          "role": "دفاع"
        },
        {
          "id": "d",
          "number": "5",
          "side": "team",
          "x": 39,
          "y": 43,
          "role": "دفاع"
        },
        {
          "id": "x",
          "number": "10",
          "side": "opponent",
          "x": 69,
          "y": 34,
          "role": "حامل الكرة"
        },
        {
          "id": "y",
          "number": "7",
          "side": "opponent",
          "x": 71,
          "y": 10,
          "role": "طرف"
        },
        {
          "id": "z",
          "number": "9",
          "side": "opponent",
          "x": 46,
          "y": 34,
          "role": "بين الخطوط"
        },
        {
          "id": "w",
          "number": "3",
          "side": "opponent",
          "x": 77,
          "y": 55,
          "role": "دعم"
        }
      ],
      "ball": [
        69,
        34
      ],
      "arrows": []
    },
    {
      "title": "2. انتقال الكرة للطرف",
      "instruction": "تحرك كوحدة عند انتقال الكرة دون فتح الوسط.",
      "players": [
        {
          "id": "a",
          "number": "6",
          "side": "team",
          "x": 59,
          "y": 18,
          "role": "وسط"
        },
        {
          "id": "b",
          "number": "8",
          "side": "team",
          "x": 55,
          "y": 34,
          "role": "وسط"
        },
        {
          "id": "c",
          "number": "4",
          "side": "team",
          "x": 43,
          "y": 20,
          "role": "دفاع"
        },
        {
          "id": "d",
          "number": "5",
          "side": "team",
          "x": 40,
          "y": 36,
          "role": "دفاع"
        },
        {
          "id": "x",
          "number": "10",
          "side": "opponent",
          "x": 69,
          "y": 34,
          "role": "حامل الكرة"
        },
        {
          "id": "y",
          "number": "7",
          "side": "opponent",
          "x": 71,
          "y": 10,
          "role": "طرف"
        },
        {
          "id": "z",
          "number": "9",
          "side": "opponent",
          "x": 46,
          "y": 34,
          "role": "بين الخطوط"
        },
        {
          "id": "w",
          "number": "3",
          "side": "opponent",
          "x": 77,
          "y": 55,
          "role": "دعم"
        }
      ],
      "ball": [
        71,
        10
      ],
      "arrows": [
        {
          "to": "y",
          "kind": "pass",
          "from": "x"
        }
      ]
    },
    {
      "title": "3. ضغط مع تغطية",
      "instruction": "الأقرب يضغط والزميل يحمي المساحة خلفه.",
      "players": [
        {
          "id": "a",
          "number": "6",
          "side": "team",
          "x": 65,
          "y": 15,
          "role": "وسط"
        },
        {
          "id": "b",
          "number": "8",
          "side": "team",
          "x": 57,
          "y": 28,
          "role": "وسط"
        },
        {
          "id": "c",
          "number": "4",
          "side": "team",
          "x": 47,
          "y": 21,
          "role": "دفاع"
        },
        {
          "id": "d",
          "number": "5",
          "side": "team",
          "x": 43,
          "y": 35,
          "role": "دفاع"
        },
        {
          "id": "x",
          "number": "10",
          "side": "opponent",
          "x": 69,
          "y": 34,
          "role": "حامل الكرة"
        },
        {
          "id": "y",
          "number": "7",
          "side": "opponent",
          "x": 71,
          "y": 10,
          "role": "طرف"
        },
        {
          "id": "z",
          "number": "9",
          "side": "opponent",
          "x": 46,
          "y": 34,
          "role": "بين الخطوط"
        },
        {
          "id": "w",
          "number": "3",
          "side": "opponent",
          "x": 77,
          "y": 55,
          "role": "دعم"
        }
      ],
      "ball": [
        71,
        10
      ],
      "arrows": [
        {
          "to": "y",
          "kind": "run",
          "from": "a"
        }
      ]
    },
    {
      "title": "4. إعادة التوازن",
      "instruction": "عند رجوع الكرة للوسط، عد للتقارب بدلاً من المطاردة.",
      "players": [
        {
          "id": "a",
          "number": "6",
          "side": "team",
          "x": 56,
          "y": 26,
          "role": "وسط"
        },
        {
          "id": "b",
          "number": "8",
          "side": "team",
          "x": 55,
          "y": 42,
          "role": "وسط"
        },
        {
          "id": "c",
          "number": "4",
          "side": "team",
          "x": 40,
          "y": 26,
          "role": "دفاع"
        },
        {
          "id": "d",
          "number": "5",
          "side": "team",
          "x": 40,
          "y": 42,
          "role": "دفاع"
        },
        {
          "id": "x",
          "number": "10",
          "side": "opponent",
          "x": 69,
          "y": 34,
          "role": "حامل الكرة"
        },
        {
          "id": "y",
          "number": "7",
          "side": "opponent",
          "x": 71,
          "y": 10,
          "role": "طرف"
        },
        {
          "id": "z",
          "number": "9",
          "side": "opponent",
          "x": 46,
          "y": 34,
          "role": "بين الخطوط"
        },
        {
          "id": "w",
          "number": "3",
          "side": "opponent",
          "x": 77,
          "y": 55,
          "role": "دعم"
        }
      ],
      "ball": [
        69,
        34
      ],
      "arrows": []
    }
  ],
  "coaching": [
    "لا يخرج مدافع دون تغطية.",
    "راقب الكرة والزميل والمساحة."
  ],
  "drill": {
    "players": "4 مدافعين ضد 4 مهاجمين",
    "area": "32 × 26 م، بوابتان للتقدم",
    "duration": "8 دقائق: 3 جولات × دقيقتين وراحة دقيقة بين الجولات",
    "equipment": "كرات وأقماع وصديريات؛ مرمى في تمارين الإنهاء والحراس",
    "rules": [
      "يسعى الهجوم لتمرير الكرة بين الخطين إلى بوابة.",
      "يدافع الفريق بالتغطية والتوجيه للطرف ثم يبدّل الأدوار."
    ],
    "easier": "بطّئ تداول الهجوم لتعليم التحرك الجماعي.",
    "harder": "اسمح للهجوم بتغيير جهة اللعب بحرية.",
    "observe": "سجّل اختراقات العمق وتوقيت خروج المدافع."
  },
  "reference": {
    "title": "FIFA — الدفاع بكتلة متوسطة",
    "url": "https://www.fifatrainingcentre.com/en/practice/elite-sessions/out-of-possession/chiba_said-defending-in-a-mid-block.php"
  }
},
  "transition": {
  "id": "transition",
  "title": "التحول الهجومي 3 ضد 2",
  "category": "التحولات",
  "query": "اعرض تمرين التحول الهجومي",
  "aliases": [
    "تمرين التحول الهجومي",
    "التحول الهجومي",
    "3 ضد 2",
    "attacking transition"
  ],
  "intro": "بعد الاسترجاع، يستفيد ثلاثة مهاجمين من تفوق عددي مؤقت.",
  "objective": "اختيار التمرير أو الحمل قبل اكتمال دفاع المنافس.",
  "frames": [
    {
      "title": "1. الاسترجاع",
      "instruction": "انظر للأمام أولاً مع الاحتفاظ بالكرة.",
      "players": [
        {
          "id": "a",
          "number": "6",
          "side": "team",
          "x": 48,
          "y": 34,
          "role": "مسترجع الكرة"
        },
        {
          "id": "b",
          "number": "7",
          "side": "team",
          "x": 65,
          "y": 14,
          "role": "انطلاق يمين"
        },
        {
          "id": "c",
          "number": "9",
          "side": "team",
          "x": 64,
          "y": 53,
          "role": "انطلاق يسار"
        },
        {
          "id": "x",
          "number": "4",
          "side": "opponent",
          "x": 77,
          "y": 25,
          "role": "مدافع"
        },
        {
          "id": "y",
          "number": "5",
          "side": "opponent",
          "x": 77,
          "y": 44,
          "role": "مدافع"
        },
        {
          "id": "k",
          "number": "1",
          "side": "opponent",
          "x": 100,
          "y": 34,
          "role": "حارس"
        }
      ],
      "ball": [
        48,
        34
      ],
      "arrows": []
    },
    {
      "title": "2. اتساع الدعم",
      "instruction": "تحرك الزميلان لفتح مسارين وعدم تكرار المسار.",
      "players": [
        {
          "id": "a",
          "number": "6",
          "side": "team",
          "x": 61,
          "y": 34,
          "role": "مسترجع الكرة"
        },
        {
          "id": "b",
          "number": "7",
          "side": "team",
          "x": 74,
          "y": 13,
          "role": "انطلاق يمين"
        },
        {
          "id": "c",
          "number": "9",
          "side": "team",
          "x": 73,
          "y": 53,
          "role": "انطلاق يسار"
        },
        {
          "id": "x",
          "number": "4",
          "side": "opponent",
          "x": 77,
          "y": 25,
          "role": "مدافع"
        },
        {
          "id": "y",
          "number": "5",
          "side": "opponent",
          "x": 77,
          "y": 44,
          "role": "مدافع"
        },
        {
          "id": "k",
          "number": "1",
          "side": "opponent",
          "x": 100,
          "y": 34,
          "role": "حارس"
        }
      ],
      "ball": [
        61,
        34
      ],
      "arrows": []
    },
    {
      "title": "3. جذب المدافع",
      "instruction": "احمل الكرة نحو المدافع ثم مرّر إن ترك المسار.",
      "players": [
        {
          "id": "a",
          "number": "6",
          "side": "team",
          "x": 71,
          "y": 31,
          "role": "مسترجع الكرة"
        },
        {
          "id": "b",
          "number": "7",
          "side": "team",
          "x": 85,
          "y": 15,
          "role": "انطلاق يمين"
        },
        {
          "id": "c",
          "number": "9",
          "side": "team",
          "x": 64,
          "y": 53,
          "role": "انطلاق يسار"
        },
        {
          "id": "x",
          "number": "4",
          "side": "opponent",
          "x": 75,
          "y": 30,
          "role": "مدافع"
        },
        {
          "id": "y",
          "number": "5",
          "side": "opponent",
          "x": 77,
          "y": 44,
          "role": "مدافع"
        },
        {
          "id": "k",
          "number": "1",
          "side": "opponent",
          "x": 100,
          "y": 34,
          "role": "حارس"
        }
      ],
      "ball": [
        85,
        15
      ],
      "arrows": [
        {
          "to": "b",
          "kind": "pass",
          "from": "a"
        }
      ]
    },
    {
      "title": "4. قرار أخير",
      "instruction": "يساند اللاعبان حامل الكرة دون افتراض نجاح الإنهاء.",
      "players": [
        {
          "id": "a",
          "number": "6",
          "side": "team",
          "x": 84,
          "y": 32,
          "role": "مسترجع الكرة"
        },
        {
          "id": "b",
          "number": "7",
          "side": "team",
          "x": 90,
          "y": 20,
          "role": "انطلاق يمين"
        },
        {
          "id": "c",
          "number": "9",
          "side": "team",
          "x": 88,
          "y": 47,
          "role": "انطلاق يسار"
        },
        {
          "id": "x",
          "number": "4",
          "side": "opponent",
          "x": 77,
          "y": 25,
          "role": "مدافع"
        },
        {
          "id": "y",
          "number": "5",
          "side": "opponent",
          "x": 89,
          "y": 39,
          "role": "مدافع"
        },
        {
          "id": "k",
          "number": "1",
          "side": "opponent",
          "x": 100,
          "y": 34,
          "role": "حارس"
        }
      ],
      "ball": [
        99,
        32
      ],
      "arrows": [
        {
          "to": "k",
          "kind": "shot",
          "from": "b"
        }
      ]
    }
  ],
  "coaching": [
    "لا تتسرع بالتمريرة الأولى.",
    "تجنب انطلاق الجميع في المسار ذاته."
  ],
  "drill": {
    "players": "3 مهاجمين ضد مدافعين وحارس",
    "area": "40 × 32 م",
    "duration": "8 دقائق: 3 جولات × دقيقتين وراحة دقيقة بين الجولات",
    "equipment": "كرات وأقماع وصديريات؛ مرمى في تمارين الإنهاء والحراس",
    "rules": [
      "ابدأ من استرجاع أو تمريرة المدرب في الوسط.",
      "تتوقف المحاولة عند النهاية ويعود الجميع لمواضع البدء."
    ],
    "easier": "اجعل أحد المدافعين متأخراً في البداية.",
    "harder": "ابدأ المدافعين بمسافة أقرب للمسترجع.",
    "observe": "قيّم قرار الحمل أو التمرير واستغلال العرض."
  },
  "reference": {
    "title": "FIFA — التحول إلى الهجوم",
    "url": "https://www.fifatrainingcentre.com/en/practice/elite-sessions/transition-to-attacking/transition-into-attack.php"
  }
},
  "high-press": {
  "id": "high-press",
  "title": "الضغط العالي على ركلة المرمى",
  "category": "الضغط",
  "query": "اعرض تمرين الضغط العالي",
  "aliases": [
    "تمرين الضغط العالي",
    "الضغط العالي",
    "high press"
  ],
  "intro": "منظومة ضغط صغيرة توجّه البناء إلى جهة محددة وتغلق العودة للوسط.",
  "objective": "ربط ضغط المهاجم بتحرك زملائه خلفه.",
  "frames": [
    {
      "title": "1. قراءة البداية",
      "instruction": "حدّد الجهة المراد توجيه اللعب نحوها.",
      "players": [
        {
          "id": "a",
          "number": "9",
          "side": "team",
          "x": 65,
          "y": 25,
          "role": "مهاجم ضاغط"
        },
        {
          "id": "b",
          "number": "10",
          "side": "team",
          "x": 65,
          "y": 43,
          "role": "غلق الداخل"
        },
        {
          "id": "c",
          "number": "7",
          "side": "team",
          "x": 53,
          "y": 12,
          "role": "جناح"
        },
        {
          "id": "d",
          "number": "6",
          "side": "team",
          "x": 48,
          "y": 34,
          "role": "تأمين"
        },
        {
          "id": "k",
          "number": "1",
          "side": "opponent",
          "x": 98,
          "y": 34,
          "role": "حارس منافس"
        },
        {
          "id": "x",
          "number": "4",
          "side": "opponent",
          "x": 83,
          "y": 18,
          "role": "قلب دفاع"
        },
        {
          "id": "y",
          "number": "5",
          "side": "opponent",
          "x": 83,
          "y": 50,
          "role": "قلب دفاع"
        },
        {
          "id": "z",
          "number": "2",
          "side": "opponent",
          "x": 69,
          "y": 7,
          "role": "ظهير"
        },
        {
          "id": "w",
          "number": "6",
          "side": "opponent",
          "x": 72,
          "y": 34,
          "role": "محور"
        }
      ],
      "ball": [
        98,
        34
      ],
      "arrows": []
    },
    {
      "title": "2. إشارة الضغط",
      "instruction": "عند تمرير الحارس، يقترب المهاجم من قلب الدفاع.",
      "players": [
        {
          "id": "a",
          "number": "9",
          "side": "team",
          "x": 77,
          "y": 23,
          "role": "مهاجم ضاغط"
        },
        {
          "id": "b",
          "number": "10",
          "side": "team",
          "x": 70,
          "y": 39,
          "role": "غلق الداخل"
        },
        {
          "id": "c",
          "number": "7",
          "side": "team",
          "x": 60,
          "y": 10,
          "role": "جناح"
        },
        {
          "id": "d",
          "number": "6",
          "side": "team",
          "x": 48,
          "y": 34,
          "role": "تأمين"
        },
        {
          "id": "k",
          "number": "1",
          "side": "opponent",
          "x": 98,
          "y": 34,
          "role": "حارس منافس"
        },
        {
          "id": "x",
          "number": "4",
          "side": "opponent",
          "x": 83,
          "y": 18,
          "role": "قلب دفاع"
        },
        {
          "id": "y",
          "number": "5",
          "side": "opponent",
          "x": 83,
          "y": 50,
          "role": "قلب دفاع"
        },
        {
          "id": "z",
          "number": "2",
          "side": "opponent",
          "x": 69,
          "y": 7,
          "role": "ظهير"
        },
        {
          "id": "w",
          "number": "6",
          "side": "opponent",
          "x": 72,
          "y": 34,
          "role": "محور"
        }
      ],
      "ball": [
        83,
        18
      ],
      "arrows": [
        {
          "to": "x",
          "kind": "pass",
          "from": "k"
        },
        {
          "to": "x",
          "kind": "run",
          "from": "a"
        }
      ]
    },
    {
      "title": "3. إغلاق الدعم",
      "instruction": "يضيق الجناح والمحور الخيارات دون فتح الداخل.",
      "players": [
        {
          "id": "a",
          "number": "9",
          "side": "team",
          "x": 80,
          "y": 21,
          "role": "مهاجم ضاغط"
        },
        {
          "id": "b",
          "number": "10",
          "side": "team",
          "x": 74,
          "y": 35,
          "role": "غلق الداخل"
        },
        {
          "id": "c",
          "number": "7",
          "side": "team",
          "x": 65,
          "y": 9,
          "role": "جناح"
        },
        {
          "id": "d",
          "number": "6",
          "side": "team",
          "x": 60,
          "y": 30,
          "role": "تأمين"
        },
        {
          "id": "k",
          "number": "1",
          "side": "opponent",
          "x": 98,
          "y": 34,
          "role": "حارس منافس"
        },
        {
          "id": "x",
          "number": "4",
          "side": "opponent",
          "x": 83,
          "y": 18,
          "role": "قلب دفاع"
        },
        {
          "id": "y",
          "number": "5",
          "side": "opponent",
          "x": 83,
          "y": 50,
          "role": "قلب دفاع"
        },
        {
          "id": "z",
          "number": "2",
          "side": "opponent",
          "x": 69,
          "y": 7,
          "role": "ظهير"
        },
        {
          "id": "w",
          "number": "6",
          "side": "opponent",
          "x": 72,
          "y": 34,
          "role": "محور"
        }
      ],
      "ball": [
        83,
        18
      ],
      "arrows": [
        {
          "to": "z",
          "kind": "run",
          "from": "c"
        }
      ]
    },
    {
      "title": "4. قرار الاسترجاع أو التراجع",
      "instruction": "إذا خرج المنافس بتمريرة آمنة، تعود المجموعة للتوازن.",
      "players": [
        {
          "id": "a",
          "number": "9",
          "side": "team",
          "x": 69,
          "y": 26,
          "role": "مهاجم ضاغط"
        },
        {
          "id": "b",
          "number": "10",
          "side": "team",
          "x": 64,
          "y": 40,
          "role": "غلق الداخل"
        },
        {
          "id": "c",
          "number": "7",
          "side": "team",
          "x": 58,
          "y": 14,
          "role": "جناح"
        },
        {
          "id": "d",
          "number": "6",
          "side": "team",
          "x": 52,
          "y": 33,
          "role": "تأمين"
        },
        {
          "id": "k",
          "number": "1",
          "side": "opponent",
          "x": 98,
          "y": 34,
          "role": "حارس منافس"
        },
        {
          "id": "x",
          "number": "4",
          "side": "opponent",
          "x": 83,
          "y": 18,
          "role": "قلب دفاع"
        },
        {
          "id": "y",
          "number": "5",
          "side": "opponent",
          "x": 83,
          "y": 50,
          "role": "قلب دفاع"
        },
        {
          "id": "z",
          "number": "2",
          "side": "opponent",
          "x": 69,
          "y": 7,
          "role": "ظهير"
        },
        {
          "id": "w",
          "number": "6",
          "side": "opponent",
          "x": 67,
          "y": 34,
          "role": "محور"
        }
      ],
      "ball": [
        67,
        34
      ],
      "arrows": []
    }
  ],
  "coaching": [
    "الضغط عمل جماعي.",
    "إغلاق الداخل مهم بقدر الاقتراب من الكرة."
  ],
  "drill": {
    "players": "4 ضاغطين ضد 4 لاعبين وحارس",
    "area": "نصف ملعب مصغّر، نحو 44 × 36 م",
    "duration": "8 دقائق: 3 جولات × دقيقتين وراحة دقيقة بين الجولات",
    "equipment": "كرات وأقماع وصديريات؛ مرمى في تمارين الإنهاء والحراس",
    "rules": [
      "يبدأ البناء من الحارس ويحاول الوصول لبوابتين.",
      "يبدأ الضغط بإشارة واضحة مع تدوير أدوار الفريقين."
    ],
    "easier": "نفّذ التحركات ببطء دون منافسة أولاً.",
    "harder": "اسمح للحارس ببدء اللعب إلى أي جهة.",
    "observe": "راقب انضباط المسافات والتغطية خلف أول ضاغط."
  },
  "reference": {
    "title": "FIFA — الضغط على ركلة المرمى",
    "url": "https://www.fifatrainingcentre.com/en/practice/talent-coach-programme/press-and-regain/8v8-attack-v-defence-pressing-the-goal-kick.php"
  }
},
  "corners": {
  "id": "corners",
  "title": "ركنية قصيرة وصناعة زاوية تمرير",
  "category": "الكرات الثابتة",
  "query": "اعرض تمرين الركنيات",
  "aliases": [
    "تمرين الركنيات",
    "الركنيات",
    "الركنية القصيرة",
    "corners"
  ],
  "intro": "تنفيذ قصير يغيّر زاوية الإرسال مع إبقاء لاعب لحماية المرتدة.",
  "objective": "تنسيق دعم المنفذ وتوقيت الدخول للمنطقة.",
  "frames": [
    {
      "title": "1. تحديد الأدوار",
      "instruction": "اتفق على المنفذ والدعم والتأمين قبل التنفيذ.",
      "players": [
        {
          "id": "a",
          "number": "7",
          "side": "team",
          "x": 101,
          "y": 4,
          "role": "منفذ"
        },
        {
          "id": "b",
          "number": "8",
          "side": "team",
          "x": 89,
          "y": 8,
          "role": "دعم قصير"
        },
        {
          "id": "c",
          "number": "9",
          "side": "team",
          "x": 87,
          "y": 39,
          "role": "مهاجم منطقة"
        },
        {
          "id": "d",
          "number": "6",
          "side": "team",
          "x": 65,
          "y": 29,
          "role": "تأمين"
        },
        {
          "id": "x",
          "number": "3",
          "side": "opponent",
          "x": 92,
          "y": 13,
          "role": "مراقبة القصير"
        },
        {
          "id": "y",
          "number": "4",
          "side": "opponent",
          "x": 91,
          "y": 34,
          "role": "مدافع منطقة"
        },
        {
          "id": "z",
          "number": "5",
          "side": "opponent",
          "x": 92,
          "y": 45,
          "role": "مدافع منطقة"
        },
        {
          "id": "k",
          "number": "1",
          "side": "opponent",
          "x": 100,
          "y": 34,
          "role": "حارس"
        }
      ],
      "ball": [
        101,
        4
      ],
      "arrows": []
    },
    {
      "title": "2. التمرير القصير",
      "instruction": "يدعم اللاعب 8 المنفذ لاستلام كرة قصيرة.",
      "players": [
        {
          "id": "a",
          "number": "7",
          "side": "team",
          "x": 101,
          "y": 4,
          "role": "منفذ"
        },
        {
          "id": "b",
          "number": "8",
          "side": "team",
          "x": 91,
          "y": 7,
          "role": "دعم قصير"
        },
        {
          "id": "c",
          "number": "9",
          "side": "team",
          "x": 87,
          "y": 39,
          "role": "مهاجم منطقة"
        },
        {
          "id": "d",
          "number": "6",
          "side": "team",
          "x": 65,
          "y": 29,
          "role": "تأمين"
        },
        {
          "id": "x",
          "number": "3",
          "side": "opponent",
          "x": 94,
          "y": 12,
          "role": "مراقبة القصير"
        },
        {
          "id": "y",
          "number": "4",
          "side": "opponent",
          "x": 91,
          "y": 34,
          "role": "مدافع منطقة"
        },
        {
          "id": "z",
          "number": "5",
          "side": "opponent",
          "x": 92,
          "y": 45,
          "role": "مدافع منطقة"
        },
        {
          "id": "k",
          "number": "1",
          "side": "opponent",
          "x": 100,
          "y": 34,
          "role": "حارس"
        }
      ],
      "ball": [
        91,
        7
      ],
      "arrows": [
        {
          "to": "b",
          "kind": "pass",
          "from": "a"
        }
      ]
    },
    {
      "title": "3. تغيير الزاوية",
      "instruction": "حرّك الكرة إلى زاوية جديدة بينما يتحرك مهاجم المنطقة.",
      "players": [
        {
          "id": "a",
          "number": "7",
          "side": "team",
          "x": 98,
          "y": 10,
          "role": "منفذ"
        },
        {
          "id": "b",
          "number": "8",
          "side": "team",
          "x": 91,
          "y": 16,
          "role": "دعم قصير"
        },
        {
          "id": "c",
          "number": "9",
          "side": "team",
          "x": 92,
          "y": 29,
          "role": "مهاجم منطقة"
        },
        {
          "id": "d",
          "number": "6",
          "side": "team",
          "x": 65,
          "y": 29,
          "role": "تأمين"
        },
        {
          "id": "x",
          "number": "3",
          "side": "opponent",
          "x": 95,
          "y": 15,
          "role": "مراقبة القصير"
        },
        {
          "id": "y",
          "number": "4",
          "side": "opponent",
          "x": 91,
          "y": 34,
          "role": "مدافع منطقة"
        },
        {
          "id": "z",
          "number": "5",
          "side": "opponent",
          "x": 92,
          "y": 45,
          "role": "مدافع منطقة"
        },
        {
          "id": "k",
          "number": "1",
          "side": "opponent",
          "x": 100,
          "y": 34,
          "role": "حارس"
        }
      ],
      "ball": [
        91,
        16
      ],
      "arrows": [
        {
          "to": "c",
          "kind": "pass",
          "from": "b"
        }
      ]
    },
    {
      "title": "4. مواصلة أو إعادة تدوير",
      "instruction": "إذا أغلق الدفاع الإرسال، يمكن العودة للدعم؛ يبقى التأمين خلف اللعب.",
      "players": [
        {
          "id": "a",
          "number": "7",
          "side": "team",
          "x": 97,
          "y": 13,
          "role": "منفذ"
        },
        {
          "id": "b",
          "number": "8",
          "side": "team",
          "x": 87,
          "y": 18,
          "role": "دعم قصير"
        },
        {
          "id": "c",
          "number": "9",
          "side": "team",
          "x": 94,
          "y": 28,
          "role": "مهاجم منطقة"
        },
        {
          "id": "d",
          "number": "6",
          "side": "team",
          "x": 69,
          "y": 28,
          "role": "تأمين"
        },
        {
          "id": "x",
          "number": "3",
          "side": "opponent",
          "x": 92,
          "y": 13,
          "role": "مراقبة القصير"
        },
        {
          "id": "y",
          "number": "4",
          "side": "opponent",
          "x": 91,
          "y": 34,
          "role": "مدافع منطقة"
        },
        {
          "id": "z",
          "number": "5",
          "side": "opponent",
          "x": 92,
          "y": 45,
          "role": "مدافع منطقة"
        },
        {
          "id": "k",
          "number": "1",
          "side": "opponent",
          "x": 100,
          "y": 34,
          "role": "حارس"
        }
      ],
      "ball": [
        69,
        28
      ],
      "arrows": [
        {
          "to": "d",
          "kind": "pass",
          "from": "b"
        }
      ]
    }
  ],
  "coaching": [
    "لا تعتمد على إعاقة المدافع.",
    "تغيير الزاوية أهم من تكرار تسلسل محفوظ."
  ],
  "drill": {
    "players": "4 مهاجمين ضد 3 مدافعين وحارس",
    "area": "ثلث ملعب قرب الركنية",
    "duration": "8 دقائق: 3 جولات × دقيقتين وراحة دقيقة بين الجولات",
    "equipment": "كرات وأقماع وصديريات؛ مرمى في تمارين الإنهاء والحراس",
    "rules": [
      "ابدأ بركنية قصيرة واسمح للدفاع بمنع الإرسال.",
      "أعد المحاولة من الجهتين مع الحفاظ على لاعب التأمين."
    ],
    "easier": "تدرّب دون ضغط على الدعم القصير.",
    "harder": "اجعل الدفاع حراً في الضغط على المنفذ والدعم.",
    "observe": "راقب توقيت الدعم وحماية الكرة الثانية والمرتدة."
  },
  "reference": {
    "title": "FIFA — التمريرات القصيرة من الركنية",
    "url": "https://www.fifatrainingcentre.com/en/resources-tools/football-language/in-possession/set-plays/corner/index.php"
  }
},
  "goalkeeping": {
  "id": "goalkeeping",
  "title": "تمركز الحارس في الانفراد",
  "category": "حراسة المرمى",
  "query": "اعرض تمرين حراسة المرمى",
  "aliases": [
    "تمرين حراسة المرمى",
    "تمركز الحارس",
    "حراسة المرمى",
    "goalkeeping"
  ],
  "intro": "يقرأ الحارس لمسة المهاجم ويختار التقدم أو الثبات حسب المسافة.",
  "objective": "تضييق الزاوية مع الحفاظ على الاتزان.",
  "frames": [
    {
      "title": "1. قراءة الموقف",
      "instruction": "يقف الحارس في زاوية مناسبة ويراقب الكرة.",
      "players": [
        {
          "id": "a",
          "number": "8",
          "side": "opponent",
          "x": 65,
          "y": 43,
          "role": "ممرر"
        },
        {
          "id": "x",
          "number": "9",
          "side": "opponent",
          "x": 77,
          "y": 31,
          "role": "مهاجم"
        },
        {
          "id": "g",
          "number": "1",
          "side": "team",
          "x": 99,
          "y": 34,
          "role": "حارس"
        }
      ],
      "ball": [
        65,
        43
      ],
      "arrows": []
    },
    {
      "title": "2. التمريرة للمهاجم",
      "instruction": "يتابع الحارس طول اللمسة الأولى قبل اختيار الخروج.",
      "players": [
        {
          "id": "a",
          "number": "8",
          "side": "opponent",
          "x": 65,
          "y": 43,
          "role": "ممرر"
        },
        {
          "id": "x",
          "number": "9",
          "side": "opponent",
          "x": 80,
          "y": 31,
          "role": "مهاجم"
        },
        {
          "id": "g",
          "number": "1",
          "side": "team",
          "x": 96,
          "y": 33,
          "role": "حارس"
        }
      ],
      "ball": [
        80,
        31
      ],
      "arrows": [
        {
          "to": "x",
          "kind": "pass",
          "from": "a"
        }
      ]
    },
    {
      "title": "3. تضييق الزاوية",
      "instruction": "يتقدم الحارس بخطوات متزنة عند توفر المسافة.",
      "players": [
        {
          "id": "a",
          "number": "8",
          "side": "opponent",
          "x": 65,
          "y": 43,
          "role": "ممرر"
        },
        {
          "id": "x",
          "number": "9",
          "side": "opponent",
          "x": 87,
          "y": 30,
          "role": "مهاجم"
        },
        {
          "id": "g",
          "number": "1",
          "side": "team",
          "x": 92,
          "y": 32,
          "role": "حارس"
        }
      ],
      "ball": [
        87,
        30
      ],
      "arrows": []
    },
    {
      "title": "4. الثبات للقرار",
      "instruction": "يستعد الحارس لتسديد أو مراوغة ولا يفترض نجاح التصدي.",
      "players": [
        {
          "id": "a",
          "number": "8",
          "side": "opponent",
          "x": 65,
          "y": 43,
          "role": "ممرر"
        },
        {
          "id": "x",
          "number": "9",
          "side": "opponent",
          "x": 89,
          "y": 30,
          "role": "مهاجم"
        },
        {
          "id": "g",
          "number": "1",
          "side": "team",
          "x": 92,
          "y": 31,
          "role": "حارس"
        }
      ],
      "ball": [
        91,
        31
      ],
      "arrows": [
        {
          "to": "g",
          "kind": "shot",
          "from": "x"
        }
      ]
    }
  ],
  "coaching": [
    "قلّل طول الخطوات عند الاقتراب.",
    "لا تفرض الخروج في كل محاولة."
  ],
  "drill": {
    "players": "حارس ومهاجم وممرر",
    "area": "منطقة جزاء مصغّرة نحو 24 × 20 م",
    "duration": "8 دقائق: 3 جولات × دقيقتين وراحة دقيقة بين الجولات",
    "equipment": "كرات وأقماع وصديريات؛ مرمى في تمارين الإنهاء والحراس",
    "rules": [
      "يبدأ الممرر كرة متفاوتة المسافة للمهاجم.",
      "تُعاد المحاولة بعد التسديد أو السيطرة مع تبديل المهاجم."
    ],
    "easier": "ابدأ بسرعة منخفضة ومسافة قرار كافية.",
    "harder": "نوّع زاوية البداية وطول التمريرة.",
    "observe": "قيّم القراءة والتمركز والاتزان بجانب نتيجة التصدي."
  },
  "reference": {
    "title": "FIFA — تمركز الحارس داخل الاستحواذ وخارجه",
    "url": "https://www.fifatrainingcentre.com/en/practice/elite-sessions/goalkeeper/in_and_out_of_possession.php"
  }
},
};
export const LESSON_CHOICES = Object.values(TACTICAL_LESSONS);
const normalized = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f\u064b-\u065f\u0640]/g,'').replace(/[أإآ]/g,'ا').replace(/ة/g,'ه').replace(/ى/g,'ي').replace(/[?!؟،.,]/g,'').replace(/\s+/g,' ').trim();
export function lessonByName(name: string): LessonId | null {
  if (Object.prototype.hasOwnProperty.call(TACTICAL_LESSONS,name)) return name as LessonId;
  const n=normalized(name);
  return LESSON_CHOICES.find(lesson=>[lesson.title,lesson.query,...lesson.aliases].some(alias=>normalized(alias)===n))?.id || null;
}
// Only explicit, supported lesson requests bypass live assistant research.
export function resolveTacticalRequest(query: string): LessonId | 'library' | null {
  if (['مكتبة التمارين','اعرض مكتبة التمارين','التمارين','تمارين','training library'].some(alias => normalized(alias) === normalized(query))) return 'library';
  const n=normalized(query).replace(/^(اعرض|اشرح|اريد|ابي|ابغي|ابغى|show|explain)\s+/,'');
  return lessonByName(n);
}

export function filterTacticalLessons(query: string, category: string) {
  const words = normalized(query).split(' ').filter(Boolean);
  return LESSON_CHOICES.filter(lesson => (category === 'all' || lesson.category === category) && words.every(word => normalized([lesson.title, lesson.objective, ...lesson.aliases].join(' ')).includes(word)));
}
