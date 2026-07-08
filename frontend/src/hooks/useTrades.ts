import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tradesApi } from '../api/trades.api';
import { statsApi, goalsApi, aiApi } from '../api/stats.api';
import { patternsApi } from '../api/stats.api';
import { useUIStore } from '../store/ui.store';
import { useAccountStore } from '../store/account.store';
import { CreateTradePayload, TradeFilters } from '../types';

// ─── Query Keys ───────────────────────────────────────────────────────────────
export const tradeKeys = {
  all: ['trades'] as const,
  lists: (accountId?: string) => [...tradeKeys.all, 'list', accountId || ''] as const,
  list: (filters: TradeFilters, accountId?: string) => [...tradeKeys.lists(accountId), filters] as const,
  details: () => [...tradeKeys.all, 'detail'] as const,
  detail: (id: string) => [...tradeKeys.details(), id] as const,
  tags: (accountId?: string) => [...tradeKeys.all, 'tags', accountId || ''] as const,
  pairs: (accountId?: string) => [...tradeKeys.all, 'pairs', accountId || ''] as const,
};

export const statsKeys = {
  all: ['stats'] as const,
  dashboard: (period: string, accountId?: string) => [...statsKeys.all, 'dashboard', period, accountId || ''] as const,
  analytics: (start?: string, end?: string, accountId?: string) => [...statsKeys.all, 'analytics', start, end, accountId || ''] as const,
  calendar: (year: number, month: number, accountId?: string) => [...statsKeys.all, 'calendar', year, month, accountId || ''] as const,
  calendarDay: (date: string, accountId?: string) => [...statsKeys.all, 'calendarDay', date, accountId || ''] as const,
  discipline: (period: string, accountId?: string) => [...statsKeys.all, 'discipline', period, accountId || ''] as const,
};

export const goalKeys = {
  all: ['goals'] as const,
  recent: (accountId?: string) => [...goalKeys.all, 'recent', accountId || ''] as const,
  month: (month: string, accountId?: string) => [...goalKeys.all, month, accountId || ''] as const,
};

export const reviewKeys = {
  all: ['reviews'] as const,
  type: (type: string) => [...reviewKeys.all, type] as const,
  latest: (type: string) => [...reviewKeys.all, 'latest', type] as const,
};

// ─── Trade Hooks ──────────────────────────────────────────────────────────────
export const useTrades = (filters: TradeFilters = {}) => {
  const { activeAccount } = useAccountStore();
  const accountId = activeAccount?._id;
  return useQuery({
    queryKey: tradeKeys.list({ ...filters, accountId }, accountId),
    queryFn: () => tradesApi.getTrades({ ...filters, accountId }),
    staleTime: 1 * 60 * 1000,
  });
};

export const useTrade = (id: string) => {
  return useQuery({
    queryKey: tradeKeys.detail(id),
    queryFn: () => tradesApi.getTradeById(id),
    enabled: !!id,
  });
};

export const useCreateTrade = () => {
  const queryClient = useQueryClient();
  const { activeAccount } = useAccountStore();
  return useMutation({
    mutationFn: (data: CreateTradePayload) =>
      tradesApi.createTrade({ ...data, accountId: data.accountId || activeAccount?._id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tradeKeys.all });
      queryClient.invalidateQueries({ queryKey: statsKeys.all });
      useAccountStore.getState().fetchAccounts();
    },
  });
};

export const useUpdateTrade = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CreateTradePayload>) => tradesApi.updateTrade(id, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(tradeKeys.detail(id), updated);
      queryClient.invalidateQueries({ queryKey: tradeKeys.all });
      queryClient.invalidateQueries({ queryKey: statsKeys.all });
      useAccountStore.getState().fetchAccounts();
    },
  });
};

export const useDeleteTrade = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tradesApi.deleteTrade(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tradeKeys.all });
      queryClient.invalidateQueries({ queryKey: statsKeys.all });
      useAccountStore.getState().fetchAccounts();
    },
  });
};

export const useToggleFavorite = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tradesApi.toggleFavorite(id),
    onSuccess: (updated) => {
      queryClient.setQueryData(tradeKeys.detail(updated._id), updated);
      queryClient.invalidateQueries({ queryKey: tradeKeys.all });
    },
  });
};

export const useTags = () => {
  const { activeAccount } = useAccountStore();
  const accountId = activeAccount?._id;
  return useQuery({
    queryKey: tradeKeys.tags(accountId),
    queryFn: () => tradesApi.getTags(), // endpoint takes authorization, backend resolves accountId from token/resolve helper
    staleTime: 5 * 60 * 1000,
  });
};

export const usePairs = () => {
  const { activeAccount } = useAccountStore();
  const accountId = activeAccount?._id;
  return useQuery({
    queryKey: tradeKeys.pairs(accountId),
    queryFn: () => tradesApi.getPairs(), // endpoint takes authorization, backend resolves accountId
    staleTime: 5 * 60 * 1000,
  });
};

// ─── Stats Hooks ──────────────────────────────────────────────────────────────
export const useDashboard = () => {
  const { dashboardPeriod } = useUIStore();
  const { activeAccount } = useAccountStore();
  const accountId = activeAccount?._id;
  return useQuery({
    queryKey: statsKeys.dashboard(dashboardPeriod, accountId),
    queryFn: () => statsApi.getDashboard(dashboardPeriod, accountId),
    staleTime: 2 * 60 * 1000,
  });
};

export const useAnalytics = (startDate?: string, endDate?: string) => {
  const { activeAccount } = useAccountStore();
  const accountId = activeAccount?._id;
  return useQuery({
    queryKey: statsKeys.analytics(startDate, endDate, accountId),
    queryFn: () => statsApi.getAnalytics(startDate, endDate, accountId),
    staleTime: 3 * 60 * 1000,
  });
};

export const useCalendar = (year: number, month: number) => {
  const { activeAccount } = useAccountStore();
  const accountId = activeAccount?._id;
  return useQuery({
    queryKey: statsKeys.calendar(year, month, accountId),
    queryFn: () => statsApi.getCalendar(year, month, accountId),
    staleTime: 2 * 60 * 1000,
  });
};

export const useCalendarDay = (date: string) => {
  const { activeAccount } = useAccountStore();
  const accountId = activeAccount?._id;
  return useQuery({
    queryKey: statsKeys.calendarDay(date, accountId),
    queryFn: () => statsApi.getCalendarDay(date, accountId),
    enabled: !!date,
  });
};

export const useDisciplineScore = (period: 'week' | 'month' | 'all' = 'month') => {
  const { activeAccount } = useAccountStore();
  const accountId = activeAccount?._id;
  return useQuery({
    queryKey: statsKeys.discipline(period, accountId),
    queryFn: () => statsApi.getDisciplineScore(period, accountId),
    staleTime: 3 * 60 * 1000,
  });
};

// ─── Goals Hooks ──────────────────────────────────────────────────────────────
export const useRecentGoals = () => {
  const { activeAccount } = useAccountStore();
  const accountId = activeAccount?._id;
  return useQuery({
    queryKey: goalKeys.recent(accountId),
    queryFn: () => goalsApi.getRecentGoals(accountId),
    staleTime: 5 * 60 * 1000,
  });
};

export const useGoal = (month: string) => {
  const { activeAccount } = useAccountStore();
  const accountId = activeAccount?._id;
  return useQuery({
    queryKey: goalKeys.month(month, accountId),
    queryFn: () => goalsApi.getGoal(month, accountId),
    enabled: !!month,
    staleTime: 3 * 60 * 1000,
  });
};

export const useCreateGoal = () => {
  const queryClient = useQueryClient();
  const { activeAccount } = useAccountStore();
  return useMutation({
    mutationFn: (data: Parameters<typeof goalsApi.createOrUpdateGoal>[0]) =>
      goalsApi.createOrUpdateGoal({ ...data, accountId: data.accountId || activeAccount?._id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goalKeys.all });
    },
  });
};

export const useReviews = (type: 'weekly' | 'monthly', limit = 10, accountId?: string) => {
  return useQuery({
    queryKey: [...reviewKeys.type(type), limit, accountId || ''],
    queryFn: () => aiApi.getReviews(type, limit, accountId),
    staleTime: 10 * 60 * 1000,
  });
};

export const useLatestReview = (type: 'weekly' | 'monthly', accountId?: string) => {
  return useQuery({
    queryKey: [...reviewKeys.latest(type), accountId || ''],
    queryFn: () => aiApi.getLatestReview(type, accountId),
    staleTime: 10 * 60 * 1000,
  });
};

export const useGenerateWeeklyReview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (accountId?: string) => aiApi.generateWeeklyReview(accountId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.all });
    },
  });
};

export const useGenerateMonthlyReview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (accountId?: string) => aiApi.generateMonthlyReview(accountId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.all });
    },
  });
};

export const patternKeys = {
  all: ['patterns'] as const,
  days: (days: number) => [...patternKeys.all, days] as const,
};

export const usePatterns = (days = 30) => {
  return useQuery({
    queryKey: patternKeys.days(days),
    queryFn: () => patternsApi.getPatterns(days),
    staleTime: 5 * 60 * 1000,
  });
};
