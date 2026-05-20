import {
  Controller, Get, Post, Patch, Delete, Put,
  Body, Param, Query, Res,
  UseGuards, UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import * as path from 'path';

function buildDocFilename(title: string, mimeOrPath: string): string {
  const safe = title.replace(/[^a-zA-Z0-9\s]/g, '').trim().replace(/\s+/g, '_');
  const dt = new Date().toISOString().slice(0, 19).replace('T', '_').replace(/:/g, '-');
  const ext = mimeOrPath.includes('pdf') ? 'pdf'
    : mimeOrPath.includes('png') ? 'png'
    : mimeOrPath.includes('jpeg') || mimeOrPath.includes('jpg') ? 'jpg'
    : path.extname(mimeOrPath).replace('.', '') || 'pdf';
  return `${safe}_${dt}.${ext}`;
}
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
  create(@Body() body: { discom?: string; title: string; docType?: string; sortOrder?: number; isCommon?: boolean }) {
    return this.service.create(body);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('super_admin')
  update(
    @Param('id') id: string,
    @Body() body: { title?: string; docType?: string; sortOrder?: number; isActive?: boolean; isCommon?: boolean },
  ) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('super_admin')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Post(':id/file')
  @UseGuards(RolesGuard)
  @Roles('super_admin')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    return this.service.uploadMasterFile(id, file);
  }

  @Get(':id/template')
  getTemplate(@Param('id') id: string) {
    return this.service.getTemplate(id);
  }

  @Put(':id/template')
  @UseGuards(RolesGuard)
  @Roles('super_admin')
  saveTemplate(@Param('id') id: string, @Body() body: { templateContent: any }) {
    return this.service.saveTemplate(id, body.templateContent);
  }

  @Get(':id/file')
  async downloadFile(@Param('id') id: string, @Res() res: Response) {
    const { buffer, item } = await this.service.getMasterFile(id);
    const filename = buildDocFilename(item.title, item.masterFileMime || item.masterFilePath || 'pdf');
    res.set('Content-Type', item.masterFileMime || 'application/octet-stream');
    res.set('Content-Disposition', `inline; filename="${filename}"`);
    res.send(buffer);
  }
}
