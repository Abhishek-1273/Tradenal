import { apiClient } from './client';
import {
  Trade,
  CreateTradePayload,
  TradeFilters,
  ApiResponse,
} from '../types';

export const tradesApi = {
  getTrades: async (
    filters: TradeFilters = {}
  ): Promise<{ trades: Trade[]; total: number; page: number; totalPages: number }> => {
    const res = await apiClient.get<ApiResponse<Trade[]>>('/trades', { params: filters });
    return {
      trades: res.data.data || [],
      total: res.data.meta?.total || 0,
      page: res.data.meta?.page || 1,
      totalPages: res.data.meta?.totalPages || 1,
    };
  },

  getTradeById: async (id: string): Promise<Trade> => {
    const res = await apiClient.get<ApiResponse<Trade>>(`/trades/${id}`);
    return res.data.data!;
  },

  createTrade: async (data: CreateTradePayload): Promise<Trade> => {
    const res = await apiClient.post<ApiResponse<Trade>>('/trades', data);
    return res.data.data!;
  },

  updateTrade: async (id: string, data: Partial<CreateTradePayload>): Promise<Trade> => {
    const res = await apiClient.put<ApiResponse<Trade>>(`/trades/${id}`, data);
    return res.data.data!;
  },

  deleteTrade: async (id: string): Promise<void> => {
    await apiClient.delete(`/trades/${id}`);
  },

  uploadScreenshots: async (
    tradeId: string,
    files: { uri: string; name: string; type: string }[],
    types: string[]
  ): Promise<Trade> => {
    const formData = new FormData();
    files.forEach((file, i) => {
      formData.append('screenshots', {
        uri: file.uri,
        name: file.name,
        type: file.type,
      } as any);
      formData.append('types', types[i] || 'before');
    });

    const res = await apiClient.post<ApiResponse<Trade>>(
      `/trades/${tradeId}/screenshots`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return res.data.data!;
  },

  deleteScreenshot: async (tradeId: string, publicId: string): Promise<Trade> => {
    const encodedId = encodeURIComponent(publicId);
    const res = await apiClient.delete<ApiResponse<Trade>>(
      `/trades/${tradeId}/screenshots/${encodedId}`
    );
    return res.data.data!;
  },

  toggleFavorite: async (id: string): Promise<Trade> => {
    const res = await apiClient.patch<ApiResponse<Trade>>(`/trades/${id}/favorite`);
    return res.data.data!;
  },

  getTags: async (): Promise<string[]> => {
    const res = await apiClient.get<ApiResponse<string[]>>('/trades/tags');
    return res.data.data || [];
  },

  getPairs: async (): Promise<string[]> => {
    const res = await apiClient.get<ApiResponse<string[]>>('/trades/pairs');
    return res.data.data || [];
  },
};
