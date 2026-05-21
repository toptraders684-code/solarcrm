import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { DiscomMasterService } from './discom-master.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('discom-master')
@UseGuards(JwtAuthGuard)
export class DiscomMasterController {
  constructor(private service: DiscomMasterService) {}

  // All authenticated users — used by lead/applicant forms to filter by district
  @Get()
  list(@Query('districtId') districtId?: string) {
    return this.service.list(districtId);
  }

  // Superadmin only — full list including inactive for management UI
  @Get('all')
  @UseGuards(RolesGuard)
  @Roles('super_admin')
  listAll() {
    return this.service.listAll();
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('super_admin')
  create(@Body() body: { districtId?: string; code: string; name: string; fullform?: string; headquarters?: string; sortOrder?: number }) {
    return this.service.create(body);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('super_admin')
  update(
    @Param('id') id: string,
    @Body() body: { districtId?: string | null; code?: string; name?: string; fullform?: string | null; headquarters?: string | null; sortOrder?: number; isActive?: boolean },
  ) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('super_admin')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
