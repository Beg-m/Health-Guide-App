import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@health_guide_health_profile";

export type HealthProfilePreferences = {
  generalUser: boolean;
  celiac: boolean;
  lactose: boolean;
  diabetes: boolean;
  vegan: boolean;
  vegetarian: boolean;
  athlete: boolean;
  pregnantBreastfeeding: boolean;
  senior65: boolean;
  child012: boolean;
  chronicMeds: boolean;
};

export const SPECIFIC_PROFILE_KEYS: (keyof HealthProfilePreferences)[] = [
  "celiac",
  "lactose",
  "diabetes",
  "vegan",
  "vegetarian",
  "athlete",
  "pregnantBreastfeeding",
  "senior65",
  "child012",
  "chronicMeds",
];

export const DEFAULT_HEALTH_PROFILE: HealthProfilePreferences = {
  generalUser: true,
  celiac: false,
  lactose: false,
  diabetes: false,
  vegan: false,
  vegetarian: false,
  athlete: false,
  pregnantBreastfeeding: false,
  senior65: false,
  child012: false,
  chronicMeds: false,
};

function normalizeHealthProfile(p: HealthProfilePreferences): HealthProfilePreferences {
  if (p.generalUser) {
    const next = { ...p, generalUser: true };
    SPECIFIC_PROFILE_KEYS.forEach((k) => {
      next[k] = false;
    });
    return next;
  }
  if (!SPECIFIC_PROFILE_KEYS.some((k) => p[k])) {
    const next = { ...p, generalUser: true };
    SPECIFIC_PROFILE_KEYS.forEach((k) => {
      next[k] = false;
    });
    return next;
  }
  return { ...p, generalUser: false };
}

/** Applies toggle rules: Genel clears others; any specific clears Genel; all specifics off → Genel on. */
export function applyHealthPreferenceChange(
  prev: HealthProfilePreferences,
  key: keyof HealthProfilePreferences,
  value: boolean
): HealthProfilePreferences {
  if (key === "generalUser") {
    if (value) {
      const next = { ...prev, generalUser: true };
      SPECIFIC_PROFILE_KEYS.forEach((k) => {
        next[k] = false;
      });
      return next;
    }
    const hasAnySpecific = SPECIFIC_PROFILE_KEYS.some((k) => prev[k]);
    if (!hasAnySpecific) {
      return prev;
    }
    return { ...prev, generalUser: false };
  }

  if (value) {
    return {
      ...prev,
      generalUser: false,
      [key]: true,
    };
  }

  const next = { ...prev, [key]: false };
  if (!SPECIFIC_PROFILE_KEYS.some((k) => next[k])) {
    next.generalUser = true;
  }
  return next;
}

export async function loadHealthProfile(): Promise<HealthProfilePreferences> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_HEALTH_PROFILE };
    const parsed = JSON.parse(raw) as Record<string, unknown>;

    const merged: HealthProfilePreferences = { ...DEFAULT_HEALTH_PROFILE };
    (Object.keys(DEFAULT_HEALTH_PROFILE) as (keyof HealthProfilePreferences)[]).forEach(
      (key) => {
        if (key in parsed && typeof parsed[key as string] === "boolean") {
          merged[key] = parsed[key as string] as boolean;
        }
      }
    );

    if (!("generalUser" in parsed)) {
      const anySpecific = SPECIFIC_PROFILE_KEYS.some((k) => merged[k]);
      merged.generalUser = !anySpecific;
    }

    return normalizeHealthProfile(merged);
  } catch {
    return { ...DEFAULT_HEALTH_PROFILE };
  }
}

export async function saveHealthProfile(
  prefs: HealthProfilePreferences
): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

export const HEALTH_FILTER_TIPS: Record<keyof HealthProfilePreferences, string> = {
  generalUser: "Genel kullanıcı profiliniz aktif ✓",
  celiac: "Glutensiz ürünler için filtreniz aktif ✓",
  lactose: "Laktozsuz ürün önerileri için filtreniz aktif ✓",
  diabetes: "Diyabetik ürünler için filtreniz aktif ✓",
  vegan: "Vegan ürünler için filtreniz aktif ✓",
  vegetarian: "Vejetaryen ürünler için filtreniz aktif ✓",
  athlete: "Sporcu / aktif yaşam profiliniz için ipuçları aktif ✓",
  pregnantBreastfeeding: "Hamilelik / emzirme dönemine özel öneriler aktif ✓",
  senior65: "65 yaş üstü için uygun içerik filtreniz aktif ✓",
  child012: "0–12 yaş çocuk profili için öneriler aktif ✓",
  chronicMeds: "Kronik ilaç kullanımına yönelik hatırlatmalar aktif ✓",
};
