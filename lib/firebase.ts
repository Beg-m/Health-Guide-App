/**
 * Firebase JS SDK (works with Expo Go). `@react-native-firebase/app` is installed
 * for optional native builds; this file only uses `firebase/app` + `firebase/firestore`.
 */
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBZjIpLZgtMGwIYjLmctu8gm6rPlBflcgg",
  authDomain: "health-guide-app-a0701.firebaseapp.com",
  projectId: "health-guide-app-a0701",
  storageBucket: "health-guide-app-a0701.firebasestorage.app",
  messagingSenderId: "579269512520",
  appId: "1:579269512520:web:defb6fd6a428442f12777d",
  measurementId: "G-QEN5SD3D81",
};

function getFirebaseApp(): FirebaseApp {
  if (getApps().length === 0) {
    return initializeApp(firebaseConfig);
  }
  return getApp();
}

export const firebaseApp = getFirebaseApp();
export const db: Firestore = getFirestore(firebaseApp);
