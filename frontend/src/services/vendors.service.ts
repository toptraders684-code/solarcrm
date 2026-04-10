import api from './api';
import type { Vendor, PaginatedResponse } from '@/types';

export interface VendorFilters {
  page?: number;
  limit?: number;
  vendorType?: string;
  search?: string;
  isActive?: boolean;
}

export interface CreateVendorDto {
  businessName: string;
  contactPerson?: string;
  mobile?: string;
  email?: string;
  addressVillage?: string;
  addressDistrict?: string;
  addressState?: string;
  addressPincode?: string;
  vendorTypes: string[];
  gstin?: string;
  ifscCode?: string;
  empanelmentDate?: string;
}

export const vendorsService = {
  getVendors: async (filters: VendorFilters = {}): Promise<PaginatedResponse<Vendor>> => {
    const { data } = await api.get('/vendors', { params: filters });
    return data;
  },

  getVendor: async (id: string): Promise<{ data: Vendor }> => {
    const { data } = await api.get(`/vendors/${id}`);
    return data;
  },

  createVendor: async (dto: CreateVendorDto): Promise<{ data: Vendor }> => {
    const { data } = await api.post('/vendors', dto);
    return data;
  },

  updateVendor: async (id: string, dto: Partial<CreateVendorDto>): Promise<{ data: Vendor }> => {
    const { data } = await api.patch(`/vendors/${id}`, dto);
    return data;
  },

  deactivateVendor: async (id: string): Promise<void> => {
    await api.delete(`/vendors/${id}`);
  },
};
