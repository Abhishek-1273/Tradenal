import { apiClient } from './client';
import {
  AuthResponse,
  AuthTokens,
  User,
  UserSettings,
  ApiResponse,
} from '../types';

export const authApi = {
  register: async (data: {
    name: string;
    email: string;
    password: string;
  }): Promise<AuthResponse> => {
    const res = await apiClient.post<ApiResponse<AuthResponse>>('/auth/register', data);
    return res.data.data!;
  },

  login: async (data: {
    email: string;
    password: string;
  }): Promise<AuthResponse> => {
    const res = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', data);
    return res.data.data!;
  },

  logout: async (refreshToken: string): Promise<void> => {
    await apiClient.post('/auth/logout', { refreshToken });
  },

  refreshToken: async (refreshToken: string): Promise<AuthTokens> => {
    const res = await apiClient.post<ApiResponse<AuthTokens>>('/auth/refresh', { refreshToken });
    return res.data.data!;
  },

  forgotPassword: async (email: string): Promise<void> => {
    await apiClient.post('/auth/forgot-password', { email });
  },

  resetPassword: async (data: {
    token: string;
    password: string;
  }): Promise<void> => {
    await apiClient.post('/auth/reset-password', data);
  },

  changePassword: async (data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<void> => {
    await apiClient.patch('/auth/change-password', data);
  },

  getMe: async (): Promise<User> => {
    const res = await apiClient.get<ApiResponse<User>>('/auth/me');
    return res.data.data!;
  },

  updateSettings: async (settings: Partial<UserSettings>): Promise<User> => {
    const res = await apiClient.patch<ApiResponse<User>>('/auth/settings', settings);
    return res.data.data!;
  },

  deleteAccount: async (password: string): Promise<void> => {
    await apiClient.delete('/auth/account', { data: { password } });
  },
};
