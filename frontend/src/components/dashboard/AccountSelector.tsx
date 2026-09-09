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
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../theme';
import { useAccountStore } from '../../store/account.store';
import { Account } from '../../types';
import { AppNavProp } from '../../navigation/types';

interface AccountSelectorProps {
  variant?: 'compact' | 'card' | 'header' | 'pill' | 'icon';
  iconColor?: string;
  buttonBgColor?: string;
  buttonBorderColor?: string;
}

export const AccountSelector: React.FC<AccountSelectorProps> = ({
  variant = 'card',
  iconColor,
  buttonBgColor,
  buttonBorderColor,
}) => {
  const { colors, typography, spacing, radii, isDark } = useTheme();
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

  const getAccountTheme = (type: string) => {
    const dark = isDark;
    switch (type) {
      case 'propFirmChallenge':
        return {
          icon: 'trophy' as const,
          color: dark ? '#E2E8F0' : '#1E293B',
          label: 'Prop Challenge',
          bg: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
        };
      case 'fundedAccount':
        return {
          icon: 'shield-checkmark' as const,
          color: dark ? '#CBD5E1' : '#334155',
          label: 'Funded',
          bg: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
        };
      case 'demo':
        return {
          icon: 'flask' as const,
          color: dark ? '#94A3B8' : '#475569',
          label: 'Demo',
          bg: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
        };
      default:
        return {
          icon: 'wallet' as const,
          color: dark ? '#E2E8F0' : '#1E293B',
          label: 'Personal',
          bg: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
        };
    }
  };

  const formatBalance = (balance: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(balance);
  };

  return (
    <View style={variant === 'icon' ? styles.iconOnlyContainer : variant === 'pill' ? styles.pillContainer : variant === 'header' ? styles.headerContainer : { width: '100%' }}>
      {variant === 'icon' ? (
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          activeOpacity={0.7}
          style={[
            styles.iconOnlyButton,
            {
              backgroundColor: buttonBgColor || (isDark ? 'rgba(255,255,255,0.08)' : '#F1F5F9'),
              borderColor: buttonBorderColor || 'transparent',
              borderWidth: buttonBorderColor ? 1 : 0,
            },
          ]}
        >
          <Ionicons
            name="wallet-outline"
            size={18}
            color={iconColor || colors.textPrimary}
          />
        </TouchableOpacity>
      ) : variant === 'pill' ? (
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          activeOpacity={0.75}
          style={[
            styles.pillButton,
            {
              backgroundColor: isDark ? 'rgba(99, 102, 241, 0.15)' : '#EEF2FF',
              borderColor: isDark ? 'rgba(99, 102, 241, 0.3)' : '#C7D2FE',
            },
          ]}
        >
          <Ionicons
            name={getAccountIcon(activeAccount?.accountType || 'propFirmChallenge')}
            size={14}
            color={colors.primary}
            style={{ marginRight: 5 }}
          />
          <Text
            style={[styles.pillText, { color: colors.textPrimary }]}
            numberOfLines={1}
          >
            {activeAccount?.name || 'My First Funded Acc'}
          </Text>
          <Ionicons
            name="chevron-down"
            size={12}
            color={colors.textTertiary}
            style={{ marginLeft: 4 }}
          />
        </TouchableOpacity>
      ) : variant === 'header' ? (
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          activeOpacity={0.75}
          style={styles.headerButton}
        >
          <View
            style={[
              styles.headerFolderIconWrap,
              {
                borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#E2E8F0',
                backgroundColor: isDark ? colors.surfaceElevated : '#FFFFFF',
              },
            ]}
          >
            <Ionicons name="folder-outline" size={17} color={colors.primary} />
          </View>
          <View style={styles.headerTextWrap}>
            <Text style={[styles.headerAccountTitle, { color: colors.textPrimary }]} numberOfLines={1}>
              {activeAccount?.name || 'My First Funded Acc'}
            </Text>
            <Text
              style={[
                styles.headerAccountSubtitle,
                { color: isDark ? '#93C5FD' : '#2563EB' },
              ]}
              numberOfLines={1}
            >
              {activeAccount
                ? `${getAccountLabel(activeAccount.accountType)} • ${formatBalance(
                    activeAccount.startingBalance,
                    activeAccount.currency
                  )}`
                : 'Prop Challenge • $6,000.00'}
            </Text>
          </View>
        </TouchableOpacity>
      ) : variant === 'card' ? (
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          activeOpacity={0.8}
          style={[
            styles.cardButton,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: 16,
            },
          ]}
        >
          <View
            style={[
              styles.folderIconWrap,
              {
                borderColor: isDark ? 'rgba(99, 102, 241, 0.25)' : '#C7D2FE',
                backgroundColor: isDark ? 'rgba(99, 102, 241, 0.15)' : '#EEF2FF',
              },
            ]}
          >
            <Ionicons name="trophy-outline" size={17} color="#6366F1" />
          </View>
          <View style={styles.cardTextWrap}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]} numberOfLines={1}>
              {activeAccount?.name || 'My First Funded Acc'}
            </Text>
            <Text style={[styles.cardSubtitle, { color: colors.textTertiary }]} numberOfLines={1}>
              {activeAccount
                ? `${getAccountLabel(activeAccount.accountType)} • ${formatBalance(
                    activeAccount.startingBalance,
                    activeAccount.currency
                  )}`
                : 'Prop Challenge • $6,000.00'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
        </TouchableOpacity>
      ) : (
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
      )}

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.modalContent,
                  {
                    backgroundColor: colors.surface,
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : colors.border,
                  },
                ]}
              >
                {/* Top Drag Handle Indicator */}
                <View
                  style={[
                    styles.dragHandle,
                    { backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : '#CBD5E1' },
                  ]}
                />

                {/* Modal Header */}
                <View style={styles.modalHeader}>
                  <View style={styles.modalHeaderTitleGroup}>
                    <View
                      style={[
                        styles.headerIconBox,
                        {
                          backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.07)',
                          borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)',
                        },
                      ]}
                    >
                      <Ionicons name="wallet" size={20} color={colors.textPrimary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.modalTitleText, { color: colors.textPrimary }]}>
                        Select Trading Account
                      </Text>
                      <Text style={[styles.modalSubtitleText, { color: colors.textTertiary }]}>
                        {accounts.length} {accounts.length === 1 ? 'Portfolio' : 'Portfolios'} • Tap to switch
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={() => setModalVisible(false)}
                    activeOpacity={0.7}
                    style={[
                      styles.closeBtn,
                      {
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9',
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#E2E8F0',
                      },
                    ]}
                  >
                    <Ionicons name="close" size={18} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                {isLoading && accounts.length === 0 ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={{ color: colors.textTertiary, marginTop: 10, fontSize: 12 }}>
                      Loading accounts...
                    </Text>
                  </View>
                ) : (
                  <FlatList
                    data={accounts}
                    keyExtractor={(item) => item._id}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingVertical: 4 }}
                    renderItem={({ item }) => {
                      const isSelected = activeAccount?._id === item._id;
                      const theme = getAccountTheme(item.accountType);

                      return (
                        <TouchableOpacity
                          onPress={() => handleSelect(item)}
                          activeOpacity={0.75}
                          style={[
                            styles.accountItem,
                            {
                              backgroundColor: isSelected
                                ? (isDark ? 'rgba(16, 185, 129, 0.1)' : '#F0FDF4')
                                : (isDark ? 'rgba(255,255,255,0.03)' : colors.surfaceElevated),
                              borderColor: isSelected
                                ? '#10B981'
                                : (isDark ? 'rgba(255,255,255,0.08)' : colors.border),
                              borderWidth: isSelected ? 1.5 : 1,
                            },
                          ]}
                        >
                          {/* Left: Themed Icon Box */}
                          <View
                            style={[
                              styles.accountIconSquircle,
                              {
                                backgroundColor: theme.bg,
                                borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)',
                              },
                            ]}
                          >
                            <Ionicons name={theme.icon} size={20} color={theme.color} />
                          </View>

                          {/* Middle: Account Details */}
                          <View style={styles.accountMiddleInfo}>
                            <View style={styles.accountNameRow}>
                              <Text
                                style={[
                                  styles.accountNameText,
                                  { color: colors.textPrimary, fontWeight: isSelected ? '800' : '600' },
                                ]}
                                numberOfLines={1}
                              >
                                {item.name}
                              </Text>
                              {isSelected && (
                                <View style={styles.activeTagBadge}>
                                  <View style={styles.activeDot} />
                                  <Text style={styles.activeTagText}>ACTIVE</Text>
                                </View>
                              )}
                            </View>

                            <View style={styles.accountSubMetaRow}>
                              <View
                                style={[
                                  styles.typeBadge,
                                  {
                                    backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                                    borderColor: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.1)',
                                  },
                                ]}
                              >
                                <Text style={[styles.typeBadgeText, { color: theme.color }]}>
                                  {theme.label}
                                </Text>
                              </View>
                              <Text style={[styles.currencyMetaText, { color: colors.textTertiary }]}>
                                {item.currency || 'USD'}
                              </Text>
                              {item.isDefault && (
                                <View style={[styles.defaultBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F1F5F9' }]}>
                                  <Text style={[styles.defaultBadgeText, { color: colors.textTertiary }]}>Default</Text>
                                </View>
                              )}
                            </View>
                          </View>

                          {/* Right: Balance & Indicator */}
                          <View style={styles.accountRightInfo}>
                            <Text
                              style={[
                                styles.accountBalanceText,
                                { color: isSelected ? '#10B981' : colors.textPrimary },
                              ]}
                            >
                              {formatBalance(item.startingBalance, item.currency)}
                            </Text>
                            {isSelected ? (
                              <Ionicons name="checkmark-circle" size={20} color="#10B981" style={{ marginTop: 2 }} />
                            ) : (
                              <View
                                style={[
                                  styles.unselectedCircle,
                                  { borderColor: isDark ? 'rgba(255,255,255,0.2)' : '#CBD5E1' },
                                ]}
                              />
                            )}
                          </View>
                        </TouchableOpacity>
                      );
                    }}
                  />
                )}

                {/* Bottom Action: Manage Accounts */}
                <View style={[
                  styles.manageCard,
                  {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : colors.surfaceElevated,
                    borderColor: isDark ? 'rgba(255,255,255,0.12)' : colors.border,
                  },
                ]}>
                  <TouchableOpacity
                    onPress={() => {
                      setModalVisible(false);
                      navigation.navigate('Accounts' as any);
                    }}
                    activeOpacity={0.8}
                    style={styles.manageButton}
                  >
                    <View style={[
                      styles.manageIconBox,
                      { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.07)' },
                    ]}>
                      <Ionicons name="settings-outline" size={17} color={colors.textPrimary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.manageTitleText, { color: colors.textPrimary }]}>
                        Manage Accounts
                      </Text>
                      <Text style={[styles.manageSubText, { color: colors.textTertiary }]}>
                        Add, edit & switch accounts
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  iconOnlyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconOnlyButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 5.5,
    borderRadius: 18,
    borderWidth: 1,
    maxWidth: 155,
  },
  pillText: {
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif' }),
    includeFontPadding: false,
    fontSize: 11.5,
    fontWeight: '700',
    maxWidth: 105,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerFolderIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextWrap: {
    flex: 1,
    marginLeft: 10,
    justifyContent: 'center',
  },
  headerAccountTitle: {
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif' }),
    includeFontPadding: false,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  headerAccountSubtitle: {
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif' }),
    includeFontPadding: false,
    fontSize: 11.5,
    fontWeight: '500',
    marginTop: 2,
  },
  cardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    width: '100%',
  },
  folderIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTextWrap: {
    flex: 1,
    marginLeft: 12,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif' }),
    includeFontPadding: false,
    fontSize: 14.5,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  cardSubtitle: {
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif' }),
    includeFontPadding: false,
    fontSize: 11.5,
    fontWeight: '500',
    marginTop: 2,
  },
  typeBadge: {
    paddingHorizontal: 7,
    paddingVertical: 1.5,
    borderRadius: 6,
    borderWidth: 1,
  },
  typeBadgeText: {
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif' }),
    includeFontPadding: false,
    fontSize: 10,
    fontWeight: '700',
  },
  currencyMetaText: {
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif' }),
    includeFontPadding: false,
    fontSize: 11,
    fontWeight: '600',
  },
  defaultBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  defaultBadgeText: {
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif' }),
    includeFontPadding: false,
    fontSize: 9.5,
    fontWeight: '600',
  },
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
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    width: '100%',
    maxHeight: '82%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.select({ ios: 36, android: 24 }),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 20,
  },
  dragHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
    paddingBottom: 4,
  },
  modalHeaderTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
    gap: 12,
  },
  headerIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitleText: {
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif' }),
    includeFontPadding: false,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  modalSubtitleText: {
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif' }),
    includeFontPadding: false,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    padding: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    marginBottom: 10,
  },
  accountIconSquircle: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  accountMiddleInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  accountNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
    gap: 6,
  },
  accountNameText: {
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif' }),
    includeFontPadding: false,
    fontSize: 14.5,
    letterSpacing: -0.2,
    flexShrink: 1,
  },
  activeTagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#10B981',
  },
  activeTagText: {
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif' }),
    includeFontPadding: false,
    fontSize: 9,
    fontWeight: '800',
    color: '#10B981',
    letterSpacing: 0.5,
  },
  accountSubMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  accountRightInfo: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginLeft: 10,
    gap: 4,
  },
  accountBalanceText: {
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif' }),
    includeFontPadding: false,
    fontSize: 14.5,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  unselectedCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    marginTop: 2,
  },
  manageCard: {
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 12,
    overflow: 'hidden',
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  manageIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  manageTitleText: {
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif' }),
    includeFontPadding: false,
    fontSize: 13,
    fontWeight: '700',
  },
  manageSubText: {
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif' }),
    includeFontPadding: false,
    fontSize: 10.5,
    fontWeight: '500',
    marginTop: 1,
  },
});
