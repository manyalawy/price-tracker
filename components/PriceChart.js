import { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { colors, spacing, typography, borderRadius } from '../constants/theme';

const screenWidth = Dimensions.get('window').width - spacing.md * 2;

const TIME_RANGES = [
  { label: '7D', days: 7 },
  { label: '30D', days: 30 },
  { label: '90D', days: 90 },
  { label: 'All', days: null },
];

export default function PriceChart({ chartData, selectedRange, onRangeChange }) {
  const hasData = chartData?.datasets?.[0]?.data?.length > 1;
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, index: -1 });

  useEffect(() => {
    setTooltip({ visible: false, x: 0, y: 0, index: -1 });
  }, [chartData]);

  const handleRangeChange = (days) => {
    onRangeChange(days);
  };

  return (
    <View style={styles.container}>
      <View style={styles.rangeRow}>
        {TIME_RANGES.map(r => (
          <Pressable
            key={r.label}
            onPress={() => handleRangeChange(r.days)}
            style={[styles.rangeButton, selectedRange === r.days && styles.rangeActive]}
          >
            <Text style={[styles.rangeText, selectedRange === r.days && styles.rangeTextActive]}>
              {r.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {hasData ? (
        <LineChart
          data={chartData}
          width={screenWidth}
          height={200}
          chartConfig={{
            backgroundColor: colors.card,
            backgroundGradientFrom: colors.card,
            backgroundGradientTo: colors.card,
            decimalPlaces: 2,
            color: (opacity = 1) => `rgba(74, 222, 128, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(156, 163, 175, ${opacity})`,
            propsForDots: {
              r: '5',
              strokeWidth: '1',
              stroke: colors.accent,
            },
            propsForBackgroundLines: {
              strokeDasharray: '',
              stroke: colors.border + '40',
            },
          }}
          bezier
          style={styles.chart}
          withInnerLines={true}
          withOuterLines={false}
          withVerticalLabels={false}
          withHorizontalLabels={true}
          fromZero={false}
          onDataPointClick={({ x, y, index }) => {
            setTooltip(prev =>
              prev.visible && prev.index === index
                ? { visible: false, x: 0, y: 0, index: -1 }
                : { visible: true, x, y, index }
            );
          }}
          decorator={() => {
            if (!tooltip.visible) return null;
            const label = chartData.labels[tooltip.index];
            const price = chartData.datasets[0].data[tooltip.index];
            const tipWidth = 90;
            const left = Math.min(
              Math.max(tooltip.x - tipWidth / 2, 0),
              screenWidth - tipWidth
            );
            return (
              <View style={[styles.tooltip, { left, top: tooltip.y - 52 }]}>
                <Text style={styles.tooltipDate}>{label}</Text>
                <Text style={styles.tooltipPrice}>{price?.toFixed(2)}</Text>
              </View>
            );
          }}
        />
      ) : (
        <View style={styles.noData}>
          <Text style={styles.noDataText}>Not enough data for chart</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  rangeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  rangeButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.card,
  },
  rangeActive: {
    backgroundColor: colors.accent,
  },
  rangeText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  rangeTextActive: {
    color: '#0a0a0a',
  },
  chart: {
    borderRadius: borderRadius.md,
  },
  noData: {
    height: 200,
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    color: colors.textMuted,
    fontSize: typography.sizes.md,
  },
  tooltip: {
    position: 'absolute',
    backgroundColor: colors.cardAlt,
    borderRadius: borderRadius.sm,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    width: 90,
  },
  tooltipDate: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
  },
  tooltipPrice: {
    color: colors.accent,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
});
