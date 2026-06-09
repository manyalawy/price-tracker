import { useState, useEffect } from 'react';
import { View, Text, Switch, ScrollView, StyleSheet, Alert, Pressable, Platform, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { colors, spacing, typography, borderRadius } from '../../constants/theme';
import { parseError } from '../../lib/errorHandler';
import { registerForPushNotifications } from '../../lib/notifications';
import AppHeader from "../../components/ui/AppHeader";
import Button from '../../components/ui/Button';

export default function SettingsScreen() {
  const { user, signOut, deleteAccount } = useAuth();
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);
  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('profiles')
      .select('email_notifications, push_notifications')
      .eq('id', user.id)
      .single();
    if (error) {
      Alert.alert('Error', parseError(error));
      return;
    }
    if (data) {
      setEmailNotifs(data.email_notifications ?? true);
      setPushNotifs(data.push_notifications ?? true);
    }
  };

  const toggleEmailNotifs = async (value) => {
    setEmailNotifs(value);
    const { error } = await supabase
      .from('profiles')
      .update({ email_notifications: value, updated_at: new Date().toISOString() })
      .eq('id', user.id);
    if (error) {
      setEmailNotifs(!value);
      Alert.alert('Error', parseError(error));
    }
  };

  const togglePushNotifs = async (value) => {
    setPushNotifs(value);
    const { error } = await supabase
      .from('profiles')
      .update({ push_notifications: value, updated_at: new Date().toISOString() })
      .eq('id', user.id);
    if (error) {
      setPushNotifs(!value);
      Alert.alert('Error', parseError(error));
      return;
    }
    // When enabling, (re)fetch and save the Expo token. registerForPushNotifications
    // is idempotent and won't re-prompt if permission is already granted.
    if (value) {
      const token = await registerForPushNotifications(user.id);
      if (!token) {
        Alert.alert(
          'Enable notifications',
          'Allow notifications for Dipp in your device settings to receive push alerts.',
          [
            { text: 'Not now', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]
        );
      }
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  const handleContactUs = async () => {
    const url = 'mailto:contact@kkanoxo.resend.app';
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      Linking.openURL(url);
    } else {
      Alert.alert('Contact Us', 'Reach us at contact@kkanoxo.resend.app');
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all your tracked products. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Are you sure?',
              'Your account and all data will be permanently deleted.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Yes, Delete',
                  style: 'destructive',
                  onPress: async () => {
                    setDeleting(true);
                    try {
                      await deleteAccount();
                    } catch (e) {
                      setDeleting(false);
                      Alert.alert('Error', parseError(e));
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <AppHeader />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Settings</Text>

        <View style={styles.sections}>
          {!user && (
            <View>
              <Text style={styles.sectionLabel}>ACCOUNT</Text>
              <View style={styles.card}>
                <Text style={styles.guestPrompt}>
                  Sign in to manage your account, notifications, and tracked products.
                </Text>
                <Button title="Sign In" onPress={() => router.push('/(auth)/login')} />
              </View>
            </View>
          )}

          {user && (
            <>
              {/* ACCOUNT */}
              <View>
                <Text style={styles.sectionLabel}>ACCOUNT</Text>
                <View style={styles.card}>
                  <View style={styles.accountRow}>
                    <View style={styles.iconCircle}>
                      <Ionicons name="at-circle" size={20} color={colors.accent} />
                    </View>
                    <View style={styles.accountText}>
                      <Text style={styles.accountEmailLabel}>EMAIL ADDRESS</Text>
                      <Text style={styles.accountEmail}>{user?.email}</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* NOTIFICATIONS */}
              <View>
                <Text style={styles.sectionLabel}>NOTIFICATIONS</Text>
                <View style={styles.notifGroup}>
                  <View style={[styles.notifRow, styles.notifRowGap]}>
                    <View style={styles.rowLeft}>
                      <Text style={styles.rowLabel}>Email Alerts</Text>
                      <Text style={styles.rowDesc}>Get price drop alerts via email</Text>
                    </View>
                    <Switch
                      value={emailNotifs}
                      onValueChange={toggleEmailNotifs}
                      trackColor={{ false: colors.border, true: colors.accentGradientEnd }}
                      thumbColor={emailNotifs ? colors.accentThumb : colors.text}
                      ios_backgroundColor={colors.border}
                    />
                  </View>
                  <View style={styles.notifRow}>
                    <View style={styles.rowLeft}>
                      <Text style={styles.rowLabel}>Push Notifications</Text>
                      <Text style={styles.rowDesc}>Get price drop alerts on your device</Text>
                    </View>
                    <Switch
                      value={pushNotifs}
                      onValueChange={togglePushNotifs}
                      trackColor={{ false: colors.border, true: colors.accentGradientEnd }}
                      thumbColor={pushNotifs ? colors.accentThumb : colors.text}
                      ios_backgroundColor={colors.border}
                    />
                  </View>
                </View>
              </View>
            </>
          )}

          {/* ABOUT */}
          <View>
            <Text style={styles.sectionLabel}>ABOUT</Text>
            <View style={styles.card}>
              <View style={styles.versionRow}>
                <View style={styles.iconSquare}>
                  <Ionicons name="information-circle" size={20} color={colors.textLabel} />
                </View>
                <Text style={styles.versionLabel}>Version</Text>
                <Text style={styles.versionValue}>Dipp v1.0.1</Text>
              </View>

              <View style={styles.divider} />

              <Pressable style={styles.legalRow} onPress={() => router.push('/privacy-policy')}>
                <View style={styles.iconSquare}>
                  <Ionicons name="shield-checkmark-outline" size={20} color={colors.textLabel} />
                </View>
                <Text style={styles.legalLabel}>Privacy Policy</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.textLabel} />
              </Pressable>

              <View style={styles.divider} />

              <Pressable style={styles.legalRow} onPress={() => router.push('/terms')}>
                <View style={styles.iconSquare}>
                  <Ionicons name="document-text-outline" size={20} color={colors.textLabel} />
                </View>
                <Text style={styles.legalLabel}>Terms of Service</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.textLabel} />
              </Pressable>

              <View style={styles.divider} />

              <Pressable style={styles.legalRow} onPress={handleContactUs}>
                <View style={styles.iconSquare}>
                  <Ionicons name="mail-outline" size={20} color={colors.textLabel} />
                </View>
                <Text style={styles.legalLabel}>Contact Us</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.textLabel} />
              </Pressable>
            </View>
          </View>
        </View>

        {user && (
          <>
            <Pressable onPress={handleSignOut} style={styles.signOut}>
              <Ionicons name="log-out-outline" size={18} color={colors.danger} />
              <Text style={styles.signOutText}>Sign Out</Text>
            </Pressable>

            <Pressable
              onPress={handleDeleteAccount}
              disabled={deleting}
              style={styles.deleteAccount}
            >
              <Ionicons name="trash-outline" size={16} color={colors.danger} />
              <Text style={styles.deleteAccountText}>
                {deleting ? 'Deleting…' : 'Delete Account'}
              </Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: 100,
  },
  title: {
    color: colors.textWarm,
    fontSize: typography.sizes.display,
    fontWeight: typography.weights.regular,
    letterSpacing: -1.8,
    marginBottom: 48,
  },
  sections: {
    gap: 48,
  },
  sectionLabel: {
    color: colors.textLabel,
    fontSize: 11,
    fontWeight: typography.weights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.cardAlt,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
  },
  guestPrompt: {
    color: colors.textLabel,
    fontSize: typography.sizes.sm,
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.iconBg,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accent,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  accountText: {
    flex: 1,
    gap: 2,
  },
  accountEmailLabel: {
    color: colors.textLabel,
    fontSize: 11,
    fontWeight: typography.weights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  accountEmail: {
    color: colors.textWarm,
    fontSize: typography.sizes.sm,
  },
  notifGroup: {
    backgroundColor: colors.groupBg,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  notifRow: {
    backgroundColor: colors.cardAlt,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notifRowGap: {
    marginBottom: 1,
  },
  rowLeft: {
    gap: 2,
  },
  rowLabel: {
    color: colors.textWarm,
    fontSize: typography.sizes.md,
  },
  rowDesc: {
    color: colors.textLabel,
    fontSize: typography.sizes.xs,
  },
  versionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconSquare: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.iconBg,
    borderWidth: 1,
    borderColor: 'rgba(72, 71, 74, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  versionLabel: {
    color: colors.textWarm,
    fontSize: typography.sizes.md,
    flex: 1,
  },
  versionValue: {
    color: colors.textLabel,
    fontSize: typography.sizes.sm,
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace' }),
  },
  signOut: {
    marginTop: 36,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  signOutText: {
    color: colors.danger,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  deleteAccount: {
    marginTop: spacing.sm,
    paddingBottom: 20,
    marginBottom: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  deleteAccountText: {
    color: colors.danger,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border + '40',
    marginVertical: spacing.sm,
  },
  legalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  legalLabel: {
    color: colors.textWarm,
    fontSize: typography.sizes.md,
    flex: 1,
  },
});
