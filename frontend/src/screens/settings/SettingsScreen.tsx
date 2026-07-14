import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Switch, Alert, Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme';
import { useUIStore } from '../../store/ui.store';
import { useAuthStore } from '../../store/auth.store';
import { useUpdateSettings, useChangePassword, useLogout, useDeleteAccount } from '../../hooks/useAuth';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { useToast } from '../../components/common/Toast';

const formatGmtOffset = (offset: number): string => {
  if (offset === 0) return '0';
  const isNegative = offset < 0;
  const absOffset = Math.abs(offset);
  const hours = Math.floor(absOffset);
  const minutes = Math.round((absOffset - hours) * 60);
  if (minutes === 0) {
    return `${isNegative ? '-' : '+'}${hours}`;
  }
  return `${isNegative ? '-' : '+'}${hours}:${String(minutes).padStart(2, '0')}`;
};

const parseGmtOffset = (val: string): number => {
  if (!val) return 0;
  const cleanVal = val.trim();
  const isNegative = cleanVal.startsWith('-');
  const unsignedVal = isNegative ? cleanVal.slice(1) : cleanVal.startsWith('+') ? cleanVal.slice(1) : cleanVal;
  if (unsignedVal.includes(':')) {
    const parts = unsignedVal.split(':');
    const hours = Math.abs(parseInt(parts[0]) || 0);
    const minutes = Math.abs(parseInt(parts[1]) || 0);
    const decimal = hours + minutes / 60;
    return isNegative ? -decimal : decimal;
  }
  return parseFloat(cleanVal) || 0;
};

type Section = 'main' | 'password' | 'defaults';

export const SettingsScreen: React.FC = () => {
  const { colors, typography, spacing, radii } = useTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { isDarkMode, setDarkMode } = useUIStore();
  const { user, logout } = useAuthStore();
  const { mutateAsync: updateSettings, isPending: savingSettings } = useUpdateSettings();
  const { mutateAsync: changePassword, isPending: changingPass } = useChangePassword();
  const { mutate: doLogout, isPending: loggingOut } = useLogout();
  const { showToast } = useToast();

  const [section, setSection] = useState<Section>('main');
  const [defaultRisk, setDefaultRisk] = useState(user?.settings?.defaultRisk?.toString() ?? '1');
  const [defaultRR, setDefaultRR] = useState(user?.settings?.defaultRR?.toString() ?? '2');
  const [brokerGmtOffset, setBrokerGmtOffset] = useState(
    user?.settings?.brokerGmtOffset !== undefined ? formatGmtOffset(user.settings.brokerGmtOffset) : '0'
  );
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passError, setPassError] = useState('');

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');

  const { mutateAsync: deleteAccountMutate, isPending: deletingAccount } = useDeleteAccount();

  const handleSaveDefaults = async () => {
    try {
      await updateSettings({
        defaultRisk: parseFloat(defaultRisk) || 1,
        defaultRR: parseFloat(defaultRR) || 2,
        brokerGmtOffset: parseGmtOffset(brokerGmtOffset),
      });
      showToast('Default settings updated successfully.', 'success');
    } catch (e: any) {
      showToast(e.message || 'Failed to update defaults.', 'error');
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
      doLogout();
    } catch (e: any) {
      setPassError(e.message || 'Failed to change password.');
    }
  };

  const handleToggleNotification = async (key: string, value: boolean) => {
    try {
      await updateSettings({ notifications: { [key]: value } } as any);
    } catch { }
  };

  const handleConfirmDelete = async () => {
    setDeleteError('');
    if (!deletePassword) {
      setDeleteError('Password is required.');
      return;
    }
    try {
      await deleteAccountMutate(deletePassword);
      setDeleteModalVisible(false);
      showToast('Your account has been deactivated successfully.', 'success');
    } catch (e: any) {
      setDeleteError(e.message || 'Failed to deactivate account.');
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and ALL trading data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setDeletePassword('');
            setDeleteError('');
            setDeleteModalVisible(true);
          },
        },
      ]
    );
  };

  const SettingRow = ({
    label, subtitle, children,
  }: { label: string; subtitle?: string; children: React.ReactNode }) => (
    <View style={[{
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingVertical: spacing[4],
      borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border,
    }]}>
      <View style={{ flex: 1, marginRight: spacing[4] }}>
        <Text style={[typography.body, { color: colors.textPrimary }]}>{label}</Text>
        {subtitle && (
          <Text style={[typography.caption, { color: colors.textTertiary, marginTop: 3 }]}>
            {subtitle}
          </Text>
        )}
      </View>
      {children}
    </View>
  );

  const SectionLink = ({
    icon, label, subtitle, onPress, iconColor, danger,
  }: {
    icon: string; label: string; subtitle?: string;
    onPress: () => void; iconColor?: string; danger?: boolean;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[{
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: spacing[4],
        borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border,
      }]}
    >
      <View style={[{
        width: 36, height: 36, borderRadius: 10,
        backgroundColor: (iconColor ?? colors.primary) + '20',
        alignItems: 'center', justifyContent: 'center', marginRight: spacing[3],
      }]}>
        <Ionicons name={icon as any} size={18} color={iconColor ?? colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[typography.body, { color: danger ? colors.error : colors.textPrimary }]}>
          {label}
        </Text>
        {subtitle && (
          <Text style={[typography.caption, { color: colors.textTertiary, marginTop: 2 }]}>
            {subtitle}
          </Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
    </TouchableOpacity>
  );

  return (
    <View style={[{ flex: 1 }, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[{
        paddingTop: insets.top + 12, paddingHorizontal: spacing[5], paddingBottom: spacing[4],
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: colors.background,
        borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border,
      }]}>
        {section !== 'main' ? (
          <TouchableOpacity
            onPress={() => { setSection('main'); setPassError(''); }}
            style={[{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' }]}
          >
            <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' }]}
          >
            <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        )}
        <Text style={[typography.h2, { color: colors.textPrimary, marginLeft: spacing[4] }]}>
          {section === 'password' ? 'Change Password' : section === 'defaults' ? 'Trading Defaults' : 'Settings'}
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[{ paddingHorizontal: spacing[5], paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── MAIN SETTINGS ── */}
        {section === 'main' && (
          <>
            {/* Profile card */}
            <View style={[{ marginTop: spacing[5], marginBottom: spacing[5], borderRadius: radii['2xl'], overflow: 'hidden' }]}>
              <LinearGradient colors={[colors.primaryDark, colors.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[{ padding: spacing[5] }]}>
                <View style={[{ width: 56, height: 56, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: radii.full, alignItems: 'center', justifyContent: 'center', marginBottom: spacing[3] }]}>
                  <Text style={[typography.h2, { color: '#fff' }]}>
                    {user?.name?.charAt(0).toUpperCase() ?? 'T'}
                  </Text>
                </View>
                <Text style={[typography.h3, { color: '#fff' }]}>{user?.name}</Text>
                <Text style={[typography.body, { color: 'rgba(255,255,255,0.75)', marginTop: 4 }]}>{user?.email}</Text>
              </LinearGradient>
            </View>

            {/* Appearance */}
            <Text style={[typography.labelSm, { color: colors.textTertiary, marginBottom: spacing[2] }]}>APPEARANCE</Text>
            <Card style={{ marginBottom: spacing[5] }}>
              <SettingRow label="Dark Mode" subtitle="TradingView-inspired dark theme">
                <Switch
                  value={isDarkMode}
                  onValueChange={setDarkMode}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#fff"
                  ios_backgroundColor={colors.border}
                />
              </SettingRow>
            </Card>

            {/* Trading */}
            <Text style={[typography.labelSm, { color: colors.textTertiary, marginBottom: spacing[2] }]}>TRADING</Text>
            <Card style={{ marginBottom: spacing[5] }}>
              <SectionLink
                icon="options-outline" label="Default Risk, RR & GMT"
                subtitle={`Risk: ${user?.settings?.defaultRisk ?? 1}% · RR: ${user?.settings?.defaultRR ?? 2} · GMT: ${user?.settings?.brokerGmtOffset !== undefined ? formatGmtOffset(user.settings.brokerGmtOffset) : '0'}`}
                onPress={() => setSection('defaults')}
                iconColor={colors.warning}
              />
            </Card>

            {/* Notifications */}
            <Text style={[typography.labelSm, { color: colors.textTertiary, marginBottom: spacing[2] }]}>NOTIFICATIONS</Text>
            <Card style={{ marginBottom: spacing[5] }}>
              <SettingRow label="Daily Journal Reminder" subtitle="Remind to log trades each evening">
                <Switch
                  value={user?.settings?.notifications?.dailyReminder ?? true}
                  onValueChange={(v) => handleToggleNotification('dailyReminder', v)}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#fff"
                />
              </SettingRow>
              <SettingRow label="Weekly Review" subtitle="Remind to generate weekly AI review">
                <Switch
                  value={user?.settings?.notifications?.weeklyReview ?? true}
                  onValueChange={(v) => handleToggleNotification('weeklyReview', v)}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#fff"
                />
              </SettingRow>
              <SettingRow label="Monthly Review" subtitle="Remind to generate monthly AI review">
                <Switch
                  value={user?.settings?.notifications?.monthlyReview ?? true}
                  onValueChange={(v) => handleToggleNotification('monthlyReview', v)}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#fff"
                />
              </SettingRow>
            </Card>

            {/* Security */}
            <Text style={[typography.labelSm, { color: colors.textTertiary, marginBottom: spacing[2] }]}>SECURITY</Text>
            <Card style={{ marginBottom: spacing[5] }}>
              <SectionLink
                icon="lock-closed-outline" label="Change Password"
                subtitle="Update your account password"
                onPress={() => setSection('password')}
                iconColor={colors.info}
              />
            </Card>

            {/* Danger zone */}
            <Text style={[typography.labelSm, { color: colors.textTertiary, marginBottom: spacing[2] }]}>ACCOUNT</Text>
            <Card style={{ marginBottom: spacing[5] }}>
              <SectionLink
                icon="trash-outline" label="Delete Account"
                subtitle="Permanently delete account and all data"
                onPress={handleDeleteAccount}
                iconColor={colors.error}
                danger
              />
            </Card>

            <Text style={[typography.caption, { color: colors.textTertiary, textAlign: 'center', marginBottom: spacing[4] }]}>
              Tradenal v1.0.0 • Ryu © 2026
            </Text>
          </>
        )}

        {/* ── TRADING DEFAULTS ── */}
        {section === 'defaults' && (
          <View style={{ paddingTop: spacing[5] }}>
            <Text style={[typography.body, { color: colors.textTertiary, marginBottom: spacing[5], lineHeight: 22 }]}>
              These values will be pre-filled when you create a new trade, saving you time on each entry.
            </Text>
            <Input
              label="Default Risk per Trade (%)"
              placeholder="1.0"
              value={defaultRisk}
              onChangeText={setDefaultRisk}
              keyboardType="decimal-pad"
              hint="Recommended: 0.5–2% per trade"
              rightIcon={<Text style={{ color: colors.textTertiary, marginRight: 12 }}>%</Text>}
            />
            <Input
              label="Default Target RR"
              placeholder="2.0"
              value={defaultRR}
              onChangeText={setDefaultRR}
              keyboardType="decimal-pad"
              hint="Minimum recommended: 1.5R"
              rightIcon={<Text style={{ color: colors.textTertiary, marginRight: 12 }}>R</Text>}
            />
            <Input
              label="Default Broker GMT Offset"
              placeholder="e.g. 5:30 or 5.5"
              value={brokerGmtOffset}
              onChangeText={setBrokerGmtOffset}
              keyboardType="numbers-and-punctuation"
              hint="Supports 5:30 (for India), 5.5, or -5 (for EST)"
            />
            <Button
              label="Save Defaults"
              onPress={handleSaveDefaults}
              loading={savingSettings}
              style={{ marginTop: spacing[4] }}
            />
          </View>
        )}

        {/* ── CHANGE PASSWORD ── */}
        {section === 'password' && (
          <View style={{ paddingTop: spacing[5] }}>
            {passError ? (
              <View style={[{
                backgroundColor: colors.errorSubtle, borderRadius: radii.md,
                padding: spacing[3], marginBottom: spacing[4],
                flexDirection: 'row', alignItems: 'center',
              }]}>
                <Ionicons name="alert-circle" size={16} color={colors.error} />
                <Text style={[typography.bodySm, { color: colors.error, marginLeft: spacing[2], flex: 1 }]}>
                  {passError}
                </Text>
              </View>
            ) : null}
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
              placeholder="Min 8 chars, 1 uppercase, 1 number"
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
            <Button
              label="Change Password"
              onPress={handleChangePassword}
              loading={changingPass}
              style={{ marginTop: spacing[2] }}
            />
          </View>
        )}
      </ScrollView>

      {/* Delete Account Password Verification Modal */}
      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, borderRadius: radii.xl, borderColor: colors.border, borderWidth: 1 }]}>
            <View style={styles.modalHeader}>
              <Text style={[typography.h3, { color: colors.textPrimary }]}>Verify Password</Text>
              <TouchableOpacity onPress={() => setDeleteModalVisible(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={[typography.body, { color: colors.textTertiary, marginVertical: spacing[3], lineHeight: 20 }]}>
              Please enter your password to confirm account deletion. This action is irreversible.
            </Text>

            {deleteError ? (
              <View style={[styles.errorBanner, { backgroundColor: colors.errorSubtle, borderRadius: radii.md, marginBottom: spacing[4] }]}>
                <Ionicons name="alert-circle" size={16} color={colors.error} />
                <Text style={[typography.bodySm, { color: colors.error, marginLeft: 8, flex: 1 }]}>{deleteError}</Text>
              </View>
            ) : null}

            <Input
              label="Confirm Password"
              placeholder="Enter your password"
              value={deletePassword}
              onChangeText={setDeletePassword}
              isPassword
              leftIcon={<Ionicons name="lock-closed-outline" size={18} color={colors.textTertiary} />}
            />

            <View style={[styles.modalActions, { marginTop: spacing[2] }]}>
              <Button
                label="Cancel"
                onPress={() => setDeleteModalVisible(false)}
                variant="secondary"
                style={{ flex: 1, marginRight: spacing[3] }}
              />
              <Button
                label="Delete Permanently"
                onPress={handleConfirmDelete}
                loading={deletingAccount}
                style={{ flex: 1, backgroundColor: colors.error }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  modalContent: {
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
});
