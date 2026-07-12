import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { EmailService } from '../notifications/email.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateVendorUserDto } from './dto/create-vendor-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private emailService: EmailService,
  ) {}

  async findAll(companyId: string, query: any, callerRole = 'admin') {
    const { limit = 25, after, role, status, q } = query;

    const where: any = { companyId, deletedAt: null };

    if (role) {
      where.role = role;
    } else if (callerRole === 'super_admin') {
      where.role = { not: 'super_admin' };
    } else {
      // Regular admin/staff cannot see admin or super_admin accounts
      where.role = { notIn: ['super_admin', 'admin'] };
    }

    if (status) where.status = status;
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
      ];
    }
    if (after) where.id = { gt: after };

    const users = await this.prisma.user.findMany({
      where,
      take: parseInt(limit),
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
        role: true,
        vendorLevel: true,
        vendorId: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return { data: users, count: users.length };
  }

  async findOne(id: string, companyId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, companyId, deletedAt: null },
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async create(dto: CreateUserDto, companyId: string, createdBy: string) {
    const existing = await this.prisma.user.findFirst({
      where: { mobile: dto.mobile, companyId },
    });
    if (existing) throw new ConflictException('Mobile already in use');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const { password, ...rest } = dto;

    const user = await this.prisma.user.create({
      data: {
        ...rest,
        passwordHash,
        companyId,
        status: 'pending_approval',
      },
    });

    await this.audit.log({
      entityType: 'User',
      entityId: user.id,
      action: 'CREATE',
      afterJson: { id: user.id, email: user.email, role: user.role },
      userId: createdBy,
      companyId,
    });

    return { id: user.id, name: user.name, email: user.email, role: user.role };
  }

  async update(id: string, dto: UpdateUserDto, companyId: string | null, updatedBy: string, ipAddress: string) {
    const where: any = { id, deletedAt: null };
    if (companyId) where.companyId = companyId;
    const user = await this.prisma.user.findFirst({
      where,
      select: { id: true, status: true, email: true, name: true, companyId: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const { password, ...rest } = dto;
    const data: any = { ...rest };
    if (password) {
      data.passwordHash = await bcrypt.hash(password, 12);
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data,
    });

    if (dto.status === 'active' && user['status'] !== 'active' && updated.email) {
      await this.emailService.sendAccountApproved(updated.email, updated.name);
    }

    await this.audit.log({
      entityType: 'User',
      entityId: id,
      action: 'UPDATE',
      beforeJson: user as any,
      afterJson: dto as any,
      userId: updatedBy,
      companyId: companyId ?? user.companyId,
      ipAddress,
    });

    return { id: updated.id, name: updated.name, status: updated.status };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findFirst({ where: { id: userId, deletedAt: null } });
    if (!user) throw new NotFoundException('User not found');

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Current password is incorrect');

    if (newPassword.length < 8) throw new BadRequestException('New password must be at least 8 characters');

    const hash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash: hash } });

    return { message: 'Password changed successfully' };
  }

  async remove(id: string, companyId: string, deletedBy: string) {
    await this.findOne(id, companyId);

    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.audit.log({
      entityType: 'User',
      entityId: id,
      action: 'DELETE',
      userId: deletedBy,
      companyId,
    });

    return { message: 'User deleted' };
  }

  async getStaff(companyId: string) {
    const staff = await this.prisma.user.findMany({
      where: {
        companyId,
        status: 'active',
        role: { not: 'vendor' },
        deletedAt: null,
      },
      select: { id: true, name: true, role: true },
      orderBy: { name: 'asc' },
    });
    return { data: staff };
  }

  async createVendorUser(dto: CreateVendorUserDto, companyId: string, callerRole: string, callerVendorId: string | null, createdBy: string) {
    const isStaff = callerRole === 'admin' || callerRole === 'operations_staff';
    const resolvedVendorId = isStaff ? dto.vendorId : callerVendorId;
    if (!resolvedVendorId) throw new BadRequestException('Vendor is required');

    // Confirm vendor belongs to this company
    const vendor = await this.prisma.vendor.findFirst({ where: { id: resolvedVendorId, companyId, deletedAt: null } });
    if (!vendor) throw new NotFoundException('Vendor not found');

    const existing = await this.prisma.user.findFirst({ where: { mobile: dto.mobile, companyId } });
    if (existing) throw new ConflictException('Mobile already in use');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        mobile: dto.mobile,
        passwordHash,
        role: 'vendor',
        vendorLevel: dto.vendorLevel,
        vendorId: resolvedVendorId,
        parentVendorUserId: dto.parentVendorUserId ?? null,
        companyId,
        status: 'active',
        ipWhitelist: [],
      },
    });

    await this.audit.log({ entityType: 'User', entityId: user.id, action: 'CREATE', afterJson: { id: user.id, role: 'vendor', vendorLevel: dto.vendorLevel }, userId: createdBy, companyId });
    return { data: { id: user.id, name: user.name, role: user.role, vendorLevel: user.vendorLevel } };
  }

  async getVendorTeam(companyId: string, callerVendorId: string | null) {
    const where: any = { companyId, deletedAt: null, role: 'vendor', vendorLevel: { not: null } };
    if (callerVendorId) where.vendorId = callerVendorId;
    const users = await this.prisma.user.findMany({
      where,
      select: {
        id: true, name: true, email: true, mobile: true,
        vendorLevel: true, status: true, createdAt: true,
        parentVendorUserId: true,
      },
      orderBy: [{ vendorLevel: 'asc' }, { name: 'asc' }],
    });
    return { data: users };
  }

  async approveUser(id: string, companyId: string | null, approvedBy: string) {
    const where: any = { id, deletedAt: null };
    if (companyId) where.companyId = companyId;
    const user = await this.prisma.user.findFirst({ where });
    if (!user) throw new NotFoundException('User not found');

    const updated = await this.prisma.user.update({
      where: { id },
      data: { status: 'active' },
    });

    if (updated.email) {
      await this.emailService.sendAccountApproved(updated.email, updated.name);
    }

    await this.audit.log({
      entityType: 'User',
      entityId: id,
      action: 'UPDATE',
      beforeJson: user as any,
      afterJson: { status: 'active' },
      userId: approvedBy,
      companyId: companyId ?? updated.companyId,
    });

    return { id: updated.id, name: updated.name, status: updated.status };
  }
}
