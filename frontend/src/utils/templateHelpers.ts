import { generateHTML } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';
import { TextAlign } from '@tiptap/extension-text-align';
import { TextStyle, FontSize } from '@tiptap/extension-text-style';
import { Underline } from '@tiptap/extension-underline';
import { Color } from '@tiptap/extension-color';
import { Image } from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { PlaceholderNode } from '@/components/template/PlaceholderNode';
import type { Applicant } from '@/types';

function fmt(val: any): string {
  if (val === null || val === undefined) return '';
  if (val instanceof Date) return val.toLocaleDateString('en-IN');
  return String(val);
}

function fmtDate(val: any): string {
  if (!val) return '';
  try { return new Date(val).toLocaleDateString('en-IN'); } catch { return fmt(val); }
}

function fmtAmount(val: any): string {
  if (!val) return '';
  const n = Number(val);
  return isNaN(n) ? '' : n.toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

export function buildPlaceholderValues(applicant: Applicant): Record<string, string> {
  const inst = applicant.installationDetails;
  const address = [
    applicant.addressHouse,
    applicant.addressStreet,
    applicant.addressVillage,
    (applicant.addressDistrict as any)?.name ?? applicant.addressDistrictId,
    (applicant.addressState as any)?.name ?? applicant.addressStateId,
    applicant.addressPincode,
  ].filter(Boolean).join(', ');

  const subsidyTotal = (applicant.transactions ?? [])
    .filter((t: any) => t.type === 'subsidy' && t.status === 'approved')
    .reduce((s: number, t: any) => s + Number(t.amount), 0);
  const contractAmt = Number(applicant.contractAmount ?? 0);

  return {
    applicant_code: fmt(applicant.applicantCode),
    customer_name: fmt(applicant.customerName),
    mobile: fmt((applicant as any).mobile),
    alternate_mobile: fmt(applicant.alternateMobile),
    email: fmt(applicant.email),
    date_of_birth: fmtDate(applicant.dateOfBirth),
    gender: fmt(applicant.gender),
    discom: applicant.discom?.toUpperCase() ?? '',
    project_type: fmt(applicant.projectType),
    stage: fmt(applicant.stage),
    project_status: fmt(applicant.projectStatus),
    existing_consumer_no: fmt(applicant.existingConsumerNo),
    discom_ref_no: fmt(applicant.discomRefNo),
    created_at: fmtDate(applicant.createdAt),
    address_house: fmt(applicant.addressHouse),
    address_street: fmt(applicant.addressStreet),
    address_village: fmt(applicant.addressVillage),
    address_district: fmt((applicant.addressDistrict as any)?.name ?? applicant.addressDistrictId),
    address_state: fmt((applicant.addressState as any)?.name ?? applicant.addressStateId),
    address_pincode: fmt(applicant.addressPincode),
    full_address: address,
    gps_latitude: fmt(applicant.gpsLatitude),
    gps_longitude: fmt(applicant.gpsLongitude),
    system_capacity_kw: fmt(applicant.systemCapacityKw),
    sanctioned_load_kw: fmt(applicant.sanctionedLoadKw),
    roof_type: fmt(applicant.roofType),
    roof_area_sqft: fmt(applicant.roofAreaSqft),
    contract_amount: fmtAmount(applicant.contractAmount),
    finance_mode: fmt(applicant.financeMode),
    bank_name: fmt(applicant.bankName),
    loan_amount: fmtAmount(applicant.loanAmount),
    loan_sanctioned_date: fmtDate(applicant.loanSanctionedDate),
    subsidy_total: fmtAmount(subsidyTotal),
    balance_due: fmtAmount(contractAmt > 0 ? contractAmt - subsidyTotal : 0),
    survey_date: fmtDate(applicant.surveyDate),
    surveyed_by: fmt(applicant.surveyedBy),
    recommended_capacity_kw: fmt(applicant.recommendedCapacityKw),
    shadow_analysis: fmt(applicant.shadowAnalysis),
    portal_application_date: fmtDate(applicant.portalApplicationDate),
    je_name: fmt(applicant.jeName),
    je_contact: fmt(applicant.jeContact),
    mrt_date: fmtDate(applicant.mrtDate),
    inspection_date: fmtDate(applicant.inspectionDate),
    inspection_result: fmt(applicant.inspectionResult),
    net_meter_serial_no: fmt(applicant.netMeterSerialNo),
    dispatch_no: fmt(inst?.dispatchNo),
    dispatch_date: fmtDate(inst?.dispatchDate),
    panel_brand: fmt(inst?.panelBrand),
    panel_cell_manufacturer: fmt(inst?.panelCellManufacturer),
    panel_type_of_module: fmt(inst?.panelTypeOfModule),
    panel_capacity_per_module: fmt(inst?.panelCapacityPerModule),
    panel_qty: fmt(inst?.panelQty),
    panel_total_capacity_kw: fmt(inst?.panelTotalCapacityKw),
    panel_model_type: fmt(inst?.panelModelType),
    panel_serial_1: fmt(inst?.panelSerial1),
    panel_serial_2: fmt(inst?.panelSerial2),
    panel_serial_3: fmt(inst?.panelSerial3),
    panel_serial_4: fmt(inst?.panelSerial4),
    panel_serial_5: fmt(inst?.panelSerial5),
    panel_serial_6: fmt(inst?.panelSerial6),
    inverter_brand: fmt(inst?.inverterBrand),
    inverter_capacity_kw: fmt(inst?.inverterCapacityKw),
    inverter_serial_no: fmt(inst?.inverterSerialNo),
    inverter_qty: fmt(inst?.inverterQty),
    inverter_model_no: fmt(inst?.inverterModelNo),
    assigned_staff_name: fmt((applicant.assignedStaff as any)?.name),
    assigned_staff_mobile: fmt((applicant.assignedStaff as any)?.mobile),
    assigned_staff_email: fmt((applicant.assignedStaff as any)?.email),
    company_name: fmt((applicant as any)?.company?.name),
  };
}

const TIPTAP_EXTENSIONS = [
  StarterKit,
  TextAlign.configure({ types: ['heading', 'paragraph'] }),
  TextStyle,
  FontSize,
  Underline,
  Color,
  Image,
  Table.configure({ resizable: false }),
  TableRow,
  TableCell,
  TableHeader,
  PlaceholderNode,
];

export function templateJsonToHtml(json: any): string {
  if (!json) return '';
  return generateHTML(json, TIPTAP_EXTENSIONS);
}

export function fillTemplate(json: any, values: Record<string, string>): string {
  let html = templateJsonToHtml(json);
  // Replace placeholder spans with actual values
  html = html.replace(
    /<span[^>]*data-type="placeholder"[^>]*data-field="([^"]+)"[^>]*>.*?<\/span>/g,
    (_, field) => `<span>${values[field] ?? ''}</span>`,
  );
  return html;
}
