import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommissionStructureDto } from './dto/create-commission-structure.dto';

@Injectable()
export class CommissionStructuresService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const data = await this.prisma.commissionStructure.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { assignments: true } } },
    });
    return { data };
  }

  async findOne(id: string) {
    const item = await this.prisma.commissionStructure.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Commission structure not found');
    return { data: item };
  }

  async create(dto: CreateCommissionStructureDto) {
    const data = await this.prisma.commissionStructure.create({
      data: {
        name: dto.name,
        structureType: dto.structureType,
        configSchema: dto.configSchema as any,
        description: dto.description,
        isActive: dto.isActive ?? true,
      },
    });
    return { data };
  }

  async update(id: string, dto: Partial<CreateCommissionStructureDto>) {
    await this.findOne(id);
    const data = await this.prisma.commissionStructure.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.structureType && { structureType: dto.structureType }),
        ...(dto.configSchema && { configSchema: dto.configSchema as any }),
        ...(dto.description !== undefined && { description: dto.description }),
      },
    });
    return { data };
  }

  async toggle(id: string) {
    const item = await this.prisma.commissionStructure.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Commission structure not found');
    const data = await this.prisma.commissionStructure.update({
      where: { id },
      data: { isActive: !item.isActive },
    });
    return { data };
  }
}
