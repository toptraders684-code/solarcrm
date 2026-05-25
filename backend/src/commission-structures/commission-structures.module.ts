import { Module } from '@nestjs/common';
import { CommissionStructuresController } from './commission-structures.controller';
import { CommissionStructuresService } from './commission-structures.service';

@Module({
  controllers: [CommissionStructuresController],
  providers: [CommissionStructuresService],
  exports: [CommissionStructuresService],
})
export class CommissionStructuresModule {}
