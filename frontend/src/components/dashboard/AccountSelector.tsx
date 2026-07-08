import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../theme';
import { useAccountStore } from '../../store/account.store';
import { Account } from '../../types';
import { AppNavProp } from '../../navigation/types';

export const AccountSelector: React.FC = () => {
  const { colors, typography, spacing, radii } = useTheme();
  const navigation = useNavigation<AppNavProp>();
  const [modalVisible, setModalVisible] = useState(false);

  const {
    accounts,
    activeAccount,
    fetchAccounts,
    setActiveAccount,
    isLoading,
  } = useAccountStore();

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleSelect = async (account: Account) => {
    await setActiveAccount(account);
    setModalVisible(false);
  };

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'propFirmChallenge':
        return 'trophy-outline';
      case 'fundedAccount':
        return 'shield-checkmark-outline';
      case 'demo':
        return 'flask-outline';
      default:
        return 'wallet-outline';
    }
  };

  const getAccountLabel = (type: string) => {
    switch (type) {
      case 'propFirmChallenge':
        return 'Prop Challenge';
      case 'fundedAccount':
        return 'Funded';
      case 'demo':
        return 'Demo';
      default:
        return 'Personal';
    }
  };

  const formatBalance = (balance: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(balance);
  };

  return (
    <View>
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        style={[
          styles.selectorButton,
          {
            backgroundColor: colors.surfaceElevated,
            borderColor: colors.border,
            paddingHorizontal: spacing[3],
            paddingVertical: spacing[2],
            borderRadius: radii.lg,
          },
        ]}
      >
        <Ionicons
          name={getAccountIcon(activeAccount?.accountType || '')}
          size={18}
          color={colors.primary}
          style={{ marginRight: spacing[2] }}
        />
        <View style={styles.textContainer}>
          <Text
            style={[typography.label, { color: colors.textPrimary }]}
            numberOfLines={1}
          >
            {activeAccount?.name || 'Loading Account...'}
          </Text>
          <Text style={[typography.caption, { color: colors.textTertiary }]}>
            {activeAccount
              ? `${getAccountLabel(activeAccount.accountType)} • ${formatBalance(
                  activeAccount.startingBalance,
                  activeAccount.currency
                )}`
              : 'Please select account'}
          </Text>
        </View>
        <Ionicons
          name="chevron-down"
          size={16}
          color={colors.textSecondary}
          style={{ marginLeft: spacing[2] }}
        />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.modalContent,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderRadius: radii.xl,
                    padding: spacing[5],
                  },
                ]}
              >
                <View style={styles.modalHeader}>
                  <Text style={[typography.h3, { color: colors.textPrimary }]}>
                    Select Trading Account
                  </Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Ionicons name="close" size={24} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                {isLoading && accounts.length === 0 ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={colors.primary} />
                  </View>
                ) : (
                  <FlatList
                    data={accounts}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={{ paddingVertical: spacing[2] }}
                    renderItem={({ item }) => {
                      const isSelected = activeAccount?._id === item._id;
                      return (
                        <TouchableOpacity
                          onPress={() => handleSelect(item)}
                          style={[
                            styles.accountItem,
                            {
                              backgroundColor: isSelected
                                ? colors.primarySubtle
                                : colors.surfaceElevated,
                              borderColor: isSelected ? colors.primary : colors.border,
                              borderRadius: radii.md,
                              padding: spacing[3],
                              marginBottom: spacing[2],
                            },
                          ]}
                        >
                          <View style={styles.accountItemHeader}>
                            <View style={styles.accountInfoLeft}>
                              <Ionicons
                                name={getAccountIcon(item.accountType)}
                                size={20}
                                color={isSelected ? colors.primary : colors.textSecondary}
                                style={{ marginRight: spacing[3] }}
                              />
                              <View>
                                <Text
                                  style={[
                                    typography.body,
                                    {
                                      color: colors.textPrimary,
                                      fontWeight: isSelected ? '600' : '400',
                                    },
                                  ]}
                                >
                                  {item.name}
                                </Text>
                                <Text
                                  style={[
                                    typography.caption,
                                    { color: colors.textTertiary, marginTop: 2 },
                                  ]}
                                >
                                  {getAccountLabel(item.accountType)}
                                  {item.isDefault && ' • Default'}
                                </Text>
                              </View>
                            </View>

                            <View style={styles.accountInfoRight}>
                              <Text
                                style={[
                                  typography.body,
                                  {
                                    color: isSelected ? colors.primary : colors.textPrimary,
                                    fontWeight: '600',
                                  },
                                ]}
                              >
                                {formatBalance(item.startingBalance, item.currency)}
                              </Text>
                            </View>
                          </View>
                        </TouchableOpacity>
                      );
                    }}
                  />
                )}

                <TouchableOpacity
                  onPress={() => {
                    setModalVisible(false);
                    navigation.navigate('Accounts' as any);
                  }}
                  style={[
                    styles.manageButton,
                    {
                      backgroundColor: colors.surfaceHighlight,
                      borderRadius: radii.md,
                      paddingVertical: spacing[3],
                      marginTop: spacing[2],
                    },
                  ]}
                >
                  <Ionicons
                    name="settings-outline"
                    size={16}
                    color={colors.textPrimary}
                    style={{ marginRight: spacing[2] }}
                  />
                  <Text style={[typography.label, { color: colors.textPrimary }]}>
                    Manage Accounts
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    maxWidth: 240,
  },
  textContainer: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxHeight: '80%',
    borderWidth: 1,
    elevation: 5,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  loadingContainer: {
    padding: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accountItem: {
    borderWidth: 1,
  },
  accountItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accountInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  accountInfoRight: {
    alignItems: 'flex-end',
  },
  manageButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
