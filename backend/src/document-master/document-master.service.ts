import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DocumentMasterService {
  constructor(private prisma: PrismaService) {}

  async list(discom?: string) {
    const where: any = { isActive: true };
    if (discom) where.discom = discom;
    const data = await this.prisma.documentMaster.findMany({
      where,
      orderBy: [{ discom: 'asc' }, { sortOrder: 'asc' }],
    });
    return { data };
  }

  async create(body: { discom: string; title: string; canGenerate?: boolean; sortOrder?: number }) {
    const maxOrder = await this.prisma.documentMaster.aggregate({
      where: { discom: body.discom as any },
      _max: { sortOrder: true },
    });
    const data = await this.prisma.documentMaster.create({
      data: {
        discom: body.discom as any,
        title: body.title,
        canGenerate: body.canGenerate ?? false,
        sortOrder: body.sortOrder ?? (maxOrder._max.sortOrder ?? 0) + 1,
      },
    });
    return { data };
  }

  async update(id: string, body: { title?: string; canGenerate?: boolean; sortOrder?: number; isActive?: boolean }) {
    const existing = await this.prisma.documentMaster.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Document master item not found');
    const data = await this.prisma.documentMaster.update({ where: { id }, data: body });
    return { data };
  }

  async remove(id: string) {
    const existing = await this.prisma.documentMaster.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Document master item not found');
    await this.prisma.documentMaster.update({ where: { id }, data: { isActive: false } });
    return { message: 'Deleted' };
  }
}
