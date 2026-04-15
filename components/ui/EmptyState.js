import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, borderRadius } from '../../constants/theme';

export default function EmptyState({ iconName, title, message, actionLabel, onAction }) {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Ionicons name={iconName} size={30} color={colors.textLabel} />
      </View>

      <View style={styles.textSection}>
        <Text style={styles.title}>{title}</Text>
        {message && <Text style={styles.message}>{message}</Text>}
      </View>

      {actionLabel && onAction && (
        <View style={styles.buttonSection}>
          <Pressable onPress={onAction} style={({ pressed }) => pressed && styles.buttonPressed}>
            <LinearGradient
              colors={[colors.accent, colors.accentGradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: borderRadius.full, paddingVertical: 16, paddingHorizontal: spacing.xl }}
            >
              <Text style={styles.buttonText}>{actionLabel}</Text>
            </LinearGradient>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: borderRadius.full,
    backgroundColor: colors.groupBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textSection: {
    marginTop: spacing.lg,
    gap: spacing.sm,
    alignItems: 'center',
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.regular,
    color: colors.textWarm,
    textAlign: 'center',
  },
  message: {
    fontSize: typography.sizes.sm,
    color: colors.textLabel,
    textAlign: 'center',
    maxWidth: 280,
  },
  buttonSection: {
    marginTop: spacing.lg,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.regular,
    color: colors.accentText,
    textAlign: 'center',
  },
});
