import { Pressable, Text, ActivityIndicator, StyleSheet } from 'react-native';
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

export default function Button({ title, onPress, variant = 'primary', loading = false, disabled = false, style }) {
  const v = VARIANTS[variant] || VARIANTS.primary;
  const isDisabled = disabled || loading;

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
});
