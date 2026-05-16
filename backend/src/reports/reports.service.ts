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

  async generateReport(query: any, companyId: string) {
    const { reportType, dateFrom, dateTo, discom } = query;
    const dateFilter: any = {};
    if (dateFrom) dateFilter.gte = new Date(dateFrom);
    if (dateTo) { const d = new Date(dateTo); d.setHours(23, 59, 59, 999); dateFilter.lte = d; }

    switch (reportType) {
      case 'lead_summary': return this.reportLeadSummary(companyId, dateFilter, discom);
      case 'conversion_funnel': return this.reportConversionFunnel(companyId, dateFilter, discom);
      case 'stage_aging': return this.reportStageAging(companyId, discom);
      case 'project_profitability': return this.reportProjectProfitability(companyId, dateFilter, discom);
      case 'subsidy_tracker': return this.reportSubsidyTracker(companyId, dateFilter);
      case 'vendor_payment': return this.reportVendorPayment(companyId, dateFilter);
      case 'staff_performance': return this.reportStaffPerformance(companyId, dateFilter);
      case 'discom_wise': return this.reportDiscomWise(companyId, dateFilter);
      default: return { data: [] };
    }
  }

  async downloadReport(query: any, companyId: string): Promise<{ buffer: Buffer; filename: string }> {
    const result = await this.generateReport(query, companyId);
    const rows: any[] = result.data ?? [];
    if (rows.length === 0) return { buffer: Buffer.from('No data'), filename: `${query.reportType}.csv` };
    const headers = Object.keys(rows[0]).join(',');
    const lines = rows.map((r) => Object.values(r).map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','));
    const csv = [headers, ...lines].join('\n');
    return { buffer: Buffer.from(csv), filename: `${query.reportType}_${new Date().toISOString().slice(0, 10)}.csv` };
  }

  private async reportLeadSummary(companyId: string, dateFilter: any, discom?: string) {
    const where: any = { companyId, deletedAt: null };
    if (Object.keys(dateFilter).length) where.createdAt = dateFilter;
    if (discom) where.discom = discom;
    const rows = await this.prisma.lead.groupBy({
      by: ['status', 'leadSource'],
      where,
      _count: { _all: true },
      orderBy: { status: 'asc' },
    });
    return { data: rows.map((r) => ({ status: r.status, source: r.leadSource, count: r._count._all })) };
  }

  private async reportConversionFunnel(companyId: string, dateFilter: any, discom?: string) {
    const where: any = { companyId, deletedAt: null };
    if (Object.keys(dateFilter).length) where.createdAt = dateFilter;
    if (discom) where.discom = discom;
    const rows = await this.prisma.lead.groupBy({
      by: ['discom', 'status'],
      where,
      _count: { _all: true },
      orderBy: { discom: 'asc' },
    });
    return { data: rows.map((r) => ({ discom: r.discom, status: r.status, count: r._count._all })) };
  }

  private async reportStageAging(companyId: string, discom?: string) {
    const where: any = { companyId, deletedAt: null };
    if (discom) where.discom = discom;
    const rows = await this.prisma.applicant.groupBy({
      by: ['stage'],
      where,
      _count: { _all: true },
      _min: { stageUpdatedAt: true },
      orderBy: { stage: 'asc' },
    });
    const now = Date.now();
    return {
      data: rows.map((r) => ({
        stage: r.stage,
        count: r._count._all,
        oldestDays: r._min.stageUpdatedAt ? Math.floor((now - new Date(r._min.stageUpdatedAt).getTime()) / 86400000) : null,
      })),
    };
  }

  private async reportProjectProfitability(companyId: string, dateFilter: any, discom?: string) {
    const where: any = { companyId, deletedAt: null };
    if (Object.keys(dateFilter).length) where.createdAt = dateFilter;
    if (discom) where.discom = discom;
    const applicants = await this.prisma.applicant.findMany({
      where,
      select: {
        applicantCode: true, customerName: true, discom: true, contractAmount: true,
        transactions: { where: { status: 'approved', type: 'customer_receipt' }, select: { amount: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
    return {
      data: applicants.map((a) => ({
        code: a.applicantCode, customer: a.customerName, discom: a.discom,
        contract: Number(a.contractAmount ?? 0),
        received: a.transactions.reduce((s, t) => s + Number(t.amount), 0),
        balance: Number(a.contractAmount ?? 0) - a.transactions.reduce((s, t) => s + Number(t.amount), 0),
      })),
    };
  }

  private async reportSubsidyTracker(companyId: string, dateFilter: any) {
    const where: any = { type: 'subsidy', applicant: { companyId } };
    if (Object.keys(dateFilter).length) where.transactionDate = dateFilter;
    const rows = await this.prisma.transaction.findMany({
      where,
      select: {
        amount: true, status: true, transactionDate: true, description: true,
        applicant: { select: { applicantCode: true, customerName: true } },
      },
      orderBy: { transactionDate: 'desc' },
      take: 500,
    });
    return {
      data: rows.map((r) => ({
        code: r.applicant.applicantCode, customer: r.applicant.customerName,
        amount: Number(r.amount), status: r.status,
        date: r.transactionDate?.toISOString().slice(0, 10) ?? '',
        notes: r.description ?? '',
      })),
    };
  }

  private async reportVendorPayment(companyId: string, dateFilter: any) {
    const where: any = { type: 'vendor_payment', applicant: { companyId } };
    if (Object.keys(dateFilter).length) where.transactionDate = dateFilter;
    const rows = await this.prisma.transaction.findMany({
      where,
      select: {
        amount: true, status: true, transactionDate: true,
        vendor: { select: { businessName: true } },
        applicant: { select: { applicantCode: true } },
      },
      orderBy: { transactionDate: 'desc' },
      take: 500,
    });
    return {
      data: rows.map((r) => ({
        vendor: r.vendor?.businessName ?? '—', project: r.applicant.applicantCode,
        amount: Number(r.amount), status: r.status,
        date: r.transactionDate?.toISOString().slice(0, 10) ?? '',
      })),
    };
  }

  private async reportStaffPerformance(companyId: string, dateFilter: any) {
    const where: any = { companyId, deletedAt: null };
    if (Object.keys(dateFilter).length) where.createdAt = dateFilter;
    const [leadRows, projectRows] = await Promise.all([
      this.prisma.lead.groupBy({ by: ['assignedStaffId'], where, _count: { _all: true } }),
      this.prisma.applicant.groupBy({ by: ['assignedStaffId'], where: { companyId, deletedAt: null }, _count: { _all: true } }),
    ]);
    const staffIds = [...new Set([...leadRows.map((r) => r.assignedStaffId), ...projectRows.map((r) => r.assignedStaffId)])];
    const users = await this.prisma.user.findMany({ where: { id: { in: staffIds } }, select: { id: true, name: true } });
    const nameMap = new Map(users.map((u) => [u.id, u.name]));
    const leadMap = new Map(leadRows.map((r) => [r.assignedStaffId, r._count._all]));
    const projMap = new Map(projectRows.map((r) => [r.assignedStaffId, r._count._all]));
    return {
      data: staffIds.map((id) => ({
        staff: nameMap.get(id) ?? id,
        leads: leadMap.get(id) ?? 0,
        projects: projMap.get(id) ?? 0,
      })).sort((a, b) => b.leads - a.leads),
    };
  }

  private async reportDiscomWise(companyId: string, dateFilter: any) {
    const where: any = { companyId, deletedAt: null };
    if (Object.keys(dateFilter).length) where.createdAt = dateFilter;
    const [leadRows, projectRows] = await Promise.all([
      this.prisma.lead.groupBy({ by: ['discom'], where, _count: { _all: true } }),
      this.prisma.applicant.groupBy({ by: ['discom'], where: { companyId, deletedAt: null }, _count: { _all: true } }),
    ]);
    const discoms = [...new Set([...leadRows.map((r) => r.discom), ...projectRows.map((r) => r.discom)])];
    const leadMap = new Map(leadRows.map((r) => [r.discom, r._count._all]));
    const projMap = new Map(projectRows.map((r) => [r.discom, r._count._all]));
    return {
      data: discoms.map((d) => ({ discom: d.toUpperCase(), leads: leadMap.get(d) ?? 0, projects: projMap.get(d) ?? 0 }))
        .sort((a, b) => b.leads - a.leads),
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
