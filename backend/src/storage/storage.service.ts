import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IStorageDriver } from './storage.interface';
import { LocalStorageDriver } from './drivers/local.driver';
import { RailwayVolumeDriver } from './drivers/railway.driver';

@Injectable()
export class StorageService {
  private driver: IStorageDriver;

  constructor(private config: ConfigService) {
    const driverType = config.get<string>('storage.driver');
    const uploadPath = config.get<string>('storage.uploadPath');

    this.driver =
      driverType === 'railway'
        ? new RailwayVolumeDriver(uploadPath)
        : new LocalStorageDriver(uploadPath || './uploads');
  }

  uploadFile(file: Buffer, filePath: string, mimeType: string): Promise<string> {
    return this.driver.uploadFile(file, filePath, mimeType);
  }

  downloadFile(fileKey: string): Promise<Buffer> {
    return this.driver.downloadFile(fileKey);
  }

  deleteFile(fileKey: string): Promise<void> {
    return this.driver.deleteFile(fileKey);
  }

  buildPath(module: string, recordId: string, category: string, filename: string): string {
    return `${module}/${recordId}/${category}/${filename}`;
  }
}
