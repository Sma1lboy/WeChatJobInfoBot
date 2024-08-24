import { Config } from '../config';
import { Job } from '../types';
import { BaseJobProvider } from './job-provider-base';

/**
 * @class NGJobProvider
 * @extends {BaseJobProvider}
 * @description Provides new graduate job listings for recent graduates
 * @source https://github.com/SimplifyJobs/New-Grad-Positions
 */
export class NGJobProvider extends BaseJobProvider {
  readonly jobType = 'New Graduate';
  protected githubUrl =
    'https://raw.githubusercontent.com/SimplifyJobs/New-Grad-Positions/dev/README.md';
  protected sentJobsFileName = 'sent_new_grad_jobs.json';

  constructor(config: Config) {
    super(config);
  }

  protected extractTableFromMarkdown(markdownContent: string): Job[] {
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

  protected formatJobMessage(job: Job): string {
    const cleanCompany = job.company.replace(/\*\*/g, '').replace(/\[|\]/g, '');

    let message = `
🏢 Company: ${cleanCompany}
💼 Role: ${job.role}
📍 Location: ${job.location}
🔗 Apply: ${job.applicationLink}
📅 Posted: ${job.datePosted}
🧢 Type: New Grad
`;
    if (job.annotations.length > 0) {
      message += `⚠️ Note: ${job.annotations.join(', ')}\n`;
    }
    message += '----------------------------\n';
    return message;
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
}
