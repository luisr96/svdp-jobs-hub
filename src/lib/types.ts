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
  url: string;
  postedAt: string; // ISO 8601
  category?: string;
}
