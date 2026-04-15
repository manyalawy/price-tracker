import { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Link } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { colors, spacing, typography } from '../../constants/theme';

export default function SignUpScreen() {
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSignUp = async () => {
    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { error: authError } = await signUp(email, password);
      if (authError) {
        setError(authError.message);
      } else {
        setSuccess(true);
      }
    } catch (e) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <View style={styles.container}>
        <View style={styles.successOuter}>
          <View style={styles.logoSection}>
            <Text style={styles.logo}>PriceTrack</Text>
            <Text style={styles.logoSub}>Track prices, save money.</Text>
          </View>

          <Text style={styles.title}>Create Account</Text>

          <View style={styles.card}>
            <View style={styles.successContent}>
              <Text style={styles.envelopeIcon}>✉️</Text>
              <Text style={styles.successTitle}>Check your email</Text>
              <Text style={styles.successDesc}>
                We've sent a confirmation email to {email}. Please confirm your account before signing in.
              </Text>
              <Link href="/(auth)/login" style={styles.link}>
                <Text style={styles.linkText}>Already have an account? Sign in</Text>
              </Link>
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.inner}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoSection}>
          <Text style={styles.logo}>PriceTrack</Text>
          <Text style={styles.logoSub}>Track prices, save money.</Text>
        </View>

        <Text style={styles.title}>Create Account</Text>

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
            placeholder="Min. 8 characters"
            secureTextEntry
          />
          <Input
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Repeat your password"
            secureTextEntry
          />

          <Button title="Create Account" onPress={handleSignUp} loading={loading} style={styles.button} />

          <Link href="/(auth)/login" style={styles.link}>
            <Text style={styles.linkText}>Already have an account? Sign in</Text>
          </Link>
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
  inner: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  successOuter: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logo: {
    color: colors.accent,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    letterSpacing: 0.5,
  },
  logoSub: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    marginTop: 2,
    letterSpacing: 0.3,
  },
  title: {
    color: colors.accent,
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: spacing.lg,
  },
  successContent: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  envelopeIcon: {
    fontSize: 40,
    marginBottom: spacing.md,
  },
  successTitle: {
    color: colors.text,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.sm,
  },
  successDesc: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
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
