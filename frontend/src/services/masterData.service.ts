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
  create: async (type: MasterType, item: { name: string; code: string; sortOrder?: number; fullform?: string; headquarters?: string }) => {
    const { data } = await api.post(`/master-data/${type}`, item);
    return data;
  },
  createStage: async (item: { stageNumber: number; name: string; description?: string }) => {
    const { data } = await api.post('/master-data/stages/create', item);
    return data;
  },
  update: async (type: MasterType, id: string, item: Partial<{ name: string; code: string; isActive: boolean; sortOrder: number; fullform: string; headquarters: string }>) => {
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

  // States
  listStates: async () => {
    const { data } = await api.get('/master-data/states/list');
    return data;
  },
  createState: async (body: { name: string; code: string }) => {
    const { data } = await api.post('/master-data/states/create', body);
    return data;
  },
  updateState: async (id: string, body: { name?: string; code?: string }) => {
    const { data } = await api.patch(`/master-data/states/${id}`, body);
    return data;
  },
  deleteState: async (id: string) => {
    const { data } = await api.delete(`/master-data/states/${id}`);
    return data;
  },

  // Headquarters
  listHq: async (activeOnly = false) => {
    const { data } = await api.get('/master-data/hq/list', { params: activeOnly ? { activeOnly: 'true' } : {} });
    return data;
  },
  createHq: async (body: { name: string }) => {
    const { data } = await api.post('/master-data/hq/create', body);
    return data;
  },
  updateHq: async (id: string, body: { name?: string; isActive?: boolean }) => {
    const { data } = await api.patch(`/master-data/hq/${id}`, body);
    return data;
  },

  // Districts
  listDistricts: async () => {
    const { data } = await api.get('/master-data/districts/list');
    return data;
  },
  createDistrict: async (body: { name: string; stateId: string }) => {
    const { data } = await api.post('/master-data/districts/create', body);
    return data;
  },
  updateDistrict: async (id: string, body: { name?: string; stateId?: string }) => {
    const { data } = await api.patch(`/master-data/districts/${id}`, body);
    return data;
  },
  deleteDistrict: async (id: string) => {
    const { data } = await api.delete(`/master-data/districts/${id}`);
    return data;
  },
};
