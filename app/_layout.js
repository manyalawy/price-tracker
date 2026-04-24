import { useEffect, useRef, useState } from 'react';
import { Redirect, Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import * as Linking from 'expo-linking';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { ProductsProvider } from '../contexts/ProductsContext';
import { registerForPushNotifications, setupNotificationResponseHandler } from '../lib/notifications';
import { colors } from '../constants/theme';
import AnimatedSplash from '../components/AnimatedSplash';

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { user, session, loading, isPasswordRecovery, handleDeepLink } = useAuth();
  const router = useRouter();
  const notifListenerRef = useRef(null);

  useEffect(() => {
    if (user) {
      registerForPushNotifications(user.id);
    }
  }, [user]);

  useEffect(() => {
    notifListenerRef.current = setupNotificationResponseHandler(router);
    return () => notifListenerRef.current?.remove();
  }, [router]);

  useEffect(() => {
    const sub = Linking.addEventListener('url', ({ url }) => handleDeepLink(url));
    return () => sub.remove();
  }, [handleDeepLink]);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      {!session && !isPasswordRecovery && <Redirect href="/(auth)/login" />}
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen
          name="product/[id]"
          options={{
            headerShown: true,
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
            headerTitle: 'Product Details',
            headerBackTitle: 'Home',
            presentation: 'card',
          }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <AuthProvider>
      <ProductsProvider>
        <RootLayoutNav />
        {showSplash && <AnimatedSplash onComplete={() => setShowSplash(false)} />}
      </ProductsProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
