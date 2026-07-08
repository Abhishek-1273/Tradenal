import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';

interface EmotionStat {
  emotion: string;
  count: number;
  wins: number;
  losses: number;
  winRate: number;
}

interface PsychologyChartProps {
  data: EmotionStat[];
  style?: ViewStyle;
}

const getEmotionConfig = (emotion: string) => {
  const e = emotion.toLowerCase();
  switch (e) {
    case 'confident':
      return { name: 'shield-checkmark-outline' as const, color: '#10B981', label: 'Confident' };
    case 'calm':
      return { name: 'leaf-outline' as const, color: '#0EA5E9', label: 'Calm / Focused' };
    case 'excited':
      return { name: 'flame-outline' as const, color: '#EC4899', label: 'Excited' };
    case 'fear':
      return { name: 'alert-circle-outline' as const, color: '#EF4444', label: 'Fear / Anxiety' };
    case 'greedy':
      return { name: 'cash-outline' as const, color: '#F59E0B', label: 'Greedy' };
    case 'fomo':
      return { name: 'hourglass-outline' as const, color: '#8B5CF6', label: 'FOMO' };
    default:
      return { name: 'happy-outline' as const, color: '#6B7280', label: emotion };
  }
};

export const PsychologyChart: React.FC<PsychologyChartProps> = ({ data, style }) => {
  const { colors, typography, spacing, radii } = useTheme();

  if (!data || data.length === 0) {
    return (
      <View style={[styles.empty, style]}>
        <Text style={[typography.bodySm, { color: colors.textTertiary }]}>
          No psychology data yet
        </Text>
      </View>
    );
  }

  const sorted = [...data].sort((a, b) => b.winRate - a.winRate);

  const getWRColor = (wr: number) => {
    if (wr >= 65) return colors.success;
    if (wr >= 50) return colors.warning;
    return colors.error;
  };

  return (
    <View style={style}>
      {sorted.map((item) => {
        const config = getEmotionConfig(item.emotion);
        const wrColor = getWRColor(item.winRate);

        return (
          <View
            key={item.emotion}
            style={[
              styles.emotionCard,
              {
                backgroundColor: colors.surfaceElevated,
                borderRadius: radii.xl,
                padding: spacing[4],
                marginBottom: spacing[3],
                borderWidth: 1,
                borderColor: colors.border,
              },
            ]}
          >
            {/* Header info */}
            <View style={styles.cardHeader}>
              <View style={styles.leftInfo}>
                <View style={[styles.iconContainer, { backgroundColor: config.color + '15' }]}>
                  <Ionicons name={config.name} size={18} color={config.color} />
                </View>
                <View>
                  <Text style={[typography.label, { color: colors.textPrimary, fontWeight: '700' }]}>
                    {config.label}
                  </Text>
                  <Text style={[typography.caption, { color: colors.textTertiary, marginTop: 2 }]}>
                    {item.count} trade{item.count !== 1 ? 's' : ''} logged
                  </Text>
                </View>
              </View>

              <View style={styles.rightInfo}>
                <Text style={[typography.label, { color: wrColor, fontSize: 16, fontWeight: '700' }]}>
                  {item.winRate.toFixed(0)}% WR
                </Text>
              </View>
            </View>

            {/* Progress bar fill */}
            <View style={[styles.barTrack, { backgroundColor: colors.surfaceHighlight, marginTop: spacing[3] }]}>
              <View
                style={[
                  styles.barFill,
                  { width: `${item.winRate}%`, backgroundColor: wrColor, borderRadius: 4 },
                ]}
              />
            </View>

            {/* Footer metrics breakdown */}
            <View style={[styles.cardFooter, { marginTop: spacing[3], borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, paddingTop: spacing[2.5] }]}>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>
                Wins: <Text style={{ color: colors.success, fontWeight: '600' }}>{item.wins}</Text>
              </Text>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>
                Losses: <Text style={{ color: colors.error, fontWeight: '600' }}>{item.losses}</Text>
              </Text>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>
                Expected Value: <Text style={{ color: item.winRate >= 50 ? colors.success : colors.error, fontWeight: '600' }}>{(item.wins - item.losses >= 0 ? '+' : '') + (item.wins - item.losses)}</Text>
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 32 },
  emotionCard: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightInfo: {
    alignItems: 'flex-end',
  },
  barTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
