import AsyncStorage from "@react-native-async-storage/async-storage";

export const KEY_FAVORITE_RECIPES = "favoriteRecipes";

export async function readFavoriteIdsFromStorage(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(KEY_FAVORITE_RECIPES);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((x): x is string => typeof x === "string" && x.length > 0)
      : [];
  } catch {
    return [];
  }
}

export async function writeFavoriteIdsToStorage(ids: string[]): Promise<void> {
  await AsyncStorage.setItem(KEY_FAVORITE_RECIPES, JSON.stringify(ids));
}

export function mergeFavoriteIdLists(a: string[], b: string[]): string[] {
  return [...new Set([...a, ...b])];
}
