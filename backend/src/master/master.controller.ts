import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { MasterService } from './master.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('master')
@UseGuards(JwtAuthGuard)
export class MasterController {
  constructor(private masterService: MasterService) {}

  @Get('states')
  getStates() {
    return this.masterService.getStates();
  }

  @Get('districts')
  getDistricts(@Query('stateId') stateId?: string) {
    return this.masterService.getDistricts(stateId);
  }

  @Get('enums')
  getEnums() {
    return this.masterService.getEnums();
  }
}
