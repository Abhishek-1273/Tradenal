import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, RefreshControl, ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { useTrades, useToggleFavorite } from '../../hooks/useTrades';
import { useUIStore } from '../../store/ui.store';
import { TradeCard } from '../../components/trade/TradeCard';
import { TradeFilterSheet } from '../../components/trade/TradeFilterSheet';
import { FAB } from '../../components/common/FAB';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingOverlay } from '../../components/common/LoadingOverlay';
import { AppNavProp } from '../../navigation/types';
import { Trade } from '../../types';

const RESULT_FILTERS = [
  { label: 'All', value: '', color: undefined },
  { label: 'Wins', value: 'win', color: '#10B981' },
  { label: 'Losses', value: 'loss', color: '#EF4444' },
  { label: 'Partial Win', value: 'partialWin', color: '#14B8A6' },
  { label: 'Break Even', value: 'breakeven', color: '#F59E0B' },
];

export const TradeListScreen: React.FC = () => {
  const { colors, typography, spacing, radii } = useTheme();
  const navigation = useNavigation<AppNavProp>();
  const insets = useSafeAreaInsets();
  const { tradeFilters, setTradeFilters, resetTradeFilters } = useUIStore();

  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeResult, setActiveResult] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [showSearchBox, setShowSearchBox] = useState(false);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Debounce search text to prevent laggy queries on every keystroke
  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearch(searchText.trim());
    }, 280);
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [searchText]);

  const filters = {
    ...tradeFilters,
    limit: 100,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
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

  const hasAnyFilter = Boolean(searchText || activeResult || activeFiltersCount > 0);

  const handleClearAllFilters = () => {
    setSearchText('');
    setActiveResult('');
    resetTradeFilters();
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Subtle top ambient glow */}
      <LinearGradient
        colors={['rgba(255,255,255,0.04)', 'transparent']}
        style={[styles.headerGradient, { height: 180 }]}
        pointerEvents="none"
      />

      {/* Header Container */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 24) + 14, paddingHorizontal: spacing[5] }]}>
        <View style={styles.titleRow}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text style={[typography.h2, { color: colors.textPrimary, letterSpacing: -0.4 }]}>
              Trade Journal
            </Text>
            <Text style={{ fontSize: 12, color: colors.textTertiary, marginTop: 2 }}>
              {total} verified execution{total === 1 ? '' : 's'}
            </Text>
          </View>

          {/* Right Header Action Icons: Search Icon & Filter Icon */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {/* Search Icon Button */}
            <TouchableOpacity
              onPress={() => setShowSearchBox((prev) => !prev)}
              activeOpacity={0.8}
              style={[
                styles.headerIconBtn,
                {
                  backgroundColor: showSearchBox || searchText ? colors.surfaceHighlight : colors.surfaceElevated,
                  borderColor: showSearchBox || searchText ? colors.textSecondary : colors.border,
                  borderRadius: radii.lg,
                },
              ]}
            >
              <Ionicons
                name="search-outline"
                size={18}
                color={showSearchBox || searchText ? colors.textPrimary : colors.textSecondary}
              />
            </TouchableOpacity>

            {/* Filter Icon Button */}
            <TouchableOpacity
              onPress={() => setShowFilter(true)}
              activeOpacity={0.8}
              style={[
                styles.headerIconBtn,
                {
                  backgroundColor: activeFiltersCount > 0 ? colors.surfaceHighlight : colors.surfaceElevated,
                  borderColor: activeFiltersCount > 0 ? colors.textSecondary : colors.border,
                  borderRadius: radii.lg,
                },
              ]}
            >
              <Ionicons
                name="options-outline"
                size={18}
                color={activeFiltersCount > 0 ? colors.textPrimary : colors.textSecondary}
              />
              {activeFiltersCount > 0 && (
                <View style={[styles.filterBadge, { backgroundColor: colors.textPrimary }]}>
                  <Text style={{ color: colors.background, fontSize: 10, fontWeight: '800' }}>{activeFiltersCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar (Expandable via Search Icon) */}
        {(showSearchBox || searchText) && (
          <View style={[styles.searchRow, { marginTop: spacing[3] }]}>
            <View style={[styles.searchBox, { backgroundColor: colors.surfaceElevated, borderRadius: radii.lg, borderColor: colors.border, borderWidth: 1, flex: 1 }]}>
              <Ionicons name="search-outline" size={18} color={colors.textTertiary} style={{ marginLeft: spacing[3] }} />
              <TextInput
                style={[typography.body, { color: colors.textPrimary, flex: 1, height: 42, paddingHorizontal: spacing[2] }]}
                placeholder="Search pair, setup, notes, tags..."
                placeholderTextColor={colors.textDisabled}
                value={searchText}
                onChangeText={setSearchText}
                autoFocus
                returnKeyType="search"
              />
              {searchText ? (
                <TouchableOpacity onPress={() => setSearchText('')} style={{ paddingHorizontal: spacing[3] }}>
                  <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        )}

        {/* Quick Result Category Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.chipRow, { marginTop: spacing[3], paddingBottom: spacing[3] }]}
        >
          {RESULT_FILTERS.map((f) => {
            const active = activeResult === f.value;
            const filterColor = f.color;
            const bgColor = active
              ? (filterColor || colors.textPrimary)
              : colors.surfaceElevated;
            const borderColor = active
              ? (filterColor || colors.textPrimary)
              : colors.border;
            const textColor = active
              ? (filterColor ? '#FFFFFF' : colors.background)
              : colors.textSecondary;

            return (
              <TouchableOpacity
                key={f.value}
                onPress={() => setActiveResult(active ? '' : f.value)}
                activeOpacity={0.8}
                style={[
                  styles.chip,
                  {
                    backgroundColor: bgColor,
                    borderColor: borderColor,
                    borderRadius: radii.full,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    {
                      color: textColor,
                      fontWeight: active ? '700' : '600',
                    },
                  ]}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Trades List */}
      {isLoading ? (
        <LoadingOverlay message="Loading journal records..." />
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
            { paddingTop: spacing[3], paddingBottom: insets.bottom + 140 },
          ]}
          showsVerticalScrollIndicator={false}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={7}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="journal-outline"
              title={hasAnyFilter ? 'No trades matched filters' : 'No trades logged yet'}
              description={
                hasAnyFilter
                  ? 'No journal entries matched your search keywords or filter criteria.'
                  : 'Start building your trading journal track record by logging your first trade.'
              }
              action={
                hasAnyFilter
                  ? { label: 'Clear Filters', onPress: handleClearAllFilters }
                  : { label: 'Log New Trade', onPress: () => navigation.navigate('AddTrade') }
              }
            />
          }
        />
      )}

      {/* Floating Action Button for Trade Logging */}
      <FAB onPress={() => navigation.navigate('AddTrade')} />

      {/* Advanced Filter Modal Sheet */}
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
  headerGradient: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 0 },
  header: { zIndex: 10 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  clearPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
  },
  clearPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  searchRow: { flexDirection: 'row', alignItems: 'center' },
  searchBox: { flexDirection: 'row', alignItems: 'center' },
  filterBtn: {
    width: 44,
    height: 42,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipRow: { flexDirection: 'row', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
  },
  listContent: {},
});
