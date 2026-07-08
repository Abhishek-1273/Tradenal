import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import dayjs from 'dayjs';

import { useTheme } from '../../theme';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { DateField } from '../../components/common/DateField';
import { useAccountStore } from '../../store/account.store';
import { exportApi } from '../../api/stats.api';
import { storage } from '../../utils/storage';

type ExportFormat = 'csv' | 'json';
type DatePreset = 'all' | '30days' | '90days' | 'custom';

export const ExportScreen: React.FC = () => {
  const { colors, typography, spacing, radii } = useTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { activeAccount } = useAccountStore();

  const [format, setFormat] = useState<ExportFormat>('csv');
  const [preset, setPreset] = useState<DatePreset>('all');
  const [scopeActiveOnly, setScopeActiveOnly] = useState(true);
  const [startDate, setStartDate] = useState(dayjs().subtract(7, 'day').format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};

      // Set account filter
      if (scopeActiveOnly && activeAccount) {
        params.accountId = activeAccount._id;
      }

      // Set date range filters
      if (preset === '30days') {
        params.startDate = dayjs().subtract(30, 'day').startOf('day').toISOString();
        params.endDate = dayjs().endOf('day').toISOString();
      } else if (preset === '90days') {
        params.startDate = dayjs().subtract(90, 'day').startOf('day').toISOString();
        params.endDate = dayjs().endOf('day').toISOString();
      } else if (preset === 'custom') {
        if (!startDate || !endDate) {
          Alert.alert('Error', 'Please select both start and end dates.');
          setLoading(false);
          return;
        }
        params.startDate = dayjs(startDate).startOf('day').toISOString();
        params.endDate = dayjs(endDate).endOf('day').toISOString();
      }

      // Fetch URL & token
      const downloadUrl =
        format === 'csv'
          ? exportApi.getCSVUrl(params)
          : exportApi.getJSONUrl(params);

      const token = await storage.getAccessToken();
      const filename = `trades-export-${dayjs().format('YYYYMMDD-HHmmss')}.${format}`;
      const localUri = `${FileSystem.documentDirectory}${filename}`;

      const downloadResult = await FileSystem.downloadAsync(downloadUrl, localUri, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (downloadResult.status !== 200) {
        throw new Error('Server returned error status ' + downloadResult.status);
      }

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(downloadResult.uri, {
          mimeType: format === 'csv' ? 'text/csv' : 'application/json',
          dialogTitle: 'Export Tradenal Data',
          UTI: format === 'csv' ? 'public.comma-separated-values-text' : 'public.json',
        });
      } else {
        Alert.alert('Export Successful', `Data saved locally to: ${downloadResult.uri}`);
      }
    } catch (error: any) {
      Alert.alert('Export Failed', error?.message || 'Something went wrong during export.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12, paddingHorizontal: spacing[5], paddingBottom: spacing[4], borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backBtn, { backgroundColor: colors.surfaceElevated }]}
        >
          <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[typography.h2, { color: colors.textPrimary, marginLeft: spacing[4] }]}>
          Export Data
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: spacing[5], paddingBottom: insets.bottom + 40 }}
      >
        <Text style={[typography.body, { color: colors.textTertiary, marginTop: spacing[5], marginBottom: spacing[5], lineHeight: 22 }]}>
          Export your complete trading log and statistics. You can open CSV files in Excel/Google Sheets, or use JSON exports to back up your journal.
        </Text>

        {/* ── FORMAT SELECT ── */}
        <Text style={[typography.labelSm, { color: colors.textTertiary, marginBottom: spacing[2] }]}>EXPORT FORMAT</Text>
        <Card style={{ marginBottom: spacing[5] }}>
          <View style={styles.segmentContainer}>
            {(['csv', 'json'] as const).map((f) => {
              const active = format === f;
              return (
                <TouchableOpacity
                  key={f}
                  onPress={() => setFormat(f)}
                  style={[
                    styles.segmentButton,
                    {
                      backgroundColor: active ? colors.primary : 'transparent',
                      borderRadius: radii.md,
                    },
                  ]}
                >
                  <Text style={[typography.label, { color: active ? '#fff' : colors.textSecondary, textTransform: 'uppercase' }]}>
                    {f}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {/* ── SCOPE SELECT ── */}
        <Text style={[typography.labelSm, { color: colors.textTertiary, marginBottom: spacing[2] }]}>FILTER BY ACCOUNT</Text>
        <Card style={{ marginBottom: spacing[5] }}>
          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: spacing[4] }}>
              <Text style={[typography.body, { color: colors.textPrimary }]}>
                {scopeActiveOnly ? `Scoped to ${activeAccount?.name || 'Active Account'}` : 'All Accounts'}
              </Text>
              <Text style={[typography.caption, { color: colors.textTertiary, marginTop: 4 }]}>
                {scopeActiveOnly ? 'Export trades for the selected account only' : 'Export trades from all accounts combined'}
              </Text>
            </View>
            <Switch
              value={scopeActiveOnly}
              onValueChange={setScopeActiveOnly}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#fff"
            />
          </View>
        </Card>

        {/* ── TIMEFRAME SELECT ── */}
        <Text style={[typography.labelSm, { color: colors.textTertiary, marginBottom: spacing[2] }]}>TIMEFRAME</Text>
        <Card style={{ marginBottom: spacing[5] }}>
          <View style={styles.segmentContainer}>
            {([
              { label: 'All', value: 'all' },
              { label: '30 Days', value: '30days' },
              { label: '90 Days', value: '90days' },
              { label: 'Custom', value: 'custom' },
            ] as const).map((p) => {
              const active = preset === p.value;
              return (
                <TouchableOpacity
                  key={p.value}
                  onPress={() => setPreset(p.value)}
                  style={[
                    styles.segmentButton,
                    {
                      backgroundColor: active ? colors.primary : 'transparent',
                      borderRadius: radii.md,
                      paddingVertical: 10,
                    },
                  ]}
                >
                  <Text style={[typography.label, { color: active ? '#fff' : colors.textSecondary }]}>
                    {p.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {preset === 'custom' && (
            <View style={{ marginTop: spacing[4] }}>
              <DateField
                label="Start Date"
                value={startDate}
                onChange={setStartDate}
              />
              <DateField
                label="End Date"
                value={endDate}
                onChange={setEndDate}
              />
            </View>
          )}
        </Card>

        {/* ── CONFIRM ACTION ── */}
        <Button
          label={loading ? 'Generating Export...' : `Export to ${format.toUpperCase()}`}
          onPress={handleExport}
          loading={loading}
          icon={loading ? undefined : <Ionicons name="download-outline" size={18} color="#fff" />}
          style={{ marginTop: spacing[2] }}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
    padding: 3,
  },
  segmentButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
