import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import {
  followUser,
  unfollowUser,
  isFollowing,
  getFollowersCount,
  getFollowingCount,
} from "@/lib/followStorage";
import { subscribeRecipes } from "@/lib/firestore";
import type { RecipePost } from "@/constants/recipesBlog";
import { displayImageUri } from "@/lib/displayImageUri";
import { Colors, ScreenPadding } from "@/constants/theme";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");
const GRID_SIZE = (width - ScreenPadding * 2 - 8) / 3;

export default function UserProfileScreen() {
  const { uid } = useLocalSearchParams<{ uid: string }>();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [recipes, setRecipes] = useState<RecipePost[]>([]);
  const [followLoading, setFollowLoading] = useState(false);

  const profileUid = typeof uid === "string" ? uid : "";
  const currentUid = auth.currentUser?.uid;
  const isOwnProfile = currentUid === profileUid;

  useEffect(() => {
    if (!profileUid) return;
    const load = async () => {
      setLoading(true);
      try {
        const snap = await getDoc(doc(db, "users", profileUid));
        if (snap.exists()) setProfile(snap.data());
        const [followers, followingC, isF] = await Promise.all([
          getFollowersCount(profileUid),
          getFollowingCount(profileUid),
          currentUid ? isFollowing(currentUid, profileUid) : Promise.resolve(false),
        ]);
        setFollowersCount(followers);
        setFollowingCount(followingC);
        setFollowing(isF);
      } catch (e) {
        console.warn(e);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [profileUid, currentUid]);

  useEffect(() => {
    if (!profileUid) return;
    return subscribeRecipes(
      (list) => setRecipes(list.filter((r) => r.createdBy === profileUid)),
      () => {}
    );
  }, [profileUid]);

  const onFollowPress = async () => {
    if (!currentUid || !profileUid) return;
    setFollowLoading(true);
    try {
      if (following) {
        await unfollowUser(currentUid, profileUid);
        setFollowing(false);
        setFollowersCount((c) => Math.max(0, c - 1));
      } else {
        await followUser(currentUid, profileUid);
        setFollowing(true);
        setFollowersCount((c) => c + 1);
      }
    } catch {
      Alert.alert("Hata", "İşlem gerçekleştirilemedi.");
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const displayName = profile?.displayName ?? "Kullanıcı";
  const photoURL = profile?.photoURL ?? null;

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={s.headerTitle}>{displayName}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={s.topSection}>
          <View style={s.avatarWrap}>
            {photoURL ? (
              <Image source={{ uri: photoURL }} style={s.avatar} />
            ) : (
              <View style={[s.avatar, s.avatarPlaceholder]}>
                <Text style={s.avatarInitial}>
                  {displayName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>

          <View style={s.statsRow}>
            <View style={s.statItem}>
              <Text style={s.statNumber}>{recipes.length}</Text>
              <Text style={s.statLabel}>Tarif</Text>
            </View>
            <View style={s.statDivider} />
            <Pressable
              onPress={() =>
                router.push(`/user-profile/${profileUid}/followers` as any)
              }
              style={s.statItem}
            >
              <Text style={s.statNumber}>{followersCount}</Text>
              <Text style={s.statLabel}>Takipçi</Text>
            </Pressable>
            <View style={s.statDivider} />
            <Pressable
              onPress={() =>
                router.push(`/user-profile/${profileUid}/following` as any)
              }
              style={s.statItem}
            >
              <Text style={s.statNumber}>{followingCount}</Text>
              <Text style={s.statLabel}>Takip</Text>
            </Pressable>
          </View>
        </View>

        <View style={s.nameSection}>
          <Text style={s.name}>{displayName}</Text>
          {profile?.conditions?.length > 0 && (
            <View style={s.conditionsWrap}>
              {profile.conditions.map((c: string) => (
                <View key={c} style={s.conditionChip}>
                  <Text style={s.conditionChipText}>{c}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {!isOwnProfile && (
          <View style={s.actionButtons}>
            <Pressable
              style={[s.followBtn, following && s.followingBtn]}
              onPress={() => void onFollowPress()}
              disabled={followLoading}
            >
              {followLoading ? (
                <ActivityIndicator
                  size="small"
                  color={following ? Colors.text : "#fff"}
                />
              ) : (
                <Text style={[s.followBtnText, following && s.followingBtnText]}>
                  {following ? "Takip Ediliyor" : "Takip Et"}
                </Text>
              )}
            </Pressable>
          </View>
        )}

        <View style={s.tabHeader}>
          <Ionicons name="grid-outline" size={20} color={Colors.primary} />
          <Text style={s.tabHeaderText}>Tarifler</Text>
        </View>

        {recipes.length === 0 ? (
          <View style={s.emptyBox}>
            <Ionicons name="restaurant-outline" size={48} color={Colors.border} />
            <Text style={s.emptyText}>Henüz tarif paylaşmadı</Text>
          </View>
        ) : (
          <View style={s.grid}>
            {recipes.map((item) => {
              const uri = item.imageUri?.trim()
                ? displayImageUri(item.imageUri) ?? item.imageUri
                : null;
              return (
                <Pressable
                  key={item.id}
                  style={s.gridItem}
                  onPress={() => router.push(`/blog-post/${item.id}` as any)}
                >
                  {uri ? (
                    <Image source={{ uri }} style={s.gridImage} resizeMode="cover" />
                  ) : (
                    <LinearGradient colors={["#bbf7d0", "#16a34a"]} style={s.gridImage}>
                      <Ionicons name="restaurant-outline" size={28} color="#fff" />
                    </LinearGradient>
                  )}
                  <LinearGradient
                    colors={["transparent", "rgba(0,0,0,0.5)"]}
                    style={s.gridOverlay}
                  >
                    <Text style={s.gridTitle} numberOfLines={2}>
                      {item.title}
                    </Text>
                  </LinearGradient>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: ScreenPadding,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700", color: Colors.text },
  topSection: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: ScreenPadding,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 20,
  },
  avatarWrap: {},
  avatar: { width: 90, height: 90, borderRadius: 45, overflow: "hidden" },
  avatarPlaceholder: {
    backgroundColor: `${Colors.primary}18`,
    borderWidth: 3,
    borderColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: { fontSize: 36, fontWeight: "700", color: Colors.primary },
  statsRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: Colors.card,
    borderRadius: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statItem: { alignItems: "center", flex: 1 },
  statNumber: { fontSize: 20, fontWeight: "800", color: Colors.text },
  statLabel: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  statDivider: { width: 1, height: 32, backgroundColor: Colors.border },
  nameSection: { paddingHorizontal: ScreenPadding, paddingBottom: 12 },
  name: { fontSize: 20, fontWeight: "800", color: Colors.text },
  conditionsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  conditionChip: {
    backgroundColor: `${Colors.primary}18`,
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: `${Colors.primary}40`,
  },
  conditionChipText: { fontSize: 12, fontWeight: "600", color: Colors.primary },
  actionButtons: { paddingHorizontal: ScreenPadding, marginBottom: 16 },
  followBtn: {
    height: 38,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  followingBtn: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  followBtnText: { fontSize: 14, fontWeight: "700", color: "#fff" },
  followingBtnText: { color: Colors.text },
  tabHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: ScreenPadding,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  tabHeaderText: { fontSize: 15, fontWeight: "700", color: Colors.text },
  emptyBox: {
    paddingVertical: 40,
    alignItems: "center",
    gap: 10,
  },
  emptyText: { fontSize: 15, color: Colors.textSecondary },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: ScreenPadding,
    gap: 4,
  },
  gridItem: {
    width: GRID_SIZE,
    height: GRID_SIZE,
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
  },
  gridImage: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  gridOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 6,
  },
  gridTitle: { fontSize: 10, color: "#fff", fontWeight: "600" },
});
