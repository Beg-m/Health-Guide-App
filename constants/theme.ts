import type { ViewStyle } from "react-native";

export const Colors = {
  background: "#FFFFFF",
  primary: "#00A86B",
  /** Darker green for gradients and accents */
  primaryDark: "#007A4D",
  card: "#F8F9FA",
  text: "#1A1A1A",
  textSecondary: "#6B7280",
  border: "#E5E7EB",
} as const;

/** Standard horizontal padding across screens */
export const ScreenPadding = 16;

/** Subtle card elevation — use on iOS + Android */
export const Shadows = {
  card: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  cardMedium: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 6,
  },
  tabBarTop: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 12,
  },
} as const satisfies Record<string, ViewStyle>;
