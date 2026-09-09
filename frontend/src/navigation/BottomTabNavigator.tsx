import React from 'react';
import { View, Text, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import { TabParamList } from './types';

import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { TradeListScreen } from '../screens/trades/TradeListScreen';
import { AnalyticsScreen } from '../screens/analytics/AnalyticsScreen';
import { CalendarScreen } from '../screens/calendar/CalendarScreen';
import { MoreScreen } from '../screens/settings/MoreScreen';

const Tab = createBottomTabNavigator<TabParamList>();

type TabIcon = {
  name: string;
  icon: string;
  activeIcon: string;
};

const TAB_ICONS: Record<string, TabIcon> = {
  Dashboard: { name: 'Dashboard', icon: 'home-outline', activeIcon: 'home' },
  Trades: { name: 'Journal', icon: 'document-text-outline', activeIcon: 'document-text' },
  Analytics: { name: 'Analytics', icon: 'stats-chart-outline', activeIcon: 'stats-chart' },
  Calendar: { name: 'Calendar', icon: 'calendar-outline', activeIcon: 'calendar' },
  More: { name: 'More', icon: 'ellipsis-horizontal-outline', activeIcon: 'ellipsis-horizontal' },
};

export const BottomTabNavigator: React.FC = () => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const isAndroid = Platform.OS === 'android';

  const safeBottom = Math.max(insets.bottom, isAndroid ? 10 : 8);
  const tabHeight = isAndroid ? 62 + safeBottom : 58 + insets.bottom;

  const activeColor = isDark ? '#FFFFFF' : '#0F172A';
  const inactiveColor = isDark ? '#64748B' : '#94A3B8';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: tabHeight,
          paddingBottom: safeBottom,
          paddingTop: 6,
          elevation: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
        },
        tabBarIcon: ({ focused }) => {
          const tab = TAB_ICONS[route.name];
          return (
            <View
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 2,
              }}
            >
              <Ionicons
                name={(focused ? tab.activeIcon : tab.icon) as any}
                size={22}
                color={focused ? activeColor : inactiveColor}
              />
            </View>
          );
        },
        tabBarLabel: ({ focused }) => {
          const tab = TAB_ICONS[route.name];
          return (
            <Text
              style={{
                fontSize: 10.5,
                fontWeight: focused ? '700' : '500',
                color: focused ? activeColor : inactiveColor,
                letterSpacing: 0.2,
                marginTop: 2,
                fontFamily: Platform.select({ ios: 'System', android: 'sans-serif' }),
                includeFontPadding: false,
              }}
              numberOfLines={1}
            >
              {tab.name}
            </Text>
          );
        },
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Trades" component={TradeListScreen} />
      <Tab.Screen name="Analytics" component={AnalyticsScreen} />
      <Tab.Screen name="Calendar" component={CalendarScreen} />
      <Tab.Screen name="More" component={MoreScreen} />
    </Tab.Navigator>
  );
};
