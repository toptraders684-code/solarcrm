import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { SaveConfigDto } from './dto/save-config.dto';
import { GeneratePayablesDto } from './dto/generate-payables.dto';
import { AddIncentiveDto } from './dto/add-incentive.dto';

@Injectable()
export class VendorCommissionService {
  constructor(private prisma: PrismaService) {}

  // ── ASSIGNMENTS ──────────────────────────────────────────────────────────────

  async getAssignments(companyId: string) {
    const data = await this.prisma.vendorCommissionAssignment.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      include: {
        vendor: { select: { id: true, businessName: true, contactPerson: true } },
        employee: { select: { id: true, name: true, vendorLevel: true } },
        commissionStructure: { select: { id: true, name: true, structureType: true, configSchema: true } },
        configs: true,
      },
    });
    return { data };
  }

  async getAssignment(id: string, companyId: string) {
    const data = await this.prisma.vendorCommissionAssignment.findFirst({
      where: { id, companyId },
      include: {
        vendor: { select: { id: true, businessName: true, contactPerson: true } },
        commissionStructure: true,
        configs: true,
      },
    });
    if (!data) throw new NotFoundException('Assignment not found');
    return { data };
  }

  async createAssignment(dto: CreateAssignmentDto, companyId: string) {
    const employee = await this.prisma.user.findFirst({
      where: { id: dto.employeeId, companyId, deletedAt: null },
      select: { id: true, name: true, vendorLevel: true, vendorId: true },
    });
    if (!employee) throw new NotFoundException('Team member not found');
    if (!employee.vendorId) throw new BadRequestException('This user is not assigned to a vendor team');

    const existing = await this.prisma.vendorCommissionAssignment.findFirst({
      where: { companyId, employeeId: dto.employeeId, isActive: true },
    });
    if (existing) throw new BadRequestException('This team member already has an active commission assignment');

    const data = await this.prisma.vendorCommissionAssignment.create({
      data: {
        companyId,
        vendorId: employee.vendorId,
        employeeId: dto.employeeId,
        commissionStructureId: dto.commissionStructureId,
        effectiveFrom: new Date(dto.effectiveFrom),
        isActive: true,
      },
      include: {
        vendor: { select: { id: true, businessName: true } },
        employee: { select: { id: true, name: true, vendorLevel: true } },
        commissionStructure: { select: { id: true, name: true, structureType: true } },
      },
    });
    return { data };
  }

  async toggleAssignment(id: string, companyId: string) {
    const item = await this.prisma.vendorCommissionAssignment.findFirst({ where: { id, companyId } });
    if (!item) throw new NotFoundException('Assignment not found');
    const data = await this.prisma.vendorCommissionAssignment.update({
      where: { id },
      data: { isActive: !item.isActive },
    });
    return { data };
  }

  // ── CONFIG ───────────────────────────────────────────────────────────────────

  async saveConfig(assignmentId: string, dto: SaveConfigDto, companyId: string) {
    const assignment = await this.prisma.vendorCommissionAssignment.findFirst({
      where: { id: assignmentId, companyId },
    });
    if (!assignment) throw new NotFoundException('Assignment not found');

    await this.prisma.$transaction(
      dto.configs.map((c) =>
        this.prisma.vendorCommissionConfig.upsert({
          where: { assignmentId_configKey: { assignmentId, configKey: c.configKey } },
          update: { configValue: c.configValue },
          create: { assignmentId, configKey: c.configKey, configValue: c.configValue },
        }),
      ),
    );
    return { success: true };
  }

  // ── PAYABLES ─────────────────────────────────────────────────────────────────

  async generatePayables(dto: GeneratePayablesDto, companyId: string) {
    const { employeeId, month, year } = dto;

    const employee = await this.prisma.user.findFirst({
      where: { id: employeeId, companyId, vendorLevel: { not: null }, deletedAt: null },
      select: { id: true, name: true, vendorLevel: true, vendorId: true },
    });
    if (!employee) throw new NotFoundException('Team member not found');
    if (!employee.vendorId) throw new BadRequestException('This user is not assigned to a vendor team');

    const assignment = await this.prisma.vendorCommissionAssignment.findFirst({
      where: { companyId, employeeId, isActive: true },
      include: { commissionStructure: true, configs: true },
    });
    if (!assignment) throw new NotFoundException('No active commission assignment found for this team member');

    const configMap: Record<string, string> = {};
    for (const c of assignment.configs) configMap[c.configKey] = c.configValue;

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const applicants = await this.prisma.applicant.findMany({
      where: {
        companyId,
        createdById: employeeId,
        createdAt: { gte: startDate, lt: endDate },
        sanctionedLoadKw: { not: null },
      },
      select: { id: true, sanctionedLoadKw: true },
    });

    const projectCount = applicants.length;
    const totalKw = applicants.reduce((sum, a) => sum + Number(a.sanctionedLoadKw ?? 0), 0);
    const commissionAmount = this.calculateCommission(
      assignment.commissionStructure.structureType as string,
      configMap,
      totalKw,
      projectCount,
    );

    const existing = await this.prisma.employeePayable.findFirst({
      where: { employeeId, assignmentId: assignment.id, month, year },
    });

    let payable: any;
    if (existing) {
      const newTotal = Number(existing.salaryAmount) + commissionAmount + Number(existing.incentiveAmount);
      payable = await this.prisma.employeePayable.update({
        where: { id: existing.id },
        data: { projectCount, totalKw, commissionAmount, totalPayable: newTotal },
      });
    } else {
      payable = await this.prisma.employeePayable.create({
        data: {
          companyId,
          vendorId: employee.vendorId,
          employeeId,
          assignmentId: assignment.id,
          month, year, projectCount, totalKw, commissionAmount, totalPayable: commissionAmount,
        },
      });
    }

    return { data: payable, count: 1 };
  }

  async getPayables(companyId: string, query: any) {
    const { vendorId, month, year, status } = query;
    const where: any = { companyId };
    if (vendorId) where.vendorId = vendorId;
    if (month) where.month = parseInt(month);
    if (year) where.year = parseInt(year);
    if (status) where.status = status;

    const data = await this.prisma.employeePayable.findMany({
      where,
      orderBy: [{ year: 'desc' }, { month: 'desc' }, { generatedAt: 'desc' }],
      include: {
        employee: { select: { id: true, name: true, vendorLevel: true } },
        vendor: { select: { id: true, businessName: true } },
        assignment: { include: { commissionStructure: { select: { name: true, structureType: true } } } },
        incentives: true,
      },
    });
    return { data };
  }

  async getPayable(id: string, companyId: string) {
    const data = await this.prisma.employeePayable.findFirst({
      where: { id, companyId },
      include: {
        employee: { select: { id: true, name: true, vendorLevel: true, mobile: true } },
        vendor: { select: { id: true, businessName: true } },
        assignment: { include: { commissionStructure: true, configs: true } },
        incentives: true,
        approvedBy: { select: { id: true, name: true } },
      },
    });
    if (!data) throw new NotFoundException('Payable not found');
    return { data };
  }

  async approvePayable(id: string, companyId: string, approverId: string) {
    const payable = await this.prisma.employeePayable.findFirst({ where: { id, companyId } });
    if (!payable) throw new NotFoundException('Payable not found');
    if (payable.status !== 'draft') throw new BadRequestException('Only draft payables can be approved');
    const data = await this.prisma.employeePayable.update({
      where: { id },
      data: { status: 'approved', approvedAt: new Date(), approvedById: approverId },
    });
    return { data };
  }

  async updateSalary(id: string, salaryAmount: number, companyId: string) {
    const payable = await this.prisma.employeePayable.findFirst({ where: { id, companyId } });
    if (!payable) throw new NotFoundException('Payable not found');
    if (payable.status === 'paid') throw new BadRequestException('Cannot update a paid payable');
    const newTotal = salaryAmount + Number(payable.commissionAmount) + Number(payable.incentiveAmount);
    const data = await this.prisma.employeePayable.update({
      where: { id },
      data: { salaryAmount, totalPayable: newTotal },
    });
    return { data };
  }

  async addIncentive(payableId: string, dto: AddIncentiveDto, companyId: string) {
    const payable = await this.prisma.employeePayable.findFirst({ where: { id: payableId, companyId } });
    if (!payable) throw new NotFoundException('Payable not found');
    if (payable.status === 'paid') throw new BadRequestException('Cannot modify a paid payable');

    const incentive = await this.prisma.payableIncentive.create({
      data: { payableId, type: dto.type, amount: dto.amount, note: dto.note },
    });

    const allIncentives = await this.prisma.payableIncentive.findMany({ where: { payableId } });
    const incentiveTotal = allIncentives.reduce((s, i) => s + Number(i.amount), 0);
    const newTotal = Number(payable.salaryAmount) + Number(payable.commissionAmount) + incentiveTotal;
    await this.prisma.employeePayable.update({
      where: { id: payableId },
      data: { incentiveAmount: incentiveTotal, totalPayable: newTotal },
    });

    return { data: incentive };
  }

  async removeIncentive(payableId: string, incentiveId: string, companyId: string) {
    const payable = await this.prisma.employeePayable.findFirst({ where: { id: payableId, companyId } });
    if (!payable) throw new NotFoundException('Payable not found');
    if (payable.status === 'paid') throw new BadRequestException('Cannot modify a paid payable');

    await this.prisma.payableIncentive.delete({ where: { id: incentiveId } });

    const allIncentives = await this.prisma.payableIncentive.findMany({ where: { payableId } });
    const incentiveTotal = allIncentives.reduce((s, i) => s + Number(i.amount), 0);
    const newTotal = Number(payable.salaryAmount) + Number(payable.commissionAmount) + incentiveTotal;
    await this.prisma.employeePayable.update({
      where: { id: payableId },
      data: { incentiveAmount: incentiveTotal, totalPayable: newTotal },
    });

    return { success: true };
  }

  // ── CALCULATION ENGINE ───────────────────────────────────────────────────────

  private calculateCommission(
    structureType: string,
    config: Record<string, string>,
    totalKw: number,
    projectCount: number,
  ): number {
    switch (structureType) {
      case 'per_kw': {
        const rate = parseFloat(config['rate_per_kw'] ?? '0');
        const minKw = parseFloat(config['min_project_kw'] ?? '0');
        if (minKw > 0 && totalKw < minKw) return 0;
        let commission = totalKw * rate;
        const bonusThresholdKw = parseFloat(config['bonus_threshold_kw'] ?? '0');
        const bonusRate = parseFloat(config['bonus_rate_per_kw'] ?? '0');
        if (bonusThresholdKw > 0 && totalKw >= bonusThresholdKw && bonusRate > 0) {
          commission += totalKw * bonusRate;
        }
        return Math.round(commission * 100) / 100;
      }
      case 'percentage': {
        const pct = parseFloat(config['percentage_rate'] ?? '0');
        const valuePerKw = parseFloat(config['project_value_per_kw'] ?? '0');
        const maxCap = parseFloat(config['max_cap'] ?? '0');
        let commission = (pct / 100) * totalKw * valuePerKw;
        if (maxCap > 0) commission = Math.min(commission, maxCap);
        return Math.round(commission * 100) / 100;
      }
      case 'fixed_per_project': {
        const fixed = parseFloat(config['fixed_amount'] ?? '0');
        return Math.round(projectCount * fixed * 100) / 100;
      }
      case 'slab_based': {
        const slabsRaw = config['slabs'];
        if (!slabsRaw) return 0;
        try {
          const slabs = JSON.parse(slabsRaw) as Array<{ from: number; to: number; rate: number }>;
          let commission = 0;
          for (const slab of slabs) {
            if (totalKw > slab.from) {
              const applicable = Math.min(totalKw, slab.to) - slab.from;
              commission += applicable * slab.rate;
            }
          }
          return Math.round(commission * 100) / 100;
        } catch {
          return 0;
        }
      }
      default:
        return 0;
    }
  }
}
