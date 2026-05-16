import { doc, setDoc, deleteDoc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Takip et
export async function followUser(currentUid: string, targetUid: string): Promise<void> {
  await setDoc(
    doc(db, "users", currentUid, "following", targetUid),
    { followedAt: new Date().toISOString() }
  );
  await setDoc(
    doc(db, "users", targetUid, "followers", currentUid),
    { followedAt: new Date().toISOString() }
  );
}

// Takibi bırak
export async function unfollowUser(currentUid: string, targetUid: string): Promise<void> {
  await deleteDoc(doc(db, "users", currentUid, "following", targetUid));
  await deleteDoc(doc(db, "users", targetUid, "followers", currentUid));
}

// Takip ediyor mu?
export async function isFollowing(currentUid: string, targetUid: string): Promise<boolean> {
  const snap = await getDoc(doc(db, "users", currentUid, "following", targetUid));
  return snap.exists();
}

// Takipçi sayısı
export async function getFollowersCount(uid: string): Promise<number> {
  const snap = await getDocs(collection(db, "users", uid, "followers"));
  return snap.size;
}

// Takip edilen sayısı
export async function getFollowingCount(uid: string): Promise<number> {
  const snap = await getDocs(collection(db, "users", uid, "following"));
  return snap.size;
}
