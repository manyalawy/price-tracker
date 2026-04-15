import { useState, useEffect } from 'react';
import { View, Text, Switch, StyleSheet, Alert, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
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
          <View style={styles.accountRow}>
            <View style={styles.accountIcon}>
              <Text style={styles.accountIconText}>@</Text>
            </View>
            <View>
              <Text style={styles.accountLabel}>EMAIL ADDRESS</Text>
              <Text style={styles.email}>{user?.email}</Text>
            </View>
          </View>
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
            <Text style={[styles.pushStatus, pushEnabled && styles.pushStatusActive]}>
              {pushEnabled ? '● ACTIVE' : '● INACTIVE'}
            </Text>
          </View>
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.versionRow}>
            <View style={styles.versionDot} />
            <Text style={styles.versionLabel}>Version</Text>
            <Text style={styles.version}>PriceTrack v1.0.0</Text>
          </View>
        </Card>

        <Pressable onPress={handleSignOut} style={styles.signOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>
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
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  accountIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.cardHover,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountIconText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.md,
    fontWeight: '600',
  },
  accountLabel: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
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
  pushStatus: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    fontWeight: '600',
  },
  pushStatusActive: {
    color: colors.accent,
  },
  versionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  versionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
  versionLabel: {
    color: colors.text,
    fontSize: typography.sizes.md,
    flex: 1,
  },
  version: {
    color: colors.textSecondary,
    fontSize: typography.sizes.md,
  },
  signOut: {
    marginTop: spacing.lg,
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  signOutText: {
    color: colors.danger,
    fontSize: typography.sizes.md,
    fontWeight: '600',
  },
});
