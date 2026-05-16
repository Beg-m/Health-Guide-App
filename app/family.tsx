import { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Share,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, ScreenPadding, Shadows } from "@/constants/theme";
import { LinearGradient } from "expo-linear-gradient";
import { auth } from "@/lib/firebase";
import {
  createFamilyGroup,
  joinFamilyGroup,
  getMyFamilyGroup,
  getFamilyMembers,
  leaveFamilyGroup,
  type FamilyGroup,
} from "@/lib/familyStorage";
import { subscribeRemindersForUser, type Reminder } from "@/lib/reminderStorage";

export default function FamilyScreen() {
  const router = useRouter();
  const [group, setGroup] = useState<FamilyGroup | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [memberReminders, setMemberReminders] = useState<Record<string, Reminder[]>>({});
  const [loading, setLoading] = useState(true);
  const [groupName, setGroupName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [expandedMember, setExpandedMember] = useState<string | null>(null);

  const loadGroup = useCallback(async () => {
    setLoading(true);
    try {
      const g = await getMyFamilyGroup();
      setGroup(g);
      if (g) {
        const m = await getFamilyMembers(g.members);
        setMembers(m);
      } else {
        setMembers([]);
        setMemberReminders({});
      }
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadGroup();
    }, [loadGroup])
  );

  const memberUidsKey = useMemo(
    () => members.map((m) => m.uid as string).sort().join(","),
    [members]
  );

  useEffect(() => {
    const uids = memberUidsKey ? memberUidsKey.split(",").filter(Boolean) : [];
    if (uids.length === 0) {
      setMemberReminders({});
      return;
    }

    const unsubs = uids.map((uid) =>
      subscribeRemindersForUser(uid, (reminders) => {
        setMemberReminders((prev) => ({ ...prev, [uid]: reminders }));
      })
    );

    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }, [memberUidsKey]);

  const onCreateGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert("Hata", "Grup adı boş olamaz.");
      return;
    }
    setBusy(true);
    try {
      const g = await createFamilyGroup(groupName.trim());
      setGroup(g);
      await loadGroup();
    } catch (e: unknown) {
      Alert.alert("Hata", e instanceof Error ? e.message : "Bir hata oluştu");
    } finally {
      setBusy(false);
    }
  };

  const onJoinGroup = async () => {
    if (!inviteCode.trim()) {
      Alert.alert("Hata", "Davet kodu boş olamaz.");
      return;
    }
    setBusy(true);
    try {
      await joinFamilyGroup(inviteCode.trim());
      await loadGroup();
    } catch (e: unknown) {
      Alert.alert("Hata", e instanceof Error ? e.message : "Bir hata oluştu");
    } finally {
      setBusy(false);
    }
  };

  const onShareCode = async () => {
    if (!group) return;
    await Share.share({
      message: `Health Guide App'te aile grubuma katıl! Davet kodu: ${group.inviteCode}`,
    });
  };

  const onLeave = () => {
    if (!group) return;
    Alert.alert("Gruptan Ayrıl", "Bu gruptan ayrılmak istiyor musunuz?", [
      { text: "Vazgeç", style: "cancel" },
      {
        text: "Ayrıl",
        style: "destructive",
        onPress: async () => {
          await leaveFamilyGroup(group.id);
          setGroup(null);
          setMembers([]);
          setMemberReminders({});
        },
      },
    ]);
  };

  const currentUid = auth.currentUser?.uid;

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={s.headerTitle}>Aile Profili</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {!group ? (
          <View style={s.noGroupBox}>
            <LinearGradient
              colors={[`${Colors.primary}18`, `${Colors.primary}08`]}
              style={s.heroBox}
            >
              <Ionicons name="people" size={64} color={Colors.primary} />
              <Text style={s.heroTitle}>Aile Profili</Text>
              <Text style={s.heroSub}>
                Aile üyelerinizin ilaç takibini birlikte yönetin
              </Text>
            </LinearGradient>

            <View style={[s.card, Shadows.card]}>
              <Text style={s.cardTitle}>Yeni Grup Oluştur</Text>
              <TextInput
                style={s.input}
                placeholder="Grup adı (örn: Karadayı Ailesi)"
                placeholderTextColor={Colors.textSecondary}
                value={groupName}
                onChangeText={setGroupName}
              />
              <Pressable
                style={[s.primaryBtn, busy && { opacity: 0.7 }]}
                onPress={() => void onCreateGroup()}
                disabled={busy}
              >
                {busy ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={s.primaryBtnText}>Grup Oluştur</Text>
                )}
              </Pressable>
            </View>

            <View style={s.dividerRow}>
              <View style={s.divider} />
              <Text style={s.dividerText}>veya</Text>
              <View style={s.divider} />
            </View>

            <View style={[s.card, Shadows.card]}>
              <Text style={s.cardTitle}>Gruba Katıl</Text>
              <TextInput
                style={s.input}
                placeholder="Davet kodunu girin"
                placeholderTextColor={Colors.textSecondary}
                value={inviteCode}
                onChangeText={setInviteCode}
                autoCapitalize="characters"
                maxLength={6}
              />
              <Pressable
                style={[s.secondaryBtn, busy && { opacity: 0.7 }]}
                onPress={() => void onJoinGroup()}
                disabled={busy}
              >
                {busy ? (
                  <ActivityIndicator color={Colors.primary} />
                ) : (
                  <Text style={s.secondaryBtnText}>Gruba Katıl</Text>
                )}
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={s.groupBox}>
            <LinearGradient colors={[Colors.primary, "#059669"]} style={s.groupHero}>
              <Ionicons name="people" size={40} color="#fff" />
              <Text style={s.groupName}>{group.name}</Text>
              <Text style={s.groupMemberCount}>{group.members.length} üye</Text>
            </LinearGradient>

            <View style={[s.inviteCard, Shadows.card]}>
              <View style={s.inviteRow}>
                <View>
                  <Text style={s.inviteLabel}>Davet Kodu</Text>
                  <Text style={s.inviteCode}>{group.inviteCode}</Text>
                </View>
                <Pressable style={s.shareBtn} onPress={() => void onShareCode()}>
                  <Ionicons name="share-outline" size={20} color="#fff" />
                  <Text style={s.shareBtnText}>Paylaş</Text>
                </Pressable>
              </View>
            </View>

            <Text style={s.sectionTitle}>Üyeler</Text>
            {members.map((member) => {
              const isMe = member.uid === currentUid;
              const reminders = memberReminders[member.uid] ?? [];
              const activeReminders = reminders.filter((r) => r.active);
              const isExpanded = expandedMember === member.uid;

              return (
                <View key={member.uid} style={[s.memberCard, Shadows.card]}>
                  <Pressable
                    style={s.memberRow}
                    onPress={() => setExpandedMember(isExpanded ? null : member.uid)}
                  >
                    <View style={s.memberAvatar}>
                      {member.photoURL ? (
                        <Image source={{ uri: member.photoURL }} style={s.memberAvatarImg} />
                      ) : (
                        <Text style={s.memberAvatarText}>
                          {(member.displayName ?? "?").charAt(0).toUpperCase()}
                        </Text>
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={s.memberNameRow}>
                        <Text style={s.memberName}>{member.displayName ?? "Kullanıcı"}</Text>
                        {isMe && (
                          <View style={s.meBadge}>
                            <Text style={s.meBadgeText}>Ben</Text>
                          </View>
                        )}
                      </View>
                      <Text style={s.memberSub}>
                        {activeReminders.length > 0
                          ? `${activeReminders.length} aktif ilaç hatırlatıcısı`
                          : "Hatırlatıcı yok"}
                      </Text>
                    </View>
                    <Ionicons
                      name={isExpanded ? "chevron-up" : "chevron-down"}
                      size={20}
                      color={Colors.textSecondary}
                    />
                  </Pressable>

                  {isExpanded && (
                    <View style={s.remindersBox}>
                      {reminders.length === 0 ? (
                        <Text style={s.noReminders}>Henüz ilaç hatırlatıcısı yok</Text>
                      ) : (
                        reminders.map((r) => (
                          <View
                            key={r.id}
                            style={[s.reminderItem, !r.active && { opacity: 0.5 }]}
                          >
                            <View style={[s.reminderDot, { backgroundColor: r.color }]} />
                            <View style={{ flex: 1 }}>
                              <Text style={s.reminderName}>
                                {r.medicineName}
                                {r.dosage ? ` — ${r.dosage}` : ""}
                              </Text>
                              <Text style={s.reminderTimes}>
                                {r.times.join(", ")} · {r.days.join(", ")}
                              </Text>
                            </View>
                            <View
                              style={[
                                s.statusBadge,
                                {
                                  backgroundColor: r.active
                                    ? `${Colors.primary}18`
                                    : Colors.card,
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  s.statusText,
                                  {
                                    color: r.active ? Colors.primary : Colors.textSecondary,
                                  },
                                ]}
                              >
                                {r.active ? "Aktif" : "Pasif"}
                              </Text>
                            </View>
                          </View>
                        ))
                      )}
                    </View>
                  )}
                </View>
              );
            })}

            <Pressable style={s.leaveBtn} onPress={onLeave}>
              <Ionicons name="exit-outline" size={20} color="#ef4444" />
              <Text style={s.leaveBtnText}>Gruptan Ayrıl</Text>
            </Pressable>
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
  headerTitle: { fontSize: 17, fontWeight: "700", color: Colors.text },
  noGroupBox: { padding: ScreenPadding, gap: 16 },
  heroBox: {
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    gap: 12,
  },
  heroTitle: { fontSize: 24, fontWeight: "800", color: Colors.text },
  heroSub: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardTitle: { fontSize: 17, fontWeight: "700", color: Colors.text },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.text,
    backgroundColor: Colors.background,
  },
  primaryBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  secondaryBtn: {
    height: 48,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryBtnText: { color: Colors.primary, fontSize: 15, fontWeight: "700" },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  divider: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { color: Colors.textSecondary, fontSize: 14 },
  groupBox: { padding: ScreenPadding, gap: 16 },
  groupHero: {
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    gap: 8,
  },
  groupName: { fontSize: 22, fontWeight: "800", color: "#fff" },
  groupMemberCount: { fontSize: 14, color: "rgba(255,255,255,0.85)" },
  inviteCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inviteRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  inviteLabel: { fontSize: 13, color: Colors.textSecondary, marginBottom: 4 },
  inviteCode: {
    fontSize: 28,
    fontWeight: "800",
    color: Colors.primary,
    letterSpacing: 4,
  },
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  shareBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: Colors.text },
  memberCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  memberAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: `${Colors.primary}18`,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  memberAvatarImg: { width: 46, height: 46, borderRadius: 23 },
  memberAvatarText: { fontSize: 18, fontWeight: "700", color: Colors.primary },
  memberNameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  memberName: { fontSize: 16, fontWeight: "700", color: Colors.text },
  meBadge: {
    backgroundColor: `${Colors.primary}18`,
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  meBadgeText: { fontSize: 11, fontWeight: "700", color: Colors.primary },
  memberSub: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  remindersBox: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    padding: 14,
    gap: 10,
  },
  noReminders: { fontSize: 14, color: Colors.textSecondary, fontStyle: "italic" },
  reminderItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  reminderDot: { width: 10, height: 10, borderRadius: 5 },
  reminderName: { fontSize: 14, fontWeight: "600", color: Colors.text },
  reminderTimes: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  statusBadge: {
    borderRadius: 8,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  statusText: { fontSize: 11, fontWeight: "700" },
  leaveBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    justifyContent: "center",
    backgroundColor: "rgba(239,68,68,0.1)",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.3)",
    marginTop: 8,
  },
  leaveBtnText: { color: "#ef4444", fontWeight: "700", fontSize: 15 },
});
