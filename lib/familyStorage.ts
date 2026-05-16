import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";

export type FamilyGroup = {
  id: string;
  name: string;
  createdBy: string;
  members: string[];
  inviteCode: string;
};

// 6 haneli davet kodu üret
export function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Aile grubu oluştur
export async function createFamilyGroup(name: string): Promise<FamilyGroup> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Giriş yapılmamış");
  const inviteCode = generateInviteCode();
  const groupId = `family_${uid}_${Date.now()}`;
  const group: FamilyGroup = {
    id: groupId,
    name,
    createdBy: uid,
    members: [uid],
    inviteCode,
  };
  await setDoc(doc(db, "familyGroups", groupId), group);
  await updateDoc(doc(db, "users", uid), { familyGroupId: groupId });
  return group;
}

// Davet koduyla gruba katıl
export async function joinFamilyGroup(inviteCode: string): Promise<FamilyGroup> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Giriş yapılmamış");
  const q = query(
    collection(db, "familyGroups"),
    where("inviteCode", "==", inviteCode.toUpperCase())
  );
  const snap = await getDocs(q);
  if (snap.empty) throw new Error("Geçersiz davet kodu");
  const groupDoc = snap.docs[0];
  const group = { id: groupDoc.id, ...groupDoc.data() } as FamilyGroup;
  if (group.members.includes(uid)) throw new Error("Zaten bu gruptasınız");
  await updateDoc(doc(db, "familyGroups", group.id), {
    members: arrayUnion(uid),
  });
  await updateDoc(doc(db, "users", uid), { familyGroupId: group.id });
  return { ...group, members: [...group.members, uid] };
}

// Kullanıcının grubunu getir
export async function getMyFamilyGroup(): Promise<FamilyGroup | null> {
  const uid = auth.currentUser?.uid;
  if (!uid) return null;
  const userSnap = await getDoc(doc(db, "users", uid));
  const groupId = userSnap.data()?.familyGroupId;
  if (!groupId) return null;
  const groupSnap = await getDoc(doc(db, "familyGroups", groupId));
  if (!groupSnap.exists()) return null;
  return { id: groupSnap.id, ...groupSnap.data() } as FamilyGroup;
}

// Grup üyelerinin profillerini getir
export async function getFamilyMembers(memberUids: string[]): Promise<any[]> {
  const members = await Promise.all(
    memberUids.map(async (uid) => {
      const snap = await getDoc(doc(db, "users", uid));
      return snap.exists() ? { uid, ...snap.data() } : null;
    })
  );
  return members.filter(Boolean);
}

// Gruptan ayrıl
export async function leaveFamilyGroup(groupId: string): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  await updateDoc(doc(db, "familyGroups", groupId), {
    members: arrayRemove(uid),
  });
  await updateDoc(doc(db, "users", uid), { familyGroupId: null });
}
