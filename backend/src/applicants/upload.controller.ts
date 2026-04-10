import {
  Controller,
  Post,
  Param,
  Body,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'application/pdf'];

@Controller('upload')
export class UploadController {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
  ) {}

  @Post(':token')
  @UseInterceptors(FileInterceptor('file'))
  async customerUpload(
    @Param('token') token: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { docName?: string; category?: string; consent?: string },
  ) {
    if (!body.consent || body.consent !== 'true') {
      throw new BadRequestException('Consent is required before uploading documents');
    }

    const uploadLink = await this.prisma.customerUploadLink.findUnique({ where: { token } });
    if (!uploadLink) throw new NotFoundException('Upload link not found');
    if (uploadLink.expiresAt < new Date()) throw new BadRequestException('Upload link has expired');
    if (uploadLink.usedAt) throw new BadRequestException('Upload link already used');

    if (!file) throw new BadRequestException('No file uploaded');
    if (file.size > MAX_FILE_SIZE) throw new BadRequestException('File exceeds 2MB limit');
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      throw new BadRequestException('Only JPG, PNG, PDF allowed');
    }

    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    const category = body.category || 'kyc';
    const filePath = this.storage.buildPath('applicants', uploadLink.applicantId, category, filename);

    const fileKey = await this.storage.uploadFile(file.buffer, filePath, file.mimetype);

    const document = await this.prisma.document.create({
      data: {
        applicantId: uploadLink.applicantId,
        category: category as any,
        docName: body.docName || file.originalname,
        fileKey,
        fileName: file.originalname,
        fileSizeBytes: file.size,
        mimeType: file.mimetype,
        status: 'uploaded',
        uploadedAt: new Date(),
      },
    });

    // Mark link as used
    await this.prisma.customerUploadLink.update({
      where: { id: uploadLink.id },
      data: { usedAt: new Date() },
    });

    // Record consent on applicant
    await this.prisma.applicant.update({
      where: { id: uploadLink.applicantId },
      data: { consentGiven: true, consentTimestamp: new Date() },
    });

    return { message: 'Document uploaded successfully', documentId: document.id };
  }
}
