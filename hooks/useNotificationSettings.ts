import { useState, useCallback, useEffect } from "react";
import {
  loadNotificationSettings,
  saveNotificationSettings,
  type NotificationSettings,
  DEFAULT_NOTIFICATION_SETTINGS,
} from "@/lib/notificationSettingsStorage";

export function useNotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettings>(
    DEFAULT_NOTIFICATION_SETTINGS
  );

  useEffect(() => {
    let cancelled = false;
    loadNotificationSettings().then((s) => {
      if (!cancelled) setSettings(s);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const update = useCallback(
    (key: keyof NotificationSettings, value: boolean) => {
      setSettings((prev) => {
        const next = { ...prev, [key]: value };
        void saveNotificationSettings(next);
        return next;
      });
    },
    []
  );

  return { settings, update };
}
