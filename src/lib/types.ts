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
  tags?: string[]; // used for keyword filtering
}
