import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography, borderRadius } from '../constants/theme';

export default function StatsHeader({ products }) {
  const trackingCount = products.length;
  const dropsCount = products.filter(p => p.original_price != null && p.current_price < p.original_price).length;

  return (
    <View style={styles.container}>
      <View style={styles.stat}>
        <Text style={styles.statNumber}>{trackingCount}</Text>
        <Text style={styles.statLabel}>Tracking</Text>
      </View>
      <View style={styles.stat}>
        <Text style={[styles.statNumber, dropsCount > 0 && styles.accent]}>{dropsCount}</Text>
        <Text style={styles.statLabel}>Price Drops</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  stat: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  statNumber: {
    color: colors.text,
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
  },
  accent: {
    color: colors.accent,
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    marginTop: spacing.xs,
  },
});
