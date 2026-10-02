// Builds a short "Remote · ..." label from a source's list of allowed countries/regions.
const US = /^(usa|us|u\.s\.a?\.?|united states( of america)?)$/i;
const ANYWHERE = /^(anywhere|worldwide|anywhere in the world|global)$/i;

export function splitPlaces(raw: string | undefined): string[] {
  return (raw ?? '')
    .split(/,\s*(?:and\s+)?|\s+and\s+/)
    .map((p) => p.replace(/\p{Regional_Indicator}/gu, '').trim())
    .filter(Boolean);
}

export function remoteLocation(places: string[]): string {
  const list = [
    ...new Set(places.filter((p) => !/time\s?zones?/i.test(p)).map((p) => (US.test(p) ? 'US' : p))),
  ];
  if (list.length === 0 || list.some((p) => ANYWHERE.test(p))) return 'Remote · Anywhere';
  if (list.length === 1 && list[0] === 'US') return 'Remote · US only';
  if (list.length === 1) return `Remote · ${list[0]} only`;
  if (list.length <= 3) return `Remote · ${list.join(', ')}`;
  return list.includes('US') ? 'Remote · US and other countries' : 'Remote · Selected countries';
}
