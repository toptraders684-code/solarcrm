import { Module } from '@nestjs/common';
import { VendorCommissionController } from './vendor-commission.controller';
import { VendorCommissionService } from './vendor-commission.service';

@Module({
  controllers: [VendorCommissionController],
  providers: [VendorCommissionService],
})
export class VendorCommissionModule {}
