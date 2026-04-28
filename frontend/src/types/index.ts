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
export type TransactionType = 'customer_receipt' | 'vendor_payment' | 'subsidy';
export type PaymentMethod = 'cash' | 'cheque' | 'bank_transfer' | 'upi' | 'other';
export type TransactionStatus = 'pending_approval' | 'approved' | 'rejected';
export type VendorType = 'material_supplier' | 'labour_installer' | 'transport_logistics';
export type OutcomeType = 'contacted' | 'not_reachable' | 'meeting_scheduled' | 'site_visit_done' | 'document_collected' | 'other';

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

  // Personal
  dateOfBirth?: string;
  gender?: string;
  email?: string;
  alternateMobile?: string;
  whatsappNumber?: string;

  // Address
  addressHouse?: string;
  addressStreet?: string;
  addressVillage?: string;
  addressDistrictId?: string;
  addressDistrict?: MasterDistrict;
  addressStateId?: string;
  addressState?: MasterState;
  addressPincode?: string;
  gpsLatitude?: number;
  gpsLongitude?: number;

  // Installation
  discom: Discom;
  projectType: ProjectType;
  systemCapacityKw?: number;
  roofType?: string;
  sanctionedLoadKw?: number;
  existingConsumerNo?: string;

  // Finance
  contractAmount?: number;
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

export interface DocumentMaster {
  id: string;
  discom: Discom;
  title: string;
  docType: DocType;
  sortOrder: number;
  isActive: boolean;
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
  status: 'pending' | 'uploaded';
  uploadedById?: string;
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
