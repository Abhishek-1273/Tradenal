import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { useAuthStore } from '../../store/auth.store';
import { useUpdateSettings, useDeleteAccount } from '../../hooks/useAuth';
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

export const SettingsScreen: React.FC = () => {
  const { colors, typography, spacing, radii } = useTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { mutateAsync: updateSettings, isPending: savingSettings } = useUpdateSettings();
  const { showToast } = useToast();

  const [brokerGmtOffset, setBrokerGmtOffset] = useState(
    user?.settings?.brokerGmtOffset !== undefined ? formatGmtOffset(user.settings.brokerGmtOffset) : '0'
  );

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const { mutateAsync: deleteAccountMutate, isPending: deletingAccount } = useDeleteAccount();

  const handleSaveDefaults = async () => {
    try {
      await updateSettings({
        brokerGmtOffset: parseGmtOffset(brokerGmtOffset),
      });
      showToast('Default settings updated successfully.', 'success');
    } catch (e: any) {
      showToast(e.message || 'Failed to update defaults.', 'error');
    }
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

  return (
    <View style={[{ flex: 1 }, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[{
        paddingTop: insets.top + 12, paddingHorizontal: spacing[5], paddingBottom: spacing[4],
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: colors.background,
        borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border,
      }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' }]}
        >
          <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[typography.h2, { color: colors.textPrimary, marginLeft: spacing[4] }]}>
          More Settings
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[{ paddingHorizontal: spacing[5], paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ paddingTop: spacing[5] }}>
          <Text style={[typography.body, { color: colors.textTertiary, marginBottom: spacing[5], lineHeight: 22 }]}>
            Set your broker's GMT offset to ensure session times are calculated correctly.
          </Text>
          <Input
            label="Broker GMT Offset"
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

        {/* Danger zone */}
        <Text style={[typography.labelSm, { color: colors.textTertiary, marginTop: spacing[8], marginBottom: spacing[2] }]}>
          DANGER ZONE
        </Text>
        <Card style={{ marginBottom: spacing[5] }}>
          <TouchableOpacity
            onPress={handleDeleteAccount}
            activeOpacity={0.75}
            style={[{
              flexDirection: 'row', alignItems: 'center',
              paddingVertical: spacing[4],
            }]}
          >
            <View style={[{
              width: 36, height: 36, borderRadius: 10,
              backgroundColor: colors.errorSubtle,
              alignItems: 'center', justifyContent: 'center', marginRight: spacing[3],
            }]}>
              <Ionicons name="trash-outline" size={18} color={colors.error} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[typography.body, { color: colors.error }]}>
                Delete Account
              </Text>
              <Text style={[typography.caption, { color: colors.textTertiary, marginTop: 2 }]}>
                Permanently delete account and all trading data
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
          </TouchableOpacity>
        </Card>

        <Text style={[typography.caption, { color: colors.textTertiary, textAlign: 'center', marginTop: spacing[4] }]}>
          Tradenal v1.0.0
        </Text>
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
              label="Password"
              placeholder="Enter your current password"
              value={deletePassword}
              onChangeText={setDeletePassword}
              isPassword
              leftIcon={<Ionicons name="lock-closed-outline" size={18} color={colors.textTertiary} />}
            />

            <View style={[styles.modalActions, { marginTop: spacing[4] }]}>
              <Button
                label="Cancel"
                variant="ghost"
                onPress={() => setDeleteModalVisible(false)}
                style={{ flex: 1, marginRight: spacing[2] }}
              />
              <Button
                label="Delete"
                variant="danger"
                onPress={handleConfirmDelete}
                loading={deletingAccount}
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
