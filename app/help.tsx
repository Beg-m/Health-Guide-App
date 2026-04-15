import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Linking,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, ScreenPadding } from "@/constants/theme";

const FAQ: { q: string; a: string }[] = [
  {
    q: "Bu uygulama doktor tavsiyesi verir mi?",
    a: "Hayır, yalnızca bilgilendirme amaçlıdır.",
  },
  {
    q: "Verilerim güvende mi?",
    a: "Evet, tüm veriler cihazınızda saklanır.",
  },
  {
    q: "AI asistan ne kadar doğru bilgi verir?",
    a: "Genel bilgi verir, kesin tanı için doktora danışın.",
  },
  {
    q: "İlaç hatırlatması nasıl eklerim?",
    a: "Hatırlatma sekmesinden + butonuna basın.",
  },
];

const SUPPORT_EMAIL = "destek@healthguideapp.com";

export default function HelpScreen() {
  const router = useRouter();

  const openMail = () => {
    const url = `mailto:${SUPPORT_EMAIL}`;
    Linking.openURL(url).catch(() => {});
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.topTitle} numberOfLines={1}>
          Yardım
        </Text>
        <View style={styles.topRight} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Sık sorulan sorular</Text>
        {FAQ.map((item) => (
          <View key={item.q} style={styles.faqCard}>
            <Text style={styles.question}>{item.q}</Text>
            <Text style={styles.answer}>{item.a}</Text>
          </View>
        ))}

        <Text style={styles.contactTitle}>İletişim</Text>
        <Pressable
          style={styles.contactRow}
          onPress={openMail}
          accessibilityRole="link"
          accessibilityLabel="E-posta ile iletişim"
        >
          <Ionicons name="mail-outline" size={22} color={Colors.primary} />
          <Text style={styles.contactEmail}>{SUPPORT_EMAIL}</Text>
          <Ionicons name="open-outline" size={18} color={Colors.textSecondary} />
        </Pressable>
        <Text style={styles.contactHint}>
          {Platform.select({
            ios: "Varsayılan posta uygulamanız açılır.",
            android: "E-posta uygulamanızı seçebilirsiniz.",
            default: "",
          })}
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 14,
  },
  faqCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  question: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 8,
    lineHeight: 22,
  },
  answer: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
    marginTop: 20,
    marginBottom: 12,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  contactEmail: {
    flex: 1,
    fontSize: 16,
    color: Colors.primary,
    fontWeight: "600",
  },
  contactHint: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 10,
    lineHeight: 18,
  },
});
