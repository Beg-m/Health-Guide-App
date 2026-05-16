import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Video, ResizeMode } from "expo-av";
import { WebView } from "react-native-webview";
import { Colors, Shadows, ScreenPadding } from "@/constants/theme";
import { KEY_IS_PREMIUM } from "@/constants/premium";
import {
  getRecipeById,
  getSeedCommentsForRecipe,
  type RecipeComment,
  type RecipePost,
} from "@/constants/recipesBlog";
import {
  addFavoriteRecipeFirestore,
  deleteRecipe,
  fetchFavoriteRecipeIdsFromFirestore,
  getRecipeFromFirestore,
  removeFavoriteRecipeFirestore,
} from "@/lib/firestore";
import {
  mergeFavoriteIdLists,
  readFavoriteIdsFromStorage,
  writeFavoriteIdsToStorage,
} from "@/lib/favoriteRecipes";
import { getLocalRecipeCache, removeLocalRecipeCache } from "@/lib/recipeLocalCache";
import { getOrCreateLocalUserId, removeMyRecipeId } from "@/lib/recipeOwnership";
import { PremiumRequiredModal } from "@/components/PremiumRequiredModal";
import { auth } from "@/lib/firebase";

const BLOG_GREEN = "#16a34a";

export default function BlogRecipeDetailScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [recipe, setRecipe] = useState<RecipePost | undefined | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const recipeIdParam = typeof id === "string" ? id : "";
  const [favoriteRecipeIds, setFavoriteRecipeIds] = useState<string[]>([]);
  const detailFavorited =
    recipeIdParam.length > 0 && favoriteRecipeIds.includes(recipeIdParam);

  useEffect(() => {
    if (typeof id !== "string" || !id) {
      setRecipe(undefined);
      return;
    }
    let cancelled = false;
    setRecipe(null);
    void (async () => {
      const fromFs = await getRecipeFromFirestore(id);
      const cache = await getLocalRecipeCache(id);
      if (cancelled) return;
      if (fromFs) {
        if (cache?.imageUri?.trim() && !fromFs.imageUri?.trim()) {
          setRecipe({ ...fromFs, imageUri: cache.imageUri.trim() });
        } else {
          setRecipe(fromFs);
        }
        return;
      }
      setRecipe(getRecipeById(id));
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    const firebaseUser = auth.currentUser;
    if (!recipe || !firebaseUser) {
      setIsOwner(false);
      return;
    }
    setIsOwner(recipe.createdBy === firebaseUser.uid);
  }, [recipe]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      void (async () => {
        try {
          const userId = await getOrCreateLocalUserId();
          const [fromStorage, fromFirestore] = await Promise.all([
            readFavoriteIdsFromStorage(),
            fetchFavoriteRecipeIdsFromFirestore(userId).catch(() => [] as string[]),
          ]);
          const merged = mergeFavoriteIdLists(fromStorage, fromFirestore);
          if (cancelled) return;
          setFavoriteRecipeIds(merged);
          const storageKey = JSON.stringify([...fromStorage].sort());
          const mergedKey = JSON.stringify([...merged].sort());
          if (storageKey !== mergedKey) {
            await writeFavoriteIdsToStorage(merged);
          }
        } catch {
          if (!cancelled) {
            const localOnly = await readFavoriteIdsFromStorage();
            setFavoriteRecipeIds(localOnly);
          }
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [])
  );

  const confirmDelete = useCallback(() => {
    if (typeof id !== "string") return;
    Alert.alert("Tarifi Sil", "Bu tarifi silmek istediğinize emin misiniz?", [
      { text: "İptal", style: "cancel" },
      {
        text: "Sil",
        style: "destructive",
        onPress: () => {
          void (async () => {
            try {
              await deleteRecipe(id);
              await removeMyRecipeId(id);
              await removeLocalRecipeCache(id);
              router.back();
            } catch (e) {
              Alert.alert("Silinemedi", e instanceof Error ? e.message : String(e));
            }
          })();
        },
      },
    ]);
  }, [id, router]);

  const showMenu = useCallback(() => {
    if (!recipe) return;
    Alert.alert("", "", [
      {
        text: "Düzenle",
        onPress: () =>
          router.push({
            pathname: "/blog-post/edit/[id]",
            params: { id: recipe.id },
          }),
      },
      { text: "Sil", style: "destructive", onPress: confirmDelete },
      { text: "İptal", style: "cancel" },
    ]);
  }, [recipe, router, confirmDelete]);

  const toggleFavoriteDetail = useCallback(async () => {
    if (!recipeIdParam) return;
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const userId = await getOrCreateLocalUserId();
    setFavoriteRecipeIds((prev) => {
      const had = prev.includes(recipeIdParam);
      const next = had
        ? prev.filter((x) => x !== recipeIdParam)
        : [...prev, recipeIdParam];
      void writeFavoriteIdsToStorage(next);
      void (async () => {
        try {
          if (had) {
            await removeFavoriteRecipeFirestore(userId, recipeIdParam);
          } else {
            await addFavoriteRecipeFirestore(userId, recipeIdParam);
          }
        } catch {
          /* yerel kayıt geçerli */
        }
      })();
      return next;
    });
  }, [recipeIdParam]);

  useLayoutEffect(() => {
    if (recipe === null || !recipe) {
      navigation.setOptions({ headerShown: false });
      return;
    }
    navigation.setOptions({
      headerShown: true,
      title: "Tarif",
      headerStyle: { backgroundColor: Colors.background },
      headerTintColor: Colors.text,
      headerShadowVisible: true,
      headerRight: () => (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            marginRight: Platform.OS === "ios" ? 0 : 4,
          }}
        >
          <TouchableOpacity
            onPress={() => void toggleFavoriteDetail()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel={
              detailFavorited ? "Favorilerden çıkar" : "Favorilere ekle"
            }
          >
            <Ionicons
              name={detailFavorited ? "bookmark" : "bookmark-outline"}
              size={24}
              color="#16a34a"
            />
          </TouchableOpacity>
          {isOwner ? (
            <TouchableOpacity
              onPress={showMenu}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityRole="button"
              accessibilityLabel="Tarif menüsü"
            >
              <Ionicons name="ellipsis-horizontal" size={24} color="#16a34a" />
            </TouchableOpacity>
          ) : null}
        </View>
      ),
    });
  }, [
    navigation,
    recipe,
    isOwner,
    showMenu,
    detailFavorited,
    toggleFavoriteDetail,
  ]);

  const [liked, setLiked] = useState(false);
  const [commentText, setCommentText] = useState("");
  const isLoggedIn = !!auth.currentUser;
  const [isPremium, setIsPremium] = useState(false);
  const [premiumModalVisible, setPremiumModalVisible] = useState(false);
  const [comments, setComments] = useState<RecipeComment[]>([]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const load = async () => {
        const premium = await AsyncStorage.getItem(KEY_IS_PREMIUM);
        if (!cancelled) {
          setIsPremium(premium === "true");
        }
      };
      void load();
      return () => {
        cancelled = true;
      };
    }, [])
  );

  useFocusEffect(
    useCallback(() => {
      if (recipe) {
        setComments(getSeedCommentsForRecipe(recipe.id));
        setCommentText("");
      }
    }, [recipe?.id])
  );

  const likeCount = useMemo(() => {
    if (!recipe) return 0;
    return recipe.likes + (liked ? 1 : 0);
  }, [recipe, liked]);

  const onToggleLike = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setLiked((v) => !v);
  };

  const onSubmitComment = () => {
    if (!recipe || !isLoggedIn) return;
    if (!isPremium) {
      setPremiumModalVisible(true);
      return;
    }
    const trimmed = commentText.trim();
    if (!trimmed) return;
    const newComment: RecipeComment = {
      id: `local-${Date.now()}`,
      author: "Siz",
      body: trimmed,
      timeLabel: "Şimdi",
    };
    setComments((prev) => [newComment, ...prev]);
    setCommentText("");
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  if (recipe === null) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={[styles.errorBox, { justifyContent: "center", flex: 1 }]}>
          <Text style={styles.errorText}>Yükleniyor…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!recipe) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>Tarif bulunamadı.</Text>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.errorLink}>Geri dön</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {recipe.imageUri ? (
            <Image
              source={{ uri: recipe.imageUri }}
              style={{ width: "100%", height: 250 }}
              resizeMode="cover"
            />
          ) : null}

          {recipe.videoUri ? (
            <Video
              source={{ uri: recipe.videoUri }}
              style={{ width: "100%", height: 250 }}
              useNativeControls
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay={false}
            />
          ) : null}

          {recipe.videoEmbedUrl ? (
            <View style={styles.videoWrap}>
              <Text style={styles.videoLabel}>Video</Text>
              <WebView
                source={{ uri: recipe.videoEmbedUrl }}
                style={styles.webview}
                allowsFullscreenVideo
                allowsInlineMediaPlayback
                mediaPlaybackRequiresUserAction={Platform.OS === "android"}
                javaScriptEnabled
                domStorageEnabled
              />
            </View>
          ) : null}

          <Text style={styles.title}>{recipe.title}</Text>
          <Text style={styles.author}>{recipe.author}</Text>

          <Pressable
            style={styles.authorRow}
            onPress={() => {
              if (recipe.createdBy) {
                router.push(`/user-profile/${recipe.createdBy}` as any);
              }
            }}
          >
            <View style={styles.authorAvatar}>
              <Text style={styles.authorAvatarText}>
                {recipe.author.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View>
              <Text style={styles.authorName}>{recipe.author}</Text>
              <Text style={styles.authorSub}>Tarif sahibi</Text>
            </View>
          </Pressable>

          <View style={styles.metaRow}>
            {recipe.prepMinutes > 0 && (
              <View style={styles.metaChip}>
                <Ionicons name="time-outline" size={18} color={BLOG_GREEN} />
                <Text style={styles.metaText}>{recipe.prepMinutes} dk hazırlık</Text>
              </View>
            )}
            {(recipe as any).cookMinutes > 0 && (
              <View style={styles.metaChip}>
                <Ionicons name="flame-outline" size={18} color={BLOG_GREEN} />
                <Text style={styles.metaText}>{(recipe as any).cookMinutes} dk pişirme</Text>
              </View>
            )}
            {(recipe as any).servings > 0 && (
              <View style={styles.metaChip}>
                <Ionicons name="people-outline" size={18} color={BLOG_GREEN} />
                <Text style={styles.metaText}>{(recipe as any).servings} kişilik</Text>
              </View>
            )}
          </View>

          <View style={styles.tagsRow}>
            {recipe.tags.map((tag) => (
              <View key={tag} style={[styles.tag, { backgroundColor: `${BLOG_GREEN}22` }]}>
                <Text style={[styles.tagText, { color: BLOG_GREEN }]}>{tag}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Malzemeler</Text>
          {recipe.ingredients.map((line, i) => (
            <View key={i} style={styles.bulletRow}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.body}>{line}</Text>
            </View>
          ))}

          <Text style={styles.sectionTitle}>Hazırlanış</Text>
          {recipe.steps.map((line, i) => (
            <View key={i} style={styles.stepRow}>
              <Text style={styles.stepNum}>{i + 1}.</Text>
              <Text style={styles.body}>{line}</Text>
            </View>
          ))}

          <View style={styles.likeRow}>
            <Pressable
              style={styles.likeBtn}
              onPress={onToggleLike}
              accessibilityRole="button"
              accessibilityLabel={liked ? "Beğeniyi kaldır" : "Beğen"}
            >
              <Ionicons
                name={liked ? "heart" : "heart-outline"}
                size={26}
                color={liked ? BLOG_GREEN : Colors.textSecondary}
              />
              <Text style={[styles.likeCount, liked && { color: BLOG_GREEN }]}>
                {likeCount} beğeni
              </Text>
            </Pressable>
          </View>

          <Text style={styles.sectionTitle}>Yorumlar ({comments.length})</Text>
          {comments.length === 0 ? (
            <Text style={styles.emptyComments}>Henüz yorum yok. İlk yorumu siz yazın.</Text>
          ) : (
            comments.map((c) => (
              <View key={c.id} style={styles.commentCard}>
                <View style={styles.commentHeader}>
                  <Text style={styles.commentAuthor}>{c.author}</Text>
                  <Text style={styles.commentTime}>{c.timeLabel}</Text>
                </View>
                <Text style={styles.commentBody}>{c.body}</Text>
              </View>
            ))
          )}
        </ScrollView>

        <View
          style={[
            styles.commentFooter,
            Shadows.card,
            { paddingBottom: Math.max(12, insets.bottom) },
          ]}
        >
          {isLoggedIn && isPremium ? (
            <>
              <TextInput
                style={styles.commentInput}
                placeholder="Yorumunuzu yazın..."
                placeholderTextColor={Colors.textSecondary}
                value={commentText}
                onChangeText={setCommentText}
                multiline
                maxLength={500}
              />
              <Pressable
                style={[styles.sendBtn, !commentText.trim() && styles.sendBtnDisabled]}
                onPress={onSubmitComment}
                disabled={!commentText.trim()}
              >
                <Text style={styles.sendBtnText}>Gönder</Text>
              </Pressable>
            </>
          ) : isLoggedIn && !isPremium ? (
            <Pressable
              style={styles.premiumCommentGate}
              onPress={() => setPremiumModalVisible(true)}
              accessibilityRole="button"
              accessibilityLabel="Premium ile yorum yaz"
            >
              <View style={styles.premiumLockCircle}>
                <Ionicons name="lock-closed" size={22} color={Colors.primary} />
              </View>
              <View style={styles.loginGateText}>
                <Text style={styles.loginGateTitle}>Yorum yazmak Premium üyelere özeldir</Text>
                <Text style={styles.loginGateSub}>
                  Bu özelliği açmak için dokunun veya Premium&apos;a geçin.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color={Colors.textSecondary} />
            </Pressable>
          ) : (
            <View style={styles.loginGate}>
              <Ionicons name="chatbubble-ellipses-outline" size={22} color={BLOG_GREEN} />
              <View style={styles.loginGateText}>
                <Text style={styles.loginGateTitle}>Yorum yapmak için giriş yapın</Text>
                <Text style={styles.loginGateSub}>Hesabınızla paylaşım yapabilirsiniz.</Text>
              </View>
              <Pressable style={styles.loginGateBtn} onPress={() => router.push("/auth")}>
                <Text style={styles.loginGateBtnText}>Giriş</Text>
              </Pressable>
            </View>
          )}
        </View>

        <PremiumRequiredModal
          visible={premiumModalVisible}
          onClose={() => setPremiumModalVisible(false)}
          onPremiumPress={() => {
            setPremiumModalVisible(false);
            router.push("/reminders");
          }}
        />
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
  scroll: {
    paddingBottom: 24,
  },
  videoWrap: {
    marginBottom: 16,
    paddingHorizontal: ScreenPadding,
    marginTop: 16,
  },
  videoLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 8,
  },
  webview: {
    width: "100%",
    height: 220,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.text,
    paddingHorizontal: ScreenPadding,
    marginTop: 16,
  },
  author: {
    marginTop: 6,
    fontSize: 15,
    color: Colors.textSecondary,
    paddingHorizontal: ScreenPadding,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: ScreenPadding,
    marginTop: 12,
    marginBottom: 4,
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${BLOG_GREEN}20`,
    borderWidth: 1,
    borderColor: `${BLOG_GREEN}40`,
    alignItems: "center",
    justifyContent: "center",
  },
  authorAvatarText: {
    fontSize: 16,
    fontWeight: "800",
    color: BLOG_GREEN,
  },
  authorName: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
  },
  authorSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  metaRow: {
    flexDirection: "row",
    paddingHorizontal: ScreenPadding,
    marginTop: 12,
    gap: 10,
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.card,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  metaText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: ScreenPadding,
    marginTop: 14,
    marginBottom: 8,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  tagText: {
    fontSize: 12,
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
    paddingHorizontal: ScreenPadding,
    marginTop: 20,
    marginBottom: 8,
  },
  body: {
    fontSize: 15,
    lineHeight: 24,
    color: Colors.text,
    paddingHorizontal: ScreenPadding,
  },
  bulletRow: {
    flexDirection: "row",
    paddingHorizontal: ScreenPadding,
    gap: 8,
    marginBottom: 6,
  },
  bullet: {
    fontSize: 15,
    color: BLOG_GREEN,
    fontWeight: "700",
    width: 14,
  },
  stepRow: {
    flexDirection: "row",
    paddingHorizontal: ScreenPadding,
    gap: 8,
    marginBottom: 10,
  },
  stepNum: {
    fontSize: 15,
    fontWeight: "700",
    color: BLOG_GREEN,
    minWidth: 22,
  },
  likeRow: {
    paddingHorizontal: ScreenPadding,
    marginTop: 24,
    marginBottom: 8,
  },
  likeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  likeCount: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.text,
  },
  emptyComments: {
    fontSize: 14,
    color: Colors.textSecondary,
    paddingHorizontal: ScreenPadding,
    marginBottom: 12,
    fontStyle: "italic",
  },
  commentCard: {
    marginHorizontal: ScreenPadding,
    marginBottom: 12,
    padding: 14,
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  commentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  commentAuthor: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
  },
  commentTime: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  commentBody: {
    fontSize: 15,
    lineHeight: 22,
    color: Colors.text,
  },
  commentFooter: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
    paddingHorizontal: ScreenPadding,
    paddingVertical: 12,
    gap: 10,
  },
  commentInput: {
    minHeight: 44,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.text,
    backgroundColor: Colors.card,
  },
  sendBtn: {
    alignSelf: "flex-end",
    backgroundColor: BLOG_GREEN,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  sendBtnDisabled: {
    opacity: 0.45,
  },
  sendBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  loginGate: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
  },
  loginGateText: {
    flex: 1,
  },
  loginGateTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text,
  },
  loginGateSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  loginGateBtn: {
    backgroundColor: BLOG_GREEN,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  loginGateBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  premiumCommentGate: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  premiumLockCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0, 168, 107, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  errorBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: ScreenPadding,
  },
  errorText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  errorLink: {
    fontSize: 16,
    fontWeight: "600",
    color: BLOG_GREEN,
  },
});
