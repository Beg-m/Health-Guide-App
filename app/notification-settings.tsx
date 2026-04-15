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
import { useNotificationSettings } from "@/hooks/useNotificationSettings";

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const { settings, update } = useNotificationSettings();

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.topTitle} numberOfLines={1}>
          Bildirimler
        </Text>
        <View style={styles.topRight} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.intro}>
          Tercihleriniz cihazınıza kaydedilir. Gerçek bildirim izni için işletim sistemi
          ayarlarından da kontrol edin.
        </Text>

        <View style={styles.row}>
          <View style={styles.iconWrap}>
            <Ionicons name="alarm-outline" size={22} color={Colors.primary} />
          </View>
          <View style={styles.rowText}>
            <Text style={styles.rowLabel}>İlaç hatırlatmaları</Text>
            <Text style={styles.rowHint}>Hatırlatma saatlerinde bildirim</Text>
          </View>
          <Switch
            value={settings.medicationReminders}
            onValueChange={(v) => update("medicationReminders", v)}
            trackColor={{ false: Colors.border, true: Colors.primary }}
            thumbColor={Platform.OS === "android" ? "#FFFFFF" : undefined}
            ios_backgroundColor={Colors.border}
          />
        </View>

        <View style={styles.row}>
          <View style={styles.iconWrap}>
            <Ionicons name="sunny-outline" size={22} color={Colors.primary} />
          </View>
          <View style={styles.rowText}>
            <Text style={styles.rowLabel}>Günlük sağlık ipucu</Text>
            <Text style={styles.rowHint}>Her gün kısa bir ipucu</Text>
          </View>
          <Switch
            value={settings.dailyHealthTip}
            onValueChange={(v) => update("dailyHealthTip", v)}
            trackColor={{ false: Colors.border, true: Colors.primary }}
            thumbColor={Platform.OS === "android" ? "#FFFFFF" : undefined}
            ios_backgroundColor={Colors.border}
          />
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
    marginBottom: 10,
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
    fontWeight: "600",
    color: Colors.text,
  },
  rowHint: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
