import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
  Animated,
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import {
  Colors,
  Gradients,
  Radii,
  Shadows,
  ScreenPadding,
  getRecipeTagStyle,
  headerTitleStyle,
} from "@/constants/theme";
import { SAMPLE_STORY_REELS } from "@/constants/blogStories";
import type { RecipePost } from "@/constants/recipesBlog";
import { displayImageUri } from "@/lib/displayImageUri";
import { PremiumRequiredModal } from "@/components/PremiumRequiredModal";
import { BlogStoryReelsStrip } from "@/components/BlogStoryReels";
import { FadeInView } from "@/components/FadeInView";
import { PressableScale } from "@/components/PressableScale";
import { auth, db } from "@/lib/firebase";
import { collection, doc, getDoc, getDocs, updateDoc } from "firebase/firestore";
import { followUser } from "@/lib/followStorage";
import {
  addFavoriteRecipeFirestore,
  fetchFavoriteRecipeIdsFromFirestore,
  removeFavoriteRecipeFirestore,
  subscribeRecipes,
} from "@/lib/firestore";
import {
  readFavoriteIdsFromStorage,
  writeFavoriteIdsToStorage,
} from "@/lib/favoriteRecipes";
import { Video, ResizeMode } from "expo-av";

const BLOG_GREEN = "#16a34a";

const IS_PREMIUM_USER = true;

type BlogFeedFilter = "all" | "favorites";

export default function BlogScreen() {
  const router = useRouter();
  const [likedIds, setLikedIds] = useState<Record<string, boolean>>({});
  const [premiumModalVisible, setPremiumModalVisible] = useState(false);
  const [recipes, setRecipes] = useState<RecipePost[]>([]);
  const [followedIds, setFollowedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [favoriteRecipeIds, setFavoriteRecipeIds] = useState<string[]>([]);
  const [feedFilter, setFeedFilter] = useState<BlogFeedFilter>("all");

  const storyFeed = useMemo(() => SAMPLE_STORY_REELS, []);

  const favoriteIdSet = useMemo(
    () => new Set(favoriteRecipeIds),
    [favoriteRecipeIds]
  );

  const displayedRecipes = useMemo(() => {
    if (feedFilter === "favorites") {
      return recipes.filter((r) => favoriteIdSet.has(r.id));
    }
    return recipes;
  }, [recipes, feedFilter, favoriteIdSet]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      void (async () => {
        const firebaseUser = auth.currentUser;
        if (!firebaseUser) return;
        const userId = firebaseUser.uid;
        try {
          const fromFirestore = await fetchFavoriteRecipeIdsFromFirestore(userId)
            .catch(() => [] as string[]);
          if (!cancelled) {
            setFavoriteRecipeIds(fromFirestore);
            await writeFavoriteIdsToStorage(fromFirestore);
          }
          try {
            const snap = await getDocs(
              collection(db, "users", firebaseUser.uid, "following")
            );
            if (!cancelled) {
              setFollowedIds(snap.docs.map((d) => d.id));
            }
          } catch {}
        } catch {
          if (!cancelled) {
            const local = await readFavoriteIdsFromStorage();
            setFavoriteRecipeIds(local);
          }
        }
      })();
      return () => { cancelled = true; };
    }, [])
  );

  useEffect(() => {
    setLoading(true);
    setLoadError(null);
    const unsub = subscribeRecipes(
      (list) => {
        setRecipes(list);
        setLoading(false);
        setLoadError(null);
      },
      (err) => {
        setLoadError(err.message);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser || recipes.length === 0) return;

    const fixAuthors = async () => {
      try {
        const snap = await getDoc(doc(db, "users", firebaseUser.uid));
        const displayName = snap.exists() ? snap.data().displayName : null;
        if (!displayName) return;

        const toFix = recipes.filter(
          (r) =>
            r.createdBy === firebaseUser.uid &&
            (r.author === "Health Guide Kullanıcı" || !r.author)
        );

        await Promise.all(
          toFix.map((r) =>
            updateDoc(doc(db, "recipes", r.id), { author: displayName })
          )
        );
      } catch {}
    };

    void fixAuthors();
  }, [recipes]);

  const onToggleLike = (recipeId: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setLikedIds((prev) => ({
      ...prev,
      [recipeId]: !prev[recipeId],
    }));
  };

  const onCommentPress = (id: string) => {
    router.push(`/blog-post/${id}`);
  };

  const openDetail = (id: string) => {
    router.push(`/blog-post/${id}`);
  };

  const openCreate = () => {
    if (IS_PREMIUM_USER) {
      router.push("/blog-post/new");
    } else {
      setPremiumModalVisible(true);
    }
  };

  const goPremium = () => {
    setPremiumModalVisible(false);
    router.push("/reminders");
  };

  const toggleFavoriteRecipe = useCallback(async (recipeId: string) => {
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) return;
    const userId = firebaseUser.uid;

    setFavoriteRecipeIds((prev) => {
      const had = prev.includes(recipeId);
      const next = had
        ? prev.filter((id) => id !== recipeId)
        : [...prev, recipeId];
      void writeFavoriteIdsToStorage(next);
      void (async () => {
        try {
          if (had) {
            await removeFavoriteRecipeFirestore(userId, recipeId);
          } else {
            await addFavoriteRecipeFirestore(userId, recipeId);
          }
        } catch {}
      })();
      return next;
    });
  }, []);

  const handleCameraPress = useCallback(() => {
    if (Platform.OS === "web") {
      Alert.alert(
        "Bilgi",
        "Kamera ve galeri bu ortamda sınırlı olabilir. Lütfen mobil uygulamayı kullanın."
      );
      return;
    }

    Alert.alert("İçerik Ekle", "Nasıl eklemek istersiniz?", [
      {
        text: "📸 Kamera - Fotoğraf",
        onPress: () => {
          void (async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== "granted") {
              Alert.alert("İzin Gerekli", "Kamera izni gerekiyor.");
              return;
            }
            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              quality: 0.8,
            });
            if (!result.canceled && result.assets[0]) {
              router.push({
                pathname: "/blog-post/new",
                params: {
                  prefilledMedia: result.assets[0].uri,
                  mediaType: "image",
                },
              });
            }
          })();
        },
      },
      {
        text: "🎬 Kamera - Video",
        onPress: () => {
          void (async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== "granted") {
              Alert.alert("İzin Gerekli", "Kamera izni gerekiyor.");
              return;
            }
            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Videos,
              videoMaxDuration: 60,
            });
            if (!result.canceled && result.assets[0]) {
              router.push({
                pathname: "/blog-post/new",
                params: {
                  prefilledMedia: result.assets[0].uri,
                  mediaType: "video",
                },
              });
            }
          })();
        },
      },
      {
        text: "🖼️ Galeri - Fotoğraf",
        onPress: () => {
          void (async () => {
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              quality: 0.8,
            });
            if (!result.canceled && result.assets[0]) {
              router.push({
                pathname: "/blog-post/new",
                params: {
                  prefilledMedia: result.assets[0].uri,
                  mediaType: "image",
                },
              });
            }
          })();
        },
      },
      {
        text: "🎥 Galeri - Video",
        onPress: () => {
          void (async () => {
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Videos,
            });
            if (!result.canceled && result.assets[0]) {
              router.push({
                pathname: "/blog-post/new",
                params: {
                  prefilledMedia: result.assets[0].uri,
                  mediaType: "video",
                },
              });
            }
          })();
        },
      },
      { text: "İptal", style: "cancel" },
    ]);
  }, [router]);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <FadeInView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <BlogStoryReelsStrip
            stories={storyFeed}
            onCameraPress={handleCameraPress}
            onAddStoryPress={handleCameraPress}
          />

          <View style={styles.header}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <View>
                <Text style={styles.title}>Sağlıklı Tarifler</Text>
                <Text style={styles.subtitle}>Topluluğumuzdan tarifler ve ipuçları</Text>
              </View>
              <Pressable style={styles.reelsBtn} onPress={() => router.push("/reels")}>
                <LinearGradient
                  colors={["#ff6b35", "#f72585", "#7209b7"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.reelsBtnGradient}
                >
                  <Ionicons name="play-circle" size={18} color="#fff" />
                  <Text style={styles.reelsBtnText}>Reels</Text>
                  <View style={styles.reelsBtnLive}>
                    <Text style={styles.reelsBtnLiveText}>YENİ</Text>
                  </View>
                </LinearGradient>
              </Pressable>
            </View>
            <View style={styles.feedFilterRow}>
              <Pressable
                onPress={() => setFeedFilter("all")}
                style={[
                  styles.feedFilterPill,
                  feedFilter === "all" && styles.feedFilterPillActive,
                ]}
              >
                <Text
                  style={[
                    styles.feedFilterPillText,
                    feedFilter === "all" && styles.feedFilterPillTextActive,
                  ]}
                >
                  Tümü
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setFeedFilter("favorites")}
                style={[
                  styles.feedFilterPill,
                  feedFilter === "favorites" && styles.feedFilterPillActive,
                ]}
              >
                <Text
                  style={[
                    styles.feedFilterPillText,
                    feedFilter === "favorites" && styles.feedFilterPillTextActive,
                  ]}
                >
                  Favorilerim
                </Text>
              </Pressable>
            </View>
          </View>

          {loading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color={BLOG_GREEN} />
              <Text style={styles.hintMuted}>Tarifler yükleniyor…</Text>
            </View>
          ) : loadError ? (
            <View style={styles.centerBox}>
              <Text style={styles.errorText}>{loadError}</Text>
              <Text style={styles.hintMuted}>
                Firebase yapılandırmasını ve Firestore kurallarını kontrol edin.
              </Text>
            </View>
          ) : recipes.length === 0 ? (
            <View style={styles.centerBox}>
              <Text style={styles.emptyTitle}>Henüz tarif yok</Text>
              <Text style={styles.hintMuted}>
                İlk tarifi paylaşmak için + düğmesine dokunun.
              </Text>
            </View>
          ) : displayedRecipes.length === 0 && feedFilter === "favorites" ? (
            <View style={styles.centerBox}>
              <Text style={styles.emptyTitle}>Henüz favori tarif yok</Text>
              <Text style={styles.hintMuted}>
                Tarif kartındaki yer imi simgesine dokunarak favorilerinize ekleyin.
              </Text>
            </View>
          ) : (
            displayedRecipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                liked={!!likedIds[recipe.id]}
                favorited={favoriteIdSet.has(recipe.id)}
                onCardPress={() => openDetail(recipe.id)}
                onLike={() => onToggleLike(recipe.id)}
                onComment={() => onCommentPress(recipe.id)}
                onToggleFavorite={() => void toggleFavoriteRecipe(recipe.id)}
                followedIds={followedIds}
                onFollow={async (uid) => {
                  const firebaseUser = auth.currentUser;
                  if (!firebaseUser || uid === firebaseUser.uid) return;
                  if (followedIds.includes(uid)) return;
                  await followUser(firebaseUser.uid, uid);
                  setFollowedIds((prev) => [...prev, uid]);
                }}
              />
            ))
          )}
        </ScrollView>
      </FadeInView>

      <PressableScale style={styles.fabWrap} onPress={openCreate}>
        <LinearGradient
          colors={[...Gradients.fab]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fab}
        >
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </LinearGradient>
      </PressableScale>

      <PremiumRequiredModal
        visible={premiumModalVisible}
        onClose={() => setPremiumModalVisible(false)}
        onPremiumPress={goPremium}
      />
    </SafeAreaView>
  );
}

function RecipeCard({
  recipe,
  liked,
  favorited,
  onCardPress,
  onLike,
  onComment,
  onToggleFavorite,
  followedIds,
  onFollow,
}: {
  recipe: RecipePost;
  liked: boolean;
  favorited: boolean;
  onCardPress: () => void;
  onLike: () => void;
  onComment: () => void;
  onToggleFavorite: () => void;
  followedIds: string[];
  onFollow: (uid: string) => void;
}) {
  const router = useRouter();
  const displayLikes = recipe.likes + (liked ? 1 : 0);
  const heartScale = useRef(new Animated.Value(1)).current;
  const prevLiked = useRef(liked);

  useEffect(() => {
    if (liked && !prevLiked.current) {
      Animated.sequence([
        Animated.spring(heartScale, {
          toValue: 1.45,
          friction: 4,
          tension: 200,
          useNativeDriver: true,
        }),
        Animated.spring(heartScale, {
          toValue: 1,
          friction: 6,
          useNativeDriver: true,
        }),
      ]).start();
    }
    prevLiked.current = liked;
  }, [liked, heartScale]);

  const triggerLike = () => {
    onLike();
  };

  const cardImageUri = recipe.imageUri?.trim()
    ? displayImageUri(recipe.imageUri) ?? recipe.imageUri
    : undefined;
  const cardVideoUri = recipe.videoUri?.trim() ? recipe.videoUri.trim() : undefined;

  return (
    <View style={[styles.cardOuter, Shadows.cardMedium]}>
      <LinearGradient
        colors={[...Gradients.cardSubtle]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.cardInner}
      >
        <View style={styles.imageSection}>
          <PressableScale onPress={onCardPress}>
            <View>
              <View style={styles.cardImageWrap}>
                <View style={styles.imageGradientBg}>
                  {cardVideoUri ? (
                    <>
                      <Video
                        source={{ uri: cardVideoUri }}
                        style={StyleSheet.absoluteFillObject}
                        resizeMode={ResizeMode.COVER}
                        useNativeControls
                        shouldPlay={false}
                        accessibilityLabel="Tarif videosu"
                      />
                      <LinearGradient
                        colors={["transparent", "rgba(0,0,0,0.35)"]}
                        style={StyleSheet.absoluteFillObject}
                        pointerEvents="none"
                      />
                    </>
                  ) : cardImageUri ? (
                    <>
                      <Image
                        source={{ uri: cardImageUri }}
                        style={StyleSheet.absoluteFillObject}
                        resizeMode="cover"
                        accessibilityLabel="Tarif görseli"
                      />
                      <LinearGradient
                        colors={["transparent", "rgba(0,0,0,0.35)"]}
                        style={StyleSheet.absoluteFillObject}
                      />
                    </>
                  ) : (
                    <>
                      <LinearGradient
                        colors={["#bbf7d0", "#4ade80", "#15803d"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFillObject}
                      />
                      <LinearGradient
                        colors={["transparent", "rgba(0,0,0,0.45)"]}
                        style={StyleSheet.absoluteFillObject}
                      />
                      <View style={styles.imageFg}>
                        <Ionicons name="image-outline" size={44} color="rgba(255,255,255,0.95)" />
                        <Text style={styles.imagePlaceholderLabel}>Görsel</Text>
                      </View>
                    </>
                  )}
                </View>
              </View>

              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{recipe.title}</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 }}>
                  <Pressable
                    onPress={() => {
                      if (recipe.createdBy) {
                        router.push(`/user-profile/${recipe.createdBy}` as any);
                      }
                    }}
                  >
                    <Text style={styles.cardAuthor}>{recipe.author}</Text>
                  </Pressable>
                  {recipe.createdBy && recipe.createdBy !== auth.currentUser?.uid && (
                    <Pressable
                      onPress={() => {
                        if (!followedIds.includes(recipe.createdBy!)) {
                          onFollow(recipe.createdBy!);
                        }
                      }}
                      style={{
                        backgroundColor: followedIds.includes(recipe.createdBy)
                          ? Colors.card
                          : Colors.primary,
                        borderRadius: 8,
                        paddingVertical: 3,
                        paddingHorizontal: 8,
                        borderWidth: followedIds.includes(recipe.createdBy) ? 1 : 0,
                        borderColor: Colors.border,
                      }}
                    >
                      <Text
                        style={{
                          color: followedIds.includes(recipe.createdBy)
                            ? Colors.textSecondary
                            : "#fff",
                          fontSize: 11,
                          fontWeight: "700",
                        }}
                      >
                        {followedIds.includes(recipe.createdBy)
                          ? "Takip Ediliyor"
                          : "+ Takip"}
                      </Text>
                    </Pressable>
                  )}
                </View>

                <View style={styles.tagsRow}>
                  {recipe.tags.map((tag) => {
                    const st = getRecipeTagStyle(tag);
                    return (
                      <View
                        key={tag}
                        style={[
                          styles.tag,
                          {
                            backgroundColor: st.bg,
                            borderWidth: st.border ? 1 : 0,
                            borderColor: st.border ?? "transparent",
                          },
                        ]}
                      >
                        <Text style={[styles.tagText, { color: st.text }]}>{tag}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>
          </PressableScale>
          <Pressable
            style={styles.cardFavoriteBtn}
            onPress={onToggleFavorite}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={favorited ? "Favorilerden çıkar" : "Favorilere ekle"}
          >
            <Ionicons
              name={favorited ? "bookmark" : "bookmark-outline"}
              size={26}
              color={favorited ? BLOG_GREEN : "#FFFFFF"}
              style={styles.cardFavoriteIconShadow}
            />
          </Pressable>
        </View>

        <View style={styles.actionsRow}>
          <Pressable style={styles.actionBtn} onPress={triggerLike} hitSlop={8}>
            <Animated.View style={{ transform: [{ scale: heartScale }] }}>
              <Ionicons
                name={liked ? "heart" : "heart-outline"}
                size={24}
                color={liked ? BLOG_GREEN : Colors.textSecondary}
              />
            </Animated.View>
            <Text style={[styles.actionCount, liked && { color: BLOG_GREEN }]}>
              {displayLikes}
            </Text>
          </Pressable>

          <Pressable style={styles.actionBtn} onPress={onComment} hitSlop={8}>
            <Ionicons name="chatbubble-outline" size={21} color={Colors.textSecondary} />
            <Text style={styles.actionCount}>{recipe.comments}</Text>
          </Pressable>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingBottom: 14,
    marginTop: 4,
  },
  title: {
    fontSize: 24,
    ...headerTitleStyle,
    color: Colors.text,
    letterSpacing: 0.45,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  reelsBtn: {
    borderRadius: 14,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#f72585",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
      },
      android: { elevation: 6 },
    }),
  },
  reelsBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  reelsBtnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 15,
    letterSpacing: 0.3,
  },
  reelsBtnLive: {
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  reelsBtnLiveText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 0.5,
  },
  feedFilterRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  feedFilterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radii.pill,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  feedFilterPillActive: {
    backgroundColor: `${BLOG_GREEN}18`,
    borderColor: BLOG_GREEN,
  },
  feedFilterPillText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.textSecondary,
  },
  feedFilterPillTextActive: {
    color: BLOG_GREEN,
  },
  scrollContent: {
    paddingHorizontal: ScreenPadding,
    paddingBottom: 120,
    gap: 16,
  },
  centerBox: {
    paddingVertical: 32,
    alignItems: "center",
    gap: 10,
  },
  hintMuted: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: 16,
  },
  errorText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.text,
    textAlign: "center",
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.text,
  },
  cardOuter: {
    borderRadius: Radii.card,
    overflow: "hidden",
  },
  cardInner: {
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: `${BLOG_GREEN}22`,
    overflow: "hidden",
    paddingBottom: 10,
  },
  imageSection: {
    marginBottom: 0,
    position: "relative",
  },
  cardImageWrap: {
    marginBottom: 12,
    position: "relative",
  },
  imageGradientBg: {
    height: 168,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    position: "relative",
  },
  cardFavoriteBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 20,
    padding: 6,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  cardFavoriteIconShadow: {
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.4,
        shadowRadius: 2,
      },
      default: {},
    }),
  },
  imageFg: {
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  imagePlaceholderLabel: {
    marginTop: 8,
    fontSize: 13,
    color: "rgba(255,255,255,0.95)",
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  cardBody: {
    paddingHorizontal: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.text,
    letterSpacing: 0.2,
  },
  cardAuthor: {
    marginTop: 6,
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  tag: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: Radii.pill,
  },
  tagText: {
    fontSize: 12,
    fontWeight: "700",
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    marginTop: 14,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 12,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  actionCount: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
  },
  fabWrap: {
    position: "absolute",
    right: ScreenPadding,
    bottom: 24,
    borderRadius: 30,
    ...Platform.select({
      ios: {
        shadowColor: BLOG_GREEN,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
      },
      android: { elevation: 10 },
    }),
  },
  fab: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
  },
});
