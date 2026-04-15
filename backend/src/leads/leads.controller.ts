import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { CreateFollowupDto } from './dto/create-followup.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('leads')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LeadsController {
  constructor(private leadsService: LeadsService) {}

  @Get()
  @Roles('admin', 'operations_staff', 'field_technician')
  findAll(@CurrentUser() user: any, @Query() query: any) {
    return this.leadsService.findAll(user.companyId, query);
  }

  @Post()
  @Roles('admin', 'operations_staff', 'field_technician')
  create(@Body() dto: CreateLeadDto, @CurrentUser() user: any) {
    return this.leadsService.create(dto, user.companyId, user.id);
  }

  @Get(':id')
  @Roles('admin', 'operations_staff', 'field_technician')
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    const data = await this.leadsService.findOne(id, user.companyId);
    return { data };
  }

  @Patch(':id')
  @Roles('admin', 'operations_staff')
  update(@Param('id') id: string, @Body() dto: UpdateLeadDto, @CurrentUser() user: any, @Req() req: any) {
    return this.leadsService.update(id, dto, user.companyId, user.id, req.ip || '');
  }

  @Post(':id/convert')
  @Roles('admin', 'operations_staff')
  async convert(@Param('id') id: string, @CurrentUser() user: any) {
    const applicant = await this.leadsService.convert(id, user.companyId, user.id);
    return { data: { applicant } };
  }

  @Post(':id/close')
  @Roles('admin', 'operations_staff')
  close(@Param('id') id: string, @Body() body: { reason: string; notes?: string }, @CurrentUser() user: any) {
    return this.leadsService.closeLead(id, body.reason, user.companyId, user.id);
  }

  @Post(':id/followups')
  @Roles('admin', 'operations_staff', 'field_technician')
  addFollowup(@Param('id') id: string, @Body() dto: CreateFollowupDto, @CurrentUser() user: any) {
    return this.leadsService.addFollowup(id, dto, user.companyId, user.id);
  }

  @Post('bulk-upload')
  @Roles('admin', 'operations_staff')
  @UseInterceptors(FileInterceptor('file'))
  bulkUpload(@UploadedFile() file: Express.Multer.File, @CurrentUser() user: any) {
    if (!file) throw new Error('No file uploaded');
    return this.leadsService.bulkUpload(file, user.companyId, user.id);
  }
}
