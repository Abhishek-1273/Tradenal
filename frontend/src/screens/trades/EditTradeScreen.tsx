import React, { useState } from 'react';
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
import { RRCalculator } from '../../components/trade/RRCalculator';
import { LoadingOverlay } from '../../components/common/LoadingOverlay';
import { tradeFormSchema, TradeFormData } from '../../utils/validators';
import { combineDateAndTime } from '../../utils/formatters';
import { getErrorMessage } from '../../api/client';
import { useToast } from '../../components/common/Toast';
import { EditTradeRouteProp, AppNavProp } from '../../navigation/types';
import { SESSIONS, SETUPS, RESULTS, EMOTIONS_BEFORE, EMOTIONS_DURING, EMOTIONS_AFTER, MISTAKES } from '../../constants';
import dayjs from 'dayjs';

export const EditTradeScreen: React.FC = () => {
  const { colors, typography, spacing, radii } = useTheme();
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
      setup: trade.setup,
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

          <Button label="Save Changes" onPress={handleSubmit(onSubmit)} loading={isPending} style={{ marginTop: spacing[4] }} />
        </ScrollView>
      </View>

      <ImageViewerModal
        visible={!!selectedImage}
        imageUrl={selectedImage}
        onClose={() => setSelectedImage(null)}
      />
    </KeyboardAvoidingView>
  );
};
