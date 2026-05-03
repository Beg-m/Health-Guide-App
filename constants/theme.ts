import type { ViewStyle } from "react-native";

export const Colors = {
  background: "#FFFFFF",
  primary: "#16a34a",
  primaryDark: "#059669",
  teal: "#0d9488",
  card: "#F8FAFC",
  text: "#1A1A1A",
  textSecondary: "#6B7280",
  border: "#E5E7EB",
} as const;

/** Yuvarlak köşe — kartlar için birleşik */
export const Radii = {
  card: 20,
  md: 16,
  sm: 12,
  pill: 999,
} as const;

/** Standart yatay padding */
export const ScreenPadding = 16;

/** Ana yeşil → teal başlık gradyanları */
export const Gradients = {
  header: ["#16a34a", "#059669", "#0d9488"] as const,
  cardSubtle: ["#FFFFFF", "#f0fdf4"] as const,
  button: ["#16a34a", "#059669", "#0d9488"] as const,
  tabActive: ["#16a34a", "#059669"] as const,
  fab: ["#22c55e", "#16a34a"] as const,
  /** Hızlı erişim kartları — ikon arka planları */
  quickSearch: ["#34d399", "#10b981"] as const,
  quickPharmacy: ["#60a5fa", "#3b82f6"] as const,
  quickAi: ["#c084fc", "#9333ea"] as const,
  quickReminders: ["#fbbf24", "#f59e0b"] as const,
  tipCard: ["#ecfdf5", "#d1fae5", "#a7f3d0"] as const,
} as const;

/** Tarif / blog etiket renkleri */
export const RecipeTagStyles: Record<
  string,
  { bg: string; text: string; border?: string }
> = {
  Çölyak: { bg: "#ffedd5", text: "#c2410c", border: "#fdba74" },
  Diyabet: { bg: "#dbeafe", text: "#1d4ed8", border: "#93c5fd" },
  Vegan: { bg: "#dcfce7", text: "#15803d", border: "#86efac" },
  Vejetaryen: { bg: "#f3e8ff", text: "#7e22ce", border: "#d8b4fe" },
  Glutensiz: { bg: "#ccfbf1", text: "#0f766e", border: "#5eead4" },
  Glütensiz: { bg: "#ccfbf1", text: "#0f766e", border: "#5eead4" },
  "Düşük Kalori": { bg: "#f1f5f9", text: "#475569", border: "#cbd5e1" },
  "Yüksek Protein": { bg: "#fef3c7", text: "#b45309", border: "#fcd34d" },
};

export function getRecipeTagStyle(tag: string) {
  return (
    RecipeTagStyles[tag] ?? {
      bg: `${Colors.primary}18`,
      text: Colors.primary,
      border: `${Colors.primary}40`,
    }
  );
}

/** İlaç kartı sol şerit — id’ye göre tutarlı renk */
const MEDICINE_ACCENT_PALETTE = [
  "#ea580c",
  "#2563eb",
  "#16a34a",
  "#9333ea",
  "#0d9488",
  "#dc2626",
] as const;

export function medicineAccentColor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) | 0;
  }
  return MEDICINE_ACCENT_PALETTE[Math.abs(h) % MEDICINE_ACCENT_PALETTE.length];
}

/** Daha belirgin kart gölgesi */
export const Shadows = {
  card: {
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  cardMedium: {
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 10,
  },
  tabBarTop: {
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 16,
  },
} as const satisfies Record<string, ViewStyle>;

/** Başlık tipografisi */
export const headerTitleStyle = {
  fontWeight: "800" as const,
  letterSpacing: 0.4,
};
