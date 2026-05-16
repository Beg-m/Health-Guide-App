import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  FlatList,
  StatusBar,
  Image,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { subscribeRecipes } from "@/lib/firestore";
import type { RecipePost } from "@/constants/recipesBlog";
import { Colors } from "@/constants/theme";
import { displayImageUri } from "@/lib/displayImageUri";

const { width: W, height: H } = Dimensions.get("window");

export default function ReelsScreen() {
  const router = useRouter();
  const [recipes, setRecipes] = useState<RecipePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    return subscribeRecipes(
      (list) => {
        setRecipes(list);
        setLoading(false);
      },
      () => setLoading(false)
    );
  }, []);

  if (loading)
    return (
      <View style={s.center}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );

  if (recipes.length === 0)
    return (
      <View style={s.center}>
        <StatusBar barStyle="light-content" />
        <Ionicons name="film-outline" size={64} color="rgba(255,255,255,0.3)" />
        <Text style={s.emptyTitle}>Henüz reel yok</Text>
        <Text style={s.emptySub}>Blog'dan tarif paylaş</Text>
        <Pressable style={s.backBtn} onPress={() => router.back()}>
          <Text style={s.backBtnText}>Geri Dön</Text>
        </Pressable>
      </View>
    );

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <StatusBar barStyle="light-content" />
      <FlatList
        data={recipes}
        keyExtractor={(r) => r.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={H}
        decelerationRate="fast"
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.y / H);
          setActiveIndex(idx);
        }}
        renderItem={({ item }) => (
          <ReelItem
            recipe={item}
            onClose={() => router.back()}
            onDetail={() => router.push(`/blog-post/${item.id}` as any)}
          />
        )}
      />
    </View>
  );
}

function ReelItem({
  recipe,
  onClose,
  onDetail,
}: {
  recipe: RecipePost;
  onClose: () => void;
  onDetail: () => void;
}) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(recipe.likes);

  const coverUri = recipe.imageUri?.trim()
    ? displayImageUri(recipe.imageUri) ?? recipe.imageUri
    : recipe.imageUrls?.[0];

  const like = () => {
    if (Platform.OS !== "web") {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setLiked((v) => {
      setLikeCount((c) => (v ? c - 1 : c + 1));
      return !v;
    });
  };

  return (
    <View style={{ width: W, height: H, backgroundColor: "#111" }}>
      {/* Arka plan görseli */}
      {coverUri ? (
        <Image
          source={{ uri: coverUri }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
      ) : (
        <LinearGradient
          colors={["#16a34a", "#059669", "#0d9488"]}
          style={StyleSheet.absoluteFill}
        />
      )}

      {/* Karartma */}
      <LinearGradient
        colors={["rgba(0,0,0,0.3)", "transparent", "rgba(0,0,0,0.7)"]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* Üst bar */}
      <SafeAreaView edges={["top"]} style={s.topBar}>
        <Pressable onPress={onClose} hitSlop={20} style={s.circleBtn}>
          <Ionicons name="chevron-down" size={26} color="#fff" />
        </Pressable>
        <Text style={s.topTitle}>Reels</Text>
        <View style={{ width: 44 }} />
      </SafeAreaView>

      {/* Sağ aksiyonlar */}
      <View style={s.actions}>
        <Pressable onPress={like} hitSlop={12} style={s.actionItem}>
          <View style={[s.circleBtn, liked && s.likedBtn]}>
            <Ionicons
              name={liked ? "heart" : "heart-outline"}
              size={26}
              color={liked ? "#ef4444" : "#fff"}
            />
          </View>
          <Text style={s.actionLabel}>{likeCount}</Text>
        </Pressable>

        <Pressable onPress={onDetail} hitSlop={12} style={s.actionItem}>
          <View style={s.circleBtn}>
            <Ionicons name="chatbubble-outline" size={24} color="#fff" />
          </View>
          <Text style={s.actionLabel}>{recipe.comments}</Text>
        </Pressable>

        <Pressable onPress={onDetail} hitSlop={12} style={s.actionItem}>
          <View style={[s.circleBtn, { backgroundColor: Colors.primary }]}>
            <Ionicons name="restaurant-outline" size={22} color="#fff" />
          </View>
          <Text style={s.actionLabel}>Tarif</Text>
        </Pressable>
      </View>

      {/* Alt bilgi */}
      <SafeAreaView edges={["bottom"]} style={s.bottomInfo}>
        <Pressable onPress={onDetail} style={s.authorRow}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{recipe.author.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={s.authorName}>{recipe.author}</Text>
        </Pressable>

        <Pressable onPress={onDetail}>
          <Text style={s.reelTitle}>{recipe.title}</Text>
        </Pressable>

        <Text numberOfLines={2} style={s.reelSummary}>
          {recipe.summary}
        </Text>

        <View style={s.tagsRow}>
          {recipe.tags.slice(0, 3).map((t) => (
            <View key={t} style={s.tag}>
              <Text style={s.tagText}>#{t}</Text>
            </View>
          ))}
        </View>

        <Pressable onPress={onDetail} style={s.detailBtn}>
          <Ionicons name="restaurant-outline" size={15} color="#fff" />
          <Text style={s.detailBtnText}>Tarife Git</Text>
          <Ionicons name="chevron-forward" size={15} color="#fff" />
        </Pressable>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    padding: 32,
  },
  emptyTitle: { fontSize: 20, fontWeight: "700", color: "#fff" },
  emptySub: { fontSize: 14, color: "rgba(255,255,255,0.6)", textAlign: "center" },
  backBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 28,
  },
  backBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  topTitle: { fontSize: 18, fontWeight: "800", color: "#fff" },
  circleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  likedBtn: {
    backgroundColor: "rgba(239,68,68,0.3)",
    borderColor: "#ef4444",
  },
  actions: {
    position: "absolute",
    right: 14,
    bottom: 200,
    alignItems: "center",
    gap: 22,
  },
  actionItem: { alignItems: "center", gap: 4 },
  actionLabel: { fontSize: 12, fontWeight: "700", color: "#fff" },
  bottomInfo: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 80,
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 6,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 4,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  avatarText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  authorName: { color: "#fff", fontWeight: "700", fontSize: 14, flex: 1 },
  reelTitle: { color: "#fff", fontSize: 17, fontWeight: "800" },
  reelSummary: { color: "rgba(255,255,255,0.85)", fontSize: 13 },
  tagsRow: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  tag: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 10,
  },
  tagText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  detailBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 14,
    marginTop: 4,
  },
  detailBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});
