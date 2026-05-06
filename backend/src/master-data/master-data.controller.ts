import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { MasterDataService } from './master-data.service';
import { CreateMasterItemDto, CreateStageDto, UpdateMasterItemDto, UpdateStageDto } from './dto/master-item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

type SimpleTable = 'discoms' | 'lead-sources' | 'vendor-types' | 'payment-methods' | 'project-types';

@Controller('master-data')
@UseGuards(JwtAuthGuard)
export class MasterDataController {
  constructor(private masterDataService: MasterDataService) {}

  // ── Simple tables ─────────────────────────────────────────────────

  @Get(':type')
  listSimple(@Param('type') type: SimpleTable, @Query('activeOnly') activeOnly?: string) {
    return this.masterDataService.listSimple(type, activeOnly === 'true');
  }

  @Post(':type')
  @UseGuards(RolesGuard)
  @Roles('super_admin')
  createSimple(@Param('type') type: SimpleTable, @Body() dto: CreateMasterItemDto) {
    return this.masterDataService.createSimple(type, dto);
  }

  @Patch(':type/:id')
  @UseGuards(RolesGuard)
  @Roles('super_admin')
  updateSimple(@Param('type') type: SimpleTable, @Param('id') id: string, @Body() dto: UpdateMasterItemDto) {
    return this.masterDataService.updateSimple(type, id, dto);
  }

  @Delete(':type/:id')
  @UseGuards(RolesGuard)
  @Roles('super_admin')
  deleteSimple(@Param('type') type: SimpleTable, @Param('id') id: string) {
    return this.masterDataService.deleteSimple(type, id);
  }

  // ── Stages ────────────────────────────────────────────────────────

  @Get('stages/list')
  listStages(@Query('activeOnly') activeOnly?: string) {
    return this.masterDataService.listStages(activeOnly === 'true');
  }

  @Post('stages/create')
  @UseGuards(RolesGuard)
  @Roles('super_admin')
  createStage(@Body() dto: CreateStageDto) {
    return this.masterDataService.createStage(dto);
  }

  @Patch('stages/:id')
  @UseGuards(RolesGuard)
  @Roles('super_admin')
  updateStage(@Param('id') id: string, @Body() dto: UpdateStageDto) {
    return this.masterDataService.updateStage(id, dto);
  }
}
