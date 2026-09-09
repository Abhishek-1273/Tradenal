import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Circle, Rect, Text as SvgText } from 'react-native-svg';
import { useTheme } from '../../theme';

interface SparklineAreaProps {
  data: number[];
  width?: number;
  height?: number;
  strokeColor?: string;
  fillColor?: string;
  tooltipText?: string;
  isEmpty?: boolean;
}

/**
 * Creates a smooth SVG path string from an array of 2D points using cubic bezier curves.
 */
function createSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const current = points[i];
    const next = points[i + 1];
    const prev = points[i - 1] || current;
    const nextNext = points[i + 2] || next;

    // Smooth control points
    const cp1x = current.x + (next.x - prev.x) * 0.2;
    const cp1y = current.y + (next.y - prev.y) * 0.2;
    const cp2x = next.x - (nextNext.x - current.x) * 0.2;
    const cp2y = next.y - (nextNext.y - current.y) * 0.2;

    path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${next.x.toFixed(1)} ${next.y.toFixed(1)}`;
  }

  return path;
}

export const SparklineArea: React.FC<SparklineAreaProps> = ({
  data,
  width = 330,
  height = 90,
  strokeColor = '#10B981',
  fillColor = '#10B981',
  tooltipText,
  isEmpty = false,
}) => {
  const { isDark } = useTheme();

  const paddingX = 10;
  const paddingTop = 26;
  const paddingBottom = 8;
  const chartWidth = Math.max(width - paddingX * 2, 50);
  const chartHeight = Math.max(height - paddingTop - paddingBottom, 30);

  // If isEmpty is explicitly true, or data has 0 length
  const isZeroState = isEmpty || !data || data.length === 0 || data.every((d) => d === 0);

  if (isZeroState) {
    const flatY = paddingTop + chartHeight * 0.65;
    const tooltip = tooltipText || '$0';
    const tooltipWidth = Math.max(tooltip.length * 8 + 16, 50);
    const tooltipHeight = 22;
    const tooltipX = width - tooltipWidth - paddingX;
    const tooltipY = flatY - tooltipHeight - 6;

    return (
      <View style={[styles.container, { height }]}>
        <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
          {/* Neutral flat baseline */}
          <Path
            d={`M ${paddingX} ${flatY} L ${paddingX + chartWidth} ${flatY}`}
            fill="none"
            stroke={isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.18)'}
            strokeWidth="2"
            strokeDasharray="4, 4"
          />

          {/* Center End Dot */}
          <Circle
            cx={paddingX + chartWidth}
            cy={flatY}
            r="3.5"
            fill={isDark ? '#334155' : '#94A3B8'}
          />

          {/* Pinned Tooltip */}
          <Rect
            x={tooltipX}
            y={tooltipY}
            width={tooltipWidth}
            height={tooltipHeight}
            rx="11"
            ry="11"
            fill={isDark ? '#1E293B' : '#0F172A'}
          />
          <SvgText
            x={tooltipX + tooltipWidth / 2}
            y={tooltipY + 15}
            fill="#FFFFFF"
            fontSize="10.5"
            fontWeight="700"
            textAnchor="middle"
          >
            {tooltip}
          </SvgText>
        </Svg>
      </View>
    );
  }

  const values = data.length >= 2 ? data : [0, data[0] || 0];

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = values.map((val, idx) => {
    const x = paddingX + (idx / (values.length - 1)) * chartWidth;
    const y = paddingTop + chartHeight - ((val - min) / range) * chartHeight;
    return { x, y };
  });

  const linePath = createSmoothPath(points);
  const lastPoint = points[points.length - 1];
  const firstPoint = points[0];

  // Close path for area fill
  const areaPath = `${linePath} L ${lastPoint.x.toFixed(1)} ${(paddingTop + chartHeight).toFixed(1)} L ${firstPoint.x.toFixed(1)} ${(paddingTop + chartHeight).toFixed(1)} Z`;

  // Display text for peak / current value
  const displayTooltip = tooltipText || `$${Math.round(values[values.length - 1]).toLocaleString()}`;
  const tooltipWidth = Math.max(displayTooltip.length * 8 + 16, 56);
  const tooltipHeight = 22;
  const tooltipX = Math.min(Math.max(lastPoint.x - tooltipWidth / 2, 4), width - tooltipWidth - 4);
  const tooltipY = Math.max(lastPoint.y - tooltipHeight - 6, 2);

  return (
    <View style={[styles.container, { height }]}>
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        <Defs>
          <LinearGradient id="sparklineGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={fillColor} stopOpacity="0.32" />
            <Stop offset="70%" stopColor={fillColor} stopOpacity="0.08" />
            <Stop offset="100%" stopColor={fillColor} stopOpacity="0.00" />
          </LinearGradient>
        </Defs>

        {/* Gradient Area Fill */}
        <Path d={areaPath} fill="url(#sparklineGrad)" />

        {/* Crisp Stroke Line */}
        <Path
          d={linePath}
          fill="none"
          stroke={strokeColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Glowing Outer Dot */}
        <Circle
          cx={lastPoint.x}
          cy={lastPoint.y}
          r="6"
          fill={strokeColor}
          opacity="0.25"
        />

        {/* Solid Center Dot */}
        <Circle
          cx={lastPoint.x}
          cy={lastPoint.y}
          r="3.5"
          fill={isDark ? '#FFFFFF' : '#0F172A'}
          stroke={strokeColor}
          strokeWidth="2"
        />

        {/* Pinned Floating Tooltip Pill */}
        <Rect
          x={tooltipX}
          y={tooltipY}
          width={tooltipWidth}
          height={tooltipHeight}
          rx="11"
          ry="11"
          fill={isDark ? '#1E293B' : '#0F172A'}
        />
        <SvgText
          x={tooltipX + tooltipWidth / 2}
          y={tooltipY + 15}
          fill="#FFFFFF"
          fontSize="10.5"
          fontWeight="700"
          textAnchor="middle"
        >
          {displayTooltip}
        </SvgText>
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'visible',
    marginVertical: 4,
  },
});
