import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp, RouteProp } from '@react-navigation/native';

// ─── Auth Stack ───────────────────────────────────────────────────────────────
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token: string };
};

// ─── Bottom Tabs ──────────────────────────────────────────────────────────────
export type TabParamList = {
  Dashboard: undefined;
  Trades: undefined;
  Calendar: undefined;
  Analytics: undefined;
  More: undefined;
};

// ─── App Stack ────────────────────────────────────────────────────────────────
export type AppStackParamList = {
  MainTabs: undefined;
  TradeDetail: { tradeId: string };
  AddTrade: undefined;
  EditTrade: { tradeId: string };
  AIReview: undefined;
  Goals: undefined;
  Psychology: undefined;
  Settings: undefined;
  CalendarDay: { date: string };
  Export: undefined;
  Accounts: undefined;
};

// ─── Root ─────────────────────────────────────────────────────────────────────
export type RootStackParamList = {
  Auth: undefined;
  App: undefined;
};

// ─── Navigation prop types ────────────────────────────────────────────────────
export type AuthNavProp = NativeStackNavigationProp<AuthStackParamList>;
export type AppNavProp = NativeStackNavigationProp<AppStackParamList>;
export type TabNavProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList>,
  NativeStackNavigationProp<AppStackParamList>
>;

export type TradeDetailRouteProp = RouteProp<AppStackParamList, 'TradeDetail'>;
export type EditTradeRouteProp = RouteProp<AppStackParamList, 'EditTrade'>;
export type CalendarDayRouteProp = RouteProp<AppStackParamList, 'CalendarDay'>;
