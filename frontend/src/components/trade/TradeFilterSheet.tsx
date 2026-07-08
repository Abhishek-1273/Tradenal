import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { TradeFilters } from '../../types';
import { usePairs } from '../../hooks/useTrades';

const SCREEN_HEIGHT = Dimensions.get('window').height;

const SESSIONS = [
  { label: 'London', value: 'london' },
  { label: 'New York', value: 'newyork' },
  { label: 'Asian', value: 'asian' },
  { label: 'Overlap', value: 'overlap' },
];

const SETUPS = [
  { label: 'Breakout', value: 'breakout' },
  { label: 'Liquidity Sweep', value: 'liquiditySweep' },
  { label: 'SMC', value: 'smc' },
  { label: 'ICT', value: 'ict' },
  { label: 'Support/Resistance', value: 'supportResistance' },
  { label: 'Trend Following', value: 'trendFollowing' },
  { label: 'Scalp', value: 'scalp' },
  { label: 'Swing', value: 'swing' },
  { label: 'Custom', value: 'custom' },
];

const EMOTIONS = [
  { label: 'Confident', value: 'confident' },
  { label: 'Fearful', value: 'fear' },
  { label: 'Greedy', value: 'greedy' },
  { label: 'FOMO', value: 'fomo' },
  { label: 'Calm', value: 'calm' },
  { label: 'Excited', value: 'excited' },
];

interface Props {
  visible: boolean;
  onClose: () => void;
  currentFilters: TradeFilters;
  onApply: (filters: Partial<TradeFilters>) => void;
  onReset: () => void;
}

export const TradeFilterSheet: React.FC<Props> = ({
  visible,
  onClose,
  currentFilters,
  onApply,
  onReset,
}) => {
  const { colors, typography, spacing, radii } = useTheme();
  const insets = useSafeAreaInsets();
  const { data: pairsData } = usePairs();

  const [draft, setDraft] = useState<Partial<TradeFilters>>({});
  const [pairInput, setPairInput] = useState('');
  const slideAnim = useState(new Animated.Value(SCREEN_HEIGHT))[0];

  const pairs: string[] = pairsData ?? [];

  useEffect(() => {
    if (visible) {
      setDraft({
        pair: currentFilters.pair,
        session: currentFilters.session,
        setup: currentFilters.setup,
        emotionBefore: currentFilters.emotionBefore,
        startDate: currentFilters.startDate,
        endDate: currentFilters.endDate,
        isFavorite: currentFilters.isFavorite,
      });
      setPairInput(currentFilters.pair ?? '');
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 20,
        stiffness: 180,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 220,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const toggle = (key: keyof TradeFilters, value: string) => {
    setDraft((prev) => ({ ...prev, [key]: prev[key] === value ? undefined : value }));
  };

  const handleApply = () => {
    const filters: Partial<TradeFilters> = { ...draft };
    if (pairInput.trim()) filters.pair = pairInput.trim().toUpperCase();
    else filters.pair = undefined;
    onApply(filters);
    onClose();
  };

  const handleReset = () => {
    setDraft({});
    setPairInput('');
    onReset();
    onClose();
  };

  const activeCount = [
    draft.pair || pairInput.trim(),
    draft.session,
    draft.setup,
    draft.emotionBefore,
    draft.startDate,
    draft.isFavorite,
  ].filter(Boolean).length;

  return (
    <Modal transparent visible={visible} onRequestClose={onClose} statusBarTranslucent animationType="fade">
      {/* Backdrop */}
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      />

      <Animated.View
        style={[
          styles.sheet,
          {
            backgroundColor: colors.surface,
            borderTopLeftRadius: radii['2xl'],
            borderTopRightRadius: radii['2xl'],
            paddingBottom: insets.bottom + 16,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Handle */}
        <View style={[styles.handle, { backgroundColor: colors.border }]} />

        {/* Header */}
        <View style={[styles.sheetHeader, { paddingHorizontal: spacing[5], marginBottom: spacing[4] }]}>
          <Text style={[typography.h3, { color: colors.textPrimary }]}>Filters</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: spacing[5], paddingBottom: spacing[4] }}
        >
          {/* Pair */}
          <Section label="Currency Pair" colors={colors} typography={typography} spacing={spacing}>
            <View
              style={[
                styles.inputWrap,
                { backgroundColor: colors.surfaceElevated, borderRadius: radii.lg, borderColor: colors.border, borderWidth: 1 },
              ]}
            >
              <TextInput
                style={[typography.body, { color: colors.textPrimary, flex: 1, height: 42, paddingHorizontal: spacing[3] }]}
                placeholder="e.g. EURUSD, XAUUSD"
                placeholderTextColor={colors.textDisabled}
                value={pairInput}
                onChangeText={setPairInput}
                autoCapitalize="characters"
              />
              {pairInput ? (
                <TouchableOpacity onPress={() => setPairInput('')} style={{ paddingRight: spacing[3] }}>
                  <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
                </TouchableOpacity>
              ) : null}
            </View>
            {/* Quick pair chips from history */}
            {pairs.length > 0 && (
              <View style={[styles.chipRow, { marginTop: spacing[2] }]}>
                {pairs.slice(0, 8).map((p) => (
                  <ChipItem
                    key={p}
                    label={p}
                    active={pairInput.toUpperCase() === p}
                    onPress={() => setPairInput(p === pairInput ? '' : p)}
                    colors={colors}
                    typography={typography}
                    spacing={spacing}
                    radii={radii}
                  />
                ))}
              </View>
            )}
          </Section>

          {/* Session */}
          <Section label="Session" colors={colors} typography={typography} spacing={spacing}>
            <View style={styles.chipRow}>
              {SESSIONS.map((s) => (
                <ChipItem
                  key={s.value}
                  label={s.label}
                  active={draft.session === s.value}
                  onPress={() => toggle('session', s.value)}
                  colors={colors}
                  typography={typography}
                  spacing={spacing}
                  radii={radii}
                />
              ))}
            </View>
          </Section>

          {/* Setup */}
          <Section label="Setup" colors={colors} typography={typography} spacing={spacing}>
            <View style={styles.chipRow}>
              {SETUPS.map((s) => (
                <ChipItem
                  key={s.value}
                  label={s.label}
                  active={draft.setup === s.value}
                  onPress={() => toggle('setup', s.value)}
                  colors={colors}
                  typography={typography}
                  spacing={spacing}
                  radii={radii}
                />
              ))}
            </View>
          </Section>

          {/* Emotion */}
          <Section label="Emotion Before" colors={colors} typography={typography} spacing={spacing}>
            <View style={styles.chipRow}>
              {EMOTIONS.map((e) => (
                <ChipItem
                  key={e.value}
                  label={e.label}
                  active={draft.emotionBefore === e.value}
                  onPress={() => toggle('emotionBefore', e.value)}
                  colors={colors}
                  typography={typography}
                  spacing={spacing}
                  radii={radii}
                />
              ))}
            </View>
          </Section>

          {/* Favorites */}
          <Section label="Other" colors={colors} typography={typography} spacing={spacing}>
            <TouchableOpacity
              onPress={() => setDraft((prev) => ({ ...prev, isFavorite: prev.isFavorite === 'true' ? undefined : 'true' }))}
              style={[
                styles.toggleRow,
                {
                  backgroundColor: draft.isFavorite === 'true' ? colors.primarySubtle : colors.surfaceElevated,
                  borderRadius: radii.lg,
                  padding: spacing[3],
                  borderColor: draft.isFavorite === 'true' ? colors.primary : colors.border,
                  borderWidth: 1,
                },
              ]}
            >
              <Ionicons
                name={draft.isFavorite === 'true' ? 'bookmark' : 'bookmark-outline'}
                size={18}
                color={draft.isFavorite === 'true' ? colors.primary : colors.textSecondary}
              />
              <Text
                style={[typography.body, { color: draft.isFavorite === 'true' ? colors.primary : colors.textSecondary, marginLeft: spacing[2] }]}
              >
                Favorites Only
              </Text>
            </TouchableOpacity>
          </Section>
        </ScrollView>

        {/* Footer buttons */}
        <View
          style={[
            styles.footer,
            {
              paddingHorizontal: spacing[5],
              paddingTop: spacing[3],
              borderTopColor: colors.border,
              borderTopWidth: 1,
            },
          ]}
        >
          <TouchableOpacity
            onPress={handleReset}
            style={[
              styles.footerBtn,
              { backgroundColor: colors.surfaceElevated, borderRadius: radii.lg, borderColor: colors.border, borderWidth: 1 },
            ]}
          >
            <Text style={[typography.label, { color: colors.textSecondary }]}>Reset</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleApply}
            style={[styles.footerBtn, styles.footerBtnPrimary, { backgroundColor: colors.primary, borderRadius: radii.lg, flex: 2, marginLeft: spacing[3] }]}
          >
            <Text style={[typography.label, { color: '#fff' }]}>
              Apply{activeCount > 0 ? ` (${activeCount})` : ''}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
};

// ─── Helper sub-components ────────────────────────────────────────────────────

const Section: React.FC<{
  label: string;
  children: React.ReactNode;
  colors: any;
  typography: any;
  spacing: any;
}> = ({ label, children, colors, typography, spacing }) => (
  <View style={{ marginBottom: spacing[5] }}>
    <Text style={[typography.labelSm, { color: colors.textTertiary, marginBottom: spacing[2], textTransform: 'uppercase', letterSpacing: 0.8 }]}>
      {label}
    </Text>
    {children}
  </View>
);

const ChipItem: React.FC<{
  label: string;
  active: boolean;
  onPress: () => void;
  colors: any;
  typography: any;
  spacing: any;
  radii: any;
}> = ({ label, active, onPress, colors, typography, spacing, radii }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[
      styles.chip,
      {
        backgroundColor: active ? colors.primary : colors.surfaceElevated,
        borderRadius: radii.full,
        paddingHorizontal: spacing[3],
        paddingVertical: spacing[1.5],
        marginRight: spacing[2],
        marginBottom: spacing[2],
        borderColor: active ? colors.primary : colors.border,
        borderWidth: 1,
      },
    ]}
  >
    <Text style={[typography.labelSm, { color: active ? '#fff' : colors.textSecondary }]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: SCREEN_HEIGHT * 0.88,
    paddingTop: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {},
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerBtn: {
    flex: 1,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerBtnPrimary: {},
});
