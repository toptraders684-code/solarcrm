import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { CommissionStructuresService } from './commission-structures.service';
import { CreateCommissionStructureDto } from './dto/create-commission-structure.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('commission-structures')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CommissionStructuresController {
  constructor(private service: CommissionStructuresService) {}

  @Get()
  @Roles('super_admin', 'admin')
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @Roles('super_admin', 'admin')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles('super_admin')
  create(@Body() dto: CreateCommissionStructureDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @Roles('super_admin')
  update(@Param('id') id: string, @Body() dto: Partial<CreateCommissionStructureDto>) {
    return this.service.update(id, dto);
  }

  @Patch(':id/toggle')
  @Roles('super_admin')
  toggle(@Param('id') id: string) {
    return this.service.toggle(id);
  }
}
