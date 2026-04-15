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
import * as XLSX from 'xlsx';

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

  async bulkUpload(file: Express.Multer.File, companyId: string, userId: string) {
    // Parse Excel or CSV
    const workbook = XLSX.read(file.buffer, { type: 'buffer', cellDates: true });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    if (rows.length === 0) throw new BadRequestException('File is empty or has no data rows');
    if (rows.length > 500) throw new BadRequestException('Maximum 500 rows per upload');

    // Normalise header aliases (case-insensitive, trim)
    const normalise = (v: any) => String(v ?? '').trim().toLowerCase();

    const DISCOM_MAP: Record<string, string> = {
      tpcodl: 'tpcodl', 'tp codl': 'tpcodl',
      tpnodl: 'tpnodl', 'tp nodl': 'tpnodl',
      tpsodl: 'tpsodl', 'tp sodl': 'tpsodl',
      tpwodl: 'tpwodl', 'tp wodl': 'tpwodl',
    };
    const PROJECT_TYPE_MAP: Record<string, string> = {
      residential: 'residential', res: 'residential',
      commercial: 'commercial', com: 'commercial',
    };
    const LEAD_SOURCE_MAP: Record<string, string> = {
      'walk in': 'walk_in', walk_in: 'walk_in', walkin: 'walk_in',
      referral: 'referral', ref: 'referral',
      online: 'online',
      camp: 'camp',
      'channel partner': 'channel_partner', channel_partner: 'channel_partner',
      other: 'other',
    };
    const FINANCE_MAP: Record<string, string> = {
      self: 'self',
      'govt bank': 'govt_bank', govt_bank: 'govt_bank',
      'private bank': 'private_bank', private_bank: 'private_bank',
    };

    // Get header key helper: find value by multiple possible column names
    const col = (row: any, ...names: string[]) => {
      for (const name of names) {
        const key = Object.keys(row).find(k => k.trim().toLowerCase() === name.toLowerCase());
        if (key !== undefined) return String(row[key] ?? '').trim();
      }
      return '';
    };

    // Fetch all staff for name matching (once, before loop)
    const allStaff = await this.prisma.user.findMany({
      where: { companyId, status: 'active' },
      select: { id: true, name: true },
    });
    const staffByName = new Map(allStaff.map(s => [s.name.trim().toLowerCase(), s.id]));

    const created: string[] = [];
    const failed: { row: number; name: string; reason: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // +2 because row 1 = header

      try {
        const customerName = col(row, 'Customer Name', 'Name', 'customer_name');
        const mobile = col(row, 'Mobile', 'Phone', 'mobile');
        const addressVillage = col(row, 'Village / Area', 'Village', 'Area', 'address_village', 'addressVillage');
        const discomRaw = col(row, 'DISCOM', 'Discom', 'discom');
        const projectTypeRaw = col(row, 'Project Type', 'Type', 'project_type', 'projectType');
        const leadSourceRaw = col(row, 'Lead Source', 'Source', 'lead_source', 'leadSource');

        // Required field validation
        if (!customerName) { failed.push({ row: rowNum, name: customerName || '(blank)', reason: 'Customer Name is required' }); continue; }
        if (!mobile || !/^\d{10}$/.test(mobile)) { failed.push({ row: rowNum, name: customerName, reason: `Mobile must be 10 digits (got: "${mobile}")` }); continue; }
        if (!addressVillage) { failed.push({ row: rowNum, name: customerName, reason: 'Village / Area is required' }); continue; }

        const discom = DISCOM_MAP[normalise(discomRaw)];
        if (!discom) { failed.push({ row: rowNum, name: customerName, reason: `Unknown DISCOM: "${discomRaw}". Use TPCODL/TPNODL/TPSODL/TPWODL` }); continue; }

        const projectType = PROJECT_TYPE_MAP[normalise(projectTypeRaw)];
        if (!projectType) { failed.push({ row: rowNum, name: customerName, reason: `Unknown Project Type: "${projectTypeRaw}". Use Residential/Commercial` }); continue; }

        const leadSource = LEAD_SOURCE_MAP[normalise(leadSourceRaw)];
        if (!leadSource) { failed.push({ row: rowNum, name: customerName, reason: `Unknown Lead Source: "${leadSourceRaw}". Use Walk In/Referral/Online/Camp/Channel Partner/Other` }); continue; }

        // Optional fields
        const alternateMobile = col(row, 'Alternate Mobile', 'Alt Mobile', 'alternate_mobile');
        const email = col(row, 'Email', 'email');
        const addressPincode = col(row, 'Pincode', 'address_pincode');
        const capacityStr = col(row, 'Capacity (kW)', 'Capacity', 'capacity_kw', 'estimatedCapacityKw');
        const estimatedCapacityKw = capacityStr ? parseFloat(capacityStr) : undefined;
        const financeRaw = col(row, 'Finance Preference', 'Finance', 'finance_preference');
        const financePreference = financeRaw ? (FINANCE_MAP[normalise(financeRaw)] ?? undefined) : undefined;
        const followUpDateRaw = col(row, 'Follow Up Date', 'Follow-Up Date', 'followUpDate', 'follow_up_date');
        let followUpDate: Date | undefined;
        if (followUpDateRaw) {
          const d = new Date(followUpDateRaw);
          if (!isNaN(d.getTime())) followUpDate = d;
        }

        // Assigned staff: match by name, fallback to uploader
        const assignedToName = col(row, 'Assigned To', 'Assigned Staff', 'assignedTo');
        let assignedStaffId = userId; // default: uploader
        if (assignedToName) {
          const matched = staffByName.get(assignedToName.toLowerCase());
          if (matched) assignedStaffId = matched;
          // if not matched, still proceed with uploader as default
        }

        // Generate lead code
        const count = await this.prisma.lead.count({ where: { companyId } });
        const leadCode = `LD-${String(count + 1).padStart(5, '0')}`;

        const lead = await this.prisma.lead.create({
          data: {
            leadCode,
            customerName,
            mobile,
            alternateMobile: alternateMobile || undefined,
            email: email || undefined,
            discom: discom as any,
            projectType: projectType as any,
            leadSource: leadSource as any,
            estimatedCapacityKw: estimatedCapacityKw && !isNaN(estimatedCapacityKw) ? estimatedCapacityKw : undefined,
            financePreference: financePreference as any,
            addressVillage,
            addressPincode: addressPincode || undefined,
            followUpDate,
            companyId,
            assignedStaffId,
            createdById: userId,
            status: 'new',
          },
        });

        created.push(lead.id);
      } catch (err: any) {
        failed.push({ row: rowNum, name: col(row, 'Customer Name', 'Name') || '(unknown)', reason: err?.message || 'Unknown error' });
      }
    }

    return { created: created.length, failed, total: rows.length };
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
