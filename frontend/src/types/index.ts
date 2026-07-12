// ─────────────────────────────────────────────
// ENUMS (matching Prisma schema)
// ─────────────────────────────────────────────

export type UserRole = 'admin' | 'operations_staff' | 'field_technician' | 'finance_manager' | 'vendor' | 'super_admin';
export type UserStatus = 'pending_approval' | 'active' | 'inactive';
export type Discom = 'tpcodl' | 'tpnodl' | 'tpsodl' | 'tpwodl';
export type ProjectType = 'residential' | 'commercial';
export type LeadSource = 'walk_in' | 'referral' | 'online' | 'camp' | 'channel_partner' | 'other';
export type FinancePreference = 'self' | 'govt_bank' | 'private_bank';
export type LeadStatus = 'new' | 'in_progress' | 'converted' | 'closed';
export type LeadClosureReason = 'not_interested' | 'no_roof_space' | 'financial_issue' | 'competitor' | 'unreachable' | 'other';
export type DocumentCategory = 'kyc' | 'technical' | 'discom';
export type TransactionType = 'customer_receipt' | 'vendor_payment' | 'subsidy' | 'expense';
export type PaymentMethod = 'cash' | 'cheque' | 'bank_transfer' | 'upi' | 'other';
export type TransactionStatus = 'pending_approval' | 'approved' | 'rejected';
export type VendorType = 'channel_partner' | 'district_partner' | 'block_partner' | 'installation_partner' | 'transport_partner' | 'insurance_partner' | 'netmeter_partner';
export type OutcomeType = 'contacted' | 'not_reachable' | 'meeting_scheduled' | 'site_visit_done' | 'document_collected' | 'other';
export type CommissionStructureType = 'per_kw' | 'percentage' | 'fixed_per_project' | 'slab_based';
export type PayableStatus = 'draft' | 'approved' | 'paid';

// ─────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────

export interface AuthUser {
  id: string;
  name: string;
  email?: string;
  role: UserRole;
  status: UserStatus;
  companyId: string;
  vendorId?: string;
  vendorLevel?: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

// ─────────────────────────────────────────────
// MASTER
// ─────────────────────────────────────────────

export interface MasterState {
  id: string;
  name: string;
  code: string;
}

export interface MasterDistrict {
  id: string;
  name: string;
  stateId: string;
  state: MasterState;
}

// ─────────────────────────────────────────────
// USERS
// ─────────────────────────────────────────────

export interface User {
  id: string;
  companyId: string;
  name: string;
  mobile: string;
  email?: string;
  role: UserRole;
  vendorLevel?: string;
  vendorId?: string;
  parentVendorUserId?: string;
  status: UserStatus;
  createdAt: string;
}

// ─────────────────────────────────────────────
// LEADS
// ─────────────────────────────────────────────

export interface Lead {
  id: string;
  leadCode: string;
  customerName: string;
  mobile: string;
  alternateMobile?: string;
  email?: string;
  addressVillage: string;
  addressDistrictId?: string;
  addressStateId?: string;
  addressPincode?: string;
  discom: Discom;
  projectType: ProjectType;
  estimatedCapacityKw?: number;
  leadSource: LeadSource;
  financePreference?: FinancePreference;
  assignedStaffId: string;
  assignedStaff?: { id: string; name: string };
  channelPartnerId?: string;
  channelPartner?: { id: string; businessName: string };
  status: LeadStatus;
  closureReason?: LeadClosureReason;
  followUpDate?: string;
  convertedApplicantId?: string;
  createdAt: string;
  followups?: LeadFollowup[];
}

export interface LeadFollowup {
  id: string;
  leadId: string;
  notes?: string;
  followUpDate?: string;
  outcomeType: OutcomeType;
  createdById: string;
  createdBy?: { id: string; name: string };
  createdAt: string;
}

export interface CreateLeadDto {
  customerName: string;
  mobile: string;
  alternateMobile?: string;
  email?: string;
  addressVillage: string;
  addressDistrictId?: string;
  addressStateId?: string;
  addressPincode?: string;
  discom: Discom;
  projectType: ProjectType;
  estimatedCapacityKw?: number;
  leadSource: LeadSource;
  financePreference?: FinancePreference;
  assignedStaffId: string;
  followUpDate?: string;
}

// ─────────────────────────────────────────────
// APPLICANTS
// ─────────────────────────────────────────────

export interface Applicant {
  id: string;
  applicantCode: string;
  discomRefNo?: string;
  leadId: string;
  assignedStaffId: string;
  assignedStaff?: { id: string; name: string };
  customerName: string;
  stage: number;
  stageUpdatedAt?: string;
  projectStatus?: string;

  // Personal
  customerProfession?: string;
  dateOfBirth?: string;
  gender?: string;
  email?: string;
  alternateMobile?: string;
  whatsappNumber?: string;
  mobileToken?: string;
  panToken?: string;
  aadhaarToken?: string;
  signatureFileKey?: string;

  // Address
  addressHouse?: string;
  addressStreet?: string;
  addressVillage?: string;
  addressGp?: string;
  addressBlock?: string;
  addressDistrictId?: string;
  addressDistrict?: MasterDistrict;
  addressStateId?: string;
  addressState?: MasterState;
  addressPincode?: string;
  gpsLatitude?: number;
  gpsLongitude?: number;

  // Bank Details
  bankNameInAccount?: string;
  bankBranchName?: string;
  bankAccountNumber?: string;
  bankIfscCode?: string;
  coApplicantName?: string;
  coApplicantRelationship?: string;
  coApplicantMobile?: string;
  coApplicantOccupation?: string;

  // Area Details
  areaHouseNo?: string;
  areaRoofSizeSqft?: number;
  areaNoOfFloors?: number;
  areaRoofType?: string;
  areaHouseHeight?: string;

  // Electricity Details
  aadhaarNameSameAsBillName?: boolean;
  aadhaarMobileSameAsBillMobile?: boolean;
  aadhaarNameSameAsBankDetails?: boolean;

  // Installation
  discom: Discom;
  projectType: ProjectType;
  systemCapacityKw?: number;
  roofType?: string;
  sanctionedLoadKw?: number;
  existingConsumerNo?: string;

  // Finance / Invoice
  contractAmount?: number;
  invoiceNo?: string;
  solarRate?: number;
  solarGst?: number;
  installationRate?: number;
  installationGst?: number;
  financeMode?: FinancePreference;
  bankName?: string;
  loanAmount?: number;
  loanSanctionedDate?: string;
  overpaymentRule: 'warn' | 'block';

  // Survey
  surveyDate?: string;
  surveyedBy?: string;
  roofAreaSqft?: number;
  shadowAnalysis?: string;
  recommendedCapacityKw?: number;

  // DISCOM
  portalApplicationDate?: string;
  // DISCOM Details
  mnreApplicationNo?: string;
  discomApplicationNo?: string;
  mnreSubmitDate?: string;
  discomDivision?: string;
  discomSubDivision?: string;
  discomSection?: string;
  discomContactPerson?: string;
  discomMobileNo?: string;
  jeName?: string;
  jeContact?: string;
  mrtDate?: string;
  inspectionDate?: string;
  inspectionResult?: string;
  netMeterSerialNo?: string;

  // Consent
  consentGiven?: boolean;
  consentGivenAt?: string;

  createdAt: string;
  documents?: Document[];
  checklists?: ApplicantChecklist[];
  transactions?: Transaction[];
  applicantVendors?: ApplicantVendor[];
  activities?: ProjectActivity[];
  installationDetails?: InstallationDetails;
  otherMaterials?: OtherMaterial[];
}

export interface InstallationDetails {
  id: string;
  applicantId: string;
  // A. Dispatch
  dispatchNo?: string;
  dispatchDate?: string;
  dispatchCustomerMobileNo?: string;
  vehicleNo?: string;
  driverMobileNo?: string;
  // B. Solar Panel
  panelBrand?: string;
  panelCellManufacturer?: string;
  panelTypeOfModule?: string;
  panelCapacityPerModule?: number;
  panelQty?: number;
  panelTotalCapacityKw?: number;
  panelModelType?: string;
  panelSerial1?: string;
  panelSerial2?: string;
  panelSerial3?: string;
  panelSerial4?: string;
  panelSerial5?: string;
  panelSerial6?: string;
  // C. Inverter
  inverterBrand?: string;
  inverterCapacityKw?: number;
  inverterSerialNo?: string;
  inverterQty?: number;
  inverterModelNo?: string;
  inverterInputVoltage?: string;
  inverterOutputVoltage?: string;
  // D. Structure
  structureGiType?: string;
  structureLegRafter?: string;
  structurePerlin?: string;
  structureNutBoltClampBox?: string;
  // E. ACDB / DCDB
  acdbModel?: string;
  acdbSpecs?: string;
  acdbBrand?: string;
  dcdbModel?: string;
  dcdbSpecs?: string;
  dcdbBrand?: string;
  // F. Earthing Kit
  earthingLightningArrestor?: string;
  earthingChemicalBag?: string;
  earthingNutBolt?: string;
  earthingPitCover?: string;
  earthingRod?: string;
  // G. PVC / Wires
  wireMc4Connector?: string;
  wireEarthingCable?: string;
  wirePvcCableTray?: string;
  wirePvcConduitPipe?: string;
  wirePvcElbow?: string;
  wireCClip?: string;
  wireT?: string;
  wireFlexibleCoil?: string;
  wireCableTie?: string;
  wireBlackTape?: string;
  wire16mmEarthingCable?: string;
  wireDcCable4sqmm?: string;
  wireAcCableCopper?: string;
  // Postinstallation
  dcrCertificateNo?: string;
}

export interface ProjectStatusHistory {
  id: string;
  applicantId: string;
  status: string;
  changedById: string;
  changedBy?: { id: string; name: string };
  changedAt: string;
}

export interface OtherMaterial {
  id: string;
  applicantId: string;
  itemNo: number;
  item: string;
  size?: string;
  lengthQty?: string;
  make?: string;
  createdAt?: string;
}

export type ProjectActivityType =
  | 'note'
  | 'customer_contacted'
  | 'site_visit'
  | 'document_collected'
  | 'payment_received'
  | 'material_delivered'
  | 'installation_update'
  | 'inspection_done'
  | 'other';

export interface ProjectActivity {
  id: string;
  applicantId: string;
  activityType: ProjectActivityType;
  notes?: string;
  followUpDate?: string;
  createdById: string;
  createdBy?: { id: string; name: string };
  createdAt: string;
}

export interface ApplicantVendor {
  id: string;
  applicantId: string;
  vendorId: string;
  vendor: Vendor;
  categoryLabel?: string;
  isPrimary: boolean;
  assignedAt: string;
}

export interface ApplicantChecklist {
  id: string;
  applicantId: string;
  masterItemId: string;
  masterItem?: {
    id: string;
    phaseName: string;
    phaseOrder: number;
    itemText: string;
    itemOrder: number;
    isMandatory: boolean;
  };
  isCompleted: boolean;
  completedById?: string;
  completedAt?: string;
  notes?: string;
}

// ─────────────────────────────────────────────
// DOCUMENTS
// ─────────────────────────────────────────────

export type DocType = 'upload' | 'generate' | 'view';

export interface DiscomMasterItem {
  id: string;
  districtId?: string | null;
  district?: { id: string; name: string; state?: { id: string; name: string } } | null;
  name: string;
  code: string;
  fullform?: string | null;
  headquarters?: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface DocumentMaster {
  id: string;
  discom?: Discom | null;
  title: string;
  docType: DocType;
  sortOrder: number;
  isActive: boolean;
  isCommon?: boolean;
  masterFilePath?: string;
  masterFileMime?: string;
  createdAt: string;
}

export interface Document {
  id: string;
  applicantId: string;
  masterItemId?: string;
  category: DocumentCategory;
  docName: string;
  fileKey?: string;
  fileName?: string;
  fileSizeBytes?: number;
  mimeType?: string;
  status: 'pending' | 'uploaded' | 'needs_reupload';
  rejectionReason?: string;
  uploadedById?: string;
  uploadedBy?: { id: string; name: string };
  uploadedAt?: string;
  createdAt: string;
}

// ─────────────────────────────────────────────
// TRANSACTIONS
// ─────────────────────────────────────────────

export interface Transaction {
  id: string;
  applicantId: string;
  applicant?: { id: string; applicantCode: string; customerName: string };
  type: TransactionType;
  amount: number;
  paymentMethod: PaymentMethod;
  transactionDate: string;
  description?: string;
  referenceNumber?: string;
  status: TransactionStatus;
  approvedById?: string;
  approvedAt?: string;
  rejectionReason?: string;
  vendorId?: string;
  vendor?: { id: string; businessName: string };
  createdById: string;
  createdBy?: { id: string; name: string };
  createdAt: string;
}

export interface TransactionSummary {
  totalContract: number;
  totalReceived: number;
  balanceDue: number;
  totalSubsidy: number;
  totalVendorPayments: number;
  totalExpenses?: number;
}

// ─────────────────────────────────────────────
// VENDORS
// ─────────────────────────────────────────────

export interface Vendor {
  id: string;
  companyId: string;
  businessName: string;
  contactPerson?: string;
  mobile?: string;
  email?: string;
  addressVillage?: string;
  addressDistrict?: string;
  addressState?: string;
  addressPincode?: string;
  vendorTypes: VendorType[];
  gstin?: string;
  ifscCode?: string;
  empanelmentDate?: string;
  isActive: boolean;
  createdAt: string;
}

// ─────────────────────────────────────────────
// PAGINATION
// ─────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  data: T;
}

// ─────────────────────────────────────────────
// ENUMS DATA (from /master/enums)
// ─────────────────────────────────────────────

export interface MasterEnums {
  userRoles: string[];
  userStatuses: string[];
  discoms: string[];
  projectTypes: string[];
  leadSources: string[];
  financePreferences: string[];
  leadStatuses: string[];
  leadClosureReasons: string[];
  documentCategories: string[];
  transactionTypes: string[];
  paymentMethods: string[];
  transactionStatuses: string[];
  vendorTypes: string[];
  outcomeTypes: string[];
}

// ─────────────────────────────────────────────
// DASHBOARD STATS
// ─────────────────────────────────────────────

export interface DashboardStats {
  totalLeads: number;
  activeApplicants: number;
  pendingApprovals: number;
  monthlyRevenue: number;
  leadsThisMonth: number;
  conversionRate: number;
  stageWiseCount: Record<string, number>;
}

// ─────────────────────────────────────────────
// COMMISSION MODULE
// ─────────────────────────────────────────────

export interface ConfigSchemaField {
  key: string;
  label: string;
  type: 'number' | 'text' | 'slab_table';
  required: boolean;
}

export interface CommissionStructure {
  id: string;
  name: string;
  structureType: CommissionStructureType;
  configSchema: ConfigSchemaField[];
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { assignments: number };
}

export interface VendorCommissionConfig {
  id: string;
  assignmentId: string;
  configKey: string;
  configValue: string;
}

export interface VendorCommissionAssignment {
  id: string;
  companyId: string;
  vendorId: string;
  vendor?: { id: string; businessName: string; contactPerson?: string };
  employeeId?: string;
  employee?: { id: string; name: string; vendorLevel?: string };
  commissionStructureId: string;
  commissionStructure?: CommissionStructure;
  effectiveFrom: string;
  isActive: boolean;
  createdAt: string;
  configs: VendorCommissionConfig[];
}

export interface PayableIncentive {
  id: string;
  payableId: string;
  type: string;
  amount: number;
  note?: string;
  createdAt: string;
}

export interface EmployeePayable {
  id: string;
  companyId: string;
  vendorId: string;
  vendor?: { id: string; businessName: string };
  employeeId: string;
  employee?: { id: string; name: string; vendorLevel?: string; mobile?: string };
  assignmentId: string;
  assignment?: VendorCommissionAssignment & {
    commissionStructure?: { name: string; structureType: CommissionStructureType };
  };
  month: number;
  year: number;
  salaryAmount: number;
  commissionAmount: number;
  incentiveAmount: number;
  totalPayable: number;
  projectCount: number;
  totalKw: number;
  status: PayableStatus;
  notes?: string;
  generatedAt: string;
  approvedAt?: string;
  approvedBy?: { id: string; name: string };
  incentives: PayableIncentive[];
}
