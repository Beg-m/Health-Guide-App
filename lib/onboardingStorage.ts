import AsyncStorage from "@react-native-async-storage/async-storage";

const ONBOARDING_KEY = "@health_guide_onboarding_done";

export async function isOnboardingCompleted(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(ONBOARDING_KEY);
    return value === "1";
  } catch {
    return false;
  }
}

export async function markOnboardingCompleted(): Promise<void> {
  try {
    await AsyncStorage.setItem(ONBOARDING_KEY, "1");
  } catch {
    // no-op: app should stay usable if persistence fails
  }
}
