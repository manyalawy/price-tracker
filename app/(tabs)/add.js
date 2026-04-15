import { useState } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, Keyboard, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Button from '../../components/ui/Button';
import ProductPreview from '../../components/ProductPreview';
import { extractProduct } from '../../lib/api';
import { useProducts } from '../../contexts/ProductsContext';
import { colors, spacing, typography, borderRadius } from '../../constants/theme';

export default function AddScreen() {
  const router = useRouter();
  const { addProduct } = useProducts();
  const [url, setUrl] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [product, setProduct] = useState(null);
  const [error, setError] = useState('');

  const handleExtract = async () => {
    if (!url.trim()) {
      setError('Please enter a product URL');
      return;
    }
    Keyboard.dismiss();
    setExtracting(true);
    setError('');
    setProduct(null);

    try {
      const result = await extractProduct(url.trim());
      if (result.error || result.placeholder) {
        setError(result.error || result.message || 'Could not extract product data');
      } else {
        setProduct(result);
      }
    } catch (e) {
      setError(e.message || 'Failed to extract product data');
    } finally {
      setExtracting(false);
    }
  };

  const handleTrack = async () => {
    const target = parseFloat(targetPrice);
    if (!target || target <= 0) {
      setError('Please enter a valid target price');
      return;
    }
    setSaving(true);
    setError('');

    try {
      await addProduct({
        url: url.trim(),
        name: product.name,
        image_url: product.image_url,
        domain: product.domain,
        price: product.price,
        currency: product.currency,
        target_price: target,
        method: product.method,
        selector: product.selector,
      });
      Alert.alert('Success', 'Product is now being tracked!', [
        { text: 'OK', onPress: () => {
          setUrl('');
          setTargetPrice('');
          setProduct(null);
          router.push('/(tabs)');
        }},
      ]);
    } catch (e) {
      setError(e.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Add Product</Text>
        <Text style={styles.subtitle}>Paste a product URL to start tracking</Text>

        <View style={styles.urlRow}>
          <Text style={styles.urlIcon}>🔗</Text>
          <TextInput
            style={styles.urlInput}
            value={url}
            onChangeText={setUrl}
            placeholder="https://amazon.com/..."
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            keyboardType="url"
          />
        </View>

        <Button
          title={extracting ? 'Extracting...' : 'Fetch Product'}
          onPress={handleExtract}
          loading={extracting}
          disabled={!url.trim()}
          style={styles.button}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {product && (
          <>
            <ProductPreview product={product} />

            <Text style={styles.sectionLabel}>SET YOUR TARGET PRICE</Text>
            <View style={styles.priceInputRow}>
              <Text style={styles.currencyPrefix}>$</Text>
              <TextInput
                style={styles.priceInput}
                value={targetPrice}
                onChangeText={setTargetPrice}
                placeholder="0.00"
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
              />
              <Text style={styles.currencySuffix}>USD</Text>
            </View>

            <Button
              title="Start Tracking"
              onPress={handleTrack}
              loading={saving}
              disabled={!targetPrice}
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  title: {
    color: colors.text,
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    marginTop: spacing.md,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.sizes.md,
    marginBottom: spacing.lg,
    marginTop: spacing.xs,
  },
  urlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBg,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  urlIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  urlInput: {
    flex: 1,
    color: colors.text,
    fontSize: typography.sizes.md,
    paddingVertical: spacing.md,
  },
  error: {
    color: colors.danger,
    fontSize: typography.sizes.sm,
    marginBottom: spacing.md,
  },
  button: {
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  priceInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBg,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  currencyPrefix: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xl,
    marginRight: spacing.xs,
  },
  priceInput: {
    flex: 1,
    color: colors.text,
    fontSize: typography.sizes.xl,
    fontWeight: '600',
    paddingVertical: spacing.md,
  },
  currencySuffix: {
    color: colors.textMuted,
    fontSize: typography.sizes.sm,
    marginLeft: spacing.xs,
  },
});
