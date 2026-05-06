import api from './api';

export const companiesService = {
  getAll: async () => {
    const { data } = await api.get('/companies');
    return data;
  },
  create: async (dto: {
    companyName: string;
    adminName: string;
    adminMobile: string;
    adminEmail?: string;
    adminPassword: string;
  }) => {
    const { data } = await api.post('/companies', dto);
    return data;
  },
  updateStatus: async (id: string, status: string) => {
    const { data } = await api.patch(`/companies/${id}/status`, { status });
    return data;
  },
  update: async (id: string, body: { name?: string }) => {
    const { data } = await api.patch(`/companies/${id}`, body);
    return data;
  },
};
