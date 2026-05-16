import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateVendorDto } from './dto/create-vendor.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class VendorsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async findAll(companyId: string, query: any) {
    const { limit = 25, page = 1, search, q, vendorType } = query;

    const where: any = { companyId, deletedAt: null };

    const searchTerm = search || q;
    if (searchTerm) {
      where.OR = [
        { businessName: { contains: searchTerm, mode: 'insensitive' } },
        { mobile: { contains: searchTerm } },
        { contactPerson: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    if (vendorType) {
      where.vendorTypes = { has: vendorType };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [vendors, total] = await Promise.all([
      this.prisma.vendor.findMany({
        where,
        take: parseInt(limit),
        skip,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.vendor.count({ where }),
    ]);

    return {
      data: vendors,
      meta: { total, page: parseInt(page), limit: parseInt(limit) },
    };
  }

  async findOne(id: string, companyId: string) {
    const vendor = await this.prisma.vendor.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!vendor) throw new NotFoundException('Vendor not found');
    return vendor;
  }

  async create(dto: CreateVendorDto, companyId: string, userId: string) {
    // If login credentials are provided, check for mobile uniqueness before writing anything
    if (dto.loginMobile && dto.loginPassword) {
      const existing = await this.prisma.user.findFirst({ where: { mobile: dto.loginMobile, companyId } });
      if (existing) throw new ConflictException('Login mobile is already in use by another user');
    }

    const vendorData = {
      businessName: dto.businessName,
      contactPerson: dto.contactPerson,
      vendorTypes: dto.vendorTypes,
      mobile: dto.mobile,
      email: dto.email,
      addressVillage: dto.addressVillage,
      addressDistrict: dto.addressDistrict,
      addressState: dto.addressState,
      gstin: dto.gstin,
      ifscCode: dto.ifscCode,
      empanelmentDate: dto.empanelmentDate ? new Date(dto.empanelmentDate) : undefined,
      companyId,
    };

    let vendor: any;
    let loginUser: any;

    if (dto.loginMobile && dto.loginPassword) {
      const passwordHash = await bcrypt.hash(dto.loginPassword, 12);
      [vendor, loginUser] = await this.prisma.$transaction(async (tx) => {
        const v = await tx.vendor.create({ data: vendorData });
        const u = await tx.user.create({
          data: {
            name: dto.contactPerson || dto.businessName,
            mobile: dto.loginMobile!,
            passwordHash,
            role: 'vendor',
            vendorLevel: null,
            vendorId: v.id,
            companyId,
            status: 'active',
            ipWhitelist: [],
          },
        });
        return [v, u];
      });
    } else {
      vendor = await this.prisma.vendor.create({ data: vendorData });
    }

    await this.audit.log({
      entityType: 'Vendor',
      entityId: vendor.id,
      action: 'CREATE',
      afterJson: { id: vendor.id, businessName: vendor.businessName, loginCreated: !!loginUser },
      userId,
      companyId,
    });

    return { ...vendor, loginCreated: !!loginUser };
  }

  async update(id: string, dto: Partial<CreateVendorDto>, companyId: string, userId: string) {
    await this.findOne(id, companyId);

    const data: any = { ...dto };
    if (data.empanelmentDate) data.empanelmentDate = new Date(data.empanelmentDate);

    const updated = await this.prisma.vendor.update({
      where: { id },
      data,
    });

    await this.audit.log({
      entityType: 'Vendor',
      entityId: id,
      action: 'UPDATE',
      afterJson: dto as any,
      userId,
      companyId,
    });

    return updated;
  }

  async deactivate(id: string, companyId: string) {
    await this.findOne(id, companyId);
    await this.prisma.vendor.update({
      where: { id },
      data: { isActive: false, deletedAt: new Date() },
    });
    return { success: true };
  }
}
