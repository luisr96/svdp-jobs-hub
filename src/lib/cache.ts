import { mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { getStore } from '@netlify/blobs';

// TTL cache kept in memory and backed by shared storage, so restarts and new server
// instances don't trigger refetches (Remotive allows ~4 calls/day). On a failed
// refresh it keeps serving the last good value.
//
// Storage: Netlify Blobs when running on Netlify (one copy shared by every function
// instance, survives deploys); otherwise JSON files in .cache/ on local disk.
interface Entry<T> {
  value: T;
  expires: number;
}

interface Storage {
  read<T>(key: string): Promise<Entry<T> | undefined>;
  write<T>(key: string, entry: Entry<T>): Promise<void>;
}

const BLOB_STORE = 'job-cache';
const safeName = (key: string) => key.replace(/[^a-z0-9-]+/gi, '_');

// getStore() only works inside Netlify's runtime; elsewhere it throws, and we use disk.
function blobStorage(): Storage | null {
  let store: ReturnType<typeof getStore>;
  try {
    // Strong consistency: always see the latest write, so instances don't refetch on a stale read.
    store = getStore({ name: BLOB_STORE, consistency: 'strong' });
  } catch {
    return null;
  }
  return {
    async read(key) {
      return ((await store.get(safeName(key), { type: 'json' })) as Entry<never> | null) ?? undefined;
    },
    async write(key, entry) {
      await store.setJSON(safeName(key), entry);
    },
  };
}

const ON_SERVERLESS = Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NETLIFY);
const CACHE_DIR = ON_SERVERLESS ? path.join(os.tmpdir(), 'jobs-cache') : path.resolve('.cache');
const fileFor = (key: string) => path.join(CACHE_DIR, `${safeName(key)}.json`);

const diskStorage: Storage = {
  async read(key) {
    try {
      return JSON.parse(await readFile(fileFor(key), 'utf8'));
    } catch {
      return undefined;
    }
  },
  async write(key, entry) {
    await mkdir(CACHE_DIR, { recursive: true });
    await writeFile(fileFor(key), JSON.stringify(entry));
  },
};

// Resolved on first use: the Netlify Blobs context is only available at request time.
let storage: Storage | undefined;
const getStorage = () => (storage ??= blobStorage() ?? diskStorage);

async function readStored<T>(key: string): Promise<Entry<T> | undefined> {
  try {
    return await getStorage().read<T>(key);
  } catch (err) {
    console.error(`[cache] could not read ${key} from storage:`, err);
    return undefined;
  }
}

async function writeStored<T>(key: string, entry: Entry<T>): Promise<void> {
  try {
    await getStorage().write(key, entry);
  } catch (err) {
    console.error(`[cache] could not write ${key} to storage:`, err);
  }
}

const memory = new Map<string, Entry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();

export async function cached<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  let hit = memory.get(key) as Entry<T> | undefined;

  // Missing or expired in memory: another instance may have refreshed shared storage already.
  if (!hit || hit.expires <= Date.now()) {
    const stored = await readStored<T>(key);
    if (stored && (!hit || stored.expires > hit.expires)) {
      hit = stored;
      memory.set(key, hit);
    }
  }
  if (hit && hit.expires > Date.now()) return hit.value;

  // Share one fetch between concurrent requests in this instance.
  const pending = inflight.get(key) as Promise<T> | undefined;
  if (pending) return pending;

  const p = load()
    .then(async (value) => {
      const entry = { value, expires: Date.now() + ttlMs };
      memory.set(key, entry);
      await writeStored(key, entry);
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
