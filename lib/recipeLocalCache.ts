import AsyncStorage from "@react-native-async-storage/async-storage";

const key = (id: string) => `blog_recipe_local_${id}`;

export type LocalRecipeCache = {
  id: string;
  imageUri?: string;
  title?: string;
};

export async function saveLocalRecipeCache(data: LocalRecipeCache): Promise<void> {
  await AsyncStorage.setItem(key(data.id), JSON.stringify(data));
}

export async function getLocalRecipeCache(id: string): Promise<LocalRecipeCache | null> {
  const raw = await AsyncStorage.getItem(key(id));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as LocalRecipeCache;
  } catch {
    return null;
  }
}

export async function removeLocalRecipeCache(id: string): Promise<void> {
  await AsyncStorage.removeItem(key(id));
}
