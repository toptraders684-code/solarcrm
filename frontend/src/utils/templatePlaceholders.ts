export interface PlaceholderField {
  key: string;
  label: string;
}

export interface PlaceholderGroup {
  label: string;
  fields: PlaceholderField[];
}

export const PLACEHOLDER_GROUPS: PlaceholderGroup[] = [
  {
    label: 'Applicant Info',
    fields: [
      { key: 'applicant_code', label: 'Applicant Code' },
      { key: 'customer_name', label: 'Customer Name' },
      { key: 'mobile', label: 'Mobile' },
      { key: 'alternate_mobile', label: 'Alternate Mobile' },
      { key: 'email', label: 'Email' },
      { key: 'date_of_birth', label: 'Date of Birth' },
      { key: 'gender', label: 'Gender' },
      { key: 'discom', label: 'DISCOM' },
      { key: 'project_type', label: 'Project Type' },
      { key: 'stage', label: 'Stage' },
      { key: 'project_status', label: 'Project Status' },
      { key: 'existing_consumer_no', label: 'Consumer No.' },
      { key: 'discom_ref_no', label: 'DISCOM Ref No.' },
      { key: 'created_at', label: 'Created Date' },
    ],
  },
  {
    label: 'Address',
    fields: [
      { key: 'address_house', label: 'House No.' },
      { key: 'address_street', label: 'Street' },
      { key: 'address_village', label: 'Village' },
      { key: 'address_district', label: 'District' },
      { key: 'address_state', label: 'State' },
      { key: 'address_pincode', label: 'Pincode' },
      { key: 'full_address', label: 'Full Address' },
      { key: 'gps_latitude', label: 'GPS Latitude' },
      { key: 'gps_longitude', label: 'GPS Longitude' },
    ],
  },
  {
    label: 'Technical',
    fields: [
      { key: 'system_capacity_kw', label: 'System Capacity (kW)' },
      { key: 'sanctioned_load_kw', label: 'Sanctioned Load (kW)' },
      { key: 'roof_type', label: 'Roof Type' },
      { key: 'roof_area_sqft', label: 'Roof Area (sqft)' },
    ],
  },
  {
    label: 'Finance',
    fields: [
      { key: 'contract_amount', label: 'Contract Amount' },
      { key: 'finance_mode', label: 'Finance Mode' },
      { key: 'bank_name', label: 'Bank Name' },
      { key: 'loan_amount', label: 'Loan Amount' },
      { key: 'loan_sanctioned_date', label: 'Loan Sanctioned Date' },
      { key: 'subsidy_total', label: 'Total Subsidy' },
      { key: 'balance_due', label: 'Balance Due' },
    ],
  },
  {
    label: 'Survey',
    fields: [
      { key: 'survey_date', label: 'Survey Date' },
      { key: 'surveyed_by', label: 'Surveyed By' },
      { key: 'recommended_capacity_kw', label: 'Recommended Capacity (kW)' },
      { key: 'shadow_analysis', label: 'Shadow Analysis' },
    ],
  },
  {
    label: 'DISCOM Details',
    fields: [
      { key: 'portal_application_date', label: 'Portal Application Date' },
      { key: 'je_name', label: 'JE Name' },
      { key: 'je_contact', label: 'JE Contact' },
      { key: 'mrt_date', label: 'MRT Date' },
      { key: 'inspection_date', label: 'Inspection Date' },
      { key: 'inspection_result', label: 'Inspection Result' },
      { key: 'net_meter_serial_no', label: 'Net Meter Serial No.' },
    ],
  },
  {
    label: 'Installation',
    fields: [
      { key: 'dispatch_no', label: 'Dispatch No.' },
      { key: 'dispatch_date', label: 'Dispatch Date' },
      { key: 'panel_brand', label: 'Panel Brand' },
      { key: 'panel_cell_manufacturer', label: 'Panel Cell Manufacturer' },
      { key: 'panel_type_of_module', label: 'Panel Module Type' },
      { key: 'panel_capacity_per_module', label: 'Panel Capacity/Module' },
      { key: 'panel_qty', label: 'Panel Qty' },
      { key: 'panel_total_capacity_kw', label: 'Panel Total Capacity (kW)' },
      { key: 'panel_model_type', label: 'Panel Model Type' },
      { key: 'panel_serial_1', label: 'Panel Serial 1' },
      { key: 'panel_serial_2', label: 'Panel Serial 2' },
      { key: 'panel_serial_3', label: 'Panel Serial 3' },
      { key: 'panel_serial_4', label: 'Panel Serial 4' },
      { key: 'panel_serial_5', label: 'Panel Serial 5' },
      { key: 'panel_serial_6', label: 'Panel Serial 6' },
      { key: 'inverter_brand', label: 'Inverter Brand' },
      { key: 'inverter_capacity_kw', label: 'Inverter Capacity (kW)' },
      { key: 'inverter_serial_no', label: 'Inverter Serial No.' },
      { key: 'inverter_qty', label: 'Inverter Qty' },
      { key: 'inverter_model_no', label: 'Inverter Model No.' },
    ],
  },
  {
    label: 'Assigned Staff',
    fields: [
      { key: 'assigned_staff_name', label: 'Staff Name' },
      { key: 'assigned_staff_mobile', label: 'Staff Mobile' },
      { key: 'assigned_staff_email', label: 'Staff Email' },
    ],
  },
  {
    label: 'Company',
    fields: [
      { key: 'company_name', label: 'Company Name' },
    ],
  },
];

export const ALL_PLACEHOLDERS: PlaceholderField[] = PLACEHOLDER_GROUPS.flatMap((g) => g.fields);
