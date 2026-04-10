import { Module } from '@nestjs/common';
import { ApplicantsController } from './applicants.controller';
import { UploadController } from './upload.controller';
import { ApplicantsService } from './applicants.service';
import { AuditModule } from '../audit/audit.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [AuditModule, NotificationsModule, StorageModule],
  controllers: [ApplicantsController, UploadController],
  providers: [ApplicantsService],
  exports: [ApplicantsService],
})
export class ApplicantsModule {}
