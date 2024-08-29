import { JWT } from 'google-auth-library';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { Job } from './types';
const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
];

export class GoogleSheetProvider {
  private static instance: GoogleSheetProvider;

  public static getInstance() {
    if (!this.instance) {
      this.instance = new GoogleSheetProvider();
    }
    return this.instance;
  }
  private docSheet: GoogleSpreadsheet;

  private constructor() {
    const auth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY!.split(String.raw`\n`).join('\n'),
      scopes: SCOPES,
    });
    this.docSheet = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID!, auth);
  }
  public get doc() {
    return this.docSheet;
  }

  public async addJobSheet(title: string, jobs: Job[]) {
    await this.doc.loadInfo();
    let sheet = this.doc.sheetsByTitle[title];
    if (sheet) {
      await sheet.clear();
      await sheet.setHeaderRow(['Date Posted', 'Company', 'Role', 'Location', 'Application Link']);
    } else {
      sheet = await this.doc.addSheet({
        title,
        headerValues: ['Date Posted', 'Company', 'Role', 'Location', 'Application Link'],
      });
    }
    let rows = jobs
      .map((job) => ({
        'Date Posted': job.datePosted,
        Company: job.company,
        Role: job.role,
        Location: job.location,
        'Application Link': job.applicationLink,
      }))
      .sort((a, b) => b['Date Posted'].localeCompare(a['Date Posted']));

    await sheet.addRows(rows);
  }
}
