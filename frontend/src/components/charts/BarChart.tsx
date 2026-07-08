import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import {
  VictoryBar,
  VictoryChart,
  VictoryAxis,
  VictoryTooltip,
  VictoryVoronoiContainer,
} from 'victory-native';
import { useTheme } from '../../theme';

const { width: SW } = Dimensions.get('window');
const bottomPadding = 44;

interface BarDataPoint {
  x: string;
  y: number;
  label?: string;
}

interface BarChartProps {
  data: BarDataPoint[];
  height?: number;
  yLabel?: string;
  positiveColor?: string;
  negativeColor?: string;
  showTooltip?: boolean;
  tickFormat?: (t: number) => string;
  horizontalPadding?: number;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  height = 200,
  yLabel,
  positiveColor,
  negativeColor,
  showTooltip = true,
  tickFormat,
  horizontalPadding = 64,
}) => {
  const { colors, typography } = useTheme();

  const pos = positiveColor ?? colors.success;
  const neg = negativeColor ?? colors.error;

  if (!data || data.length === 0) {
    return (
      <View style={[styles.empty, { height }]}>
        <Text style={[typography.bodySm, { color: colors.textTertiary }]}>
          No data available
        </Text>
      </View>
    );
  }

  const chartWidth = SW - horizontalPadding;

  return (
    <VictoryChart
      width={chartWidth}
      height={height}
      padding={{ top: 20, bottom: 24, left: 35, right: 16 }}
      domainPadding={{ x: 12 }}
      containerComponent={
        showTooltip ? (
          <VictoryVoronoiContainer
            voronoiDimension="x"
            labels={({ datum }) =>
              `${datum.x}\n${datum.y >= 0 ? '+' : ''}${datum.y.toFixed(2)}`
            }
            labelComponent={
              <VictoryTooltip
                flyoutStyle={{
                  fill: colors.surfaceElevated,
                  stroke: colors.border,
                  strokeWidth: 1,
                }}
                style={{ fill: colors.textPrimary, fontSize: 10 }}
                flyoutPadding={{ top: 6, bottom: 6, left: 10, right: 10 }}
              />
            }
          />
        ) : undefined
      }
    >
      <VictoryAxis
        style={{
          axis: { stroke: colors.border },
          tickLabels: {
            fill: colors.textTertiary,
            fontSize: 9,
            padding: 8,
            angle: data.length > 7 ? -30 : 0,
            textAnchor: data.length > 7 ? 'end' : 'middle',
          },
          grid: { stroke: 'transparent' },
        }}
      />
      <VictoryAxis
        dependentAxis
        tickFormat={tickFormat ?? ((t) => `${t >= 0 ? '' : ''}${t.toFixed(1)}`)}
        style={{
          axis: { stroke: 'transparent' },
          tickLabels: { fill: colors.textTertiary, fontSize: 9 },
          grid: {
            stroke: colors.chartGrid,
            strokeDasharray: '4 4',
            strokeWidth: 0.5,
          },
        }}
      />
      <VictoryBar
        data={data}
        style={{
          data: {
            fill: ({ datum }: any) => (datum.y >= 0 ? pos : neg),
            opacity: 0.9,
          },
        }}
        cornerRadius={({ datum }: any) => (datum.y >= 0 ? 4 : 0)}
        barWidth={Math.max(8, Math.min(24, chartWidth / (data.length * 2)))}
      />
    </VictoryChart>
  );
};

const styles = StyleSheet.create({
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
