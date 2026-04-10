import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('finance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FinanceController {
  constructor(private financeService: FinanceService) {}

  @Get()
  @Roles('admin', 'finance_manager', 'operations_staff')
  findAll(@CurrentUser() user: any, @Query() query: any) {
    return this.financeService.findAll(user.companyId, query);
  }

  // Alias: frontend calls GET /finance/transactions
  @Get('transactions')
  @Roles('admin', 'finance_manager', 'operations_staff')
  findAllTransactions(@CurrentUser() user: any, @Query() query: any) {
    return this.financeService.findAll(user.companyId, query);
  }

  @Get('summary')
  @Roles('admin', 'finance_manager', 'operations_staff')
  getSummary(@CurrentUser() user: any) {
    return this.financeService.getSummary(user.companyId);
  }

  @Post('transactions')
  @Roles('admin', 'finance_manager', 'operations_staff')
  create(@Body() dto: CreateTransactionDto, @CurrentUser() user: any) {
    return this.financeService.create(dto, user.companyId, user.id);
  }

  @Patch('transactions/:id/approve')
  @Roles('admin', 'finance_manager')
  approvePatch(@Param('id') id: string, @CurrentUser() user: any) {
    return this.financeService.approve(id, user.companyId, user.id, user.role);
  }

  // Alias: frontend calls POST for approve/reject
  @Post('transactions/:id/approve')
  @Roles('admin', 'finance_manager')
  approvePost(@Param('id') id: string, @CurrentUser() user: any) {
    return this.financeService.approve(id, user.companyId, user.id, user.role);
  }

  @Patch('transactions/:id/reject')
  @Roles('admin', 'finance_manager')
  rejectPatch(@Param('id') id: string, @Body() body: { reason?: string }, @CurrentUser() user: any) {
    return this.financeService.reject(id, user.companyId, user.id, user.role, body.reason);
  }

  // Alias: frontend calls POST for reject
  @Post('transactions/:id/reject')
  @Roles('admin', 'finance_manager')
  rejectPost(@Param('id') id: string, @Body() body: { reason?: string }, @CurrentUser() user: any) {
    return this.financeService.reject(id, user.companyId, user.id, user.role, body.reason);
  }
}
