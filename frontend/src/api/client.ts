import axios, { AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { storage } from '../utils/storage';

// Change to your backend URL
const BASE_URL = __DEV__
  ? 'http://192.168.1.100:5000/api'
  : 'https://your-production-api.com/api';

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
    timeout: 15000,
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

      if (error.response?.status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
          // Queue the request until refresh completes
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
          if (!refreshToken) throw new Error('No refresh token');

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
          // Clear storage and let the auth store handle logout
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
    const data = error.response?.data;
    // Prefer specific field-level validation errors over the generic
    // "Validation failed" message so the user knows exactly what's wrong.
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
