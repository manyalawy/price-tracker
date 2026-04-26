import { View, Text, ScrollView, Alert, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useProducts } from '../../contexts/ProductsContext';
import StatCard from '../../components/StatCard';
import Button from '../../components/ui/Button';
import { colors, spacing, typography } from '../../constants/theme';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { products, deleteProduct } = useProducts();
  const product = products.find(p => p.id === id);

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

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <Text style={styles.domain}>{product.domain}</Text>
        <Text style={styles.name}>{product.name}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>{product.current_price?.toFixed(2)} {product.currency}</Text>
          <Text style={styles.statusBadge}>
            {product.original_price != null && product.current_price < product.original_price ? 'PRICE DROP' : 'ON'}
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard label="Highest" value={`${product.highest_price?.toFixed(2) || '—'} ${product.currency}`} />
          <StatCard label="Lowest" value={`${product.lowest_price?.toFixed(2) || '—'} ${product.currency}`} color={colors.accent} />
          <StatCard label="Original" value={`${product.original_price?.toFixed(2) || '—'} ${product.currency}`} />
        </View>

        {/* Actions */}
        <Button
          title="Stop Tracking"
          variant="danger"
          onPress={handleStopTracking}
          style={styles.actionBtn}
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
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  price: {
    color: colors.accent,
    fontSize: typography.sizes.xxxl,
    fontWeight: typography.weights.bold,
  },
  statusBadge: {
    color: colors.accent,
    fontSize: typography.sizes.xs,
    fontWeight: '700',
    backgroundColor: colors.accent + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: 'hidden',
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
