import axios from 'axios';
import { Config } from '../config';
import { Job, JobProvider } from '../types';
import { FileSystemService } from '../FileSystemService';

export abstract class BaseJobProvider implements JobProvider {
  abstract readonly jobType: string;
  protected abstract githubUrl: string;
  protected abstract sentJobsFileName: string;

  protected config: Config;

  constructor(config: Config) {
    this.config = config;
  }

  protected async fetchJobsFromGithub(): Promise<string> {
    try {
      const response = await axios.get(this.githubUrl);
      return response.data;
    } catch (error) {
      console.error('Error fetching data from GitHub:', error);
      throw error;
    }
  }

  protected abstract extractTableFromMarkdown(markdownContent: string): Job[];

  protected filterJobsByDate(jobs: Job[], days: number): Job[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const cutoffDate = new Date(today);
    cutoffDate.setDate(today.getDate() - days);

    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];

    return jobs
      .filter((job) => {
        const [month, day] = job.datePosted.split(' ');
        const jobDate = new Date(today.getFullYear(), months.indexOf(month), parseInt(day));

        if (jobDate > today) {
          jobDate.setFullYear(jobDate.getFullYear() - 1);
        }

        return jobDate >= cutoffDate;
      })
      .sort((a, b) => {
        const dateA = new Date(a.datePosted);
        const dateB = new Date(b.datePosted);
        return dateB.getTime() - dateA.getTime();
      });
  }

  public async getNewJobs(): Promise<Job[]> {
    const markdownContent = await this.fetchJobsFromGithub();
    const allJobs = this.extractTableFromMarkdown(markdownContent);
    const filteredJobs = this.filterJobsByDate(allJobs, this.config.maxDays);

    let sentJobs: Job[] = [];
    if (FileSystemService.fileExists(this.sentJobsFileName)) {
      sentJobs = FileSystemService.readJSON<Job[]>(this.sentJobsFileName);
    }

    const newJobs = filteredJobs.filter(
      (job) =>
        !sentJobs.some(
          (sentJob) =>
            sentJob.company === job.company &&
            sentJob.role === job.role &&
            sentJob.datePosted === job.datePosted,
        ),
    );

    if (newJobs.length > 0) {
      sentJobs = [...newJobs, ...sentJobs];
      FileSystemService.writeJSON(this.sentJobsFileName, sentJobs);
    }

    return newJobs;
  }

  public formatJobMessages(jobs: Job[]): string[] {
    const messages: string[] = [];
    let currentMessage = `📢 New Job Opportunities for ${this.jobType} 📢\n\n`;
    let jobCount = 0;

    for (const job of jobs) {
      currentMessage += this.formatJobMessage(job);
      jobCount++;

      if (jobCount === this.config.jobsPerMessage) {
        messages.push(currentMessage);
        currentMessage = `📢 New Job Opportunities for ${this.jobType} 📢\n\n`;
        jobCount = 0;
      }
    }

    if (jobCount > 0) {
      messages.push(currentMessage);
    }

    return messages;
  }

  protected abstract formatJobMessage(job: Job): string;
}
