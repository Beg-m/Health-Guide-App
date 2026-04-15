import { useCallback } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Shadows, ScreenPadding } from "@/constants/theme";
import { MEDICINES } from "@/constants/medicines";
import { useHealthProfile } from "@/hooks/useHealthProfile";
import {
  HEALTH_FILTER_TIPS,
  type HealthProfilePreferences,
} from "@/lib/healthProfileStorage";

const QUICK_FEATURES: {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: "/search" | "/pharmacy" | "/ai-chat" | "/reminders";
  iconBg: string;
  iconColor: string;
}[] = [
  {
    key: "search",
    label: "İlaç Ara",
    icon: "search",
    route: "/search",
    iconBg: "rgba(0,168,107,0.18)",
    iconColor: Colors.primary,
  },
  {
    key: "pharmacy",
    label: "Eczane Bul",
    icon: "location",
    route: "/pharmacy",
    iconBg: "rgba(59,130,246,0.15)",
    iconColor: "#2563EB",
  },
  {
    key: "ai",
    label: "AI Asistan",
    icon: "chatbubbles",
    route: "/ai-chat",
    iconBg: "rgba(139,92,246,0.15)",
    iconColor: "#7C3AED",
  },
  {
    key: "reminders",
    label: "Hatırlatma",
    icon: "alarm",
    route: "/reminders",
    iconBg: "rgba(245,158,11,0.18)",
    iconColor: "#D97706",
  },
];

const recentMedicines = MEDICINES.slice(0, 3);

function getActiveFilterKeys(
  prefs: HealthProfilePreferences
): (keyof HealthProfilePreferences)[] {
  return (Object.keys(prefs) as (keyof HealthProfilePreferences)[]).filter(
    (k) => prefs[k]
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { prefs, reload } = useHealthProfile();

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload])
  );

  const activeFilterKeys = getActiveFilterKeys(prefs);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={[Colors.primary, Colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.logoRow}>
            <View style={styles.logoMark}>
              <Ionicons name="heart" size={24} color={Colors.primary} />
            </View>
            <Text style={styles.logoText}>Health Guide App</Text>
          </View>
          <Text style={styles.greeting}>Merhaba, hoş geldiniz</Text>
          <Text style={styles.subGreeting}>
            Sağlığınız için güvenilir bilgi ve hatırlatmalar
          </Text>
          {activeFilterKeys.length > 0 && (
            <View style={styles.tipsBox}>
              {activeFilterKeys.map((key) => (
                <View key={key} style={styles.tipRow}>
                  <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                  <Text style={styles.tipText}>{HEALTH_FILTER_TIPS[key]}</Text>
                </View>
              ))}
            </View>
          )}
        </LinearGradient>

        <View style={styles.body}>
          <Pressable
            style={styles.searchBar}
            onPress={() => router.push("/search")}
            accessibilityRole="button"
          >
            <Ionicons name="search" size={20} color={Colors.textSecondary} />
            <Text style={styles.searchPlaceholder}>İlaç veya etken madde ara…</Text>
          </Pressable>

          <Text style={styles.sectionTitle}>Hızlı erişim</Text>
          <View style={styles.quickGrid}>
            {QUICK_FEATURES.map((item) => (
              <Pressable
                key={item.key}
                style={[styles.quickCard, Shadows.card]}
                onPress={() => router.push(item.route)}
              >
                <View style={[styles.quickIconWrap, { backgroundColor: item.iconBg }]}>
                  <Ionicons name={item.icon} size={28} color={item.iconColor} />
                </View>
                <Text style={styles.quickLabel}>{item.label}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Son görüntülenenler</Text>
            <Pressable onPress={() => router.push("/search")}>
              <Text style={styles.seeAll}>Tümü</Text>
            </Pressable>
          </View>
          {recentMedicines.map((m) => (
            <Pressable
              key={`${m.id}-${m.name}`}
              style={[styles.medicineRow, Shadows.card]}
              onPress={() => router.push(`/medicine/${m.id}`)}
            >
              <View style={styles.medicineAccent} />
              <View style={styles.medicineIcon}>
                <Ionicons name="medkit-outline" size={22} color={Colors.primary} />
              </View>
              <View style={styles.medicineText}>
                <Text style={styles.medicineName}>{m.name}</Text>
                <Text style={styles.medicineMeta}>{m.activeIngredient}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingBottom: 24,
  },
  hero: {
    paddingHorizontal: ScreenPadding,
    paddingTop: 12,
    paddingBottom: 24,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  body: {
    paddingHorizontal: ScreenPadding,
    paddingTop: 20,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 18,
  },
  logoMark: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },
  greeting: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 6,
  },
  subGreeting: {
    fontSize: 15,
    color: "rgba(255,255,255,0.92)",
    lineHeight: 22,
  },
  tipsBox: {
    marginTop: 16,
    gap: 8,
  },
  tipRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.16)",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: "#FFFFFF",
    lineHeight: 20,
    fontWeight: "500",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    borderRadius: 16,
    paddingHorizontal: ScreenPadding,
    paddingVertical: 14,
    gap: 10,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 15,
    color: Colors.textSecondary,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 12,
  },
  seeAll: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.primary,
  },
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 8,
  },
  quickCard: {
    width: "47%",
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: ScreenPadding,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  quickLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
  },
  medicineRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.background,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: ScreenPadding,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  medicineAccent: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: Colors.primary,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  medicineIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(0,168,107,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
    marginRight: 12,
  },
  medicineText: { flex: 1 },
  medicineName: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
  },
  medicineMeta: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
