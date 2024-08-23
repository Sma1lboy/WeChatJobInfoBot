import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { jobWxBotConfig } from '../package.json';
import * as os from 'os';

export interface Job {
  company: string;
  role: string;
  location: string;
  applicationLink: string;
  datePosted: string;
  annotations: string[];
}

export interface Config {
  maxDays: number;
  jobsPerMessage: number;
}

export class InternJobProvider {
  private sentJobsPath: string;
  private config: Config;
  private githubUrl: string =
    'https://raw.githubusercontent.com/SimplifyJobs/Summer2025-Internships/dev/README.md';

  constructor() {
    const homeDir = os.homedir();
    const cacheDir = path.join(homeDir, '.job-wx-bot');
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }
    this.sentJobsPath = path.join(cacheDir, 'sent_Intern_jobs.json');
    this.config = { ...jobWxBotConfig, jobsPerMessage: jobWxBotConfig.jobsPerMessage || 3 };
  }

  private async fetchJobsFromGithub(): Promise<string> {
    try {
      const response = await axios.get(this.githubUrl);
      return response.data;
    } catch (error) {
      console.error('Error fetching data from GitHub:', error);
      throw error;
    }
  }

  private extractTableFromMarkdown(markdownContent: string): Job[] {
    const tablePattern = /\| Company.*?\n([\s\S]*?)\n\n/;
    const tableMatch = markdownContent.match(tablePattern);
    if (!tableMatch) return [];

    const tableContent = tableMatch[1];
    const rows = tableContent.trim().split('\n');

    let lastValidCompany = '';
    return rows
      .map((row) => {
        const columns = row.split('|');
        if (columns.length >= 6) {
          const company = this.cleanCompanyName(columns[1].trim());
          if (company !== '↳') {
            lastValidCompany = company;
          }
          const role = columns[2].trim();
          const annotations = this.getJobAnnotations(role);

          // 如果职位已关闭，则跳过
          if (annotations.includes('Closed')) {
            return null;
          }

          return {
            company: company === '↳' ? lastValidCompany : company,
            role: this.cleanRole(role),
            location: this.cleanLocation(columns[3].trim()),
            applicationLink: this.extractApplicationLink(columns[4].trim()),
            datePosted: columns[5].trim(),
            annotations: annotations,
          };
        }
        return null;
      })
      .filter((job): job is Job => job !== null);
  }

  private getJobAnnotations(role: string): string[] {
    const annotations: string[] = [];
    if (role.includes('🛂')) annotations.push('No Sponsorship');
    if (role.includes('🇺🇸')) annotations.push('U.S. Citizenship Required');
    if (role.includes('🔒')) annotations.push('Closed');
    return annotations;
  }

  private cleanRole(role: string): string {
    return role.replace(/[🛂🇺🇸🔒]/g, '').trim();
  }

  private cleanCompanyName(company: string): string {
    return company.replace(/\*\*\[(.*?)\].*?\*\*/, '$1');
  }

  private cleanLocation(location: string): string {
    return location
      .replace(/<br\s*\/?>/gi, ', ')
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private extractApplicationLink(htmlString: string): string {
    const linkPattern = /href="([^"]*)/;
    const match = htmlString.match(linkPattern);
    if (match) {
      let link = match[1];

      link = link.replace(/([?&]utm_source=Simplify)(&ref=Simplify)?($|&)/, '');
      link = link.replace(/([?&])utm_source=Simplify(&ref=Simplify)?&/, '$1');
      link = link.replace(/[?&]$/, '');

      return link;
    }
    return 'No link available';
  }
  private filterJobsByDate(jobs: Job[], days: number): Job[] {
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

    return jobs.filter((job) => {
      const [month, day] = job.datePosted.split(' ');
      const jobDate = new Date(today.getFullYear(), months.indexOf(month), parseInt(day));

      if (jobDate > today) {
        jobDate.setFullYear(jobDate.getFullYear() - 1);
      }

      return jobDate >= cutoffDate;
    });
  }

  public async getNewJobs(): Promise<Job[]> {
    const markdownContent = await this.fetchJobsFromGithub();
    const allJobs = this.extractTableFromMarkdown(markdownContent);
    const filteredJobs = this.filterJobsByDate(allJobs, this.config.maxDays);

    let sentJobs: Job[] = [];
    try {
      sentJobs = JSON.parse(fs.readFileSync(this.sentJobsPath, 'utf8'));
    } catch (error) {
      console.log('No previous sent jobs found');
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
      sentJobs = [...sentJobs, ...newJobs];
      fs.writeFileSync(this.sentJobsPath, JSON.stringify(sentJobs));
    }

    return newJobs;
  }

  public formatJobMessages(jobs: Job[]): string[] {
    const messages: string[] = [];
    for (let i = 0; i < jobs.length; i += this.config.jobsPerMessage) {
      const jobGroup = jobs.slice(i, i + this.config.jobsPerMessage);
      let message = '📢 New Job Opportunities for INTERN📢\n\n';
      jobGroup.forEach((job) => {
        message += this.formatJobMessage(job);
      });
      messages.push(message);
    }
    return messages;
  }

  public formatJobMessage(job: Job): string {
    let message = `
🏢 Company: ${job.company}
💼 Role: ${job.role}
📍 Location: ${job.location}
🔗 Apply: ${job.applicationLink}
📅 Posted: ${job.datePosted}
🧢 Type: INTERN
`;
    if (job.annotations.length > 0) {
      message += `⚠️ Note: ${job.annotations.join(', ')}\n`;
    }
    message += '----------------------------\n';
    return message;
  }
}


export class NGJobProvider {
  private sentJobsPath: string;
  private config: Config;
  private githubUrl: string =
    'https://raw.githubusercontent.com/SimplifyJobs/New-Grad-Positions/dev/README.md';

  constructor() {
    const homeDir = os.homedir();
    const cacheDir = path.join(homeDir, '.job-wx-bot');
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }
    this.sentJobsPath = path.join(cacheDir, 'sent_NG_jobs.json');
    this.config = { ...jobWxBotConfig, jobsPerMessage: jobWxBotConfig.jobsPerMessage || 3 };
  }

  private async fetchJobsFromGithub(): Promise<string> {
    try {
      const response = await axios.get(this.githubUrl);
      return response.data;
    } catch (error) {
      console.error('Error fetching data from GitHub:', error);
      throw error;
    }
  }

  private extractTableFromMarkdown(markdownContent: string): Job[] {
    const tablePattern = /\| Company.*?\n([\s\S]*?)\n\n/;
    const tableMatch = markdownContent.match(tablePattern);
    if (!tableMatch) return [];

    const tableContent = tableMatch[1];
    const rows = tableContent.trim().split('\n');

    let lastValidCompany = '';
    return rows
      .map((row) => {
        const columns = row.split('|');
        if (columns.length >= 6) {
          const company = this.cleanCompanyName(columns[1].trim());
          if (company !== '↳') {
            lastValidCompany = company;
          }
          const role = columns[2].trim();
          const annotations = this.getJobAnnotations(role);

          // 如果职位已关闭，则跳过
          if (annotations.includes('Closed')) {
            return null;
          }

          return {
            company: company === '↳' ? lastValidCompany : company,
            role: this.cleanRole(role),
            location: this.cleanLocation(columns[3].trim()),
            applicationLink: this.extractApplicationLink(columns[4].trim()),
            datePosted: columns[5].trim(),
            annotations: annotations,
          };
        }
        return null;
      })
      .filter((job): job is Job => job !== null);
  }

  private getJobAnnotations(role: string): string[] {
    const annotations: string[] = [];
    if (role.includes('🛂')) annotations.push('No Sponsorship');
    if (role.includes('🇺🇸')) annotations.push('U.S. Citizenship Required');
    if (role.includes('🔒')) annotations.push('Closed');
    return annotations;
  }

  private cleanRole(role: string): string {
    return role.replace(/[🛂🇺🇸🔒]/g, '').trim();
  }

  private cleanCompanyName(company: string): string {
    return company.replace(/\*\*\[(.*?)\].*?\*\*/, '$1');
  }

  private cleanLocation(location: string): string {
    return location
      .replace(/<br\s*\/?>/gi, ', ')
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private extractApplicationLink(htmlString: string): string {
    const linkPattern = /href="([^"]*)/;
    const match = htmlString.match(linkPattern);
    if (match) {
      let link = match[1];

      link = link.replace(/([?&]utm_source=Simplify)(&ref=Simplify)?($|&)/, '');
      link = link.replace(/([?&])utm_source=Simplify(&ref=Simplify)?&/, '$1');
      link = link.replace(/[?&]$/, '');

      return link;
    }
    return 'No link available';
  }
  private filterJobsByDate(jobs: Job[], days: number): Job[] {
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

    return jobs.filter((job) => {
      const [month, day] = job.datePosted.split(' ');
      const jobDate = new Date(today.getFullYear(), months.indexOf(month), parseInt(day));

      if (jobDate > today) {
        jobDate.setFullYear(jobDate.getFullYear() - 1);
      }

      return jobDate >= cutoffDate;
    });
  }

  public async getNewJobs(): Promise<Job[]> {
    const markdownContent = await this.fetchJobsFromGithub();
    const allJobs = this.extractTableFromMarkdown(markdownContent);
    const filteredJobs = this.filterJobsByDate(allJobs, this.config.maxDays);

    let sentJobs: Job[] = [];
    try {
      sentJobs = JSON.parse(fs.readFileSync(this.sentJobsPath, 'utf8'));
    } catch (error) {
      console.log('No previous sent jobs found');
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
      sentJobs = [...sentJobs, ...newJobs];
      fs.writeFileSync(this.sentJobsPath, JSON.stringify(sentJobs));
    }

    return newJobs;
  }

  public formatJobMessages(jobs: Job[]): string[] {
    const messages: string[] = [];
    for (let i = 0; i < jobs.length; i += this.config.jobsPerMessage) {
      const jobGroup = jobs.slice(i, i + this.config.jobsPerMessage);
      let message = '📢 New Job Opportunities for NG 📢\n\n';
      jobGroup.forEach((job) => {
        message += this.formatJobMessage(job);
      });
      messages.push(message);
    }
    return messages;
  }

  public formatJobMessage(job: Job): string {
    let message = `
🏢 Company: ${job.company}
💼 Role: ${job.role}
📍 Location: ${job.location}
🔗 Apply: ${job.applicationLink}
📅 Posted: ${job.datePosted}
🧢 Type: NG
`;
    if (job.annotations.length > 0) {
      message += `⚠️ Note: ${job.annotations.join(', ')}\n`;
    }
    message += '----------------------------\n';
    return message;
  }
}
