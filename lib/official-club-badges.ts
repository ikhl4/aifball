export function officialClubBadge(name: string): string | undefined {
  const normalized = name.trim().toLowerCase().replace(/[\s-]+/g, ' ');
  if (/^(الفتح|al (?:fateh|fath)(?: (?:fc|sc))?)$/.test(normalized)) {
    return '/club-badges/al-fateh.webp';
  }
  if (/^(الخليج|al khaleej(?: (?:fc|sc|saihat))?)$/.test(normalized)) {
    return '/club-badges/al-khaleej.webp';
  }
}
