import api from './api';
import type { VendorCommissionAssignment, EmployeePayable, PayableIncentive } from '@/types';

export const vendorCommissionService = {
  // Assignments
  getAssignments: async (): Promise<{ data: VendorCommissionAssignment[] }> => {
    const { data } = await api.get('/vendor-commission/assignments');
    return data;
  },

  getAssignment: async (id: string): Promise<{ data: VendorCommissionAssignment }> => {
    const { data } = await api.get(`/vendor-commission/assignments/${id}`);
    return data;
  },

  createAssignment: async (dto: {
    employeeId: string;
    commissionStructureId: string;
    effectiveFrom: string;
  }): Promise<{ data: VendorCommissionAssignment }> => {
    const { data } = await api.post('/vendor-commission/assignments', dto);
    return data;
  },

  toggleAssignment: async (id: string): Promise<{ data: VendorCommissionAssignment }> => {
    const { data } = await api.patch(`/vendor-commission/assignments/${id}/toggle`);
    return data;
  },

  saveConfig: async (
    assignmentId: string,
    configs: { configKey: string; configValue: string }[],
  ): Promise<{ success: boolean }> => {
    const { data } = await api.post(`/vendor-commission/assignments/${assignmentId}/config`, { configs });
    return data;
  },

  // Payables
  generatePayables: async (dto: {
    employeeId: string;
    month: number;
    year: number;
  }): Promise<{ data: EmployeePayable; count: number }> => {
    const { data } = await api.post('/vendor-commission/payables/generate', dto);
    return data;
  },

  getPayables: async (filters?: {
    vendorId?: string;
    month?: number;
    year?: number;
    status?: string;
  }): Promise<{ data: EmployeePayable[] }> => {
    const { data } = await api.get('/vendor-commission/payables', { params: filters });
    return data;
  },

  getPayable: async (id: string): Promise<{ data: EmployeePayable }> => {
    const { data } = await api.get(`/vendor-commission/payables/${id}`);
    return data;
  },

  approvePayable: async (id: string): Promise<{ data: EmployeePayable }> => {
    const { data } = await api.patch(`/vendor-commission/payables/${id}/approve`);
    return data;
  },

  updateSalary: async (id: string, salaryAmount: number): Promise<{ data: EmployeePayable }> => {
    const { data } = await api.patch(`/vendor-commission/payables/${id}/salary`, { salaryAmount });
    return data;
  },

  addIncentive: async (
    payableId: string,
    dto: { type: string; amount: number; note?: string },
  ): Promise<{ data: PayableIncentive }> => {
    const { data } = await api.post(`/vendor-commission/payables/${payableId}/incentives`, dto);
    return data;
  },

  removeIncentive: async (payableId: string, incentiveId: string): Promise<void> => {
    await api.delete(`/vendor-commission/payables/${payableId}/incentives/${incentiveId}`);
  },
};
