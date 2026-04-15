import { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useProducts } from '../../contexts/ProductsContext';
import ProductCard from '../../components/ProductCard';
import SearchBar from '../../components/SearchBar';
import EmptyState from '../../components/ui/EmptyState';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import { colors, spacing, typography } from '../../constants/theme';
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

  const greeting = () => {
    const hour = new Date().getHours();
    const name = user?.email ? user.email.split('@')[0] : null;
    let base;
    if (hour < 12) base = 'Good morning';
    else if (hour < 18) base = 'Good afternoon';
    else base = 'Good evening';
    return name ? `${base}, ${name}` : base;
  };

  const priceDrop = products.filter(
    p => p.current_price != null && p.target_price != null && p.current_price <= p.target_price
  ).length;

  if (loading && products.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <SkeletonLoader width="60%" height={28} style={{ marginBottom: 8 }} />
          <SkeletonLoader width="40%" height={16} style={{ marginBottom: 24 }} />
          <View style={{ flexDirection: 'row', gap: 16, marginBottom: 16 }}>
            <SkeletonLoader width="48%" height={80} />
            <SkeletonLoader width="48%" height={80} />
          </View>
          {[1, 2, 3].map(i => (
            <SkeletonLoader key={i} height={100} style={{ marginBottom: 8 }} />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.greeting}>{greeting()}</Text>
        <Text style={styles.subtitle}>
          {products.length > 0
            ? `Tracking ${products.length} product${products.length !== 1 ? 's' : ''}`
            : 'Start tracking product prices'}
        </Text>

        {products.length > 0 && (
          <>
            <View style={styles.pillRow}>
              <View style={styles.pill}>
                <Text style={styles.pillText}>{products.length} TRACKING</Text>
              </View>
              <View style={styles.pill}>
                <Text style={styles.pillText}>{priceDrop} ↓ TARGET</Text>
              </View>
            </View>
            <SearchBar value={search} onChangeText={setSearch} />
          </>
        )}

        {filtered.length > 0 && (
          <Text style={styles.sectionLabel}>LIVE TRACKING</Text>
        )}

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
          ListEmptyComponent={
            <EmptyState
              icon="🗑"
              title="Nothing tracked yet"
              message="Start adding links to monitor prices and get notified on drops."
              actionLabel="Add your first product"
              onAction={() => router.push('/(tabs)/add')}
            />
          }
        />
      </View>
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
  greeting: {
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
  pillRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  pill: {
    backgroundColor: colors.accent + '20',
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  pillText: {
    color: colors.accent,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    letterSpacing: 0.5,
  },
  listContent: {
    paddingBottom: 100,
  },
  sectionLabel: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    letterSpacing: 1,
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
});
