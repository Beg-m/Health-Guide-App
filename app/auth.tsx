import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, ScreenPadding, Shadows } from "@/constants/theme";

const KEY_IS_LOGGED_IN = "isLoggedIn";

export default function AuthScreen() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const completeAuth = async () => {
    await AsyncStorage.setItem(KEY_IS_LOGGED_IN, "true");
    router.replace("/(tabs)");
  };

  const onSubmit = async () => {
    if (!email.trim() || !password.trim()) return;
    await completeAuth();
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <View style={styles.header}>
          <View style={styles.iconWrap}>
            <Ionicons name="shield-checkmark" size={28} color={Colors.primary} />
          </View>
          <Text style={styles.title}>
            {isRegister ? "Hesap Oluştur" : "Giriş Yap"}
          </Text>
          <Text style={styles.subtitle}>
            Sağlık rehberiniz için devam edin.
          </Text>
        </View>

        <View style={[styles.card, Shadows.card]}>
          <TextInput
            style={styles.input}
            placeholder="E-posta"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholderTextColor={Colors.textSecondary}
          />
          <TextInput
            style={styles.input}
            placeholder="Şifre"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholderTextColor={Colors.textSecondary}
          />

          <Pressable style={styles.primaryBtn} onPress={() => void onSubmit()}>
            <Text style={styles.primaryBtnText}>
              {isRegister ? "Kayıt Ol" : "Giriş Yap"}
            </Text>
          </Pressable>

          <Pressable
            style={styles.secondaryBtn}
            onPress={() => setIsRegister((v) => !v)}
          >
            <Text style={styles.secondaryBtnText}>
              {isRegister
                ? "Zaten hesabım var, giriş yap"
                : "Hesabın yok mu? Kayıt ol"}
            </Text>
          </Pressable>
        </View>

        <Pressable style={styles.guestBtn} onPress={() => void completeAuth()}>
          <Text style={styles.guestBtnText}>Misafir olarak devam et</Text>
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
    paddingHorizontal: ScreenPadding,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  iconWrap: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "rgba(0,168,107,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: Colors.text,
  },
  subtitle: {
    marginTop: 8,
    color: Colors.textSecondary,
    fontSize: 15,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    gap: 12,
  },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    color: Colors.text,
    fontSize: 15,
  },
  primaryBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryBtn: {
    alignItems: "center",
    paddingVertical: 6,
  },
  secondaryBtnText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: "600",
  },
  guestBtn: {
    marginTop: 20,
    alignItems: "center",
  },
  guestBtnText: {
    color: Colors.textSecondary,
    fontSize: 15,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});
