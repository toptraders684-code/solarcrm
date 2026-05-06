import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMasterItemDto, CreateStageDto, UpdateMasterItemDto, UpdateStageDto } from './dto/master-item.dto';

type SimpleTable = 'discoms' | 'lead-sources' | 'vendor-types' | 'payment-methods' | 'project-types';

const TABLE_MAP: Record<SimpleTable, keyof PrismaService> = {
  'discoms':          'masterDiscom',
  'lead-sources':     'masterLeadSource',
  'vendor-types':     'masterVendorType',
  'payment-methods':  'masterPaymentMethod',
  'project-types':    'masterProjectType',
};

@Injectable()
export class MasterDataService {
  constructor(private prisma: PrismaService) {}

  private getDelegate(type: SimpleTable) {
    const key = TABLE_MAP[type];
    if (!key) throw new BadRequestException(`Unknown master type: ${type}`);
    return (this.prisma as any)[key];
  }

  async listSimple(type: SimpleTable, activeOnly = false) {
    const delegate = this.getDelegate(type);
    const where = activeOnly ? { isActive: true } : {};
    const items = await delegate.findMany({ where, orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] });
    return { data: items };
  }

  async createSimple(type: SimpleTable, dto: CreateMasterItemDto) {
    const delegate = this.getDelegate(type);
    const item = await delegate.create({
      data: {
        name: dto.name.trim(),
        code: dto.code.trim().toLowerCase().replace(/\s+/g, '_'),
        sortOrder: dto.sortOrder ?? 0,
      },
    });
    return item;
  }

  async updateSimple(type: SimpleTable, id: string, dto: UpdateMasterItemDto) {
    const delegate = this.getDelegate(type);
    const existing = await delegate.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Item not found');

    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.code !== undefined) data.code = dto.code.trim().toLowerCase().replace(/\s+/g, '_');
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.sortOrder !== undefined) data.sortOrder = dto.sortOrder;

    return delegate.update({ where: { id }, data });
  }

  async deleteSimple(type: SimpleTable, id: string) {
    const delegate = this.getDelegate(type);
    const existing = await delegate.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Item not found');
    await delegate.update({ where: { id }, data: { isActive: false } });
    return { id, isActive: false };
  }

  // ── Stages ────────────────────────────────────────────────────────

  async listStages(activeOnly = false) {
    const where = activeOnly ? { isActive: true } : {};
    const items = await this.prisma.masterStage.findMany({
      where,
      orderBy: { stageNumber: 'asc' },
    });
    return { data: items };
  }

  async createStage(dto: CreateStageDto) {
    return this.prisma.masterStage.create({
      data: {
        stageNumber: dto.stageNumber,
        name: dto.name.trim(),
        description: dto.description?.trim() ?? null,
      },
    });
  }

  async updateStage(id: string, dto: UpdateStageDto) {
    const existing = await this.prisma.masterStage.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Stage not found');
    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.description !== undefined) data.description = dto.description?.trim() ?? null;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    return this.prisma.masterStage.update({ where: { id }, data });
  }
}
