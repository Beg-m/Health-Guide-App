import { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Video, ResizeMode } from "expo-av";
import { Colors, ScreenPadding } from "@/constants/theme";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { takePendingStoryDraft } from "@/lib/pendingStoryDraft";
import {
  publishStoryFromLocalUri,
  type StoryMediaType,
} from "@/lib/storiesStorage";

const CAPTION_MAX = 1000;

function paramStr(v: string | string[] | undefined): string {
  if (v == null) return "";
  const s = Array.isArray(v) ? v[0] : v;
  return typeof s === "string" ? s : "";
}

function uploadErrorMessage(err: unknown): string {
  const code =
    err && typeof err === "object" && "code" in err
      ? String((err as { code: string }).code)
      : "";
  const message =
    err && typeof err === "object" && "message" in err
      ? String((err as { message: string }).message)
      : "";

  if (message.includes("Dosya")) {
    return message;
  }
  if (code.includes("storage/unauthorized") || code.includes("permission")) {
    return (
      "Firebase Storage izni yok.\n\n" +
      "Console → Storage → Rules bölümünde storage.rules dosyasını yayınlayın " +
      "(npm run firebase:deploy-rules)."
    );
  }
  if (code.includes("storage")) {
    return (
      "Fotoğraf yüklenemedi.\n\n" +
      "Uygulama otomatik yedek modu denemeli; hata sürüyorsa Expo'yu yenileyin (r).\n" +
      "Kalıcı çözüm: Firebase Console → Storage → Get started"
    );
  }
  if (code.includes("firestore/permission")) {
    return (
      "Firestore izni yok.\n\n" +
      "Console → Firestore → Rules bölümünde firestore.rules dosyasını yayınlayın."
    );
  }
  return "Hikaye yüklenemedi. Lütfen tekrar deneyin.";
}

export default function StoryCaptionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    mediaUri?: string;
    mediaType?: string;
  }>();

  const { mediaUri, mediaType, mimeType } = useMemo(() => {
    const draft = takePendingStoryDraft();
    const typeParam = draft?.mediaType ?? paramStr(params.mediaType);
    return {
      mediaUri: draft?.uri ?? paramStr(params.mediaUri),
      mediaType: (typeParam === "video" ? "video" : "photo") as StoryMediaType,
      mimeType: draft?.mimeType,
    };
  }, [params.mediaType, params.mediaUri]);

  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);

  /** maxLength on TextInput breaks paste on iOS/Android; enforce limit in JS instead. */
  const handleCaptionChange = useCallback((text: string) => {
    setCaption(text.length > CAPTION_MAX ? text.slice(0, CAPTION_MAX) : text);
  }, []);

  useEffect(() => {
    if (!mediaUri) {
      router.back();
    }
  }, [mediaUri, router]);

  const onCancel = () => {
    if (uploading) return;
    router.back();
  };

  const onPublish = async () => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser || !mediaUri) return;

    setUploading(true);
    try {
      const userSnap = await getDoc(doc(db, "users", firebaseUser.uid));
      const userData = userSnap.exists() ? userSnap.data() : {};
      await publishStoryFromLocalUri(
        mediaUri,
        mediaType,
        caption,
        {
          displayName: String(
            userData.displayName ?? firebaseUser.displayName ?? "Kullanıcı"
          ),
          photoURL:
            typeof userData.photoURL === "string" ? userData.photoURL : undefined,
        },
        mimeType
      );
      router.back();
    } catch (e) {
      const err = e as { code?: string; message?: string; serverResponse?: string };
      console.warn("[Story] Yükleme hatası:", err?.code, err?.message, err?.serverResponse ?? e);
      Alert.alert("Hata", uploadErrorMessage(e));
    } finally {
      setUploading(false);
    }
  };

  if (!mediaUri) {
    return null;
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <Pressable
            onPress={onCancel}
            hitSlop={10}
            disabled={uploading}
            style={styles.headerBtn}
          >
            <Text style={styles.cancelText}>İptal</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Açıklama Ekle</Text>
          <Pressable
            onPress={() => void onPublish()}
            hitSlop={10}
            disabled={uploading}
            style={styles.headerBtn}
          >
            {uploading ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Text style={styles.publishText}>Paylaş</Text>
            )}
          </Pressable>
        </View>

        <View style={styles.thumbnailWrap}>
          {mediaType === "video" ? (
            <Video
              source={{ uri: mediaUri }}
              style={styles.thumbnail}
              resizeMode={ResizeMode.COVER}
              shouldPlay={false}
              isMuted
            />
          ) : (
            <Image source={{ uri: mediaUri }} style={styles.thumbnail} contentFit="cover" />
          )}
          <View style={styles.thumbnailBadge}>
            <Ionicons
              name={mediaType === "video" ? "videocam" : "image"}
              size={14}
              color="#FFFFFF"
            />
          </View>
        </View>

        <View style={styles.inputSection}>
          <TextInput
            multiline
            scrollEnabled
            value={caption}
            onChangeText={handleCaptionChange}
            placeholder="Hikayene bir açıklama yaz..."
            placeholderTextColor={Colors.textSecondary}
            editable={!uploading}
            textAlignVertical="top"
            autoCorrect
            style={styles.captionInput}
          />
          <Text style={styles.charCount}>
            {caption.length}/{CAPTION_MAX}
          </Text>
        </View>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: ScreenPadding,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerBtn: {
    minWidth: 64,
    alignItems: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "700",
    color: Colors.text,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  publishText: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.primary,
  },
  thumbnailWrap: {
    alignSelf: "center",
    marginTop: 20,
    marginBottom: 20,
    width: 120,
    height: 160,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: Colors.border,
  },
  thumbnail: {
    width: "100%",
    height: "100%",
  },
  thumbnailBadge: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 8,
    padding: 4,
  },
  inputSection: {
    flex: 1,
    paddingHorizontal: ScreenPadding,
    paddingBottom: 16,
  },
  captionInput: {
    minHeight: 200,
    maxHeight: 320,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    lineHeight: 22,
    color: Colors.text,
  },
  charCount: {
    textAlign: "right",
    color: "gray",
    fontSize: 12,
    marginTop: 4,
  },
});
