import { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, Alert, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useProducts } from '../../contexts/ProductsContext';
import PriceChart from '../../components/PriceChart';
import StatCard from '../../components/StatCard';
import EditTargetModal from '../../components/EditTargetModal';
import Button from '../../components/ui/Button';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import { fetchPriceHistory, formatChartData } from '../../lib/priceHistory';
import { colors, spacing, typography } from '../../constants/theme';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { products, deleteProduct, updateTargetPrice } = useProducts();
  const product = products.find(p => p.id === id);

  const [history, setHistory] = useState([]);
  const [chartData, setChartData] = useState(null);
  const [range, setRange] = useState(30);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);

  const loadHistory = useCallback(async (days) => {
    setLoadingHistory(true);
    try {
      const data = await fetchPriceHistory(id, days);
      setHistory(data);
      setChartData(formatChartData(data));
    } catch (e) {
      console.error('Failed to load price history:', e.message);
    } finally {
      setLoadingHistory(false);
    }
  }, [id]);

  useEffect(() => {
    loadHistory(range);
  }, [range, loadHistory]);

  const handleRangeChange = (days) => {
    setRange(days);
  };

  const handleEditTarget = async (newTarget) => {
    await updateTargetPrice(id, newTarget);
    setEditModalVisible(false);
  };

  const handleStopTracking = () => {
    Alert.alert('Stop Tracking', 'Are you sure you want to stop tracking this product?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Stop Tracking',
        style: 'destructive',
        onPress: async () => {
          await deleteProduct(id);
          router.back();
        },
      },
    ]);
  };

  if (!product) {
    return (
      <View style={styles.container}>
        <Text style={styles.notFound}>Product not found</Text>
      </View>
    );
  }

  const currency = product.currency === 'EUR' ? '€' : product.currency === 'GBP' ? '£' : '$';

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <Text style={styles.domain}>{product.domain}</Text>
        <Text style={styles.name}>{product.name}</Text>
        <Text style={styles.price}>{currency}{product.current_price?.toFixed(2)}</Text>

        {/* Chart */}
        {loadingHistory ? (
          <SkeletonLoader height={200} style={{ marginBottom: spacing.md }} />
        ) : (
          <PriceChart
            chartData={chartData}
            selectedRange={range}
            onRangeChange={handleRangeChange}
          />
        )}

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard label="Highest" value={`${currency}${product.highest_price?.toFixed(2) || '—'}`} />
          <StatCard label="Lowest" value={`${currency}${product.lowest_price?.toFixed(2) || '—'}`} color={colors.accent} />
          <StatCard label="Target" value={`${currency}${product.target_price?.toFixed(2)}`} color={colors.accent} />
        </View>

        {/* Actions */}
        <Button
          title="Edit Target Price"
          variant="ghost"
          onPress={() => setEditModalVisible(true)}
          style={styles.actionBtn}
        />
        <Button
          title="Stop Tracking"
          variant="danger"
          onPress={handleStopTracking}
          style={styles.actionBtn}
        />

        <EditTargetModal
          visible={editModalVisible}
          currentTarget={product.target_price}
          onSave={handleEditTarget}
          onClose={() => setEditModalVisible(false)}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
  },
  domain: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  name: {
    color: colors.text,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.sm,
  },
  price: {
    color: colors.accent,
    fontSize: typography.sizes.xxxl,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  actionBtn: {
    marginBottom: spacing.sm,
  },
  notFound: {
    color: colors.textSecondary,
    fontSize: typography.sizes.lg,
    textAlign: 'center',
    marginTop: 100,
  },
});
