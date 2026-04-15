import { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
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
  const insets = useSafeAreaInsets();

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

  const priceDrop = products.filter(
    p => p.current_price != null && p.target_price != null && p.current_price <= p.target_price
  ).length;

  const ListHeader = (
    <View style={styles.listHeader}>
      {/* Hero section */}
      <View style={styles.heroSection}>
        <View style={styles.greetingGroup}>
          <Text style={styles.greetingLine}>{greetingBase}</Text>
          <Text style={styles.subtitle}>You're tracking {products.length} products.</Text>
        </View>

        {products.length > 0 && (
          <View style={styles.pillRow}>
            <View style={styles.trackingPill}>
              <Text style={styles.trackingPillText}>{products.length} TRACKING</Text>
            </View>
            <View style={styles.targetPill}>
              <View style={styles.targetDot} />
              <Text style={styles.targetPillText}>{priceDrop} AT TARGET</Text>
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

  const ListEmpty = loading && products.length === 0 ? (
    <View style={{ gap: spacing.lg, opacity: 0.4 }}>
      <Text style={styles.sectionLabel}>SYNCING LATEST…</Text>
      <View style={{ gap: spacing.lg }}>
        <View style={{ backgroundColor: colors.groupBg, height: 192, borderRadius: borderRadius.xl }} />
        <View style={{ backgroundColor: colors.groupBg, height: 192, borderRadius: borderRadius.xl }} />
      </View>
    </View>
  ) : (
    <EmptyState
      iconName="archive-outline"
      title="Nothing tracked yet"
      message="Start adding links to monitor prices and get notified on drops."
      actionLabel="Add your first product"
      onAction={() => router.push('/(tabs)/add')}
    />
  );

  return (
    <View style={styles.container}>
      <View>
        <BlurView
          intensity={30}
          tint="dark"
          style={[
            styles.header,
            {
              paddingTop: insets.top + spacing.md,
              paddingBottom: spacing.md,
              paddingHorizontal: spacing.lg,
              backgroundColor: 'rgba(14,14,16,0.8)',
            },
          ]}
        >
          <View style={styles.headerLeft}>
            <Ionicons name="pricetag" size={16} color={colors.accent} />
            <Text style={styles.headerTitle}>PriceTrack</Text>
          </View>
          <Ionicons name="notifications-outline" size={22} color={colors.text} />
        </BlurView>
      </View>

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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.sizes.xl,
    color: colors.accent,
    letterSpacing: -1,
    fontWeight: typography.weights.regular,
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
