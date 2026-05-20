import AsyncStorage from "@react-native-async-storage/async-storage";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { STORAGE_ONBOARDING_COMPLETED } from "@/constants/onboardingStorage";
import { db } from "@/lib/firebase";

/** Yerel + (varsa) Firestore: onboarding tamamlandı işareti */
export async function markOnboardingCompleted(uid?: string | null): Promise<void> {
  await AsyncStorage.setItem(STORAGE_ONBOARDING_COMPLETED, "true");
  if (!uid) return;
  try {
    await setDoc(
      doc(db, "users", uid),
      {
        onboardingCompleted: true,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (e) {
    console.warn("[onboardingStatus] Firestore yazma hatası:", e);
  }
}

/**
 * Onboarding tamamlanmış mı?
 * - Önce AsyncStorage (hızlı, giriş öncesi akış)
 * - Girişliyse Firestore; true ise yerel depoyu senkronlar
 * - Firestore okunamazsa yerel "true" korunur; yerel false ise false (yanlışlıkla onboarding'e atmamak için true varsaymayız)
 */
export async function isOnboardingCompletedLocally(): Promise<boolean> {
  const localRaw = await AsyncStorage.getItem(STORAGE_ONBOARDING_COMPLETED);
  return localRaw === "true";
}

/** Giriş/kayıt sonrası: yerel tamamlanmadıysa Firestore'da false tutulur */
export async function syncOnboardingAfterAuth(uid: string): Promise<void> {
  const localDone = await isOnboardingCompletedLocally();
  if (localDone) {
    await markOnboardingCompleted(uid);
    return;
  }
  await AsyncStorage.removeItem(STORAGE_ONBOARDING_COMPLETED);
  try {
    await setDoc(
      doc(db, "users", uid),
      {
        onboardingCompleted: false,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (e) {
    console.warn("[onboardingStatus] Firestore onboarding false yazılamadı:", e);
  }
}

export async function resolveOnboardingCompleted(
  uid?: string | null
): Promise<boolean> {
  const localRaw = await AsyncStorage.getItem(STORAGE_ONBOARDING_COMPLETED);
  const localDone = localRaw === "true";
  if (localDone) return true;

  if (!uid) return false;

  try {
    const snap = await getDoc(doc(db, "users", uid));
    if (snap.exists() && snap.data()?.onboardingCompleted === true) {
      await AsyncStorage.setItem(STORAGE_ONBOARDING_COMPLETED, "true");
      return true;
    }
    return false;
  } catch (e) {
    console.warn("[onboardingStatus] Firestore okuma hatası, yerel değer kullanılıyor:", e);
    return localDone;
  }
}
