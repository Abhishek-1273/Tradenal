import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme';
import { useAuthStore } from '../../store/auth.store';
import { useLogout } from '../../hooks/useAuth';
import { AppNavProp } from '../../navigation/types';

const MenuItem: React.FC<{ icon: string; label: string; subtitle?: string; onPress: () => void; iconColor?: string; }> = ({ icon, label, subtitle, onPress, iconColor }) => {
  const { colors, typography, radii, spacing } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75} style={[styles.menuItem, { backgroundColor: colors.surface, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border, paddingHorizontal: spacing[5], paddingVertical: spacing[4] }]}>
      <View style={[styles.menuIconWrap, { backgroundColor: (iconColor ?? colors.primary) + '18', borderRadius: radii.md }]}>
        <Ionicons name={icon as any} size={20} color={iconColor ?? colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[typography.bodyLg, { color: colors.textPrimary }]}>{label}</Text>
        {subtitle && <Text style={[typography.caption, { color: colors.textTertiary, marginTop: 2 }]}>{subtitle}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
    </TouchableOpacity>
  );
};

export const MoreScreen: React.FC = () => {
  const { colors, typography, spacing, radii } = useTheme();
  const navigation = useNavigation<AppNavProp>();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { mutate: logout, isPending } = useLogout();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: spacing[5], paddingBottom: spacing[4] }}>
        <Text style={[typography.h2, { color: colors.textPrimary }]}>More</Text>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}>
        <View style={[{ marginHorizontal: spacing[5], marginBottom: spacing[5], borderRadius: radii['2xl'], overflow: 'hidden' }]}>
          <LinearGradient colors={[colors.primaryDark, colors.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: spacing[5] }}>
            <View style={{ width: 56, height: 56, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: radii.full, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={[typography.h2, { color: '#fff' }]}>{user?.name?.charAt(0).toUpperCase() ?? 'T'}</Text>
            </View>
            <Text style={[typography.h3, { color: '#fff', marginTop: spacing[3] }]}>{user?.name}</Text>
            <Text style={[typography.bodySm, { color: 'rgba(255,255,255,0.75)', marginTop: 4 }]}>{user?.email}</Text>
          </LinearGradient>
        </View>

        <Text style={[typography.labelSm, { color: colors.textTertiary, paddingHorizontal: spacing[5], marginBottom: spacing[2] }]}>FEATURES</Text>
        <View style={[{ borderRadius: radii.xl, marginHorizontal: spacing[5], overflow: 'hidden', borderWidth: 1, borderColor: colors.border, marginBottom: spacing[5] }]}>
          <MenuItem icon="sparkles-outline" label="AI Review" subtitle="Weekly & monthly analysis" onPress={() => navigation.navigate('AIReview')} iconColor={colors.primary} />
          <MenuItem icon="trophy-outline" label="Goals" subtitle="Set monthly targets" onPress={() => navigation.navigate('Goals')} iconColor={colors.warning} />
        </View>

        <Text style={[typography.labelSm, { color: colors.textTertiary, paddingHorizontal: spacing[5], marginBottom: spacing[2] }]}>ACCOUNT</Text>
        <View style={[{ borderRadius: radii.xl, marginHorizontal: spacing[5], overflow: 'hidden', borderWidth: 1, borderColor: colors.border, marginBottom: spacing[5] }]}>
          <MenuItem icon="settings-outline" label="Settings" subtitle="Theme, defaults, notifications" onPress={() => navigation.navigate('Settings')} iconColor={colors.textSecondary} />
          <MenuItem icon="download-outline" label="Export Data" subtitle="CSV, JSON" onPress={() => navigation.navigate('Export')} iconColor={colors.success} />
        </View>

        <View style={[{ borderRadius: radii.xl, marginHorizontal: spacing[5], overflow: 'hidden', borderWidth: 1, borderColor: colors.border }]}>
          <TouchableOpacity onPress={() => logout()} disabled={isPending} style={[styles.menuItem, { paddingHorizontal: spacing[5], paddingVertical: spacing[4] }]}>
            <View style={[styles.menuIconWrap, { backgroundColor: colors.errorSubtle, borderRadius: radii.md }]}>
              <Ionicons name="log-out-outline" size={20} color={colors.error} />
            </View>
            <Text style={[typography.bodyLg, { color: colors.error, flex: 1, marginLeft: 14 }]}>{isPending ? 'Signing out...' : 'Sign Out'}</Text>
          </TouchableOpacity>
        </View>

        <Text style={[typography.caption, { color: colors.textTertiary, textAlign: 'center', marginTop: spacing[6] }]}>Tradenal v1.0.0 • Ryu@2026</Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  menuItem: { flexDirection: 'row', alignItems: 'center' },
  menuIconWrap: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
});
