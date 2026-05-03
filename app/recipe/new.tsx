import { View, Text, StyleSheet, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, ScreenPadding, Shadows } from "@/constants/theme";

const BLOG_GREEN = "#16a34a";

export default function NewRecipeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={[styles.topBar, Shadows.card]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.topTitle}>Yeni tarif</Text>
        <View style={styles.backBtn} />
      </View>

      <View style={styles.center}>
        <View style={[styles.iconWrap, { backgroundColor: `${BLOG_GREEN}18` }]}>
          <Ionicons name="create-outline" size={40} color={BLOG_GREEN} />
        </View>
        <Text style={styles.headline}>Tarif paylaşımı yakında</Text>
        <Text style={styles.sub}>
          Yeni gönderi oluşturma özelliği üzerinde çalışıyoruz. Şimdilik topluluğun tariflerini
          keşfedebilirsiniz.
        </Text>
        <Pressable style={styles.primaryBtn} onPress={() => router.back()}>
          <Text style={styles.primaryBtnText}>Tariflere dön</Text>
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
    justifyContent: "space-between",
    paddingHorizontal: ScreenPadding,
    paddingVertical: 12,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  topTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "700",
    color: Colors.text,
  },
  center: {
    flex: 1,
    paddingHorizontal: ScreenPadding,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  headline: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.text,
    textAlign: "center",
    marginBottom: 10,
  },
  sub: {
    fontSize: 15,
    lineHeight: 22,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: 24,
  },
  primaryBtn: {
    backgroundColor: BLOG_GREEN,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
