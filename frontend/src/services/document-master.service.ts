import api from './api';
import type { DocumentMaster } from '@/types';

export const documentMasterService = {
  list: async (discom?: string): Promise<{ data: DocumentMaster[] }> => {
    const { data } = await api.get('/document-master', { params: discom ? { discom } : {} });
    return data;
  },

  create: async (body: { discom: string; title: string; docType?: string; sortOrder?: number }): Promise<{ data: DocumentMaster }> => {
    const { data } = await api.post('/document-master', body);
    return data;
  },

  update: async (id: string, body: { title?: string; docType?: string; sortOrder?: number; isActive?: boolean }): Promise<{ data: DocumentMaster }> => {
    const { data } = await api.patch(`/document-master/${id}`, body);
    return data;
  },

  remove: async (id: string): Promise<{ message: string }> => {
    const { data } = await api.delete(`/document-master/${id}`);
    return data;
  },

  uploadMasterFile: async (id: string, file: File): Promise<{ data: DocumentMaster }> => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post(`/document-master/${id}/file`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  getMasterFile: async (id: string): Promise<Blob> => {
    const { data } = await api.get(`/document-master/${id}/file`, { responseType: 'blob' });
    return data;
  },
};
