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
import { useAuth } from '../../contexts/AuthContext';
import { parseError } from '../../lib/errorHandler';
import { colors, spacing, typography, borderRadius } from '../../constants/theme';
import { MAX_PRODUCTS } from '../../constants/config';
import AppHeader from '../../components/ui/AppHeader';
import Input from '../../components/ui/Input';

export default function AddScreen() {
  const router = useRouter();
  const { addProduct, products } = useProducts();
  const { user } = useAuth();
  const [url, setUrl] = useState('');
  const [productName, setProductName] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [product, setProduct] = useState(null);
  const [error, setError] = useState('');
  const [extractFailed, setExtractFailed] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [notificationMode, setNotificationMode] = useState('any_drop');
  const [targetPrice, setTargetPrice] = useState('');

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
        setProductName(result.name);
      }
    } catch (e) {
      setError("We couldn't fetch that item. Please check the URL and try again.");
      setExtractFailed(true);
    } finally {
      setExtracting(false);
    }
  };

  const handleTrack = async () => {
    if (!user) {
      Alert.alert(
        'Sign in to track',
        'Create a free account to save this product and get price-drop alerts.',
        [
          { text: 'Not now', style: 'cancel' },
          { text: 'Sign In', onPress: () => router.push('/(auth)/login') },
        ]
      );
      return;
    }
    if (products.length >= MAX_PRODUCTS) {
      setError(`You've reached the ${MAX_PRODUCTS}-product limit. Remove a product to add a new one.`);
      return;
    }
    if (notificationMode === 'target_price') {
      const parsed = parseFloat(targetPrice);
      if (!parsed || parsed <= 0) {
        setError('Please enter a valid target price');
        return;
      }
      if (parsed >= product.price) {
        setError('Target price must be lower than the current price');
        return;
      }
    }

    setSaving(true);
    setError('');

    try {
      await addProduct({
        url: url.trim(),
        name: productName.trim() || product.name,
        image_url: product.image_url,
        domain: product.domain,
        price: product.price,
        currency: product.currency,
        method: product.method,
        selector: product.selector,
        target_price: notificationMode === 'target_price' ? parseFloat(targetPrice) : null,
      });
      Alert.alert('Success', 'Product is now being tracked!', [
        { text: 'OK', onPress: () => {
          setUrl('');
          setProduct(null);
          setProductName('');
          setNotificationMode('any_drop');
          setTargetPrice('');
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
  const trackDisabled = saving;

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
              <ProductPreview product={product} nameOverride={productName} />
              <Input
                label="Product Name"
                value={productName}
                onChangeText={setProductName}
                placeholder="Enter product name"
              />

              <View style={styles.alertSection}>
                <Text style={styles.alertLabel}>HOW SHOULD WE ALERT YOU?</Text>

                <TouchableOpacity
                  style={[styles.alertCard, notificationMode === 'any_drop' && styles.alertCardSelected]}
                  onPress={() => setNotificationMode('any_drop')}
                  activeOpacity={0.8}
                >
                  <View style={styles.alertCardRow}>
                    <Ionicons
                      name="notifications-outline"
                      size={20}
                      color={notificationMode === 'any_drop' ? colors.accent : colors.textMuted}
                    />
                    <View style={styles.alertCardText}>
                      <Text style={[styles.alertCardTitle, notificationMode === 'any_drop' && styles.alertCardTitleSelected]}>
                        Any price drop
                      </Text>
                      <Text style={styles.alertCardDesc}>
                        Notify me whenever the price drops below what it is today.
                      </Text>
                    </View>
                    <Ionicons
                      name={notificationMode === 'any_drop' ? 'radio-button-on-outline' : 'radio-button-off-outline'}
                      size={20}
                      color={notificationMode === 'any_drop' ? colors.accent : colors.textMuted}
                    />
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.alertCard, notificationMode === 'target_price' && styles.alertCardSelected]}
                  onPress={() => setNotificationMode('target_price')}
                  activeOpacity={0.8}
                >
                  <View style={styles.alertCardRow}>
                    <Ionicons
                      name="pricetag-outline"
                      size={20}
                      color={notificationMode === 'target_price' ? colors.accent : colors.textMuted}
                    />
                    <View style={styles.alertCardText}>
                      <Text style={[styles.alertCardTitle, notificationMode === 'target_price' && styles.alertCardTitleSelected]}>
                        Target price
                      </Text>
                      <Text style={styles.alertCardDesc}>
                        Only alert me when the price hits a number I choose.
                      </Text>
                    </View>
                    <Ionicons
                      name={notificationMode === 'target_price' ? 'radio-button-on-outline' : 'radio-button-off-outline'}
                      size={20}
                      color={notificationMode === 'target_price' ? colors.accent : colors.textMuted}
                    />
                  </View>
                  {notificationMode === 'target_price' && (
                    <View style={styles.targetInputRow}>
                      <Text style={styles.targetCurrency}>{product.currency || 'USD'}</Text>
                      <TextInput
                        style={styles.targetInput}
                        value={targetPrice}
                        onChangeText={(t) => { setTargetPrice(t); setError(''); }}
                        placeholder="0.00"
                        placeholderTextColor={colors.textMuted}
                        keyboardType="decimal-pad"
                        autoFocus
                      />
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.trackSection}>
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

                <View style={styles.checkNote}>
                  <Ionicons name="time-outline" size={13} color={colors.textMuted} />
                  <Text style={styles.checkNoteText}>Prices are checked every 24 hours</Text>
                </View>
              </View>
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
  alertSection: {
    gap: spacing.sm,
  },
  alertLabel: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  alertCard: {
    backgroundColor: colors.cardAlt,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  alertCardSelected: {
    backgroundColor: colors.accent + '20',
    borderColor: colors.accent,
  },
  alertCardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  alertCardText: {
    flex: 1,
    gap: 3,
  },
  alertCardTitle: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  alertCardTitleSelected: {
    color: colors.text,
  },
  alertCardDesc: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    lineHeight: 16,
  },
  targetInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBg,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
  },
  targetCurrency: {
    color: colors.textSecondary,
    fontSize: typography.sizes.md,
    marginRight: spacing.xs,
  },
  targetInput: {
    flex: 1,
    color: colors.text,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    paddingVertical: spacing.sm,
  },
  trackSection: {
    gap: spacing.sm,
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
  checkNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  checkNoteText: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
  },
});
