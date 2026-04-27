import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { EmailService } from '../notifications/email.service';
import { StorageService } from '../storage/storage.service';
import { UpdateApplicantDto } from './dto/update-applicant.dto';
import { StageChangeDto } from './dto/stage-change.dto';
import { CreateActivityDto } from './dto/create-activity.dto';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'application/pdf'];

@Injectable()
export class ApplicantsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private emailService: EmailService,
    private storage: StorageService,
  ) {}

  async findAll(companyId: string, query: any) {
    const { limit = 25, after, discom, stage, assignedStaffId, q, sort = 'createdAt', order = 'desc' } = query;

    const where: any = { companyId, deletedAt: null };
    if (discom) where.discom = discom;
    if (stage) where.stage = parseInt(stage);
    if (assignedStaffId) where.assignedStaffId = assignedStaffId;
    if (after) where.id = { gt: after };

    if (q) {
      where.OR = [
        { customerName: { contains: q, mode: 'insensitive' } },
        { applicantCode: { contains: q, mode: 'insensitive' } },
        { discomRefNo: { contains: q, mode: 'insensitive' } },
      ];
    }

    const applicants = await this.prisma.applicant.findMany({
      where,
      take: parseInt(limit),
      orderBy: { [sort]: order },
      include: {
        assignedStaff: { select: { id: true, name: true } },
      },
    });

    return { data: applicants, count: applicants.length };
  }

  async findOne(id: string, companyId: string) {
    const applicant = await this.prisma.applicant.findFirst({
      where: { id, companyId, deletedAt: null },
      include: {
        assignedStaff: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        documents: {
          orderBy: { uploadedAt: 'desc' },
        },
        transactions: {
          orderBy: { transactionDate: 'desc' },
        },
        applicantVendors: {
          include: { vendor: true },
        },
        activities: {
          include: { createdBy: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!applicant) throw new NotFoundException('Applicant not found');
    return applicant;
  }

  async addActivity(id: string, dto: CreateActivityDto, companyId: string, userId: string) {
    const applicant = await this.prisma.applicant.findFirst({ where: { id, companyId, deletedAt: null } });
    if (!applicant) throw new NotFoundException('Applicant not found');

    const activity = await this.prisma.projectActivity.create({
      data: {
        applicantId: id,
        activityType: dto.activityType,
        notes: dto.notes,
        followUpDate: dto.followUpDate ? new Date(dto.followUpDate) : null,
        createdById: userId,
      },
      include: { createdBy: { select: { id: true, name: true } } },
    });

    return { data: activity };
  }

  async update(id: string, dto: UpdateApplicantDto, companyId: string, userId: string, ipAddress: string) {
    const applicant = await this.prisma.applicant.findFirst({ where: { id, companyId } });
    if (!applicant) throw new NotFoundException('Applicant not found');

    const dateFields = ['dateOfBirth', 'loanSanctionedDate', 'surveyDate', 'portalApplicationDate',
      'mrtDate', 'inspectionDate', 'subsidyReceivedDate'];
    const data: any = { ...dto };
    for (const field of dateFields) {
      if (data[field]) data[field] = new Date(data[field]);
      else if (data[field] === '') data[field] = null;
    }

    const updated = await this.prisma.applicant.update({
      where: { id },
      data,
    });

    await this.audit.log({
      entityType: 'Applicant',
      entityId: id,
      action: 'UPDATE',
      beforeJson: { stage: applicant.stage, customerName: applicant.customerName } as any,
      afterJson: dto as any,
      userId,
      companyId,
      ipAddress,
    });

    return updated;
  }

  async changeStage(id: string, dto: StageChangeDto, companyId: string, userId: string) {
    const applicant = await this.prisma.applicant.findFirst({ where: { id, companyId } });
    if (!applicant) throw new NotFoundException('Applicant not found');

    const oldStage = applicant.stage;

    const updated = await this.prisma.applicant.update({
      where: { id },
      data: { stage: dto.newStage, stageUpdatedAt: new Date() },
    });

    if (applicant.assignedStaffId) {
      const staff = await this.prisma.user.findUnique({ where: { id: applicant.assignedStaffId } });
      if (staff?.email) {
        await this.emailService.sendStageAdvanced(staff.email, applicant.applicantCode, String(dto.newStage));
      }
    }

    await this.audit.log({
      entityType: 'Applicant',
      entityId: id,
      action: 'UPDATE',
      beforeJson: { stage: oldStage },
      afterJson: { stage: dto.newStage, notes: dto.notes },
      userId,
      companyId,
    });

    return updated;
  }

  async getChecklist(applicantId: string, companyId: string, discomOverride?: string, projectTypeOverride?: string) {
    const applicant = await this.findOne(applicantId, companyId);

    const discom = (discomOverride as any) || applicant.discom;
    const projectType = (projectTypeOverride as any) || applicant.projectType;

    // Load all active master items for the selected discom + projectType
    const masterItems = await this.prisma.checklistMaster.findMany({
      where: {
        companyId,
        discom,
        projectType,
        isActive: true,
      },
      orderBy: [{ phaseOrder: 'asc' }, { itemOrder: 'asc' }],
    });

    // Load existing completion records for this applicant
    const existing = await this.prisma.applicantChecklist.findMany({
      where: { applicantId },
    });
    const existingMap = new Map(existing.map((e) => [e.masterItemId, e]));

    // Merge: every master item gets a row; completion comes from existing record
    const data = masterItems.map((master) => {
      const record = existingMap.get(master.id);
      return {
        id: record?.id ?? master.id,       // ApplicantChecklist.id if exists, else masterItem.id
        applicantId,
        masterItemId: master.id,
        masterItem: master,
        isCompleted: record?.isCompleted ?? false,
        completedAt: record?.completedAt ?? null,
        completedById: record?.completedById ?? null,
      };
    });

    return { data };
  }

  async toggleChecklist(applicantId: string, masterItemId: string, companyId: string, userId: string) {
    await this.findOne(applicantId, companyId);

    const item = await this.prisma.applicantChecklist.findFirst({
      where: { applicantId, masterItemId },
    });

    if (!item) {
      return this.prisma.applicantChecklist.create({
        data: {
          applicantId,
          masterItemId,
          isCompleted: true,
          completedAt: new Date(),
          completedById: userId,
        },
      });
    }

    return this.prisma.applicantChecklist.update({
      where: { id: item.id },
      data: {
        isCompleted: !item.isCompleted,
        completedAt: !item.isCompleted ? new Date() : null,
        completedById: !item.isCompleted ? userId : null,
      },
    });
  }

  async advanceStage(id: string, companyId: string, userId: string) {
    const applicant = await this.prisma.applicant.findFirst({ where: { id, companyId } });
    if (!applicant) throw new NotFoundException('Applicant not found');
    if (applicant.stage >= 11) throw new BadRequestException('Project is already at the final stage');

    // Check all mandatory checklist items for current stage are complete
    const mandatoryIncomplete = await this.prisma.applicantChecklist.findFirst({
      where: {
        applicantId: id,
        isCompleted: false,
        masterItem: { isMandatory: true, phaseOrder: applicant.stage },
      },
    });
    if (mandatoryIncomplete) {
      throw new BadRequestException('All mandatory checklist items must be completed before advancing the stage');
    }

    const newStage = applicant.stage + 1;
    const updated = await this.prisma.applicant.update({
      where: { id },
      data: { stage: newStage, stageUpdatedAt: new Date() },
    });

    if (applicant.assignedStaffId) {
      const staff = await this.prisma.user.findUnique({ where: { id: applicant.assignedStaffId } });
      if (staff?.email) {
        await this.emailService.sendStageAdvanced(staff.email, applicant.applicantCode, String(newStage));
      }
    }

    await this.audit.log({
      entityType: 'Applicant',
      entityId: id,
      action: 'UPDATE',
      beforeJson: { stage: applicant.stage },
      afterJson: { stage: newStage },
      userId,
      companyId,
    });

    return updated;
  }

  async listDocuments(applicantId: string, companyId: string) {
    await this.findOne(applicantId, companyId);
    const documents = await this.prisma.document.findMany({
      where: { applicantId },
      orderBy: { uploadedAt: 'desc' },
    });
    return { data: documents };
  }

  async listTransactions(applicantId: string, companyId: string) {
    const applicant = await this.findOne(applicantId, companyId);

    const transactions = await this.prisma.transaction.findMany({
      where: { applicantId },
      orderBy: { transactionDate: 'desc' },
      include: { createdBy: { select: { id: true, name: true } } },
    });

    const approved = transactions.filter((t) => t.status === 'approved');
    const totalReceived = approved
      .filter((t) => t.type === 'customer_receipt')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const totalSubsidy = approved
      .filter((t) => t.type === 'subsidy')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const totalVendorPayments = approved
      .filter((t) => t.type === 'vendor_payment')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const totalContract = Number(applicant.contractAmount ?? 0);

    return {
      data: transactions,
      summary: {
        totalContract,
        totalReceived,
        balanceDue: totalContract - totalReceived,
        totalSubsidy,
        totalVendorPayments,
      },
    };
  }

  // ── Documents ──

  async uploadDocument(
    applicantId: string,
    file: Express.Multer.File,
    body: { docName: string; category: string; masterItemId?: string },
    companyId: string,
    userId: string,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    if (file.size > MAX_FILE_SIZE) throw new BadRequestException('File exceeds 2MB limit');
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      throw new BadRequestException('Only JPG, PNG, PDF allowed');
    }

    const applicant = await this.findOne(applicantId, companyId);
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    const filePath = this.storage.buildPath('applicants', applicantId, body.category || 'kyc', filename);

    const fileKey = await this.storage.uploadFile(file.buffer, filePath, file.mimetype);

    // If re-uploading for the same master item, delete the previous file + record
    if (body.masterItemId) {
      const existing = await this.prisma.document.findFirst({
        where: { applicantId, masterItemId: body.masterItemId },
      });
      if (existing) {
        if (existing.fileKey) {
          try { await this.storage.deleteFile(existing.fileKey); } catch { /* ignore */ }
        }
        await this.prisma.document.delete({ where: { id: existing.id } });
      }
    }

    const document = await this.prisma.document.create({
      data: {
        applicantId,
        masterItemId: body.masterItemId || null,
        category: body.category as any || 'kyc',
        docName: body.docName || file.originalname,
        fileKey,
        fileName: file.originalname,
        fileSizeBytes: file.size,
        mimeType: file.mimetype,
        status: 'uploaded',
        uploadedById: userId,
        uploadedAt: new Date(),
      },
    });

    await this.audit.log({
      entityType: 'Document',
      entityId: document.id,
      action: 'CREATE',
      afterJson: { docName: document.docName, category: document.category },
      userId,
      companyId,
    });

    return document;
  }

  async assignVendor(applicantId: string, body: { vendorId: string; categoryLabel?: string; isPrimary?: boolean }, companyId: string) {
    await this.findOne(applicantId, companyId);
    const existing = await this.prisma.applicantVendor.findUnique({
      where: { applicantId_vendorId: { applicantId, vendorId: body.vendorId } },
    });
    if (existing) throw new BadRequestException('Vendor already assigned to this project');

    return this.prisma.applicantVendor.create({
      data: {
        applicantId,
        vendorId: body.vendorId,
        categoryLabel: body.categoryLabel,
        isPrimary: body.isPrimary ?? false,
      },
      include: { vendor: true },
    });
  }

  async removeVendor(applicantId: string, vendorId: string, companyId: string) {
    await this.findOne(applicantId, companyId);
    const record = await this.prisma.applicantVendor.findUnique({
      where: { applicantId_vendorId: { applicantId, vendorId } },
    });
    if (!record) throw new NotFoundException('Vendor not assigned to this project');
    await this.prisma.applicantVendor.delete({ where: { id: record.id } });
    return { success: true };
  }

  async downloadDocument(applicantId: string, docId: string, companyId: string) {
    await this.findOne(applicantId, companyId);

    const document = await this.prisma.document.findFirst({
      where: { id: docId, applicantId },
    });
    if (!document || !document.fileKey) throw new NotFoundException('Document not found');

    const buffer = await this.storage.downloadFile(document.fileKey);
    return { buffer, document };
  }

  async generateUploadLink(applicantId: string, companyId: string, userId: string, baseUrl: string) {
    const applicant = await this.findOne(applicantId, companyId);

    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await this.prisma.customerUploadLink.create({
      data: { applicantId, token, expiresAt },
    });

    const link = `${baseUrl}/upload/${token}`;

    // Email customer if they have an email
    if (applicant.email) {
      await this.emailService.sendCustomerUploadLink(applicant.email, link, applicant.applicantCode);
    }

    return { link, token, expiresAt };
  }
}
