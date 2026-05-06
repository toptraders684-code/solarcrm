import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface LogEntry {
  userId?: string;
  companyId?: string;
  action: string;
  module?: string;
  entityId?: string;
  ipAddress?: string;
  userAgent?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  description?: string;
}

@Injectable()
export class ActivityLogService {
  constructor(private prisma: PrismaService) {}

  // Fire-and-forget — never blocks the request
  log(entry: LogEntry): void {
    this.prisma.userActivityLog.create({ data: entry }).catch(() => { /* swallow */ });
  }

  async findAll(query: {
    companyId?: string;
    userId?: string;
    action?: string;
    module?: string;
    from?: string;
    to?: string;
    limit?: number;
    offset?: number;
  }) {
    const { companyId, userId, action, module, from, to, limit = 50, offset = 0 } = query;

    const where: any = {};
    if (companyId) where.companyId = companyId;
    if (userId) where.userId = userId;
    if (action) where.action = { contains: action, mode: 'insensitive' };
    if (module) where.module = module;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    const [data, total] = await Promise.all([
      this.prisma.userActivityLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: Number(offset),
        take: Number(limit),
        include: {
          user: { select: { id: true, name: true, mobile: true, role: true } },
        },
      }),
      this.prisma.userActivityLog.count({ where }),
    ]);

    return { data, total };
  }
}
