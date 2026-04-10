import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { EmailService } from '../notifications/email.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';

@Injectable()
export class FinanceService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private emailService: EmailService,
  ) {}

  async findAll(companyId: string, query: any) {
    const { limit = 25, after, status, applicantId } = query;

    // Transaction doesn't have companyId — filter via applicant
    const where: any = {
      applicant: { companyId },
    };
    if (status) where.status = status;
    if (applicantId) where.applicantId = applicantId;
    if (after) where.id = { gt: after };

    const transactions = await this.prisma.transaction.findMany({
      where,
      take: parseInt(limit),
      orderBy: { transactionDate: 'desc' },
      include: {
        applicant: { select: { id: true, applicantCode: true, customerName: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    return { data: transactions, count: transactions.length };
  }

  async create(dto: CreateTransactionDto, companyId: string, userId: string) {
    const applicant = await this.prisma.applicant.findFirst({
      where: { id: dto.applicantId, companyId },
    });
    if (!applicant) throw new NotFoundException('Applicant not found');

    const transaction = await this.prisma.transaction.create({
      data: {
        applicantId: dto.applicantId,
        type: dto.type,
        amount: dto.amount,
        paymentMethod: dto.paymentMethod,
        referenceNumber: dto.referenceNumber,
        transactionDate: dto.transactionDate ? new Date(dto.transactionDate) : new Date(),
        description: dto.description,
        vendorId: dto.vendorId,
        createdById: userId,
        status: 'pending_approval',
      },
    });

    // Notify finance managers
    const financeManagers = await this.prisma.user.findMany({
      where: { companyId, role: 'finance_manager', status: 'active' },
    });
    for (const fm of financeManagers) {
      if (fm.email) {
        await this.emailService.sendTransactionPendingApproval(fm.email, Number(dto.amount), dto.description || '');
      }
    }

    await this.audit.log({
      entityType: 'Transaction',
      entityId: transaction.id,
      action: 'CREATE',
      afterJson: { id: transaction.id, type: transaction.type, amount: Number(transaction.amount) },
      userId,
      companyId,
    });

    return transaction;
  }

  async approve(id: string, companyId: string, userId: string, role: string) {
    if (role !== 'finance_manager' && role !== 'admin') {
      throw new ForbiddenException('Only finance manager or admin can approve transactions');
    }

    const transaction = await this.prisma.transaction.findFirst({
      where: { id, applicant: { companyId } },
    });
    if (!transaction) throw new NotFoundException('Transaction not found');

    const updated = await this.prisma.transaction.update({
      where: { id },
      data: { status: 'approved', approvedById: userId, approvedAt: new Date() },
    });

    await this.audit.log({
      entityType: 'Transaction',
      entityId: id,
      action: 'UPDATE',
      beforeJson: { status: transaction.status },
      afterJson: { status: 'approved' },
      userId,
      companyId,
    });

    return updated;
  }

  async reject(id: string, companyId: string, userId: string, role: string, reason?: string) {
    if (role !== 'finance_manager' && role !== 'admin') {
      throw new ForbiddenException('Only finance manager or admin can reject transactions');
    }

    const transaction = await this.prisma.transaction.findFirst({
      where: { id, applicant: { companyId } },
    });
    if (!transaction) throw new NotFoundException('Transaction not found');

    const updated = await this.prisma.transaction.update({
      where: { id },
      data: {
        status: 'rejected',
        approvedById: userId,
        approvedAt: new Date(),
        rejectionReason: reason,
      },
    });

    await this.audit.log({
      entityType: 'Transaction',
      entityId: id,
      action: 'UPDATE',
      beforeJson: { status: transaction.status },
      afterJson: { status: 'rejected', reason },
      userId,
      companyId,
    });

    return updated;
  }

  async getSummary(companyId: string) {
    const [received, subsidy, vendorPayments, pendingCount] = await Promise.all([
      this.prisma.transaction.aggregate({
        where: { status: 'approved', type: 'customer_receipt', applicant: { companyId } },
        _sum: { amount: true },
      }),
      this.prisma.transaction.aggregate({
        where: { status: 'approved', type: 'subsidy', applicant: { companyId } },
        _sum: { amount: true },
      }),
      this.prisma.transaction.aggregate({
        where: { status: 'approved', type: 'vendor_payment', applicant: { companyId } },
        _sum: { amount: true },
      }),
      this.prisma.transaction.count({
        where: { status: 'pending_approval', applicant: { companyId } },
      }),
    ]);

    return {
      data: {
        totalReceived: Number(received._sum.amount ?? 0),
        totalSubsidy: Number(subsidy._sum.amount ?? 0),
        totalVendorPayments: Number(vendorPayments._sum.amount ?? 0),
        pendingCount,
      },
    };
  }
}
