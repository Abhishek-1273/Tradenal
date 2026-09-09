import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
  Modal,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { useAuthStore } from '../../store/auth.store';
import { useAccountStore } from '../../store/account.store';
import { useUIStore } from '../../store/ui.store';
import { useLogout, useUpdateSettings, useChangePassword } from '../../hooks/useAuth';
import { AppNavProp } from '../../navigation/types';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useToast } from '../../components/common/Toast';

interface MenuItemProps {
  icon: string;
  label: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  isLast?: boolean;
}

const fontBase = {
  fontFamily: Platform.select({ ios: 'System', android: 'sans-serif' }),
  includeFontPadding: false,
};

const MenuItem: React.FC<MenuItemProps> = ({
  icon,
  label,
  subtitle,
  onPress,
  rightElement,
  isLast = false,
}) => {
  const { colors, spacing, isDark } = useTheme();

  const content = (
    <View
      style={[
        styles.menuItem,
        {
          backgroundColor: colors.surface,
          borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
          borderBottomColor: colors.border,
          paddingHorizontal: spacing[4],
          paddingVertical: 14,
        },
      ]}
    >
      <View
        style={[
          styles.menuIconWrap,
          {
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#F1F5F9',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0',
          },
        ]}
      >
        <Ionicons name={icon as any} size={18} color={colors.textPrimary} />
      </View>
      <View style={{ flex: 1, marginRight: 8 }}>
        <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>{label}</Text>
        {subtitle && (
          <Text style={[styles.menuSubtitle, { color: colors.textTertiary }]}>{subtitle}</Text>
        )}
      </View>
      {rightElement ?? (
        <Ionicons name="chevron-forward" size={15} color={colors.textTertiary} />
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.75}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

export const MoreScreen: React.FC = () => {
  const { colors, spacing, radii, typography, isDark } = useTheme();
  const navigation = useNavigation<AppNavProp>();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { activeAccount } = useAccountStore();
  const { isDarkMode, setDarkMode } = useUIStore();
  const { mutate: logout, isPending: loggingOut } = useLogout();
  const { mutateAsync: updateSettings } = useUpdateSettings();
  const { mutateAsync: changePassword, isPending: changingPass } = useChangePassword();
  const { showToast } = useToast();

  // Modals state
  const [notifModalVisible, setNotifModalVisible] = useState(false);
  const [passModalVisible, setPassModalVisible] = useState(false);

  // Change Password state
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passError, setPassError] = useState('');

  const handleToggleNotification = async (key: string, value: boolean) => {
    try {
      await updateSettings({ notifications: { [key]: value } } as any);
      showToast('Notification preferences updated', 'success');
    } catch (e: any) {
      showToast(e.message || 'Failed to update preferences', 'error');
    }
  };

  const handleChangePassword = async () => {
    setPassError('');
    if (!currentPass || !newPass || !confirmPass) {
      setPassError('All fields are required.');
      return;
    }
    if (newPass.length < 8) {
      setPassError('New password must be at least 8 characters.');
      return;
    }
    if (newPass !== confirmPass) {
      setPassError('New passwords do not match.');
      return;
    }
    try {
      await changePassword({ currentPassword: currentPass, newPassword: newPass });
      showToast('Password changed successfully.', 'success');
      setPassModalVisible(false);
      setCurrentPass('');
      setNewPass('');
      setConfirmPass('');
    } catch (e: any) {
      setPassError(e.message || 'Failed to change password.');
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 28,
          paddingHorizontal: spacing[5],
          paddingBottom: insets.bottom + 110,
        }}
      >
        {/* ── App Icon & Brand Space ───────────────────────────────── */}
        <View style={styles.appBrandHeader}>
          <View
            style={[
              styles.appIconContainer,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.08)',
              },
            ]}
          >
            <Image
              source={require('../../../assets/icon.png')}
              style={styles.appIcon}
              resizeMode="cover"
            />
          </View>
          <View style={styles.appBrandTextWrap}>
            <Text style={[styles.appBrandTitle, { color: colors.textPrimary }]}>
              TRADENAL
            </Text>
            <Text style={[styles.appBrandSubtitle, { color: colors.textTertiary }]}>
              Institutional Trading Terminal
            </Text>
          </View>
        </View>

        {/* ── Executive Profile Card (Polished Name & Email) ────────── */}
        <View
          style={[
            styles.profileCardWrap,
            {
              borderRadius: 20,
              borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
              marginBottom: spacing[5],
            },
          ]}
        >
          <LinearGradient
            colors={isDark ? ['#181C2A', '#0F121C'] : ['#1E293B', '#0F172A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.profileGradient}
          >
            <View style={styles.profileTopRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user?.name?.charAt(0).toUpperCase() ?? 'T'}
                </Text>
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                  <Text style={styles.userName} numberOfLines={1}>
                    {user?.name || 'Trader'}
                  </Text>
                  <View style={styles.proBadge}>
                    <Ionicons name="shield-checkmark" size={10} color="#10B981" />
                    <Text style={styles.proBadgeText}>PRO</Text>
                  </View>
                </View>
                <Text style={styles.userEmail} numberOfLines={1}>
                  {user?.email}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* ── GROUP 1: TRADING & DATA ───────────────────────────────── */}
        <Text style={[styles.sectionHeading, { color: colors.textTertiary }]}>
          TRADING & DATA
        </Text>
        <View
          style={[
            styles.sectionCard,
            {
              borderRadius: radii.xl,
              borderColor: colors.border,
              backgroundColor: colors.surface,
              marginBottom: spacing[5],
            },
          ]}
        >
          {/* Dedicated single account access point */}
          <MenuItem
            icon="briefcase-outline"
            label="Trading Accounts"
            subtitle={activeAccount ? `Active: ${activeAccount.name}` : 'Manage & switch trading accounts'}
            onPress={() => navigation.navigate('Accounts')}
          />
          <MenuItem
            icon="cloud-download-outline"
            label="Export Journal"
            subtitle="Download trade records as CSV or JSON"
            onPress={() => navigation.navigate('Export')}
          />
          <MenuItem
            icon="time-outline"
            label="More Settings"
            subtitle="Broker GMT offset"
            onPress={() => navigation.navigate('Settings')}
            isLast
          />
        </View>

        {/* ── GROUP 2: PREFERENCES & SECURITY ────────────────────────── */}
        <Text style={[styles.sectionHeading, { color: colors.textTertiary }]}>
          PREFERENCES & SECURITY
        </Text>
        <View
          style={[
            styles.sectionCard,
            {
              borderRadius: radii.xl,
              borderColor: colors.border,
              backgroundColor: colors.surface,
              marginBottom: spacing[5],
            },
          ]}
        >
          {/* Dark Mode */}
          <MenuItem
            icon="moon-outline"
            label="Dark Mode"
            subtitle={isDarkMode ? 'Dark obsidian theme active' : 'Clean light theme active'}
            rightElement={
              <Switch
                value={isDarkMode}
                onValueChange={(val) => setDarkMode(val)}
                trackColor={{ false: '#CBD5E1', true: colors.textPrimary }}
                thumbColor={isDark ? '#000000' : '#FFFFFF'}
              />
            }
          />

          {/* Notifications */}
          <MenuItem
            icon="notifications-outline"
            label="Notifications"
            subtitle="Daily reminder, weekly & monthly reviews"
            onPress={() => setNotifModalVisible(true)}
          />

          {/* Change Password */}
          <MenuItem
            icon="shield-checkmark-outline"
            label="Change Password"
            subtitle="Update your security password"
            onPress={() => {
              setPassError('');
              setPassModalVisible(true);
            }}
            isLast
          />
        </View>

        {/* ── GROUP 3: SESSION (SEPARATE STANDALONE CARD) ───────────── */}
        <Text style={[styles.sectionHeading, { color: colors.textTertiary }]}>
          SESSION
        </Text>
        <View
          style={[
            styles.sectionCard,
            {
              borderRadius: radii.xl,
              borderColor: isDark ? 'rgba(239, 68, 68, 0.28)' : 'rgba(239, 68, 68, 0.2)',
              backgroundColor: colors.surface,
              marginBottom: spacing[5],
            },
          ]}
        >
          <TouchableOpacity
            onPress={() => logout()}
            disabled={loggingOut}
            activeOpacity={0.75}
            style={[
              styles.menuItem,
              {
                paddingHorizontal: spacing[4],
                paddingVertical: 14,
              },
            ]}
          >
            <View
              style={[
                styles.menuIconWrap,
                {
                  backgroundColor: isDark ? 'rgba(239, 68, 68, 0.12)' : 'rgba(239, 68, 68, 0.08)',
                  borderColor: isDark ? 'rgba(239, 68, 68, 0.25)' : 'rgba(239, 68, 68, 0.15)',
                },
              ]}
            >
              <Ionicons name="log-out-outline" size={18} color="#EF4444" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.menuLabel, { color: '#EF4444' }]}>
                {loggingOut ? 'Signing out...' : 'Sign Out'}
              </Text>
              <Text style={[styles.menuSubtitle, { color: colors.textTertiary }]}>
                Log out of this device session
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={15} color="#EF4444" opacity={0.6} />
          </TouchableOpacity>
        </View>

        {/* Minimal Footer */}
        <Text style={[styles.versionText, { color: colors.textTertiary }]}>
          Tradenal Terminal v1.0.0
        </Text>
      </ScrollView>

      {/* ── Notifications Modal ────────────────────────────────────── */}
      <Modal
        visible={notifModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setNotifModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: colors.surface,
                borderRadius: radii.xl,
                borderColor: colors.border,
                borderWidth: 1,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Notifications</Text>
                <Text style={[styles.modalSubtitle, { color: colors.textTertiary }]}>
                  Manage alerts and journal reminders
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setNotifModalVisible(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={{ marginTop: spacing[4] }}>
              <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
                <View style={{ flex: 1, marginRight: spacing[3] }}>
                  <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>
                    Daily Journal Reminder
                  </Text>
                  <Text style={[styles.settingSub, { color: colors.textTertiary }]}>
                    Remind to log trades each evening
                  </Text>
                </View>
                <Switch
                  value={user?.settings?.notifications?.dailyReminder ?? true}
                  onValueChange={(v) => handleToggleNotification('dailyReminder', v)}
                  trackColor={{ false: '#CBD5E1', true: colors.textPrimary }}
                  thumbColor={isDark ? '#000000' : '#FFFFFF'}
                />
              </View>

              <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
                <View style={{ flex: 1, marginRight: spacing[3] }}>
                  <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>
                    Weekly Review
                  </Text>
                  <Text style={[styles.settingSub, { color: colors.textTertiary }]}>
                    Remind to generate weekly AI review
                  </Text>
                </View>
                <Switch
                  value={user?.settings?.notifications?.weeklyReview ?? true}
                  onValueChange={(v) => handleToggleNotification('weeklyReview', v)}
                  trackColor={{ false: '#CBD5E1', true: colors.textPrimary }}
                  thumbColor={isDark ? '#000000' : '#FFFFFF'}
                />
              </View>

              <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
                <View style={{ flex: 1, marginRight: spacing[3] }}>
                  <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>
                    Monthly Review
                  </Text>
                  <Text style={[styles.settingSub, { color: colors.textTertiary }]}>
                    Remind to generate monthly AI review
                  </Text>
                </View>
                <Switch
                  value={user?.settings?.notifications?.monthlyReview ?? true}
                  onValueChange={(v) => handleToggleNotification('monthlyReview', v)}
                  trackColor={{ false: '#CBD5E1', true: colors.textPrimary }}
                  thumbColor={isDark ? '#000000' : '#FFFFFF'}
                />
              </View>
            </View>

            <Button
              label="Done"
              onPress={() => setNotifModalVisible(false)}
              style={{ marginTop: spacing[5] }}
            />
          </View>
        </View>
      </Modal>

      {/* ── Change Password Modal ──────────────────────────────────── */}
      <Modal
        visible={passModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPassModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: colors.surface,
                borderRadius: radii.xl,
                borderColor: colors.border,
                borderWidth: 1,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Change Password</Text>
                <Text style={[styles.modalSubtitle, { color: colors.textTertiary }]}>
                  Ensure your account remains protected
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setPassModalVisible(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {passError ? (
              <View
                style={[
                  styles.errorBanner,
                  {
                    backgroundColor: colors.errorSubtle,
                    borderRadius: radii.md,
                    marginTop: spacing[3],
                    marginBottom: spacing[2],
                  },
                ]}
              >
                <Ionicons name="alert-circle" size={16} color={colors.error} />
                <Text style={[typography.bodySm, { color: colors.error, marginLeft: 8, flex: 1 }]}>
                  {passError}
                </Text>
              </View>
            ) : (
              <View style={{ height: spacing[3] }} />
            )}

            <Input
              label="Current Password"
              placeholder="Enter current password"
              value={currentPass}
              onChangeText={setCurrentPass}
              isPassword
              leftIcon={<Ionicons name="lock-closed-outline" size={18} color={colors.textTertiary} />}
            />
            <Input
              label="New Password"
              placeholder="Min 8 characters"
              value={newPass}
              onChangeText={setNewPass}
              isPassword
              leftIcon={<Ionicons name="lock-open-outline" size={18} color={colors.textTertiary} />}
            />
            <Input
              label="Confirm New Password"
              placeholder="Repeat new password"
              value={confirmPass}
              onChangeText={setConfirmPass}
              isPassword
              leftIcon={<Ionicons name="lock-open-outline" size={18} color={colors.textTertiary} />}
            />

            <View style={[styles.modalActions, { marginTop: spacing[3] }]}>
              <Button
                label="Cancel"
                variant="ghost"
                onPress={() => setPassModalVisible(false)}
                style={{ flex: 1, marginRight: spacing[2] }}
              />
              <Button
                label="Update Password"
                onPress={handleChangePassword}
                loading={changingPass}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  appBrandHeader: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    marginBottom: 24,
  },
  appIconContainer: {
    width: 68,
    height: 68,
    borderRadius: 18,
    borderWidth: 1.5,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  appIcon: {
    width: '100%',
    height: '100%',
  },
  appBrandTextWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  appBrandTitle: {
    ...fontBase,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 2,
  },
  appBrandSubtitle: {
    ...fontBase,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 3,
  },
  profileCardWrap: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  profileGradient: {
    padding: 18,
  },
  profileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...fontBase,
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  userName: {
    ...fontBase,
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 3,
  },
  proBadgeText: {
    ...fontBase,
    fontSize: 9.5,
    fontWeight: '800',
    color: '#10B981',
    letterSpacing: 0.5,
  },
  userEmail: {
    ...fontBase,
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 3,
  },
  sectionHeading: {
    ...fontBase,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionCard: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuLabel: {
    ...fontBase,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  menuSubtitle: {
    ...fontBase,
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  versionText: {
    ...fontBase,
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 16,
    opacity: 0.6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    padding: 22,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  modalTitle: {
    ...fontBase,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  modalSubtitle: {
    ...fontBase,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  settingLabel: {
    ...fontBase,
    fontSize: 13.5,
    fontWeight: '700',
  },
  settingSub: {
    ...fontBase,
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  modalActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
});
