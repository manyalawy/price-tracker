import { ScrollView, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../constants/theme';

export default function TermsScreen() {
  const router = useRouter();
  const { from } = useLocalSearchParams();

  return (
    <SafeAreaView style={styles.container}>
      <Pressable onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="chevron-back" size={24} color={colors.text} />
        <Text style={styles.backText}>{from === 'signup' ? 'Sign Up' : 'Settings'}</Text>
      </Pressable>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Terms of Service</Text>
        <Text style={styles.updated}>Last updated: April 2026</Text>

        <Text style={styles.body}>
          {`By downloading or using Dipp, you agree to these Terms of Service. Please read them carefully.

USE OF THE SERVICE

Dipp is a price tracking application that allows you to monitor product prices from supported websites. You agree to use the service only for lawful purposes and in accordance with these Terms.

USER ACCOUNTS

You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. You must notify us immediately of any unauthorized use of your account.

DISCLAIMER OF WARRANTIES

The service is provided "as is" without warranties of any kind. We do not guarantee the accuracy of price data or the availability of any particular product or website.

LIMITATION OF LIABILITY

To the fullest extent permitted by law, Dipp shall not be liable for any indirect, incidental, or consequential damages arising from your use of the service.

TERMINATION

You may delete your account at any time from the Settings screen. We reserve the right to terminate accounts that violate these Terms.

CHANGES TO TERMS

We may update these Terms from time to time. Continued use of the app after changes constitutes acceptance of the new Terms.

CONTACT

For questions about these Terms, contact us at: [your-email@example.com]`}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  backText: {
    color: colors.text,
    fontSize: typography.sizes.md,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 60,
  },
  title: {
    color: colors.textWarm,
    fontSize: typography.sizes.xxxl,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.xs,
  },
  updated: {
    color: colors.textLabel,
    fontSize: typography.sizes.xs,
    marginBottom: spacing.xl,
  },
  body: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    lineHeight: 22,
  },
});
