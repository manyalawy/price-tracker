import { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl, StyleSheet } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import AppHeader from '../../components/ui/AppHeader';
import { useProducts } from '../../contexts/ProductsContext';
import ProductCard from '../../components/ProductCard';
import SearchBar from '../../components/SearchBar';
import EmptyState from '../../components/ui/EmptyState';
import { colors, spacing, typography, borderRadius } from '../../constants/theme';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const { user } = useAuth();
  const { products, loading, fetchProducts } = useProducts();
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProducts();
    setRefreshing(false);
  }, [fetchProducts]);

  const filtered = search
    ? products.filter(p =>
        p.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.domain?.toLowerCase().includes(search.toLowerCase())
      )
    : products;

  const hour = new Date().getHours();
  const greetingBase = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const userName = user?.email ? user.email.split('@')[0] : '';

  const activeProducts = products.filter(p => p.is_active !== false);

  const priceDrop = activeProducts.filter(
    p => p.current_price != null && p.original_price != null && p.current_price < p.original_price
  ).length;

  const ListHeader = (
    <View style={styles.listHeader}>
      {/* Hero section */}
      <View style={styles.heroSection}>
        <View style={styles.greetingGroup}>
          <Text style={styles.greetingLine}>{greetingBase}</Text>
          <Text style={styles.subtitle}>
            {user ? `You're tracking ${activeProducts.length} products.` : 'Welcome to Dipp.'}
          </Text>
        </View>

        {products.length > 0 && (
          <View style={styles.pillRow}>
            <View style={styles.trackingPill}>
              <Text style={styles.trackingPillText}>{activeProducts.length} TRACKING</Text>
            </View>
            <View style={styles.targetPill}>
              <View style={styles.targetDot} />
              <Text style={styles.targetPillText}>{priceDrop} PRICE DROP</Text>
            </View>
          </View>
        )}
      </View>

      {/* Search */}
      <SearchBar value={search} onChangeText={setSearch} />

      {/* Section label */}
      {filtered.length > 0 && (
        <Text style={styles.sectionLabel}>LIVE TRACKING</Text>
      )}
    </View>
  );

  let ListEmpty;
  if (!user) {
    ListEmpty = (
      <EmptyState
        iconName="sparkles-outline"
        title="Track prices for free"
        message="Paste a product link to see its price now. Sign in to save it and get alerts when the price drops."
        actionLabel="Sign In"
        onAction={() => router.push('/(auth)/login')}
      />
    );
  } else if (loading && products.length === 0) {
    ListEmpty = (
      <View style={{ gap: spacing.lg, opacity: 0.4 }}>
        <Text style={styles.sectionLabel}>SYNCING LATEST…</Text>
        <View style={{ gap: spacing.lg }}>
          <View style={{ backgroundColor: colors.groupBg, height: 192, borderRadius: borderRadius.xl }} />
          <View style={{ backgroundColor: colors.groupBg, height: 192, borderRadius: borderRadius.xl }} />
        </View>
      </View>
    );
  } else {
    ListEmpty = (
      <EmptyState
        iconName="archive-outline"
        title="Nothing tracked yet"
        message="Start adding links to monitor prices and get notified on drops."
        actionLabel="Add your first product"
        onAction={() => router.push('/(tabs)/add')}
      />
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader />

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ProductCard product={item} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
          />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 128,
    paddingTop: spacing.lg,
  },
  listHeader: {
    gap: 40,
    marginBottom: spacing.md,
  },
  heroSection: {
    gap: spacing.md,
  },
  greetingGroup: {
    gap: spacing.xs,
  },
  greetingLine: {
    fontSize: typography.sizes.display,
    color: colors.textWarm,
    letterSpacing: -0.9,
    fontWeight: typography.weights.regular,
  },
  subtitle: {
    fontSize: typography.sizes.md,
    color: colors.textLabel,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 12,
  },
  trackingPill: {
    backgroundColor: colors.groupBg,
    borderRadius: borderRadius.full,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  trackingPillText: {
    fontSize: 11,
    color: colors.textLabel,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    fontWeight: typography.weights.regular,
  },
  targetPill: {
    backgroundColor: colors.accent + '1a',
    borderRadius: borderRadius.full,
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  targetDot: {
    width: 6,
    height: 6,
    backgroundColor: colors.accent,
    borderRadius: borderRadius.full,
  },
  targetPillText: {
    fontSize: 11,
    color: colors.accent,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    fontWeight: typography.weights.regular,
  },
  sectionLabel: {
    fontSize: 11,
    color: colors.textLabel,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    fontWeight: typography.weights.regular,
    opacity: 0.6,
    marginBottom: spacing.xs,
  },
});
