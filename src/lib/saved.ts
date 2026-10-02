// Saved jobs live in this browser only (localStorage). No accounts.
// We store a snapshot of each job, since listings drop out of the feeds over time.
import type { Job } from './types';

export type SavedJob = Pick<Job, 'id' | 'source' | 'title' | 'company' | 'location' | 'jobType' | 'salary' | 'url' | 'postedAt'> & {
  savedAt: string;
};

const KEY = 'svdp-jobs-hub:saved';

export function toSnapshot(job: Job): Omit<SavedJob, 'savedAt'> {
  const { id, source, title, company, location, jobType, salary, url, postedAt } = job;
  return { id, source, title, company, location, jobType, salary, url, postedAt };
}

export function loadSaved(): SavedJob[] {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function store(list: SavedJob[]): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
    return true;
  } catch {
    return false; // private mode, storage full or blocked
  }
}

export function isSaved(id: string): boolean {
  return loadSaved().some((j) => j.id === id);
}

/** Saves or un-saves a job. Returns the new saved state, or null if storage failed. */
export function toggleSaved(job: Omit<SavedJob, 'savedAt'>): boolean | null {
  const list = loadSaved();
  const exists = list.some((j) => j.id === job.id);
  const next = exists ? list.filter((j) => j.id !== job.id) : [{ ...job, savedAt: new Date().toISOString() }, ...list];
  return store(next) ? !exists : null;
}
