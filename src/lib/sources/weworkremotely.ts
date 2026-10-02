import { XMLParser } from 'fast-xml-parser';
import type { Job, JobType } from '../types';
import { remoteLocation, splitPlaces } from '../location';

const FEED_URL = 'https://weworkremotely.com/remote-jobs.rss';
const SOURCE = 'We Work Remotely';

interface WwrItem {
  title?: string;
  link?: string;
  guid?: string;
  pubDate?: string;
  region?: string;
  country?: string;
  state?: string;
  skills?: string;
  category?: string;
  type?: string;
  expires_at?: string;
}

const parser = new XMLParser({ ignoreAttributes: true, parseTagValue: false, trimValues: true });

export async function fetchWeWorkRemotely(): Promise<Job[]> {
  const res = await fetch(FEED_URL, {
    headers: { 'User-Agent': 'SVdP-Naples-JobsHub/1.0 (+job pathway program)' },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`WWR feed returned ${res.status}`);

  const xml = await res.text();
  const doc = parser.parse(xml);
  const raw = doc?.rss?.channel?.item ?? [];
  const items: WwrItem[] = Array.isArray(raw) ? raw : [raw];

  const now = Date.now();
  return items.flatMap((item) => {
    const url = item.link ?? item.guid;
    if (!url || !item.title) return [];
    if (item.expires_at && Date.parse(item.expires_at) < now) return [];
    const { company, title } = splitTitle(item.title);
    return [
      {
        id: `wwr:${url}`,
        source: SOURCE,
        title,
        company,
        location: formatLocation(item.region, item.country),
        remote: true,
        jobType: normalizeType(item.type),
        url,
        postedAt: toIso(item.pubDate),
        category: item.category || undefined,
        tags: item.skills ? item.skills.split(/,\s*(?:and\s+)?/).filter(Boolean) : undefined,
      } satisfies Job,
    ];
  });
}

// WWR titles look like "Company Name: Job Title".
function splitTitle(raw: string): { company: string; title: string } {
  const i = raw.indexOf(': ');
  if (i === -1) return { company: '', title: raw };
  return { company: raw.slice(0, i), title: raw.slice(i + 2) };
}

// Countries come as "🇺🇸 United States of America, 🇫🇷 France, and ..."; fall back to region.
function formatLocation(region?: string, country?: string): string {
  const countries = splitPlaces(country);
  if (countries.length) return remoteLocation(countries);
  const r = region?.replace(/^remote\s*[-–:]\s*/i, '').trim();
  return remoteLocation(r ? [r] : []);
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

function toIso(date?: string): string {
  const d = date ? new Date(date) : new Date(NaN);
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}
