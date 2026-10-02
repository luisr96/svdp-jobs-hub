import type { Job, JobType } from '../types';

// Terms: link to Adzuna's redirect_url and credit Adzuna.
const API_URL = 'https://api.adzuna.com/v1/api/jobs/us/search';
const SOURCE = 'Adzuna';
// Query by county rather than radius: Collier is the default Area, Lee is opt-in.
// 50 results per page; 3 calls per refresh.
const COUNTIES = [
  { name: 'Collier County', pages: 2 },
  { name: 'Lee County', pages: 1 },
];

interface AdzunaJob {
  id: string;
  title: string;
  redirect_url: string;
  created?: string;
  company?: { display_name?: string };
  location?: { display_name?: string; area?: string[] };
  category?: { label?: string };
  contract_time?: 'full_time' | 'part_time';
  contract_type?: 'permanent' | 'contract';
  salary_min?: number;
  salary_max?: number;
  salary_is_predicted?: string;
}

export async function fetchAdzuna(): Promise<Job[]> {
  const appId = import.meta.env.ADZUNA_APP_ID;
  const appKey = import.meta.env.ADZUNA_APP_KEY;
  if (!appId || !appKey) throw new Error('ADZUNA_APP_ID / ADZUNA_APP_KEY are not set in .env');

  const requests = COUNTIES.flatMap((c) =>
    Array.from({ length: c.pages }, (_, i) => fetchPage(c.name, i + 1, appId, appKey)),
  );
  const pages = await Promise.all(requests);
  return pages.flat().flatMap(toJob);
}

async function fetchPage(county: string, page: number, appId: string, appKey: string): Promise<AdzunaJob[]> {
  const params = new URLSearchParams({
    app_id: appId,
    app_key: appKey,
    location0: 'US',
    location1: 'Florida',
    location2: county,
    results_per_page: '50',
    sort_by: 'date',
  });
  const res = await fetch(`${API_URL}/${page}?${params}`, { signal: AbortSignal.timeout(15_000) });
  // Don't include the URL in the error: it contains the API key.
  if (!res.ok) throw new Error(`Adzuna API returned ${res.status} for ${county} page ${page}`);
  const data = (await res.json()) as { results?: AdzunaJob[] };
  return data.results ?? [];
}

function toJob(j: AdzunaJob): Job[] {
  if (!j.redirect_url || !j.title) return [];
  const created = j.created ? new Date(j.created) : new Date();
  return [
    {
      id: `adzuna:${j.id}`,
      source: SOURCE,
      title: tidyTitle(j.title),
      company: j.company?.display_name?.trim() ?? '',
      location: formatLocation(j.location),
      remote: false,
      jobType: j.contract_type === 'contract' ? 'Contract' : normalizeTime(j.contract_time),
      salary: formatSalary(j),
      url: j.redirect_url,
      postedAt: Number.isNaN(created.getTime()) ? new Date().toISOString() : created.toISOString(),
      category: j.category?.label?.replace(/ Jobs$/, ''),
      county: j.location?.area?.[2],
      city: j.location?.area?.[3],
    } satisfies Job,
  ];
}

function normalizeTime(t?: string): JobType | null {
  if (t === 'full_time') return 'Full-time';
  if (t === 'part_time') return 'Part-time';
  return null;
}

// Adzuna titles can contain <strong> highlight tags and are sometimes ALL CAPS.
function tidyTitle(raw: string): string {
  const t = raw.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  if (t !== t.toUpperCase() || !/[A-Z]/.test(t)) return t;
  return t.toLowerCase().replace(/\b([a-z])/g, (c) => c.toUpperCase());
}

// area is ['US', 'Florida', 'Collier County', 'Naples'].
function formatLocation(loc: AdzunaJob['location']): string {
  const area = loc?.area ?? [];
  const city = area[3] ?? area[2];
  const state = area[1] === 'Florida' ? 'FL' : area[1];
  if (city && state) return `${city}, ${state}`;
  return loc?.display_name ?? 'Southwest Florida';
}

// Only show pay the employer actually listed; Adzuna's predicted salaries are estimates.
function formatSalary(j: AdzunaJob): string | undefined {
  if (j.salary_is_predicted === '1' || (!j.salary_min && !j.salary_max)) return undefined;
  const lo = j.salary_min ?? j.salary_max!;
  const hi = j.salary_max ?? lo;
  const hourly = hi < 200; // Adzuna reports hourly pay as small numbers
  const fmt = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: hourly ? 2 : 0,
  });
  const range = Math.round(lo) === Math.round(hi) ? fmt.format(lo) : `${fmt.format(lo)}–${fmt.format(hi)}`;
  return `${range}${hourly ? ' / hour' : ' / year'}`;
}
