export const appleCompetitions = {
  football: ['SPL', 'EPL', 'LA_LIGA', 'ITSA', 'BUND', 'FXL1', 'UEFA_CHM', 'UEFA_EU', 'UECL', 'MLS'],
  basketball: ['NBA', 'WNBA', 'CBK_NCAA_TOUR', 'WCBK_NCAA_TOUR'],
  tennis: ['ATP', 'WTA'],
  americanFootball: ['NFL', 'CFB'],
  baseball: ['MLB'],
  hockey: ['NHL'],
  motorsport: ['FORMULA1', 'NASCAR'],
  golf: ['PGA', 'LPGA'],
  combat: ['UFC'],
} as const;

export const appleCompetitionNames: Record<string, string> = {
  SPL: 'دوري روشن السعودي', EPL: 'الدوري الإنجليزي', LA_LIGA: 'الدوري الإسباني',
  ITSA: 'الدوري الإيطالي', BUND: 'الدوري الألماني', FXL1: 'الدوري الفرنسي',
  UEFA_CHM: 'دوري أبطال أوروبا', UEFA_EU: 'الدوري الأوروبي', UECL: 'دوري المؤتمر',
  MLS: 'الدوري الأمريكي', NBA: 'الدوري الأمريكي للمحترفين', WNBA: 'الدوري الأمريكي للسيدات',
  CBK_NCAA_TOUR: 'الجامعات الأمريكية للرجال', WCBK_NCAA_TOUR: 'الجامعات الأمريكية للسيدات',
  ATP: 'جولة محترفي التنس', WTA: 'جولة محترفات التنس',
  NFL: 'الدوري الأمريكي للمحترفين', CFB: 'دوري الجامعات الأمريكية',
  MLB: 'دوري البيسبول الرئيسي', NHL: 'دوري الهوكي الوطني',
  FORMULA1: 'فورمولا ١', NASCAR: 'ناسكار',
  PGA: 'جولة الغولف للمحترفين', LPGA: 'جولة الغولف للمحترفات',
  UFC: 'بطولة القتال النهائي',
};

export type AppleSport = keyof typeof appleCompetitions;
export type AppleStatus = 'live' | 'final' | 'scheduled' | 'other';
export type AppleStat = { name: string; value: number };
export type AppleSide = {
  name: string;
  englishName?: string;
  score: number | null;
  periods: { index: number; score: number }[];
  formation?: string;
  rank?: number;
  winner?: boolean;
  stats: AppleStat[];
  players: { id: string; name: string; englishName?: string; position?: string; starter?: boolean; stats: AppleStat[] }[];
};

export type AppleMatch = {
  id: string; name: string; englishName?: string; competition: string; start: string; timeTbd: boolean;
  status: AppleStatus; statusLabel?: string; period?: { type: string; index: number };
  clock?: string; venue?: string; englishVenue?: string; sides: AppleSide[];
  format?: 'tennis' | 'golf' | 'race' | 'fight';
};

export type AppleStanding = { id: string; name: string; stats: AppleStat[] };
export type AppleSchedule = { matches: AppleMatch[]; failed: string[] };
