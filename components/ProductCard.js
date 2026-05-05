import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, spacing, typography, borderRadius } from '../constants/theme';
import { useProducts } from '../contexts/ProductsContext';

export default function ProductCard({ product }) {
  const router = useRouter();
  const { deleteProduct } = useProducts();

  const isPriceDrop = product.original_price != null && product.current_price < product.original_price;
  const isStopped = product.is_active === false;

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

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={handleLongPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.topSection}>
        <View style={styles.topLeft}>
          <Text style={styles.domain}>{product.domain}</Text>
          <Text style={[styles.name, isStopped && styles.mutedText]} numberOfLines={2}>{product.name}</Text>
        </View>
        <View style={styles.badgeRow}>
          {isStopped && (
            <View style={styles.stoppedBadge}>
              <Text style={styles.stoppedBadgeText}>STOPPED TRACKING</Text>
            </View>
          )}
          {isPriceDrop && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>PRICE DROPPED</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.bottomSection}>
        <View>
          <View style={styles.priceRow}>
            <Text style={[styles.price, isPriceDrop && styles.priceAtTarget, isStopped && styles.mutedText]}>
              {product.current_price?.toFixed(2)}
            </Text>
            <Text style={[styles.currencyLabel, isStopped && styles.mutedText]}>{product.currency}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardAlt,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  pressed: {
    opacity: 0.85,
  },
  topSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  topLeft: {
    flex: 1,
    marginRight: spacing.sm,
    gap: spacing.xs,
  },
  domain: {
    color: colors.textLabel,
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    fontWeight: typography.weights.regular,
  },
  name: {
    color: colors.textWarm,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.regular,
  },
  badge: {
    backgroundColor: colors.accent + '1a',
    borderRadius: borderRadius.full,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  badgeText: {
    color: colors.accent,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    textAlign: 'center',
    fontWeight: typography.weights.regular,
  },
  bottomSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: spacing.lg,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  price: {
    fontSize: typography.sizes.display,
    letterSpacing: -1.8,
    color: colors.textWarm,
    fontWeight: typography.weights.regular,
  },
  priceAtTarget: {
    color: colors.accent,
  },
  mutedText: {
    color: colors.textMuted,
  },
  badgeRow: {
    gap: spacing.xs,
    alignItems: 'flex-end',
  },
  stoppedBadge: {
    backgroundColor: colors.textMuted + '20',
    borderRadius: borderRadius.full,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  stoppedBadgeText: {
    color: colors.textMuted,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    textAlign: 'center',
    fontWeight: typography.weights.regular,
  },
  currencyLabel: {
    fontSize: 10,
    color: colors.textLabel,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginLeft: spacing.xs,
    marginBottom: 4,
  },
});
