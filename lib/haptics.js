import * as Haptics from 'expo-haptics';

export function lightTap() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

export function successNotification() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

export function errorNotification() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
}
