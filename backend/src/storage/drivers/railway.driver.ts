import { Injectable } from '@nestjs/common';
import { LocalStorageDriver } from './local.driver';

// Railway Volume is mounted as a directory — same as LocalStorageDriver but at /data/uploads
@Injectable()
export class RailwayVolumeDriver extends LocalStorageDriver {
  constructor(uploadPath: string) {
    super(uploadPath || '/data/uploads');
  }
}
