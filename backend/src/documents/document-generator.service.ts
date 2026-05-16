import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import PDFDocument from 'pdfkit';

const DISCOM_LABELS: Record<string, string> = {
  tpcodl: 'TP Central Odisha Distribution Ltd (TPCODL)',
  tpnodl: 'TP Northern Odisha Distribution Ltd (TPNODL)',
  tpsodl: 'TP Southern Odisha Distribution Ltd (TPSODL)',
  tpwodl: 'TP Western Odisha Distribution Ltd (TPWODL)',
};

@Injectable()
export class DocumentGeneratorService {
  constructor(private prisma: PrismaService) {}

  async generate(
    applicantId: string,
    masterItemId: string,
    companyId: string,
  ): Promise<{ buffer: Buffer; title: string }> {
    const masterItem = await this.prisma.documentMaster.findFirst({
      where: { id: masterItemId, isActive: true },
    });
    if (!masterItem) throw new NotFoundException('Document master item not found');
    if (masterItem.docType !== 'generate') throw new BadRequestException('Not a generate-type document');

    const applicant = await this.prisma.applicant.findFirst({
      where: { id: applicantId, companyId, deletedAt: null },
      include: {
        addressDistrict: { select: { name: true } },
        addressState: { select: { name: true } },
        installationDetails: true,
        applicantVendors: {
          where: { isPrimary: true },
          include: { vendor: true },
          take: 1,
        },
        transactions: {
          where: { type: 'subsidy', status: 'approved' },
          select: { amount: true },
        },
      },
    });
    if (!applicant) throw new NotFoundException('Applicant not found');

    let buffer: Buffer;
    switch (masterItem.title) {
      case 'Joint Inspection Report':
        buffer = await this.jointInspectionReport(applicant);
        break;
      default:
        buffer = await this.placeholderPdf(masterItem.title);
    }
    return { buffer, title: masterItem.title };
  }

  // ── Joint Inspection Report ───────────────────────────────────────────────

  private jointInspectionReport(applicant: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const buf: Buffer[] = [];
      doc.on('data', (c) => buf.push(c));
      doc.on('end', () => resolve(Buffer.concat(buf)));
      doc.on('error', reject);

      const L = 50;   // left margin
      const PW = 495; // usable page width (595 - 2*50)
      const COL1 = 250, COL2 = PW - COL1; // 2-col details table
      const C3 = Math.floor(PW / 3);       // 3-col table each column ≈ 165

      const vendor = applicant.applicantVendors[0]?.vendor;
      const install = applicant.installationDetails;

      const address = [
        applicant.addressHouse,
        applicant.addressStreet,
        applicant.addressVillage,
        applicant.addressDistrict?.name,
        applicant.addressState?.name,
        applicant.addressPincode,
      ].filter(Boolean).join(', ');

      const subsidyTotal = applicant.transactions.reduce(
        (s: number, t: any) => s + Number(t.amount), 0,
      );
      const contract = Number(applicant.contractAmount ?? 0);
      const panelCap = Number(install?.panelTotalCapacityKw ?? applicant.systemCapacityKw ?? 0);
      const invCap = Number(install?.inverterCapacityKw ?? applicant.systemCapacityKw ?? 0);
      const discomLabel = DISCOM_LABELS[applicant.discom] ?? applicant.discom.toUpperCase();
      const inr = (n: number) =>
        n > 0 ? n.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '___________';

      // ── Title ──
      doc.font('Helvetica-Bold').fontSize(14).text('Joint Inspection Report', { align: 'center' });
      doc.moveDown();

      // ── Intro ──
      doc.font('Helvetica').fontSize(10).text(
        'It is to certify that a Grid Connected Solar PV Power Plant has been installed with following details:',
        { align: 'justify' },
      );
      doc.moveDown(0.5);

      // ── Details table (borderless, 2-col) ──
      const detailRows: [string, string][] = [
        ['1. Name of the beneficiary:', applicant.customerName ?? ''],
        ['2. Address of installation with pin code:', address],
        ['3. Electricity consumer number:', applicant.existingConsumerNo ?? ''],
        ['4. Solar PV module capacity (DC):', panelCap ? `${panelCap} kWp` : ''],
        ['5. Inverter capacity (AC) (Nominal output power):', invCap ? `${invCap} KW` : ''],
        ['6. Date of installation/commissioning:', ''],
        ['7. Date of Joint inspection:', ''],
        ['8. Metering arrangement:', 'Net Meter (Net meter / Gross meter / Net billing)'],
      ];

      doc.font('Helvetica').fontSize(10);
      let ry = doc.y;
      for (const [label, value] of detailRows) {
        doc.text(label, L, ry, { width: COL1 });
        doc.text(value, L + COL1, ry, { width: COL2 });
        ry += 17;
      }
      doc.y = ry;
      doc.moveDown(0.6);

      // ── BIS/MNRE para ──
      doc.font('Helvetica').fontSize(10).text(
        'The above system is as per BIS/MNRE specifications and has been checked for its performance on …....................... and it is working satisfactorily.',
        { align: 'justify' },
      );
      doc.moveDown(0.8);

      // ── Signature table 1 ──
      const sigRows1: { cells: [string, string, string]; h?: number; bold?: boolean }[] = [
        { cells: ['DISCOM', 'EMPANELLED AGENCY', 'CONSUMER'], bold: true },
        { cells: ['Name :', vendor?.businessName ?? '', applicant.customerName] },
        { cells: ['Designation :', vendor?.contactPerson ?? '', 'CONSUMER'] },
        { cells: ['', '', ''], h: 35 },
        { cells: ['Sign :', '', ''] },
        { cells: ['', '', ''], h: 30 },
        { cells: ['Seal :', '', ''] },
      ];

      let ty = doc.y;
      for (const row of sigRows1) {
        const rh = row.h ?? 22;
        this.tableRow3(doc, row.cells, L, ty, C3, rh, row.bold);
        ty += rh;
      }
      doc.y = ty;
      doc.moveDown(0.8);

      // ── Purchase para ──
      doc.font('Helvetica').fontSize(10).text(
        'It is to certify that the above system has been purchased with following details:',
        { align: 'justify' },
      );
      doc.moveDown(0.3);
      doc.text(`1.  Total project cost   Rs. ${inr(contract)}`);
      doc.text(`2.  Subsidy amount   Rs. ${inr(subsidyTotal)}`);
      doc.text(
        `     Amount paid by beneficiary   Rs. ${inr(contract > 0 && subsidyTotal > 0 ? contract - subsidyTotal : 0)}`,
      );
      doc.moveDown(0.8);

      // ── Signature table 2 ──
      const sigRows2: { cells: [string, string, string]; h?: number; bold?: boolean }[] = [
        { cells: ['', 'EMPANELLED AGENCY', 'CONSUMER'], bold: true },
        { cells: ['Name :', vendor?.businessName ?? '', applicant.customerName] },
        { cells: ['Designation :', vendor?.contactPerson ?? '', 'CONSUMER'] },
        { cells: ['Date :', '', ''] },
        { cells: ['', '', ''], h: 35 },
        { cells: ['Sign :', '', ''] },
        { cells: ['', '', ''], h: 30 },
        { cells: ['Seal :', '', ''] },
        { cells: ['', '', ''] },
      ];

      ty = doc.y;
      for (const row of sigRows2) {
        const rh = row.h ?? 22;
        this.tableRow3(doc, row.cells, L, ty, C3, rh, row.bold);
        ty += rh;
      }
      doc.y = ty;
      doc.moveDown(0.8);

      // ── Note ──
      doc.font('Helvetica').fontSize(9).text(
        'Note: This report will be applicable for all the projects installed/commissioned after 31-07-2021',
        { align: 'center' },
      );

      doc.end();
    });
  }

  // ── Table helper (3-col, with borders) ───────────────────────────────────

  private tableRow3(
    doc: PDFKit.PDFDocument,
    cells: [string, string, string],
    x: number,
    y: number,
    colW: number,
    rowH: number,
    bold = false,
  ) {
    const totalW = colW * 3;
    doc.rect(x, y, totalW, rowH).stroke();
    doc.moveTo(x + colW, y).lineTo(x + colW, y + rowH).stroke();
    doc.moveTo(x + colW * 2, y).lineTo(x + colW * 2, y + rowH).stroke();

    doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(9);
    const textY = y + (rowH - 10) / 2;
    for (let i = 0; i < 3; i++) {
      if (cells[i]) {
        doc.text(cells[i], x + colW * i + 4, textY, { width: colW - 8, lineBreak: false });
      }
    }
  }

  // ── Placeholder for unimplemented generate types ──────────────────────────

  private placeholderPdf(title: string): Promise<Buffer> {
    return new Promise((resolve) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const buf: Buffer[] = [];
      doc.on('data', (c) => buf.push(c));
      doc.on('end', () => resolve(Buffer.concat(buf)));
      doc.font('Helvetica-Bold').fontSize(14).text(title, { align: 'center' });
      doc.moveDown();
      doc.font('Helvetica').fontSize(11).text('Document generation coming soon.', { align: 'center' });
      doc.end();
    });
  }
}
