import axios, { AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { storage } from '../utils/storage';

import { Platform, NativeModules } from 'react-native';

// ── Backend URL config ───────────────────────────────────────────────────
const PROD_API_URL = 'https://tradenal.onrender.com/api';
const DEFAULT_LOCAL_IP = '192.168.1.100';
const LOCAL_PORT = 5000;

const getDevApiUrl = (): string => {
  try {
    const scriptURL: string = NativeModules?.SourceCode?.scriptURL || '';
    const match = scriptURL.match(/^https?:\/\/([^:/]+)/);
    if (match && match[1] && match[1] !== 'localhost') {
      return `http://${match[1]}:${LOCAL_PORT}/api`;
    }
  } catch {
    // fallback
  }
  return `http://${DEFAULT_LOCAL_IP}:${LOCAL_PORT}/api`;
};

export const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (typeof __DEV__ !== 'undefined' && __DEV__ ? getDevApiUrl() : PROD_API_URL);

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null): void => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token!);
  });
  failedQueue = [];
};

const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: BASE_URL,
    timeout: 60000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // ─── Request Interceptor: attach access token ───────────────────────────
  client.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      const token = await storage.getAccessToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // ─── Response Interceptor: handle 401 + token refresh ──────────────────
  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

      // Never intercept 401 on auth endpoints (login, register, refresh, forgot/reset-password)
      const isAuthEndpoint =
        originalRequest.url?.includes('/auth/login') ||
        originalRequest.url?.includes('/auth/register') ||
        originalRequest.url?.includes('/auth/refresh') ||
        originalRequest.url?.includes('/auth/forgot-password') ||
        originalRequest.url?.includes('/auth/reset-password');

      if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              if (originalRequest.headers) {
                (originalRequest.headers as Record<string, string>).Authorization = `Bearer ${token}`;
              }
              return client(originalRequest);
            })
            .catch((err) => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const refreshToken = await storage.getRefreshToken();
          if (!refreshToken) {
            processQueue(new Error('Session expired'), null);
            await storage.clearAll();
            return Promise.reject(new Error('Session expired. Please log in again.'));
          }

          const response = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
          const { accessToken, refreshToken: newRefreshToken } = response.data.data;

          await storage.setAccessToken(accessToken);
          await storage.setRefreshToken(newRefreshToken);

          processQueue(null, accessToken);

          if (originalRequest.headers) {
            (originalRequest.headers as Record<string, string>).Authorization = `Bearer ${accessToken}`;
          }

          return client(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          await storage.clearAll();
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      return Promise.reject(error);
    }
  );

  return client;
};

export const apiClient = createApiClient();

// Helper to extract error message from axios errors
export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return 'Request timed out. Please check if the backend server is running and reachable.';
    }
    if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
      return `Cannot reach server at ${BASE_URL}. Ensure your phone and computer are on the same Wi-Fi network and firewall allows port 5000.`;
    }
    const data = error.response?.data;
    if (Array.isArray(data?.errors) && data.errors.length > 0) {
      const first = data.errors[0];
      const field = first?.field ? `${first.field}: ` : '';
      const extra = data.errors.length > 1 ? ` (+${data.errors.length - 1} more)` : '';
      if (first?.message) return `${field}${first.message}${extra}`;
    }
    return data?.message || error.message || 'Something went wrong';
  }
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
};
