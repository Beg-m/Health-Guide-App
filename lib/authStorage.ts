import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    type User,
  } from "firebase/auth";
  import { doc, setDoc, getDoc } from "firebase/firestore";
  import { auth, db } from "./firebase";
  
  // Kayıt ol
  export async function registerUser(email: string, password: string, displayName: string) {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    const user = credential.user;
  
    // Firestore'a kullanıcı profili kaydet
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      email,
      displayName,
      createdAt: new Date().toISOString(),
      conditions: [],       // onboarding'den gelecek
      healthProfile: {},    // onboarding'den gelecek
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
  }
  
  // Firestore'dan profil çek
  export async function getUserProfile(uid: string) {
    const snap = await getDoc(doc(db, "users", uid));
    return snap.exists() ? snap.data() : null;
  }
  
  // Auth state dinle
  export function subscribeToAuthState(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
  }