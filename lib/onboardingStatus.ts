import AsyncStorage from "@react-native-async-storage/async-storage";
import { doc, getDoc, setDoc } from "firebase/firestore";
import {
  STORAGE_ONBOARDING_COMPLETED,
  STORAGE_ONBOARDING_UID,
} from "@/constants/onboardingStorage";
import { db } from "@/lib/firebase";

export async function clearLocalOnboardingFlags(): Promise<void> {
  await AsyncStorage.multiRemove([
    STORAGE_ONBOARDING_COMPLETED,
    STORAGE_ONBOARDING_UID,
  ]);
}

/** Yerel + (varsa) Firestore: onboarding tamamlandı işareti */
export async function markOnboardingCompleted(uid?: string | null): Promise<void> {
  await AsyncStorage.setItem(STORAGE_ONBOARDING_COMPLETED, "true");
  if (uid) {
    await AsyncStorage.setItem(STORAGE_ONBOARDING_UID, uid);
  }
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

export async function isOnboardingCompletedLocally(
  uid?: string | null
): Promise<boolean> {
  const localRaw = await AsyncStorage.getItem(STORAGE_ONBOARDING_COMPLETED);
  if (localRaw !== "true") return false;
  if (!uid) return true;
  const localUid = await AsyncStorage.getItem(STORAGE_ONBOARDING_UID);
  return localUid === uid;
}

/** Yeni kayıt: önceki cihaz/hesap onboarding bayrağını sıfırla */
export async function resetOnboardingForNewAccount(uid: string): Promise<void> {
  await clearLocalOnboardingFlags();
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
    console.warn("[onboardingStatus] Yeni hesap onboarding sıfırlama hatası:", e);
  }
}

/** Giriş sonrası: yerel + Firestore senkronu (kayıt değil) */
export async function syncOnboardingAfterLogin(uid: string): Promise<void> {
  const localDone = await isOnboardingCompletedLocally(uid);
  if (localDone) {
    await markOnboardingCompleted(uid);
    return;
  }
  try {
    const snap = await getDoc(doc(db, "users", uid));
    if (snap.exists() && snap.data()?.onboardingCompleted === true) {
      await markOnboardingCompleted(uid);
    }
  } catch (e) {
    console.warn("[onboardingStatus] Giriş sonrası onboarding sync hatası:", e);
  }
}

/**
 * Onboarding tamamlandı mı?
 * - Girişliyse: Firestore `users/{uid}.onboardingCompleted === true` (eksik/false → tamamlanmamış)
 * - Giriş yoksa: yerel bayrak (onboarding → auth akışı)
 */
export async function resolveOnboardingCompleted(
  uid?: string | null
): Promise<boolean> {
  if (uid) {
    try {
      const snap = await getDoc(doc(db, "users", uid));
      if (!snap.exists()) {
        await clearLocalOnboardingFlags();
        return false;
      }

      const completed = snap.data()?.onboardingCompleted === true;
      if (completed) {
        await markOnboardingCompleted(uid);
      } else {
        await clearLocalOnboardingFlags();
      }
      return completed;
    } catch (e) {
      console.warn("[onboardingStatus] Firestore okuma hatası:", e);
      return false;
    }
  }

  return (await AsyncStorage.getItem(STORAGE_ONBOARDING_COMPLETED)) === "true";
}
