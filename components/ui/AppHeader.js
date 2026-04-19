import { View, Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '../../constants/theme';

export default function AppHeader() {
  const insets = useSafeAreaInsets();

  return (
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
            backgroundColor: colors.background + 'cc',
          },
        ]}
      >
        <View style={styles.headerLeft}>
          <Ionicons name="pricetag" size={16} color={colors.accent} />
          <Text style={styles.headerTitle}>Dipp</Text>
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
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
});
