import { useState, useEffect } from 'react';
import { View, Text, Switch, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { colors, spacing, typography } from '../../constants/theme';

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('email_notifications, expo_push_token')
      .eq('id', user.id)
      .single();
    if (data) {
      setEmailNotifs(data.email_notifications ?? true);
      setPushEnabled(!!data.expo_push_token);
    }
  };

  const toggleEmailNotifs = async (value) => {
    setEmailNotifs(value);
    await supabase
      .from('profiles')
      .update({ email_notifications: value, updated_at: new Date().toISOString() })
      .eq('id', user.id);
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Settings</Text>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>

          <View style={styles.row}>
            <View>
              <Text style={styles.rowLabel}>Email Notifications</Text>
              <Text style={styles.rowDesc}>Get price drop alerts via email</Text>
            </View>
            <Switch
              value={emailNotifs}
              onValueChange={toggleEmailNotifs}
              trackColor={{ false: colors.border, true: colors.accent }}
              thumbColor="#ffffff"
            />
          </View>

          <View style={[styles.row, styles.noBorder]}>
            <View>
              <Text style={styles.rowLabel}>Push Notifications</Text>
              <Text style={styles.rowDesc}>{pushEnabled ? 'Enabled' : 'Not registered'}</Text>
            </View>
            <View style={[styles.dot, pushEnabled && styles.dotActive]} />
          </View>
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.version}>PriceTrack v1.0.0</Text>
        </Card>

        <Button
          title="Sign Out"
          variant="danger"
          onPress={handleSignOut}
          style={styles.signOut}
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
  title: {
    color: colors.text,
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  email: {
    color: colors.text,
    fontSize: typography.sizes.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  rowLabel: {
    color: colors.text,
    fontSize: typography.sizes.md,
  },
  rowDesc: {
    color: colors.textMuted,
    fontSize: typography.sizes.sm,
    marginTop: 2,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.textMuted,
  },
  dotActive: {
    backgroundColor: colors.accent,
  },
  version: {
    color: colors.textSecondary,
    fontSize: typography.sizes.md,
  },
  signOut: {
    marginTop: spacing.lg,
  },
});
