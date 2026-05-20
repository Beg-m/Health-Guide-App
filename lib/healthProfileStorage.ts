import AsyncStorage from "@react-native-async-storage/async-storage";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

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

/** health-profile.tsx ve onboarding.tsx ile paylaşılan seçenek listesi */
export const HEALTH_PROFILE_OPTIONS: {
  key: keyof HealthProfilePreferences;
  label: string;
  icon: string;
}[] = [
  { key: "generalUser", label: "Genel Kullanıcı", icon: "checkmark-circle-outline" },
  { key: "celiac", label: "Çölyak (Gluten-free)", icon: "nutrition-outline" },
  { key: "lactose", label: "Laktoz İntoleransı", icon: "water-outline" },
  { key: "diabetes", label: "Diyabet", icon: "pulse-outline" },
  { key: "vegan", label: "Vegan", icon: "leaf-outline" },
  { key: "vegetarian", label: "Vejetaryen", icon: "restaurant-outline" },
  { key: "athlete", label: "Sporcu / Aktif yaşam", icon: "fitness-outline" },
  { key: "pregnantBreastfeeding", label: "Hamile / Emziren", icon: "heart-outline" },
  { key: "senior65", label: "65 yaş üstü", icon: "accessibility-outline" },
  { key: "child012", label: "Çocuk için (0-12 yaş)", icon: "happy-outline" },
  { key: "chronicMeds", label: "Kronik ilaç kullanıcısı", icon: "medical-outline" },
];

export function getActiveHealthProfileLabels(
  prefs: HealthProfilePreferences
): string[] {
  return HEALTH_PROFILE_OPTIONS.filter((item) => prefs[item.key]).map(
    (item) => item.label
  );
}

function mergeParsedRecord(parsed: Record<string, unknown>): HealthProfilePreferences {
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
}

/** Firestore veya AsyncStorage ham verisini HealthProfilePreferences'a çevirir */
export function parseHealthProfile(raw: unknown): HealthProfilePreferences | null {
  if (isHealthProfileIncomplete(raw)) return null;
  return mergeParsedRecord(raw as Record<string, unknown>);
}

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
    return mergeParsedRecord(parsed);
  } catch {
    return { ...DEFAULT_HEALTH_PROFILE };
  }
}

/** Giriş yapılmışsa Firestore öncelikli; yoksa yerel depodan okur */
export async function loadHealthProfileForUser(
  uid?: string | null
): Promise<HealthProfilePreferences> {
  if (uid) {
    try {
      const snap = await getDoc(doc(db, "users", uid));
      const fromFirestore = snap.exists()
        ? parseHealthProfile(snap.data()?.healthProfile)
        : null;
      if (fromFirestore) {
        await saveHealthProfile(fromFirestore);
        return fromFirestore;
      }
    } catch {
      /* yerel depoya düş */
    }
  }
  return loadHealthProfile();
}

async function writeHealthProfileToFirestore(
  uid: string,
  prefs: HealthProfilePreferences
): Promise<void> {
  await setDoc(
    doc(db, "users", uid),
    {
      healthProfile: prefs,
      conditions: getActiveHealthProfileLabels(prefs),
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
}

/** AsyncStorage + (varsa) Firestore users/{uid}.healthProfile */
export async function persistHealthProfile(
  prefs: HealthProfilePreferences,
  uid?: string | null
): Promise<void> {
  await saveHealthProfile(prefs);
  if (uid) {
    await writeHealthProfileToFirestore(uid, prefs);
  }
}

export async function saveHealthProfile(
  prefs: HealthProfilePreferences
): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

/** Firestore users/{uid}.healthProfile boş, null veya eksik mi? */
export function isHealthProfileIncomplete(healthProfile: unknown): boolean {
  if (healthProfile == null) return true;
  if (typeof healthProfile !== "object" || Array.isArray(healthProfile)) return true;
  return Object.keys(healthProfile as Record<string, unknown>).length === 0;
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
