import api from './api';
import type { MasterState, MasterDistrict, MasterEnums } from '@/types';

export const masterService = {
  getStates: async (): Promise<{ data: MasterState[] }> => {
    const { data } = await api.get('/master/states');
    return data;
  },

  getDistricts: async (stateId?: string): Promise<{ data: MasterDistrict[] }> => {
    const { data } = await api.get('/master/districts', { params: stateId ? { stateId } : {} });
    return data;
  },

  getEnums: async (): Promise<MasterEnums> => {
    const { data } = await api.get('/master/enums');
    return data;
  },
};
