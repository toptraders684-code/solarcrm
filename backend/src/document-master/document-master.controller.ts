import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { DocumentMasterService } from './document-master.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('document-master')
@UseGuards(JwtAuthGuard)
export class DocumentMasterController {
  constructor(private service: DocumentMasterService) {}

  @Get()
  list(@Query('discom') discom?: string) {
    return this.service.list(discom);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('super_admin')
  create(@Body() body: { discom: string; title: string; canGenerate?: boolean; sortOrder?: number }) {
    return this.service.create(body);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('super_admin')
  update(@Param('id') id: string, @Body() body: { title?: string; canGenerate?: boolean; sortOrder?: number; isActive?: boolean }) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('super_admin')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
