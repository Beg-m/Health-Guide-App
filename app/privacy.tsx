import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, ScreenPadding } from "@/constants/theme";

const BULLETS = [
  "Veriler yalnızca cihazınızda saklanır.",
  "Kişisel sağlık bilgileriniz üçüncü taraflarla paylaşılmaz.",
  "AI asistan sorularınız işlendikten sonra saklanmaz.",
  "Uygulama KVKK uyumludur.",
];

export default function PrivacyScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.topTitle} numberOfLines={1}>
          Gizlilik
        </Text>
        <View style={styles.topRight} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>Gizlilik politikası</Text>
        <Text style={styles.lead}>
          Health Guide App olarak gizliliğinize önem veriyoruz. Özetle:
        </Text>
        {BULLETS.map((line) => (
          <View key={line} style={styles.bulletRow}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>{line}</Text>
          </View>
        ))}
        <Text style={styles.footer}>
          Ayrıntılı sorularınız için Profil → Yardım üzerinden bizimle iletişime
          geçebilirsiniz.
        </Text>
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
    paddingTop: 16,
  },
  heading: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 12,
  },
  lead: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: 16,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 12,
    paddingRight: 8,
  },
  bullet: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: "700",
    marginTop: 2,
  },
  bulletText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: Colors.text,
  },
  footer: {
    marginTop: 20,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
