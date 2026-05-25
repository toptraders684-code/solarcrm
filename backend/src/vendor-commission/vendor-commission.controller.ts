import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { VendorCommissionService } from './vendor-commission.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { SaveConfigDto } from './dto/save-config.dto';
import { GeneratePayablesDto } from './dto/generate-payables.dto';
import { AddIncentiveDto } from './dto/add-incentive.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('vendor-commission')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class VendorCommissionController {
  constructor(private service: VendorCommissionService) {}

  // Assignments
  @Get('assignments')
  getAssignments(@CurrentUser() user: any) {
    return this.service.getAssignments(user.companyId);
  }

  @Get('assignments/:id')
  getAssignment(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.getAssignment(id, user.companyId);
  }

  @Post('assignments')
  createAssignment(@Body() dto: CreateAssignmentDto, @CurrentUser() user: any) {
    return this.service.createAssignment(dto, user.companyId);
  }

  @Patch('assignments/:id/toggle')
  toggleAssignment(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.toggleAssignment(id, user.companyId);
  }

  // Config
  @Post('assignments/:id/config')
  saveConfig(@Param('id') id: string, @Body() dto: SaveConfigDto, @CurrentUser() user: any) {
    return this.service.saveConfig(id, dto, user.companyId);
  }

  // Payables
  @Post('payables/generate')
  generatePayables(@Body() dto: GeneratePayablesDto, @CurrentUser() user: any) {
    return this.service.generatePayables(dto, user.companyId);
  }

  @Get('payables')
  getPayables(@CurrentUser() user: any, @Query() query: any) {
    return this.service.getPayables(user.companyId, query);
  }

  @Get('payables/:id')
  getPayable(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.getPayable(id, user.companyId);
  }

  @Patch('payables/:id/approve')
  approvePayable(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.approvePayable(id, user.companyId, user.id);
  }

  @Patch('payables/:id/salary')
  updateSalary(@Param('id') id: string, @Body() body: { salaryAmount: number }, @CurrentUser() user: any) {
    return this.service.updateSalary(id, body.salaryAmount, user.companyId);
  }

  @Post('payables/:id/incentives')
  addIncentive(@Param('id') id: string, @Body() dto: AddIncentiveDto, @CurrentUser() user: any) {
    return this.service.addIncentive(id, dto, user.companyId);
  }

  @Delete('payables/:payableId/incentives/:incentiveId')
  removeIncentive(
    @Param('payableId') payableId: string,
    @Param('incentiveId') incentiveId: string,
    @CurrentUser() user: any,
  ) {
    return this.service.removeIncentive(payableId, incentiveId, user.companyId);
  }
}
