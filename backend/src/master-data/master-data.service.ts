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
    const where: any = activeOnly ? { isActive: true } : {};
    // Reference DISCOMs in Master Data have no district — exclude DISCOM Master entries
    if (type === 'discoms') where.districtId = null;
    const items = await delegate.findMany({ where, orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] });
    return { data: items };
  }

  async createSimple(type: SimpleTable, dto: CreateMasterItemDto) {
    const delegate = this.getDelegate(type);
    const data: any = {
      name: dto.name.trim(),
      code: dto.code.trim().toLowerCase().replace(/\s+/g, '_'),
      sortOrder: dto.sortOrder ?? 0,
    };
    if (type === 'discoms') {
      data.fullform = dto.fullform?.trim() ?? null;
      data.headquarters = dto.headquarters?.trim() ?? null;
    }
    const item = await delegate.create({ data });
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
    if (type === 'discoms') {
      if (dto.fullform !== undefined) data.fullform = dto.fullform?.trim() ?? null;
      if (dto.headquarters !== undefined) data.headquarters = dto.headquarters?.trim() ?? null;
    }

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

  // ── States ────────────────────────────────────────────────────────

  async listStates() {
    const data = await this.prisma.masterState.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { districts: true } } },
    });
    return { data };
  }

  async createState(body: { name: string; code: string }) {
    const data = await this.prisma.masterState.create({
      data: { name: body.name.trim(), code: body.code.trim().toUpperCase() },
    });
    return { data };
  }

  async updateState(id: string, body: { name?: string; code?: string }) {
    const existing = await this.prisma.masterState.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('State not found');
    const update: any = {};
    if (body.name !== undefined) update.name = body.name.trim();
    if (body.code !== undefined) update.code = body.code.trim().toUpperCase();
    const data = await this.prisma.masterState.update({ where: { id }, data: update });
    return { data };
  }

  async deleteState(id: string) {
    const count = await this.prisma.masterDistrict.count({ where: { stateId: id } });
    if (count > 0) throw new BadRequestException(`Cannot delete: ${count} district(s) still linked to this state`);
    await this.prisma.masterState.delete({ where: { id } });
    return { id };
  }

  // ── Districts ─────────────────────────────────────────────────────

  async listDistricts() {
    const data = await this.prisma.masterDistrict.findMany({
      orderBy: [{ state: { name: 'asc' } }, { name: 'asc' }],
      include: { state: { select: { id: true, name: true, code: true } } },
    });
    return { data };
  }

  async createDistrict(body: { name: string; stateId: string }) {
    const stateExists = await this.prisma.masterState.findUnique({ where: { id: body.stateId } });
    if (!stateExists) throw new NotFoundException('State not found');
    const data = await this.prisma.masterDistrict.create({
      data: { name: body.name.trim(), stateId: body.stateId },
      include: { state: { select: { id: true, name: true, code: true } } },
    });
    return { data };
  }

  async updateDistrict(id: string, body: { name?: string; stateId?: string }) {
    const existing = await this.prisma.masterDistrict.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('District not found');
    const update: any = {};
    if (body.name !== undefined) update.name = body.name.trim();
    if (body.stateId !== undefined) update.stateId = body.stateId;
    const data = await this.prisma.masterDistrict.update({
      where: { id },
      data: update,
      include: { state: { select: { id: true, name: true, code: true } } },
    });
    return { data };
  }

  async deleteDistrict(id: string) {
    const leadsCount = await this.prisma.lead.count({ where: { addressDistrictId: id } });
    const appCount = await this.prisma.applicant.count({ where: { addressDistrictId: id } });
    if (leadsCount + appCount > 0)
      throw new BadRequestException(`Cannot delete: district is used by ${leadsCount + appCount} record(s)`);
    await this.prisma.masterDistrict.delete({ where: { id } });
    return { id };
  }

  // ── Headquarters ──────────────────────────────────────────────────

  async listHq(activeOnly = false) {
    const where = activeOnly ? { isActive: true } : {};
    const data = await this.prisma.masterHeadquarters.findMany({
      where,
      orderBy: { name: 'asc' },
    });
    return { data };
  }

  async createHq(body: { name: string }) {
    const data = await this.prisma.masterHeadquarters.create({
      data: { name: body.name.trim() },
    });
    return { data };
  }

  async updateHq(id: string, body: { name?: string; isActive?: boolean }) {
    const existing = await this.prisma.masterHeadquarters.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Headquarters not found');
    const update: any = {};
    if (body.name !== undefined) update.name = body.name.trim();
    if (body.isActive !== undefined) update.isActive = body.isActive;
    const data = await this.prisma.masterHeadquarters.update({ where: { id }, data: update });
    return { data };
  }
}
