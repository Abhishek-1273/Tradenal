import React, { useEffect } from 'react';
import { StatusBar, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PaperProvider } from 'react-native-paper';

import { ThemeContext, createTheme, getPaperTheme } from './src/theme';
import { useUIStore } from './src/store/ui.store';
import { AppNavigatorRoot } from './src/navigation/AppNavigator';
import { ErrorBoundary } from './src/components/common/ErrorBoundary';
import { OfflineBanner } from './src/components/common/OfflineBanner';
import { ToastProvider } from './src/components/common/Toast';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount: number, error: any) => {
        if (error?.response?.status >= 400 && error?.response?.status < 500) return false;
        return failureCount < 2;
      },
      staleTime: 2 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: { retry: 0 },
  },
});

const ThemedApp: React.FC = () => {
  const { isDarkMode, initTheme } = useUIStore();
  const theme = createTheme(isDarkMode);
  const paperTheme = getPaperTheme(isDarkMode);

  useEffect(() => {
    initTheme();
  }, []);

  return (
    <ThemeContext.Provider value={theme}>
      <PaperProvider theme={paperTheme as any}>
        <ToastProvider>
          <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
            <StatusBar
              barStyle={isDarkMode ? 'light-content' : 'dark-content'}
              backgroundColor={theme.colors.background}
              translucent={false}
            />
            <OfflineBanner />
            <AppNavigatorRoot />
          </View>
        </ToastProvider>
      </PaperProvider>
    </ThemeContext.Provider>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <QueryClientProvider client={queryClient}>
            <ThemedApp />
          </QueryClientProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
