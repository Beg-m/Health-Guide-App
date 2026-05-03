/** AsyncStorage keys + helpers for onboarding & condition chips */

export const STORAGE_ONBOARDING_COMPLETED = "onboardingCompleted";
export const STORAGE_USER_CONDITIONS = "userConditions";

/** Labels must match onboarding chips exactly (used for home personalization). */
export const CONDITION_OPTIONS = [
  "Çölyak",
  "Diyabet",
  "Vegan",
  "Vejetaryen",
  "Hipertansiyon",
  "Kalp Hastası",
] as const;

export type UserCondition = (typeof CONDITION_OPTIONS)[number];
