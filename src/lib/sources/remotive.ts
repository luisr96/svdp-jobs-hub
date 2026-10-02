import type { Job, JobType } from '../types';
import { remoteLocation, splitPlaces } from '../location';

// Terms: link to the Remotive URL, credit Remotive, max ~4 calls/day, jobs are delayed 24h.
const API_URL = 'https://remotive.com/api/remote-jobs';
const SOURCE = 'Remotive';

interface RemotiveJob {
  id: number;
  url: string;
  title: string;
  company_name: string;
  category?: string;
  tags?: string[];
  job_type?: string;
  publication_date?: string;
  candidate_required_location?: string;
  salary?: string;
}

export async function fetchRemotive(): Promise<Job[]> {
  const res = await fetch(API_URL, { signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`Remotive API returned ${res.status}`);
  const data = (await res.json()) as { jobs?: RemotiveJob[] };

  return (data.jobs ?? []).flatMap((j) => {
    if (!j.url || !j.title) return [];
    return [
      {
        id: `remotive:${j.id}`,
        source: SOURCE,
        title: j.title.trim(),
        company: j.company_name?.trim() ?? '',
        location: remoteLocation(splitPlaces(j.candidate_required_location)),
        remote: true,
        jobType: normalizeType(j.job_type),
        salary: j.salary?.trim() || undefined,
        url: j.url,
        postedAt: toIso(j.publication_date),
        category: j.category || undefined,
        tags: j.tags?.map((t) => t.trim()).filter(Boolean),
      } satisfies Job,
    ];
  });
}

function normalizeType(raw?: string): JobType | null {
  switch (raw) {
    case 'full_time': return 'Full-time';
    case 'part_time': return 'Part-time';
    case 'contract':
    case 'freelance': return 'Contract';
    case 'internship': return 'Internship';
    default: return null;
  }
}

// Remotive dates have no timezone ("2026-09-30T13:15:26"); they are UTC.
function toIso(date?: string): string {
  if (!date) return new Date().toISOString();
  const d = new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(date) ? date : `${date}Z`);
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}
