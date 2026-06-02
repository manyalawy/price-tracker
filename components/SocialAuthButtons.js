import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import { colors, spacing, typography, borderRadius } from '../constants/theme';

export default function SocialAuthButtons({ onGoogle, onApple, loadingProvider = null }) {
  const [appleAvailable, setAppleAvailable] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'ios') {
      AppleAuthentication.isAvailableAsync().then(setAppleAvailable);
    }
  }, []);

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

      {appleAvailable && (
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
          cornerRadius={borderRadius.md}
          style={[styles.appleButton, loadingProvider !== null && styles.appleButtonDisabled]}
          onPress={onApple}
        />
      )}
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
  appleButton: {
    width: '100%',
    height: 44,
    marginBottom: spacing.sm,
  },
  appleButtonDisabled: {
    opacity: 0.5,
  },
});
