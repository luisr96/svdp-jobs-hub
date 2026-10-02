import type { Job } from './types';

// Hardcoded placeholder listings until the source adapters are wired up.
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();

export const sampleRemoteJobs: Job[] = [
  {
    id: 'sample-1',
    source: 'Remotive',
    title: '[Sample] Customer Support Specialist',
    company: '[Company name]',
    location: 'Remote · US only',
    remote: true,
    jobType: 'Full-time',
    salary: '$18–$22 / hour',
    url: 'https://remotive.com/',
    postedAt: daysAgo(1),
    category: 'Customer support',
  },
  {
    id: 'sample-2',
    source: 'WWR',
    title: '[Sample] Virtual Administrative Assistant',
    company: '[Company name]',
    location: 'Remote · Anywhere',
    remote: true,
    jobType: 'Part-time',
    url: 'https://weworkremotely.com/',
    postedAt: daysAgo(2),
    category: 'Admin & data entry',
  },
  {
    id: 'sample-3',
    source: 'Jobicy',
    title: '[Sample] Data Entry Clerk',
    company: '[Company name]',
    location: 'Remote · US only',
    remote: true,
    jobType: 'Contract',
    salary: '$16 / hour',
    url: 'https://jobicy.com/',
    postedAt: daysAgo(3),
    category: 'Admin & data entry',
  },
  {
    id: 'sample-4',
    source: 'WWR',
    title: '[Sample] Inside Sales Representative',
    company: '[Company name]',
    location: 'Remote · US only',
    remote: true,
    jobType: 'Full-time',
    url: 'https://weworkremotely.com/',
    postedAt: daysAgo(4),
    category: 'Sales & marketing',
  },
];
