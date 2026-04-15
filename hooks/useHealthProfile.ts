import { useState, useCallback, useEffect } from "react";
import {
  loadHealthProfile,
  saveHealthProfile,
  applyHealthPreferenceChange,
  type HealthProfilePreferences,
  DEFAULT_HEALTH_PROFILE,
} from "@/lib/healthProfileStorage";

export function useHealthProfile() {
  const [prefs, setPrefs] = useState<HealthProfilePreferences>(DEFAULT_HEALTH_PROFILE);
  const [ready, setReady] = useState(false);

  const reload = useCallback(async () => {
    const p = await loadHealthProfile();
    setPrefs(p);
    setReady(true);
    return p;
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadHealthProfile().then((p) => {
      if (!cancelled) {
        setPrefs(p);
        setReady(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const setPreference = useCallback(
    (key: keyof HealthProfilePreferences, value: boolean) => {
      setPrefs((prev) => {
        const next = applyHealthPreferenceChange(prev, key, value);
        void saveHealthProfile(next);
        return next;
      });
    },
    []
  );

  return { prefs, ready, reload, setPreference };
}
