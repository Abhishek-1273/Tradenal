import { apiClient } from './client';
import {
  DashboardData,
  AnalyticsData,
  CalendarDay,
  TradeStats,
  ApiResponse,
  Goal,
  GoalWithProgress,
  Review,
} from '../types';

// ─── Stats API ────────────────────────────────────────────────────────────────
export const statsApi = {
  getDashboard: async (
    period: 'today' | 'week' | 'month' | 'all' = 'month',
    accountId?: string
  ): Promise<DashboardData> => {
    const res = await apiClient.get<ApiResponse<DashboardData>>('/stats/dashboard', {
      params: { period, accountId },
    });
    return res.data.data!;
  },

  getAnalytics: async (startDate?: string, endDate?: string, accountId?: string): Promise<AnalyticsData> => {
    const res = await apiClient.get<ApiResponse<AnalyticsData>>('/stats/analytics', {
      params: { startDate, endDate, accountId },
    });
    return res.data.data!;
  },

  getCalendar: async (
    year: number,
    month: number,
    accountId?: string
  ): Promise<{ calendar: CalendarDay[]; month: string }> => {
    const res = await apiClient.get<ApiResponse<{ calendar: CalendarDay[]; month: string }>>(
      '/stats/calendar',
      { params: { year, month, accountId } }
    );
    return res.data.data!;
  },

  getCalendarDay: async (date: string, accountId?: string): Promise<{ date: string; trades: any[]; stats: TradeStats }> => {
    const res = await apiClient.get<ApiResponse<any>>(`/stats/calendar/${date}`, {
      params: { accountId },
    });
    return res.data.data!;
  },

  getDisciplineScore: async (period: 'week' | 'month' | 'all' = 'month', accountId?: string) => {
    const res = await apiClient.get<ApiResponse<any>>('/stats/discipline', {
      params: { period, accountId },
    });
    return res.data.data!;
  },
};

// ─── Goals API ────────────────────────────────────────────────────────────────
export const goalsApi = {
  getRecentGoals: async (accountId?: string): Promise<GoalWithProgress[]> => {
    const res = await apiClient.get<ApiResponse<GoalWithProgress[]>>('/goals', {
      params: { accountId },
    });
    return res.data.data || [];
  },

  getGoal: async (month: string, accountId?: string): Promise<GoalWithProgress | null> => {
    const res = await apiClient.get<ApiResponse<GoalWithProgress | null>>(`/goals/${month}`, {
      params: { accountId },
    });
    return res.data.data || null;
  },

  createOrUpdateGoal: async (data: Partial<Goal> & { month: string; accountId?: string }): Promise<Goal> => {
    const res = await apiClient.post<ApiResponse<Goal>>('/goals', data);
    return res.data.data!;
  },

  deleteGoal: async (month: string, accountId?: string): Promise<void> => {
    await apiClient.delete(`/goals/${month}`, {
      params: { accountId },
    });
  },
};

// ─── AI API ───────────────────────────────────────────────────────────────────
export const aiApi = {
  getReviews: async (type: 'weekly' | 'monthly', limit = 10, accountId?: string): Promise<Review[]> => {
    const res = await apiClient.get<ApiResponse<Review[]>>('/ai/reviews', {
      params: { type, limit, accountId },
    });
    return res.data.data || [];
  },

  getLatestReview: async (type: 'weekly' | 'monthly', accountId?: string): Promise<Review | null> => {
    const res = await apiClient.get<ApiResponse<Review | null>>(`/ai/reviews/${type}`, {
      params: { accountId },
    });
    return res.data.data || null;
  },

  generateWeeklyReview: async (accountId?: string): Promise<Review> => {
    const res = await apiClient.post<ApiResponse<Review>>('/ai/generate/weekly', { accountId }, { timeout: 90000 });
    return res.data.data!;
  },

  generateMonthlyReview: async (accountId?: string): Promise<Review> => {
    const res = await apiClient.post<ApiResponse<Review>>('/ai/generate/monthly', { accountId }, { timeout: 90000 });
    return res.data.data!;
  },
};

// ─── Export API ───────────────────────────────────────────────────────────────
export const exportApi = {
  getCSVUrl: (params: Record<string, string> = {}): string => {
    const query = new URLSearchParams(params).toString();
    return `${apiClient.defaults.baseURL}/export/csv${query ? `?${query}` : ''}`;
  },

  getJSONUrl: (params: Record<string, string> = {}): string => {
    const query = new URLSearchParams(params).toString();
    return `${apiClient.defaults.baseURL}/export/json${query ? `?${query}` : ''}`;
  },
};

// ─── AI Patterns API ──────────────────────────────────────────────────────────
export const patternsApi = {
  getPatterns: async (days = 30): Promise<any[]> => {
    const res = await apiClient.get<ApiResponse<any[]>>('/ai/patterns', { params: { days } });
    return res.data.data || [];
  },
};
