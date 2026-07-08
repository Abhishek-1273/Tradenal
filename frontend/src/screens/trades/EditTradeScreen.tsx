import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
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
import { RRCalculator } from '../../components/trade/RRCalculator';
import { LoadingOverlay } from '../../components/common/LoadingOverlay';
import { tradeFormSchema, TradeFormData } from '../../utils/validators';
import { combineDateAndTime } from '../../utils/formatters';
import { getErrorMessage } from '../../api/client';
import { EditTradeRouteProp, AppNavProp } from '../../navigation/types';
import { SESSIONS, SETUPS, RESULTS, EMOTIONS_BEFORE, EMOTIONS_AFTER, MISTAKES } from '../../constants';
import dayjs from 'dayjs';

export const EditTradeScreen: React.FC = () => {
  const { colors, typography, spacing, radii } = useTheme();
  const navigation = useNavigation<AppNavProp>();
  const route = useRoute<EditTradeRouteProp>();
  const insets = useSafeAreaInsets();
  const { data: trade, isLoading } = useTrade(route.params.tradeId);
  const { mutateAsync: updateTrade, isPending } = useUpdateTrade(route.params.tradeId);

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
      setup: trade.setup,
      customSetup: trade.customSetup ?? '',
      result: trade.result,
      emotionBefore: trade.emotionBefore,
      emotionAfter: trade.emotionAfter,
      followedPlan: trade.followedPlan,
      overtraded: trade.overtraded,
      movedSL: trade.movedSL,
      movedTP: trade.movedTP,
      revengeTrade: trade.revengeTrade,
      newsTrade: trade.newsTrade,
      mistakes: trade.mistakes as string[],
      customMistake: trade.customMistake ?? '',
      reasonForEntry: trade.reasonForEntry ?? '',
      notes: trade.notes ?? '',
      tags: trade.tags,
      isFavorite: trade.isFavorite,
    } : undefined,
  });

  const [ep, sl, tp, ex, tt, ls, rp] = watch(['entryPrice','stopLoss','takeProfit','exitPrice','tradeType','lotSize','riskPercent']);

  const onSubmit = async (data: TradeFormData) => {
    try {
      await updateTrade({
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
        result: data.result, emotionBefore: data.emotionBefore, emotionAfter: data.emotionAfter,
        followedPlan: data.followedPlan, overtraded: data.overtraded, movedSL: data.movedSL,
        movedTP: data.movedTP, revengeTrade: data.revengeTrade, newsTrade: data.newsTrade,
        mistakes: data.mistakes as any[], customMistake: data.customMistake,
        reasonForEntry: data.reasonForEntry, notes: data.notes, tags: data.tags, isFavorite: data.isFavorite,
      });
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err));
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
          <TouchableOpacity onPress={handleSubmit(onSubmit)} disabled={isPending} style={[{ backgroundColor: colors.primary, borderRadius: 20, paddingHorizontal: spacing[4], paddingVertical: spacing[2] }]}>
            <Text style={[typography.label, { color: '#fff' }]}>{isPending ? 'Saving...' : 'Save'}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={[{ paddingHorizontal: spacing[5], paddingTop: spacing[4], paddingBottom: insets.bottom + 40 }]}>
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

          <Controller control={control} name="pnlAmount" render={({ field: { onChange, value } }) => (
            <Input
              label="PnL Amount"
              placeholder="e.g. 150.00 or -50.00 (Optional)"
              value={value}
              onChangeText={onChange}
              error={errors.pnlAmount?.message}
              keyboardType="numeric"
            />
          )} />

          <Controller control={control} name="session" render={({ field: { onChange, value } }) => (
            <SelectPills label="Session" required options={SESSIONS} value={value} onChange={onChange} columns={2} style={{ marginBottom: spacing[4] }} />
          )} />
          <Controller control={control} name="setup" render={({ field: { onChange, value } }) => (
            <SelectPills label="Setup" options={SETUPS} value={value} onChange={onChange} columns={3} style={{ marginBottom: spacing[4] }} />
          )} />
          <Controller control={control} name="result" render={({ field: { onChange, value } }) => (
            <SelectPills label="Result" required options={RESULTS.map((r) => ({ ...r }))} value={value} onChange={onChange} columns={2} style={{ marginBottom: spacing[4] }} />
          )} />
          <Controller control={control} name="emotionBefore" render={({ field: { onChange, value } }) => (
            <SelectPills label="Emotion Before" options={EMOTIONS_BEFORE} value={value} onChange={onChange} columns={3} style={{ marginBottom: spacing[4] }} />
          )} />
          <Controller control={control} name="emotionAfter" render={({ field: { onChange, value } }) => (
            <SelectPills label="Emotion After" options={EMOTIONS_AFTER} value={value} onChange={onChange} columns={3} style={{ marginBottom: spacing[4] }} />
          )} />

          {[
            { name: 'followedPlan' as const, label: 'Followed Plan?', warn: false },
            { name: 'revengeTrade' as const, label: 'Revenge Trade?', warn: true },
            { name: 'overtraded' as const, label: 'Overtraded?', warn: true },
            { name: 'movedSL' as const, label: 'Moved Stop Loss?', warn: true },
            { name: 'newsTrade' as const, label: 'News Trade?', warn: false },
          ].map((item) => (
            <Controller key={item.name} control={control} name={item.name} render={({ field: { onChange, value } }) => (
              <CheckRow label={item.label} value={value as boolean} onChange={onChange} warnWhenOn={item.warn} />
            )} />
          ))}

          <Controller control={control} name="mistakes" render={({ field: { onChange, value } }) => (
            <SelectPills label="Mistakes" options={MISTAKES} value={undefined} onChange={() => {}} multiSelect selectedValues={value} onMultiChange={onChange} columns={2} style={{ marginTop: spacing[4], marginBottom: spacing[4] }} />
          )} />

          <Controller control={control} name="notes" render={({ field: { onChange, value } }) => (
            <Input label="Notes" placeholder="Trade notes..." value={value} onChangeText={onChange} multiline numberOfLines={5} style={{ height: 120, textAlignVertical: 'top', paddingTop: 12 }} />
          )} />

          <Button label="Save Changes" onPress={handleSubmit(onSubmit)} loading={isPending} style={{ marginTop: spacing[4] }} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};
