import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export class FileSystemService {
  private static configDir: string = path.join(os.homedir(), '.job-wx-bot');

  static initialize(): void {
    if (!fs.existsSync(this.configDir)) {
      fs.mkdirSync(this.configDir, { recursive: true });
    }
  }

  static readFile(fileName: string): string {
    const filePath = path.join(this.configDir, fileName);
    return fs.readFileSync(filePath, 'utf8');
  }

  static writeFile(fileName: string, data: string): void {
    const filePath = path.join(this.configDir, fileName);
    fs.writeFileSync(filePath, data);
  }

  static fileExists(fileName: string): boolean {
    const filePath = path.join(this.configDir, fileName);
    return fs.existsSync(filePath);
  }

  static readJSON<T>(fileName: string): T {
    const data = this.readFile(fileName);
    return JSON.parse(data) as T;
  }

  static writeJSON(fileName: string, data: any): void {
    const jsonData = JSON.stringify(data, null, 2);
    this.writeFile(fileName, jsonData);
  }
}
