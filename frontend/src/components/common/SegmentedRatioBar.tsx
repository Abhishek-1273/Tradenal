import React from 'react';
import { View, Text, StyleSheet, Platform, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';

const fontBase = {
  fontFamily: Platform.select({ ios: 'System', android: 'sans-serif' }),
  includeFontPadding: false,
};

export interface SegmentedRatioBarProps {
  greenCount: number;
  redCount: number;
  beCount?: number;
  greenLabel?: string;
  redLabel?: string;
  beLabel?: string;
  maxSegments?: number;
  blockSize?: number;
  gap?: number;
  containerStyle?: StyleProp<ViewStyle>;
  hideDetails?: boolean;
  fillToMax?: boolean;
}

export const SegmentedRatioBar: React.FC<SegmentedRatioBarProps> = ({
  greenCount,
  redCount,
  beCount = 0,
  greenLabel = 'Green Days',
  redLabel = 'Red Days',
  beLabel = 'BE Days',
  maxSegments = 26,
  blockSize = 12,
  gap = 4.5,
  containerStyle,
  hideDetails = false,
  fillToMax = false,
}) => {
  const { colors, isDark } = useTheme();

  const total = greenCount + redCount + beCount;
  const greenPct = total > 0 ? Math.round((greenCount / total) * 100) : 0;
  const redPct = total > 0 ? Math.round((redCount / total) * 100) : 0;
  const bePct = total > 0 ? Math.round((beCount / total) * 100) : 0;

  // Calculate discrete blocks
  const blocks: Array<'green' | 'red' | 'be' | 'empty'> = [];
  const placeholderCount = fillToMax ? maxSegments : Math.min(maxSegments, 12);

  if (total === 0) {
    for (let i = 0; i < placeholderCount; i++) blocks.push('empty');
  } else if (total <= maxSegments) {
    // 1-to-1 representation for each day / trade
    for (let i = 0; i < greenCount; i++) blocks.push('green');
    for (let i = 0; i < beCount; i++) blocks.push('be');
    for (let i = 0; i < redCount; i++) blocks.push('red');
    if (fillToMax) {
      const remaining = maxSegments - blocks.length;
      for (let i = 0; i < remaining; i++) blocks.push('empty');
    }
  } else {
    // Proportional scaling down to maxSegments
    const scaledGreen = Math.round((greenCount / total) * maxSegments);
    const scaledBe = Math.round((beCount / total) * maxSegments);
    const scaledRed = Math.max(0, maxSegments - scaledGreen - scaledBe);

    for (let i = 0; i < scaledGreen; i++) blocks.push('green');
    for (let i = 0; i < scaledBe; i++) blocks.push('be');
    for (let i = 0; i < scaledRed; i++) blocks.push('red');
    if (fillToMax) {
      const remaining = maxSegments - blocks.length;
      for (let i = 0; i < remaining; i++) blocks.push('empty');
    }
  }

  const blockRadius = Math.max(2, Math.round(blockSize * 0.25));

  return (
    <View
      style={[
        hideDetails
          ? styles.compactWrapper
          : [
              styles.card,
              {
                backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC',
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0',
              },
            ],
        containerStyle,
      ]}
    >
      {/* ── Discrete Rounded Square Blocks Grid ────────────────────────── */}
      <View style={[styles.blocksRow, { gap }]}>
        {blocks.map((type, idx) => (
          <View
            key={idx}
            style={[
              styles.block,
              {
                width: blockSize,
                height: blockSize,
                borderRadius: blockRadius,
                backgroundColor:
                  type === 'green'
                    ? '#10B981'
                    : type === 'red'
                    ? '#EF4444'
                    : type === 'be'
                    ? '#F59E0B'
                    : isDark
                    ? 'rgba(255,255,255,0.08)'
                    : '#E2E8F0',
              },
            ]}
          />
        ))}
      </View>

      {/* ── Subtitle / Details Row ────────────────────────────────────── */}
      {!hideDetails && (
        <View style={styles.footerRow}>
          {/* Green side */}
          <View style={styles.metricItem}>
            <Ionicons name="caret-up" size={13} color="#10B981" style={{ marginRight: 3 }} />
            <Text style={[styles.metricCountText, { color: colors.textPrimary }]}>
              {greenCount}{' '}
              <Text style={[styles.metricLabelText, { color: colors.textSecondary }]}>
                {greenLabel}
              </Text>{' '}
              <Text style={[styles.metricPctText, { color: '#10B981' }]}>
                ({greenPct}%)
              </Text>
            </Text>
          </View>

          {/* Optional Break-even side if present */}
          {beCount > 0 && (
            <View style={styles.metricItem}>
              <View style={[styles.beDot, { backgroundColor: '#F59E0B' }]} />
              <Text style={[styles.metricCountText, { color: colors.textPrimary }]}>
                {beCount}{' '}
                <Text style={[styles.metricLabelText, { color: colors.textSecondary }]}>
                  {beLabel}
                </Text>{' '}
                <Text style={[styles.metricPctText, { color: '#F59E0B' }]}>
                  ({bePct}%)
                </Text>
              </Text>
            </View>
          )}

          {/* Red side */}
          <View style={styles.metricItem}>
            <Ionicons name="caret-up" size={13} color="#EF4444" style={{ marginRight: 3 }} />
            <Text style={[styles.metricCountText, { color: colors.textPrimary }]}>
              {redCount}{' '}
              <Text style={[styles.metricLabelText, { color: colors.textSecondary }]}>
                {redLabel}
              </Text>{' '}
              <Text style={[styles.metricPctText, { color: '#EF4444' }]}>
                ({redPct}%)
              </Text>
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
  },
  compactWrapper: {
    justifyContent: 'center',
  },
  blocksRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  block: {
    // Dimensions dynamically injected
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    flexWrap: 'wrap',
    gap: 8,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricCountText: {
    ...fontBase,
    fontSize: 12,
    fontWeight: '700',
  },
  metricLabelText: {
    ...fontBase,
    fontSize: 12,
    fontWeight: '500',
  },
  metricPctText: {
    ...fontBase,
    fontSize: 12,
    fontWeight: '700',
  },
  beDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
});
