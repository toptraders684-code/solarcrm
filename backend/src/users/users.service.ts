import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { EmailService } from '../notifications/email.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private emailService: EmailService,
  ) {}

  async findAll(companyId: string, query: any) {
    const { limit = 25, after, role, status, q } = query;

    const where: any = { companyId, deletedAt: null };
    if (role) where.role = role;
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

  async update(id: string, dto: UpdateUserDto, companyId: string, updatedBy: string, ipAddress: string) {
    const user = await this.findOne(id, companyId);

    const updated = await this.prisma.user.update({
      where: { id },
      data: dto,
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
      companyId,
      ipAddress,
    });

    return { id: updated.id, name: updated.name, status: updated.status };
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

  async approveUser(id: string, companyId: string, approvedBy: string) {
    const user = await this.findOne(id, companyId);

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
      companyId,
    });

    return { id: updated.id, name: updated.name, status: updated.status };
  }
}
