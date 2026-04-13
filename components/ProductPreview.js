import { View, Text, Image, StyleSheet } from 'react-native';
import Card from './ui/Card';
import { colors, spacing, typography } from '../constants/theme';

export default function ProductPreview({ product }) {
  if (!product) return null;

  const currency = product.currency === 'EUR' ? '€' : product.currency === 'GBP' ? '£' : '$';

  return (
    <Card style={styles.card}>
      {product.image_url && (
        <Image source={{ uri: product.image_url }} style={styles.image} resizeMode="contain" />
      )}
      <Text style={styles.domain}>{product.domain}</Text>
      <Text style={styles.name} numberOfLines={3}>{product.name}</Text>
      <Text style={styles.price}>{currency}{product.price?.toFixed(2)}</Text>
      <Text style={styles.method}>Extracted via {product.method}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
  },
  image: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: spacing.md,
    backgroundColor: colors.cardHover,
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
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.sm,
  },
  price: {
    color: colors.accent,
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.xs,
  },
  method: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
  },
});
