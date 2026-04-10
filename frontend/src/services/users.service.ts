import api from './api';
import type { User, PaginatedResponse } from '@/types';

export interface CreateUserDto {
  name: string;
  mobile: string;
  email?: string;
  password: string;
  role: string;
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

  getStaff: async (): Promise<{ data: User[] }> => {
    const { data } = await api.get('/users/staff');
    return data;
  },
};
