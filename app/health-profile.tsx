import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Platform,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, ScreenPadding } from "@/constants/theme";
import { useHealthProfile } from "@/hooks/useHealthProfile";
import type { HealthProfilePreferences } from "@/lib/healthProfileStorage";

type Ion = keyof typeof Ionicons.glyphMap;

const PROFILE_OPTIONS: {
  key: keyof HealthProfilePreferences;
  label: string;
  icon: Ion;
}[] = [
  { key: "generalUser", label: "Genel Kullanıcı", icon: "checkmark-circle-outline" },
  { key: "celiac", label: "Çölyak (Gluten-free)", icon: "nutrition-outline" },
  { key: "lactose", label: "Laktoz İntoleransı", icon: "water-outline" },
  { key: "diabetes", label: "Diyabet", icon: "pulse-outline" },
  { key: "vegan", label: "Vegan", icon: "leaf-outline" },
  { key: "vegetarian", label: "Vejetaryen", icon: "restaurant-outline" },
  { key: "athlete", label: "Sporcu / Aktif yaşam", icon: "fitness-outline" },
  { key: "pregnantBreastfeeding", label: "Hamile / Emziren", icon: "heart-outline" },
  { key: "senior65", label: "65 yaş üstü", icon: "accessibility-outline" },
  { key: "child012", label: "Çocuk için (0-12 yaş)", icon: "happy-outline" },
  { key: "chronicMeds", label: "Kronik ilaç kullanıcısı", icon: "medical-outline" },
];

export default function HealthProfileScreen() {
  const router = useRouter();
  const { prefs, setPreference } = useHealthProfile();

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.topTitle} numberOfLines={1}>
          Sağlık profili
        </Text>
        <View style={styles.topRight} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.intro}>
          &quot;Genel Kullanıcı&quot; seçildiğinde diğer seçenekler kapanır. Birden fazla özel
          profili (ör. Diyabet + Vegan) birlikte seçebilirsiniz. Tercihler cihazınızda saklanır.
        </Text>

        {PROFILE_OPTIONS.map((item) => (
          <View key={item.key} style={styles.row}>
            <View style={styles.iconWrap}>
              <Ionicons name={item.icon} size={22} color={Colors.primary} />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>{item.label}</Text>
            </View>
            <Switch
              value={prefs[item.key]}
              onValueChange={(v) => setPreference(item.key, v)}
              trackColor={{ false: Colors.border, true: Colors.primary }}
              thumbColor={Platform.OS === "android" ? "#FFFFFF" : undefined}
              ios_backgroundColor={Colors.border}
            />
          </View>
        ))}
      </ScrollView>
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
    borderBottomWidth: 1,
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
  topRight: { width: 44 },
  content: {
    paddingHorizontal: ScreenPadding,
    paddingBottom: 32,
    paddingTop: 8,
  },
  intro: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: `${Colors.primary}18`,
    alignItems: "center",
    justifyContent: "center",
  },
  rowText: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.text,
  },
});
