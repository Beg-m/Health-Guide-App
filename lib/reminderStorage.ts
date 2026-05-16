import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch,
  onSnapshot,
  type Unsubscribe,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";

export type Reminder = {
  id: string;
  medicineName: string;
  dosage: string;
  times: string[];
  days: string[];
  startDate: string;
  endDate?: string;
  note?: string;
  color: string;
  active: boolean;
  createdAt?: string;
};

/** Firestore users/{uid}/reminders belge şeması */
export type FirestoreReminderDoc = {
  medicationName: string;
  dose: string;
  time: string[];
  days: string[];
  isActive: boolean;
  createdAt: string;
};

export const REMINDER_COLORS = [
  "#16a34a",
  "#2563eb",
  "#9333ea",
  "#ea580c",
  "#0d9488",
  "#dc2626",
  "#db2777",
  "#ca8a04",
] as const;

export const DAY_OPTIONS = [
  "Her gün",
  "Pazartesi",
  "Salı",
  "Çarşamba",
  "Perşembe",
  "Cuma",
  "Cumartesi",
  "Pazar",
] as const;

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function remindersCollection(uid: string) {
  return collection(db, "users", uid, "reminders");
}

function storageKey(uid: string): string {
  return `reminders_v1_${uid}`;
}

const migratedFlagKey = (uid: string) => `reminders_firestore_migrated_${uid}`;

function isReminder(value: unknown): value is Reminder {
  if (!value || typeof value !== "object") return false;
  const r = value as Reminder;
  return (
    typeof r.id === "string" &&
    typeof r.medicineName === "string" &&
    typeof r.dosage === "string" &&
    Array.isArray(r.times) &&
    Array.isArray(r.days) &&
    typeof r.startDate === "string" &&
    typeof r.color === "string" &&
    typeof r.active === "boolean"
  );
}

function toFirestoreDoc(reminder: Reminder): FirestoreReminderDoc {
  return {
    medicationName: reminder.medicineName,
    dose: reminder.dosage,
    time: reminder.times,
    days: reminder.days,
    isActive: reminder.active,
    createdAt: reminder.createdAt ?? new Date().toISOString(),
  };
}

function fromFirestoreDoc(id: string, data: Record<string, unknown>): Reminder | null {
  const medicationName = String(data.medicationName ?? data.medicineName ?? "");
  const dose = String(data.dose ?? data.dosage ?? "");
  const timeRaw = data.time ?? data.times;
  const times = Array.isArray(timeRaw) ? timeRaw.map(String) : [];
  const daysRaw = data.days;
  const days = Array.isArray(daysRaw) ? daysRaw.map(String) : [];
  const isActive =
    typeof data.isActive === "boolean"
      ? data.isActive
      : typeof data.active === "boolean"
        ? data.active
        : true;

  if (!medicationName) return null;

  const reminder: Reminder = {
    id,
    medicineName: medicationName,
    dosage: dose,
    times,
    days: days.length > 0 ? days : ["Her gün"],
    startDate: String(data.startDate ?? new Date().toISOString().slice(0, 10)),
    color: String(data.color ?? REMINDER_COLORS[0]),
    active: isActive,
    createdAt: String(data.createdAt ?? new Date().toISOString()),
  };

  if (data.endDate) reminder.endDate = String(data.endDate);
  if (data.note) reminder.note = String(data.note);

  return isReminder(reminder) ? reminder : null;
}

async function readLocalReminders(uid: string): Promise<Reminder[]> {
  const key = storageKey(uid);
  const raw = await AsyncStorage.getItem(key);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(isReminder);
    } catch {
      return [];
    }
  }
  const legacy = await AsyncStorage.getItem("reminders_v1");
  if (legacy) {
    try {
      const parsed = JSON.parse(legacy) as unknown;
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(isReminder);
    } catch {
      return [];
    }
  }
  return [];
}

async function writeLocalReminders(uid: string, reminders: Reminder[]): Promise<void> {
  await AsyncStorage.setItem(storageKey(uid), JSON.stringify(reminders));
}

/** users/{uid}/reminders/{reminderId} — setDoc ile yazar */
async function writeFirestoreReminder(uid: string, reminder: Reminder): Promise<void> {
  const ref = doc(remindersCollection(uid), reminder.id);
  const payload = toFirestoreDoc(reminder);
  const path = `users/${uid}/reminders/${reminder.id}`;
  console.log("[reminderStorage] setDoc →", path, payload);
  try {
    await setDoc(ref, payload);
    console.log("[reminderStorage] setDoc OK:", path);
  } catch (e) {
    console.error("[reminderStorage] setDoc FAILED:", path, e);
    throw e;
  }
}

async function deleteFirestoreReminder(uid: string, id: string): Promise<void> {
  await deleteDoc(doc(remindersCollection(uid), id));
}

async function runLocalToFirestoreMigration(uid: string): Promise<number> {
  const flag = await AsyncStorage.getItem(migratedFlagKey(uid));
  if (flag === "true") {
    console.log("[reminderStorage] migrate SKIP: zaten migrate edilmiş", uid);
    return 0;
  }

  const local = await readLocalReminders(uid);
  console.log("[reminderStorage] migrate yerel kayıt sayısı:", local.length, "uid:", uid);

  if (local.length > 0) {
    const batch = writeBatch(db);
    for (const reminder of local) {
      const withMeta = {
        ...reminder,
        createdAt: reminder.createdAt ?? new Date().toISOString(),
      };
      const path = `users/${uid}/reminders/${reminder.id}`;
      console.log("[reminderStorage] migrate batch.set →", path);
      batch.set(doc(remindersCollection(uid), reminder.id), toFirestoreDoc(withMeta));
    }
    await batch.commit();
    console.log(
      `[reminderStorage] migrate batch.commit OK: ${local.length} belge → users/${uid}/reminders`
    );
  } else {
    console.log("[reminderStorage] migrate: yerel veri yok");
  }

  await AsyncStorage.setItem(migratedFlagKey(uid), "true");
  console.log("[reminderStorage] migrate tamamlandı, flag set:", migratedFlagKey(uid));
  return local.length;
}

/**
 * AsyncStorage'daki hatırlatıcıları users/{uid}/reminders koleksiyonuna taşır.
 * Kullanıcı başına yalnızca bir kez çalışır (migrated flag).
 */
export async function migrateLocalRemindersToFirestore(
  explicitUid?: string
): Promise<number> {
  const uid = explicitUid ?? auth.currentUser?.uid ?? null;
  console.log("[reminderStorage] migrate başladı", {
    explicitUid: explicitUid ?? null,
    authUid: auth.currentUser?.uid ?? null,
    resolvedUid: uid,
  });

  if (!uid) {
    console.warn("[reminderStorage] migrate SKIP: uid null");
    return 0;
  }

  return runLocalToFirestoreMigration(uid);
}

async function pullFirestoreToLocal(uid: string): Promise<Reminder[]> {
  const snap = await getDocs(remindersCollection(uid));
  return snap.docs
    .map((d) => fromFirestoreDoc(d.id, d.data() as Record<string, unknown>))
    .filter((r): r is Reminder => r !== null);
}

function sortReminders(list: Reminder[]): Reminder[] {
  return [...list].sort((a, b) =>
    a.medicineName.localeCompare(b.medicineName, "tr")
  );
}

function requireUid(): string {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Giriş yapılmamış");
  return uid;
}

function mergeReminderLists(local: Reminder[], remote: Reminder[]): Reminder[] {
  const byId = new Map<string, Reminder>();
  for (const r of local) byId.set(r.id, r);
  for (const r of remote) {
    const prev = byId.get(r.id);
    byId.set(r.id, prev ? { ...prev, ...r } : r);
  }
  return [...byId.values()];
}

/** Giriş yapan kullanıcının hatırlatıcıları (önce yerel, sonra Firestore senkronu) */
export async function getReminders(): Promise<Reminder[]> {
  const uid = auth.currentUser?.uid;
  if (!uid) return [];

  let local = await readLocalReminders(uid);

  try {
    await migrateLocalRemindersToFirestore();
    const remote = await pullFirestoreToLocal(uid);
    if (remote.length > 0) {
      local = mergeReminderLists(local, remote);
      await writeLocalReminders(uid, local);
    }
  } catch {
    /* çevrimdışı: yerel liste */
  }

  return sortReminders(local);
}

/** Belirli kullanıcının hatırlatıcıları (aile ekranı — yalnızca Firestore) */
export async function getRemindersForUser(uid: string): Promise<Reminder[]> {
  if (!uid) return [];
  try {
    const list = await pullFirestoreToLocal(uid);
    return sortReminders(list);
  } catch {
    return [];
  }
}

function mapSnapshotToReminders(
  docs: Array<{ id: string; data: () => Record<string, unknown> }>
): Reminder[] {
  return sortReminders(
    docs
      .map((d) => fromFirestoreDoc(d.id, d.data()))
      .filter((r): r is Reminder => r !== null)
  );
}

/** users/{uid}/reminders için realtime dinleyici */
export function subscribeRemindersForUser(
  uid: string,
  onNext: (reminders: Reminder[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  if (!uid) return () => {};

  return onSnapshot(
    remindersCollection(uid),
    (snap) => {
      onNext(
        mapSnapshotToReminders(
          snap.docs.map((d) => ({
            id: d.id,
            data: () => d.data() as Record<string, unknown>,
          }))
        )
      );
    },
    (err) => {
      const error = err instanceof Error ? err : new Error(String(err));
      console.warn(`reminders listener (${uid}):`, error);
      onError?.(error);
    }
  );
}

export async function addReminder(reminder: Reminder): Promise<void> {
  const uid = requireUid();
  console.log("[reminderStorage] addReminder", {
    uid,
    authUid: auth.currentUser?.uid ?? null,
    reminderId: reminder.id,
    medicineName: reminder.medicineName,
  });

  const withMeta: Reminder = {
    ...reminder,
    createdAt: reminder.createdAt ?? new Date().toISOString(),
  };
  const list = await readLocalReminders(uid);
  const next = [...list, withMeta];
  await writeLocalReminders(uid, next);
  console.log("[reminderStorage] addReminder AsyncStorage OK, key:", storageKey(uid));
  await writeFirestoreReminder(uid, withMeta);
}

export async function updateReminder(reminder: Reminder): Promise<void> {
  const uid = requireUid();
  let createdAt = reminder.createdAt;
  if (!createdAt) {
    try {
      const snap = await getDoc(doc(remindersCollection(uid), reminder.id));
      if (snap.exists()) {
        createdAt = String(snap.data().createdAt ?? "");
      }
    } catch {
      /* yerelden devam */
    }
    const local = await readLocalReminders(uid);
    createdAt = createdAt || local.find((r) => r.id === reminder.id)?.createdAt;
  }
  const withMeta: Reminder = {
    ...reminder,
    createdAt: createdAt ?? new Date().toISOString(),
  };
  const list = await readLocalReminders(uid);
  const idx = list.findIndex((r) => r.id === withMeta.id);
  const next =
    idx === -1 ? [...list, withMeta] : list.map((r) => (r.id === withMeta.id ? withMeta : r));
  await writeLocalReminders(uid, next);
  await writeFirestoreReminder(uid, withMeta);
}

export async function deleteReminder(id: string): Promise<void> {
  const uid = requireUid();
  const list = await readLocalReminders(uid);
  await writeLocalReminders(
    uid,
    list.filter((r) => r.id !== id)
  );
  try {
    await deleteFirestoreReminder(uid, id);
  } catch (e) {
    console.warn("Firestore hatırlatıcı silinemedi (yerel silindi):", e);
  }
}
