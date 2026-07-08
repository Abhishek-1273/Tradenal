import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TradeFilters } from '../types';

interface UIState {
  isDarkMode: boolean;
  dashboardPeriod: 'today' | 'week' | 'month' | 'all';
  tradeFilters: TradeFilters;
  isOffline: boolean;

  // Actions
  setDarkMode: (isDark: boolean) => Promise<void>;
  setDashboardPeriod: (period: 'today' | 'week' | 'month' | 'all') => void;
  setTradeFilters: (filters: Partial<TradeFilters>) => void;
  resetTradeFilters: () => void;
  setOffline: (offline: boolean) => void;
  initTheme: () => Promise<void>;
}

const defaultFilters: TradeFilters = {
  page: 1,
  limit: 20,
  sortBy: 'tradeDate',
  sortOrder: 'desc',
};

export const useUIStore = create<UIState>((set, get) => ({
  isDarkMode: true,
  dashboardPeriod: 'today',
  tradeFilters: defaultFilters,
  isOffline: false,

  initTheme: async () => {
    try {
      const stored = await AsyncStorage.getItem('tj_theme');
      if (stored !== null) {
        set({ isDarkMode: stored === 'dark' });
      }
    } catch { }
  },

  setDarkMode: async (isDark: boolean) => {
    set({ isDarkMode: isDark });
    try {
      await AsyncStorage.setItem('tj_theme', isDark ? 'dark' : 'light');
    } catch { }
  },

  setDashboardPeriod: (period) => set({ dashboardPeriod: period }),

  setTradeFilters: (filters) =>
    set((state) => ({
      tradeFilters: { ...state.tradeFilters, ...filters, page: 1 },
    })),

  resetTradeFilters: () => set({ tradeFilters: defaultFilters }),

  setOffline: (offline) => set({ isOffline: offline }),
}));
