import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
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
import { PremiumRequiredModal } from "@/components/PremiumRequiredModal";
import { BlogStoryReelsStrip } from "@/components/BlogStoryReels";
import { FadeInView } from "@/components/FadeInView";
import { PressableScale } from "@/components/PressableScale";

const BLOG_GREEN = "#16a34a";

const IS_PREMIUM_USER = true;

const SAMPLE_RECIPES = [
  {
    id: "1",
    title: "Kinoa Salatası (Glütensiz)",
    author: "Dyt. Selin Yılmaz",
    likes: 128,
    comments: 14,
    tags: ["Çölyak", "Vegan", "Düşük Kalori"],
  },
  {
    id: "2",
    title: "Fırında Sebzeli Mercimek Köftesi",
    author: "Şef Emre Kaya",
    likes: 256,
    comments: 31,
    tags: ["Vegan", "Yüksek Protein"],
  },
  {
    id: "3",
    title: "Yulaf Lapası (Düşük Glisemik İndeks)",
    author: "Dyt. Ayşe Demir",
    likes: 89,
    comments: 9,
    tags: ["Diyabet", "Düşük Kalori"],
  },
  {
    id: "4",
    title: "Izgara Somon & Kuşkonmaz",
    author: "Sağlıklı Mutfak",
    likes: 412,
    comments: 52,
    tags: ["Düşük Kalori", "Yüksek Protein"],
  },
] as const;

type SampleRecipe = (typeof SAMPLE_RECIPES)[number];

export default function BlogScreen() {
  const router = useRouter();
  const [likedIds, setLikedIds] = useState<Record<string, boolean>>({});
  const [premiumModalVisible, setPremiumModalVisible] = useState(false);

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

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <FadeInView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <BlogStoryReelsStrip stories={SAMPLE_STORY_REELS} />

          <View style={styles.header}>
            <Text style={styles.title}>Sağlıklı Tarifler</Text>
            <Text style={styles.subtitle}>Topluluğumuzdan tarifler ve ipuçları</Text>
          </View>

          {SAMPLE_RECIPES.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              liked={!!likedIds[recipe.id]}
              onCardPress={() => openDetail(recipe.id)}
              onLike={() => onToggleLike(recipe.id)}
              onComment={() => onCommentPress(recipe.id)}
            />
          ))}
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
  onCardPress,
  onLike,
  onComment,
}: {
  recipe: SampleRecipe;
  liked: boolean;
  onCardPress: () => void;
  onLike: () => void;
  onComment: () => void;
}) {
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

  return (
    <View style={[styles.cardOuter, Shadows.cardMedium]}>
      <LinearGradient
        colors={[...Gradients.cardSubtle]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.cardInner}
      >
        <PressableScale onPress={onCardPress}>
          <View>
            <View style={styles.imageSection}>
              <View style={styles.imageGradientBg}>
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
              </View>

              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{recipe.title}</Text>
                <Text style={styles.cardAuthor}>{recipe.author}</Text>

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
          </View>
        </PressableScale>

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
  scrollContent: {
    paddingHorizontal: ScreenPadding,
    paddingBottom: 120,
    gap: 16,
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
  },
  imageGradientBg: {
    height: 168,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    overflow: "hidden",
    position: "relative",
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
