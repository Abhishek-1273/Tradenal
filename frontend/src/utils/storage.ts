import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const ACCESS_TOKEN_KEY = 'tj_access_token';
const REFRESH_TOKEN_KEY = 'tj_refresh_token';
const USER_KEY = 'tj_user';

// SecureStore has 2048 byte limit per value on some platforms
// Use AsyncStorage as fallback for web
const isSecureAvailable = Platform.OS !== 'web';

export const storage = {
  async setAccessToken(token: string): Promise<void> {
    if (isSecureAvailable) {
      await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
    } else {
      await AsyncStorage.setItem(ACCESS_TOKEN_KEY, token);
    }
  },

  async getAccessToken(): Promise<string | null> {
    if (isSecureAvailable) {
      return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    }
    return AsyncStorage.getItem(ACCESS_TOKEN_KEY);
  },

  async setRefreshToken(token: string): Promise<void> {
    if (isSecureAvailable) {
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
    } else {
      await AsyncStorage.setItem(REFRESH_TOKEN_KEY, token);
    }
  },

  async getRefreshToken(): Promise<string | null> {
    if (isSecureAvailable) {
      return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    }
    return AsyncStorage.getItem(REFRESH_TOKEN_KEY);
  },

  async clearTokens(): Promise<void> {
    if (isSecureAvailable) {
      await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    } else {
      await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY]);
    }
  },

  async setUser(user: unknown): Promise<void> {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  async getUser<T>(): Promise<T | null> {
    const raw = await AsyncStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  async clearUser(): Promise<void> {
    await AsyncStorage.removeItem(USER_KEY);
  },

  async clearAll(): Promise<void> {
    await this.clearTokens();
    await this.clearUser();
  },
};
