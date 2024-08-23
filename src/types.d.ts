export interface Job {
  company: string;
  role: string;
  location: string;
  applicationLink: string;
  datePosted: string;
  annotations: string[];
}
/**
 * Interface for job providers
 */
export interface JobProvider {
  /**
   * Fetches new jobs from the source
   * @returns Promise<Job[]> An array of new job listings
   */
  getNewJobs(): Promise<Job[]>;

  /**
   * Formats job listings into messages
   * @param jobs An array of Job objects
   * @returns string[] An array of formatted message strings
   */
  formatJobMessages(jobs: Job[]): string[];
}
