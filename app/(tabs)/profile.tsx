import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
  Alert,
  Image,
  Dimensions,
  Modal,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { logoutUser } from "@/lib/authStorage";
import type { User } from "firebase/auth";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { Colors, ScreenPadding } from "@/constants/theme";
import { fetchFavoriteRecipeIdsFromFirestore, subscribeRecipes } from "@/lib/firestore";
import { subscribeFollowersCount, subscribeFollowingCount } from "@/lib/followStorage";
import {
  getActiveHealthProfileLabels,
  loadHealthProfileForUser,
  parseHealthProfile,
  saveHealthProfile,
} from "@/lib/healthProfileStorage";
import type { RecipePost } from "@/constants/recipesBlog";
import { displayImageUri } from "@/lib/displayImageUri";

const LOGOUT_DANGER = "#ef4444";
const { width } = Dimensions.get("window");
const GRID_SIZE = (width - ScreenPadding * 2 - 8) / 3;

const MENU = [
  { key: "family", label: "Aile Profili", icon: "people-outline" as const },
  { key: "health", label: "Sağlık Profili", icon: "fitness-outline" as const },
  { key: "privacy", label: "Gizlilik", icon: "shield-checkmark-outline" as const },
  { key: "help", label: "Yardım", icon: "help-circle-outline" as const },
] as const;

type ProfileTab = "recipes" | "favorites";

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [conditions, setConditions] = useState<string[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [firestoreDisplayName, setFirestoreDisplayName] = useState("");
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [activeTab, setActiveTab] = useState<ProfileTab>("recipes");
  const [allRecipes, setAllRecipes] = useState<RecipePost[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [loadingRecipes, setLoadingRecipes] = useState(true);

  // Firestore realtime dinle
  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | null = null;
    let unsubscribeFollowers: (() => void) | null = null;
    let unsubscribeFollowing: (() => void) | null = null;

    const refreshHealthBadges = async (uid: string, healthProfileRaw: unknown) => {
      const parsed = parseHealthProfile(healthProfileRaw);
      const profile = parsed ?? (await loadHealthProfileForUser(uid));
      if (parsed) {
        void saveHealthProfile(parsed);
      }
      setConditions(getActiveHealthProfileLabels(profile));
    };

    const unsubscribeAuth = auth.onAuthStateChanged((firebaseUser) => {
      if (unsubscribeSnapshot) unsubscribeSnapshot();
      if (unsubscribeFollowers) unsubscribeFollowers();
      if (unsubscribeFollowing) unsubscribeFollowing();
      unsubscribeSnapshot = null;
      unsubscribeFollowers = null;
      unsubscribeFollowing = null;

      if (!firebaseUser) {
        setUser(null);
        setFirestoreDisplayName("");
        setPhotoURL(null);
        setConditions([]);
        setFollowersCount(0);
        setFollowingCount(0);
        return;
      }

      const uid = firebaseUser.uid;
      setUser(firebaseUser);

      unsubscribeFollowers = subscribeFollowersCount(uid, setFollowersCount, (e) =>
        console.warn("Takipçi sayısı dinleme hatası:", e)
      );
      unsubscribeFollowing = subscribeFollowingCount(uid, setFollowingCount, (e) =>
        console.warn("Takip sayısı dinleme hatası:", e)
      );

      unsubscribeSnapshot = onSnapshot(
        doc(db, "users", uid),
        (snap) => {
          if (!snap.exists()) {
            void refreshHealthBadges(uid, null);
            return;
          }
          const data = snap.data();
          setFirestoreDisplayName(data.displayName ?? "");
          setPhotoURL(data.photoURL ?? null);
          void refreshHealthBadges(uid, data.healthProfile);
        },
        (e) => console.warn("Profil snapshot hatası:", e)
      );
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
      if (unsubscribeFollowers) unsubscribeFollowers();
      if (unsubscribeFollowing) unsubscribeFollowing();
    };
  }, []);

  // Tarifleri dinle
  useEffect(() => {
    setLoadingRecipes(true);
    const unsub = subscribeRecipes(
      (list) => {
        setAllRecipes(list);
        setLoadingRecipes(false);
      },
      () => setLoadingRecipes(false)
    );
    return () => unsub();
  }, []);

  // Favorileri ve sağlık profili badge'lerini odaklanınca yenile
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      void (async () => {
        const firebaseUser = auth.currentUser;
        if (!firebaseUser) return;
        try {
          const uid = firebaseUser.uid;
          const [fromFirestore, profile] = await Promise.all([
            fetchFavoriteRecipeIdsFromFirestore(uid).catch(() => [] as string[]),
            loadHealthProfileForUser(uid),
          ]);
          if (!cancelled) {
            setFavoriteIds(fromFirestore);
            setConditions(getActiveHealthProfileLabels(profile));
          }
        } catch {
          if (!cancelled) setFavoriteIds([]);
        }
      })();
      return () => { cancelled = true; };
    }, [user?.uid])
  );

  const displayName =
    firestoreDisplayName ||
    user?.displayName ||
    (user?.isAnonymous ? "Misafir" : "Kullanıcı");
  const email = user?.email ?? (user?.isAnonymous ? "Misafir hesabı" : "—");

  const myRecipes = allRecipes.filter(
    (r) => r.createdBy === user?.uid
  );
  const favoriteRecipes = allRecipes.filter((r) => favoriteIds.includes(r.id));
  const displayedRecipes = activeTab === "recipes" ? myRecipes : favoriteRecipes;

  const onMenuPress = (key: (typeof MENU)[number]["key"]) => {
    switch (key) {
      case "family":
        router.push("/family");
        break;
      case "health":
        router.push("/health-profile");
        break;
      case "privacy":
        router.push("/privacy");
        break;
      case "help":
        router.push("/help");
        break;
    }
  };

  const onPickPhoto = () => {
    Alert.alert("Profil Fotoğrafı", undefined, [
      ...(photoURL
        ? [{ text: "Fotoğrafı Görüntüle", onPress: () => setShowPhotoModal(true) }]
        : []),
      {
        text: photoURL ? "Fotoğrafı Değiştir" : "Fotoğraf Ekle",
        onPress: () => void pickAndUpload(),
      },
      { text: "Vazgeç", style: "cancel" as const },
    ]);
  };

  const pickAndUpload = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("İzin Gerekli", "Galeri izni gerekiyor.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.3,
      base64: true,
    });
    if (result.canceled || !result.assets[0]?.base64) return;
    const base64 = `data:image/jpeg;base64,${result.assets[0].base64}`;
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    setUploadingPhoto(true);
    try {
      await updateDoc(doc(db, "users", currentUser.uid), { photoURL: base64 });
      setPhotoURL(base64);
    } catch {
      Alert.alert("Hata", "Fotoğraf kaydedilemedi.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const onLogoutPress = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert("Çıkış Yap", "Hesabınızdan çıkmak istediğinize emin misiniz?", [
      { text: "Vazgeç", style: "cancel" },
      {
        text: "Çıkış Yap",
        style: "destructive",
        onPress: () => {
          void logoutUser();
        },
      },
    ]);
  };

  const renderRecipeItem = ({ item }: { item: RecipePost }) => {
    const uri = item.imageUri?.trim()
      ? displayImageUri(item.imageUri) ?? item.imageUri
      : null;
    return (
      <Pressable
        style={styles.gridItem}
        onPress={() => router.push(`/blog-post/${item.id}`)}
      >
        {uri ? (
          <Image source={{ uri }} style={styles.gridImage} resizeMode="cover" />
        ) : (
          <LinearGradient colors={["#bbf7d0", "#16a34a"]} style={styles.gridImagePlaceholder}>
            <Ionicons name="restaurant-outline" size={28} color="#fff" />
          </LinearGradient>
        )}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.5)"]}
          style={styles.gridOverlay}
        >
          <Text style={styles.gridTitle} numberOfLines={2}>
            {item.title}
          </Text>
        </LinearGradient>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Üst Alan */}
        <View style={styles.topSection}>
          {/* Avatar */}
          <Pressable onPress={onPickPhoto} style={styles.avatarWrap}>
            <View style={styles.avatar}>
              {uploadingPhoto ? (
                <ActivityIndicator color={Colors.primary} />
              ) : photoURL ? (
                <Image source={{ uri: photoURL }} style={styles.avatarImage} />
              ) : !displayName || displayName === "Misafir" || displayName === "Kullanıcı" ? (
                <Ionicons name="person" size={40} color={Colors.primary} />
              ) : (
                <Text style={styles.avatarInitial}>{displayName.charAt(0).toUpperCase()}</Text>
              )}
            </View>
            <View style={styles.avatarEditBadge}>
              <Ionicons name="camera" size={12} color="#fff" />
            </View>
          </Pressable>

          {/* İstatistikler */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{myRecipes.length}</Text>
              <Text style={styles.statLabel}>Tarif</Text>
            </View>
            <View style={styles.statDivider} />
            <Pressable
              style={styles.statItem}
              onPress={() => {
                const uid = user?.uid;
                if (uid) router.push(`/user-profile/${uid}/followers` as any);
              }}
            >
              <Text style={styles.statNumber}>{followersCount}</Text>
              <Text style={styles.statLabel}>Takipçi</Text>
            </Pressable>
            <View style={styles.statDivider} />
            <Pressable
              style={styles.statItem}
              onPress={() => {
                const uid = user?.uid;
                if (uid) router.push(`/user-profile/${uid}/following` as any);
              }}
            >
              <Text style={styles.statNumber}>{followingCount}</Text>
              <Text style={styles.statLabel}>Takip</Text>
            </Pressable>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{favoriteIds.length}</Text>
              <Text style={styles.statLabel}>Favori</Text>
            </View>
          </View>
        </View>

        {/* İsim & Email */}
        <View style={styles.nameSection}>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.email}>{email}</Text>
          <View style={styles.conditionsWrap}>
            {conditions.map((c) => (
              <View key={c} style={styles.conditionChip}>
                <Text style={styles.conditionChipText}>{c}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Ayarlar Butonları */}
        <View style={styles.actionButtons}>
          <Pressable style={styles.editProfileBtn} onPress={() => router.push("/health-profile")}>
            <Text style={styles.editProfileBtnText}>Profili Düzenle</Text>
          </Pressable>
          <Pressable style={styles.settingsBtn} onPress={() => router.push("/notification-settings")}>
            <Ionicons name="settings-outline" size={20} color={Colors.text} />
          </Pressable>
          <Pressable style={styles.settingsBtn} onPress={onLogoutPress}>
            <Ionicons name="log-out-outline" size={20} color={LOGOUT_DANGER} />
          </Pressable>
        </View>

        {/* Tab Bar */}
        <View style={styles.tabBar}>
          <Pressable
            style={[styles.tabItem, activeTab === "recipes" && styles.tabItemActive]}
            onPress={() => setActiveTab("recipes")}
          >
            <Ionicons
              name="grid-outline"
              size={22}
              color={activeTab === "recipes" ? Colors.primary : Colors.textSecondary}
            />
            <Text style={[styles.tabLabel, activeTab === "recipes" && styles.tabLabelActive]}>
              Tariflerim
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tabItem, activeTab === "favorites" && styles.tabItemActive]}
            onPress={() => setActiveTab("favorites")}
          >
            <Ionicons
              name="bookmark-outline"
              size={22}
              color={activeTab === "favorites" ? Colors.primary : Colors.textSecondary}
            />
            <Text style={[styles.tabLabel, activeTab === "favorites" && styles.tabLabelActive]}>
              Favorilerim
            </Text>
          </Pressable>
        </View>

        {/* Grid */}
        {loadingRecipes ? (
          <View style={styles.centerBox}>
            <ActivityIndicator color={Colors.primary} />
          </View>
        ) : displayedRecipes.length === 0 ? (
          <View style={styles.centerBox}>
            <Ionicons
              name={activeTab === "recipes" ? "restaurant-outline" : "bookmark-outline"}
              size={48}
              color={Colors.border}
            />
            <Text style={styles.emptyTitle}>
              {activeTab === "recipes" ? "Henüz tarif paylaşmadın" : "Henüz favori yok"}
            </Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === "recipes"
                ? "Blog sekmesinden tarif paylaşabilirsin"
                : "Blog'daki tarifleri favorine ekle"}
            </Text>
            <Pressable style={styles.goToBlogBtn} onPress={() => router.push("/(tabs)/blog")}>
              <Text style={styles.goToBlogBtnText}>Blog'a Git</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.grid}>
            {displayedRecipes.map((item) => (
              <View key={item.id}>{renderRecipeItem({ item })}</View>
            ))}
          </View>
        )}

        {/* Diğer Ayarlar */}
        <View style={styles.menuSection}>
          {MENU.map((item) => (
            <Pressable
              key={item.key}
              style={styles.menuRow}
              onPress={() => onMenuPress(item.key)}
            >
              <Ionicons name={item.icon} size={22} color={Colors.text} />
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
            </Pressable>
          ))}
        </View>

        <Text style={styles.version}>Health Guide App · v1.0.0</Text>
      </ScrollView>

      {/* Fotoğraf Modal */}
      <Modal
        visible={showPhotoModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPhotoModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowPhotoModal(false)}>
          <View style={styles.modalContent}>
            <Image source={{ uri: photoURL! }} style={styles.modalImage} resizeMode="cover" />
            <Pressable style={styles.modalCloseBtn} onPress={() => setShowPhotoModal(false)}>
              <Ionicons name="close" size={24} color="#fff" />
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  topSection: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: ScreenPadding,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 20,
  },
  avatarWrap: { position: "relative" },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.card,
    borderWidth: 3,
    borderColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: { width: 90, height: 90, borderRadius: 45 },
  avatarInitial: { fontSize: 36, fontWeight: "700", color: Colors.primary },
  avatarEditBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.background,
  },
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
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
    fontWeight: "500",
  },
  statDivider: { width: 1, height: 32, backgroundColor: Colors.border },
  nameSection: { paddingHorizontal: ScreenPadding, paddingBottom: 12 },
  name: { fontSize: 20, fontWeight: "800", color: Colors.text },
  email: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  conditionsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
  },
  conditionChip: {
    backgroundColor: `${Colors.primary}18`,
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: `${Colors.primary}40`,
  },
  conditionChipText: { fontSize: 12, fontWeight: "600", color: Colors.primary },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: ScreenPadding,
    marginBottom: 16,
  },
  editProfileBtn: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  editProfileBtnText: { fontSize: 14, fontWeight: "600", color: Colors.text },
  settingsBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  tabBar: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
    marginBottom: 2,
  },
  tabItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
  },
  tabItemActive: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  tabLabel: { fontSize: 13, fontWeight: "600", color: Colors.textSecondary },
  tabLabelActive: { color: Colors.primary },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: ScreenPadding,
    gap: 4,
    paddingTop: 4,
  },
  gridItem: {
    width: GRID_SIZE,
    height: GRID_SIZE,
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
  },
  gridImage: { width: "100%", height: "100%" },
  gridImagePlaceholder: {
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
  centerBox: {
    paddingVertical: 40,
    alignItems: "center",
    gap: 10,
    paddingHorizontal: ScreenPadding,
  },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: Colors.text },
  emptySubtitle: { fontSize: 13, color: Colors.textSecondary, textAlign: "center" },
  goToBlogBtn: {
    marginTop: 8,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  goToBlogBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  menuSection: { paddingHorizontal: ScreenPadding, marginTop: 16 },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  menuLabel: { flex: 1, fontSize: 16, color: Colors.text, fontWeight: "500" },
  version: {
    textAlign: "center",
    marginTop: 24,
    marginBottom: 32,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalContent: { position: "relative", width: 300, height: 300 },
  modalImage: { width: 300, height: 300, borderRadius: 16 },
  modalCloseBtn: {
    position: "absolute",
    top: -16,
    right: -16,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 20,
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
});
