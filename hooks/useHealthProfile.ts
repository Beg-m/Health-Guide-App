import { useState, useCallback, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  loadHealthProfileForUser,
  persistHealthProfile,
  applyHealthPreferenceChange,
  type HealthProfilePreferences,
  DEFAULT_HEALTH_PROFILE,
} from "@/lib/healthProfileStorage";
import { auth } from "@/lib/firebase";

export function useHealthProfile() {
  const [prefs, setPrefs] = useState<HealthProfilePreferences>(DEFAULT_HEALTH_PROFILE);
  const [ready, setReady] = useState(false);

  const reload = useCallback(async () => {
    const uid = auth.currentUser?.uid ?? null;
    const p = await loadHealthProfileForUser(uid);
    setPrefs(p);
    setReady(true);
    return p;
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadForCurrentUser = async (uid?: string | null) => {
      const p = await loadHealthProfileForUser(uid ?? null);
      if (!cancelled) {
        setPrefs(p);
        setReady(true);
      }
    };

    void loadForCurrentUser(auth.currentUser?.uid);

    const unsub = onAuthStateChanged(auth, (user) => {
      void loadForCurrentUser(user?.uid ?? null);
    });

    return () => {
      cancelled = true;
      unsub();
    };
  }, []);

  const setPreference = useCallback(
    (key: keyof HealthProfilePreferences, value: boolean) => {
      setPrefs((prev) => {
        const next = applyHealthPreferenceChange(prev, key, value);
        void persistHealthProfile(next, auth.currentUser?.uid ?? null);
        return next;
      });
    },
    []
  );

  return { prefs, ready, reload, setPreference };
}
