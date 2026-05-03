import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ToastAndroid,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { Colors, Shadows, ScreenPadding } from "@/constants/theme";

const BLOG_GREEN = "#16a34a";

const CATEGORY_OPTIONS = ["Çölyak", "Diyabet", "Vegan", "Vejetaryen", "Glutensiz"] as const;

const MAX_REEL_DURATION_MS = 60_000;

type MediaKind = "image" | "video" | "reel";

type MediaItem = {
  id: string;
  uri: string;
  kind: MediaKind;
};

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function showPublishToastThenNavigate(router: ReturnType<typeof useRouter>) {
  if (Platform.OS === "android") {
    ToastAndroid.show("Tarif başarıyla paylaşıldı!", ToastAndroid.SHORT);
    router.back();
  } else {
    Alert.alert("Başarılı", "Tarif başarıyla paylaşıldı.", [
      { text: "Tamam", onPress: () => router.back() },
    ]);
  }
}

export default function NewBlogRecipeScreen() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [ingredients, setIngredients] = useState("");
  const [steps, setSteps] = useState("");
  const [notes, setNotes] = useState("");
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [busy, setBusy] = useState(false);

  const toggleCategory = (c: string) => {
    setSelectedCategories((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  };

  const ensureLibraryPermission = async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "İzin gerekli",
        "Medya eklemek için galeri erişimine izin vermeniz gerekir."
      );
      return false;
    }
    return true;
  };

  const pickPhotos = async () => {
    const ok = await ensureLibraryPermission();
    if (!ok) return;
    setBusy(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: true,
        quality: 0.85,
        selectionLimit: 12,
      });
      if (!result.canceled && result.assets?.length) {
        const next: MediaItem[] = result.assets.map((a) => ({
          id: uid(),
          uri: a.uri,
          kind: "image" as const,
        }));
        setMedia((m) => [...m, ...next]);
      }
    } finally {
      setBusy(false);
    }
  };

  const pickVideo = async () => {
    const ok = await ensureLibraryPermission();
    if (!ok) return;
    setBusy(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["videos"],
        allowsMultipleSelection: false,
        quality: 1,
      });
      if (!result.canceled && result.assets?.[0]) {
        const a = result.assets[0];
        setMedia((m) => [...m, { id: uid(), uri: a.uri, kind: "video" }]);
      }
    } finally {
      setBusy(false);
    }
  };

  const pickReel = async () => {
    const ok = await ensureLibraryPermission();
    if (!ok) return;
    setBusy(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["videos"],
        allowsMultipleSelection: false,
        quality: 1,
      });
      if (!result.canceled && result.assets?.[0]) {
        const a = result.assets[0];
        const dur = a.duration ?? 0;
        if (dur > 0 && dur > MAX_REEL_DURATION_MS) {
          Alert.alert(
            "Çok uzun",
            "Reels için video en fazla 60 saniye olmalıdır. Lütfen daha kısa bir klip seçin."
          );
          return;
        }
        setMedia((m) => [...m, { id: uid(), uri: a.uri, kind: "reel" }]);
      }
    } finally {
      setBusy(false);
    }
  };

  const removeMedia = (id: string) => {
    setMedia((m) => m.filter((x) => x.id !== id));
  };

  const submit = () => {
    const t = title.trim();
    if (!t) {
      Alert.alert("Eksik bilgi", "Lütfen tarif başlığı girin.");
      return;
    }
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    showPublishToastThenNavigate(router);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={[styles.topBar, Shadows.card]}>
          <Pressable onPress={() => router.back()} style={styles.iconBtn} hitSlop={8}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </Pressable>
          <Text style={styles.topTitle}>Yeni tarif</Text>
          <View style={styles.iconBtn} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.label}>Tarif başlığı</Text>
          <TextInput
            style={styles.input}
            placeholder="Örn: Glütensiz kinoa salatası"
            placeholderTextColor={Colors.textSecondary}
            value={title}
            onChangeText={setTitle}
          />

          <Text style={styles.label}>Kategoriler</Text>
          <Text style={styles.hint}>Birden fazla seçebilirsiniz.</Text>
          <View style={styles.chipWrap}>
            {CATEGORY_OPTIONS.map((c) => {
              const on = selectedCategories.includes(c);
              return (
                <Pressable
                  key={c}
                  style={[styles.chip, on && styles.chipOn]}
                  onPress={() => toggleCategory(c)}
                >
                  <Text style={[styles.chipText, on && styles.chipTextOn]}>{c}</Text>
                  {on ? (
                    <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                  ) : null}
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.label}>Malzemeler</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder={"Her satıra bir malzeme yazın.\nÖrn:\n2 su bardağı kinoa\n1 demet roka"}
            placeholderTextColor={Colors.textSecondary}
            value={ingredients}
            onChangeText={setIngredients}
            multiline
            textAlignVertical="top"
          />

          <Text style={styles.label}>Hazırlanış</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder={"Adım adım tarifi yazın.\n1. …\n2. …"}
            placeholderTextColor={Colors.textSecondary}
            value={steps}
            onChangeText={setSteps}
            multiline
            textAlignVertical="top"
          />

          <Text style={styles.label}>Açıklama / notlar</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="İpuçları, saklama önerileri veya beslenme notları…"
            placeholderTextColor={Colors.textSecondary}
            value={notes}
            onChangeText={setNotes}
            multiline
            textAlignVertical="top"
          />

          <Text style={styles.label}>Medya</Text>
          <View style={styles.mediaBtns}>
            <Pressable
              style={[styles.mediaBtn, busy && styles.mediaBtnDisabled]}
              onPress={() => void pickPhotos()}
              disabled={busy}
            >
              <Ionicons name="images-outline" size={22} color={BLOG_GREEN} />
              <Text style={styles.mediaBtnText}>Fotoğraf Ekle</Text>
            </Pressable>
            <Pressable
              style={[styles.mediaBtn, busy && styles.mediaBtnDisabled]}
              onPress={() => void pickVideo()}
              disabled={busy}
            >
              <Ionicons name="videocam-outline" size={22} color={BLOG_GREEN} />
              <Text style={styles.mediaBtnText}>Video Ekle</Text>
            </Pressable>
            <Pressable
              style={[styles.mediaBtn, busy && styles.mediaBtnDisabled]}
              onPress={() => void pickReel()}
              disabled={busy}
            >
              <Ionicons name="film-outline" size={22} color={BLOG_GREEN} />
              <Text style={styles.mediaBtnText}>Reels Ekle</Text>
            </Pressable>
          </View>
          <Text style={styles.reelHint}>Reels: en fazla 60 saniye.</Text>

          {busy ? (
            <ActivityIndicator style={{ marginVertical: 8 }} color={BLOG_GREEN} />
          ) : null}

          {media.length > 0 ? (
            <>
              <Text style={styles.previewLabel}>Seçilen medya</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.thumbRow}
              >
                {media.map((item) => (
                  <View key={item.id} style={styles.thumbWrap}>
                    {item.kind === "image" ? (
                      <Image source={{ uri: item.uri }} style={styles.thumb} contentFit="cover" />
                    ) : (
                      <View style={[styles.thumb, styles.thumbVideoPh]}>
                        <Ionicons name="play-circle" size={42} color="#FFFFFF" />
                      </View>
                    )}
                    <View style={[styles.kindBadge, item.kind === "reel" && styles.kindBadgeReel]}>
                      <Text style={styles.kindBadgeText}>
                        {item.kind === "image"
                          ? "Foto"
                          : item.kind === "reel"
                            ? "Reels"
                            : "Video"}
                      </Text>
                    </View>
                    <Pressable style={styles.thumbRemove} onPress={() => removeMedia(item.id)}>
                      <Ionicons name="close-circle" size={26} color="#FFFFFF" />
                    </Pressable>
                  </View>
                ))}
              </ScrollView>
            </>
          ) : null}

          <Pressable style={styles.submitBtn} onPress={submit}>
            <Text style={styles.submitBtnText}>Tarifi Paylaş</Text>
          </Pressable>
          <View style={{ height: 32 }} />
        </ScrollView>
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
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: ScreenPadding,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.background,
  },
  iconBtn: {
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: ScreenPadding,
    paddingTop: 16,
    paddingBottom: 24,
  },
  label: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 8,
    marginTop: 4,
  },
  hint: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 10,
    marginTop: -4,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text,
    backgroundColor: Colors.card,
    marginBottom: 14,
  },
  textArea: {
    minHeight: 120,
    paddingTop: 12,
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  chipOn: {
    backgroundColor: BLOG_GREEN,
    borderColor: BLOG_GREEN,
  },
  chipText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
  },
  chipTextOn: {
    color: "#FFFFFF",
  },
  mediaBtns: {
    gap: 10,
    marginBottom: 6,
  },
  mediaBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${BLOG_GREEN}55`,
    backgroundColor: `${BLOG_GREEN}10`,
  },
  mediaBtnDisabled: {
    opacity: 0.55,
  },
  mediaBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
  },
  reelHint: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  previewLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text,
    marginTop: 8,
    marginBottom: 10,
  },
  thumbRow: {
    gap: 12,
    paddingVertical: 4,
    marginBottom: 20,
  },
  thumbWrap: {
    width: 96,
    height: 96,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  thumb: {
    width: "100%",
    height: "100%",
  },
  thumbVideoPh: {
    backgroundColor: "#1f2937",
    alignItems: "center",
    justifyContent: "center",
  },
  kindBadge: {
    position: "absolute",
    left: 6,
    bottom: 6,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  kindBadgeReel: {
    backgroundColor: `${BLOG_GREEN}dd`,
  },
  kindBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  thumbRemove: {
    position: "absolute",
    top: 4,
    right: 4,
  },
  submitBtn: {
    backgroundColor: BLOG_GREEN,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 8,
    ...Platform.select({
      ios: {
        shadowColor: BLOG_GREEN,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.28,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
    }),
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
  },
});
