import { useState } from 'react';
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

  return (
    <View style={styles.container}>
      <View style={styles.rangeRow}>
        {TIME_RANGES.map(r => (
          <Pressable
            key={r.label}
            onPress={() => onRangeChange(r.days)}
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
              r: '3',
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
          withVerticalLabels={true}
          withHorizontalLabels={true}
          fromZero={false}
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
});
