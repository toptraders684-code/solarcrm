import { z } from 'zod';

export const mobileSchema = z
  .string()
  .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number');

export const aadhaarSchema = z
  .string()
  .regex(/^\d{12}$/, 'Aadhaar must be 12 digits');

export const panSchema = z
  .string()
  .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format (e.g. AAAAB1234C)');

export const emailSchema = z
  .string()
  .email('Invalid email address')
  .optional()
  .or(z.literal(''));

export const pincodeSchema = z
  .string()
  .regex(/^\d{6}$/, 'Pincode must be 6 digits');

export const gstinSchema = z
  .string()
  .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GSTIN format');

export const ifscSchema = z
  .string()
  .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC format (e.g. AAAA0AAAAAA)');

export const bankAccountSchema = z
  .string()
  .regex(/^\d{8,17}$/, 'Bank account must be 8–17 digits');

export const capacitySchema = z
  .number()
  .min(1, 'Minimum 1 kW')
  .max(999.99, 'Maximum 999.99 kW');

export const latitudeSchema = z
  .number()
  .min(-90, 'Latitude must be between -90 and +90')
  .max(90, 'Latitude must be between -90 and +90');

export const longitudeSchema = z
  .number()
  .min(-180, 'Longitude must be between -180 and +180')
  .max(180, 'Longitude must be between -180 and +180');

export const ACCEPTED_FILE_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
export const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB

export function validateFile(file: File): string | null {
  if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
    return 'Only PDF, JPG, and PNG files are allowed';
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return 'File size must not exceed 2MB';
  }
  return null;
}

// Lead form schema
export const createLeadSchema = z.object({
  customerName: z.string().min(2, 'Name must be at least 2 characters'),
  mobile: mobileSchema,
  alternateMobile: z.string().regex(/^[6-9]\d{9}$/, 'Invalid mobile').optional().or(z.literal('')),
  email: emailSchema,
  addressVillage: z.string().min(2, 'Village/Area is required'),
  addressDistrictId: z.string().optional(),
  addressStateId: z.string().optional(),
  addressPincode: z.string().regex(/^\d{6}$/).optional().or(z.literal('')),
  discom: z.string().min(1, 'DISCOM is required'),
  projectType: z.string().min(1, 'Project type is required'),
  estimatedCapacityKw: z.number().positive().optional(),
  leadSource: z.string().min(1, 'Lead source is required'),
  financePreference: z.string().optional(),
  assignedStaffId: z.string().min(1, 'Assigned staff is required'),
  followUpDate: z.string().optional(),
});

export type CreateLeadFormData = z.infer<typeof createLeadSchema>;
