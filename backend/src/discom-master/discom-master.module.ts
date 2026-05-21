import { Module } from '@nestjs/common';
import { DiscomMasterController } from './discom-master.controller';
import { DiscomMasterService } from './discom-master.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DiscomMasterController],
  providers: [DiscomMasterService],
})
export class DiscomMasterModule {}
