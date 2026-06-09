import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from './supabase';
import { useRouter } from 'expo-router';

// Configure foreground notification display
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Register for push notifications and save token to profile.
 */
export async function registerForPushNotifications(userId) {
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('price-drops', {
      name: 'Price Drops',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  let token;
  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  } catch (e) {
    console.warn('Push token unavailable:', e.message);
    return null;
  }

  // Save to profile. The profile row is guaranteed to exist (created by the
  // handle_new_user trigger on signup), so a plain UPDATE is all that's needed —
  // and it passes RLS. An upsert would emit INSERT ON CONFLICT, which RLS rejects
  // because profiles has no INSERT policy.
  if (userId && token) {
    const { error: saveError } = await supabase
      .from('profiles')
      .update({ expo_push_token: token, updated_at: new Date().toISOString() })
      .eq('id', userId);
    if (saveError) {
      console.error('Failed to save push token:', saveError.message);
    }
  }

  return token;
}

/**
 * Set up notification response handler (deep link on tap).
 */
export function setupNotificationResponseHandler(router) {
  const subscription = Notifications.addNotificationResponseReceivedListener(response => {
    const data = response.notification.request.content.data;
    if (data?.productId) {
      router.push(`/product/${data.productId}`);
    }
  });

  return subscription;
}
