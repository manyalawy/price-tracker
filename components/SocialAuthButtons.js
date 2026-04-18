import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../constants/theme';

export default function SocialAuthButtons({ onGoogle, onApple, loadingProvider = null }) {
  return (
    <View>
      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or</Text>
        <View style={styles.dividerLine} />
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={onGoogle}
        disabled={loadingProvider !== null}
        activeOpacity={0.7}
      >
        {loadingProvider === 'google' ? (
          <ActivityIndicator size="small" color={colors.text} />
        ) : (
          <>
            <AntDesign name="google" size={18} color={colors.text} style={styles.icon} />
            <Text style={styles.buttonText}>Continue with Google</Text>
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={onApple}
        disabled={loadingProvider !== null}
        activeOpacity={0.7}
      >
        {loadingProvider === 'apple' ? (
          <ActivityIndicator size="small" color={colors.text} />
        ) : (
          <>
            <AntDesign name="apple1" size={18} color={colors.text} style={styles.icon} />
            <Text style={styles.buttonText}>Continue with Apple</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    marginHorizontal: spacing.sm,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm + 4,
    marginBottom: spacing.sm,
  },
  icon: {
    marginRight: spacing.sm,
  },
  buttonText: {
    color: colors.text,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
});
