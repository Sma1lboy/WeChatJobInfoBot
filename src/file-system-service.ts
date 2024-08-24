import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as crypto from 'crypto';

export class FileSystemService {
  private static baseDir: string = path.join(os.homedir(), '.job-wx-bot');
  private static roomsDir: string = path.join(FileSystemService.baseDir, 'rooms');

  static initialize(): void {
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
    if (!fs.existsSync(this.roomsDir)) {
      fs.mkdirSync(this.roomsDir, { recursive: true });
    }
  }

  private static getRoomHash(roomTopic: string): string {
    return crypto.createHash('md5').update(roomTopic).digest('hex');
  }

  private static getRoomDir(roomTopic: string): string {
    const roomHash = this.getRoomHash(roomTopic);
    const roomDir = path.join(this.roomsDir, roomHash);
    if (!fs.existsSync(roomDir)) {
      fs.mkdirSync(roomDir, { recursive: true });
    }
    return roomDir;
  }

  static readFile(roomTopic: string, fileName: string): string {
    const filePath = path.join(this.getRoomDir(roomTopic), fileName);
    return fs.readFileSync(filePath, 'utf8');
  }

  static writeFile(roomTopic: string, fileName: string, data: string): void {
    const filePath = path.join(this.getRoomDir(roomTopic), fileName);
    fs.writeFileSync(filePath, data);
  }

  static fileExists(roomTopic: string, fileName: string): boolean {
    const filePath = path.join(this.getRoomDir(roomTopic), fileName);
    return fs.existsSync(filePath);
  }

  static readJSON<T>(roomTopic: string, fileName: string): T {
    const data = this.readFile(roomTopic, fileName);
    return JSON.parse(data) as T;
  }

  static writeJSON(roomTopic: string, fileName: string, data: any): void {
    const jsonData = JSON.stringify(data, null, 2);
    this.writeFile(roomTopic, fileName, jsonData);
  }

  static writeGlobalFile(fileName: string, data: string): void {
    const filePath = path.join(this.baseDir, fileName);
    fs.writeFileSync(filePath, data);
  }

  static readGlobalFile(fileName: string): string {
    const filePath = path.join(this.baseDir, fileName);
    return fs.readFileSync(filePath, 'utf8');
  }

  static globalFileExists(fileName: string): boolean {
    const filePath = path.join(this.baseDir, fileName);
    return fs.existsSync(filePath);
  }

  static writeGlobalJSON(fileName: string, data: any): void {
    const jsonData = JSON.stringify(data, null, 2);
    this.writeGlobalFile(fileName, jsonData);
  }

  static readGlobalJSON<T>(fileName: string): T {
    const data = this.readGlobalFile(fileName);
    return JSON.parse(data) as T;
  }
}
