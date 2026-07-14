import axios, { AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { storage } from '../utils/storage';

// ── Backend URL config ───────────────────────────────────────────────────
// USE_LOCAL = true  → local backend at LOCAL_IP:LOCAL_PORT
// USE_LOCAL = false → Render-hosted backend
const USE_LOCAL = false;

const LOCAL_IP = '192.168.1.105';
const LOCAL_PORT = 5000;

export const BASE_URL = USE_LOCAL
  ? `http://${LOCAL_IP}:${LOCAL_PORT}/api`
  : 'https://tradenal.onrender.com/api';

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

      if (error.response?.status === 401 && !originalRequest._retry) {
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
