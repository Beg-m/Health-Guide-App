import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Platform,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useState, useCallback } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, ScreenPadding } from "@/constants/theme";
import { useHealthProfile } from "@/hooks/useHealthProfile";
import {
  HEALTH_PROFILE_OPTIONS,
  persistHealthProfile,
} from "@/lib/healthProfileStorage";
import { auth } from "@/lib/firebase";

type Ion = keyof typeof Ionicons.glyphMap;

export default function HealthProfileScreen() {
  const router = useRouter();
  const { required } = useLocalSearchParams<{ required?: string }>();
  const isRequired = required === "1";
  const { prefs, setPreference, ready, reload } = useHealthProfile();
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload])
  );

  const onComplete = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      Alert.alert("Hata", "Oturum bulunamadı. Lütfen tekrar giriş yapın.");
      return;
    }

    setSaving(true);
    try {
      await persistHealthProfile(prefs, uid);
      router.replace("/(tabs)");
    } catch {
      Alert.alert("Hata", "Sağlık profili kaydedilemedi. Tekrar deneyin.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.topBar}>
        {!isRequired ? (
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </Pressable>
        ) : (
          <View style={styles.backBtn} />
        )}
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
        {isRequired && (
          <View style={styles.requiredBanner}>
            <Ionicons name="information-circle-outline" size={20} color={Colors.primary} />
            <Text style={styles.requiredBannerText}>
              Devam etmek için sağlık profilinizi doldurun.
            </Text>
          </View>
        )}

        <Text style={styles.intro}>
          &quot;Genel Kullanıcı&quot; seçildiğinde diğer seçenekler kapanır. Birden fazla özel
          profili (ör. Diyabet + Vegan) birlikte seçebilirsiniz.
        </Text>

        {!ready ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 24 }} />
        ) : (
          HEALTH_PROFILE_OPTIONS.map((item) => (
            <View key={item.key} style={styles.row}>
              <View style={styles.iconWrap}>
                <Ionicons name={item.icon as Ion} size={22} color={Colors.primary} />
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
          ))
        )}
      </ScrollView>

      {isRequired && (
        <View style={styles.footer}>
          <Pressable
            style={[styles.completeBtn, (saving || !ready) && { opacity: 0.7 }]}
            onPress={() => void onComplete()}
            disabled={saving || !ready}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.completeBtnText}>Kaydet ve Devam Et</Text>
            )}
          </Pressable>
        </View>
      )}
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
  requiredBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: `${Colors.primary}12`,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: `${Colors.primary}30`,
  },
  requiredBannerText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
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
  footer: {
    paddingHorizontal: ScreenPadding,
    paddingBottom: Platform.OS === "ios" ? 24 : 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
  completeBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  completeBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
