import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  try {
    if (!Device.isDevice) return false;
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === "granted") return true;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === "granted";
  } catch {
    return false;
  }
}

export async function scheduleReminderNotification(
  medicineName: string,
  dosage: string,
  hour: number,
  minute: number,
  identifier: string
): Promise<string | null> {
  try {
    const granted = await requestNotificationPermission();
    if (!granted) return null;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("reminders", {
        name: "İlaç Hatırlatmaları",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#16a34a",
      });
    }

    const id = await Notifications.scheduleNotificationAsync({
      identifier,
      content: {
        title: "💊 İlaç Zamanı!",
        body: `${medicineName}${dosage ? ` — ${dosage}` : ""} alma zamanı geldi.`,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });
    return id;
  } catch (e) {
    console.log("Bildirim zamanlanamadı (Expo Go kısıtlaması):", e);
    return null;
  }
}

export async function cancelNotification(identifier: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  } catch {}
}

export async function cancelAllNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {}
}

export async function getScheduledNotifications() {
  return Notifications.getAllScheduledNotificationsAsync();
}
