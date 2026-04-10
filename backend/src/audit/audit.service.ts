import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditAction } from '@prisma/client';

interface AuditLogData {
  entityType: string;
  entityId: string;
  action: AuditAction;
  beforeJson?: object;
  afterJson?: object;
  userId: string;
  companyId: string;
  ipAddress?: string;
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(data: AuditLogData): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        entityType: data.entityType,
        entityId: data.entityId,
        action: data.action,
        beforeJson: data.beforeJson as any,
        afterJson: data.afterJson as any,
        userId: data.userId,
        companyId: data.companyId,
        ipAddress: data.ipAddress,
      },
    });
  }
}
