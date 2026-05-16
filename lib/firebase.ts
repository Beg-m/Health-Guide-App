import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAuth, type Auth } from "firebase/auth";
import { getStorage, type FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBZjIpLZgtMGwIYjLmctu8gm6rPlBflcgg",
  authDomain: "health-guide-app-a0701.firebaseapp.com",
  projectId: "health-guide-app-a0701",
  storageBucket: "health-guide-app-a0701.firebasestorage.app",
  messagingSenderId: "579269512520",
  appId: "1:579269512520:web:defb6fd6a428442f12777d",
  measurementId: "G-QEN5SD3D81",
};

// ✅ Önce app initialize et
function getFirebaseApp(): FirebaseApp {
  if (getApps().length === 0) {
    return initializeApp(firebaseConfig);
  }
  return getApp();
}

// ✅ Sonra diğer servisleri al
export const firebaseApp = getFirebaseApp();
export const db: Firestore = getFirestore(firebaseApp);
export const auth: Auth = getAuth(firebaseApp);
export const storage: FirebaseStorage = getStorage(firebaseApp);