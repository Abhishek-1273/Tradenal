import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Account, CreateAccountPayload } from '../types';
import { accountsApi } from '../api/accounts.api';

const SELECTED_ACCOUNT_KEY = 'tj_selected_account_id';
const CACHED_ACCOUNTS_KEY = 'tj_cached_accounts_list';

interface AccountState {
  accounts: Account[];
  activeAccount: Account | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchAccounts: () => Promise<void>;
  setActiveAccount: (account: Account) => Promise<void>;
  createAccount: (payload: CreateAccountPayload) => Promise<Account>;
  updateAccount: (id: string, payload: Partial<CreateAccountPayload> & { status?: string }) => Promise<Account>;
  setDefaultAccount: (id: string) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  clearAccountState: () => void;
}

export const useAccountStore = create<AccountState>((set, get) => ({
  accounts: [],
  activeAccount: null,
  isLoading: false,
  error: null,

  fetchAccounts: async () => {
    // Instant cache hydration if memory is empty
    if (get().accounts.length === 0) {
      try {
        const [cached, savedId] = await Promise.all([
          AsyncStorage.getItem(CACHED_ACCOUNTS_KEY),
          AsyncStorage.getItem(SELECTED_ACCOUNT_KEY),
        ]);
        if (cached) {
          const parsed: Account[] = JSON.parse(cached);
          let active = savedId ? parsed.find((a) => a._id === savedId) : null;
          if (!active && parsed.length > 0) active = parsed.find((a) => a.isDefault) || parsed[0];
          set({ accounts: parsed, activeAccount: active });
        }
      } catch { /* ignore */ }
    }

    try {
      const accounts = await accountsApi.getAccounts();
      const savedAccountId = await AsyncStorage.getItem(SELECTED_ACCOUNT_KEY);

      let active = null;
      if (savedAccountId) {
        active = accounts.find((a) => a._id === savedAccountId) || null;
      }

      if (!active && accounts.length > 0) {
        // Fall back to default account, or the first account
        active = accounts.find((a) => a.isDefault) || accounts[0];
      }

      set({ accounts, activeAccount: active, isLoading: false });

      await Promise.all([
        AsyncStorage.setItem(CACHED_ACCOUNTS_KEY, JSON.stringify(accounts)),
        active ? AsyncStorage.setItem(SELECTED_ACCOUNT_KEY, active._id) : Promise.resolve(),
      ]);
    } catch (err: any) {
      set({ isLoading: false, error: err?.message || 'Failed to fetch accounts' });
    }
  },

  setActiveAccount: async (account: Account) => {
    set({ activeAccount: account });
    await AsyncStorage.setItem(SELECTED_ACCOUNT_KEY, account._id);
  },

  createAccount: async (payload: CreateAccountPayload) => {
    set({ isLoading: true, error: null });
    try {
      const newAccount = await accountsApi.createAccount(payload);
      // Refresh list
      const accounts = await accountsApi.getAccounts();
      
      // If it's the first/only account, or default, set as active
      let active = get().activeAccount;
      if (!active || newAccount.isDefault || accounts.length === 1) {
        active = newAccount;
        await AsyncStorage.setItem(SELECTED_ACCOUNT_KEY, newAccount._id);
      }

      set({ accounts, activeAccount: active, isLoading: false });
      return newAccount;
    } catch (err: any) {
      set({ isLoading: false, error: err?.message || 'Failed to create account' });
      throw err;
    }
  },

  updateAccount: async (id: string, payload: Partial<CreateAccountPayload> & { status?: string }) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await accountsApi.updateAccount(id, payload);
      const accounts = await accountsApi.getAccounts();
      
      let active = get().activeAccount;
      if (active && active._id === id) {
        active = updated;
      }

      set({ accounts, activeAccount: active, isLoading: false });
      return updated;
    } catch (err: any) {
      set({ isLoading: false, error: err?.message || 'Failed to update account' });
      throw err;
    }
  },

  setDefaultAccount: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await accountsApi.setDefaultAccount(id);
      const accounts = await accountsApi.getAccounts();
      const active = accounts.find((a) => a._id === id) || get().activeAccount;

      set({ accounts, activeAccount: active, isLoading: false });
      if (active) {
        await AsyncStorage.setItem(SELECTED_ACCOUNT_KEY, active._id);
      }
    } catch (err: any) {
      set({ isLoading: false, error: err?.message || 'Failed to set default account' });
      throw err;
    }
  },

  deleteAccount: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await accountsApi.deleteAccount(id);
      const accounts = await accountsApi.getAccounts();

      let active = get().activeAccount;
      if (active && active._id === id) {
        // Fall back to new default or first account
        active = accounts.find((a) => a.isDefault) || accounts[0] || null;
      }

      set({ accounts, activeAccount: active, isLoading: false });
      if (active) {
        await AsyncStorage.setItem(SELECTED_ACCOUNT_KEY, active._id);
      } else {
        await AsyncStorage.removeItem(SELECTED_ACCOUNT_KEY);
      }
    } catch (err: any) {
      set({ isLoading: false, error: err?.message || 'Failed to delete account' });
      throw err;
    }
  },

  clearAccountState: () => {
    set({ accounts: [], activeAccount: null, isLoading: false, error: null });
  },
}));
