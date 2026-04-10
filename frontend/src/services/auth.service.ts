import api from './api';
import type { LoginResponse } from '@/types';

export const authService = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const { data } = await api.post('/auth/login', { email, password });
    return data;
  },

  requestOtp: async (mobile: string): Promise<void> => {
    await api.post('/auth/request-otp', { mobile });
  },

  verifyOtp: async (mobile: string, otp: string): Promise<LoginResponse> => {
    const { data } = await api.post('/auth/verify-otp', { mobile, otp });
    return data;
  },

  refresh: async (refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> => {
    const { data } = await api.post('/auth/refresh', { refreshToken });
    return data;
  },

  logout: async (): Promise<void> => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      try {
        await api.post('/auth/logout', { refreshToken });
      } catch {
        // ignore errors on logout
      }
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },
};
