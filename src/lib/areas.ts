import type { Job } from './types';

// Local Jobs "Area" filter. Options nest (Naples ⊂ Collier ⊂ Collier + Lee), so one choice is enough.
export const AREAS = [
  { value: 'collier', label: 'Collier County' },
  { value: 'naples', label: 'Naples area' },
  { value: 'immokalee', label: 'Immokalee' },
  { value: 'collier-lee', label: 'Include Lee County' },
] as const;

export type Area = (typeof AREAS)[number]['value'];
export const DEFAULT_AREA: Area = 'collier';

export function parseArea(raw: string | null): Area {
  return AREAS.some((a) => a.value === raw) ? (raw as Area) : DEFAULT_AREA;
}

// Collier towns that aren't part of greater Naples (Golden Gate, Vanderbilt, etc. are).
const NOT_NAPLES = new Set(['Immokalee', 'Marco Island', 'Ave Maria', 'Everglades City', 'Chokoloskee', 'Copeland']);

export function filterByArea(jobs: Job[], area: Area): Job[] {
  switch (area) {
    case 'collier': return jobs.filter((j) => j.county === 'Collier County');
    case 'naples': return jobs.filter((j) => j.county === 'Collier County' && !NOT_NAPLES.has(j.city ?? ''));
    case 'immokalee': return jobs.filter((j) => j.city === 'Immokalee');
    case 'collier-lee': return jobs.filter((j) => j.county === 'Collier County' || j.county === 'Lee County');
  }
}
