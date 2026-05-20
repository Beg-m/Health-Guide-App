import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    type User,
  } from "firebase/auth";
  import { doc, setDoc, getDoc } from "firebase/firestore";
  import { auth, db } from "./firebase";
  import {
    getActiveHealthProfileLabels,
    loadHealthProfile,
    persistHealthProfile,
    type HealthProfilePreferences,
  } from "./healthProfileStorage";
  import { clearLocalOnboardingFlags } from "./onboardingStatus";
  
  // Kayıt ol
  export async function registerUser(email: string, password: string, displayName: string) {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    const user = credential.user;
    const healthProfile = await loadHealthProfile();

    // Firestore'a kullanıcı profili kaydet
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      email,
      displayName,
      createdAt: new Date().toISOString(),
      onboardingCompleted: false,
      conditions: getActiveHealthProfileLabels(healthProfile),
      healthProfile,
    });
  
    return user;
  }
  
  // Giriş yap
  export async function loginUser(email: string, password: string) {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    return credential.user;
  }
  
  // Çıkış yap
  export async function logoutUser() {
    await signOut(auth);
    await clearLocalOnboardingFlags();
  }
  
  // Firestore'dan profil çek
  export async function getUserProfile(uid: string) {
    const snap = await getDoc(doc(db, "users", uid));
    return snap.exists() ? snap.data() : null;
  }

  export async function saveUserHealthProfile(
    uid: string,
    healthProfile: HealthProfilePreferences
  ) {
    await persistHealthProfile(healthProfile, uid);
  }
  
  // Auth state dinle
  export function subscribeToAuthState(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
  }