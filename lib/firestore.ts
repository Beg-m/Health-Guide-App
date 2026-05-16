import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  type DocumentData,
  type Unsubscribe,
} from "firebase/firestore";
import type { Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { RecipePost } from "@/constants/recipesBlog";

export const COLLECTION_RECIPES = "recipes";
export const COLLECTION_USERS = "users";
export const SUBCOLLECTION_FAVORITES = "favorites";

async function uriToBase64(uri: string): Promise<string> {
  if (!uri || uri.startsWith("http") || uri.startsWith("data:")) return uri;
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return uri;
  }
}

export async function addFavoriteRecipeFirestore(
  userId: string,
  recipeId: string
): Promise<void> {
  await setDoc(
    doc(db, COLLECTION_USERS, userId, SUBCOLLECTION_FAVORITES, recipeId),
    {
      recipeId,
      savedAt: serverTimestamp(),
    }
  );
}

export async function removeFavoriteRecipeFirestore(
  userId: string,
  recipeId: string
): Promise<void> {
  await deleteDoc(
    doc(db, COLLECTION_USERS, userId, SUBCOLLECTION_FAVORITES, recipeId)
  );
}

export async function fetchFavoriteRecipeIdsFromFirestore(
  userId: string
): Promise<string[]> {
  const snap = await getDocs(
    collection(db, COLLECTION_USERS, userId, SUBCOLLECTION_FAVORITES)
  );
  return snap.docs.map((d) => d.id);
}

function mapRecipeDoc(id: string, data: DocumentData): RecipePost {
  const tags = Array.isArray(data.tags) ? data.tags.map(String) : [];
  const ingredients = Array.isArray(data.ingredients)
    ? data.ingredients.map(String)
    : typeof data.ingredients === "string"
      ? data.ingredients.split("\n").filter(Boolean)
      : [];
  const steps = Array.isArray(data.steps)
    ? data.steps.map(String)
    : typeof data.steps === "string"
      ? data.steps.split("\n").filter(Boolean)
      : [];
  const imageUrls = Array.isArray(data.imageUrls) ? data.imageUrls.map(String) : [];
  const imageUriRaw =
    typeof data.imageUri === "string" && data.imageUri.trim()
      ? String(data.imageUri)
      : imageUrls[0];
  const imageUri = imageUriRaw?.trim() ? imageUriRaw : undefined;
  const createdBy =
    typeof data.createdBy === "string" && data.createdBy.trim()
      ? String(data.createdBy)
      : undefined;
  const videoUriRaw =
    typeof data.videoUri === "string" && data.videoUri.trim()
      ? String(data.videoUri).trim()
      : undefined;

  return {
    id,
    title: String(data.title ?? ""),
    author: String(data.author ?? "Anonim"),
    likes: typeof data.likes === "number" ? data.likes : Number(data.likes) || 0,
    comments:
      typeof data.comments === "number" ? data.comments : Number(data.comments) || 0,
    tags,
    summary: String(data.summary ?? ""),
    fullText: String(data.fullText ?? ""),
    ingredients,
    steps,
    prepMinutes:
      typeof data.prepMinutes === "number"
        ? data.prepMinutes
        : Number(data.prepMinutes) || 0,
    imageUrls,
    imageUri,
    videoUri: videoUriRaw,
    createdBy,
    videoEmbedUrl:
      typeof data.videoEmbedUrl === "string" ? data.videoEmbedUrl : undefined,
  };
}

function recipeSortKey(data: DocumentData): number {
  const c = data.createdAt;
  if (c && typeof c === "object" && "toMillis" in c && typeof (c as Timestamp).toMillis === "function") {
    return (c as Timestamp).toMillis();
  }
  return 0;
}

/** Real-time listener: all recipes, sorted by `createdAt` descending (client-side; no composite index). */
export function subscribeRecipes(
  onNext: (recipes: RecipePost[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  return onSnapshot(
    collection(db, COLLECTION_RECIPES),
    (snapshot) => {
      const rows = snapshot.docs.map((d) => ({
        ms: recipeSortKey(d.data()),
        recipe: mapRecipeDoc(d.id, d.data()),
      }));
      rows.sort((a, b) => b.ms - a.ms);
      onNext(rows.map((r) => r.recipe));
    },
    (err) => {
      onError?.(err instanceof Error ? err : new Error(String(err)));
    }
  );
}

export async function getRecipeFromFirestore(
  recipeId: string
): Promise<RecipePost | null> {
  const ref = doc(db, COLLECTION_RECIPES, recipeId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return mapRecipeDoc(snap.id, snap.data());
}

export type CreateRecipeInput = {
  title: string;
  tags: string[];
  ingredientsText: string;
  stepsText: string;
  notes: string;
  authorLabel?: string;
  /** Yerel veya uzak görsel URI listesi (kapak = ilk öğe) */
  imageUris?: string[];
  /** Kapak URI; Firestore `imageUri` alanına yazılır (gallery ilk seçim vb.) */
  imageUri?: string;
  /** Tarif videosu URI */
  videoUri?: string;
  createdBy: string;
  prepMinutes?: number;
  cookMinutes?: number;
  servings?: number;
};

function buildRecipeBody(input: {
  title: string;
  tags: string[];
  ingredientsText: string;
  stepsText: string;
  notes: string;
  imageUris: string[];
}) {
  const ingredients = input.ingredientsText
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  const steps = input.stepsText
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  const notes = input.notes.trim();
  const summary =
    notes.slice(0, 280) ||
    (steps[0] ?? ingredients[0] ?? input.title);
  const fullText =
    [notes && `Notlar:\n${notes}`, `Malzemeler:\n${ingredients.join("\n")}`, `Hazırlanış:\n${steps.join("\n")}`]
      .filter(Boolean)
      .join("\n\n") || input.title;

  const imageUrls = input.imageUris.filter(Boolean);
  const imageUri = imageUrls[0] ?? "";

  return {
    ingredients,
    steps,
    summary,
    fullText,
    imageUrls,
    imageUri,
  };
}

export async function createRecipe(input: CreateRecipeInput): Promise<string> {
  const rawList = input.imageUris ?? [];
  const explicit = input.imageUri?.trim();
  const imageUris = explicit
    ? [explicit, ...rawList.filter((u) => u !== explicit)]
    : rawList;
  const body = buildRecipeBody({
    title: input.title,
    tags: input.tags,
    ingredientsText: input.ingredientsText,
    stepsText: input.stepsText,
    notes: input.notes,
    imageUris,
  });

  // Local URI'leri base64'e çevir
  const convertedImageUri = body.imageUri
    ? await uriToBase64(body.imageUri)
    : "";
  const convertedImageUrls = await Promise.all(
    body.imageUrls.map((u) => uriToBase64(u))
  );

  const ref = await addDoc(collection(db, COLLECTION_RECIPES), {
    title: input.title,
    author: input.authorLabel ?? "Health Guide Kullanıcı",
    likes: 0,
    comments: 0,
    tags: input.tags,
    summary: body.summary,
    fullText: body.fullText,
    ingredients: body.ingredients,
    steps: body.steps,
    prepMinutes: input.prepMinutes ?? 0,
    cookMinutes: 0,
    servings: 0,
    imageUri: convertedImageUri,
    imageUrls: convertedImageUrls,
    videoUri: input.videoUri?.trim() ?? "",
    createdBy: input.createdBy,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return ref.id;
}

export type UpdateRecipeInput = {
  title: string;
  tags: string[];
  ingredientsText: string;
  stepsText: string;
  notes: string;
  imageUris: string[];
  imageUri?: string;
  videoUri?: string;
};

export async function updateRecipe(
  recipeId: string,
  input: UpdateRecipeInput
): Promise<void> {
  const rawList = input.imageUris ?? [];
  const explicit = input.imageUri?.trim();
  const imageUris = explicit
    ? [explicit, ...rawList.filter((u) => u !== explicit)]
    : rawList;
  const body = buildRecipeBody({
    title: input.title,
    tags: input.tags,
    ingredientsText: input.ingredientsText,
    stepsText: input.stepsText,
    notes: input.notes,
    imageUris,
  });

  const convertedImageUri = body.imageUri
    ? await uriToBase64(body.imageUri)
    : "";
  const convertedImageUrls = await Promise.all(
    body.imageUrls.map((u) => uriToBase64(u))
  );

  await updateDoc(doc(db, COLLECTION_RECIPES, recipeId), {
    title: input.title,
    tags: input.tags,
    summary: body.summary,
    fullText: body.fullText,
    ingredients: body.ingredients,
    steps: body.steps,
    imageUri: convertedImageUri,
    imageUrls: convertedImageUrls,
    videoUri: input.videoUri?.trim() ?? "",
    updatedAt: serverTimestamp(),
  });
}

export async function deleteRecipe(recipeId: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION_RECIPES, recipeId));
}

export type UserProfileDoc = {
  displayName?: string;
  email?: string;
  preferences?: Record<string, unknown>;
  updatedAt?: Timestamp;
};

export async function setUserProfile(
  userId: string,
  data: UserProfileDoc
): Promise<void> {
  await setDoc(
    doc(db, COLLECTION_USERS, userId),
    {
      ...data,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function getUserProfile(userId: string): Promise<UserProfileDoc | null> {
  const snap = await getDoc(doc(db, COLLECTION_USERS, userId));
  if (!snap.exists()) return null;
  return snap.data() as UserProfileDoc;
}
