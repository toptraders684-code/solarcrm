import { Module } from '@nestjs/common';
import { DocumentMasterController } from './document-master.controller';
import { DocumentMasterService } from './document-master.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DocumentMasterController],
  providers: [DocumentMasterService],
})
export class DocumentMasterModule {}
