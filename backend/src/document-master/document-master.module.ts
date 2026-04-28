import { Module } from '@nestjs/common';
import { DocumentMasterController } from './document-master.controller';
import { DocumentMasterService } from './document-master.service';
import { PrismaModule } from '../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [PrismaModule, StorageModule],
  controllers: [DocumentMasterController],
  providers: [DocumentMasterService],
})
export class DocumentMasterModule {}
