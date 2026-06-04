import { useState } from 'react';
import { View, Text, Image, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert, Pressable } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { colors, spacing, typography } from '../../constants/theme';
import SocialAuthButtons from '../../components/SocialAuthButtons';
import { parseError } from '../../lib/errorHandler';

export default function LoginScreen() {
  const { signIn, signInWithGoogle, signInWithApple } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleClose = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/');
    }
  };
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [socialLoadingProvider, setSocialLoadingProvider] = useState(null);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { error: authError } = await signIn(email, password);
      if (authError) setError(authError.message);
    } catch (e) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setSocialLoadingProvider('google');
    try {
      await signInWithGoogle();
    } catch (e) {
      Alert.alert('Sign In Failed', parseError(e));
    } finally {
      setSocialLoadingProvider(null);
    }
  };

  const handleApple = async () => {
    setSocialLoadingProvider('apple');
    try {
      await signInWithApple();
    } catch (e) {
      if (e.code === 'ERR_REQUEST_CANCELED') return;
      Alert.alert('Sign In Failed', parseError(e));
    } finally {
      setSocialLoadingProvider(null);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <Pressable
        onPress={handleClose}
        style={[styles.closeButton, { top: insets.top + spacing.sm }]}
        hitSlop={spacing.sm}
      >
        <Ionicons name="close" size={26} color={colors.textSecondary} />
      </Pressable>
      <ScrollView
        contentContainerStyle={styles.inner}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoSection}>
          <Image source={require('../../assets/logo.png')} style={styles.logo} />
          <Text style={styles.logoSub}>Track prices, save money.</Text>
        </View>

        <View style={styles.card}>
          {error ? (
            <View style={styles.errorRow}>
              <Text style={styles.errorDot}>●</Text>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Input
            label="Email Address"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Your password"
            secureTextEntry
          />

          <Button title="Sign In" onPress={handleLogin} loading={loading} style={styles.button} />

          <Link href="/(auth)/forgot-password" style={styles.link}>
            <Text style={styles.linkText}>Forgot password?</Text>
          </Link>
          <Link href="/(auth)/signup" style={styles.link}>
            <Text style={styles.linkText}>New here? Create account</Text>
          </Link>
          <SocialAuthButtons
            onGoogle={handleGoogle}
            onApple={handleApple}
            loadingProvider={socialLoadingProvider}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  closeButton: {
    position: 'absolute',
    left: spacing.lg,
    zIndex: 10,
  },
  inner: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logo: {
    width: 72,
    height: 72,
    marginBottom: spacing.xs,
  },
  logoSub: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    marginTop: 2,
    letterSpacing: 0.3,
  },
  title: {
    color: colors.text,
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: spacing.lg,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.danger + '18',
    borderRadius: 8,
    padding: spacing.sm,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  errorDot: {
    color: colors.danger,
    fontSize: 8,
    lineHeight: 20,
  },
  errorText: {
    color: colors.danger,
    fontSize: typography.sizes.sm,
    flex: 1,
    lineHeight: 20,
  },
  button: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  link: {
    paddingVertical: spacing.xs,
    alignSelf: 'center',
  },
  linkText: {
    color: colors.accent,
    fontSize: typography.sizes.sm,
    textAlign: 'center',
  },
});
