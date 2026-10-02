import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

// TTL cache kept in memory and mirrored to .cache/ on disk, so server restarts don't
// trigger refetches (Remotive allows ~4 calls/day). On a failed refresh it keeps
// serving the last good value.
// TODO: on Netlify the filesystem is ephemeral; swap disk storage for Netlify Blobs.
interface Entry<T> {
  value: T;
  expires: number;
}

const CACHE_DIR = path.resolve('.cache');
const memory = new Map<string, Entry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();

const fileFor = (key: string) => path.join(CACHE_DIR, `${key.replace(/[^a-z0-9-]+/gi, '_')}.json`);

async function readDisk<T>(key: string): Promise<Entry<T> | undefined> {
  try {
    return JSON.parse(await readFile(fileFor(key), 'utf8')) as Entry<T>;
  } catch {
    return undefined;
  }
}

async function writeDisk<T>(key: string, entry: Entry<T>): Promise<void> {
  try {
    await mkdir(CACHE_DIR, { recursive: true });
    await writeFile(fileFor(key), JSON.stringify(entry));
  } catch (err) {
    console.error(`[cache] could not write ${key} to disk:`, err);
  }
}

export async function cached<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  let hit = memory.get(key) as Entry<T> | undefined;
  if (!hit) {
    hit = await readDisk<T>(key);
    if (hit) memory.set(key, hit);
  }
  if (hit && hit.expires > Date.now()) return hit.value;

  // Share one fetch between concurrent requests.
  const pending = inflight.get(key) as Promise<T> | undefined;
  if (pending) return pending;

  const p = load()
    .then(async (value) => {
      const entry = { value, expires: Date.now() + ttlMs };
      memory.set(key, entry);
      await writeDisk(key, entry);
      return value;
    })
    .catch((err) => {
      if (hit) {
        console.error(`[cache] refresh failed for ${key}, serving stale data:`, err);
        return hit.value;
      }
      throw err;
    })
    .finally(() => inflight.delete(key));

  inflight.set(key, p);
  return p;
}
