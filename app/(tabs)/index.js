import { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useProducts } from '../../contexts/ProductsContext';
import ProductCard from '../../components/ProductCard';
import StatsHeader from '../../components/StatsHeader';
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
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

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
            <StatsHeader products={products} />
            <SearchBar value={search} onChangeText={setSearch} />
          </>
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
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon="📦"
              title="No products yet"
              message="Paste a product URL to start tracking its price."
              actionLabel="Add Product"
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
});
