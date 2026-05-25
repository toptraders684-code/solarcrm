import api from './api';
import type { CommissionStructure } from '@/types';

export const commissionStructuresService = {
  getAll: async (): Promise<{ data: CommissionStructure[] }> => {
    const { data } = await api.get('/commission-structures');
    return data;
  },

  getOne: async (id: string): Promise<{ data: CommissionStructure }> => {
    const { data } = await api.get(`/commission-structures/${id}`);
    return data;
  },

  create: async (dto: {
    name: string;
    structureType: string;
    configSchema: object[];
    description?: string;
  }): Promise<{ data: CommissionStructure }> => {
    const { data } = await api.post('/commission-structures', dto);
    return data;
  },

  update: async (id: string, dto: Partial<{
    name: string;
    configSchema: object[];
    description?: string;
  }>): Promise<{ data: CommissionStructure }> => {
    const { data } = await api.patch(`/commission-structures/${id}`, dto);
    return data;
  },

  toggle: async (id: string): Promise<{ data: CommissionStructure }> => {
    const { data } = await api.patch(`/commission-structures/${id}/toggle`);
    return data;
  },
};
