import { ScrollView, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../constants/theme';

export default function PrivacyPolicyScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <Pressable onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="chevron-back" size={24} color={colors.text} />
        <Text style={styles.backText}>Settings</Text>
      </Pressable>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Privacy Policy</Text>
        <Text style={styles.updated}>Last updated: April 2026</Text>

        <Text style={styles.body}>
          {`Dipp ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our mobile application.

INFORMATION WE COLLECT

We collect the following information when you use Dipp:
• Email address (for account creation and notifications)
• Product URLs you choose to track
• Price history for tracked products
• Push notification token (to send you price alerts)

HOW WE USE YOUR INFORMATION

We use your information to:
• Provide and maintain the Dipp service
• Send you price drop notifications
• Improve and personalize your experience

DATA RETENTION

Your data is stored until you delete your account. You can delete your account at any time from the Settings screen, which permanently removes all your data.

CONTACT US

If you have any questions about this Privacy Policy, please contact us at: [your-email@example.com]`}
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
