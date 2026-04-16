# Add Screen Figma Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Add Product screen (`app/(tabs)/add.js`) and its dependencies to exactly match the Figma design at node 1-187.

**Architecture:** Four files change in dependency order: theme tokens first, then the shared Button component, then ProductPreview, then the screen itself. Each task is self-contained and leaves the app in a working state.

**Tech Stack:** React Native 0.81 + Expo 54, `expo-linear-gradient` (already installed), `@expo/vector-icons` Ionicons (already installed), `StyleSheet.create()` + `constants/theme.js` tokens.

**Spec:** `docs/superpowers/specs/2026-04-16-add-screen-figma-redesign.md`

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `constants/theme.js` | Modify | Add `colors.cyan` token |
| `components/ui/Button.js` | Modify | Add `gradient` variant |
| `components/ProductPreview.js` | Modify | Full redesign to Figma hero card |
| `app/(tabs)/add.js` | Modify | Full layout + style redesign |

---

## Task 1: Add `colors.cyan` to theme

**Files:**
- Modify: `constants/theme.js`

- [ ] **Step 1: Open `constants/theme.js` and add `cyan` after the `iconBg` entry in the `colors` object**

  Find the `iconBg` line and add `cyan` immediately after:
  ```js
  iconBg: '#262528',        // icon container background
  cyan: '#7ae6ff',          // domain tag on product preview card
  ```

- [ ] **Step 2: Verify the file has no syntax errors**

  ```bash
  node -e "require('./constants/theme.js')" 2>&1 || echo "syntax error"
  ```
  Expected: no output (no syntax error).

- [ ] **Step 3: Commit**

  ```bash
  git add constants/theme.js
  git commit -m "feat: add colors.cyan token for product domain tag"
  ```

---

## Task 2: Add `gradient` variant to Button

**Files:**
- Modify: `components/ui/Button.js`

- [ ] **Step 1: Replace the full contents of `components/ui/Button.js` with the following**

  Note: a `fontSize` prop is added so callers can match exact Figma type sizes on gradient buttons (18px for "Fetch Product", 20px for "Start Tracking"). It defaults to `typography.sizes.md` so no existing call sites break.

  ```js
  import { Pressable, Text, ActivityIndicator, StyleSheet } from 'react-native';
  import { LinearGradient } from 'expo-linear-gradient';
  import { colors, spacing, typography, borderRadius } from '../../constants/theme';

  const VARIANTS = {
    primary: {
      bg: colors.accent,
      bgPressed: colors.accentDark,
      text: '#0a0a0a',
    },
    danger: {
      bg: colors.danger,
      bgPressed: colors.dangerDark,
      text: '#ffffff',
    },
    ghost: {
      bg: 'transparent',
      bgPressed: colors.cardHover,
      text: colors.text,
    },
  };

  export default function Button({ title, onPress, variant = 'primary', loading = false, disabled = false, fontSize = typography.sizes.md, style }) {
    const isDisabled = disabled || loading;

    if (variant === 'gradient') {
      return (
        <LinearGradient
          colors={[colors.accent, colors.accentGradientEnd]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={[styles.gradient, isDisabled && styles.disabled, style]}
        >
          <Pressable
            onPress={onPress}
            disabled={isDisabled}
            style={styles.gradientPressable}
          >
            {loading ? (
              <ActivityIndicator color={colors.accentText} size="small" />
            ) : (
              <Text style={[styles.gradientText, { fontSize }]}>{title}</Text>
            )}
          </Pressable>
        </LinearGradient>
      );
    }

    const v = VARIANTS[variant] || VARIANTS.primary;
    return (
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: pressed ? v.bgPressed : v.bg },
          variant === 'ghost' && styles.ghost,
          isDisabled && styles.disabled,
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={v.text} size="small" />
        ) : (
          <Text style={[styles.text, { color: v.text }]}>{title}</Text>
        )}
      </Pressable>
    );
  }

  const styles = StyleSheet.create({
    button: {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderRadius: borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 48,
    },
    ghost: {
      borderWidth: 1,
      borderColor: colors.border,
    },
    text: {
      fontSize: typography.sizes.md,
      fontWeight: typography.weights.semibold,
    },
    disabled: {
      opacity: 0.5,
    },
    gradient: {
      borderRadius: borderRadius.full,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
    },
    gradientPressable: {
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      justifyContent: 'center',
    },
    gradientText: {
      color: colors.accentText,
      fontWeight: typography.weights.semibold,
    },
  });
  ```

- [ ] **Step 2: Verify syntax**

  ```bash
  node -e "require('./components/ui/Button.js')" 2>&1 || echo "syntax error"
  ```
  Expected: a Module not found error for `expo-linear-gradient` (that's fine — it means syntax is valid, the import just can't resolve outside Expo bundler).

- [ ] **Step 3: Commit**

  ```bash
  git add components/ui/Button.js
  git commit -m "feat: add gradient variant to Button component"
  ```

---

## Task 3: Redesign ProductPreview

**Files:**
- Modify: `components/ProductPreview.js`

- [ ] **Step 1: Replace the full contents of `components/ProductPreview.js` with the following**

  ```js
  import { View, Text, Image, StyleSheet } from 'react-native';
  import { colors, spacing, typography, borderRadius } from '../constants/theme';

  export default function ProductPreview({ product }) {
    if (!product) return null;

    const currency = product.currency === 'EUR' ? '€' : product.currency === 'GBP' ? '£' : '$';

    return (
      <View style={styles.card}>
        {product.image_url && (
          <Image source={{ uri: product.image_url }} style={styles.image} resizeMode="cover" />
        )}
        <View style={styles.content}>
          <View style={styles.metaRow}>
            <Text style={styles.domain}>{product.domain?.toUpperCase()}</Text>
            {product.method && (
              <View style={styles.methodBadge}>
                <Text style={styles.methodText}>VIA {product.method?.toUpperCase()}</Text>
              </View>
            )}
          </View>
          <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.price}>{currency}{product.price?.toFixed(2)}</Text>
            <Text style={styles.priceLabel}>CURRENT</Text>
          </View>
        </View>
      </View>
    );
  }

  const styles = StyleSheet.create({
    card: {
      backgroundColor: colors.cardAlt,
      borderRadius: 32,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 25 },
      shadowOpacity: 0.25,
      shadowRadius: 50,
      elevation: 12,
    },
    image: {
      width: '100%',
      height: 192,
    },
    content: {
      padding: spacing.lg,
      gap: spacing.sm,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    domain: {
      color: colors.cyan,
      fontSize: typography.sizes.xs,
      letterSpacing: 1.1,
    },
    methodBadge: {
      backgroundColor: colors.accent + '1a',
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: borderRadius.full,
    },
    methodText: {
      color: colors.accent,
      fontSize: 10,
      letterSpacing: 1,
    },
    name: {
      color: colors.textWarm,
      fontSize: typography.sizes.xl,
      fontWeight: typography.weights.regular,
    },
    priceRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: spacing.sm,
      paddingTop: spacing.md,
    },
    price: {
      color: colors.textWarm,
      fontSize: 30,
      letterSpacing: -0.75,
    },
    priceLabel: {
      color: colors.textLabel,
      fontSize: typography.sizes.xs,
      letterSpacing: 1.1,
      textTransform: 'uppercase',
    },
  });
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add components/ProductPreview.js
  git commit -m "feat: redesign ProductPreview card to match Figma"
  ```

---

## Task 4: Redesign the Add screen

**Files:**
- Modify: `app/(tabs)/add.js`

- [ ] **Step 1: Replace the full contents of `app/(tabs)/add.js` with the following**

  ```js
  import { useState } from 'react';
  import { View, Text, TextInput, ScrollView, StyleSheet, Keyboard, Alert, KeyboardAvoidingView, Platform } from 'react-native';
  import { SafeAreaView } from 'react-native-safe-area-context';
  import { Ionicons } from '@expo/vector-icons';
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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <SafeAreaView style={styles.container}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Heading */}
            <View style={styles.headingSection}>
              <Text style={styles.title}>Add Product</Text>
              <Text style={styles.subtitle}>Paste a product link to start tracking</Text>
            </View>

            {/* URL input + Fetch button + error */}
            <View style={styles.urlSection}>
              <View style={styles.urlInputContainer}>
                <View style={styles.urlIconWrapper}>
                  <Ionicons name="link" size={20} color={colors.textMuted} />
                </View>
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
                title={extracting ? 'Fetching...' : 'Fetch Product'}
                onPress={handleExtract}
                variant="gradient"
                loading={extracting}
                disabled={!url.trim()}
                fontSize={typography.sizes.lg}
                style={styles.fetchButton}
              />

              {error ? (
                <View style={styles.errorRow}>
                  <Ionicons name="alert-circle" size={15} color={colors.dangerAlt} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}
            </View>

            {/* Fetched state: product card + target price + start tracking */}
            {product && (
              <View style={styles.fetchedSection}>
                <ProductPreview product={product} />

                <View style={styles.targetPriceBlock}>
                  <Text style={styles.targetLabel}>SET YOUR TARGET PRICE</Text>
                  <View style={styles.targetInputWrapper}>
                    <View style={styles.targetInput}>
                      <View style={styles.currencyPrefix}>
                        <Text style={styles.currencyPrefixText}>$</Text>
                      </View>
                      <TextInput
                        style={styles.priceInput}
                        value={targetPrice}
                        onChangeText={setTargetPrice}
                        placeholder="0.00"
                        placeholderTextColor={colors.textMuted}
                        keyboardType="decimal-pad"
                      />
                      <View style={styles.currencySuffix}>
                        <Text style={styles.currencySuffixText}>USD</Text>
                      </View>
                    </View>
                  </View>
                </View>

                <Button
                  title="Start Tracking"
                  onPress={handleTrack}
                  variant="gradient"
                  loading={saving}
                  disabled={!targetPrice}
                  fontSize={typography.sizes.xl}
                  style={styles.trackButton}
                />
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    );
  }

  const styles = StyleSheet.create({
    keyboardView: {
      flex: 1,
      backgroundColor: colors.background,
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
      paddingBottom: 120,
    },
    headingSection: {
      gap: spacing.sm,
      marginTop: spacing.lg,
      marginBottom: 48,
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
    },
    urlInputContainer: {
      height: 64,
      borderRadius: borderRadius.full,
      backgroundColor: colors.iconBg,
      flexDirection: 'row',
      alignItems: 'center',
      paddingLeft: 56,
      paddingRight: spacing.lg,
    },
    urlIconWrapper: {
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
    },
    fetchButton: {
      height: 56,
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.2,
      shadowRadius: 20,
      elevation: 8,
    },
    errorRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.sm,
    },
    errorText: {
      color: colors.dangerAlt,
      fontSize: typography.sizes.sm,
      flex: 1,
    },
    fetchedSection: {
      borderTopWidth: 1,
      borderTopColor: 'rgba(72,71,74,0.1)',
      paddingTop: 17,
      marginTop: spacing.lg,
      gap: 32,
    },
    targetPriceBlock: {
      height: 112.5,
      position: 'relative',
    },
    targetLabel: {
      position: 'absolute',
      top: 0,
      left: 4,
      color: colors.textLabel,
      fontSize: typography.sizes.xs,
      fontWeight: typography.weights.semibold,
      textTransform: 'uppercase',
      letterSpacing: 1.1,
    },
    targetInputWrapper: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 32.5,
    },
    targetInput: {
      height: 80,
      borderRadius: borderRadius.full,
      backgroundColor: colors.groupBg,
      borderWidth: 1,
      borderColor: 'rgba(72,71,74,0.2)',
      flexDirection: 'row',
      alignItems: 'center',
    },
    currencyPrefix: {
      paddingLeft: 24,
      paddingRight: spacing.sm,
      justifyContent: 'center',
    },
    currencyPrefixText: {
      color: colors.accent,
      fontSize: typography.sizes.xxl,
    },
    priceInput: {
      flex: 1,
      color: colors.text,
      fontSize: typography.sizes.display,
      letterSpacing: -0.9,
    },
    currencySuffix: {
      paddingRight: 24,
      justifyContent: 'center',
    },
    currencySuffixText: {
      color: colors.accent + '66',
      fontSize: typography.sizes.sm,
      textTransform: 'uppercase',
      letterSpacing: 1.4,
    },
    trackButton: {
      height: 64,
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.15,
      shadowRadius: 40,
      elevation: 10,
    },
  });
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add app/(tabs)/add.js
  git commit -m "feat: redesign Add screen to match Figma"
  ```

---

## Task 5: Visual verification in Expo Go

- [ ] **Step 1: Start the dev server**

  ```bash
  npx expo start
  ```
  Scan the QR code with Expo Go on a physical device.

- [ ] **Step 2: Navigate to the Add tab and verify the empty state**

  Check against Figma node 1-187:
  - "Add Product" heading is large (~36px), warm white, with slight negative tracking
  - "Paste a product link to start tracking" subtitle is 18px, muted gray
  - URL input is a fully rounded pill, dark gray background (`#262528`), link icon on the left
  - "Fetch Product" button is a left-to-right green gradient with a subtle glow

- [ ] **Step 3: Trigger an error and verify the error row**

  Tap "Fetch Product" with an invalid URL. Confirm:
  - Warning circle icon appears in red-orange (`#ff716c`)
  - Error text is the same red-orange, 14px, sits in a row with the icon

- [ ] **Step 4: Enter a valid product URL and extract**

  After a successful extraction, confirm:
  - Product card has a full-bleed hero image (192px, covers the full card width)
  - Domain label is cyan (`#7ae6ff`), uppercase, small
  - Method badge (e.g. "VIA CSS SELECTOR") appears as a green pill on the right
  - Product name is ~20px, warm white, up to 2 lines
  - Price (e.g. "$299.00") is large (30px), warm white, with "CURRENT" label alongside in muted gray

- [ ] **Step 5: Verify the target price input**

  Confirm:
  - "SET YOUR TARGET PRICE" floats above the input area
  - Input pill is taller (~80px), very dark background, faint border
  - `$` prefix is green (accent color), 24px
  - Typed price text is large (36px)
  - `USD` suffix is faint green (40% opacity), uppercase, right-aligned

- [ ] **Step 6: Verify the Start Tracking button**

  Confirm:
  - Gradient pill, 64px height (slightly taller than Fetch Product)
  - Green glow shadow visible beneath the button

- [ ] **Step 7: Check other screens are unaffected**

  Visit Home and Settings tabs. Confirm all buttons that use `variant="primary"` (flat green) are unchanged. The gradient variant only activates when explicitly passed `variant="gradient"`.
