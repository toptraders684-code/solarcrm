import api from './api';
import type { Transaction, PaginatedResponse } from '@/types';

export interface TransactionFilters {
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
  applicantId?: string;
  vendorId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface CreateTransactionDto {
  applicantId: string;
  type: string;
  amount: number;
  paymentMethod: string;
  transactionDate: string;
  description?: string;
  referenceNumber?: string;
  vendorId?: string;
}

export const financeService = {
  getTransactions: async (filters: TransactionFilters = {}): Promise<PaginatedResponse<Transaction>> => {
    const { data } = await api.get('/finance/transactions', { params: filters });
    return data;
  },

  createTransaction: async (dto: CreateTransactionDto): Promise<{ data: Transaction }> => {
    const { data } = await api.post('/finance/transactions', dto);
    return data;
  },

  approveTransaction: async (id: string): Promise<{ data: Transaction }> => {
    const { data } = await api.post(`/finance/transactions/${id}/approve`);
    return data;
  },

  rejectTransaction: async (id: string, reason: string): Promise<{ data: Transaction }> => {
    const { data } = await api.post(`/finance/transactions/${id}/reject`, { reason });
    return data;
  },

  getSummary: async (): Promise<{ data: any }> => {
    const { data } = await api.get('/finance/summary');
    return data;
  },
};
