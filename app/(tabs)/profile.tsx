import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { Colors, ScreenPadding } from "@/constants/theme";

const KEY_IS_LOGGED_IN = "isLoggedIn";
const LOGOUT_DANGER = "#ef4444";

const MENU = [
  { key: "health", label: "Sağlık profili", icon: "heart-outline" as const },
  { key: "privacy", label: "Gizlilik", icon: "shield-checkmark-outline" as const },
  { key: "notifications", label: "Bildirimler", icon: "notifications-outline" as const },
  { key: "help", label: "Yardım", icon: "help-circle-outline" as const },
];

export default function ProfileScreen() {
  const router = useRouter();

  const onPremiumBannerPress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push("/reminders");
  };

  const onLogoutPress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Alert.alert(
      "Çıkış Yap",
      "Hesabınızdan çıkmak istediğinize emin misiniz?",
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Çıkış Yap",
          style: "destructive",
          onPress: () => {
            void (async () => {
              await AsyncStorage.removeItem(KEY_IS_LOGGED_IN);
              router.replace("/auth" as Href);
            })();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Profil</Text>

        <Pressable
          onPress={onPremiumBannerPress}
          style={({ pressed }) => [styles.premiumBannerWrap, pressed && { opacity: 0.94 }]}
          accessibilityRole="button"
          accessibilityLabel="Premium'a geç, hatırlatmalar sekmesine git"
        >
          <LinearGradient
            colors={["#00C278", "#00A86B", "#008A5A"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.premiumBanner}
          >
            <View style={styles.premiumBannerLeft}>
              <Ionicons name="sparkles" size={22} color="#FFFFFF" />
              <Text style={styles.premiumBannerText}>Premium&apos;a Geç ⭐</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#FFFFFF" />
          </LinearGradient>
        </Pressable>

        <View style={styles.avatarBlock}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={36} color={Colors.primary} />
          </View>
          <Text style={styles.name}>Kullanıcı</Text>
          <Text style={styles.email}>ornek@email.com</Text>
        </View>

        {MENU.map((item) => (
          <Pressable
            key={item.key}
            style={styles.row}
            onPress={() => {
              switch (item.key) {
                case "health":
                  router.push("/health-profile");
                  break;
                case "privacy":
                  router.push("/privacy");
                  break;
                case "notifications":
                  router.push("/notification-settings");
                  break;
                case "help":
                  router.push("/help");
                  break;
                default:
                  break;
              }
            }}
          >
            <Ionicons name={item.icon} size={22} color={Colors.text} />
            <Text style={styles.rowLabel}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
          </Pressable>
        ))}

        <Pressable
          style={({ pressed }) => [styles.logoutRow, pressed && { opacity: 0.92 }]}
          onPress={onLogoutPress}
          accessibilityRole="button"
          accessibilityLabel="Çıkış yap"
        >
          <Ionicons name="log-out-outline" size={22} color={LOGOUT_DANGER} />
          <Text style={styles.logoutLabel}>Çıkış Yap</Text>
        </Pressable>

        <Text style={styles.version}>Health Guide App · v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: ScreenPadding,
    paddingBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 16,
  },
  premiumBannerWrap: {
    marginBottom: 24,
    borderRadius: 14,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#00A86B",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
    }),
  },
  premiumBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  premiumBannerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  premiumBannerText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  avatarBlock: {
    alignItems: "center",
    marginBottom: 28,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.card,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  name: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.text,
  },
  email: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  rowLabel: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    fontWeight: "500",
  },
  logoutRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.35)",
    gap: 12,
  },
  logoutLabel: {
    flex: 1,
    fontSize: 16,
    color: LOGOUT_DANGER,
    fontWeight: "600",
  },
  version: {
    textAlign: "center",
    marginTop: 24,
    fontSize: 13,
    color: Colors.textSecondary,
  },
});
