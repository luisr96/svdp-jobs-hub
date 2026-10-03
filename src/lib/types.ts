export type JobType = 'Full-time' | 'Part-time' | 'Contract' | 'Temporary' | 'Internship';

export interface Job {
  id: string;
  source: string;
  title: string;
  company: string;
  location: string;
  remote: boolean;
  jobType: JobType | null;
  salary?: string;
  payRank?: number; // top of the pay range as yearly dollars, for the "Highest pay" sort
  url: string;
  postedAt: string; // ISO 8601
  category?: string;
  tags?: string[]; // used for local keyword filtering when a source has no search params
  county?: string; // local jobs only, for the Area filter
  city?: string;
}
