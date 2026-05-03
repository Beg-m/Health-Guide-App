import { useCallback, useState } from "react";
import { View, Text, StyleSheet, ScrollView, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { STORAGE_USER_CONDITIONS } from "@/constants/onboardingStorage";
import {
  Colors,
  Gradients,
  Radii,
  Shadows,
  ScreenPadding,
  headerTitleStyle,
  medicineAccentColor,
} from "@/constants/theme";
import { MEDICINES } from "@/constants/medicines";
import { useHealthProfile } from "@/hooks/useHealthProfile";
import {
  HEALTH_FILTER_TIPS,
  type HealthProfilePreferences,
} from "@/lib/healthProfileStorage";
import { FadeInView } from "@/components/FadeInView";
import { PressableScale } from "@/components/PressableScale";

const QUICK_FEATURES: {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: "/search" | "/pharmacy" | "/ai-chat" | "/reminders";
  gradient: readonly [string, string];
}[] = [
  {
    key: "search",
    label: "İlaç Ara",
    icon: "search",
    route: "/search",
    gradient: Gradients.quickSearch,
  },
  {
    key: "pharmacy",
    label: "Eczane Bul",
    icon: "location",
    route: "/pharmacy",
    gradient: Gradients.quickPharmacy,
  },
  {
    key: "ai",
    label: "AI Asistan",
    icon: "chatbubbles",
    route: "/ai-chat",
    gradient: Gradients.quickAi,
  },
  {
    key: "reminders",
    label: "Hatırlatma",
    icon: "alarm",
    route: "/reminders",
    gradient: Gradients.quickReminders,
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

const QUICK_GRID_GAP = 12;
/** İki sütun; kart genişliği ~160px civarı (ekrana göre hesaplanır) */
function useQuickCardWidth() {
  const { width } = useWindowDimensions();
  const inner = width - ScreenPadding * 2 - QUICK_GRID_GAP;
  const half = Math.floor(inner / 2);
  return Math.min(160, half > 0 ? half : 160);
}

export default function HomeScreen() {
  const router = useRouter();
  const quickCardWidth = useQuickCardWidth();
  const { prefs, reload } = useHealthProfile();
  const [userConditions, setUserConditions] = useState<string[]>([]);

  const loadUserConditions = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_USER_CONDITIONS);
      if (!raw) {
        setUserConditions([]);
        return;
      }
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed) && parsed.every((x) => typeof x === "string")) {
        setUserConditions(parsed);
      } else {
        setUserConditions([]);
      }
    } catch {
      setUserConditions([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void reload();
      void loadUserConditions();
    }, [reload, loadUserConditions])
  );

  const activeFilterKeys = getActiveFilterKeys(prefs);
  const showColyakSection = userConditions.includes("Çölyak");
  const showDiabetesSection = userConditions.includes("Diyabet");

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <FadeInView style={{ flex: 1 }}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <LinearGradient
            colors={[...Gradients.header]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <View style={styles.logoRow}>
              <LinearGradient
                colors={["#ffffff", "#ecfdf5"]}
                style={styles.logoMark}
              >
                <Ionicons name="heart" size={26} color={Colors.primary} />
              </LinearGradient>
              <Text style={styles.logoText}>Health Guide App</Text>
            </View>
            <Text style={styles.greeting}>Merhaba, sağlıklı günler! 🌿</Text>
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

          <View style={styles.waveCurve} />

          <View style={styles.body}>
            <PressableScale
              style={[styles.searchBar, Shadows.card]}
              onPress={() => router.push("/search")}
            >
              <Ionicons name="search" size={22} color={Colors.primary} />
              <Text style={styles.searchPlaceholder}>İlaç veya etken madde ara…</Text>
            </PressableScale>

            <Text style={styles.sectionTitle}>Hızlı erişim</Text>
            <View style={styles.quickGrid}>
              {QUICK_FEATURES.map((item) => (
                <PressableScale
                  key={item.key}
                  style={[styles.quickCardWrap, { width: quickCardWidth }]}
                  onPress={() => router.push(item.route)}
                >
                  <LinearGradient
                    colors={[...Gradients.cardSubtle]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.quickCard, Shadows.card]}
                  >
                    <LinearGradient
                      colors={item.gradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.quickIconWrap}
                    >
                      <Ionicons name={item.icon} size={26} color="#FFFFFF" />
                    </LinearGradient>
                    <Text style={styles.quickLabel} numberOfLines={2} ellipsizeMode="tail">
                      {item.label}
                    </Text>
                  </LinearGradient>
                </PressableScale>
              ))}
            </View>

            {showColyakSection && (
              <PressableScale
                style={[styles.personalSection, Shadows.card]}
                onPress={() => router.push("/blog")}
              >
                <LinearGradient
                  colors={["#ecfdf5", "#d1fae5"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.personalSectionInner}
                >
                  <View style={styles.personalIconWrap}>
                    <Ionicons name="nutrition-outline" size={26} color="#059669" />
                  </View>
                  <View style={styles.personalSectionText}>
                    <Text style={styles.personalSectionTitle}>Çölyak Dostu Tarifler</Text>
                    <Text style={styles.personalSectionBody}>
                      Glütensiz ve güvenli tarifleri blogumuzda keşfedin.
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={22} color={Colors.textSecondary} />
                </LinearGradient>
              </PressableScale>
            )}

            {showDiabetesSection && (
              <PressableScale
                style={[styles.personalSection, Shadows.card]}
                onPress={() => router.push("/blog")}
              >
                <LinearGradient
                  colors={["#eff6ff", "#dbeafe"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.personalSectionInner}
                >
                  <View style={[styles.personalIconWrap, styles.personalIconWrapDiabetes]}>
                    <Ionicons name="pulse-outline" size={26} color="#2563eb" />
                  </View>
                  <View style={styles.personalSectionText}>
                    <Text style={styles.personalSectionTitle}>Diyabet Dostu Öneriler</Text>
                    <Text style={styles.personalSectionBody}>
                      Kan şekerine uygun ipuçları ve tarif yönlendirmeleri.
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={22} color={Colors.textSecondary} />
                </LinearGradient>
              </PressableScale>
            )}

            <LinearGradient
              colors={[...Gradients.tipCard]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.tipBanner, Shadows.cardMedium]}
            >
              <Ionicons name="sparkles" size={28} color={Colors.primary} />
              <View style={styles.tipBannerText}>
                <Text style={styles.tipBannerTitle}>Bugünkü sağlık ipucu</Text>
                <Text style={styles.tipBannerBody}>
                  Günde en az 6–8 bardak su için; öğünlerinizi düzenli saatlere yayarak enerjinizi
                  dengede tutun.
                </Text>
              </View>
            </LinearGradient>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Son görüntülenenler</Text>
              <PressableScale onPress={() => router.push("/search")} style={styles.seeAllHit}>
                <Text style={styles.seeAll}>Tümü</Text>
              </PressableScale>
            </View>
            {recentMedicines.map((m) => {
              const accent = medicineAccentColor(m.id);
              return (
                <PressableScale
                  key={`${m.id}-${m.name}`}
                  style={[styles.medicineRow, Shadows.card]}
                  onPress={() => router.push(`/medicine/${m.id}`)}
                >
                  <View style={[styles.medicineAccent, { backgroundColor: accent }]} />
                  <LinearGradient
                    colors={["rgba(255,255,255,0.95)", `${accent}12`]}
                    style={styles.medicineIcon}
                  >
                    <Ionicons name="medkit-outline" size={22} color={accent} />
                  </LinearGradient>
                  <View style={styles.medicineText}>
                    <Text style={styles.medicineName}>{m.name}</Text>
                    <Text style={styles.medicineMeta}>{m.activeIngredient}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
                </PressableScale>
              );
            })}
          </View>
        </ScrollView>
      </FadeInView>
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
    paddingBottom: 28,
  },
  hero: {
    paddingHorizontal: ScreenPadding,
    paddingTop: 16,
    paddingBottom: 36,
  },
  waveCurve: {
    height: 28,
    backgroundColor: Colors.background,
    marginTop: -22,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  body: {
    paddingHorizontal: ScreenPadding,
    paddingTop: 4,
    marginTop: -6,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  logoMark: {
    width: 48,
    height: 48,
    borderRadius: Radii.md,
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.card,
  },
  logoText: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  greeting: {
    fontSize: 26,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  subGreeting: {
    fontSize: 15,
    color: "rgba(255,255,255,0.94)",
    lineHeight: 23,
    letterSpacing: 0.15,
  },
  tipsBox: {
    marginTop: 18,
    gap: 10,
  },
  tipRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: Radii.md,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: "#FFFFFF",
    lineHeight: 21,
    fontWeight: "600",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.background,
    borderRadius: Radii.card,
    paddingHorizontal: ScreenPadding,
    paddingVertical: 16,
    gap: 12,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: `${Colors.primary}28`,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 15,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  sectionTitle: {
    fontSize: 18,
    ...headerTitleStyle,
    color: Colors.text,
    marginBottom: 14,
    letterSpacing: 0.5,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    marginBottom: 14,
  },
  seeAllHit: {
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  seeAll: {
    fontSize: 14,
    fontWeight: "800",
    color: Colors.primary,
    letterSpacing: 0.2,
  },
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: QUICK_GRID_GAP,
    columnGap: QUICK_GRID_GAP,
    marginBottom: 16,
  },
  quickCardWrap: {},
  quickCard: {
    borderRadius: Radii.card,
    minHeight: 120,
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: `${Colors.primary}18`,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  quickIconWrap: {
    width: 48,
    height: 48,
    borderRadius: Radii.md,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    ...Shadows.card,
  },
  quickLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
    textAlign: "center",
    width: "100%",
    lineHeight: 18,
  },
  personalSection: {
    borderRadius: Radii.card,
    marginBottom: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: `${Colors.primary}20`,
  },
  personalSectionInner: {
    flexDirection: "row",
    alignItems: "center",
    padding: ScreenPadding,
    gap: 14,
  },
  personalIconWrap: {
    width: 48,
    height: 48,
    borderRadius: Radii.md,
    backgroundColor: "rgba(5, 150, 105, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  personalIconWrapDiabetes: {
    backgroundColor: "rgba(37, 99, 235, 0.12)",
  },
  personalSectionText: {
    flex: 1,
  },
  personalSectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.text,
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  personalSectionBody: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  tipBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    padding: ScreenPadding,
    borderRadius: Radii.card,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: `${Colors.primary}22`,
  },
  tipBannerText: {
    flex: 1,
  },
  tipBannerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.text,
    marginBottom: 6,
    letterSpacing: 0.35,
  },
  tipBannerBody: {
    fontSize: 14,
    lineHeight: 21,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  medicineRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.background,
    borderRadius: Radii.card,
    paddingVertical: 14,
    paddingHorizontal: ScreenPadding,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  medicineAccent: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
    borderTopLeftRadius: Radii.card,
    borderBottomLeftRadius: Radii.card,
  },
  medicineIcon: {
    width: 46,
    height: 46,
    borderRadius: Radii.md,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
    marginRight: 12,
    borderWidth: 1,
    borderColor: `${Colors.primary}15`,
  },
  medicineText: { flex: 1 },
  medicineName: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.text,
    letterSpacing: 0.2,
  },
  medicineMeta: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
