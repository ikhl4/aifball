export const footballGroups = [
  { id: 'featured', ar: 'البطولات الكبرى', en: 'Major competitions', leagues: [
    ['ksa.1', 'دوري روشن السعودي', 'Saudi Pro League'],
    ['eng.1', 'الدوري الإنجليزي الممتاز', 'Premier League'],
    ['esp.1', 'الدوري الإسباني', 'La Liga'],
    ['ita.1', 'الدوري الإيطالي', 'Serie A'],
    ['ger.1', 'الدوري الألماني', 'Bundesliga'],
    ['fra.1', 'الدوري الفرنسي', 'Ligue 1'],
    ['uefa.champions', 'دوري أبطال أوروبا', 'Champions League'],
    ['uefa.europa', 'الدوري الأوروبي', 'Europa League'],
    ['uefa.europa.conf', 'دوري المؤتمر الأوروبي', 'Conference League'],
    ['afc.champions', 'دوري أبطال آسيا للنخبة', 'AFC Champions League Elite'],
  ] },
  { id: 'international', ar: 'المنتخبات', en: 'International', leagues: [
    ['fifa.friendly', 'وديات المنتخبات', 'International friendlies'],
    ['uefa.nations', 'دوري الأمم الأوروبية', 'UEFA Nations League'],
    ['caf.nations_qual', 'تصفيات كأس أمم أفريقيا', 'AFCON qualifiers'],
    ['fifa.world', 'كأس العالم', 'World Cup'],
    ['fifa.worldq.afc', 'تصفيات كأس العالم لآسيا', 'Asian World Cup qualifiers'],
    ['fifa.worldq.uefa', 'تصفيات كأس العالم لأوروبا', 'European World Cup qualifiers'],
    ['fifa.worldq.caf', 'تصفيات كأس العالم لأفريقيا', 'African World Cup qualifiers'],
    ['fifa.worldq.conmebol', 'تصفيات كأس العالم لأمريكا الجنوبية', 'South American World Cup qualifiers'],
    ['fifa.worldq.concacaf', 'تصفيات كأس العالم للكونكاكاف', 'CONCACAF World Cup qualifiers'],
    ['fifa.worldq.ofc', 'تصفيات كأس العالم لأوقيانوسيا', 'Oceania World Cup qualifiers'],
    ['afc.asian.cup', 'كأس آسيا', 'Asian Cup'],
    ['uefa.euro', 'كأس أمم أوروبا', 'European Championship'],
    ['uefa.euroq', 'تصفيات كأس أمم أوروبا', 'European Championship qualifiers'],
    ['caf.nations', 'كأس أمم أفريقيا', 'Africa Cup of Nations'],
    ['conmebol.america', 'كوبا أمريكا', 'Copa América'],
    ['concacaf.gold', 'الكأس الذهبية', 'Gold Cup'],
    ['concacaf.nations.league', 'دوري أمم الكونكاكاف', 'CONCACAF Nations League'],
    ['fifa.world.u20', 'كأس العالم تحت ٢٠ سنة', 'U-20 World Cup'],
    ['fifa.world.u17', 'كأس العالم تحت ١٧ سنة', 'U-17 World Cup'],
  ] },
  { id: 'world', ar: 'دوريات العالم', en: 'World leagues', leagues: [
    ['usa.1', 'الدوري الأمريكي', 'MLS'],
    ['bra.1', 'الدوري البرازيلي', 'Brazilian Série A'],
    ['arg.1', 'الدوري الأرجنتيني', 'Argentine Primera División'],
    ['mex.1', 'الدوري المكسيكي', 'Liga MX'],
    ['por.1', 'الدوري البرتغالي', 'Primeira Liga'],
    ['ned.1', 'الدوري الهولندي', 'Eredivisie'],
    ['tur.1', 'الدوري التركي', 'Süper Lig'],
    ['sco.1', 'الدوري الاسكتلندي', 'Scottish Premiership'],
    ['jpn.1', 'الدوري الياباني', 'J1 League'],
    ['all', 'بطولات عالمية أخرى', 'Other world competitions'],
  ] },
] as const;

export const footballLeagues = footballGroups.flatMap(group => [...group.leagues]);
export type ScoresLanguage = 'ar' | 'en';
export type FootballTeam = { id: string; displayName?: string; shortDisplayName?: string; name?: string; logo?: string };
export type FootballEvent = {
  id: string; date: string;
  competitions?: { competitors?: { homeAway: string; team?: FootballTeam; score?: string }[] }[];
  status?: { displayClock?: string; type?: { name?: string; state?: string } };
};
export type FootballBoard = { matches: Record<string, FootballEvent[]>; failed: number };
