import api from './api';
import type { User, PaginatedResponse } from '@/types';

export interface CreateUserDto {
  name: string;
  mobile: string;
  email?: string;
  password: string;
  role: string;
}

export interface CreateVendorUserDto {
  name: string;
  mobile: string;
  email?: string;
  password: string;
  vendorLevel: 'H1' | 'H2' | 'H3';
  vendorId?: string;
  parentVendorUserId?: string;
}

export const usersService = {
  getUsers: async (params: { page?: number; limit?: number; role?: string; status?: string } = {}): Promise<PaginatedResponse<User>> => {
    const { data } = await api.get('/users', { params });
    return data;
  },

  getUser: async (id: string): Promise<{ data: User }> => {
    const { data } = await api.get(`/users/${id}`);
    return data;
  },

  createUser: async (dto: CreateUserDto): Promise<{ data: User }> => {
    const { data } = await api.post('/users', dto);
    return data;
  },

  updateUser: async (id: string, dto: Partial<CreateUserDto & { status: string }>): Promise<{ data: User }> => {
    const { data } = await api.patch(`/users/${id}`, dto);
    return data;
  },

  approveUser: async (id: string): Promise<{ data: User }> => {
    const { data } = await api.post(`/users/${id}/approve`);
    return data;
  },

  deleteUser: async (id: string): Promise<{ message: string }> => {
    const { data } = await api.delete(`/users/${id}`);
    return data;
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<{ message: string }> => {
    const { data } = await api.patch('/users/me/password', { currentPassword, newPassword });
    return data;
  },

  getStaff: async (): Promise<{ data: User[] }> => {
    const { data } = await api.get('/users/staff');
    return data;
  },

  createVendorUser: async (dto: CreateVendorUserDto): Promise<{ data: User }> => {
    const { data } = await api.post('/users/vendor-team', dto);
    return data;
  },

  getVendorTeam: async (vendorId?: string): Promise<{ data: User[] }> => {
    const { data } = await api.get('/users/vendor-team', { params: vendorId ? { vendorId } : {} });
    return data;
  },
};
