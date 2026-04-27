require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// ─────────────────────────────────────────────
// MASTER STATES
// ─────────────────────────────────────────────
const states = [
  { name: 'Odisha', code: 'OD' },
  { name: 'Andhra Pradesh', code: 'AP' },
  { name: 'Telangana', code: 'TG' },
  { name: 'Maharashtra', code: 'MH' },
  { name: 'Gujarat', code: 'GJ' },
  { name: 'Rajasthan', code: 'RJ' },
  { name: 'Uttar Pradesh', code: 'UP' },
  { name: 'Madhya Pradesh', code: 'MP' },
  { name: 'Karnataka', code: 'KA' },
  { name: 'Tamil Nadu', code: 'TN' },
  { name: 'West Bengal', code: 'WB' },
  { name: 'Bihar', code: 'BR' },
  { name: 'Jharkhand', code: 'JH' },
  { name: 'Chhattisgarh', code: 'CG' },
];

// ─────────────────────────────────────────────
// ODISHA DISTRICTS BY DISCOM
// ─────────────────────────────────────────────
// TPCODL - TP Central Odisha Distribution Ltd (Bhubaneswar area)
// TPNODL - TP Northern Odisha Distribution Ltd (North Odisha)
// TPSODL - TP Southern Odisha Distribution Ltd (South Odisha)
// TPWODL - TP Western Odisha Distribution Ltd (West Odisha)

const odishaDistricts = [
  // TPCODL - Central Odisha
  { name: 'Khordha', discom: 'tpcodl' },
  { name: 'Cuttack', discom: 'tpcodl' },
  { name: 'Puri', discom: 'tpcodl' },
  { name: 'Nayagarh', discom: 'tpcodl' },
  { name: 'Ganjam', discom: 'tpcodl' },
  { name: 'Gajapati', discom: 'tpcodl' },
  { name: 'Kandhamal', discom: 'tpcodl' },
  { name: 'Boudh', discom: 'tpcodl' },

  // TPNODL - North Odisha
  { name: 'Balasore', discom: 'tpnodl' },
  { name: 'Bhadrak', discom: 'tpnodl' },
  { name: 'Jajpur', discom: 'tpnodl' },
  { name: 'Kendrapara', discom: 'tpnodl' },
  { name: 'Mayurbhanj', discom: 'tpnodl' },
  { name: 'Keonjhar', discom: 'tpnodl' },

  // TPSODL - South Odisha
  { name: 'Koraput', discom: 'tpsodl' },
  { name: 'Malkangiri', discom: 'tpsodl' },
  { name: 'Nabarangpur', discom: 'tpsodl' },
  { name: 'Rayagada', discom: 'tpsodl' },
  { name: 'Kalahandi', discom: 'tpsodl' },
  { name: 'Nuapada', discom: 'tpsodl' },
  { name: 'Bolangir', discom: 'tpsodl' },
  { name: 'Sonepur', discom: 'tpsodl' },

  // TPWODL - West Odisha
  { name: 'Sambalpur', discom: 'tpwodl' },
  { name: 'Sundargarh', discom: 'tpwodl' },
  { name: 'Jharsuguda', discom: 'tpwodl' },
  { name: 'Bargarh', discom: 'tpwodl' },
  { name: 'Deogarh', discom: 'tpwodl' },
  { name: 'Angul', discom: 'tpwodl' },
  { name: 'Dhenkanal', discom: 'tpwodl' },
];

// ─────────────────────────────────────────────
// CHECKLIST ITEMS (per DISCOM checklist phases)
// Phases match the 11-stage progress bar
// ─────────────────────────────────────────────

function buildChecklist(discom, projectType) {
  return [
    // ── PHASE 1: Document Collection ──
    { phase: 'Document Collection', phaseOrder: 1, itemOrder: 1,  mandatory: true,  text: 'Aadhaar Card collected (original sighted)' },
    { phase: 'Document Collection', phaseOrder: 1, itemOrder: 2,  mandatory: true,  text: 'PAN Card collected' },
    { phase: 'Document Collection', phaseOrder: 1, itemOrder: 3,  mandatory: true,  text: 'Passport size photograph collected (2 copies)' },
    { phase: 'Document Collection', phaseOrder: 1, itemOrder: 4,  mandatory: true,  text: 'Latest electricity bill collected (not older than 3 months)' },
    { phase: 'Document Collection', phaseOrder: 1, itemOrder: 5,  mandatory: true,  text: 'Bank passbook or cancelled cheque collected' },
    { phase: 'Document Collection', phaseOrder: 1, itemOrder: 6,  mandatory: true,  text: 'Property ownership proof collected (registered deed / tax receipt)' },
    { phase: 'Document Collection', phaseOrder: 1, itemOrder: 7,  mandatory: false, text: 'Income certificate collected (if applicable for subsidy)' },
    { phase: 'Document Collection', phaseOrder: 1, itemOrder: 8,  mandatory: false, text: 'Loan sanction letter collected (if finance opted)' },
    { phase: 'Document Collection', phaseOrder: 1, itemOrder: 9,  mandatory: true,  text: 'Customer consent form signed and collected' },
    { phase: 'Document Collection', phaseOrder: 1, itemOrder: 10, mandatory: false, text: 'No-objection certificate from landlord (if rented property)' },

    // ── PHASE 2: Site Survey ──
    { phase: 'Site Survey', phaseOrder: 2, itemOrder: 1,  mandatory: true,  text: 'Site visit scheduled and confirmed with customer' },
    { phase: 'Site Survey', phaseOrder: 2, itemOrder: 2,  mandatory: true,  text: 'Roof area measured and recorded (sq ft)' },
    { phase: 'Site Survey', phaseOrder: 2, itemOrder: 3,  mandatory: true,  text: 'Roof type identified (RCC / tin / other)' },
    { phase: 'Site Survey', phaseOrder: 2, itemOrder: 4,  mandatory: true,  text: 'Shadow analysis completed and notes recorded' },
    { phase: 'Site Survey', phaseOrder: 2, itemOrder: 5,  mandatory: true,  text: 'GPS coordinates recorded (latitude and longitude)' },
    { phase: 'Site Survey', phaseOrder: 2, itemOrder: 6,  mandatory: true,  text: 'Survey photographs uploaded (min 4 photos: front, rear, left, right)' },
    { phase: 'Site Survey', phaseOrder: 2, itemOrder: 7,  mandatory: true,  text: 'Existing electricity meter location noted' },
    { phase: 'Site Survey', phaseOrder: 2, itemOrder: 8,  mandatory: true,  text: 'Sanctioned load verified from electricity bill' },
    { phase: 'Site Survey', phaseOrder: 2, itemOrder: 9,  mandatory: false, text: 'Electrical wiring condition assessed' },
    { phase: 'Site Survey', phaseOrder: 2, itemOrder: 10, mandatory: true,  text: 'Recommended system size finalised and recorded' },
    { phase: 'Site Survey', phaseOrder: 2, itemOrder: 11, mandatory: false, text: 'Customer informed of recommended system size' },

    // ── PHASE 3: Technical Design ──
    { phase: 'Technical Design', phaseOrder: 3, itemOrder: 1,  mandatory: true,  text: 'Single line diagram (SLD) prepared' },
    { phase: 'Technical Design', phaseOrder: 3, itemOrder: 2,  mandatory: true,  text: 'Panel layout drawing prepared' },
    { phase: 'Technical Design', phaseOrder: 3, itemOrder: 3,  mandatory: true,  text: 'Structural safety assessment completed' },
    { phase: 'Technical Design', phaseOrder: 3, itemOrder: 4,  mandatory: false, text: 'Structural safety certificate obtained (if required by DISCOM)' },
    { phase: 'Technical Design', phaseOrder: 3, itemOrder: 5,  mandatory: true,  text: 'Equipment make and model finalised (panels, inverter, mounting)' },
    { phase: 'Technical Design', phaseOrder: 3, itemOrder: 6,  mandatory: true,  text: 'DCR (Domestic Content Requirement) certificate verified for panels' },
    { phase: 'Technical Design', phaseOrder: 3, itemOrder: 7,  mandatory: true,  text: 'Bill of materials (BOM) prepared' },
    { phase: 'Technical Design', phaseOrder: 3, itemOrder: 8,  mandatory: true,  text: 'Total contract amount finalised and customer agreement signed' },
    { phase: 'Technical Design', phaseOrder: 3, itemOrder: 9,  mandatory: false, text: 'Customer advance payment collected (if applicable)' },

    // ── PHASE 4: DISCOM Application ──
    { phase: 'DISCOM Application', phaseOrder: 4, itemOrder: 1,  mandatory: true,  text: `${discom.toUpperCase()} portal account created / verified for customer` },
    { phase: 'DISCOM Application', phaseOrder: 4, itemOrder: 2,  mandatory: true,  text: 'Application form filled and submitted on DISCOM portal' },
    { phase: 'DISCOM Application', phaseOrder: 4, itemOrder: 3,  mandatory: true,  text: 'DISCOM portal reference number obtained and recorded' },
    { phase: 'DISCOM Application', phaseOrder: 4, itemOrder: 4,  mandatory: true,  text: 'All documents uploaded on DISCOM portal (Aadhaar, PAN, bill, SLD)' },
    { phase: 'DISCOM Application', phaseOrder: 4, itemOrder: 5,  mandatory: true,  text: 'Application fee paid (if applicable)' },
    { phase: 'DISCOM Application', phaseOrder: 4, itemOrder: 6,  mandatory: false, text: 'Application status confirmed as "Under Review" on portal' },
    { phase: 'DISCOM Application', phaseOrder: 4, itemOrder: 7,  mandatory: false, text: 'JE (Junior Engineer) name and contact noted from portal' },

    // ── PHASE 5: DISCOM Approval ──
    { phase: 'DISCOM Approval', phaseOrder: 5, itemOrder: 1, mandatory: true,  text: 'DISCOM technical feasibility approval received' },
    { phase: 'DISCOM Approval', phaseOrder: 5, itemOrder: 2, mandatory: true,  text: 'DISCOM approval letter downloaded and uploaded to system' },
    { phase: 'DISCOM Approval', phaseOrder: 5, itemOrder: 3, mandatory: false, text: 'MRT (Meter Registration Test) date scheduled and noted' },
    { phase: 'DISCOM Approval', phaseOrder: 5, itemOrder: 4, mandatory: false, text: 'Customer informed of approval and next steps' },

    // ── PHASE 6: Material Procurement ──
    { phase: 'Material Procurement', phaseOrder: 6, itemOrder: 1,  mandatory: true,  text: 'Primary vendor assigned in system' },
    { phase: 'Material Procurement', phaseOrder: 6, itemOrder: 2,  mandatory: true,  text: 'Purchase order issued to material supplier' },
    { phase: 'Material Procurement', phaseOrder: 6, itemOrder: 3,  mandatory: true,  text: 'Solar panels procured (DCR certified, quantity as per BOM)' },
    { phase: 'Material Procurement', phaseOrder: 6, itemOrder: 4,  mandatory: true,  text: 'Solar inverter procured (MNRE approved model)' },
    { phase: 'Material Procurement', phaseOrder: 6, itemOrder: 5,  mandatory: true,  text: 'Mounting structure procured' },
    { phase: 'Material Procurement', phaseOrder: 6, itemOrder: 6,  mandatory: true,  text: 'DC and AC cables procured (as per BOM)' },
    { phase: 'Material Procurement', phaseOrder: 6, itemOrder: 7,  mandatory: false, text: 'DC combiner box / junction box procured (if applicable)' },
    { phase: 'Material Procurement', phaseOrder: 6, itemOrder: 8,  mandatory: true,  text: 'AC distribution board / MCB procured' },
    { phase: 'Material Procurement', phaseOrder: 6, itemOrder: 9,  mandatory: false, text: 'Earthing kit procured' },
    { phase: 'Material Procurement', phaseOrder: 6, itemOrder: 10, mandatory: true,  text: 'Material delivery to site confirmed' },
    { phase: 'Material Procurement', phaseOrder: 6, itemOrder: 11, mandatory: false, text: 'Material quality checked at site before installation' },

    // ── PHASE 7: Installation ──
    { phase: 'Installation', phaseOrder: 7, itemOrder: 1,  mandatory: true,  text: 'Installation date scheduled and confirmed with customer' },
    { phase: 'Installation', phaseOrder: 7, itemOrder: 2,  mandatory: true,  text: 'Mounting structure installed and aligned (as per drawing)' },
    { phase: 'Installation', phaseOrder: 7, itemOrder: 3,  mandatory: true,  text: 'Solar panels mounted and secured on structure' },
    { phase: 'Installation', phaseOrder: 7, itemOrder: 4,  mandatory: true,  text: 'DC wiring completed (panel strings to inverter)' },
    { phase: 'Installation', phaseOrder: 7, itemOrder: 5,  mandatory: true,  text: 'Inverter installed and mounted (indoor / weatherproof enclosure)' },
    { phase: 'Installation', phaseOrder: 7, itemOrder: 6,  mandatory: true,  text: 'AC wiring completed (inverter to distribution board)' },
    { phase: 'Installation', phaseOrder: 7, itemOrder: 7,  mandatory: true,  text: 'Earthing completed as per IS standard' },
    { phase: 'Installation', phaseOrder: 7, itemOrder: 8,  mandatory: true,  text: 'Lightning arrester installed (if required)' },
    { phase: 'Installation', phaseOrder: 7, itemOrder: 9,  mandatory: true,  text: 'System powered on and initial test completed' },
    { phase: 'Installation', phaseOrder: 7, itemOrder: 10, mandatory: true,  text: 'Inverter display showing correct generation readings' },
    { phase: 'Installation', phaseOrder: 7, itemOrder: 11, mandatory: true,  text: 'Installation photographs uploaded (min 8 photos: all stages)' },
    { phase: 'Installation', phaseOrder: 7, itemOrder: 12, mandatory: true,  text: 'Installation completion certificate prepared' },
    { phase: 'Installation', phaseOrder: 7, itemOrder: 13, mandatory: false, text: 'Customer walk-through and demonstration completed' },
    { phase: 'Installation', phaseOrder: 7, itemOrder: 14, mandatory: false, text: 'Panel and inverter warranty cards handed over to customer' },

    // ── PHASE 8: DISCOM Inspection ──
    { phase: 'DISCOM Inspection', phaseOrder: 8, itemOrder: 1, mandatory: true,  text: 'Inspection request submitted on DISCOM portal' },
    { phase: 'DISCOM Inspection', phaseOrder: 8, itemOrder: 2, mandatory: true,  text: 'Inspection date confirmed with DISCOM JE' },
    { phase: 'DISCOM Inspection', phaseOrder: 8, itemOrder: 3, mandatory: true,  text: 'DISCOM site inspection completed' },
    { phase: 'DISCOM Inspection', phaseOrder: 8, itemOrder: 4, mandatory: true,  text: 'Inspection result: PASSED (no pending observations)' },
    { phase: 'DISCOM Inspection', phaseOrder: 8, itemOrder: 5, mandatory: true,  text: 'Inspection report downloaded and uploaded to system' },
    { phase: 'DISCOM Inspection', phaseOrder: 8, itemOrder: 6, mandatory: false, text: 'Any inspection observations addressed and re-inspected (if required)' },

    // ── PHASE 9: Net Metering ──
    { phase: 'Net Metering', phaseOrder: 9, itemOrder: 1, mandatory: true,  text: 'Net metering application submitted on DISCOM portal' },
    { phase: 'Net Metering', phaseOrder: 9, itemOrder: 2, mandatory: true,  text: 'Net meter installation date scheduled by DISCOM' },
    { phase: 'Net Metering', phaseOrder: 9, itemOrder: 3, mandatory: true,  text: 'Bidirectional net meter installed by DISCOM' },
    { phase: 'Net Metering', phaseOrder: 9, itemOrder: 4, mandatory: true,  text: 'Net meter serial number recorded in system' },
    { phase: 'Net Metering', phaseOrder: 9, itemOrder: 5, mandatory: true,  text: 'Net metering agreement signed with DISCOM' },
    { phase: 'Net Metering', phaseOrder: 9, itemOrder: 6, mandatory: true,  text: 'Net metering agreement uploaded to system' },
    { phase: 'Net Metering', phaseOrder: 9, itemOrder: 7, mandatory: false, text: 'Customer informed about bi-directional meter reading' },

    // ── PHASE 10: Commissioning ──
    { phase: 'Commissioning', phaseOrder: 10, itemOrder: 1, mandatory: true,  text: 'Commissioning certificate issued by DISCOM / EPC' },
    { phase: 'Commissioning', phaseOrder: 10, itemOrder: 2, mandatory: true,  text: 'Commissioning certificate uploaded to system' },
    { phase: 'Commissioning', phaseOrder: 10, itemOrder: 3, mandatory: true,  text: 'System live and generating — confirmed on inverter / monitoring app' },
    { phase: 'Commissioning', phaseOrder: 10, itemOrder: 4, mandatory: false, text: 'Customer handed over operation and maintenance (O&M) manual' },
    { phase: 'Commissioning', phaseOrder: 10, itemOrder: 5, mandatory: false, text: 'AMC (Annual Maintenance Contract) offer given to customer' },

    // ── PHASE 11: Subsidy Claim ──
    { phase: 'Subsidy Claim', phaseOrder: 11, itemOrder: 1,  mandatory: true,  text: 'PM Surya Ghar subsidy application submitted on national portal' },
    { phase: 'Subsidy Claim', phaseOrder: 11, itemOrder: 2,  mandatory: true,  text: 'Subsidy application form uploaded to system' },
    { phase: 'Subsidy Claim', phaseOrder: 11, itemOrder: 3,  mandatory: true,  text: 'Bank account details verified for subsidy credit' },
    { phase: 'Subsidy Claim', phaseOrder: 11, itemOrder: 4,  mandatory: false, text: 'Subsidy application status: Under Review' },
    { phase: 'Subsidy Claim', phaseOrder: 11, itemOrder: 5,  mandatory: true,  text: 'Subsidy amount credited to customer bank account' },
    { phase: 'Subsidy Claim', phaseOrder: 11, itemOrder: 6,  mandatory: false, text: 'Actual subsidy amount recorded in Finance module' },
    { phase: 'Subsidy Claim', phaseOrder: 11, itemOrder: 7,  mandatory: false, text: 'DISCOM bank reference number recorded' },
    { phase: 'Subsidy Claim', phaseOrder: 11, itemOrder: 8,  mandatory: false, text: 'Customer confirmation of subsidy receipt obtained' },
    { phase: 'Subsidy Claim', phaseOrder: 11, itemOrder: 9,  mandatory: false, text: 'Project closure confirmation sent to customer' },
    { phase: 'Subsidy Claim', phaseOrder: 11, itemOrder: 10, mandatory: false, text: 'Final project profitability recorded in Finance module' },
  ];
}

// ─────────────────────────────────────────────
// MAIN SEED FUNCTION
// ─────────────────────────────────────────────
async function main() {
  console.log('🌱 Starting database seed...\n');

  // ── 1. Master States ──
  console.log('📍 Seeding master states...');
  for (const state of states) {
    await prisma.masterState.upsert({
      where: { code: state.code },
      update: {},
      create: state,
    });
  }
  const odisha = await prisma.masterState.findUnique({ where: { code: 'OD' } });
  console.log(`   ✓ ${states.length} states seeded`);

  // ── 2. Odisha Districts ──
  console.log('📍 Seeding Odisha districts...');
  for (const district of odishaDistricts) {
    await prisma.masterDistrict.upsert({
      where: { name_stateId: { name: district.name, stateId: odisha.id } },
      update: {},
      create: { name: district.name, stateId: odisha.id },
    });
  }
  console.log(`   ✓ ${odishaDistricts.length} districts seeded`);

  // ── 3. Default Company ──
  console.log('🏢 Seeding default company...');
  const company = await prisma.company.upsert({
    where: { id: 'company-suryam-001' },
    update: {},
    create: {
      id: 'company-suryam-001',
      name: 'Suryam Solar EPC Pvt Ltd',
      gstin: '',
      addressCity: 'Bhubaneswar',
      addressPincode: '751001',
      settingsJson: {
        sessionTimeoutMinutes: 60,
        overdueThresholdDays: {
          stage_1: 3,
          stage_2: 7,
          stage_3: 5,
          stage_4: 5,
          stage_5: 10,
          stage_6: 15,
          stage_7: 7,
          stage_8: 10,
          stage_9: 7,
          stage_10: 7,
          stage_11: 30,
        },
        overpaymentRule: 'warn',
      },
    },
  });
  console.log(`   ✓ Company: ${company.name}`);

  // ── 4. Default Admin User ──
  console.log('👤 Seeding default admin user...');
  const bcrypt = require('bcrypt');
  const adminPasswordHash = await bcrypt.hash('admin@123', 12);
  const adminUser = await prisma.user.upsert({
    where: { id: 'user-admin-001' },
    update: { passwordHash: adminPasswordHash },
    create: {
      id: 'user-admin-001',
      companyId: company.id,
      name: 'Admin',
      mobile: '9999999999',
      email: 'admin@suryamcrm.in',
      passwordHash: adminPasswordHash,
      role: 'admin',
      status: 'active',
      permissionsJson: {},
      ipWhitelist: [],
      failedLoginCount: 0,
    },
  });
  console.log(`   ✓ Admin user: ${adminUser.email} / password: admin@123`);

  // ── 5. Checklist Master ──
  const existingCount = await prisma.checklistMaster.count({ where: { companyId: company.id } });
  let totalItems = 0;
  if (existingCount > 0) {
    console.log(`📋 Checklist master already seeded (${existingCount} items) — skipping.`);
  } else {
    console.log('📋 Seeding checklist master (4 DISCOMs × 2 project types)...');
    const discoms = ['tpcodl', 'tpnodl', 'tpsodl', 'tpwodl'];
    const projectTypes = ['residential', 'commercial'];

    for (const discom of discoms) {
      for (const projectType of projectTypes) {
        const items = buildChecklist(discom, projectType);
        for (const item of items) {
          await prisma.checklistMaster.create({
            data: {
              companyId: company.id,
              discom: discom,
              projectType: projectType,
              phaseName: item.phase,
              phaseOrder: item.phaseOrder,
              itemText: item.text,
              itemOrder: item.itemOrder,
              isMandatory: item.mandatory,
              isActive: true,
            },
          });
          totalItems++;
        }
      }
    }
    console.log(`   ✓ ${totalItems} checklist items seeded`);
  }

  // ── 6. Super Admin User ──
  console.log('🔐 Seeding super admin user...');
  const superAdminPasswordHash = await bcrypt.hash('superadmin@123', 12);
  const superAdmin = await prisma.user.upsert({
    where: { id: 'user-superadmin-001' },
    update: { passwordHash: superAdminPasswordHash },
    create: {
      id: 'user-superadmin-001',
      companyId: company.id,
      name: 'Super Admin',
      mobile: '9000000001',
      email: 'superadmin@suryamcrm.in',
      passwordHash: superAdminPasswordHash,
      role: 'super_admin',
      status: 'active',
      permissionsJson: {},
      ipWhitelist: [],
      failedLoginCount: 0,
    },
  });
  console.log(`   ✓ Super Admin: ${superAdmin.email} / superadmin@123`);

  // ── 7. Document Master ──
  const existingDocMasterCount = await prisma.documentMaster.count();
  if (existingDocMasterCount > 0) {
    console.log(`📄 Document master already seeded (${existingDocMasterCount} items) — skipping.`);
  } else {
    console.log('📄 Seeding document master...');
    const docMasters = [
      // ── TPCODL ──
      { discom: 'tpcodl', title: 'Aadhaar, PAN Card And Bank Passbook Front Page', canGenerate: false, sortOrder: 1 },
      { discom: 'tpcodl', title: 'Adani Data Sheet', canGenerate: false, sortOrder: 2 },
      { discom: 'tpcodl', title: 'Adani Eastman Datasheet', canGenerate: false, sortOrder: 3 },
      { discom: 'tpcodl', title: 'Customer Vendor Agreement', canGenerate: true, sortOrder: 4 },
      { discom: 'tpcodl', title: 'DCR Certificate', canGenerate: false, sortOrder: 5 },
      { discom: 'tpcodl', title: 'Declaration For DCR', canGenerate: true, sortOrder: 6 },
      { discom: 'tpcodl', title: 'Digital Approval, Feasibility Report And Quotation', canGenerate: false, sortOrder: 7 },
      { discom: 'tpcodl', title: 'Electricity Bill A4 Size Copy', canGenerate: false, sortOrder: 8 },
      { discom: 'tpcodl', title: 'Form-1 Application Form Net Meter', canGenerate: true, sortOrder: 9 },
      { discom: 'tpcodl', title: 'Form-3 Work Complete', canGenerate: true, sortOrder: 10 },
      { discom: 'tpcodl', title: 'Generated File JEE Sign', canGenerate: true, sortOrder: 11 },
      { discom: 'tpcodl', title: 'Geo Tag Photo Panel & Invertor', canGenerate: false, sortOrder: 12 },
      { discom: 'tpcodl', title: 'GST Tax Invoice', canGenerate: true, sortOrder: 13 },
      { discom: 'tpcodl', title: 'Installation TPCODL', canGenerate: false, sortOrder: 14 },
      { discom: 'tpcodl', title: 'Joint Inspection Report', canGenerate: false, sortOrder: 15 },
      { discom: 'tpcodl', title: 'Metafin Warranty Card', canGenerate: false, sortOrder: 16 },
      { discom: 'tpcodl', title: 'Net Meter Agreement', canGenerate: true, sortOrder: 17 },
      { discom: 'tpcodl', title: 'Net Meter Money Receipt', canGenerate: false, sortOrder: 18 },
      { discom: 'tpcodl', title: 'PBblink Inverter DataSheet', canGenerate: false, sortOrder: 19 },
      { discom: 'tpcodl', title: 'Quotation', canGenerate: true, sortOrder: 20 },
      { discom: 'tpcodl', title: 'Solar Wiring Diagram', canGenerate: true, sortOrder: 21 },
      { discom: 'tpcodl', title: 'Work Completion Certificate', canGenerate: true, sortOrder: 22 },
      // ── TPNODL ──
      { discom: 'tpnodl', title: 'Aadhaar Card', canGenerate: false, sortOrder: 1 },
      { discom: 'tpnodl', title: 'PAN Card', canGenerate: false, sortOrder: 2 },
      { discom: 'tpnodl', title: 'Bank Passbook Front Page', canGenerate: false, sortOrder: 3 },
      { discom: 'tpnodl', title: 'Electricity Bill (A4 Size)', canGenerate: false, sortOrder: 4 },
      { discom: 'tpnodl', title: 'Customer Agreement', canGenerate: true, sortOrder: 5 },
      { discom: 'tpnodl', title: 'Technical Feasibility Report', canGenerate: false, sortOrder: 6 },
      { discom: 'tpnodl', title: 'Application Form (Form-1)', canGenerate: true, sortOrder: 7 },
      { discom: 'tpnodl', title: 'DCR Certificate', canGenerate: false, sortOrder: 8 },
      { discom: 'tpnodl', title: 'GST Tax Invoice', canGenerate: true, sortOrder: 9 },
      { discom: 'tpnodl', title: 'Installation Photos', canGenerate: false, sortOrder: 10 },
      { discom: 'tpnodl', title: 'Site Survey Report', canGenerate: false, sortOrder: 11 },
      { discom: 'tpnodl', title: 'DISCOM Approval Letter', canGenerate: false, sortOrder: 12 },
      { discom: 'tpnodl', title: 'Net Meter Agreement', canGenerate: true, sortOrder: 13 },
      { discom: 'tpnodl', title: 'Joint Inspection Report', canGenerate: false, sortOrder: 14 },
      { discom: 'tpnodl', title: 'Geo Tag Photos', canGenerate: false, sortOrder: 15 },
      { discom: 'tpnodl', title: 'Inverter Datasheet', canGenerate: false, sortOrder: 16 },
      { discom: 'tpnodl', title: 'Panel Datasheet', canGenerate: false, sortOrder: 17 },
      { discom: 'tpnodl', title: 'Work Completion Certificate', canGenerate: true, sortOrder: 18 },
      // ── TPSODL ──
      { discom: 'tpsodl', title: 'Aadhaar Card', canGenerate: false, sortOrder: 1 },
      { discom: 'tpsodl', title: 'PAN Card', canGenerate: false, sortOrder: 2 },
      { discom: 'tpsodl', title: 'Bank Account Details', canGenerate: false, sortOrder: 3 },
      { discom: 'tpsodl', title: 'Electricity Bill', canGenerate: false, sortOrder: 4 },
      { discom: 'tpsodl', title: 'Customer Consent Form', canGenerate: true, sortOrder: 5 },
      { discom: 'tpsodl', title: 'Application Form', canGenerate: true, sortOrder: 6 },
      { discom: 'tpsodl', title: 'Site Survey Report', canGenerate: false, sortOrder: 7 },
      { discom: 'tpsodl', title: 'DCR Certificate', canGenerate: false, sortOrder: 8 },
      { discom: 'tpsodl', title: 'Technical Design Drawing (SLD)', canGenerate: false, sortOrder: 9 },
      { discom: 'tpsodl', title: 'DISCOM Portal Screenshot', canGenerate: false, sortOrder: 10 },
      { discom: 'tpsodl', title: 'Feasibility Report', canGenerate: false, sortOrder: 11 },
      { discom: 'tpsodl', title: 'Installation Completion Certificate', canGenerate: true, sortOrder: 12 },
      { discom: 'tpsodl', title: 'Net Meter Agreement', canGenerate: true, sortOrder: 13 },
      { discom: 'tpsodl', title: 'Commissioning Certificate', canGenerate: false, sortOrder: 14 },
      { discom: 'tpsodl', title: 'GST Invoice', canGenerate: true, sortOrder: 15 },
      { discom: 'tpsodl', title: 'Work Completion Certificate', canGenerate: true, sortOrder: 16 },
      { discom: 'tpsodl', title: 'Geo Tag Photos', canGenerate: false, sortOrder: 17 },
      // ── TPWODL ──
      { discom: 'tpwodl', title: 'Aadhaar & PAN Card', canGenerate: false, sortOrder: 1 },
      { discom: 'tpwodl', title: 'Bank Passbook Copy', canGenerate: false, sortOrder: 2 },
      { discom: 'tpwodl', title: 'Electricity Bill (Latest)', canGenerate: false, sortOrder: 3 },
      { discom: 'tpwodl', title: 'Customer Agreement', canGenerate: true, sortOrder: 4 },
      { discom: 'tpwodl', title: 'DCR Certificate', canGenerate: false, sortOrder: 5 },
      { discom: 'tpwodl', title: 'Technical Drawing (SLD)', canGenerate: false, sortOrder: 6 },
      { discom: 'tpwodl', title: 'Application Form', canGenerate: true, sortOrder: 7 },
      { discom: 'tpwodl', title: 'DISCOM Approval Letter', canGenerate: false, sortOrder: 8 },
      { discom: 'tpwodl', title: 'Site Survey Photos', canGenerate: false, sortOrder: 9 },
      { discom: 'tpwodl', title: 'Installation Photos', canGenerate: false, sortOrder: 10 },
      { discom: 'tpwodl', title: 'Joint Inspection Report', canGenerate: false, sortOrder: 11 },
      { discom: 'tpwodl', title: 'Net Meter Certificate', canGenerate: false, sortOrder: 12 },
      { discom: 'tpwodl', title: 'GST Tax Invoice', canGenerate: true, sortOrder: 13 },
      { discom: 'tpwodl', title: 'Work Completion Certificate', canGenerate: true, sortOrder: 14 },
      { discom: 'tpwodl', title: 'Commissioning Certificate', canGenerate: false, sortOrder: 15 },
      { discom: 'tpwodl', title: 'Warranty Cards', canGenerate: false, sortOrder: 16 },
    ];

    for (const item of docMasters) {
      await prisma.documentMaster.create({ data: item });
    }
    console.log(`   ✓ ${docMasters.length} document master items seeded`);
  }

  // ── 8. Demo: Solar Wiring Diagram uploaded for first TPCODL project ──
  const solarWiringMaster = await prisma.documentMaster.findFirst({
    where: { discom: 'tpcodl', title: 'Solar Wiring Diagram' },
  });
  const firstTpcodlProject = await prisma.applicant.findFirst({
    where: { discom: 'tpcodl' },
    orderBy: { createdAt: 'asc' },
  });
  if (solarWiringMaster && firstTpcodlProject) {
    const existingDemoDoc = await prisma.document.findFirst({
      where: { applicantId: firstTpcodlProject.id, masterItemId: solarWiringMaster.id },
    });
    if (!existingDemoDoc) {
      await prisma.document.create({
        data: {
          applicantId: firstTpcodlProject.id,
          masterItemId: solarWiringMaster.id,
          category: 'discom',
          docName: 'Solar Wiring Diagram',
          fileKey: null,
          fileName: 'Solar_Wiring_Diagram.pdf',
          fileSizeBytes: 312000,
          mimeType: 'application/pdf',
          status: 'uploaded',
          uploadedById: 'user-admin-001',
          uploadedAt: new Date(),
        },
      });
      console.log(`   ✓ Demo doc: Solar Wiring Diagram → ${firstTpcodlProject.applicantCode}`);
    }
  }

  // ── Summary ──
  console.log('\n✅ Seed completed successfully!');
  console.log('─────────────────────────────────');
  console.log(`   States:           ${states.length}`);
  console.log(`   Districts:        ${odishaDistricts.length}`);
  console.log(`   Companies:        1`);
  console.log(`   Admin users:      2`);
  console.log(`   Checklist items:  ${existingCount || totalItems}`);
  console.log('─────────────────────────────────');
  console.log('\n🔑 Default Login Credentials:');
  console.log('   Admin Email:    admin@suryamcrm.in / admin@123');
  console.log('   Super Admin:    superadmin@suryamcrm.in / superadmin@123\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
