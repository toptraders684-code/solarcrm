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

  getEnums() {
    return {
      userRoles: ['admin', 'operations_staff', 'field_technician', 'finance_manager', 'vendor'],
      userStatuses: ['pending_approval', 'active', 'inactive'],
      discoms: ['tpcodl', 'tpnodl', 'tpsodl', 'tpwodl'],
      projectTypes: ['residential', 'commercial'],
      leadSources: ['walk_in', 'referral', 'online', 'camp', 'channel_partner', 'other'],
      financePreferences: ['self', 'govt_bank', 'private_bank'],
      leadStatuses: ['new', 'in_progress', 'converted', 'closed'],
      leadClosureReasons: ['not_interested', 'no_roof_space', 'financial_issue', 'competitor', 'unreachable', 'other'],
      documentCategories: ['kyc', 'technical', 'discom'],
      transactionTypes: ['customer_receipt', 'vendor_payment', 'subsidy'],
      paymentMethods: ['cash', 'cheque', 'bank_transfer', 'upi', 'other'],
      transactionStatuses: ['pending_approval', 'approved', 'rejected'],
      vendorTypes: ['material_supplier', 'labour_installer', 'transport_logistics'],
      outcomeTypes: ['contacted', 'not_reachable', 'meeting_scheduled', 'site_visit_done', 'document_collected', 'other'],
    };
  }
}
