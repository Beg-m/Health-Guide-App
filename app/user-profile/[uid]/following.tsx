import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { collection, getDocs, getDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Colors, ScreenPadding } from "@/constants/theme";

export default function FollowingScreen() {
  const { uid } = useLocalSearchParams<{ uid: string }>();
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const profileUid = typeof uid === "string" ? uid : "";

  useEffect(() => {
    if (!profileUid) return;
    const load = async () => {
      try {
        const snap = await getDocs(collection(db, "users", profileUid, "following"));
        const list = await Promise.all(
          snap.docs.map(async (d) => {
            const userSnap = await getDoc(doc(db, "users", d.id));
            return userSnap.exists() ? { uid: d.id, ...userSnap.data() } : null;
          })
        );
        setUsers(list.filter(Boolean));
      } catch {
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [profileUid]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }} edges={["top"]}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={s.title}>Takip Edilenler</Text>
        <View style={{ width: 24 }} />
      </View>
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={Colors.primary} />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.uid}
          renderItem={({ item }) => (
            <Pressable
              style={s.userRow}
              onPress={() => router.push(`/user-profile/${item.uid}` as any)}
            >
              <View style={s.avatar}>
                {item.photoURL ? (
                  <Image source={{ uri: item.photoURL }} style={s.avatarImg} />
                ) : (
                  <Text style={s.avatarText}>
                    {(item.displayName ?? "?").charAt(0).toUpperCase()}
                  </Text>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.name}>{item.displayName ?? "Kullanıcı"}</Text>
                <Text style={s.email}>{item.email ?? ""}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
            </Pressable>
          )}
          ListEmptyComponent={<Text style={s.empty}>Henüz takip edilen yok</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: ScreenPadding,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: { fontSize: 17, fontWeight: "700", color: Colors.text },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: ScreenPadding,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${Colors.primary}18`,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImg: { width: 44, height: 44, borderRadius: 22 },
  avatarText: { fontSize: 18, fontWeight: "700", color: Colors.primary },
  name: { fontSize: 15, fontWeight: "600", color: Colors.text },
  email: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  empty: {
    textAlign: "center",
    marginTop: 40,
    color: Colors.textSecondary,
    fontSize: 15,
  },
});
