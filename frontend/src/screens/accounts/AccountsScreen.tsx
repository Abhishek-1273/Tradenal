import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Modal,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { ScreenHeader } from '../../components/common/ScreenHeader';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import {
  useAccounts,
  useCreateAccount,
  useUpdateAccount,
  useSetDefaultAccount,
  useDeleteAccount,
} from '../../hooks/useAccounts';
import { useAccountStore } from '../../store/account.store';
import { Account, AccountType } from '../../types';

export const AccountsScreen: React.FC = () => {
  const { colors, typography, spacing, radii } = useTheme();
  const insets = useSafeAreaInsets();

  const { activeAccount, setActiveAccount } = useAccountStore();
  const { data: accounts = [], isLoading: isFetching } = useAccounts();

  const createMutation = useCreateAccount();
  const setDefaultMutation = useSetDefaultAccount();
  const deleteMutation = useDeleteAccount();

  // Form State
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [name, setName] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('personal');
  const [broker, setBroker] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [startingBalance, setStartingBalance] = useState('');

  const updateMutation = useUpdateAccount(editingAccount?._id || '');

  const openAddModal = () => {
    setEditingAccount(null);
    setName('');
    setAccountType('personal');
    setBroker('');
    setCurrency('USD');
    setStartingBalance('');
    setFormModalVisible(true);
  };

  const openEditModal = (account: Account) => {
    setEditingAccount(account);
    setName(account.name);
    setAccountType(account.accountType);
    setBroker(account.broker || '');
    setCurrency(account.currency);
    setStartingBalance(String(account.startingBalance));
    setFormModalVisible(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Account name is required');
      return;
    }
    const balanceNum = parseFloat(startingBalance) || 0;
    if (balanceNum < 0) {
      Alert.alert('Error', 'Starting balance cannot be negative');
      return;
    }

    try {
      if (editingAccount) {
        await updateMutation.mutateAsync({
          name,
          accountType,
          broker: broker.trim() || undefined,
          currency,
          startingBalance: balanceNum,
        });
      } else {
        await createMutation.mutateAsync({
          name,
          accountType,
          broker: broker.trim() || undefined,
          currency,
          startingBalance: balanceNum,
        });
      }
      setFormModalVisible(false);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to save account');
    }
  };

  const handleDelete = (account: Account) => {
    if (account.isDefault) {
      Alert.alert('Cannot Delete', 'You cannot delete your default trading account.');
      return;
    }

    Alert.alert(
      'Delete Account',
      `Are you sure you want to delete "${account.name}"? All trade data associated with this account might become inaccessible.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMutation.mutateAsync(account._id);
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to delete account');
            }
          },
        },
      ]
    );
  };

  const handleSetDefault = async (account: Account) => {
    try {
      await setDefaultMutation.mutateAsync(account._id);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to set default account');
    }
  };

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'propFirmChallenge':
        return 'trophy';
      case 'fundedAccount':
        return 'shield-checkmark';
      case 'demo':
        return 'flask';
      default:
        return 'wallet';
    }
  };

  const getAccountLabel = (type: string) => {
    switch (type) {
      case 'propFirmChallenge':
        return 'Prop Challenge';
      case 'fundedAccount':
        return 'Funded Account';
      case 'demo':
        return 'Demo Account';
      default:
        return 'Personal Account';
    }
  };

  const formatBalance = (balance: number, curr: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: curr || 'USD',
    }).format(balance);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title="Trading Accounts"
        subtitle="Manage challenges, funded and personal portfolios"
        showBack
        rightAction={{
          icon: 'add',
          onPress: openAddModal,
        }}
      />

      {isFetching && accounts.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={accounts}
          keyExtractor={(item) => item._id}
          contentContainerStyle={[
            styles.listContainer,
            { paddingHorizontal: spacing[5], paddingBottom: insets.bottom + spacing[5] },
          ]}
          renderItem={({ item }) => {
            const isActive = activeAccount?._id === item._id;
            return (
              <Card
                style={{
                  ...styles.accountCard,
                  borderColor: isActive ? colors.primary : colors.border,
                  borderWidth: isActive ? 1.5 : 1,
                }}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.headerTitleContainer}>
                    <Ionicons
                      name={getAccountIcon(item.accountType) as any}
                      size={22}
                      color={isActive ? colors.primary : colors.textSecondary}
                      style={{ marginRight: spacing[3] }}
                    />

                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text
                          numberOfLines={1}
                          style={[
                            typography.h3,
                            { color: colors.textPrimary, flexShrink: 1 },
                          ]}
                        >
                          {item.name}
                        </Text>

                        {item.isDefault && (
                          <View
                            style={[
                              styles.defaultBadge,
                              {
                                backgroundColor: colors.successSubtle,
                                borderRadius: radii.full,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                typography.caption,
                                { color: colors.success, fontSize: 10 },
                              ]}
                            >
                              Default
                            </Text>
                          </View>
                        )}
                      </View>

                      <Text style={[typography.bodySm, { color: colors.textTertiary }]}>
                        {getAccountLabel(item.accountType)}
                        {item.broker ? ` • ${item.broker}` : ''}
                      </Text>
                    </View>
                  </View>

                  {!item.isDefault && (
                    <TouchableOpacity
                      onPress={() => handleSetDefault(item)}
                      activeOpacity={0.7}
                      style={[
                        styles.setDefaultButton,
                        {
                          backgroundColor: colors.primarySubtle,
                          borderColor: colors.primary + '35',
                          borderRadius: radii.full,
                        },
                      ]}
                    >
                      <Ionicons
                        name="star-outline"
                        size={13}
                        color={colors.primary}
                      />
                      <Text
                        style={[
                          typography.caption,
                          {
                            color: colors.primary,
                            fontSize: 10,
                            fontWeight: '600',
                          },
                        ]}
                      >
                        Set Default
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={[styles.cardDivider, { backgroundColor: colors.border }]} />

                <View style={styles.cardDetails}>
                  <View>
                    <Text style={[typography.caption, { color: colors.textTertiary }]}>
                      Starting Balance
                    </Text>
                    <Text style={[typography.h2, { color: colors.textPrimary, marginTop: 2 }]}>
                      {formatBalance(item.startingBalance, item.currency)}
                    </Text>
                  </View>

                  <View style={styles.actionsContainer}>

                    {!isActive && (
                      <TouchableOpacity
                        onPress={() => setActiveAccount(item)}
                        style={[
                          styles.actionButton,
                          { backgroundColor: colors.primarySubtle, borderRadius: radii.md },
                        ]}
                      >
                        <Text style={[typography.label, { color: colors.primary }]}>
                          Select
                        </Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      onPress={() => openEditModal(item)}
                      style={[
                        styles.iconActionButton,
                        { backgroundColor: colors.surfaceHighlight, borderRadius: radii.md },
                      ]}
                    >
                      <Ionicons name="create-outline" size={16} color={colors.textSecondary} />
                    </TouchableOpacity>

                    {!item.isDefault && (
                      <TouchableOpacity
                        onPress={() => handleDelete(item)}
                        style={[
                          styles.iconActionButton,
                          { backgroundColor: colors.errorSubtle, borderRadius: radii.md },
                        ]}
                      >
                        <Ionicons name="trash-outline" size={16} color={colors.error} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </Card >
            );
          }}
        />
      )}

      {/* Form Modal */}
      <Modal
        visible={formModalVisible}
        animationType="slide"
        onRequestClose={() => setFormModalVisible(false)}
      >
        <View style={[styles.formContainer, { backgroundColor: colors.background, paddingTop: Platform.OS === 'ios' ? 50 : 20 }]}>
          <View style={styles.formHeader}>
            <Text style={[typography.h2, { color: colors.textPrimary }]}>
              {editingAccount ? 'Edit Account' : 'New Trading Account'}
            </Text>
            <TouchableOpacity onPress={() => setFormModalVisible(false)}>
              <Ionicons name="close" size={28} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1, paddingHorizontal: spacing[5] }}>
            <Input
              label="Account Name"
              placeholder="e.g. FTMO Challenge $100k"
              value={name}
              onChangeText={setName}
              required
            />

            <Text style={[typography.label, { color: colors.textSecondary, marginBottom: spacing[2] }]}>
              Account Type
            </Text>
            <View style={styles.typeSelectorRow}>
              {(['personal', 'propFirmChallenge', 'fundedAccount', 'demo'] as const).map((type) => {
                const isSelected = accountType === type;
                return (
                  <TouchableOpacity
                    key={type}
                    onPress={() => setAccountType(type)}
                    style={[
                      styles.typeSelectorCard,
                      {
                        backgroundColor: isSelected ? colors.primarySubtle : colors.surfaceElevated,
                        borderColor: isSelected ? colors.primary : colors.border,
                        borderRadius: radii.md,
                        padding: spacing[3],
                        marginBottom: spacing[2],
                      },
                    ]}
                  >
                    <Ionicons
                      name={getAccountIcon(type) as any}
                      size={20}
                      color={isSelected ? colors.primary : colors.textSecondary}
                    />
                    <Text
                      style={[
                        typography.caption,
                        { color: colors.textPrimary, marginTop: 4, textAlign: 'center' },
                      ]}
                    >
                      {getAccountLabel(type).replace(' Account', '')}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Input
              label="Broker / Platform"
              placeholder="e.g. FTMO, IC Markets, MetaTrader"
              value={broker}
              onChangeText={setBroker}
            />

            <Input
              label="Currency"
              placeholder="USD, EUR, GBP"
              value={currency}
              onChangeText={setCurrency}
              maxLength={5}
              autoCapitalize="characters"
              required
            />

            <Input
              label="Starting Balance"
              placeholder="10000"
              value={startingBalance}
              onChangeText={setStartingBalance}
              keyboardType="numeric"
              required
            />

            <TouchableOpacity
              onPress={handleSave}
              style={[
                styles.saveButton,
                {
                  backgroundColor: colors.primary,
                  borderRadius: radii.lg,
                  paddingVertical: spacing[3.5],
                  marginTop: spacing[4],
                },
              ]}
            >
              {(createMutation.isPending || updateMutation.isPending) ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={[typography.h3, { color: '#fff' }]}>Save Account</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View >
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    paddingVertical: 16,
  },
  accountCard: {
    marginBottom: 16,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  defaultBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardDivider: {
    height: 1,
    marginVertical: 12,
  },
  cardDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconActionButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formContainer: {
    flex: 1,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  typeSelectorCard: {
    width: '48%',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  saveButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  setDefaultButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderWidth: 1,
    marginLeft: 8,
  },
});
