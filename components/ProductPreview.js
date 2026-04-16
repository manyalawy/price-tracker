import { View, Text, Image, StyleSheet } from 'react-native';
import { colors, spacing, typography, borderRadius } from '../constants/theme';

export default function ProductPreview({ product }) {
  if (!product) return null;

  return (
    <View style={styles.card}>
      {product.image_url && (
        <Image source={{ uri: product.image_url }} style={styles.image} resizeMode="cover" />
      )}
      <View style={styles.content}>
        <View style={styles.metaRow}>
          <Text style={styles.domain}>{product.domain?.toUpperCase()}</Text>
        </View>
        <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>{product.price?.toFixed(2)} {product.currency}</Text>
          <Text style={styles.currentLabel}>CURRENT</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardAlt,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 25 },
    shadowOpacity: 0.25,
    shadowRadius: 50,
    elevation: 10,
  },
  image: {
    width: '100%',
    height: 192,
  },
  content: {
    padding: spacing.lg,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  domain: {
    color: '#7ae6ff',
    fontSize: 11,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  methodBadge: {
    backgroundColor: colors.accent + '1A',
    borderRadius: borderRadius.full,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  methodText: {
    color: colors.accent,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  name: {
    color: colors.textWarm,
    fontSize: typography.sizes.xl,
    marginBottom: spacing.md,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  price: {
    color: colors.textWarm,
    fontSize: 30,
    letterSpacing: -0.75,
  },
  currentLabel: {
    color: colors.textLabel,
    fontSize: 11,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    marginLeft: spacing.sm,
    marginBottom: 4,
  },
});
