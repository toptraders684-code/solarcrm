import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { EmailService } from '../notifications/email.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { CreateFollowupDto } from './dto/create-followup.dto';

@Injectable()
export class LeadsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private emailService: EmailService,
  ) {}

  async findAll(companyId: string, query: any) {
    const { limit = 25, after, status, discom, assignedStaffId, q, sort = 'createdAt', order = 'desc' } = query;

    const where: any = { companyId, deletedAt: null };
    if (status) where.status = status;
    if (discom) where.discom = discom;
    if (assignedStaffId) where.assignedStaffId = assignedStaffId;
    if (after) where.id = { gt: after };

    if (q) {
      where.OR = [
        { customerName: { contains: q, mode: 'insensitive' } },
        { mobile: { contains: q } },
        { email: { contains: q, mode: 'insensitive' } },
      ];
    }

    const leads = await this.prisma.lead.findMany({
      where,
      take: parseInt(limit),
      orderBy: { [sort]: order },
      include: {
        assignedStaff: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    return { data: leads, count: leads.length };
  }

  async findOne(id: string, companyId: string) {
    const lead = await this.prisma.lead.findFirst({
      where: { id, companyId, deletedAt: null },
      include: {
        assignedStaff: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        followups: {
          orderBy: { createdAt: 'desc' },
          include: { createdBy: { select: { id: true, name: true } } },
        },
      },
    });
    if (!lead) throw new NotFoundException('Lead not found');
    return lead;
  }

  async create(dto: CreateLeadDto, companyId: string, userId: string) {
    // Generate lead code
    const count = await this.prisma.lead.count({ where: { companyId } });
    const leadCode = `LD-${String(count + 1).padStart(5, '0')}`;

    const lead = await this.prisma.lead.create({
      data: {
        leadCode,
        customerName: dto.customerName,
        mobile: dto.mobile,
        email: dto.email,
        alternateMobile: dto.alternateMobile,
        discom: dto.discom,
        projectType: dto.projectType,
        leadSource: dto.leadSource,
        estimatedCapacityKw: dto.estimatedCapacityKw,
        financePreference: dto.financePreference,
        addressVillage: dto.addressVillage,
        addressHouse: dto.addressHouse,
        addressStreet: dto.addressStreet,
        addressPincode: dto.addressPincode,
        addressDistrictId: dto.addressDistrictId,
        addressStateId: dto.addressStateId,
        assignedStaffId: dto.assignedStaffId,
        followUpDate: dto.followUpDate ? new Date(dto.followUpDate) : undefined,
        companyId,
        createdById: userId,
        status: 'new',
      },
    });

    // Notify assigned staff
    const assignedUser = await this.prisma.user.findUnique({ where: { id: dto.assignedStaffId } });
    if (assignedUser?.email) {
      const creator = await this.prisma.user.findUnique({ where: { id: userId } });
      await this.emailService.sendLeadAssigned(assignedUser.email, lead.customerName, creator?.name || '');
    }

    await this.audit.log({
      entityType: 'Lead',
      entityId: lead.id,
      action: 'CREATE',
      afterJson: { id: lead.id, leadCode: lead.leadCode, customerName: lead.customerName },
      userId,
      companyId,
    });

    return lead;
  }

  async update(id: string, dto: UpdateLeadDto, companyId: string, userId: string, ipAddress: string) {
    const lead = await this.findOne(id, companyId);

    const updateData: any = { ...dto };
    if (dto.followUpDate) {
      updateData.followUpDate = new Date(dto.followUpDate);
      delete updateData.followUpDate; // remove string version
      updateData.followUpDate = new Date(dto.followUpDate);
    }

    const updated = await this.prisma.lead.update({
      where: { id },
      data: updateData,
    });

    await this.audit.log({
      entityType: 'Lead',
      entityId: id,
      action: 'UPDATE',
      beforeJson: { status: lead['status'] },
      afterJson: dto as any,
      userId,
      companyId,
      ipAddress,
    });

    return updated;
  }

  async convert(id: string, companyId: string, userId: string) {
    const lead = await this.findOne(id, companyId);

    if (lead.status === 'converted') {
      throw new BadRequestException('Lead already converted');
    }

    const count = await this.prisma.applicant.count({ where: { companyId } });
    const applicantCode = `SRM-${String(count + 1).padStart(5, '0')}`;

    const applicant = await this.prisma.applicant.create({
      data: {
        applicantCode,
        customerName: lead.customerName,
        discom: lead.discom,
        projectType: lead.projectType,
        addressVillage: lead.addressVillage,
        addressHouse: lead.addressHouse,
        addressStreet: lead.addressStreet,
        addressPincode: lead.addressPincode,
        addressDistrictId: lead.addressDistrictId,
        addressStateId: lead.addressStateId,
        companyId,
        leadId: lead.id,
        assignedStaffId: lead.assignedStaffId,
        createdById: userId,
      },
    });

    await this.prisma.lead.update({
      where: { id },
      data: { status: 'converted', convertedApplicantId: applicant.id },
    });

    await this.audit.log({
      entityType: 'Lead',
      entityId: id,
      action: 'UPDATE',
      beforeJson: { status: lead.status },
      afterJson: { status: 'converted', applicantId: applicant.id },
      userId,
      companyId,
    });

    return applicant;
  }

  async closeLead(id: string, reason: string, companyId: string, userId: string) {
    const lead = await this.findOne(id, companyId);
    if (lead.status === 'converted') throw new BadRequestException('Cannot close a converted lead');
    if (lead.status === 'closed') throw new BadRequestException('Lead is already closed');

    const updated = await this.prisma.lead.update({
      where: { id },
      data: { status: 'closed', closureReason: reason as any },
    });

    await this.audit.log({
      entityType: 'Lead',
      entityId: id,
      action: 'UPDATE',
      beforeJson: { status: lead.status },
      afterJson: { status: 'closed', closureReason: reason },
      userId,
      companyId,
    });

    return { data: updated };
  }

  async addFollowup(leadId: string, dto: CreateFollowupDto, companyId: string, userId: string) {
    await this.findOne(leadId, companyId);

    const followup = await this.prisma.leadFollowup.create({
      data: {
        leadId,
        notes: dto.notes,
        outcomeType: dto.outcomeType,
        followUpDate: dto.followUpDate ? new Date(dto.followUpDate) : undefined,
        createdById: userId,
      },
    });

    if (dto.followUpDate) {
      await this.prisma.lead.update({
        where: { id: leadId },
        data: { followUpDate: new Date(dto.followUpDate) },
      });
    }

    return followup;
  }
}
