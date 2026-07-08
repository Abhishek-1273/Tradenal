import { useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { useQueryClient } from '@tanstack/react-query';
import { tradesApi } from '../api/trades.api';
import { useUIStore } from '../store/ui.store';
import { CreateTradePayload } from '../types';
import { tradeKeys, statsKeys } from './useTrades';

const OFFLINE_QUEUE_KEY = 'tj_offline_queue';

interface QueuedTrade {
  id: string;
  payload: CreateTradePayload;
  timestamp: number;
}

export const useOfflineSync = () => {
  const { setOffline } = useUIStore();
  const queryClient = useQueryClient();
  const syncing = useRef(false);

  // Queue a trade for later sync
  const queueTrade = useCallback(async (payload: CreateTradePayload): Promise<string> => {
    const queued: QueuedTrade = {
      id: `offline_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      payload,
      timestamp: Date.now(),
    };

    try {
      const raw = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
      const queue: QueuedTrade[] = raw ? JSON.parse(raw) : [];
      queue.push(queued);
      await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    } catch (err) {
      console.error('[OfflineSync] Failed to queue trade:', err);
    }

    return queued.id;
  }, []);

  // Process the offline queue
  const processQueue = useCallback(async () => {
    if (syncing.current) return;
    syncing.current = true;

    try {
      const raw = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
      if (!raw) return;

      const queue: QueuedTrade[] = JSON.parse(raw);
      if (queue.length === 0) return;

      console.log(`[OfflineSync] Processing ${queue.length} queued trades`);

      const remaining: QueuedTrade[] = [];

      for (const item of queue) {
        try {
          await tradesApi.createTrade(item.payload);
          console.log(`[OfflineSync] Synced trade: ${item.id}`);
        } catch (err) {
          // Keep in queue if server error (not network error)
          console.error(`[OfflineSync] Failed to sync ${item.id}:`, err);
          remaining.push(item);
        }
      }

      await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remaining));

      if (remaining.length < queue.length) {
        // Some trades synced — invalidate queries
        queryClient.invalidateQueries({ queryKey: tradeKeys.lists() });
        queryClient.invalidateQueries({ queryKey: statsKeys.all });
      }
    } catch (err) {
      console.error('[OfflineSync] Queue processing error:', err);
    } finally {
      syncing.current = false;
    }
  }, [queryClient]);

  // Get pending count
  const getPendingCount = useCallback(async (): Promise<number> => {
    try {
      const raw = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
      if (!raw) return 0;
      const queue: QueuedTrade[] = JSON.parse(raw);
      return queue.length;
    } catch {
      return 0;
    }
  }, []);

  // Clear queue
  const clearQueue = useCallback(async () => {
    await AsyncStorage.removeItem(OFFLINE_QUEUE_KEY);
  }, []);

  // Monitor network and sync when back online
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const isConnected = state.isConnected ?? false;
      setOffline(!isConnected);

      if (isConnected) {
        // Small delay to let connection stabilize
        setTimeout(processQueue, 1500);
      }
    });

    return () => unsubscribe();
  }, [processQueue, setOffline]);

  return { queueTrade, processQueue, getPendingCount, clearQueue };
};
