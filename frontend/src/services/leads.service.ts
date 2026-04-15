import api from './api';
import type { Lead, CreateLeadDto, PaginatedResponse, LeadFollowup } from '@/types';

export interface LeadFilters {
  page?: number;
  limit?: number;
  status?: string;
  discom?: string;
  assignedStaffId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export const leadsService = {
  getLeads: async (filters: LeadFilters = {}): Promise<PaginatedResponse<Lead>> => {
    const { data } = await api.get('/leads', { params: filters });
    return data;
  },

  getLead: async (id: string): Promise<{ data: Lead }> => {
    const { data } = await api.get(`/leads/${id}`);
    return data;
  },

  createLead: async (dto: CreateLeadDto): Promise<{ data: Lead }> => {
    const { data } = await api.post('/leads', dto);
    return data;
  },

  updateLead: async (id: string, dto: Partial<CreateLeadDto>): Promise<{ data: Lead }> => {
    const { data } = await api.patch(`/leads/${id}`, dto);
    return data;
  },

  closeLead: async (id: string, reason: string, notes?: string): Promise<{ data: Lead }> => {
    const { data } = await api.post(`/leads/${id}/close`, { reason, notes });
    return data;
  },

  convertLead: async (id: string): Promise<{ data: any }> => {
    const { data } = await api.post(`/leads/${id}/convert`);
    return data;
  },

  addFollowup: async (
    id: string,
    dto: { outcomeType: string; notes?: string; followUpDate?: string }
  ): Promise<{ data: LeadFollowup }> => {
    const { data } = await api.post(`/leads/${id}/followups`, dto);
    return data;
  },

  bulkUpload: async (
    file: File,
  ): Promise<{ created: number; failed: { row: number; name: string; reason: string }[]; total: number }> => {
    const form = new FormData();
    form.append('file', file);
    const { data } = await api.post('/leads/bulk-upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
};
