import type { Job, JobType } from '../types';
import { remoteLocation, splitPlaces } from '../location';

// Terms: credit Jobicy with a link, and send applicants to the original job URL.
const API_URL = 'https://jobicy.com/api/v2/remote-jobs?count=50&geo=usa';
const SOURCE = 'Jobicy';

interface JobicyJob {
  id: number;
  url: string;
  jobTitle: string;
  companyName: string;
  jobIndustry?: string[];
  jobType?: string[];
  jobGeo?: string;
  pubDate?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  salaryPeriod?: string;
}

export async function fetchJobicy(): Promise<Job[]> {
  const res = await fetch(API_URL, { signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`Jobicy API returned ${res.status}`);
  const data = (await res.json()) as { jobs?: JobicyJob[] };

  return (data.jobs ?? []).flatMap((j) => {
    if (!j.url || !j.jobTitle) return [];
    const postedAt = j.pubDate ? new Date(j.pubDate) : new Date();
    return [
      {
        id: `jobicy:${j.id}`,
        source: SOURCE,
        title: j.jobTitle.trim(),
        company: j.companyName?.trim() ?? '',
        location: remoteLocation(splitPlaces(j.jobGeo)),
        remote: true,
        jobType: normalizeType(j.jobType?.[0]),
        salary: formatSalary(j),
        url: j.url,
        postedAt: Number.isNaN(postedAt.getTime()) ? new Date().toISOString() : postedAt.toISOString(),
        category: j.jobIndustry?.[0],
        tags: j.jobIndustry,
      } satisfies Job,
    ];
  });
}

function normalizeType(raw?: string): JobType | null {
  const t = raw?.toLowerCase() ?? '';
  if (t.includes('full')) return 'Full-time';
  if (t.includes('part')) return 'Part-time';
  if (t.includes('contract') || t.includes('freelance')) return 'Contract';
  if (t.includes('intern')) return 'Internship';
  if (t.includes('temp')) return 'Temporary';
  return null;
}

function formatSalary(j: JobicyJob): string | undefined {
  if (!j.salaryMin && !j.salaryMax) return undefined;
  const fmt = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: j.salaryCurrency || 'USD',
    maximumFractionDigits: 0,
  });
  const range = j.salaryMin && j.salaryMax && j.salaryMin !== j.salaryMax
    ? `${fmt.format(j.salaryMin)}–${fmt.format(j.salaryMax)}`
    : fmt.format((j.salaryMin || j.salaryMax)!);
  const period = { yearly: ' / year', monthly: ' / month', weekly: ' / week', hourly: ' / hour' }[j.salaryPeriod ?? ''] ?? '';
  return range + period;
}
