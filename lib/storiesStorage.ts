import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  where,
  type DocumentData,
  type Unsubscribe,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { auth, db, storage } from "@/lib/firebase";
import { readLocalFileBytes } from "@/lib/uploadLocalFileBytes";
import {
  compressPhotoToDataUrl,
  isStorageUploadFailure,
} from "@/lib/storyInlinePhoto";

export const COLLECTION_STORIES = "stories";
const STORY_TTL_MS = 24 * 60 * 60 * 1000;

export type StoryMediaType = "photo" | "video";

export type Story = {
  id: string;
  uid: string;
  displayName: string;
  photoURL?: string;
  mediaURL: string;
  mediaType: StoryMediaType;
  caption: string;
  createdAt: string;
  expiresAt: string;
};

export type StoryUserGroup = {
  uid: string;
  displayName: string;
  photoURL?: string;
  stories: Story[];
};

function mapStoryDoc(id: string, data: DocumentData): Story {
  return {
    id,
    uid: String(data.uid ?? ""),
    displayName: String(data.displayName ?? "Kullanıcı"),
    photoURL:
      typeof data.photoURL === "string" && data.photoURL.trim()
        ? data.photoURL.trim()
        : undefined,
    mediaURL: String(data.mediaURL ?? ""),
    mediaType: data.mediaType === "video" ? "video" : "photo",
    caption: String(data.caption ?? ""),
    createdAt: String(data.createdAt ?? ""),
    expiresAt: String(data.expiresAt ?? ""),
  };
}

export function groupStoriesByUser(stories: Story[]): StoryUserGroup[] {
  const map = new Map<string, StoryUserGroup>();

  for (const story of stories) {
    if (!story.uid || !story.mediaURL) continue;
    const existing = map.get(story.uid);
    if (existing) {
      existing.stories.push(story);
    } else {
      map.set(story.uid, {
        uid: story.uid,
        displayName: story.displayName,
        photoURL: story.photoURL,
        stories: [story],
      });
    }
  }

  return Array.from(map.values()).map((group) => ({
    ...group,
    stories: [...group.stories].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    ),
  }));
}

export function isStoryActive(story: Story, nowMs = Date.now()): boolean {
  const expires = new Date(story.expiresAt).getTime();
  return Number.isFinite(expires) && expires > nowMs;
}

export function formatStoryTime(iso: string): string {
  const created = new Date(iso).getTime();
  if (!Number.isFinite(created)) return "";
  const diffMs = Date.now() - created;
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "Az önce";
  if (minutes < 60) return `${minutes} dk önce`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} saat önce`;
  return "1 günden eski";
}

function resolveUploadMeta(
  localUri: string,
  mediaType: StoryMediaType,
  mimeType?: string
): { ext: string; contentType: string } {
  if (mimeType?.includes("/")) {
    const subtype = mimeType.split("/")[1]?.split("+")[0] ?? "";
    const ext =
      subtype === "jpeg" ? "jpg" : subtype === "quicktime" ? "mov" : subtype || "bin";
    return { ext, contentType: mimeType };
  }

  const path = localUri.split("?")[0].toLowerCase();
  if (mediaType === "video") {
    if (path.endsWith(".mov")) return { ext: "mov", contentType: "video/quicktime" };
    return { ext: "mp4", contentType: "video/mp4" };
  }
  if (path.endsWith(".png")) return { ext: "png", contentType: "image/png" };
  if (path.endsWith(".heic") || path.endsWith(".heif")) {
    return { ext: "heic", contentType: "image/heic" };
  }
  if (path.endsWith(".webp")) return { ext: "webp", contentType: "image/webp" };
  return { ext: "jpg", contentType: "image/jpeg" };
}

export async function uploadStoryMedia(
  localUri: string,
  uid: string,
  mediaType: StoryMediaType,
  mimeType?: string
): Promise<string> {
  const { ext, contentType } = resolveUploadMeta(localUri, mediaType, mimeType);
  const path = `stories/${uid}/${Date.now()}.${ext}`;
  const storageRef = ref(storage, path);

  const bytes = await readLocalFileBytes(localUri);
  if (bytes.byteLength === 0) {
    throw new Error("Dosya boş");
  }

  await uploadBytes(storageRef, bytes, { contentType });
  return getDownloadURL(storageRef);
}

export type CreateStoryInput = {
  mediaURL: string;
  mediaType: StoryMediaType;
  caption?: string;
  displayName: string;
  photoURL?: string;
};

export async function createStory(input: CreateStoryInput): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error("Oturum gerekli");

  const now = new Date();
  const expiresAt = new Date(now.getTime() + STORY_TTL_MS);

  const refDoc = await addDoc(collection(db, COLLECTION_STORIES), {
    uid: user.uid,
    displayName: input.displayName,
    photoURL: input.photoURL ?? "",
    mediaURL: input.mediaURL,
    mediaType: input.mediaType,
    caption: input.caption?.trim() ?? "",
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    expiresAtMs: expiresAt.getTime(),
  });

  return refDoc.id;
}

export async function publishStoryFromLocalUri(
  localUri: string,
  mediaType: StoryMediaType,
  caption: string,
  profile: { displayName: string; photoURL?: string },
  mimeType?: string
): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error("Oturum gerekli");

  let mediaURL: string;

  try {
    mediaURL = await uploadStoryMedia(localUri, user.uid, mediaType, mimeType);
  } catch (uploadErr) {
    if (mediaType !== "photo" || !isStorageUploadFailure(uploadErr)) {
      throw uploadErr;
    }
    console.warn(
      "[Story] Firebase Storage kullanılamıyor; fotoğraf Firestore'a sıkıştırılarak kaydediliyor."
    );
    mediaURL = await compressPhotoToDataUrl(localUri);
  }

  return createStory({
    mediaURL,
    mediaType,
    caption,
    displayName: profile.displayName,
    photoURL: profile.photoURL,
  });
}

export async function deleteExpiredStories(): Promise<number> {
  const nowIso = new Date().toISOString();
  const snap = await getDocs(
    query(collection(db, COLLECTION_STORIES), where("expiresAt", "<=", nowIso))
  );
  if (snap.empty) return 0;

  await Promise.all(snap.docs.map((d) => deleteDoc(doc(db, COLLECTION_STORIES, d.id))));
  return snap.size;
}

/** Aktif hikayeleri dinler ve kullanıcı gruplarına ayırır */
export function subscribeActiveStoryGroups(
  onNext: (groups: StoryUserGroup[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  return onSnapshot(
    collection(db, COLLECTION_STORIES),
    (snapshot) => {
      const now = Date.now();
      const active = snapshot.docs
        .map((d) => mapStoryDoc(d.id, d.data()))
        .filter((s) => isStoryActive(s, now));
      onNext(groupStoriesByUser(active));
    },
    (err) => onError?.(err instanceof Error ? err : new Error(String(err)))
  );
}
