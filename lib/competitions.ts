export interface Competition {
  ar: string;
  en: string;
  kind: 'club' | 'national';
  seasonFormat: 'calendar' | 'split';
  aliases: string[];
  fotmobId?: number;
  /** Competitions available through verified official-site search, not ESPN widgets. */
  searchOnly?: boolean;
  standingsSource?: 'SAFF';
  officialUrl?: string;
}

// Verified ESPN standings identifiers; missing tables stay explicitly unavailable.
export const COMPETITIONS: Record<string, Competition> = {
  "ksa.1": {
    "ar": "دوري روشن السعودي",
    "en": "Saudi Pro League",
    "kind": "club",
    "seasonFormat": "split",
    "aliases": [
      "الدوري السعودي",
      "روشن",
      "الدوري السعودي للمحترفين"
    ],
    "fotmobId": 536
  },
  "ksa.jawwy.u21": {
    "ar": "دوري جوّي للنخبة تحت 21",
    "en": "Jawwy Elite League U21",
    "kind": "club",
    "seasonFormat": "split",
    "searchOnly": true,
    "standingsSource": "SAFF",
    "officialUrl": "https://www.saff.com.sa/championship.php?id=419&type=all",
    "aliases": [
      "دوري جوي",
      "دوري جوّي",
      "جوي للنخبة تحت 21",
      "دوري جوي للنخبة تحت 21",
      "jawwy elite league",
      "jawwy elite league u21"
    ]
  },
  "eng.1": {
    "ar": "الدوري الإنجليزي الممتاز",
    "en": "Premier League",
    "kind": "club",
    "seasonFormat": "split",
    "aliases": [
      "الدوري الانجليزي",
      "البريميرليج",
      "البريميرليغ",
      "english premier league",
      "epl"
    ],
    "fotmobId": 47
  },
  "esp.1": {
    "ar": "الدوري الإسباني",
    "en": "LaLiga",
    "kind": "club",
    "seasonFormat": "split",
    "aliases": [
      "الدوري الاسباني",
      "الليغا",
      "la liga"
    ],
    "fotmobId": 87
  },
  "ita.1": {
    "ar": "الدوري الإيطالي",
    "en": "Serie A",
    "kind": "club",
    "seasonFormat": "split",
    "aliases": [
      "الدوري الايطالي",
      "الكالتشيو",
      "italian serie a"
    ],
    "fotmobId": 55
  },
  "ger.1": {
    "ar": "الدوري الألماني",
    "en": "Bundesliga",
    "kind": "club",
    "seasonFormat": "split",
    "aliases": [
      "الدوري الالماني",
      "البوندسليغا"
    ],
    "fotmobId": 54
  },
  "fra.1": {
    "ar": "الدوري الفرنسي",
    "en": "Ligue 1",
    "kind": "club",
    "seasonFormat": "split",
    "aliases": [
      "الدوري الفرنسي",
      "ligue one"
    ],
    "fotmobId": 53
  },
  "usa.1": {
    "ar": "الدوري الأمريكي MLS",
    "en": "Major League Soccer",
    "kind": "club",
    "seasonFormat": "calendar",
    "aliases": [
      "الدوري الامريكي",
      "mls"
    ]
  },
  "uefa.champions": {
    "ar": "دوري أبطال أوروبا",
    "en": "UEFA Champions League",
    "kind": "club",
    "seasonFormat": "split",
    "aliases": [
      "ابطال اوروبا",
      "تشامبيونز ليغ",
      "ucl"
    ],
    "fotmobId": 42
  },
  "afc.champions": {
    "ar": "دوري أبطال آسيا للنخبة",
    "en": "AFC Champions League Elite",
    "kind": "club",
    "seasonFormat": "split",
    "aliases": [
      "نخبة اسيا",
      "نخبه اسيا",
      "النخبة الاسيوية",
      "دوري النخبة",
      "دوري ابطال اسيا",
      "اسيا للنخبة",
      "اسيا للنخبه"
    ]
  },
  "uefa.europa": {
    "ar": "الدوري الأوروبي",
    "en": "UEFA Europa League",
    "kind": "club",
    "seasonFormat": "split",
    "aliases": [
      "الدوري الاوروبي",
      "يوروبا ليغ",
      "يوروبا ليج"
    ]
  },
  "uefa.europa.conf": {
    "ar": "دوري المؤتمر الأوروبي",
    "en": "UEFA Conference League",
    "kind": "club",
    "seasonFormat": "split",
    "aliases": [
      "دوري المؤتمر",
      "المؤتمر الاوروبي"
    ]
  },
  "afc.cup": {
    "ar": "دوري أبطال آسيا 2",
    "en": "AFC Champions League Two",
    "kind": "club",
    "seasonFormat": "split",
    "aliases": [
      "ابطال اسيا 2",
      "ابطال اسيا الثاني",
      "كاس الاتحاد الاسيوي"
    ]
  },
  "conmebol.libertadores": {
    "ar": "كوبا ليبرتادوريس",
    "en": "CONMEBOL Libertadores",
    "kind": "club",
    "seasonFormat": "calendar",
    "aliases": [
      "ليبرتادوريس",
      "كوبا ليبرتادورس"
    ]
  },
  "conmebol.sudamericana": {
    "ar": "كوبا سودأمريكانا",
    "en": "CONMEBOL Sudamericana",
    "kind": "club",
    "seasonFormat": "calendar",
    "aliases": [
      "سودامريكانا",
      "سود امريكانا"
    ]
  },
  "por.1": {
    "ar": "الدوري البرتغالي",
    "en": "Primeira Liga",
    "kind": "club",
    "seasonFormat": "split",
    "aliases": [
      "الدوري البرتغالي",
      "portuguese league"
    ]
  },
  "ned.1": {
    "ar": "الدوري الهولندي",
    "en": "Eredivisie",
    "kind": "club",
    "seasonFormat": "split",
    "aliases": [
      "الدوري الهولندي",
      "dutch league"
    ]
  },
  "tur.1": {
    "ar": "الدوري التركي",
    "en": "Turkish Super Lig",
    "kind": "club",
    "seasonFormat": "split",
    "aliases": [
      "الدوري التركي"
    ]
  },
  "bel.1": {
    "ar": "الدوري البلجيكي",
    "en": "Belgian Pro League",
    "kind": "club",
    "seasonFormat": "split",
    "aliases": [
      "الدوري البلجيكي"
    ]
  },
  "sco.1": {
    "ar": "الدوري الإسكتلندي",
    "en": "Scottish Premiership",
    "kind": "club",
    "seasonFormat": "split",
    "aliases": [
      "الدوري الاسكتلندي"
    ]
  },
  "bra.1": {
    "ar": "الدوري البرازيلي",
    "en": "Brazilian Serie A",
    "kind": "club",
    "seasonFormat": "calendar",
    "aliases": [
      "الدوري البرازيلي",
      "brasileirao"
    ]
  },
  "arg.1": {
    "ar": "الدوري الأرجنتيني",
    "en": "Argentine Liga Profesional",
    "kind": "club",
    "seasonFormat": "calendar",
    "aliases": [
      "الدوري الارجنتيني"
    ]
  },
  "mex.1": {
    "ar": "الدوري المكسيكي",
    "en": "Liga MX",
    "kind": "club",
    "seasonFormat": "split",
    "aliases": [
      "الدوري المكسيكي"
    ]
  },
  "jpn.1": {
    "ar": "الدوري الياباني",
    "en": "J1 League",
    "kind": "club",
    "seasonFormat": "split",
    "aliases": [
      "الدوري الياباني"
    ]
  },
  "aus.1": {
    "ar": "الدوري الأسترالي",
    "en": "A-League Men",
    "kind": "club",
    "seasonFormat": "split",
    "aliases": [
      "الدوري الاسترالي"
    ]
  },
  "fifa.world": {
    "ar": "كأس العالم للمنتخبات",
    "en": "FIFA World Cup",
    "kind": "national",
    "seasonFormat": "calendar",
    "aliases": [
      "كاس العالم",
      "world cup"
    ]
  },
  "fifa.worldq.afc": {
    "ar": "تصفيات كأس العالم — آسيا",
    "en": "World Cup Qualifying — AFC",
    "kind": "national",
    "seasonFormat": "calendar",
    "aliases": [
      "تصفيات اسيا",
      "تصفيات كاس العالم اسيا",
      "التصفيات الاسيوية",
      "world cup qualifying afc"
    ]
  },
  "fifa.worldq.uefa": {
    "ar": "تصفيات كأس العالم — أوروبا",
    "en": "World Cup Qualifying — UEFA",
    "kind": "national",
    "seasonFormat": "calendar",
    "aliases": [
      "تصفيات اوروبا لكاس العالم",
      "تصفيات كاس العالم اوروبا",
      "world cup qualifying uefa"
    ]
  },
  "fifa.worldq.caf": {
    "ar": "تصفيات كأس العالم — أفريقيا",
    "en": "World Cup Qualifying — CAF",
    "kind": "national",
    "seasonFormat": "calendar",
    "aliases": [
      "تصفيات افريقيا لكاس العالم",
      "تصفيات كاس العالم افريقيا",
      "world cup qualifying caf"
    ]
  },
  "fifa.worldq.conmebol": {
    "ar": "تصفيات كأس العالم — أمريكا الجنوبية",
    "en": "World Cup Qualifying — CONMEBOL",
    "kind": "national",
    "seasonFormat": "calendar",
    "aliases": [
      "تصفيات امريكا الجنوبية",
      "تصفيات كاس العالم امريكا الجنوبية"
    ]
  },
  "fifa.worldq.concacaf": {
    "ar": "تصفيات كأس العالم — كونكاكاف",
    "en": "World Cup Qualifying — Concacaf",
    "kind": "national",
    "seasonFormat": "calendar",
    "aliases": [
      "تصفيات الكونكاكاف",
      "تصفيات كاس العالم كونكاكاف"
    ]
  },
  "fifa.worldq.ofc": {
    "ar": "تصفيات كأس العالم — أوقيانوسيا",
    "en": "World Cup Qualifying — OFC",
    "kind": "national",
    "seasonFormat": "calendar",
    "aliases": [
      "تصفيات اوقيانوسيا",
      "تصفيات كاس العالم اوقيانوسيا"
    ]
  },
  "afc.asian.cup": {
    "ar": "كأس آسيا للمنتخبات",
    "en": "AFC Asian Cup",
    "kind": "national",
    "seasonFormat": "calendar",
    "aliases": [
      "كاس اسيا",
      "asian cup"
    ]
  },
  "uefa.euro": {
    "ar": "كأس أمم أوروبا",
    "en": "UEFA European Championship",
    "kind": "national",
    "seasonFormat": "calendar",
    "aliases": [
      "اليورو",
      "كاس امم اوروبا",
      "euro"
    ]
  },
  "uefa.euroq": {
    "ar": "تصفيات كأس أمم أوروبا",
    "en": "European Championship Qualifying",
    "kind": "national",
    "seasonFormat": "calendar",
    "aliases": [
      "تصفيات اليورو",
      "تصفيات امم اوروبا"
    ]
  },
  "uefa.nations": {
    "ar": "دوري الأمم الأوروبية",
    "en": "UEFA Nations League",
    "kind": "national",
    "seasonFormat": "split",
    "aliases": [
      "دوري الامم الاوروبية",
      "امم اوروبا للمنتخبات"
    ]
  },
  "caf.nations": {
    "ar": "كأس أمم أفريقيا",
    "en": "Africa Cup of Nations",
    "kind": "national",
    "seasonFormat": "calendar",
    "aliases": [
      "امم افريقيا",
      "كاس افريقيا",
      "afcon"
    ]
  },
  "caf.nations_qual": {
    "ar": "تصفيات كأس أمم أفريقيا",
    "en": "Africa Cup of Nations Qualifying",
    "kind": "national",
    "seasonFormat": "calendar",
    "aliases": [
      "تصفيات امم افريقيا",
      "تصفيات كاس افريقيا"
    ]
  },
  "conmebol.america": {
    "ar": "كوبا أمريكا",
    "en": "Copa América",
    "kind": "national",
    "seasonFormat": "calendar",
    "aliases": [
      "كوبا امريكا",
      "copa america"
    ]
  },
  "concacaf.gold": {
    "ar": "الكأس الذهبية",
    "en": "Concacaf Gold Cup",
    "kind": "national",
    "seasonFormat": "calendar",
    "aliases": [
      "الكاس الذهبية",
      "الكاس الذهبيه",
      "gold cup"
    ]
  },
  "concacaf.nations.league": {
    "ar": "دوري أمم الكونكاكاف",
    "en": "Concacaf Nations League",
    "kind": "national",
    "seasonFormat": "split",
    "aliases": [
      "دوري امم الكونكاكاف",
      "امم الكونكاكاف"
    ]
  },
  "caf.champions": {
    "ar": "دوري أبطال أفريقيا",
    "en": "CAF Champions League",
    "kind": "club",
    "seasonFormat": "split",
    "aliases": [
      "ابطال افريقيا",
      "دوري الابطال الافريقي"
    ]
  },
  "caf.confed": {
    "ar": "كأس الكونفدرالية الأفريقية",
    "en": "CAF Confederation Cup",
    "kind": "club",
    "seasonFormat": "split",
    "aliases": [
      "الكونفدرالية",
      "كاس الاتحاد الافريقي"
    ]
  },
  "fifa.cwc": {
    "ar": "كأس العالم للأندية",
    "en": "FIFA Club World Cup",
    "kind": "club",
    "seasonFormat": "calendar",
    "aliases": [
      "كاس العالم للانديه",
      "مونديال الانديه",
      "club world cup"
    ]
  }
};

function normalize(value: string): string {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f\u064b-\u065f\u0670ـ]/g, '')
    .replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه')
    .replace(/[٠-٩]/g, digit => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
    .replace(/[—–_.,!?؟،:؛/\-]+/g, ' ').replace(/\s+/g, ' ').trim();
}

// Handle only explicit, unambiguous table requests. Analysis, rankings and
// comparisons continue through the existing assistant workflow.
export function resolveStandingsRequest(query: string): { league: string; season: string } | null {
  const input = normalize(query);
  if (!/(?:جدول|ترتيب|standings|table)/i.test(input) ||
      /(?:تصنيف|fifa ranking|world ranking|قارن|مقارنه|لماذا|ليش|حلل|تحليل|توقع|هداف|صناع|scorer|assist|مباريات|مواعيد|نتائج|fixtures|schedule)/i.test(input)) return null;
  if (/(?:\sو(?:ال|دوري|كاس)|\band\b)/i.test(input)) return null;
  const matchingInput = input.replace(/\b(?:19|20)\d{2}(?:\s+(?:\d{2}|(?:19|20)\d{2}))?\b/g, ' ').replace(/\s+/g, ' ').trim();
  const matches = Object.entries(COMPETITIONS).map(([league, competition]) => {
    const names = [league, competition.ar, competition.en, ...competition.aliases];
    const score = Math.max(0, ...names.map(name => {
      const alias = normalize(name);
      return (` ${matchingInput} `).includes(` ${alias} `) ? alias.length : 0;
    }));
    return { league, score };
  }).filter(match => match.score > 0).sort((a, b) => b.score - a.score);
  if (!matches.length || matches[0].score === matches[1]?.score) return null;
  // Requests naming more than one independent competition are not intercepted.
  if (matches[0].league === 'fifa.world' && /(?:تصفيات|qualif|للانديه|للاندية|club)/i.test(input)) return null;
  const winner = COMPETITIONS[matches[0].league];
  if (winner.searchOnly && !winner.standingsSource) return null;
  const winningAliases = [winner.ar, winner.en, ...winner.aliases].map(normalize);
  if (matches.slice(1).some(match => !winningAliases.some(alias =>
    [COMPETITIONS[match.league].ar, COMPETITIONS[match.league].en, ...COMPETITIONS[match.league].aliases]
      .map(normalize).some(other => alias.includes(other))))) return null;
  const year = input.match(/\b((?:19|20)\d{2})(?:\s+(\d{2}|(?:19|20)\d{2}))?\b/);
  return { league: matches[0].league, season: year ? year[1] + (year[2] ? '-' + year[2] : '') : '' };
}

