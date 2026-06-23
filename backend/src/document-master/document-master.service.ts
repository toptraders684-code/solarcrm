import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

@Injectable()
export class DocumentMasterService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
  ) {}

  async list(discom?: string) {
    const where: any = { isActive: true };
    if (discom) {
      where.OR = [
        { discom: { equals: discom, mode: 'insensitive' }, isCommon: false },
        { isCommon: true },
      ];
    }
    const data = await this.prisma.documentMaster.findMany({
      where,
      orderBy: [{ isCommon: 'desc' }, { sortOrder: 'asc' }],
    });
    return { data };
  }

  async create(body: { discom?: string; title: string; docType?: string; sortOrder?: number; isCommon?: boolean }) {
    const isCommon = body.isCommon ?? false;
    const maxOrder = await this.prisma.documentMaster.aggregate({
      where: isCommon ? { isCommon: true } : { discom: body.discom as any },
      _max: { sortOrder: true },
    });
    const data = await this.prisma.documentMaster.create({
      data: {
        discom: isCommon ? null : (body.discom as any),
        title: body.title,
        docType: (body.docType as any) ?? 'upload',
        sortOrder: body.sortOrder ?? (maxOrder._max.sortOrder ?? 0) + 1,
        isCommon,
      },
    });
    return { data };
  }

  async update(id: string, body: { title?: string; docType?: string; sortOrder?: number; isActive?: boolean; isCommon?: boolean }) {
    const existing = await this.prisma.documentMaster.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Document master item not found');
    const data = await this.prisma.documentMaster.update({ where: { id }, data: body as any });
    return { data };
  }

  async remove(id: string) {
    const existing = await this.prisma.documentMaster.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Document master item not found');
    await this.prisma.documentMaster.update({ where: { id }, data: { isActive: false } });
    return { message: 'Deleted' };
  }

  async uploadMasterFile(id: string, file: Express.Multer.File) {
    const existing = await this.prisma.documentMaster.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Document master item not found');

    if (existing.masterFilePath) {
      await this.storage.deleteFile(existing.masterFilePath).catch(() => {});
    }

    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    const fileKey = this.storage.buildPath('master', id, 'view', filename);
    await this.storage.uploadFile(file.buffer, fileKey, file.mimetype);

    const data = await this.prisma.documentMaster.update({
      where: { id },
      data: { masterFilePath: fileKey, masterFileMime: file.mimetype },
    });
    return { data };
  }

  async getMasterFile(id: string) {
    const item = await this.prisma.documentMaster.findUnique({ where: { id } });
    if (!item || !item.masterFilePath) throw new NotFoundException('File not found');
    const buffer = await this.storage.downloadFile(item.masterFilePath);
    return { buffer, item };
  }

  async getTemplate(id: string) {
    const item = await this.prisma.documentMaster.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Document master item not found');
    return { templateContent: item.templateContent ?? null, title: item.title };
  }

  async saveTemplate(id: string, templateContent: any) {
    const existing = await this.prisma.documentMaster.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Document master item not found');
    const data = await this.prisma.documentMaster.update({
      where: { id },
      data: { templateContent },
    });
    return { data };
  }
}
