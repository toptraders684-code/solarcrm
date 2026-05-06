import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ActivityLogService } from './activity-log.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('activity-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ActivityLogController {
  constructor(private activityLogService: ActivityLogService) {}

  // Super admin: see ALL logs across companies
  // Admin: see logs scoped to their company only
  @Get()
  @Roles('super_admin', 'admin')
  findAll(@CurrentUser() user: any, @Query() query: any) {
    const companyId = user.role === 'super_admin' ? query.companyId : user.companyId;
    return this.activityLogService.findAll({
      ...query,
      companyId,
    });
  }
}
