import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY_LOCAL_USER_ID = "local_user_id";
const KEY_MY_RECIPE_IDS = "my_recipe_ids";

export async function getOrCreateLocalUserId(): Promise<string> {
  let id = await AsyncStorage.getItem(KEY_LOCAL_USER_ID);
  if (!id) {
    id = `local_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    await AsyncStorage.setItem(KEY_LOCAL_USER_ID, id);
  }
  return id;
}

async function readMyRecipeIds(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(KEY_MY_RECIPE_IDS);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

async function writeMyRecipeIds(ids: string[]): Promise<void> {
  await AsyncStorage.setItem(KEY_MY_RECIPE_IDS, JSON.stringify(ids));
}

export async function addMyRecipeId(recipeId: string): Promise<void> {
  const ids = await readMyRecipeIds();
  if (!ids.includes(recipeId)) {
    ids.push(recipeId);
    await writeMyRecipeIds(ids);
  }
}

export async function removeMyRecipeId(recipeId: string): Promise<void> {
  const ids = (await readMyRecipeIds()).filter((x) => x !== recipeId);
  await writeMyRecipeIds(ids);
}

export async function isMyRecipe(recipeId: string): Promise<boolean> {
  const ids = await readMyRecipeIds();
  return ids.includes(recipeId);
}
