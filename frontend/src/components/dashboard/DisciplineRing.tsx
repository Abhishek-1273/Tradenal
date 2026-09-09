import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../../theme';

interface DisciplineRingProps {
  score: number;
  size?: number;
  subtitle?: string;
  hasTrades?: boolean;
}

const fontBase = {
  fontFamily: Platform.select({ ios: 'System', android: 'sans-serif' }),
  includeFontPadding: false,
};

export const DisciplineRing: React.FC<DisciplineRingProps> = ({
  score = 0,
  size = 110,
  subtitle,
  hasTrades = true,
}) => {
  const { colors, isDark } = useTheme();

  const currentScore = hasTrades ? Math.min(Math.max(score ?? 0, 0), 100) : 0;

  // Full 360-degree circular progress ring matching WinLossPie
  const strokeWidth = 9;
  const radius = (size - 18) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (currentScore / 100) * circumference;

  const feedbackText = subtitle || (
    !hasTrades || currentScore === 0 ? 'No trades in this period' :
    currentScore >= 80 ? 'Exceptional rule adherence!' :
    currentScore >= 60 ? 'Consistent, but room to improve.' :
    'Focus on emotional control.'
  );

  const gaugeColor = !hasTrades || currentScore === 0
    ? (isDark ? '#64748B' : '#94A3B8')
    : currentScore >= 75 ? '#10B981' : currentScore >= 50 ? '#F59E0B' : '#EF4444';

  return (
    <View style={styles.container}>
      {/* Closed 360-degree Progress Ring */}
      <View style={[styles.gaugeWrap, { width: size, height: size }]}>
        <Svg width={size} height={size}>
          {/* Background Track Circle (Full 360°) */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0'}
            strokeWidth={strokeWidth}
            fill="none"
          />

          {/* Active Filled Progress Circle */}
          {currentScore > 0 && (
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={gaugeColor}
              strokeWidth={strokeWidth}
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="none"
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          )}
        </Svg>

        {/* Center Score */}
        <View style={styles.centerText}>
          <Text style={[styles.scoreNumber, { color: gaugeColor }]}>{currentScore}</Text>
          <Text style={[styles.scoreTotal, { color: colors.textTertiary }]}>/ 100</Text>
        </View>
      </View>

      {/* Subtitle feedback */}
      <Text style={[styles.feedback, { color: colors.textTertiary }]}>
        {feedbackText}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  gaugeWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerText: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreNumber: {
    ...fontBase,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  scoreTotal: {
    ...fontBase,
    fontSize: 10.5,
    fontWeight: '600',
    marginTop: -2,
  },
  feedback: {
    ...fontBase,
    fontSize: 11,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 4,
  },
});
