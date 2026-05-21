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

  // ── Stages ────────────────────────────────────────────────────────
  // Specific routes first to take precedence over :type/:id wildcard

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

  // ── States ────────────────────────────────────────────────────────

  @Get('states/list')
  listStates() {
    return this.masterDataService.listStates();
  }

  @Post('states/create')
  @UseGuards(RolesGuard)
  @Roles('super_admin')
  createState(@Body() body: { name: string; code: string }) {
    return this.masterDataService.createState(body);
  }

  @Patch('states/:id')
  @UseGuards(RolesGuard)
  @Roles('super_admin')
  updateState(@Param('id') id: string, @Body() body: { name?: string; code?: string }) {
    return this.masterDataService.updateState(id, body);
  }

  @Delete('states/:id')
  @UseGuards(RolesGuard)
  @Roles('super_admin')
  deleteState(@Param('id') id: string) {
    return this.masterDataService.deleteState(id);
  }

  // ── Districts ─────────────────────────────────────────────────────

  @Get('districts/list')
  listDistricts() {
    return this.masterDataService.listDistricts();
  }

  @Post('districts/create')
  @UseGuards(RolesGuard)
  @Roles('super_admin')
  createDistrict(@Body() body: { name: string; stateId: string }) {
    return this.masterDataService.createDistrict(body);
  }

  @Patch('districts/:id')
  @UseGuards(RolesGuard)
  @Roles('super_admin')
  updateDistrict(@Param('id') id: string, @Body() body: { name?: string; stateId?: string }) {
    return this.masterDataService.updateDistrict(id, body);
  }

  @Delete('districts/:id')
  @UseGuards(RolesGuard)
  @Roles('super_admin')
  deleteDistrict(@Param('id') id: string) {
    return this.masterDataService.deleteDistrict(id);
  }

  // ── Headquarters ──────────────────────────────────────────────────

  @Get('hq/list')
  listHq(@Query('activeOnly') activeOnly?: string) {
    return this.masterDataService.listHq(activeOnly === 'true');
  }

  @Post('hq/create')
  @UseGuards(RolesGuard)
  @Roles('super_admin')
  createHq(@Body() body: { name: string }) {
    return this.masterDataService.createHq(body);
  }

  @Patch('hq/:id')
  @UseGuards(RolesGuard)
  @Roles('super_admin')
  updateHq(@Param('id') id: string, @Body() body: { name?: string; isActive?: boolean }) {
    return this.masterDataService.updateHq(id, body);
  }

  // ── Simple tables ─────────────────────────────────────────────────
  // Wildcard routes last so specific routes above always win

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
}
