import { Injectable } from '@nestjs/common';
import { IStorageDriver } from '../storage.interface';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class LocalStorageDriver implements IStorageDriver {
  constructor(private readonly basePath: string) {}

  async uploadFile(file: Buffer, filePath: string, mimeType: string): Promise<string> {
    const fullPath = path.join(this.basePath, filePath);
    const dir = path.dirname(fullPath);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(fullPath, file);
    return filePath;
  }

  async downloadFile(fileKey: string): Promise<Buffer> {
    const fullPath = path.join(this.basePath, fileKey);
    return fs.readFileSync(fullPath);
  }

  async deleteFile(fileKey: string): Promise<void> {
    const fullPath = path.join(this.basePath, fileKey);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  }
}
