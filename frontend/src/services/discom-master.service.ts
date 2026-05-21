import api from './api';
import type { DiscomMasterItem } from '@/types';

export const discomMasterService = {
  list: async (districtId?: string): Promise<{ data: DiscomMasterItem[] }> => {
    const { data } = await api.get('/discom-master', { params: districtId ? { districtId } : {} });
    return data;
  },

  listAll: async (): Promise<{ data: DiscomMasterItem[] }> => {
    const { data } = await api.get('/discom-master/all');
    return data;
  },

  create: async (body: { districtId?: string; code: string; name: string; fullform?: string; headquarters?: string; sortOrder?: number }): Promise<{ data: DiscomMasterItem }> => {
    const { data } = await api.post('/discom-master', body);
    return data;
  },

  update: async (id: string, body: Partial<{ districtId: string | null; code: string; name: string; fullform: string | null; headquarters: string | null; sortOrder: number; isActive: boolean }>): Promise<{ data: DiscomMasterItem }> => {
    const { data } = await api.patch(`/discom-master/${id}`, body);
    return data;
  },

  remove: async (id: string): Promise<{ id: string }> => {
    const { data } = await api.delete(`/discom-master/${id}`);
    return data;
  },
};
