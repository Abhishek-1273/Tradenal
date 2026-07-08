import { apiClient } from './client';
import { Account, CreateAccountPayload, ApiResponse } from '../types';

export const accountsApi = {
  getAccounts: async (): Promise<Account[]> => {
    const res = await apiClient.get<ApiResponse<Account[]>>('/accounts');
    return res.data.data || [];
  },

  getDefaultAccount: async (): Promise<Account | null> => {
    const res = await apiClient.get<ApiResponse<Account | null>>('/accounts/default');
    return res.data.data || null;
  },

  createAccount: async (data: CreateAccountPayload): Promise<Account> => {
    const res = await apiClient.post<ApiResponse<Account>>('/accounts', data);
    return res.data.data!;
  },

  getAccountById: async (id: string): Promise<Account> => {
    const res = await apiClient.get<ApiResponse<Account>>(`/accounts/${id}`);
    return res.data.data!;
  },

  updateAccount: async (id: string, data: Partial<CreateAccountPayload> & { status?: string }): Promise<Account> => {
    const res = await apiClient.put<ApiResponse<Account>>(`/accounts/${id}`, data);
    return res.data.data!;
  },

  setDefaultAccount: async (id: string): Promise<Account> => {
    const res = await apiClient.patch<ApiResponse<Account>>(`/accounts/${id}/default`);
    return res.data.data!;
  },

  deleteAccount: async (id: string): Promise<void> => {
    await apiClient.delete(`/accounts/${id}`);
  },
};
