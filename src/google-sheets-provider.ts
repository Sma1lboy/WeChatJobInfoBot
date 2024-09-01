import { JWT } from 'google-auth-library';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { Job } from './types';

const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive',
];

export class GoogleSheetDoc {
  private docSheet: GoogleSpreadsheet | undefined = undefined;
  private auth: JWT;

  public constructor() {
    this.auth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY!.split(String.raw`\n`).join('\n'),
      scopes: SCOPES,
    });
  }

  public async initialize(title: string): Promise<void> {
    try {
      console.log('Initializing GoogleSheetDoc with title:', title);
      this.docSheet = await GoogleSpreadsheet.createNewSpreadsheetDocument(this.auth, { title });
      await this.docSheet.loadInfo();
      await this.docSheet.addSheet({ title: 'Intern' });
      await this.docSheet?.sheetsByIndex[0]?.delete();
      console.log('New spreadsheet created successfully');
    } catch (error) {
      console.error('Error initializing GoogleSheetDoc:', error);
      throw error;
    }
  }

  public get doc() {
    return this.docSheet;
  }

  public async addJobSheet(title: string, jobs: Job[]) {
    if (!this.docSheet) {
      console.error('Document sheet is not initialized');
      return;
    }

    try {
      console.log(`Adding job sheet: ${title}`);
      await this.doc?.loadInfo();
      let sheet = this.doc?.sheetsByTitle[title];

      if (sheet) {
        console.log('Clearing existing sheet');
        await sheet.clear();
        await sheet.setHeaderRow([
          'Date Posted',
          'Company',
          'Role',
          'Location',
          'Application Link',
        ]);
      } else {
        console.log('Creating new sheet');
        sheet = await this.doc?.addSheet({
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

      console.log(`Adding ${rows.length} rows to the sheet`);
      await sheet?.addRows(rows);
      console.log('Rows added successfully');
    } catch (error) {
      console.error('Error in addJobSheet:', error);
      throw error;
    }
  }
}
