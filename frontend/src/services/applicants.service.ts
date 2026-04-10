import api from './api';
import type { Applicant, PaginatedResponse, Document, Transaction, TransactionSummary, ApplicantChecklist } from '@/types';

export interface ApplicantFilters {
  page?: number;
  limit?: number;
  stage?: number;
  discom?: string;
  assignedStaffId?: string;
  search?: string;
}

export const applicantsService = {
  getApplicants: async (filters: ApplicantFilters = {}): Promise<PaginatedResponse<Applicant>> => {
    const { data } = await api.get('/applicants', { params: filters });
    return data;
  },

  getApplicant: async (id: string): Promise<{ data: Applicant }> => {
    const { data } = await api.get(`/applicants/${id}`);
    return data;
  },

  updateApplicant: async (id: string, dto: Partial<Applicant>): Promise<{ data: Applicant }> => {
    const { data } = await api.patch(`/applicants/${id}`, dto);
    return data;
  },

  advanceStage: async (id: string): Promise<{ data: Applicant }> => {
    const { data } = await api.post(`/applicants/${id}/advance-stage`);
    return data;
  },

  getDocuments: async (id: string): Promise<{ data: Document[] }> => {
    const { data } = await api.get(`/applicants/${id}/documents`);
    return data;
  },

  uploadDocument: async (id: string, file: File, docName: string, category: string): Promise<{ data: Document }> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('docName', docName);
    formData.append('category', category);
    const { data } = await api.post(`/applicants/${id}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  downloadDocument: async (applicantId: string, docId: string): Promise<Blob> => {
    const { data } = await api.get(`/applicants/${applicantId}/documents/${docId}`, {
      responseType: 'blob',
    });
    return data;
  },

  generateUploadLink: async (id: string): Promise<{ link: string; token: string; expiresAt: string }> => {
    const { data } = await api.post(`/applicants/${id}/upload-link`);
    return data;
  },

  getChecklist: async (id: string, discom?: string, projectType?: string): Promise<{ data: ApplicantChecklist[] }> => {
    const { data } = await api.get(`/applicants/${id}/checklist`, {
      params: { discom, projectType },
    });
    return data;
  },

  updateChecklistItem: async (
    id: string,
    itemId: string,
    dto: { isCompleted: boolean; notes?: string }
  ): Promise<{ data: ApplicantChecklist }> => {
    const { data } = await api.patch(`/applicants/${id}/checklist/${itemId}`, dto);
    return data;
  },

  getTransactions: async (id: string): Promise<{ data: Transaction[]; summary: TransactionSummary }> => {
    const { data } = await api.get(`/applicants/${id}/transactions`);
    return data;
  },

  assignVendor: async (id: string, vendorId: string, categoryLabel?: string, isPrimary?: boolean) => {
    const { data } = await api.post(`/applicants/${id}/vendors`, { vendorId, categoryLabel, isPrimary });
    return data;
  },

  removeVendor: async (id: string, vendorId: string) => {
    const { data } = await api.post(`/applicants/${id}/vendors/${vendorId}/remove`);
    return data;
  },
};
