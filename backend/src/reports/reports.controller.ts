import { Controller, Get, Post, Body, UseGuards, Res } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Response } from 'express';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('dashboard')
  @Roles('admin', 'operations_staff', 'field_technician', 'finance_manager', 'vendor')
  getDashboard(@CurrentUser() user: any) {
    return this.reportsService.getDashboardStats(user.companyId);
  }

  @Post('preview')
  @Roles('admin', 'operations_staff', 'finance_manager')
  preview(@Body() dto: any, @CurrentUser() user: any) {
    return this.reportsService.preview(dto, user.companyId);
  }

  @Post('export/pdf')
  @Roles('admin', 'operations_staff', 'finance_manager')
  async exportPdf(@Body() dto: any, @CurrentUser() user: any, @Res() res: Response) {
    const buffer = await this.reportsService.exportPdf(dto, user.companyId);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="report.pdf"',
    });
    res.send(buffer);
  }

  @Post('export/excel')
  @Roles('admin', 'operations_staff', 'finance_manager')
  async exportExcel(@Body() dto: any, @CurrentUser() user: any, @Res() res: Response) {
    const buffer = await this.reportsService.exportExcel(dto, user.companyId);
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="report.xlsx"',
    });
    res.send(buffer);
  }
}
