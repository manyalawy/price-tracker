import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { colors } from '../../constants/theme';

export default function EmailConfirmScreen() {
  const { code } = useLocalSearchParams();
  const router = useRouter();
  const { clearEmailConfirmation } = useAuth();

  useEffect(() => {
    if (!code) {
      clearEmailConfirmation();
      router.replace('/(auth)/login');
      return;
    }
    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      clearEmailConfirmation();
      router.replace(error ? '/(auth)/login' : '/(tabs)/');
    });
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.accent} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
