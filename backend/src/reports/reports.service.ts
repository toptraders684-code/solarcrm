import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats(companyId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalLeads,
      leadsThisMonth,
      convertedLeads,
      activeApplicants,
      pendingApprovals,
      monthlyRevenue,
      stageGroups,
    ] = await Promise.all([
      this.prisma.lead.count({ where: { companyId, deletedAt: null } }),
      this.prisma.lead.count({ where: { companyId, deletedAt: null, createdAt: { gte: startOfMonth } } }),
      this.prisma.lead.count({ where: { companyId, deletedAt: null, status: 'converted' } }),
      this.prisma.applicant.count({ where: { companyId, deletedAt: null } }),
      this.prisma.transaction.count({ where: { status: 'pending_approval', applicant: { companyId } } }),
      this.prisma.transaction.aggregate({
        where: {
          status: 'approved',
          type: 'customer_receipt',
          transactionDate: { gte: startOfMonth },
          applicant: { companyId },
        },
        _sum: { amount: true },
      }),
      this.prisma.applicant.groupBy({
        by: ['stage'],
        where: { companyId, deletedAt: null },
        _count: { _all: true },
      }),
    ]);

    const stageWiseCount: Record<string, number> = {};
    for (const row of stageGroups) {
      stageWiseCount[String(row.stage)] = row._count._all;
    }

    return {
      totalLeads,
      leadsThisMonth,
      activeApplicants,
      pendingApprovals,
      monthlyRevenue: Number(monthlyRevenue._sum.amount ?? 0),
      conversionRate: totalLeads > 0 ? convertedLeads / totalLeads : 0,
      stageWiseCount,
    };
  }

  async preview(dto: any, companyId: string) {
    const { reportType, filters } = dto;

    switch (reportType) {
      case 'lead_summary':
        return this.getLeadSummary(companyId, filters);
      case 'applicant_pipeline':
        return this.getApplicantPipeline(companyId, filters);
      case 'finance_summary':
        return this.getFinanceSummary(companyId, filters);
      default:
        return { data: [], message: `Report type '${reportType}' not yet implemented` };
    }
  }

  async exportPdf(dto: any, companyId: string): Promise<Buffer> {
    // Phase 3: PDFKit implementation
    const data = await this.preview(dto, companyId);
    return Buffer.from(`PDF Report\n\n${JSON.stringify(data, null, 2)}`);
  }

  async exportExcel(dto: any, companyId: string): Promise<Buffer> {
    // Phase 3: ExcelJS implementation
    const data = await this.preview(dto, companyId);
    return Buffer.from(`Excel Report\n\n${JSON.stringify(data, null, 2)}`);
  }

  private async getLeadSummary(companyId: string, filters: any) {
    const leads = await this.prisma.lead.groupBy({
      by: ['status'],
      where: { companyId, deletedAt: null },
      _count: true,
    });
    return { reportType: 'lead_summary', data: leads };
  }

  private async getApplicantPipeline(companyId: string, filters: any) {
    const applicants = await this.prisma.applicant.groupBy({
      by: ['stage'],
      where: { companyId, deletedAt: null },
      _count: true,
    });
    return { reportType: 'applicant_pipeline', data: applicants };
  }

  private async getFinanceSummary(companyId: string, filters: any) {
    const transactions = await this.prisma.transaction.aggregate({
      where: { status: 'approved', applicant: { companyId } },
      _sum: { amount: true },
      _count: true,
    });
    return { reportType: 'finance_summary', data: transactions };
  }
}
