import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import {
  VictoryLine,
  VictoryChart,
  VictoryAxis,
  VictoryArea,
  VictoryScatter,
  VictoryVoronoiContainer,
  VictoryTooltip,
} from 'victory-native';
import { useTheme } from '../../theme';

const { width: SW } = Dimensions.get('window');

interface LineDataPoint {
  x: number | string;
  y: number;
  label?: string;
}

interface LineChartProps {
  data: LineDataPoint[];
  height?: number;
  color?: string;
  fill?: boolean;
  fillColor?: string;
  showDots?: boolean;
  showTooltip?: boolean;
  yTickFormat?: (t: number) => string;
  xTickFormat?: (t: any) => string;
  horizontalPadding?: number;
  referenceY?: number;
  referenceColor?: string;
}

export const LineChart: React.FC<LineChartProps> = ({
  data,
  height = 180,
  color,
  fill = true,
  fillColor,
  showDots = false,
  showTooltip = true,
  yTickFormat,
  xTickFormat,
  horizontalPadding = 64,
  referenceY,
  referenceColor,
}) => {
  const { colors } = useTheme();

  const lineColor = color ?? colors.chartLine;
  const areaFill = fillColor ?? lineColor + '30';

  if (!data || data.length < 2) {
    return (
      <View style={[styles.empty, { height }]}>
        <Text style={{ color: colors.textTertiary, fontSize: 13 }}>
          Not enough data
        </Text>
      </View>
    );
  }

  const chartWidth = SW - horizontalPadding;
  const chartData = data.map(({ label, ...point }) => point);
  const allY = data.map((d) => d.y);
  const minY = Math.min(...allY);
  const maxY = Math.max(...allY);
  const padding = Math.abs(maxY - minY) * 0.15 || 5;

  const container = showTooltip ? (
    <VictoryVoronoiContainer
      voronoiDimension="x"
      labels={({ datum }) =>
        `${datum.label ?? datum.x}\n${datum.y >= 0 ? '+' : ''}${datum.y.toFixed(1)}`
      }
      labelComponent={
        <VictoryTooltip
          flyoutStyle={{ fill: colors.surfaceElevated, stroke: colors.border, strokeWidth: 1 }}
          style={{ fill: colors.textPrimary, fontSize: 10 }}
          flyoutPadding={{ top: 6, bottom: 6, left: 10, right: 10 }}
        />
      }
    />
  ) : undefined;

  return (
    <VictoryChart
      width={chartWidth}
      height={height}
      padding={{ top: 16, bottom: 20, left: 30, right: 16 }}
      domain={{ y: [minY - padding, maxY + padding] }}
      containerComponent={container}
    >
      <VictoryAxis
        style={{
          axis: { stroke: colors.border },
          tickLabels: {
            fill: colors.textTertiary,
            fontSize: 9,
          },
          grid: { stroke: 'transparent' },
        }}
        tickFormat={xTickFormat}
        tickCount={data.length}
      />
      <VictoryAxis
        dependentAxis
        tickFormat={yTickFormat ?? ((t) => t.toFixed(0))}
        style={{
          axis: { stroke: 'transparent' },
          tickLabels: { fill: colors.textTertiary, fontSize: 9 },
          grid: { stroke: colors.chartGrid, strokeDasharray: '4 4', strokeWidth: 0.5 },
        }}
        tickCount={4}
      />

      {fill && (
        <VictoryArea
          data={chartData}
          labels={() => null}
          style={{ data: { fill: areaFill, stroke: 'none' } }}
          interpolation="monotoneX"
        />
      )}

      <VictoryLine
        data={chartData}
        labels={() => null}
        style={{ data: { stroke: lineColor, strokeWidth: 2.5 } }}
        interpolation="monotoneX"
      />

      {showDots && (
        <VictoryScatter
          data={chartData}
          labels={() => null}
          size={3}
          style={{ data: { fill: lineColor, stroke: colors.background, strokeWidth: 1.5 } }}
        />
      )}
    </VictoryChart>
  );
};

const styles = StyleSheet.create({
  empty: { alignItems: 'center', justifyContent: 'center' },
});
