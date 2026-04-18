import { useState, useEffect } from 'react';
import { View, Text, Switch, ScrollView, StyleSheet, Alert, Pressable, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { colors, spacing, typography, borderRadius } from '../../constants/theme';
import { parseError } from '../../lib/errorHandler';

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);
  useEffect(() => {
    loadProfile();
  }, []);

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
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Settings</Text>

        <View style={styles.sections}>
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
                <Ionicons name="chevron-forward" size={18} color={colors.textLabel} />
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

          {/* ABOUT */}
          <View>
            <Text style={styles.sectionLabel}>ABOUT</Text>
            <View style={styles.card}>
              <View style={styles.versionRow}>
                <View style={styles.iconSquare}>
                  <Ionicons name="information-circle" size={20} color={colors.textLabel} />
                </View>
                <Text style={styles.versionLabel}>Version</Text>
                <Text style={styles.versionValue}>Dipp v1.0.0</Text>
              </View>
            </View>
          </View>
        </View>

        <Pressable onPress={handleSignOut} style={styles.signOut}>
          <Ionicons name="log-out-outline" size={18} color={colors.dangerAlt} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
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
    color: colors.dangerAlt,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
});
