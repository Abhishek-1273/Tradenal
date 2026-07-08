import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import { TabParamList } from './types';

import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { TradeListScreen } from '../screens/trades/TradeListScreen';
import { CalendarScreen } from '../screens/calendar/CalendarScreen';
import { AnalyticsScreen } from '../screens/analytics/AnalyticsScreen';
import { MoreScreen } from '../screens/settings/MoreScreen';

const Tab = createBottomTabNavigator<TabParamList>();

type TabIcon = {
  name: string;
  icon: string;
  activeIcon: string;
};

const TAB_ICONS: Record<string, TabIcon> = {
  Dashboard: { name: 'Dashboard', icon: 'grid-outline', activeIcon: 'grid' },
  Trades: { name: 'Journal', icon: 'journal-outline', activeIcon: 'journal' },
  Calendar: { name: 'Calendar', icon: 'calendar-outline', activeIcon: 'calendar' },
  Analytics: { name: 'Analytics', icon: 'bar-chart-outline', activeIcon: 'bar-chart' },
  More: { name: 'More', icon: 'ellipsis-horizontal-outline', activeIcon: 'ellipsis-horizontal' },
};

export const BottomTabNavigator: React.FC = () => {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: 56 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 4,
        },
        tabBarIcon: ({ focused, color, size }) => {
          const tab = TAB_ICONS[route.name];
          return (
            <Ionicons
              name={(focused ? tab.activeIcon : tab.icon) as any}
              size={22}
              color={color}
            />
          );
        },
        tabBarLabel: ({ focused, color }) => {
          const tab = TAB_ICONS[route.name];
          return (
            <Text
              style={{
                fontSize: 10,
                fontWeight: focused ? '600' : '400',
                color,
                letterSpacing: 0.2,
                marginTop: -2,
              }}
            >
              {tab.name}
            </Text>
          );
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Trades" component={TradeListScreen} />
      <Tab.Screen name="Calendar" component={CalendarScreen} />
      <Tab.Screen name="Analytics" component={AnalyticsScreen} />
      <Tab.Screen name="More" component={MoreScreen} />
    </Tab.Navigator>
  );
};
