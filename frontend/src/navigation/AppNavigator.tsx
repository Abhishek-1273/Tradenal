import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/auth.store';
import { LoadingOverlay } from '../components/common/LoadingOverlay';
import { useTheme } from '../theme';
import { useUIStore } from '../store/ui.store';

// Auth screens
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';
import { ResetPasswordScreen } from '../screens/auth/ResetPasswordScreen';

// App screens
import { BottomTabNavigator } from './BottomTabNavigator';
import { TradeDetailScreen } from '../screens/trades/TradeDetailScreen';
import { AddTradeScreen } from '../screens/trades/AddTradeScreen';
import { EditTradeScreen } from '../screens/trades/EditTradeScreen';
import { AIReviewScreen } from '../screens/ai/AIReviewScreen';
import { GoalsScreen } from '../screens/goals/GoalsScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { CalendarDayScreen } from '../screens/calendar/CalendarDayScreen';
import { AccountsScreen } from '../screens/accounts/AccountsScreen';
import { ExportScreen } from '../screens/settings/ExportScreen';

import { RootStackParamList, AuthStackParamList, AppStackParamList } from './types';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();

const AuthNavigator: React.FC = () => (
  <AuthStack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen name="Register" component={RegisterScreen} />
    <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    <AuthStack.Screen name="ResetPassword" component={ResetPasswordScreen} />
  </AuthStack.Navigator>
);

const AppNavigator: React.FC = () => {
  const { colors } = useTheme();
  return (
    <AppStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}
    >
      <AppStack.Screen name="MainTabs" component={BottomTabNavigator} />
      <AppStack.Screen name="TradeDetail" component={TradeDetailScreen} />
      <AppStack.Screen name="AddTrade" component={AddTradeScreen} options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
      <AppStack.Screen name="EditTrade" component={EditTradeScreen} options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
      <AppStack.Screen name="AIReview" component={AIReviewScreen} />
      <AppStack.Screen name="Goals" component={GoalsScreen} />
      <AppStack.Screen name="Settings" component={SettingsScreen} />
      <AppStack.Screen name="CalendarDay" component={CalendarDayScreen} />
      <AppStack.Screen name="Accounts" component={AccountsScreen} />
      <AppStack.Screen name="Export" component={ExportScreen} />
    </AppStack.Navigator>
  );
};

const linking = {
  prefixes: ['tradenal://', 'http://localhost:3000'],
  config: {
    screens: {
      Auth: {
        screens: {
          ResetPassword: 'reset-password',
        },
      },
    },
  },
};

export const AppNavigatorRoot: React.FC = () => {
  const { isAuthenticated, isInitialized, initialize } = useAuthStore();
  const { colors } = useTheme();
  const { isDarkMode } = useUIStore();

  useEffect(() => {
    initialize();
  }, []);

  if (!isInitialized) {
    return <LoadingOverlay visible fullScreen message="Loading..." />;
  }

  return (
    <NavigationContainer
      linking={linking as any}
      theme={{
        dark: isDarkMode,
        colors: {
          primary: colors.primary,
          background: colors.background,
          card: colors.surface,
          text: colors.textPrimary,
          border: colors.border,
          notification: colors.error,
        },
      }}
    >
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <RootStack.Screen name="App" component={AppNavigator} />
        ) : (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};
