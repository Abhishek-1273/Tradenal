import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, TextInput, Alert, Animated, LayoutChangeEvent, Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../theme';
import { useCreateTrade } from '../../hooks/useTrades';
import { useAccountStore } from '../../store/account.store';
import { tradesApi } from '../../api/trades.api';
import { Input } from '../../components/common/Input';
import { LoadingOverlay } from '../../components/common/LoadingOverlay';
import { SelectableCard } from '../../components/common/SelectableCard';
import { SelectableChip } from '../../components/common/SelectableChip';
import { DateField } from '../../components/common/DateField';
import { TimeField } from '../../components/common/TimeField';
import { ImageViewerModal } from '../../components/common/ImageViewerModal';
import { StepNavigationBar } from '../../components/common/StepNavigationBar';
import { EmotionCard } from '../../components/trade/EmotionCard';
import { DisciplineRow } from '../../components/trade/DisciplineRow';
import { RRCalculator } from '../../components/trade/RRCalculator';
import { tradeFormSchema, TradeFormData, tradeFormDefaults } from '../../utils/validators';
import { useToast } from '../../components/common/Toast';
import { useAuthStore } from '../../store/auth.store';
import { combineDateAndTime } from '../../utils/formatters';
import { getErrorMessage } from '../../api/client';
import {
  COMMON_PAIRS, QUICK_PAIRS, SESSIONS, SETUPS, RESULTS,
  EMOTIONS_BEFORE, EMOTIONS_DURING, EMOTIONS_AFTER, MISTAKES, DISCIPLINE_ITEMS, SUGGESTED_TAGS,
} from '../../constants';

const SECTIONS = ['Trade Info', 'Prices', 'Psychology', 'Notes'] as const;
type Section = typeof SECTIONS[number];

type LocalImage = { uri: string; name: string; mimeType: string; screenshotType: 'before' | 'after' | 'markup' };

export const AddTradeScreen: React.FC = () => {
  const { colors, typography, spacing, radii } = useTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const { mutateAsync: createTrade, isPending } = useCreateTrade();
  const [activeSection, setActiveSection] = useState<Section>('Trade Info');
  const [visited, setVisited] = useState<Set<Section>>(new Set());
  const [tagInput, setTagInput] = useState('');
  const [pairFocused, setPairFocused] = useState(false);
  const [localImages, setLocalImages] = useState<LocalImage[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const { activeAccount } = useAccountStore();

  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<TradeFormData>({
    resolver: zodResolver(tradeFormSchema),
    defaultValues: tradeFormDefaults,
  });

  const [ep, sl, tp, ex, tt, ls, rp, pairValue, reasonValue, notesValue, entryTimeValue] = watch([
    'entryPrice', 'stopLoss', 'takeProfit', 'exitPrice', 'tradeType', 'lotSize', 'riskPercent', 'pair', 'reasonForEntry', 'notes', 'entryTime',
  ]);

  // ── Animated tab indicator ──────────────────────────────────────────────
  const [tabBarWidth, setTabBarWidth] = useState(0);
  const indicatorAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(indicatorAnim, {
      toValue: SECTIONS.indexOf(activeSection),
      useNativeDriver: true,
      friction: 9,
      tension: 90,
    }).start();
  }, [activeSection]);

  const onTabBarLayout = (e: LayoutChangeEvent) => setTabBarWidth(e.nativeEvent.layout.width);
  const tabWidth = tabBarWidth / SECTIONS.length;
  const indicatorTranslate = indicatorAnim.interpolate({
    inputRange: [0, 1, 2, 3],
    outputRange: [0, tabWidth, tabWidth * 2, tabWidth * 3],
  });

  const goTo = (s: Section) => {
    setVisited((prev) => new Set(prev).add(activeSection));
    setActiveSection(s);
  };

  // ── Session auto-calculation ─────────────────────────────────────────────
  useEffect(() => {
    if (!entryTimeValue || !activeAccount) return;
    const [hStr, mStr] = entryTimeValue.split(':');
    const h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10);
    if (isNaN(h) || isNaN(m)) return;
    const totalMinutes = h * 60 + m;
    // Convert broker time to GMT
    const userOffset = useAuthStore.getState().user?.settings?.brokerGmtOffset ?? 0;
    const gmtOffset = activeAccount.brokerGmtOffset !== undefined && activeAccount.brokerGmtOffset !== 0
      ? activeAccount.brokerGmtOffset
      : userOffset;
    let gmtMinutes = totalMinutes - gmtOffset * 60;
    if (gmtMinutes < 0) gmtMinutes += 1440;
    if (gmtMinutes >= 1440) gmtMinutes -= 1440;
    const gmtH = Math.floor(gmtMinutes / 60);
    // Session windows in GMT hours
    const overlapping = gmtH >= 13 && gmtH < 17;
    const london = gmtH >= 8 && gmtH < 17;
    const newYork = gmtH >= 13 && gmtH < 22;
    const asian = gmtH >= 0 && gmtH < 9;
    let session: 'london' | 'newyork' | 'asian' | 'overlap' = 'london';
    if (overlapping) session = 'overlap';
    else if (london) session = 'london';
    else if (newYork) session = 'newyork';
    else if (asian) session = 'asian';
    setValue('session', session);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entryTimeValue]);

  const onInvalid = (formErrors: any) => {
    const errorKeys = Object.keys(formErrors);
    if (errorKeys.length > 0) {
      const firstField = errorKeys[0];
      const message = formErrors[firstField]?.message;
      showToast(`${firstField.toUpperCase()}: ${message}`, 'error');
    }
  };

  const onSubmit = async (data: TradeFormData) => {
    try {
      const trade = await createTrade({
        pair: data.pair, tradeType: data.tradeType, tradeDate: data.tradeDate,
        entryTime: combineDateAndTime(data.tradeDate, data.entryTime),
        exitTime: combineDateAndTime(data.tradeDate, data.exitTime),
        entryPrice: parseFloat(data.entryPrice),
        stopLoss: data.stopLoss ? parseFloat(data.stopLoss) : undefined,
        takeProfit: data.takeProfit ? parseFloat(data.takeProfit) : undefined,
        exitPrice: data.exitPrice ? parseFloat(data.exitPrice) : undefined,
        lotSize: parseFloat(data.lotSize), riskPercent: parseFloat(data.riskPercent),
        pnlAmount: data.pnlAmount ? parseFloat(data.pnlAmount) : undefined,
        session: data.session, setup: data.setup, customSetup: data.customSetup,
        result: data.result, emotionBefore: data.emotionBefore,
        emotionDuring: data.emotionDuring, emotionAfter: data.emotionAfter,
        confluenceCount: data.confluenceCount,
        followedPlan: data.followedPlan, overtraded: data.overtraded, movedSL: data.movedSL,
        movedTP: data.movedTP, revengeTrade: data.revengeTrade, newsTrade: data.newsTrade,
        checkedHigherTimeframe: data.checkedHigherTimeframe,
        waitedForConfirmation: data.waitedForConfirmation,
        sizedCorrectly: data.sizedCorrectly,
        withinDailyLossLimit: data.withinDailyLossLimit,
        singleTradeDominance: data.singleTradeDominance,
        mistakes: data.mistakes as any[], customMistake: data.customMistake,
        reasonForEntry: data.reasonForEntry, notes: data.notes, tags: data.tags, isFavorite: data.isFavorite,
      });

      // Upload any local images after the trade is created
      if (localImages.length > 0 && trade?._id) {
        setUploadingImages(true);
        try {
          await tradesApi.uploadScreenshots(
            trade._id,
            localImages.map((img) => ({ uri: img.uri, name: img.name, type: img.mimeType })),
            localImages.map((img) => img.screenshotType)
          );
        } catch (uploadErr) {
          showToast('Trade saved but some screenshots failed to upload.', 'error');
        } finally {
          setUploadingImages(false);
        }
      }

      showToast('Trade added successfully', 'success');
      navigation.goBack();
    } catch (err) { showToast(getErrorMessage(err), 'error'); }
  };

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showToast('Please allow access to your photo library.', 'error');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 10,
    });
    if (!result.canceled && result.assets) {
      const newImgs: LocalImage[] = result.assets.map((asset, idx) => ({
        uri: asset.uri,
        name: asset.fileName || `screenshot_${Date.now()}_${idx}.jpg`,
        mimeType: asset.mimeType || 'image/jpeg',
        screenshotType: 'before',
      }));
      setLocalImages((prev) => [...prev, ...newImgs].slice(0, 10));
    }
  };

  const captureImage = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      showToast('Please allow camera access.', 'error');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const newImg: LocalImage = {
        uri: asset.uri,
        name: asset.fileName || `screenshot_${Date.now()}.jpg`,
        mimeType: asset.mimeType || 'image/jpeg',
        screenshotType: 'before',
      };
      setLocalImages((prev) => [...prev, newImg].slice(0, 10));
    }
  };

  const removeImage = (idx: number) => {
    setLocalImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const cycleScreenshotType = (idx: number) => {
    const types: Array<'before' | 'after' | 'markup'> = ['before', 'after', 'markup'];
    setLocalImages((prev) => prev.map((img, i) => {
      if (i !== idx) return img;
      const nextType = types[(types.indexOf(img.screenshotType) + 1) % types.length];
      return { ...img, screenshotType: nextType };
    }));
  };

  const pairSuggestions = pairFocused && pairValue
    ? COMMON_PAIRS.filter((p) => p.startsWith(pairValue.toUpperCase()) && p !== pairValue.toUpperCase()).slice(0, 5)
    : [];

  const addTag = (raw: string, current: string[], onChange: (v: string[]) => void) => {
    const t = raw.trim();
    if (t && !current.map((c) => c.toLowerCase()).includes(t.toLowerCase())) {
      onChange([...current, t]);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: insets.top + 12, paddingHorizontal: spacing[5], backgroundColor: colors.surface, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.headerBtn, { backgroundColor: colors.surfaceElevated }]}>
              <Ionicons name="close" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
            <View style={{ alignItems: 'center' }}>
              <Text style={[typography.h3, { color: colors.textPrimary }]}>New Trade</Text>
              {useAccountStore.getState().activeAccount && (
                <Text style={[typography.caption, { color: colors.textTertiary, fontSize: 10 }]}>
                  saving to {useAccountStore.getState().activeAccount?.name}
                </Text>
              )}
            </View>
            <TouchableOpacity onPress={handleSubmit(onSubmit, onInvalid)} disabled={isPending} style={[styles.saveBtn, { backgroundColor: colors.primary }]}>
              <Text numberOfLines={1} style={[typography.label, { color: '#fff' }]}>{isPending ? 'Saving...' : 'Save'}</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.tabRow, { marginTop: spacing[3] }]} onLayout={onTabBarLayout}>
            {tabBarWidth > 0 && (
              <Animated.View
                style={[
                  styles.tabIndicator,
                  {
                    width: tabWidth,
                    backgroundColor: colors.primary,
                    transform: [{ translateX: indicatorTranslate }],
                  },
                ]}
              />
            )}
            {SECTIONS.map((s) => {
              const isActive = activeSection === s;
              const isDone = visited.has(s) && !isActive;
              return (
                <TouchableOpacity key={s} onPress={() => goTo(s)} style={styles.sectionTab} activeOpacity={0.7}>
                  {isDone && <Ionicons name="checkmark-circle" size={12} color={colors.success} style={{ marginRight: 3 }} />}
                  <Text numberOfLines={1} style={[typography.labelSm, { color: isActive ? colors.primary : colors.textTertiary, fontWeight: isActive ? '700' : '500' }]}>
                    {s}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={[{ paddingHorizontal: spacing[5], paddingBottom: spacing[6], paddingTop: spacing[4] }]}>

          {activeSection === 'Trade Info' && (
            <View>
              <Text style={[typography.h3, { color: colors.textPrimary, marginBottom: spacing[3] }]}>Pair & Type</Text>

              {/* Quick pair shortcuts */}
              <View style={[styles.quickPairRow, { marginBottom: spacing[3] }]}>
                {QUICK_PAIRS.map((pair) => {
                  const selected = watch('pair') === pair;
                  return (
                    <TouchableOpacity
                      key={pair}
                      onPress={() => setValue('pair', pair)}
                      style={[
                        styles.quickPairChip,
                        {
                          backgroundColor: selected ? colors.primary : colors.surfaceElevated,
                          borderColor: selected ? colors.primary : colors.border,
                          borderRadius: radii.md,
                        },
                      ]}
                    >
                      <Text style={[typography.labelSm, { color: selected ? '#fff' : colors.textSecondary }]}>{pair}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Searchable pair input */}
              <Controller control={control} name="pair" render={({ field: { onChange, value } }) => (
                <View style={{ marginBottom: spacing[4] }}>
                  <Input
                    label="Pair"
                    placeholder="Search e.g. XAUUSD"
                    value={value}
                    onChangeText={(t) => onChange(t.toUpperCase())}
                    onFocus={() => setPairFocused(true)}
                    onBlur={() => setTimeout(() => setPairFocused(false), 150)}
                    error={errors.pair?.message}
                    autoCapitalize="characters"
                    leftIcon={<Ionicons name="search-outline" size={17} color={colors.textTertiary} />}
                    required
                  />
                  {pairSuggestions.length > 0 && (
                    <View style={[styles.suggestBox, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, borderRadius: radii.md }]}>
                      {pairSuggestions.map((s) => (
                        <TouchableOpacity
                          key={s}
                          onPress={() => { onChange(s); setPairFocused(false); }}
                          style={[styles.suggestRow, { borderBottomColor: colors.border }]}
                        >
                          <Ionicons name="pricetag-outline" size={14} color={colors.textTertiary} style={{ marginRight: 8 }} />
                          <Text style={[typography.bodySm, { color: colors.textPrimary }]}>{s}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              )} />

              <Controller control={control} name="tradeType" render={({ field: { onChange, value } }) => (
                <View style={{ marginBottom: spacing[4] }}>
                  <Text style={[typography.label, { color: colors.textSecondary, marginBottom: spacing[2] }]}>Direction <Text style={{ color: colors.error }}>*</Text></Text>
                  <View style={[styles.typeRow, { gap: spacing[3] }]}>
                    {(['buy', 'sell'] as const).map((t) => {
                      const selected = value === t;
                      const accent = t === 'buy' ? colors.success : colors.error;
                      return (
                        <TouchableOpacity
                          key={t}
                          onPress={() => onChange(t)}
                          activeOpacity={0.8}
                          style={[
                            styles.directionCard,
                            {
                              backgroundColor: selected ? accent + '14' : colors.surfaceElevated,
                              borderColor: selected ? accent : colors.border,
                              borderWidth: selected ? 1.5 : 1,
                              borderRadius: radii.lg,
                              padding: spacing[4],
                            },
                          ]}
                        >
                          {selected && (
                            <View style={styles.directionCheck}>
                              <Ionicons name="checkmark-circle" size={16} color={accent} />
                            </View>
                          )}
                          <View style={[styles.directionIconWrap, { backgroundColor: selected ? accent + '20' : colors.surfaceHighlight }]}>
                            <Ionicons name={t === 'buy' ? 'trending-up' : 'trending-down'} size={22} color={selected ? accent : colors.textTertiary} />
                          </View>
                          <Text style={[typography.h3, { color: selected ? accent : colors.textSecondary, marginTop: spacing[2] }]}>{t.toUpperCase()}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )} />

              <Controller control={control} name="tradeDate" render={({ field: { onChange, value } }) => (
                <DateField label="Trade Date" value={value} onChange={onChange} error={errors.tradeDate?.message} required />
              )} />

              <View style={[styles.row, { gap: spacing[3] }]}>
                <Controller control={control} name="entryTime" render={({ field: { onChange, value } }) => (
                  <TimeField label="Entry Time" value={value} onChange={onChange} error={errors.entryTime?.message} />
                )} />
                <Controller control={control} name="exitTime" render={({ field: { onChange, value } }) => (
                  <TimeField label="Exit Time" value={value} onChange={onChange} error={errors.exitTime?.message} />
                )} />
              </View>

              <Controller control={control} name="session" render={({ field: { onChange, value } }) => (
                <View style={{ marginBottom: spacing[4] }}>
                  <Text style={[typography.label, { color: colors.textSecondary, marginBottom: spacing[2] }]}>Session <Text style={{ color: colors.error }}>*</Text></Text>
                  <View style={styles.grid2}>
                    {SESSIONS.map((s) => (
                      <SelectableCard
                        key={s.value}
                        label={s.label}
                        icon={s.icon as any}
                        selected={value === s.value}
                        onPress={() => onChange(s.value)}
                        style={{ width: '48.5%', marginBottom: spacing[2] }}
                      />
                    ))}
                  </View>
                </View>
              )} />

              <Controller control={control} name="setup" render={({ field: { onChange, value } }) => (
                <View style={{ marginBottom: spacing[4] }}>
                  <Text style={[typography.label, { color: colors.textSecondary, marginBottom: spacing[2] }]}>Setup</Text>
                  <View style={styles.grid3}>
                    {SETUPS.map((s) => (
                      <SelectableCard
                        key={s.value}
                        label={s.label}
                        icon={s.icon as any}
                        selected={value === s.value}
                        onPress={() => onChange(s.value)}
                        size="sm"
                        style={{ width: '32%', marginBottom: spacing[2] }}
                      />
                    ))}
                  </View>
                </View>
              )} />

              <Controller control={control} name="result" render={({ field: { onChange, value } }) => (
                <View style={{ marginBottom: spacing[2] }}>
                  <Text style={[typography.label, { color: colors.textSecondary, marginBottom: spacing[2] }]}>Result <Text style={{ color: colors.error }}>*</Text></Text>
                  <View style={styles.grid2}>
                    {RESULTS.map((r) => (
                      <SelectableCard
                        key={r.value}
                        label={r.label}
                        icon={r.icon as any}
                        selected={value === r.value}
                        onPress={() => onChange(r.value)}
                        color={(colors as any)[r.colorKey]}
                        style={{ width: '48.5%', marginBottom: spacing[2] }}
                      />
                    ))}
                  </View>
                </View>
              )} />
            </View>
          )}

          {activeSection === 'Prices' && (
            <View>
              <Text style={[typography.h3, { color: colors.textPrimary, marginBottom: spacing[4] }]}>Execution Details</Text>
              <RRCalculator tradeType={tt as any} entryPrice={ep} stopLoss={sl} takeProfit={tp} exitPrice={ex} lotSize={ls} riskPercent={rp} />

              <View style={[styles.row, { gap: spacing[3] }]}>
                <Controller control={control} name="entryPrice" render={({ field: { onChange, value } }) => (
                  <Input label="Entry Price" placeholder="0.00000" value={value} onChangeText={onChange} error={errors.entryPrice?.message} keyboardType="decimal-pad" containerStyle={{ flex: 1 }} leftIcon={<Ionicons name="log-in-outline" size={16} color={colors.textTertiary} />} required />
                )} />
                <Controller control={control} name="exitPrice" render={({ field: { onChange, value } }) => (
                  <Input label="Exit Price" placeholder="0.00000" value={value} onChangeText={onChange} error={errors.exitPrice?.message} keyboardType="decimal-pad" containerStyle={{ flex: 1 }} leftIcon={<Ionicons name="log-out-outline" size={16} color={colors.textTertiary} />} />
                )} />
              </View>
              <View style={[styles.row, { gap: spacing[3] }]}>
                <Controller control={control} name="stopLoss" render={({ field: { onChange, value } }) => (
                  <Input label="Stop Loss" placeholder="0.00000" value={value} onChangeText={onChange} error={errors.stopLoss?.message} keyboardType="decimal-pad" containerStyle={{ flex: 1 }} leftIcon={<Ionicons name="shield-outline" size={16} color={colors.textTertiary} />} required />
                )} />
                <Controller control={control} name="takeProfit" render={({ field: { onChange, value } }) => (
                  <Input label="Take Profit" placeholder="0.00000" value={value} onChangeText={onChange} error={errors.takeProfit?.message} keyboardType="decimal-pad" containerStyle={{ flex: 1 }} leftIcon={<Ionicons name="flag-outline" size={16} color={colors.textTertiary} />} required />
                )} />
              </View>
              <View style={[styles.row, { gap: spacing[3] }]}>
                <Controller control={control} name="lotSize" render={({ field: { onChange, value } }) => (
                  <Input label="Lot Size" placeholder="0.10" value={value} onChangeText={onChange} error={errors.lotSize?.message} keyboardType="decimal-pad" containerStyle={{ flex: 1 }} leftIcon={<Ionicons name="layers-outline" size={16} color={colors.textTertiary} />} required />
                )} />
                <Controller control={control} name="riskPercent" render={({ field: { onChange, value } }) => (
                  <Input label="Risk %" placeholder="1.0" value={value} onChangeText={onChange} error={errors.riskPercent?.message} keyboardType="decimal-pad" containerStyle={{ flex: 1 }} leftIcon={<Ionicons name="speedometer-outline" size={16} color={colors.textTertiary} />} required />
                )} />
              </View>

              <Controller control={control} name="pnlAmount" render={({ field: { onChange, value } }) => (
                <Input
                  label={`PnL Amount (${useAccountStore.getState().activeAccount?.currency || 'USD'})`}
                  placeholder="e.g. 150.00 or -50.00 (Optional)"
                  value={value}
                  onChangeText={onChange}
                  error={errors.pnlAmount?.message}
                  keyboardType="numeric"
                  leftIcon={<Ionicons name="cash-outline" size={16} color={colors.textTertiary} />}
                />
              )} />

              <Controller control={control} name="reasonForEntry" render={({ field: { onChange, value } }) => (
                <View style={{ marginBottom: spacing[2] }}>
                  <View style={[styles.labelWithIcon, { marginBottom: spacing[2] }]}>
                    <Ionicons name="bulb-outline" size={14} color={colors.textTertiary} style={{ marginRight: 5 }} />
                    <Text style={[typography.label, { color: colors.textSecondary }]}>Reason For Entry</Text>
                  </View>
                  <TextInput
                    style={[typography.body, { color: colors.textPrimary, backgroundColor: colors.surfaceElevated, borderColor: colors.border, borderWidth: 1, borderRadius: radii.md, padding: spacing[4], height: 100, textAlignVertical: 'top' }]}
                    placeholder="What signal or strategy rules triggered this trade?"
                    placeholderTextColor={colors.textDisabled}
                    multiline numberOfLines={4}
                    value={value} onChangeText={onChange}
                    maxLength={1000}
                  />
                  <Text style={[typography.caption, { color: colors.textTertiary, textAlign: 'right', marginTop: 3 }]}>
                    {(reasonValue ?? '').length}/1000
                  </Text>
                </View>
              )} />
            </View>
          )}

          {activeSection === 'Psychology' && (
            <View>
              <Text style={[typography.h3, { color: colors.textPrimary, marginBottom: spacing[4] }]}>Psychology</Text>

              <Controller control={control} name="emotionBefore" render={({ field: { onChange, value } }) => (
                <View style={{ marginBottom: spacing[4] }}>
                  <Text style={[typography.label, { color: colors.textSecondary, marginBottom: spacing[2] }]}>Emotion Before Trade</Text>
                  <View style={styles.grid3}>
                    {EMOTIONS_BEFORE.map((e) => (
                      <EmotionCard
                        key={e.value}
                        label={e.label}
                        icon={e.icon as any}
                        selected={value === e.value}
                        onPress={() => onChange(e.value)}
                        style={{ width: '32%', marginBottom: spacing[2] }}
                      />
                    ))}
                  </View>
                </View>
              )} />

              <Controller control={control} name="emotionDuring" render={({ field: { onChange, value } }) => (
                <View style={{ marginBottom: spacing[4] }}>
                  <Text style={[typography.label, { color: colors.textSecondary, marginBottom: spacing[2] }]}>Emotion During Trade</Text>
                  <View style={styles.grid3}>
                    {EMOTIONS_DURING.map((e) => (
                      <EmotionCard
                        key={e.value}
                        label={e.label}
                        icon={e.icon as any}
                        selected={value === e.value}
                        onPress={() => onChange(e.value === value ? undefined : e.value)}
                        style={{ width: '32%', marginBottom: spacing[2] }}
                      />
                    ))}
                  </View>
                </View>
              )} />

              <Controller control={control} name="emotionAfter" render={({ field: { onChange, value } }) => (
                <View style={{ marginBottom: spacing[3] }}>
                  <Text style={[typography.label, { color: colors.textSecondary, marginBottom: spacing[2] }]}>Emotion After Trade</Text>
                  <View style={styles.grid3}>
                    {EMOTIONS_AFTER.map((e) => (
                      <EmotionCard
                        key={e.value}
                        label={e.label}
                        icon={e.icon as any}
                        selected={value === e.value}
                        onPress={() => onChange(e.value)}
                        style={{ width: '32%', marginBottom: spacing[2] }}
                      />
                    ))}
                  </View>
                </View>
              )} />



              <Text style={[typography.label, { color: colors.textSecondary, marginBottom: spacing[3] }]}>Discipline Checklist</Text>
              {DISCIPLINE_ITEMS.map((item) => (
                <Controller key={item.name} control={control} name={item.name as any} render={({ field: { onChange, value } }) => (
                  <DisciplineRow label={item.label} subtitle={item.sub} icon={item.icon as any} value={value as boolean} onChange={onChange} warnWhenOn={item.warn} />
                )} />
              ))}

              <Controller control={control} name="mistakes" render={({ field: { onChange, value } }) => (
                <View style={{ marginTop: spacing[4], marginBottom: spacing[2] }}>
                  <Text style={[typography.label, { color: colors.textSecondary, marginBottom: spacing[2] }]}>Mistakes</Text>
                  <View style={styles.chipWrap}>
                    {MISTAKES.map((m) => {
                      const selected = (value ?? []).includes(m.value);
                      return (
                        <SelectableChip
                          key={m.value}
                          label={m.label}
                          icon={m.icon as any}
                          selected={selected}
                          onPress={() => onChange(selected ? value.filter((v: string) => v !== m.value) : [...value, m.value])}
                          style={{ marginRight: spacing[2], marginBottom: spacing[2] }}
                        />
                      );
                    })}
                  </View>
                </View>
              )} />
            </View>
          )}

          {activeSection === 'Notes' && (
            <View>
              <Text style={[typography.h3, { color: colors.textPrimary, marginBottom: spacing[4] }]}>Notes & Tags</Text>

              {/* ── Screenshots picker ── */}
              <View style={{ marginBottom: spacing[4] }}>
                <View style={[styles.labelWithIcon, { marginBottom: spacing[2] }]}>
                  <Ionicons name="images-outline" size={14} color={colors.textTertiary} style={{ marginRight: 5 }} />
                  <Text style={[typography.label, { color: colors.textSecondary }]}>Screenshots</Text>
                </View>
                {/* Thumbnail strip */}
                {localImages.length > 0 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing[2] }}>
                    <View style={{ flexDirection: 'row', gap: spacing[2] }}>
                      {localImages.map((img, idx) => (
                        <View key={`${img.uri}-${idx}`} style={{ width: 100, height: 100, borderRadius: radii.md, overflow: 'hidden', backgroundColor: colors.surfaceElevated }}>
                          <TouchableOpacity activeOpacity={0.9} onPress={() => setSelectedImage(img.uri)} style={StyleSheet.absoluteFill}>
                            <Image source={{ uri: img.uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                          </TouchableOpacity>
                          {/* Remove button */}
                          <TouchableOpacity
                            onPress={() => removeImage(idx)}
                            style={[{ position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' }]}
                          >
                            <Ionicons name="close" size={12} color="#fff" />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  </ScrollView>
                )}
                {/* Pick / capture buttons */}
                <View style={{ flexDirection: 'row', gap: spacing[2] }}>
                  <TouchableOpacity
                    onPress={pickImages}
                    style={[{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, paddingVertical: spacing[3], gap: spacing[2] }]}
                  >
                    <Ionicons name="image-outline" size={18} color={colors.primary} />
                    <Text style={[typography.labelSm, { color: colors.primary }]}>Gallery</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={captureImage}
                    style={[{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, paddingVertical: spacing[3], gap: spacing[2] }]}
                  >
                    <Ionicons name="camera-outline" size={18} color={colors.primary} />
                    <Text style={[typography.labelSm, { color: colors.primary }]}>Camera</Text>
                  </TouchableOpacity>
                </View>
                <Text style={[typography.caption, { color: colors.textTertiary, marginTop: spacing[1] }]}>
                  Max 10 images.
                </Text>
              </View>
              <Controller control={control} name="notes" render={({ field: { onChange, value } }) => (
                <View style={{ marginBottom: spacing[4] }}>
                  <View style={[styles.labelWithIcon, { marginBottom: spacing[2] }]}>
                    <Ionicons name="document-text-outline" size={14} color={colors.textTertiary} style={{ marginRight: 5 }} />
                    <Text style={[typography.label, { color: colors.textSecondary }]}>Trade Notes</Text>
                  </View>
                  <TextInput
                    style={[typography.body, { color: colors.textPrimary, backgroundColor: colors.surfaceElevated, borderColor: colors.border, borderWidth: 1, borderRadius: radii.md, padding: spacing[4], minHeight: 150, textAlignVertical: 'top' }]}
                    placeholder="Market context, what went well, lessons for next time..."
                    placeholderTextColor={colors.textDisabled}
                    multiline numberOfLines={8}
                    value={value} onChangeText={onChange}
                    maxLength={5000}
                  />
                  <Text style={[typography.caption, { color: colors.textTertiary, textAlign: 'right', marginTop: 3 }]}>
                    {(notesValue ?? '').length}/5000
                  </Text>
                </View>
              )} />

              <Controller control={control} name="tags" render={({ field: { onChange, value } }) => (
                <View style={{ marginBottom: spacing[4] }}>
                  <Text style={[typography.label, { color: colors.textSecondary, marginBottom: spacing[2] }]}>Tags</Text>
                  <View style={[styles.tagBox, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, borderRadius: radii.md, padding: spacing[2] }]}>
                    {value.map((tag: string) => (
                      <TouchableOpacity key={tag} onPress={() => onChange(value.filter((t: string) => t !== tag))} style={[styles.tagChip, { backgroundColor: colors.primarySubtle, borderRadius: radii.sm }]}>
                        <Text style={[typography.caption, { color: colors.primary }]}>#{tag}</Text>
                        <Ionicons name="close" size={12} color={colors.primary} style={{ marginLeft: 3 }} />
                      </TouchableOpacity>
                    ))}
                    <TextInput
                      style={[typography.body, { color: colors.textPrimary, flex: 1, minWidth: 100, padding: spacing[1] }]}
                      placeholder="Add tag..."
                      placeholderTextColor={colors.textDisabled}
                      value={tagInput}
                      onChangeText={setTagInput}
                      onSubmitEditing={() => { addTag(tagInput, value, onChange); setTagInput(''); }}
                      returnKeyType="done" blurOnSubmit={false}
                    />
                  </View>

                  <View style={[styles.chipWrap, { marginTop: spacing[2] }]}>
                    {SUGGESTED_TAGS.filter((t) => !value.map((v: string) => v.toLowerCase()).includes(t.toLowerCase())).map((t) => (
                      <SelectableChip
                        key={t}
                        label={t}
                        icon="add-outline"
                        selected={false}
                        onPress={() => addTag(t, value, onChange)}
                        style={{ marginRight: spacing[2], marginBottom: spacing[2] }}
                      />
                    ))}
                  </View>
                </View>
              )} />

              <Controller control={control} name="isFavorite" render={({ field: { onChange, value } }) => (
                <TouchableOpacity
                  onPress={() => onChange(!value)}
                  activeOpacity={0.8}
                  style={[
                    styles.favoriteCard,
                    {
                      backgroundColor: value ? '#F59E0B14' : colors.surfaceElevated,
                      borderColor: value ? '#F59E0B' : colors.border,
                      borderWidth: value ? 1.5 : 1,
                      borderRadius: radii.md,
                      padding: spacing[3],
                    },
                  ]}
                >
                  <Ionicons name={value ? 'star' : 'star-outline'} size={20} color={value ? '#F59E0B' : colors.textTertiary} />
                  <View style={{ flex: 1, marginLeft: spacing[3] }}>
                    <Text style={[typography.labelSm, { color: colors.textPrimary }]}>Mark as Favorite</Text>
                    <Text style={[typography.caption, { color: colors.textTertiary, marginTop: 1 }]}>Save to favorites for quick reference</Text>
                  </View>
                </TouchableOpacity>
              )} />
            </View>
          )}
        </ScrollView>

        <StepNavigationBar
          onBack={activeSection === 'Trade Info' ? undefined : () => goTo(
            activeSection === 'Prices' ? 'Trade Info' : activeSection === 'Psychology' ? 'Prices' : 'Psychology'
          )}
          onNext={
            activeSection === 'Notes'
              ? handleSubmit(onSubmit)
              : () => goTo(
                  activeSection === 'Trade Info' ? 'Prices' : activeSection === 'Prices' ? 'Psychology' : 'Notes'
                )
          }
          nextLabel={
            activeSection === 'Trade Info' ? 'Next: Prices'
              : activeSection === 'Prices' ? 'Next: Psychology'
              : activeSection === 'Psychology' ? 'Next: Notes'
              : 'Save Trade'
          }
          nextIcon={activeSection === 'Notes' ? 'check' : 'arrow'}
          loading={activeSection === 'Notes' && isPending}
        />
      </View>

      <ImageViewerModal
        visible={!!selectedImage}
        imageUrl={selectedImage}
        onClose={() => setSelectedImage(null)}
      />

      <LoadingOverlay
        visible={isPending || uploadingImages}
        fullScreen
        message={uploadingImages ? 'Uploading screenshots...' : 'Saving trade...'}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingBottom: 0 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12 },
  headerBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  saveBtn: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20 },
  tabRow: { flexDirection: 'row', position: 'relative' },
  sectionTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingBottom: 10 },
  tabIndicator: { position: 'absolute', bottom: 0, height: 2.5, borderRadius: 2 },
  row: { flexDirection: 'row' },
  typeRow: { flexDirection: 'row' },
  directionCard: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  directionCheck: { position: 'absolute', top: 8, right: 8 },
  directionIconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  quickPairRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  quickPairChip: { paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1 },
  suggestBox: { borderWidth: 1, marginTop: 6, overflow: 'hidden' },
  suggestRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  grid2: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  grid3: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap' },
  labelWithIcon: { flexDirection: 'row', alignItems: 'center' },
  tagBox: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, borderWidth: 1 },
  tagChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4 },
  favoriteCard: { flexDirection: 'row', alignItems: 'center' },
});
