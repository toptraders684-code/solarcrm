import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const companies = await this.prisma.company.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { users: true, leads: true, applicants: true } },
        users: {
          where: { role: 'admin', deletedAt: null },
          select: { id: true, name: true, mobile: true, email: true, status: true },
          take: 1,
        },
      },
    });
    return { data: companies };
  }

  async create(dto: CreateCompanyDto) {
    const passwordHash = await bcrypt.hash(dto.adminPassword, 12);

    const result = await this.prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: { name: dto.companyName.trim(), status: 'active' },
      });

      const admin = await tx.user.create({
        data: {
          companyId: company.id,
          name: dto.adminName.trim(),
          mobile: dto.adminMobile.trim(),
          email: dto.adminEmail?.trim() || null,
          passwordHash,
          role: 'admin',
          status: 'active',
          ipWhitelist: [],
        },
      });

      return { company, admin };
    });

    return {
      companyId: result.company.id,
      companyName: result.company.name,
      adminId: result.admin.id,
      adminName: result.admin.name,
    };
  }

  async updateStatus(id: string, status: string) {
    const company = await this.prisma.company.findUnique({ where: { id } });
    if (!company) throw new NotFoundException('Company not found');

    await this.prisma.company.update({ where: { id }, data: { status } });
    return { id, status };
  }

  async update(id: string, data: { name?: string }) {
    const company = await this.prisma.company.findUnique({ where: { id } });
    if (!company) throw new NotFoundException('Company not found');

    const updated = await this.prisma.company.update({ where: { id }, data });
    return { id: updated.id, name: updated.name };
  }
}
