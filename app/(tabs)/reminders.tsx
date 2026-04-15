import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Colors, ScreenPadding } from "@/constants/theme";

const BENEFITS = [
  "Sınırsız ilaç hatırlatması",
  "Özelleştirilebilir bildirim saatleri",
  "Kür takibi",
  "Aile üyesi profilleri",
];

export default function RemindersScreen() {
  const onPremiumPress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    Alert.alert(
      "Premium",
      "Ödeme ve abonelik akışı yakında eklenecek. Şimdilik hatırlatmalar Premium ile açılacaktır.",
      [{ text: "Tamam" }]
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.hero}>
          <View style={styles.lockCircle}>
            <Ionicons name="lock-closed" size={40} color={Colors.primary} />
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Premium Özellik</Text>
          </View>
          <Text style={styles.screenTitle}>İlaç Hatırlatıcı</Text>
          <Text style={styles.description}>
            İlaç saatlerinizi hiç kaçırmayın. Günlük hatırlatmalar ile tedavinizi düzenli
            sürdürün.
          </Text>
        </View>

        <View style={styles.benefitsCard}>
          {BENEFITS.map((line) => (
            <View key={line} style={styles.benefitRow}>
              <Ionicons name="checkmark-circle" size={22} color={Colors.primary} />
              <Text style={styles.benefitText}>{line}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.price}>Aylık ₺29.99</Text>
        <Text style={styles.trial}>7 gün ücretsiz dene</Text>
        <Pressable
          style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
          onPress={onPremiumPress}
        >
          <Text style={styles.ctaText}>Premium&apos;a Geç</Text>
          <Ionicons name="arrow-forward" size={22} color="#FFFFFF" />
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: ScreenPadding,
    paddingTop: 8,
    paddingBottom: 16,
  },
  hero: {
    alignItems: "center",
    paddingTop: 12,
  },
  lockCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: `${Colors.primary}18`,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  badge: {
    backgroundColor: `${Colors.primary}22`,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: `${Colors.primary}44`,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.primary,
    letterSpacing: 0.3,
  },
  screenTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: Colors.text,
    textAlign: "center",
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 8,
  },
  benefitsCard: {
    marginTop: 28,
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 14,
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  benefitText: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    fontWeight: "500",
    lineHeight: 22,
  },
  footer: {
    paddingHorizontal: ScreenPadding,
    paddingTop: 12,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
  price: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
    textAlign: "center",
    marginBottom: 4,
  },
  trial: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: 16,
  },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
  },
  ctaPressed: {
    opacity: 0.92,
  },
  ctaText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
