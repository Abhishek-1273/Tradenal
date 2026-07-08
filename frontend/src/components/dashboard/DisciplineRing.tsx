import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { VictoryPie } from 'victory-native';
import { useTheme } from '../../theme';
import {
  getDisciplineScoreColor,
  getDisciplineScoreLabel,
} from '../../utils/formatters';

interface DisciplineRingProps {
  score: number;
  size?: number;
  showLabel?: boolean;
  breakdown?: {
    planFollowed: number;
    noRevengeTrade: number;
    noOvertrading: number;
    noMovedSL: number;
  };
}

export const DisciplineRing: React.FC<DisciplineRingProps> = ({
  score,
  size = 120,
  showLabel = true,
  breakdown,
}) => {
  const { colors, typography, spacing } = useTheme();
  const scoreColor = getDisciplineScoreColor(score, colors);
  const scoreLabel = getDisciplineScoreLabel(score);

  const ringData = [
    { x: 'score', y: score },
    { x: 'remaining', y: 100 - score },
  ];

  return (
    <View style={styles.container}>
      <View style={[styles.ringWrap, { width: size, height: size }]}>
        <VictoryPie
          data={ringData}
          width={size}
          height={size}
          padding={0}
          innerRadius={size * 0.38}
          colorScale={[scoreColor, colors.surfaceHighlight]}
          labels={() => null}
          startAngle={-120}
          endAngle={120}
          style={{
            data: {
              stroke: 'transparent',
            },
          }}
        />
        <View style={styles.centerContent}>
          <Text
            style={[
              typography.numeric,
              { color: scoreColor, fontSize: size * 0.22 },
            ]}
          >
            {score}
          </Text>
          <Text style={[typography.caption, { color: colors.textTertiary }]}>
            / 100
          </Text>
        </View>
      </View>

      {showLabel && (
        <Text
          style={[
            typography.label,
            { color: scoreColor, marginTop: spacing[2], textAlign: 'center' },
          ]}
        >
          {scoreLabel}
        </Text>
      )}

      {breakdown && (
        <View style={[styles.breakdown, { marginTop: spacing[4] }]}>
          {[
            { label: 'Plan Followed', value: breakdown.planFollowed },
            { label: 'No Revenge', value: breakdown.noRevengeTrade },
            { label: 'No Overtrading', value: breakdown.noOvertrading },
            { label: 'SL Respected', value: breakdown.noMovedSL },
          ].map((item) => (
            <View key={item.label} style={[styles.breakdownRow, { marginBottom: spacing[2] }]}>
              <Text style={[typography.caption, { color: colors.textSecondary, flex: 1 }]}>
                {item.label}
              </Text>
              <View style={[styles.barTrack, { backgroundColor: colors.surfaceHighlight }]}>
                <View
                  style={[
                    styles.barFill,
                    {
                      width: `${item.value}%`,
                      backgroundColor:
                        item.value >= 80
                          ? colors.success
                          : item.value >= 60
                          ? colors.warning
                          : colors.error,
                    },
                  ]}
                />
              </View>
              <Text style={[typography.caption, { color: colors.textTertiary, width: 36, textAlign: 'right' }]}>
                {item.value}%
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  ringWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContent: {
    position: 'absolute',
    alignItems: 'center',
  },
  breakdown: {
    width: '100%',
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  barTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 2,
  },
});
