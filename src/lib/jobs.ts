import { cached } from './cache';
import type { Job } from './types';
import { fetchWeWorkRemotely } from './sources/weworkremotely';
import { fetchRemotive } from './sources/remotive';
import { fetchJobicy } from './sources/jobicy';
import { fetchAdzuna } from './sources/adzuna';
import { DEFAULT_AREA, filterByArea, type Area } from './areas';

const MIN = 60 * 1000;

interface Source {
  name: string;
  cacheKey?: string; // defaults to name
  ttl: number;
  fetch: () => Promise<Job[]>;
}

// Order matters for dedupe: when the same job appears twice, the earlier source wins.
const remoteSources: Source[] = [
  { name: 'We Work Remotely', ttl: 45 * MIN, fetch: fetchWeWorkRemotely },
  { name: 'Remotive', ttl: 6 * 60 * MIN, fetch: fetchRemotive }, // max ~4 calls/day
  { name: 'Jobicy', ttl: 45 * MIN, fetch: fetchJobicy },
];

export interface JobResults {
  jobs: Job[];
  sources: string[]; // sources that returned data
}

// Cache key "Adzuna:county" so the switch from radius to county queries doesn't reuse old cached data.
const localSources: Source[] = [{ name: 'Adzuna', cacheKey: 'Adzuna:county', ttl: 60 * MIN, fetch: fetchAdzuna }];

export const getRemoteJobs = () => getJobs(remoteSources);
export async function getLocalJobs(area: Area = DEFAULT_AREA): Promise<JobResults> {
  const results = await getJobs(localSources);
  return { ...results, jobs: filterByArea(results.jobs, area) };
}

async function getJobs(list: Source[]): Promise<JobResults> {
  const results = await Promise.allSettled(
    list.map((s) => cached(`source:${s.cacheKey ?? s.name}`, s.ttl, s.fetch)),
  );

  const jobs: Job[] = [];
  const sources: string[] = [];
  results.forEach((r, i) => {
    const name = list[i].name;
    if (r.status === 'fulfilled') {
      jobs.push(...r.value);
      sources.push(name);
    } else {
      console.error(`[jobs] ${name} failed:`, r.reason);
    }
  });

  return { jobs: sortNewest(dedupe(jobs)), sources };
}

function dedupe(jobs: Job[]): Job[] {
  const seenUrl = new Set<string>();
  const seenKey = new Set<string>();
  return jobs.filter((j) => {
    const url = j.url.replace(/[?#].*$/, '').replace(/\/$/, '').toLowerCase();
    const key = `${normalize(j.title)}|${normalize(j.company)}`;
    if (seenUrl.has(url) || seenKey.has(key)) return false;
    seenUrl.add(url);
    seenKey.add(key);
    return true;
  });
}

// "Acme, Inc." and "ACME Inc" should match; so should "Sr. Engineer (Remote)" and "Sr Engineer".
function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/\(remote[^)]*\)|\bremote\b/g, '')
    .replace(/\b(inc|llc|ltd|corp|co|gmbh)\b\.?/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function sortNewest(jobs: Job[]): Job[] {
  return jobs.sort((a, b) => b.postedAt.localeCompare(a.postedAt));
}
