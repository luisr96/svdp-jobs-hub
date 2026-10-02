import type { Job, JobType } from './types';
import { parseArea, filterByArea, type Area } from './areas';

// Filters run on our cached data rather than as source query params: per-search API
// calls would break the caching rules and Remotive's ~4 calls/day limit.

export interface CategoryDef {
  value: string;
  label: string;
  match: RegExp; // tested against the source category and the title
}

export const REMOTE_CATEGORIES: CategoryDef[] = [
  {
    value: 'customer-support',
    label: 'Customer support',
    match: /customer (support|service|success|care|experience)|support (specialist|agent|representative)|call center|help ?desk/i,
  },
  {
    value: 'admin',
    label: 'Admin & data entry',
    match: /\badmin(istrat\w*)?\b|assistant|data entry|clerical|receptionist|bookkeep|scheduler/i,
  },
  {
    value: 'sales-marketing',
    label: 'Sales & marketing',
    match: /\bsales\b|marketing|business development|account (executive|manager)|\bseo\b|social media/i,
  },
  {
    value: 'tech',
    label: 'Tech',
    match: /software|developer|engineer|programming|devops|sysadmin|\bdata\b|\bqa\b|testing|cyber|\bit\b|web/i,
  },
];

export const LOCAL_CATEGORIES: CategoryDef[] = [
  {
    value: 'healthcare',
    label: 'Healthcare',
    match: /healthcare|nurs|medical|\bcna\b|\brn\b|caregiver|therap|pharm|dental|hospice/i,
  },
  { value: 'retail', label: 'Retail', match: /retail|store|cashier|merchandis|sales associate/i },
  {
    value: 'hospitality',
    label: 'Hospitality & food service',
    match: /hospitality|catering|restaurant|server|\bcook\b|chef|housekeep|hotel|dishwasher|barista|food/i,
  },
  {
    value: 'warehouse',
    label: 'Warehouse & logistics',
    match: /logistics|warehouse|driver|delivery|forklift|receiving|shipping/i,
  },
  {
    value: 'admin',
    label: 'Admin & office',
    match: /\badmin(istrat\w*)?\b|office|receptionist|clerical|secretar|data entry|front desk/i,
  },
];

export const JOB_TYPES: JobType[] = ['Full-time', 'Part-time', 'Contract'];

export type Sort = 'newest' | 'salary';
export type OpenTo = 'us' | 'anywhere';

export interface Filters {
  q: string;
  category: string; // '' = all
  type: JobType | '';
  where: OpenTo; // remote only
  area: Area; // local only
  sort: Sort;
}

export function parseFilters(params: URLSearchParams, categories: CategoryDef[]): Filters {
  const category = params.get('category') ?? '';
  const type = params.get('type') ?? '';
  return {
    q: (params.get('q') ?? '').trim().slice(0, 100),
    category: categories.some((c) => c.value === category) ? category : '',
    type: (JOB_TYPES as string[]).includes(type) ? (type as JobType) : '',
    where: params.get('where') === 'anywhere' ? 'anywhere' : 'us',
    area: parseArea(params.get('area')),
    sort: params.get('sort') === 'salary' ? 'salary' : 'newest',
  };
}

/** True when the visitor changed anything beyond the defaults (shows "Clear filters"). */
export function hasActiveFilters(f: Filters): boolean {
  return Boolean(f.q || f.category || f.type || f.where !== 'us' || f.area !== 'collier');
}

export function applyFilters(
  jobs: Job[],
  f: Filters,
  opts: { categories: CategoryDef[]; kind: 'remote' | 'local' },
): Job[] {
  let out = jobs;

  if (opts.kind === 'local') out = filterByArea(out, f.area);
  if (opts.kind === 'remote' && f.where === 'us') out = out.filter(isOpenToUs);

  if (f.type) out = out.filter((j) => j.jobType === f.type);

  const cat = opts.categories.find((c) => c.value === f.category);
  // Title + the source's own category only; tags are too noisy (Remotive jobs can carry 40+).
  if (cat) out = out.filter((j) => cat.match.test(`${j.category ?? ''} ${j.title}`));

  const words = f.q.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length) {
    out = out.filter((j) => {
      const text = [j.title, j.company, j.category, j.location, ...(j.tags ?? [])].join(' ').toLowerCase();
      return words.every((w) => text.includes(w));
    });
  }

  return sortJobs(out, f.sort);
}

// Location labels always keep "US" when a job allows US applicants (see location.ts).
function isOpenToUs(j: Job): boolean {
  return /\bUS\b|Anywhere|North(ern)? America|\bAmericas\b/i.test(j.location);
}

export function sortJobs(jobs: Job[], sort: Sort): Job[] {
  const byNewest = (a: Job, b: Job) => b.postedAt.localeCompare(a.postedAt);
  const sorted = [...jobs].sort(byNewest);
  if (sort === 'salary') sorted.sort((a, b) => Number(Boolean(b.salary)) - Number(Boolean(a.salary)));
  return sorted;
}
