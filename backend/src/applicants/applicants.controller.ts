import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  UploadedFile,
  UseInterceptors,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { ApplicantsService } from './applicants.service';
import { UpdateApplicantDto } from './dto/update-applicant.dto';
import { StageChangeDto } from './dto/stage-change.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('applicants')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ApplicantsController {
  constructor(private applicantsService: ApplicantsService) {}

  @Get()
  @Roles('admin', 'operations_staff', 'finance_manager')
  findAll(@CurrentUser() user: any, @Query() query: any) {
    return this.applicantsService.findAll(user.companyId, query);
  }

  @Get(':id')
  @Roles('admin', 'operations_staff', 'finance_manager', 'field_technician')
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    const data = await this.applicantsService.findOne(id, user.companyId);
    return { data };
  }

  @Patch(':id')
  @Roles('admin', 'operations_staff')
  update(@Param('id') id: string, @Body() dto: UpdateApplicantDto, @CurrentUser() user: any, @Req() req: any) {
    return this.applicantsService.update(id, dto, user.companyId, user.id, req.ip || '');
  }

  @Post(':id/stage')
  @Roles('admin', 'operations_staff')
  changeStage(@Param('id') id: string, @Body() dto: StageChangeDto, @CurrentUser() user: any) {
    return this.applicantsService.changeStage(id, dto, user.companyId, user.id);
  }

  @Post(':id/advance-stage')
  @Roles('admin', 'operations_staff')
  advanceStage(@Param('id') id: string, @CurrentUser() user: any) {
    return this.applicantsService.advanceStage(id, user.companyId, user.id);
  }

  @Get(':id/checklist')
  @Roles('admin', 'operations_staff', 'field_technician')
  getChecklist(@Param('id') id: string, @Query() query: any, @CurrentUser() user: any) {
    return this.applicantsService.getChecklist(id, user.companyId, query.discom, query.projectType);
  }

  @Patch(':id/checklist/:itemId')
  @Roles('admin', 'operations_staff', 'field_technician')
  toggleChecklist(@Param('id') id: string, @Param('itemId') itemId: string, @CurrentUser() user: any) {
    return this.applicantsService.toggleChecklist(id, itemId, user.companyId, user.id);
  }

  @Get(':id/documents')
  @Roles('admin', 'operations_staff', 'finance_manager', 'field_technician')
  listDocuments(@Param('id') id: string, @CurrentUser() user: any) {
    return this.applicantsService.listDocuments(id, user.companyId);
  }

  @Get(':id/transactions')
  @Roles('admin', 'operations_staff', 'finance_manager')
  listTransactions(@Param('id') id: string, @CurrentUser() user: any) {
    return this.applicantsService.listTransactions(id, user.companyId);
  }

  // ── Documents Upload/Download ──

  @Post(':id/documents')
  @Roles('admin', 'operations_staff')
  @UseInterceptors(FileInterceptor('file'))
  uploadDocument(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
    @CurrentUser() user: any,
  ) {
    return this.applicantsService.uploadDocument(id, file, body, user.companyId, user.id);
  }

  @Get(':id/documents/:docId')
  @Roles('admin', 'operations_staff', 'finance_manager')
  async downloadDocument(
    @Param('id') id: string,
    @Param('docId') docId: string,
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    const { buffer, document } = await this.applicantsService.downloadDocument(id, docId, user.companyId);
    res.set({
      'Content-Type': document.mimeType || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${document.fileName || 'document'}"`,
    });
    res.send(buffer);
  }

  @Post(':id/vendors')
  @Roles('admin', 'operations_staff')
  assignVendor(@Param('id') id: string, @Body() body: { vendorId: string; categoryLabel?: string; isPrimary?: boolean }, @CurrentUser() user: any) {
    return this.applicantsService.assignVendor(id, body, user.companyId);
  }

  @Post(':id/vendors/:vendorId/remove')
  @Roles('admin', 'operations_staff')
  removeVendor(@Param('id') id: string, @Param('vendorId') vendorId: string, @CurrentUser() user: any) {
    return this.applicantsService.removeVendor(id, vendorId, user.companyId);
  }

  @Post(':id/upload-link')
  @Roles('admin', 'operations_staff')
  generateUploadLink(@Param('id') id: string, @CurrentUser() user: any, @Req() req: any) {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    return this.applicantsService.generateUploadLink(id, user.companyId, user.id, baseUrl);
  }
}
