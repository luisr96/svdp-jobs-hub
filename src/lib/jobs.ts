import { cached } from './cache';
import type { Job } from './types';
import { fetchWeWorkRemotely } from './sources/weworkremotely';

const TTL = 45 * 60 * 1000; // refresh every 45 min

interface Source {
  name: string;
  fetch: () => Promise<Job[]>;
}

// Remotive and Jobicy get added here as their adapters land.
const remoteSources: Source[] = [{ name: 'We Work Remotely', fetch: fetchWeWorkRemotely }];

export interface JobResults {
  jobs: Job[];
  sources: string[]; // sources that returned data
}

export async function getRemoteJobs(): Promise<JobResults> {
  const results = await Promise.allSettled(
    remoteSources.map((s) => cached(`source:${s.name}`, TTL, s.fetch)),
  );

  const jobs: Job[] = [];
  const sources: string[] = [];
  results.forEach((r, i) => {
    const name = remoteSources[i].name;
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
    const key = `${j.title}|${j.company}`.toLowerCase().replace(/\s+/g, ' ').trim();
    if (seenUrl.has(url) || seenKey.has(key)) return false;
    seenUrl.add(url);
    seenKey.add(key);
    return true;
  });
}

function sortNewest(jobs: Job[]): Job[] {
  return jobs.sort((a, b) => b.postedAt.localeCompare(a.postedAt));
}
