import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@health_guide_notification_settings";

export type NotificationSettings = {
  medicationReminders: boolean;
  dailyHealthTip: boolean;
};

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  medicationReminders: true,
  dailyHealthTip: true,
};

export async function loadNotificationSettings(): Promise<NotificationSettings> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_NOTIFICATION_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<NotificationSettings>;
    return { ...DEFAULT_NOTIFICATION_SETTINGS, ...parsed };
  } catch {
    return { ...DEFAULT_NOTIFICATION_SETTINGS };
  }
}

export async function saveNotificationSettings(
  settings: NotificationSettings
): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}
