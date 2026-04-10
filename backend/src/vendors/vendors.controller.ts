import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { VendorsService } from './vendors.service';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('vendors')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VendorsController {
  constructor(private vendorsService: VendorsService) {}

  @Get()
  @Roles('admin', 'operations_staff', 'finance_manager')
  findAll(@CurrentUser() user: any, @Query() query: any) {
    return this.vendorsService.findAll(user.companyId, query);
  }

  @Get(':id')
  @Roles('admin', 'operations_staff', 'finance_manager')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.vendorsService.findOne(id, user.companyId);
  }

  @Post()
  @Roles('admin', 'operations_staff')
  create(@Body() dto: CreateVendorDto, @CurrentUser() user: any) {
    return this.vendorsService.create(dto, user.companyId, user.id);
  }

  @Patch(':id')
  @Roles('admin', 'operations_staff')
  update(@Param('id') id: string, @Body() dto: Partial<CreateVendorDto>, @CurrentUser() user: any) {
    return this.vendorsService.update(id, dto, user.companyId, user.id);
  }

  @Delete(':id')
  @Roles('admin', 'operations_staff')
  deactivate(@Param('id') id: string, @CurrentUser() user: any) {
    return this.vendorsService.deactivate(id, user.companyId);
  }
}
