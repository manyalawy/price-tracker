import { useState } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, Keyboard, Alert, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import ProductPreview from '../../components/ProductPreview';
import ReportURLModal from '../../components/ReportURLModal';
import { extractProduct } from '../../lib/api';
import { useProducts } from '../../contexts/ProductsContext';
import { parseError } from '../../lib/errorHandler';
import { colors, spacing, typography, borderRadius } from '../../constants/theme';
import { MAX_PRODUCTS } from '../../constants/config';
import AppHeader from '../../components/ui/AppHeader';

export default function AddScreen() {
  const router = useRouter();
  const { addProduct, products } = useProducts();
  const [url, setUrl] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [product, setProduct] = useState(null);
  const [error, setError] = useState('');
  const [extractFailed, setExtractFailed] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);

  const handleExtract = async () => {
    if (!url.trim()) {
      setError('Please enter a product URL');
      return;
    }
    Keyboard.dismiss();
    setExtracting(true);
    setError('');
    setExtractFailed(false);
    setProduct(null);

    try {
      const result = await extractProduct(url.trim());
      if (result.error || result.placeholder) {
        setError("We couldn't fetch that item. Please check the URL and try again.");
        setExtractFailed(true);
      } else {
        setProduct(result);
      }
    } catch (e) {
      setError("We couldn't fetch that item. Please check the URL and try again.");
      setExtractFailed(true);
    } finally {
      setExtracting(false);
    }
  };

  const handleTrack = async () => {
    if (products.length >= MAX_PRODUCTS) {
      setError(`You've reached the ${MAX_PRODUCTS}-product limit. Remove a product to add a new one.`);
      return;
    }
    const target = parseFloat(targetPrice);
    if (!target || target <= 0) {
      setError('Please enter a valid target price');
      return;
    }
    if (target >= product.price) {
      setError('Target price must be lower than the current price');
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
      setError(parseError(e));
    } finally {
      setSaving(false);
    }
  };

  const fetchDisabled = !url.trim() || extracting;
  const trackDisabled = !targetPrice || saving;

  return (
    <View style={styles.container}>
      <AppHeader />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <SafeAreaView edges={['bottom']} style={styles.flex}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

          <View style={styles.headingSection}>
            <Text style={styles.title}>Add Product</Text>
            <Text style={styles.subtitle}>Paste a product link to start tracking</Text>
          </View>

          <View style={styles.urlSection}>
            <View style={styles.urlInputWrapper}>
              <View style={styles.urlIconContainer}>
                <Ionicons name="link-outline" size={20} color={colors.textSecondary} />
              </View>
              <TextInput
                style={styles.urlInput}
                value={url}
                onChangeText={setUrl}
                placeholder="https://amazon.com/..."
                placeholderTextColor="#767577"
                autoCapitalize="none"
                keyboardType="url"
              />
            </View>

            <TouchableOpacity onPress={handleExtract} disabled={fetchDisabled} activeOpacity={0.85}>
              <LinearGradient
                colors={['#3fff8b', '#13ea79']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.fetchButton, fetchDisabled && styles.buttonDisabled]}
              >
                <Text style={styles.fetchButtonText}>
                  {extracting ? 'Fetching...' : 'Fetch Product'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {error ? (
              <View style={styles.errorRow}>
                <Ionicons name="alert-circle" size={15} color={colors.dangerAlt} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}
            {extractFailed ? (
              <TouchableOpacity
                style={styles.reportRow}
                onPress={() => setReportModalVisible(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="flag-outline" size={13} color={colors.textSecondary} />
                <Text style={styles.reportText}>Report this URL</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {product && (
            <View style={styles.fetchedSection}>
              <ProductPreview product={product} />

              <View style={styles.targetPriceWrapper}>
                <Text style={styles.targetLabel}>SET YOUR TARGET PRICE</Text>
                <View style={styles.targetInputContainer}>
                  <TextInput
                    style={styles.targetInput}
                    value={targetPrice}
                    onChangeText={setTargetPrice}
                    placeholder="0.00"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="decimal-pad"
                  />
                  <View style={styles.targetUsdContainer}>
                    <Text style={styles.targetUsd}>{product.currency}</Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity onPress={handleTrack} disabled={trackDisabled} activeOpacity={0.85}>
                <LinearGradient
                  colors={['#3fff8b', '#13ea79']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.trackButton, trackDisabled && styles.buttonDisabled]}
                >
                  <Text style={styles.trackButtonText}>
                    {saving ? 'Saving...' : 'Start Tracking'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

        </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
      <ReportURLModal
        visible={reportModalVisible}
        url={url}
        onClose={() => setReportModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 100,
  },
  headingSection: {
    marginTop: spacing.md,
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  title: {
    color: colors.textWarm,
    fontSize: typography.sizes.display,
    fontWeight: typography.weights.regular,
    letterSpacing: -0.9,
  },
  subtitle: {
    color: colors.textLabel,
    fontSize: typography.sizes.lg,
  },
  urlSection: {
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  urlInputWrapper: {
    height: 64,
    backgroundColor: colors.iconBg,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
  },
  urlIconContainer: {
    position: 'absolute',
    left: 20,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  urlInput: {
    flex: 1,
    color: colors.text,
    fontSize: typography.sizes.lg,
    paddingLeft: 56,
    paddingRight: spacing.lg,
    height: '100%',
  },
  fetchButton: {
    height: 56,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  fetchButtonText: {
    color: colors.accentText,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.medium,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  errorText: {
    color: colors.dangerAlt,
    fontSize: typography.sizes.sm,
    flex: 1,
  },
  reportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    marginTop: spacing.xs,
  },
  reportText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
  fetchedSection: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(72,71,74,0.1)',
    paddingTop: 17,
    gap: spacing.xl,
  },
  targetPriceWrapper: {
    gap: spacing.sm,
  },
  targetLabel: {
    color: colors.textLabel,
    fontSize: 11,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    paddingHorizontal: spacing.xs,
  },
  targetInputContainer: {
    height: 80,
    backgroundColor: colors.groupBg,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(72,71,74,0.2)',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  targetInput: {
    flex: 1,
    color: colors.textMuted,
    fontSize: typography.sizes.display,
    letterSpacing: -0.9,
    paddingLeft: spacing.lg,
    paddingRight: 64,
    height: '100%',
  },
  targetUsdContainer: {
    position: 'absolute',
    right: 24,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  targetUsd: {
    color: 'rgba(63,255,139,0.4)',
    fontSize: typography.sizes.sm,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  trackButton: {
    height: 64,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 40,
    elevation: 8,
  },
  trackButtonText: {
    color: colors.accentText,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.medium,
  },
});
