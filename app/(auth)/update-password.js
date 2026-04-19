import { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { parseError } from '../../lib/errorHandler';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { colors, spacing, typography } from '../../constants/theme';

export default function UpdatePasswordScreen() {
  const { updatePassword } = useAuth();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUpdate = async () => {
    if (!password || !confirmPassword) {
      setError('Please fill in both fields');
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
      const { error: authError } = await updatePassword(password);
      if (authError) {
        setError(parseError(authError));
      } else {
        router.replace('/(tabs)');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.inner}>
        <Text style={styles.title}>New Password</Text>
        <Text style={styles.subtitle}>Choose a strong password for your account</Text>

        <View style={styles.card}>
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Input
            label="New Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Min. 6 characters"
            secureTextEntry
          />
          <Input
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Repeat your password"
            secureTextEntry
          />

          <Button title="Update Password" onPress={handleUpdate} loading={loading} style={styles.button} />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  title: {
    color: colors.accent,
    fontSize: typography.sizes.xxxl,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.xs,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.sizes.md,
    marginBottom: spacing.xl,
  },
  error: {
    color: colors.danger,
    fontSize: typography.sizes.sm,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: spacing.lg,
    marginTop: spacing.sm,
  },
  button: {
    marginTop: spacing.sm,
  },
});
