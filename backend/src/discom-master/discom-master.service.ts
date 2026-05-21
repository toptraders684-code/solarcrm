import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DiscomMasterService {
  constructor(private prisma: PrismaService) {}

  private readonly include = {
    district: { select: { id: true, name: true, state: { select: { id: true, name: true } } } },
  };

  async list(districtId?: string) {
    const where: any = { isActive: true };
    if (districtId) where.districtId = districtId;
    const data = await this.prisma.masterDiscom.findMany({
      where,
      include: this.include,
      orderBy: [{ sortOrder: 'asc' }, { code: 'asc' }],
    });
    return { data };
  }

  async listAll() {
    const data = await this.prisma.masterDiscom.findMany({
      where: { districtId: { not: null } },
      include: this.include,
      orderBy: [{ districtId: 'asc' }, { sortOrder: 'asc' }, { code: 'asc' }],
    });
    return { data };
  }

  async create(body: {
    districtId?: string;
    code: string;
    name: string;
    fullform?: string;
    headquarters?: string;
    sortOrder?: number;
  }) {
    const data = await this.prisma.masterDiscom.create({
      data: {
        districtId: body.districtId ?? null,
        code: body.code.trim().toUpperCase(),
        name: body.name.trim(),
        fullform: body.fullform?.trim() ?? null,
        headquarters: body.headquarters?.trim() ?? null,
        sortOrder: body.sortOrder ?? 0,
      },
      include: this.include,
    });
    return { data };
  }

  async update(
    id: string,
    body: {
      districtId?: string | null;
      code?: string;
      name?: string;
      fullform?: string | null;
      headquarters?: string | null;
      sortOrder?: number;
      isActive?: boolean;
    },
  ) {
    const existing = await this.prisma.masterDiscom.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('DISCOM not found');
    const updateData: any = {};
    if (body.districtId !== undefined) updateData.districtId = body.districtId;
    if (body.code !== undefined) updateData.code = body.code.trim().toUpperCase();
    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.fullform !== undefined) updateData.fullform = body.fullform?.trim() ?? null;
    if (body.headquarters !== undefined) updateData.headquarters = body.headquarters?.trim() ?? null;
    if (body.sortOrder !== undefined) updateData.sortOrder = body.sortOrder;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    const data = await this.prisma.masterDiscom.update({ where: { id }, data: updateData, include: this.include });
    return { data };
  }

  async remove(id: string) {
    const existing = await this.prisma.masterDiscom.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('DISCOM not found');
    await this.prisma.masterDiscom.delete({ where: { id } });
    return { id };
  }
}
