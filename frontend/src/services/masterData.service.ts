import api from './api';

export type MasterType = 'discoms' | 'lead-sources' | 'vendor-types' | 'payment-methods' | 'project-types';

export const masterDataService = {
  list: async (type: MasterType | 'stages', activeOnly = false) => {
    if (type === 'stages') {
      const { data } = await api.get('/master-data/stages/list', { params: activeOnly ? { activeOnly: 'true' } : {} });
      return data;
    }
    const { data } = await api.get(`/master-data/${type}`, { params: activeOnly ? { activeOnly: 'true' } : {} });
    return data;
  },
  create: async (type: MasterType, item: { name: string; code: string; sortOrder?: number }) => {
    const { data } = await api.post(`/master-data/${type}`, item);
    return data;
  },
  createStage: async (item: { stageNumber: number; name: string; description?: string }) => {
    const { data } = await api.post('/master-data/stages/create', item);
    return data;
  },
  update: async (type: MasterType, id: string, item: Partial<{ name: string; code: string; isActive: boolean; sortOrder: number }>) => {
    const { data } = await api.patch(`/master-data/${type}/${id}`, item);
    return data;
  },
  updateStage: async (id: string, item: Partial<{ name: string; description: string; isActive: boolean }>) => {
    const { data } = await api.patch(`/master-data/stages/${id}`, item);
    return data;
  },
  delete: async (type: MasterType, id: string) => {
    const { data } = await api.delete(`/master-data/${type}/${id}`);
    return data;
  },
};
