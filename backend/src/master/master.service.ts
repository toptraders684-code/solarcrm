import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MasterService {
  constructor(private prisma: PrismaService) {}

  async getStates() {
    const states = await this.prisma.masterState.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, code: true },
    });
    return { data: states };
  }

  async getDistricts(stateId?: string) {
    const where: any = {};
    if (stateId) where.stateId = stateId;

    const districts = await this.prisma.masterDistrict.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        state: { select: { id: true, name: true, code: true } },
      },
    });
    return { data: districts };
  }

  async getEnums() {
    const [discoms, leadSources, vendorTypes, paymentMethods, projectTypes, stages] = await Promise.all([
      this.prisma.masterDiscom.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' }, select: { code: true, name: true } }),
      this.prisma.masterLeadSource.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' }, select: { code: true, name: true } }),
      this.prisma.masterVendorType.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' }, select: { code: true, name: true } }),
      this.prisma.masterPaymentMethod.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' }, select: { code: true, name: true } }),
      this.prisma.masterProjectType.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' }, select: { code: true, name: true } }),
      this.prisma.masterStage.findMany({ where: { isActive: true }, orderBy: { stageNumber: 'asc' }, select: { stageNumber: true, name: true } }),
    ]);

    return {
      userRoles: ['admin', 'operations_staff', 'field_technician', 'finance_manager', 'vendor'],
      userStatuses: ['pending_approval', 'active', 'inactive'],
      discoms: discoms.map((d) => d.code),
      discomItems: discoms,
      projectTypes: projectTypes.map((t) => t.code),
      projectTypeItems: projectTypes,
      leadSources: leadSources.map((s) => s.code),
      leadSourceItems: leadSources,
      financePreferences: ['self', 'govt_bank', 'private_bank'],
      leadStatuses: ['new', 'in_progress', 'converted', 'closed'],
      leadClosureReasons: ['not_interested', 'no_roof_space', 'financial_issue', 'competitor', 'unreachable', 'other'],
      documentCategories: ['kyc', 'technical', 'discom'],
      transactionTypes: ['customer_receipt', 'vendor_payment', 'subsidy', 'expense'],
      paymentMethods: paymentMethods.map((m) => m.code),
      paymentMethodItems: paymentMethods,
      transactionStatuses: ['pending_approval', 'approved', 'rejected'],
      vendorTypes: vendorTypes.map((v) => v.code),
      vendorTypeItems: vendorTypes,
      outcomeTypes: ['contacted', 'not_reachable', 'meeting_scheduled', 'site_visit_done', 'document_collected', 'other'],
      stages,
    };
  }
}
