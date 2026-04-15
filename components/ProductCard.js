import { View, Text, Pressable, StyleSheet, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, spacing, typography, borderRadius } from '../constants/theme';
import { useProducts } from '../contexts/ProductsContext';

export default function ProductCard({ product }) {
  const router = useRouter();
  const { deleteProduct } = useProducts();

  const priceDiff = product.target_price - product.current_price;
  const pctFromTarget = product.target_price > 0
    ? ((priceDiff / product.target_price) * 100).toFixed(0)
    : 0;
  const isAtTarget = product.current_price <= product.target_price;

  const handlePress = () => {
    router.push(`/product/${product.id}`);
  };

  const handleLongPress = () => {
    Alert.alert(
      'Delete Product',
      `Stop tracking ${product.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteProduct(product.id),
        },
      ]
    );
  };

  const currency = product.currency === 'EUR' ? '€' : product.currency === 'GBP' ? '£' : '$';

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={handleLongPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.row}>
        {product.image_url ? (
          <Image source={{ uri: product.image_url }} style={styles.thumbnail} />
        ) : (
          <View style={styles.thumbnailFallback}>
            <Text style={styles.thumbnailLetter}>
              {product.domain ? product.domain[0].toUpperCase() : '?'}
            </Text>
          </View>
        )}
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.domain} numberOfLines={1}>{product.domain}</Text>
            {isAtTarget && <Text style={styles.badge}>TARGET HIT</Text>}
          </View>
          <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.price}>{currency}{product.current_price?.toFixed(2)}</Text>
            <View style={styles.targetContainer}>
              <Text style={styles.targetLabel}>Target: </Text>
              <Text style={styles.target}>{currency}{product.target_price?.toFixed(2)}</Text>
            </View>
          </View>
          {!isAtTarget && (
            <Text style={styles.diff}>
              {currency}{Math.abs(priceDiff).toFixed(2)} above target ({Math.abs(pctFromTarget)}%)
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  pressed: {
    backgroundColor: colors.cardHover,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.sm,
    marginRight: spacing.md,
  },
  thumbnailFallback: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.cardHover,
    marginRight: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailLetter: {
    color: colors.textMuted,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  domain: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flex: 1,
    marginRight: spacing.xs,
  },
  badge: {
    color: colors.accent,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    backgroundColor: colors.accent + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  name: {
    color: colors.text,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.sm,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  price: {
    color: colors.text,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  targetContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  targetLabel: {
    color: colors.textMuted,
    fontSize: typography.sizes.sm,
  },
  target: {
    color: colors.accent,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  diff: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    marginTop: spacing.xs,
  },
});
