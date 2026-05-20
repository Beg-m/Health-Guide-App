import { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Shadows, ScreenPadding } from "@/constants/theme";
import { getMedicineById, type MedicineMode } from "@/constants/medicines";

function emptyFallback(text: string): string {
  return text.trim() ? text.trim() : "Bu bölüm için kayıtlı bilgi yok.";
}

function sectionLeadingIcon(title: string): string {
  if (title === "Kullanım") return "💊";
  if (title === "Dozaj") return "📏";
  if (title === "Yan Etkiler") return "⚠️";
  if (title === "Uyarılar") return "🚫";
  if (title.includes("Etkileşim")) return "🔄";
  if (title.includes("Etken")) return "🧪";
  return "📋";
}

export default function MedicineDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const medicine = typeof id === "string" ? getMedicineById(id) : undefined;
  const [mode, setMode] = useState<MedicineMode>("basic");

  if (!medicine) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>İlaç bulunamadı.</Text>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.errorLink}>Geri dön</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const basicSections = [
    { title: "Kullanım", body: emptyFallback(medicine.basicUsage || medicine.usage || "") },
    { title: "Dozaj", body: emptyFallback(medicine.basicDosage || medicine.dosage || "") },
    {
      title: "Yan Etkiler",
      body: emptyFallback(medicine.basicSideEffects || medicine.sideEffects || ""),
    },
    {
      title: "Uyarılar",
      body: emptyFallback(medicine.basicWarnings || medicine.warnings || ""),
    },
  ];

  const medicalSections = [
    { title: "Etken Madde", body: emptyFallback(medicine.activeIngredient) },
    { title: "Kullanım", body: emptyFallback(medicine.medicalUsage || medicine.usage || "") },
    { title: "Dozaj", body: emptyFallback(medicine.medicalDosage || medicine.dosage || "") },
    {
      title: "Yan Etkiler",
      body: emptyFallback(medicine.medicalSideEffects || medicine.sideEffects || ""),
    },
    {
      title: "Uyarılar",
      body: emptyFallback(medicine.medicalWarnings || medicine.warnings || ""),
    },
    {
      title: "İlaç Etkileşimleri",
      body: emptyFallback(medicine.interactions ?? ""),
    },
  ];

  const sections = mode === "basic" ? basicSections : medicalSections;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={[styles.topBar, Shadows.card]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.topTitle} numberOfLines={1}>
          İlaç detayı
        </Text>
        <View style={styles.topBarSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.name}>{medicine.name}</Text>
            {mode === "basic" ? (
              medicine.activeIngredient.trim() ? (
                <Text style={styles.subName} numberOfLines={4}>
                  {medicine.activeIngredient}
                </Text>
              ) : (
                <Text style={styles.subNameMuted}>Etken madde bilgisi listede yok</Text>
              )
            ) : null}
          </View>
        </View>

        <View style={styles.togglePanel}>
          <Text style={styles.togglePanelLabel}>Görünüm modu</Text>
          <View style={styles.toggle}>
            <Pressable
              style={[styles.toggleBtn, mode === "basic" && styles.toggleBtnActive]}
              onPress={() => setMode("basic")}
            >
              <Text
                style={[styles.toggleText, mode === "basic" && styles.toggleTextActive]}
              >
                Basic Mode
              </Text>
              <Text style={[styles.toggleHint, mode === "basic" && styles.toggleHintActive]}>
                Sade bilgi
              </Text>
            </Pressable>
            <Pressable
              style={[styles.toggleBtn, mode === "medical" && styles.toggleBtnActive]}
              onPress={() => setMode("medical")}
            >
              <Text
                style={[styles.toggleText, mode === "medical" && styles.toggleTextActive]}
              >
                Medical Mode
              </Text>
              <Text
                style={[styles.toggleHint, mode === "medical" && styles.toggleHintActive]}
              >
                Detaylı / teknik
              </Text>
            </Pressable>
          </View>
        </View>

        {sections.map((s) => (
          <View
            key={`${mode}-${s.title}`}
            style={[styles.sectionCard, Shadows.card]}
          >
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionEmoji}>{sectionLeadingIcon(s.title)}</Text>
              <Text style={styles.sectionTitle}>{s.title}</Text>
            </View>
            <Text style={styles.sectionBody}>{s.body}</Text>
          </View>
        ))}

        <View style={[styles.disclaimerBox, Shadows.card]} accessibilityRole="text">
          <Text style={styles.disclaimerIcon} accessibilityLabel="Uyarı">
            ⚠️
          </Text>
          <Text style={styles.disclaimerText}>
            Bu bilgiler genel niteliktedir; tanı ve tedavi için mutlaka hekim veya eczacınıza
            danışın.
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, Shadows.tabBarTop]}>
        <Pressable style={[styles.aiBtn, Shadows.cardMedium]} onPress={() => router.push("/ai-chat")}>
          <Ionicons name="chatbubbles-outline" size={22} color="#FFFFFF" />
          <Text style={styles.aiBtnText}>AI Asistan</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: Colors.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    padding: 8,
    width: 44,
  },
  topTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "600",
    color: Colors.text,
  },
  topBarSpacer: {
    width: 44,
  },
  scrollContent: {
    paddingHorizontal: ScreenPadding,
    paddingBottom: 120,
    paddingTop: 12,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  name: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.text,
  },
  subName: {
    fontSize: 15,
    color: Colors.primary,
    marginTop: 8,
    fontWeight: "600",
    lineHeight: 22,
  },
  subNameMuted: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
    fontStyle: "italic",
  },
  togglePanel: {
    marginBottom: 24,
    padding: ScreenPadding,
    borderRadius: 18,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.cardMedium,
  },
  togglePanelLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  toggle: {
    flexDirection: "row",
    gap: 10,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: Colors.background,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: "center",
  },
  toggleBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primaryDark,
  },
  toggleText: {
    fontSize: 15,
    fontWeight: "800",
    color: Colors.textSecondary,
  },
  toggleTextActive: {
    color: "#FFFFFF",
  },
  toggleHint: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
    fontWeight: "500",
  },
  toggleHintActive: {
    color: "rgba(255,255,255,0.95)",
  },
  sectionCard: {
    marginBottom: 16,
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: ScreenPadding,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  sectionEmoji: {
    fontSize: 20,
    lineHeight: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.text,
    flex: 1,
  },
  sectionBody: {
    fontSize: 15,
    lineHeight: 24,
    color: Colors.text,
  },
  disclaimerBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginTop: 8,
    marginBottom: 8,
    padding: ScreenPadding,
    borderRadius: 16,
    backgroundColor: "#FFF8E6",
    borderWidth: 1,
    borderColor: "#F5C842",
  },
  disclaimerIcon: {
    fontSize: 20,
    lineHeight: 24,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: "#8B4513",
    lineHeight: 20,
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: ScreenPadding,
    paddingVertical: 12,
    paddingBottom: 28,
    backgroundColor: Colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  aiBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 16,
  },
  aiBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  errorBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: ScreenPadding,
  },
  errorText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  errorLink: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.primary,
  },
});
