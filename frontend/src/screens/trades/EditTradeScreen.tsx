import React, { useState, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useQueryClient } from '@tanstack/react-query';
import { tradesApi } from '../../api/trades.api';
import { BASE_URL } from '../../api/client';
import { ImageViewerModal } from '../../components/common/ImageViewerModal';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { useTrade, useUpdateTrade } from '../../hooks/useTrades';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { SelectPills, CheckRow } from '../../components/common/SelectPills';
import { CascadingSetupSelector } from '../../components/trade/CascadingSetupSelector';
import { DisciplineChecklist } from '../../components/trade/DisciplineChecklist';
import { StructuredMistakesSelector } from '../../components/trade/StructuredMistakesSelector';
import { RRCalculator } from '../../components/trade/RRCalculator';
import { ExecutionGradeCard } from '../../components/trade/ExecutionGradeCard';
import { GuidedTradeNotes } from '../../components/trade/GuidedTradeNotes';
import { FinalActionBar } from '../../components/trade/FinalActionBar';
import { LoadingOverlay } from '../../components/common/LoadingOverlay';
import { tradeFormSchema, TradeFormData } from '../../utils/validators';
import { useAccountStore } from '../../store/account.store';
import { calculateRiskCapAudit } from '../../utils/riskCap';
import { calculateExecutionGrade } from '../../utils/executionGrade';
import { serializeTradeNotes, parseTradeNotes } from '../../utils/tradeNotes';
import { combineDateAndTime } from '../../utils/formatters';
import { getErrorMessage } from '../../api/client';
import { useToast } from '../../components/common/Toast';
import { EditTradeRouteProp, AppNavProp } from '../../navigation/types';
import { SESSIONS, SETUPS, RESULTS, EMOTIONS_BEFORE, EMOTIONS_DURING, EMOTIONS_AFTER, MISTAKES } from '../../constants';
import dayjs from 'dayjs';

export const EditTradeScreen: React.FC = () => {
  const { colors, typography, spacing, radii, isDark } = useTheme();
  const navigation = useNavigation<AppNavProp>();
  const route = useRoute<EditTradeRouteProp>();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const { data: trade, isLoading } = useTrade(route.params.tradeId);
  const { mutateAsync: updateTrade, isPending: updatingText } = useUpdateTrade(route.params.tradeId);
  const queryClient = useQueryClient();

  interface LocalImage {
    uri: string;
    name: string;
    mimeType: string;
    screenshotType: 'before' | 'after' | 'markup';
  }
  const [localImages, setLocalImages] = useState<LocalImage[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const isPending = updatingText || uploadingImages;

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
      const newImgs = result.assets.map((asset, idx) => ({
        uri: asset.uri,
        name: asset.fileName || `screenshot_${Date.now()}_${idx}.jpg`,
        mimeType: asset.mimeType || 'image/jpeg',
        screenshotType: 'before' as const,
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
      const newImg = {
        uri: asset.uri,
        name: asset.fileName || `screenshot_${Date.now()}.jpg`,
        mimeType: asset.mimeType || 'image/jpeg',
        screenshotType: 'before' as const,
      };
      setLocalImages((prev) => [...prev, newImg].slice(0, 10));
    }
  };

  const removeLocalImage = (idx: number) => {
    setLocalImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleDeleteExistingScreenshot = (publicId: string) => {
    if (!trade) return;
    Alert.alert(
      'Delete Screenshot',
      'Are you sure you want to permanently delete this screenshot?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await tradesApi.deleteScreenshot(trade._id, publicId);
              queryClient.invalidateQueries({ queryKey: ['trades'] });
              showToast('Screenshot deleted successfully', 'success');
            } catch (err: any) {
              showToast(err.message || 'Failed to delete screenshot', 'error');
            }
          },
        },
      ]
    );
  };

  const { control, handleSubmit, watch, formState: { errors } } = useForm<TradeFormData>({
    resolver: zodResolver(tradeFormSchema),
    values: trade ? {
      pair: trade.pair,
      tradeType: trade.tradeType,
      tradeDate: dayjs(trade.tradeDate).format('YYYY-MM-DD'),
      entryTime: trade.entryTime ? dayjs(trade.entryTime).format('HH:mm') : '',
      exitTime: trade.exitTime ? dayjs(trade.exitTime).format('HH:mm') : '',
      entryPrice: trade.entryPrice.toString(),
      stopLoss: trade.stopLoss != null ? trade.stopLoss.toString() : '',
      takeProfit: trade.takeProfit != null ? trade.takeProfit.toString() : '',
      exitPrice: trade.exitPrice?.toString() ?? '',
      lotSize: trade.lotSize.toString(),
      riskPercent: trade.riskPercent.toString(),
      pnlAmount: trade.pnlAmount?.toString() ?? '',
      session: trade.session,
      strategy: trade.strategy,
      setup: trade.setup,
      confluences: trade.confluences || [],
      customSetup: trade.customSetup ?? '',
      result: trade.result,
      emotionBefore: trade.emotionBefore,
      emotionDuring: trade.emotionDuring,
      emotionAfter: trade.emotionAfter,
      confluenceCount: trade.confluenceCount ?? 0,
      followedPlan: trade.followedPlan,
      overtraded: trade.overtraded,
      movedSL: trade.movedSL,
      movedTP: trade.movedTP,
      revengeTrade: trade.revengeTrade,
      newsTrade: trade.newsTrade,
      checkedHigherTimeframe: trade.checkedHigherTimeframe ?? false,
      waitedForConfirmation: trade.waitedForConfirmation ?? false,
      sizedCorrectly: trade.sizedCorrectly ?? true,
      withinDailyLossLimit: trade.withinDailyLossLimit ?? true,
      singleTradeDominance: trade.singleTradeDominance ?? true,
      checklist: (trade.checklist && trade.checklist.length > 0)
        ? trade.checklist
        : [
            ...(trade.followedPlan ? ['plan_followed'] : []),
            ...(!trade.overtraded ? ['one_and_done'] : []),
            ...(!trade.movedSL ? ['zero_sl_widening'] : []),
            ...(!trade.revengeTrade ? ['not_revenge_trade'] : []),
            ...(!trade.newsTrade ? ['news_window_clear'] : []),
            ...(trade.checkedHigherTimeframe ? ['pre_market_routine'] : []),
            ...(trade.waitedForConfirmation ? ['candle_close_confirmation'] : []),
            ...(trade.sizedCorrectly !== false ? ['risk_cap'] : []),
          ],
      mistakes: trade.mistakes as string[],
      customMistake: trade.customMistake ?? '',
      reasonForEntry: trade.reasonForEntry ?? '',
      notes: trade.notes ?? '',
      keyTakeaway: trade.keyTakeaway ?? parseTradeNotes(trade.notes).keyTakeaway,
      whatWentWell: trade.whatWentWell ?? parseTradeNotes(trade.notes).whatWentWell,
      whatToImprove: trade.whatToImprove ?? parseTradeNotes(trade.notes).whatToImprove,
      tags: trade.tags,
      isFavorite: trade.isFavorite,
    } : undefined,
  });

  const scrollViewRef = useRef<ScrollView>(null);
  const checklistSectionY = useRef<number>(0);

  const { activeAccount } = useAccountStore();
  const [
    ep, sl, tp, ex, tt, ls, rp, pnlValStr, checklistVal, mistakesVal,
  ] = watch([
    'entryPrice','stopLoss','takeProfit','exitPrice','tradeType','lotSize','riskPercent','pnlAmount','checklist','mistakes',
  ]);
  const riskAudit = calculateRiskCapAudit(activeAccount, rp, pnlValStr);
  const gradeResult = calculateExecutionGrade(checklistVal, mistakesVal, isDark);

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
      let pnlVal = data.pnlAmount ? parseFloat(data.pnlAmount) : undefined;
      if (pnlVal !== undefined && !isNaN(pnlVal)) {
        if (data.result === 'loss' && pnlVal > 0) pnlVal = -pnlVal;
        if ((data.result === 'win' || data.result === 'partialWin') && pnlVal < 0) pnlVal = Math.abs(pnlVal);
        if (data.result === 'breakeven') pnlVal = 0;
      }

      const compiledNotes = serializeTradeNotes(
        {
          keyTakeaway: data.keyTakeaway,
          whatWentWell: data.whatWentWell,
          whatToImprove: data.whatToImprove,
        },
        data.notes
      );

      await updateTrade({
        pair: data.pair, tradeType: data.tradeType, tradeDate: data.tradeDate,
        entryTime: combineDateAndTime(data.tradeDate, data.entryTime),
        exitTime: combineDateAndTime(data.tradeDate, data.exitTime),
        entryPrice: parseFloat(data.entryPrice),
        stopLoss: data.stopLoss ? parseFloat(data.stopLoss) : undefined,
        takeProfit: data.takeProfit ? parseFloat(data.takeProfit) : undefined,
        exitPrice: data.exitPrice ? parseFloat(data.exitPrice) : undefined,
        lotSize: parseFloat(data.lotSize), riskPercent: parseFloat(data.riskPercent),
        pnlAmount: pnlVal,
        session: data.session,
        strategy: data.strategy,
        setup: data.setup === 'custom' && data.customSetup ? data.customSetup.trim() : data.setup,
        confluences: data.confluences,
        customSetup: data.customSetup,
        result: data.result, emotionBefore: data.emotionBefore,
        emotionDuring: data.emotionDuring, emotionAfter: data.emotionAfter,
        confluenceCount: data.confluenceCount,
        checklist: data.checklist || [],
        followedPlan: data.checklist ? data.checklist.includes('plan_followed') : data.followedPlan,
        overtraded: data.checklist ? !data.checklist.includes('one_and_done') : data.overtraded,
        movedSL: data.checklist ? !data.checklist.includes('zero_sl_widening') : data.movedSL,
        movedTP: data.movedTP,
        revengeTrade: data.checklist ? !data.checklist.includes('not_revenge_trade') : data.revengeTrade,
        newsTrade: data.checklist ? !data.checklist.includes('news_window_clear') : data.newsTrade,
        checkedHigherTimeframe: data.checklist ? data.checklist.includes('pre_market_routine') : data.checkedHigherTimeframe,
        waitedForConfirmation: data.checklist ? data.checklist.includes('candle_close_confirmation') : data.waitedForConfirmation,
        sizedCorrectly: data.checklist ? data.checklist.includes('risk_cap') : data.sizedCorrectly,
        withinDailyLossLimit: data.checklist ? data.checklist.includes('risk_cap') : data.withinDailyLossLimit,
        singleTradeDominance: data.checklist ? data.checklist.includes('one_and_done') : data.singleTradeDominance,
        mistakes: data.mistakes as any[], customMistake: data.customMistake,
        reasonForEntry: data.reasonForEntry,
        notes: compiledNotes || data.notes,
        keyTakeaway: data.keyTakeaway,
        whatWentWell: data.whatWentWell,
        whatToImprove: data.whatToImprove,
        tags: data.tags, isFavorite: data.isFavorite,
      });

      // Upload new local images if selected
      if (localImages.length > 0 && trade?._id) {
        setUploadingImages(true);
        try {
          await tradesApi.uploadScreenshots(
            trade._id,
            localImages.map((img) => ({ uri: img.uri, name: img.name, type: img.mimeType })),
            localImages.map((img) => img.screenshotType)
          );
          queryClient.invalidateQueries({ queryKey: ['trades'] });
        } catch (uploadErr) {
          showToast('Trade updated but some screenshots failed to upload.', 'error');
        } finally {
          setUploadingImages(false);
        }
      }

      showToast('Trade updated successfully', 'success');
      navigation.goBack();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  if (isLoading) return <LoadingOverlay fullScreen message="Loading trade..." />;
  if (!trade) return null;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={[{ flex: 1 }, { backgroundColor: colors.background }]}>
        <View style={[{
          paddingTop: insets.top + 12, paddingHorizontal: spacing[5], paddingBottom: spacing[3],
          backgroundColor: colors.surface, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border,
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' }]}>
            <Ionicons name="close" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[typography.h3, { color: colors.textPrimary }]}>Edit Trade</Text>
          <TouchableOpacity onPress={handleSubmit(onSubmit, onInvalid)} disabled={isPending} style={[{ backgroundColor: colors.primary, borderRadius: 20, paddingHorizontal: spacing[4], paddingVertical: spacing[2] }]}>
            <Text style={[typography.label, { color: '#fff' }]}>{isPending ? 'Saving...' : 'Save'}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView ref={scrollViewRef} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={[{ paddingHorizontal: spacing[5], paddingTop: spacing[4], paddingBottom: insets.bottom + 40 }]}>
          <RRCalculator tradeType={tt as any} entryPrice={ep} stopLoss={sl} takeProfit={tp} exitPrice={ex} lotSize={ls} riskPercent={rp} />

          <Controller control={control} name="pair" render={({ field: { onChange, value } }) => (
            <Input label="Pair" value={value} onChangeText={(t) => onChange(t.toUpperCase())} error={errors.pair?.message} autoCapitalize="characters" required />
          )} />

          <Controller control={control} name="tradeType" render={({ field: { onChange, value } }) => (
            <View style={[{ marginBottom: spacing[4] }]}>
              <Text style={[typography.label, { color: colors.textSecondary, marginBottom: spacing[2] }]}>Direction</Text>
              <View style={[{ flexDirection: 'row', gap: spacing[3] }]}>
                {(['buy', 'sell'] as const).map((t) => (
                  <TouchableOpacity key={t} onPress={() => onChange(t)} style={[{ flex: 1, alignItems: 'center', padding: spacing[3], backgroundColor: value === t ? (t === 'buy' ? colors.successSubtle : colors.errorSubtle) : colors.surfaceElevated, borderColor: value === t ? (t === 'buy' ? colors.success : colors.error) : colors.border, borderWidth: 1.5, borderRadius: radii.lg }]}>
                    <Text style={[typography.h3, { color: value === t ? (t === 'buy' ? colors.success : colors.error) : colors.textSecondary }]}>{t.toUpperCase()}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )} />

          <Controller control={control} name="tradeDate" render={({ field: { onChange, value } }) => (
            <Input label="Trade Date" placeholder="YYYY-MM-DD" value={value} onChangeText={onChange} error={errors.tradeDate?.message} />
          )} />

          <View style={[{ flexDirection: 'row', gap: spacing[3] }]}>
            <Controller control={control} name="entryPrice" render={({ field: { onChange, value } }) => (
              <Input label="Entry" value={value} onChangeText={onChange} error={errors.entryPrice?.message} keyboardType="decimal-pad" containerStyle={{ flex: 1 }} />
            )} />
            <Controller control={control} name="exitPrice" render={({ field: { onChange, value } }) => (
              <Input label="Exit" value={value} onChangeText={onChange} keyboardType="decimal-pad" containerStyle={{ flex: 1 }} />
            )} />
          </View>

          <View style={[{ flexDirection: 'row', gap: spacing[3] }]}>
            <Controller control={control} name="stopLoss" render={({ field: { onChange, value } }) => (
              <Input label="Stop Loss" value={value} onChangeText={onChange} error={errors.stopLoss?.message} keyboardType="decimal-pad" containerStyle={{ flex: 1 }} />
            )} />
            <Controller control={control} name="takeProfit" render={({ field: { onChange, value } }) => (
              <Input label="Take Profit" value={value} onChangeText={onChange} error={errors.takeProfit?.message} keyboardType="decimal-pad" containerStyle={{ flex: 1 }} />
            )} />
          </View>

          <View style={[{ flexDirection: 'row', gap: spacing[3] }]}>
            <Controller control={control} name="lotSize" render={({ field: { onChange, value } }) => (
              <Input label="Lot Size" value={value} onChangeText={onChange} keyboardType="decimal-pad" containerStyle={{ flex: 1 }} />
            )} />
            <Controller control={control} name="riskPercent" render={({ field: { onChange, value } }) => (
              <Input label="Risk %" value={value} onChangeText={onChange} keyboardType="decimal-pad" containerStyle={{ flex: 1 }} />
            )} />
          </View>

          {/* Dynamic ≤ 1% Account Risk Cap Helper */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              backgroundColor: riskAudit.isViolated
                ? 'rgba(239, 68, 68, 0.10)'
                : 'rgba(16, 185, 129, 0.08)',
              borderColor: riskAudit.isViolated ? 'rgba(239, 68, 68, 0.35)' : 'rgba(16, 185, 129, 0.25)',
              borderWidth: 1,
              borderRadius: radii.sm,
              paddingVertical: 7,
              paddingHorizontal: 10,
              marginBottom: spacing[3],
            }}
          >
            <Ionicons
              name={riskAudit.isViolated ? 'alert-circle' : 'shield-checkmark'}
              size={15}
              color={riskAudit.isViolated ? '#EF4444' : '#10B981'}
            />
            <Text
              style={{
                fontSize: 11.5,
                fontWeight: '600',
                color: riskAudit.isViolated ? '#EF4444' : colors.textSecondary,
                flex: 1,
              }}
            >
              {riskAudit.isViolated
                ? `⚠️ VIOLATION: ${riskAudit.violationReason}`
                : `≤ 1% Account Risk Cap: Max ${riskAudit.currencySymbol}${riskAudit.maxOnePercentRisk.toFixed(0)} on ${riskAudit.currencySymbol}${riskAudit.accountBalance.toLocaleString()} starting balance.`}
            </Text>
          </View>

          <Controller control={control} name="pnlAmount" render={({ field: { onChange, value } }) => {
            const currentStr = value || '';
            const isNegative = currentStr.startsWith('-');
            const handleToggleSign = (makeNegative: boolean) => {
              const clean = currentStr.replace(/^-/, '');
              if (!clean) {
                onChange(makeNegative ? '-' : '');
              } else {
                onChange(makeNegative ? `-${clean}` : clean);
              }
            };
            return (
              <View style={{ marginBottom: spacing[3] }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[1.5] }}>
                  <Text style={[typography.label, { color: colors.textSecondary }]}>
                    PnL Amount
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <TouchableOpacity
                      onPress={() => handleToggleSign(false)}
                      activeOpacity={0.8}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 3,
                        borderRadius: 6,
                        backgroundColor: !isNegative && currentStr ? colors.successSubtle : colors.surfaceElevated,
                        borderColor: !isNegative && currentStr ? colors.success : colors.border,
                        borderWidth: 1,
                      }}
                    >
                      <Text style={{ fontSize: 11, fontWeight: '700', color: !isNegative && currentStr ? colors.success : colors.textTertiary }}>
                        + Profit
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleToggleSign(true)}
                      activeOpacity={0.8}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 3,
                        borderRadius: 6,
                        backgroundColor: isNegative ? colors.errorSubtle : colors.surfaceElevated,
                        borderColor: isNegative ? colors.error : colors.border,
                        borderWidth: 1,
                      }}
                    >
                      <Text style={{ fontSize: 11, fontWeight: '700', color: isNegative ? colors.error : colors.textTertiary }}>
                        - Loss
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <Input
                  placeholder={isNegative ? "-50.00" : "150.00 (Optional)"}
                  value={value}
                  onChangeText={onChange}
                  error={errors.pnlAmount?.message}
                  keyboardType="decimal-pad"
                />
              </View>
            );
          }} />

          <Controller control={control} name="session" render={({ field: { onChange, value } }) => (
            <SelectPills label="Session" required options={SESSIONS} value={value} onChange={onChange} columns={2} style={{ marginBottom: spacing[4] }} />
          )} />
          <Controller
            control={control}
            name="strategy"
            render={({ field: { onChange: onStrategyChange, value: selectedStrategy } }) => (
              <Controller
                control={control}
                name="setup"
                render={({ field: { onChange: onSetupChange, value: selectedSetup } }) => (
                  <Controller
                    control={control}
                    name="confluences"
                    render={({ field: { onChange: onConfluencesChange, value: selectedConfluences } }) => (
                      <Controller
                        control={control}
                        name="customSetup"
                        render={({ field: { onChange: onCustomSetupChange, value: customSetupText } }) => (
                          <CascadingSetupSelector
                            selectedStrategy={selectedStrategy}
                            selectedSetup={selectedSetup}
                            selectedConfluences={selectedConfluences}
                            customSetupText={customSetupText}
                            onStrategyChange={onStrategyChange}
                            onSetupChange={onSetupChange}
                            onConfluencesChange={onConfluencesChange}
                            onCustomSetupChange={onCustomSetupChange}
                          />
                        )}
                      />
                    )}
                  />
                )}
              />
            )}
          />
          <Controller control={control} name="result" render={({ field: { onChange, value } }) => (
            <SelectPills label="Result" required options={RESULTS.map((r) => ({ ...r }))} value={value} onChange={onChange} columns={2} style={{ marginBottom: spacing[4] }} />
          )} />
          <Controller control={control} name="emotionBefore" render={({ field: { onChange, value } }) => (
            <SelectPills label="Emotion Before" options={EMOTIONS_BEFORE} value={value} onChange={onChange} columns={2} style={{ marginBottom: spacing[4] }} />
          )} />
          <Controller control={control} name="emotionDuring" render={({ field: { onChange, value } }) => (
            <SelectPills label="Emotion During" options={EMOTIONS_DURING} value={value} onChange={onChange} columns={2} style={{ marginBottom: spacing[4] }} />
          )} />
          <Controller control={control} name="emotionAfter" render={({ field: { onChange, value } }) => (
            <SelectPills label="Emotion After" options={EMOTIONS_AFTER} value={value} onChange={onChange} columns={2} style={{ marginBottom: spacing[4] }} />
          )} />

          <View
            style={{ marginBottom: spacing[4] }}
            onLayout={(e) => { checklistSectionY.current = e.nativeEvent.layout.y; }}
          >
            <Text style={[typography.label, { color: colors.textSecondary, marginBottom: spacing[2] }]}>
              Discipline Checklist
            </Text>
            <Controller
              control={control}
              name="checklist"
              render={({ field: { onChange, value } }) => (
                <DisciplineChecklist value={value || []} onChange={onChange} />
              )}
            />
          </View>

          <Controller
            control={control}
            name="mistakes"
            render={({ field: { onChange: onMistakesChange, value: mistakesValue } }) => (
              <Controller
                control={control}
                name="customMistake"
                render={({ field: { onChange: onCustomChange, value: customVal } }) => (
                  <View style={{ marginBottom: spacing[4] }}>
                    <Text style={[typography.label, { color: colors.textSecondary, marginBottom: spacing[2.5] }]}>
                      Mistakes & Execution Errors
                    </Text>
                    <StructuredMistakesSelector
                      value={mistakesValue || []}
                      onChange={onMistakesChange}
                      customMistake={customVal || ''}
                      onCustomMistakeChange={onCustomChange}
                    />
                  </View>
                )}
              />
            )}
          />

          {/* ── Guided Trade Notes & Post-Mortem (Structured Reflection) ── */}
          <Controller
            control={control}
            name="keyTakeaway"
            render={({ field: { onChange: onKeyChange, value: keyValue } }) => (
              <Controller
                control={control}
                name="whatWentWell"
                render={({ field: { onChange: onWellChange, value: wellValue } }) => (
                  <Controller
                    control={control}
                    name="whatToImprove"
                    render={({ field: { onChange: onImproveChange, value: improveValue } }) => (
                      <GuidedTradeNotes
                        keyTakeaway={keyValue || ''}
                        whatWentWell={wellValue || ''}
                        whatToImprove={improveValue || ''}
                        onKeyTakeawayChange={onKeyChange}
                        onWhatWentWellChange={onWellChange}
                        onWhatToImproveChange={onImproveChange}
                        style={{ marginTop: spacing[2] }}
                      />
                    )}
                  />
                )}
              />
            )}
          />

          {/* ── Deterministic Locked Execution Grade Card ── */}
          <ExecutionGradeCard
            checklist={checklistVal}
            mistakes={mistakesVal}
            onNavigateToTab={() => scrollViewRef.current?.scrollTo({ y: Math.max(0, checklistSectionY.current - 20), animated: true })}
            style={{ marginBottom: spacing[3], marginTop: spacing[2] }}
          />

          {/* ── Dynamic ≤ 1% Account Risk Cap Audit ── */}
          <View
            style={{
              backgroundColor: riskAudit.isViolated
                ? isDark ? 'rgba(239, 68, 68, 0.12)' : '#FEF2F2'
                : isDark ? 'rgba(16, 185, 129, 0.08)' : '#F0FDF4',
              borderColor: riskAudit.isViolated ? '#EF4444' : 'rgba(16, 185, 129, 0.3)',
              borderWidth: 1.5,
              borderRadius: radii.lg,
              padding: spacing[3.5],
              marginTop: spacing[2],
              marginBottom: spacing[4],
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons
                  name={riskAudit.isViolated ? 'alert-circle' : 'shield-checkmark'}
                  size={18}
                  color={riskAudit.isViolated ? '#EF4444' : '#10B981'}
                />
                <Text style={[typography.labelSm, { color: colors.textPrimary, fontWeight: '700' }]}>
                  ≤ 1% Account Risk Cap Audit
                </Text>
              </View>
              <View
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 2.5,
                  borderRadius: 6,
                  backgroundColor: riskAudit.isViolated ? 'rgba(239, 68, 68, 0.18)' : 'rgba(16, 185, 129, 0.18)',
                  borderColor: riskAudit.isViolated ? '#EF4444' : '#10B981',
                  borderWidth: 1,
                }}
              >
                <Text
                  style={{
                    fontSize: 10.5,
                    fontWeight: '800',
                    color: riskAudit.isViolated ? '#EF4444' : '#10B981',
                  }}
                >
                  {riskAudit.isViolated ? 'CAP VIOLATED' : 'CAP RESPECTED'}
                </Text>
              </View>
            </View>

            {/* Metric Strip */}
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 4, marginBottom: 6 }}>
              <View style={{ flex: 1 }}>
                <Text style={[typography.caption, { color: colors.textTertiary, fontSize: 10.5 }]}>STARTING BAL</Text>
                <Text style={{ fontSize: 12.5, fontWeight: '700', color: colors.textPrimary }}>
                  {riskAudit.currencySymbol}{riskAudit.accountBalance.toLocaleString()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[typography.caption, { color: colors.textTertiary, fontSize: 10.5 }]}>1% CAP LIMIT</Text>
                <Text style={{ fontSize: 12.5, fontWeight: '700', color: colors.textPrimary }}>
                  {riskAudit.currencySymbol}{riskAudit.maxOnePercentRisk.toFixed(0)}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[typography.caption, { color: colors.textTertiary, fontSize: 10.5 }]}>PLANNED RISK</Text>
                <Text style={{ fontSize: 12.5, fontWeight: '700', color: riskAudit.plannedRiskPercent > 1.0 ? '#EF4444' : colors.textPrimary }}>
                  {riskAudit.plannedRiskPercent.toFixed(1)}% ({riskAudit.currencySymbol}{riskAudit.plannedRiskAmount.toFixed(0)})
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[typography.caption, { color: colors.textTertiary, fontSize: 10.5 }]}>REALIZED PNL</Text>
                <Text
                  style={{
                    fontSize: 12.5,
                    fontWeight: '700',
                    color: riskAudit.realizedPnL !== undefined
                      ? riskAudit.realizedPnL >= 0
                        ? colors.success
                        : riskAudit.realizedPnL < -riskAudit.maxOnePercentRisk
                        ? colors.error
                        : colors.textPrimary
                      : colors.textTertiary,
                  }}
                >
                  {riskAudit.realizedPnL !== undefined
                    ? `${riskAudit.realizedPnL >= 0 ? '+' : ''}${riskAudit.currencySymbol}${riskAudit.realizedPnL.toFixed(2)}`
                    : 'Open'}
                </Text>
              </View>
            </View>

            <Text
              style={[
                typography.caption,
                {
                  color: riskAudit.isViolated ? (isDark ? '#FCA5A5' : '#B91C1C') : colors.textSecondary,
                  fontSize: 11,
                  lineHeight: 15,
                },
              ]}
            >
              {riskAudit.isViolated
                ? `🚨 ${riskAudit.violationReason} Make sure this risk breach is recorded in your trade review.`
                : `🛡️ Position sizing is disciplined and strictly within your ≤ 1% (${riskAudit.currencySymbol}${riskAudit.maxOnePercentRisk.toFixed(0)}) capital protection limit.`}
            </Text>
          </View>

          {/* Screenshots Editor */}
          <View style={{ marginBottom: spacing[4], marginTop: spacing[2] }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing[2] }}>
              <Ionicons name="images-outline" size={14} color={colors.textTertiary} style={{ marginRight: 5 }} />
              <Text style={[typography.label, { color: colors.textSecondary }]}>Screenshots</Text>
            </View>
            
            {/* Existing Screenshots strip */}
            {trade.screenshots && trade.screenshots.length > 0 && (
              <View style={{ marginBottom: spacing[3] }}>
                <Text style={[typography.caption, { color: colors.textTertiary, marginBottom: spacing[1.5] }]}>Existing (Tap trash to delete):</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ flexDirection: 'row', gap: spacing[2] }}>
                    {trade.screenshots.map((s: any) => {
                      const fullUrl = s.url.startsWith('/') ? `${BASE_URL.replace('/api', '')}${s.url}` : s.url;
                      return (
                        <View key={s.publicId} style={{ width: 80, height: 80, borderRadius: radii.md, overflow: 'hidden', backgroundColor: colors.surfaceElevated }}>
                          <TouchableOpacity activeOpacity={0.9} onPress={() => setSelectedImage(fullUrl)} style={StyleSheet.absoluteFill}>
                            <Image
                              source={{ uri: fullUrl }}
                              style={{ width: '100%', height: '100%' }}
                              resizeMode="cover"
                            />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleDeleteExistingScreenshot(s.publicId)}
                            style={[{ position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(239, 68, 68, 0.9)', alignItems: 'center', justifyContent: 'center' }]}
                          >
                            <Ionicons name="trash-outline" size={12} color="#fff" />
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>
            )}

            {/* New Local Screenshots thumbnail strip */}
            {localImages.length > 0 && (
              <View style={{ marginBottom: spacing[3] }}>
                <Text style={[typography.caption, { color: colors.textTertiary, marginBottom: spacing[1.5] }]}>New to upload:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ flexDirection: 'row', gap: spacing[2] }}>
                    {localImages.map((img, idx) => (
                      <View key={`${img.uri}-${idx}`} style={{ width: 80, height: 80, borderRadius: radii.md, overflow: 'hidden', backgroundColor: colors.surfaceElevated }}>
                        <TouchableOpacity activeOpacity={0.9} onPress={() => setSelectedImage(img.uri)} style={StyleSheet.absoluteFill}>
                          <Image source={{ uri: img.uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => removeLocalImage(idx)}
                          style={[{ position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' }]}
                        >
                          <Ionicons name="close" size={12} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}

            {/* Pick / capture buttons */}
            <View style={{ flexDirection: 'row', gap: spacing[2] }}>
              <TouchableOpacity
                onPress={pickImages}
                style={[{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, paddingVertical: spacing[2.5], gap: spacing[2] }]}
              >
                <Ionicons name="image-outline" size={16} color={colors.primary} />
                <Text style={[typography.labelSm, { color: colors.primary, fontSize: 12 }]}>Add Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={captureImage}
                style={[{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, paddingVertical: spacing[2.5], gap: spacing[2] }]}
              >
                <Ionicons name="camera-outline" size={16} color={colors.primary} />
                <Text style={[typography.labelSm, { color: colors.primary, fontSize: 12 }]}>Camera</Text>
              </TouchableOpacity>
            </View>
          </View>

        </ScrollView>

        <FinalActionBar
          onBack={() => navigation.goBack()}
          onSubmit={handleSubmit(onSubmit, onInvalid)}
          isPending={isPending}
          submitLabel="Update Trade"
          backLabel="Cancel"
          gradeBadge={gradeResult.badgeText}
          gradeColor={gradeResult.color}
          isRiskBreached={riskAudit.isViolated}
        />
      </View>

      <ImageViewerModal
        visible={!!selectedImage}
        imageUrl={selectedImage}
        onClose={() => setSelectedImage(null)}
      />

      <LoadingOverlay
        visible={isPending}
        fullScreen
        message={uploadingImages ? 'Uploading screenshots...' : 'Saving changes...'}
      />
    </KeyboardAvoidingView>
  );
};
