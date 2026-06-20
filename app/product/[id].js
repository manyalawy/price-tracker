import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Alert, StyleSheet, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useProducts } from '../../contexts/ProductsContext';
import { supabase } from '../../lib/supabase';
import { fetchPriceHistory, formatChartData } from '../../lib/priceHistory';
import { parseError } from '../../lib/errorHandler';
import StatCard from '../../components/StatCard';
import PriceChart from '../../components/PriceChart';
import EditTargetModal from '../../components/EditTargetModal';
import Button from '../../components/ui/Button';
import { colors, spacing, typography, borderRadius } from '../../constants/theme';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { products, deleteProduct, dispatch } = useProducts();
  const product = products.find(p => p.id === id);

  const [selectedRange, setSelectedRange] = useState(30);
  const [chartData, setChartData] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const loadChart = useCallback(async () => {
    if (!id) return;
    try {
      const history = await fetchPriceHistory(id, selectedRange);
      setChartData(formatChartData(history, selectedRange));
    } catch (err) {
      setChartData(null);
    }
  }, [id, selectedRange]);

  useEffect(() => {
    loadChart();
  }, [loadChart]);

  const handleDelete = () => {
    Alert.alert('Delete Product', 'This will permanently delete this product and all its price history.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteProduct(id);
          router.back();
        },
      },
    ]);
  };

  const handleSaveTarget = async (num) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ target_price: num })
        .eq('id', id);
      if (error) throw error;
      dispatch({ type: 'UPDATE_PRODUCT', payload: { id, target_price: num } });
      setModalVisible(false);
    } catch (err) {
      Alert.alert('Error', parseError(err));
    }
  };

  const handleOpenUrl = () => {
    if (product?.url) Linking.openURL(product.url);
  };

  const isPriceDrop = product && product.original_price != null && product.current_price < product.original_price;
  const isStopped = product && product.is_active === false;

  if (!product) {
    return (
      <View style={styles.container}>
        <Text style={styles.notFound}>Product not found</Text>
      </View>
    );
  }

  const savings = isPriceDrop ? product.original_price - product.current_price : null;
  const pct = isPriceDrop ? Math.round((savings / product.original_price) * 100) : null;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <Text style={styles.domain}>{product.domain}</Text>
        <Text style={styles.name}>{product.name}</Text>

        <View style={styles.priceRow}>
          <Text style={[styles.price, isPriceDrop && styles.priceAccent]}>
            {product.current_price?.toFixed(2)} {product.currency}
          </Text>
          {isPriceDrop && (
            <Text style={styles.statusBadge}>PRICE DROPPED</Text>
          )}
        </View>

        {isPriceDrop && (
          <Text style={styles.deltaSummary}>
            ↓ {savings.toFixed(2)} saved · -{pct}%
          </Text>
        )}

        {isStopped && (
          <Text style={styles.stoppedBadge}>STOPPED TRACKING</Text>
        )}

        {/* Target price row */}
        <View style={styles.targetRow}>
          <View>
            <Text style={styles.targetLabel}>PRICE ALERT</Text>
            <Text style={styles.targetValue}>
              {product.target_price != null
                ? `${product.target_price.toFixed(2)} ${product.currency}`
                : 'Not set'}
            </Text>
          </View>
          <Button
            title={product.target_price != null ? 'Edit Alert' : 'Set Alert'}
            variant="ghost"
            onPress={() => setModalVisible(true)}
            style={styles.alertBtn}
          />
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard label="Highest" value={`${product.highest_price?.toFixed(2) || '—'} ${product.currency}`} />
          <StatCard label="Lowest" value={`${product.lowest_price?.toFixed(2) || '—'} ${product.currency}`} color={colors.accent} />
          <StatCard label="Original" value={`${product.original_price?.toFixed(2) || '—'} ${product.currency}`} />
        </View>

        {/* Chart */}
        {chartData && (
          <PriceChart
            chartData={chartData}
            selectedRange={selectedRange}
            onRangeChange={setSelectedRange}
          />
        )}

        {/* Actions */}
        {product.url && (
          <Button
            title="View on Website"
            variant="ghost"
            onPress={handleOpenUrl}
            style={styles.actionBtn}
          />
        )}
        <Button
          title="Delete Product"
          variant="danger"
          onPress={handleDelete}
          style={styles.actionBtn}
        />
      </View>

      <EditTargetModal
        visible={modalVisible}
        currentTarget={product.target_price}
        currentPrice={product.current_price}
        currency={product.currency}
        onSave={handleSaveTarget}
        onClose={() => setModalVisible(false)}
      />
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
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  price: {
    color: colors.text,
    fontSize: typography.sizes.xxxl,
    fontWeight: typography.weights.bold,
  },
  priceAccent: {
    color: colors.accent,
  },
  statusBadge: {
    color: colors.accent,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    backgroundColor: colors.accent + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  deltaSummary: {
    color: colors.accent,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    marginBottom: spacing.md,
  },
  stoppedBadge: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    backgroundColor: colors.textMuted + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    alignSelf: 'flex-start',
    marginBottom: spacing.md,
  },
  targetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.cardAlt,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    marginTop: spacing.sm,
  },
  targetLabel: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  targetValue: {
    color: colors.text,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  alertBtn: {
    minWidth: 100,
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
