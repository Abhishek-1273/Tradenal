import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { useTrades, useToggleFavorite } from '../../hooks/useTrades';
import { useUIStore } from '../../store/ui.store';
import { TradeCard } from '../../components/trade/TradeCard';
import { TradeFilterSheet } from '../../components/trade/TradeFilterSheet';
import { FAB } from '../../components/common/FAB';
import { EmptyState } from '../../components/common/EmptyState';
import { Badge } from '../../components/common/Badge';
import { LoadingOverlay } from '../../components/common/LoadingOverlay';
import { AppNavProp } from '../../navigation/types';
import { Trade } from '../../types';

const RESULT_FILTERS = [
  { label: 'All', value: '' },
  { label: 'Wins', value: 'win' },
  { label: 'Losses', value: 'loss' },
  { label: 'Break Even', value: 'breakeven' },
];

export const TradeListScreen: React.FC = () => {
  const { colors, typography, spacing, radii } = useTheme();
  const navigation = useNavigation<AppNavProp>();
  const insets = useSafeAreaInsets();
  const { tradeFilters, setTradeFilters, resetTradeFilters } = useUIStore();
  const [searchText, setSearchText] = useState('');
  const [activeResult, setActiveResult] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showFilter, setShowFilter] = useState(false);

  const filters = {
    ...tradeFilters,
    ...(searchText ? { search: searchText } : {}),
    ...(activeResult ? { result: activeResult } : {}),
  };

  const { data, isLoading, refetch, isRefetching } = useTrades(filters);
  const { mutate: toggleFavorite } = useToggleFavorite();

  const trades = data?.trades ?? [];
  const total = data?.total ?? 0;

  const handleTradePress = useCallback((trade: Trade) => {
    navigation.navigate('TradeDetail', { tradeId: trade._id });
  }, [navigation]);

  const handleFavorite = useCallback((tradeId: string) => {
    toggleFavorite(tradeId);
  }, [toggleFavorite]);

  const activeFiltersCount = [
    tradeFilters.pair, tradeFilters.session, tradeFilters.setup,
    tradeFilters.emotionBefore, tradeFilters.startDate,
  ].filter(Boolean).length;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12, paddingHorizontal: spacing[5], backgroundColor: colors.background }]}>
        <View style={styles.titleRow}>
          <Text style={[typography.h2, { color: colors.textPrimary }]}>Journal</Text>
          <Text style={[typography.body, { color: colors.textTertiary }]}>{total} trades</Text>
        </View>

        <View style={[styles.searchRow, { marginTop: spacing[3] }]}>
          <View style={[styles.searchBox, { backgroundColor: colors.surfaceElevated, borderRadius: radii.lg, borderColor: colors.border, borderWidth: 1, flex: 1 }]}>
            <Ionicons name="search-outline" size={18} color={colors.textTertiary} style={{ marginLeft: spacing[3] }} />
            <TextInput
              style={[typography.body, { color: colors.textPrimary, flex: 1, height: 40, paddingHorizontal: spacing[2] }]}
              placeholder="Search pair, notes, tags..."
              placeholderTextColor={colors.textDisabled}
              value={searchText}
              onChangeText={setSearchText}
            />
            {searchText ? (
              <TouchableOpacity onPress={() => setSearchText('')} style={{ paddingHorizontal: spacing[3] }}>
                <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
              </TouchableOpacity>
            ) : null}
          </View>
          <TouchableOpacity
            onPress={() => setShowFilter(true)}
            style={[styles.filterBtn, { backgroundColor: activeFiltersCount > 0 ? colors.primarySubtle : colors.surfaceElevated, borderRadius: radii.lg, marginLeft: spacing[2] }]}
          >
            <Ionicons name="options-outline" size={20} color={activeFiltersCount > 0 ? colors.primary : colors.textSecondary} />
            {activeFiltersCount > 0 && (
              <View style={[styles.filterBadge, { backgroundColor: colors.primary }]}>
                <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>{activeFiltersCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Quick result filters */}
        <View style={[styles.chipRow, { marginTop: spacing[3] }]}>
          {RESULT_FILTERS.map((f) => (
            <TouchableOpacity
              key={f.value}
              onPress={() => setActiveResult(activeResult === f.value ? '' : f.value)}
              style={[
                styles.chip,
                {
                  backgroundColor: activeResult === f.value ? colors.primary : colors.surfaceElevated,
                  borderRadius: radii.full,
                  paddingHorizontal: spacing[3],
                  paddingVertical: spacing[1.5],
                  marginRight: spacing[2],
                },
              ]}
            >
              <Text style={[typography.labelSm, { color: activeResult === f.value ? '#fff' : colors.textTertiary }]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {isLoading ? (
        <LoadingOverlay message="Loading trades..." />
      ) : (
        <FlatList
          data={trades}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <TradeCard
              trade={item}
              onPress={() => handleTradePress(item)}
              onFavorite={() => handleFavorite(item._id)}
              style={{ marginHorizontal: spacing[5] }}
            />
          )}
          contentContainerStyle={[
            styles.listContent,
            { paddingTop: spacing[4], paddingBottom: insets.bottom + 100 },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="journal-outline"
              title={searchText || activeResult ? 'No trades found' : 'No trades yet'}
              description={
                searchText || activeResult
                  ? 'Try adjusting your search or filters.'
                  : 'Start logging your trades to track your performance.'
              }
              action={
                searchText || activeResult
                  ? { label: 'Clear Filters', onPress: () => { setSearchText(''); setActiveResult(''); } }
                  : { label: 'Add Trade', onPress: () => navigation.navigate('AddTrade') }
              }
            />
          }
        />
      )}

      <FAB onPress={() => navigation.navigate('AddTrade')} />

      <TradeFilterSheet
        visible={showFilter}
        onClose={() => setShowFilter(false)}
        currentFilters={tradeFilters}
        onApply={(filters) => setTradeFilters(filters)}
        onReset={resetTradeFilters}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { zIndex: 10 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  searchRow: { flexDirection: 'row', alignItems: 'center' },
  searchBox: { flexDirection: 'row', alignItems: 'center' },
  filterBtn: { width: 44, height: 40, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  filterBadge: { position: 'absolute', top: 4, right: 4, width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  chipRow: { flexDirection: 'row' },
  chip: {},
  listContent: {},
});
