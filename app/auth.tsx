import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors, ScreenPadding, Shadows } from "@/constants/theme";
import { loginUser, registerUser } from "@/lib/authStorage";
import { auth } from "@/lib/firebase";
import {
  loadHealthProfile,
  persistHealthProfile,
} from "@/lib/healthProfileStorage";
import { markOnboardingCompleted } from "@/lib/onboardingStatus";
import { sendPasswordResetEmail, signInAnonymously } from "firebase/auth";

export default function AuthScreen() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);

  const syncProfileToFirestore = async (uid: string) => {
    try {
      const healthProfile = await loadHealthProfile();
      await persistHealthProfile(healthProfile, uid);
      await markOnboardingCompleted(uid);
    } catch (e) {
      console.warn("Firestore profil sync hatası:", e);
    }
  };

  const onSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Hata", "E-posta ve şifre boş olamaz.");
      return;
    }
    if (isRegister && !displayName.trim()) {
      Alert.alert("Hata", "İsim boş olamaz.");
      return;
    }

    setLoading(true);
    try {
      if (isRegister) {
        await registerUser(email.trim(), password, displayName.trim());
      } else {
        await loginUser(email.trim(), password);
      }
      await syncProfileToFirestore(auth.currentUser!.uid);
    } catch (err: any) {
      const msg = firebaseErrorMessage(err.code);
      Alert.alert("Hata", msg);
    } finally {
      setLoading(false);
    }
  };

  const onForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert("Hata", "Şifre sıfırlamak için e-posta adresinizi girin.");
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      Alert.alert(
        "E-posta Gönderildi",
        "Şifre sıfırlama bağlantısı e-posta adresinize gönderildi."
      );
    } catch (err: any) {
      Alert.alert("Hata", firebaseErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  const onGuest = async () => {
    setLoading(true);
    try {
      await signInAnonymously(auth);
      await syncProfileToFirestore(auth.currentUser!.uid);
    } catch {
      Alert.alert("Hata", "Misafir girişi başarısız.");
    } finally {
      setLoading(false);
    }
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
          <Text style={styles.subtitle}>Sağlık rehberiniz için devam edin.</Text>
        </View>

        <View style={[styles.card, Shadows.card]}>
          {isRegister && (
            <TextInput
              style={styles.input}
              placeholder="Ad Soyad"
              value={displayName}
              onChangeText={setDisplayName}
              autoCapitalize="words"
              placeholderTextColor={Colors.textSecondary}
            />
          )}
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

          {!isRegister && (
            <Pressable
              style={styles.forgotBtn}
              onPress={() => void onForgotPassword()}
            >
              <Text style={styles.forgotBtnText}>Şifremi unuttum</Text>
            </Pressable>
          )}

          <Pressable
            style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
            onPress={() => void onSubmit()}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryBtnText}>
                {isRegister ? "Kayıt Ol" : "Giriş Yap"}
              </Text>
            )}
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

        <Pressable style={styles.guestBtn} onPress={() => void onGuest()}>
          <Text style={styles.guestBtnText}>Misafir olarak devam et</Text>
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Firebase hata kodlarını Türkçeye çevir
function firebaseErrorMessage(code: string): string {
  switch (code) {
    case "auth/email-already-in-use":
      return "Bu e-posta zaten kullanılıyor.";
    case "auth/invalid-email":
      return "Geçersiz e-posta adresi.";
    case "auth/weak-password":
      return "Şifre en az 6 karakter olmalı.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "E-posta veya şifre hatalı.";
    case "auth/too-many-requests":
      return "Çok fazla deneme. Lütfen bekleyin.";
    default:
      return "Bir hata oluştu. Tekrar deneyin.";
  }
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1, paddingHorizontal: ScreenPadding, justifyContent: "center" },
  header: { alignItems: "center", marginBottom: 24 },
  iconWrap: {
    width: 68, height: 68, borderRadius: 34,
    backgroundColor: "rgba(0,168,107,0.12)",
    alignItems: "center", justifyContent: "center", marginBottom: 14,
  },
  title: { fontSize: 28, fontWeight: "800", color: Colors.text },
  subtitle: { marginTop: 8, color: Colors.textSecondary, fontSize: 15 },
  card: {
    backgroundColor: Colors.card, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.border, padding: 16, gap: 12,
  },
  input: {
    height: 48, borderRadius: 12, borderWidth: 1,
    borderColor: Colors.border, backgroundColor: "#FFFFFF",
    paddingHorizontal: 14, color: Colors.text, fontSize: 15,
  },
  forgotBtn: {
    alignItems: "flex-end",
    paddingVertical: 2,
  },
  forgotBtnText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: "500",
  },
  primaryBtn: {
    height: 48, borderRadius: 12, backgroundColor: Colors.primary,
    alignItems: "center", justifyContent: "center",
  },
  primaryBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  secondaryBtn: { alignItems: "center", paddingVertical: 6 },
  secondaryBtnText: { color: Colors.primary, fontSize: 14, fontWeight: "600" },
  guestBtn: { marginTop: 20, alignItems: "center" },
  guestBtnText: {
    color: Colors.textSecondary, fontSize: 15,
    fontWeight: "600", textDecorationLine: "underline",
  },
});