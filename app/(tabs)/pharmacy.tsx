import { useCallback, useState } from "react";
import {
  View, Text, StyleSheet, Pressable, ScrollView,
  Linking, Alert, TextInput, Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import { Colors, ScreenPadding, Shadows } from "@/constants/theme";
import { LinearGradient } from "expo-linear-gradient";

const RECENT_SEARCHES_KEY = "pharmacyRecentSearches";
const MAX_RECENT = 5;

const MOCK_PHARMACIES = [
  { id: "1", name: "Merkez Eczanesi", address: "Kadıköy, İstanbul", hours: "08:00–22:00", lat: 40.9918, lng: 29.0281, isOpen: true },
  { id: "2", name: "Sağlık Eczanesi", address: "Beşiktaş, İstanbul", hours: "09:00–21:00", lat: 41.0439, lng: 29.0053, isOpen: true },
  { id: "3", name: "Yeşil Haç Eczanesi", address: "Çankaya, Ankara", hours: "08:30–20:00", lat: 39.9179, lng: 32.8627, isOpen: false },
  { id: "4", name: "Nöbetçi Eczane", address: "Şişli, İstanbul", hours: "24 Saat", lat: 41.0607, lng: 28.9874, isOpen: true },
  { id: "5", name: "Güven Eczanesi", address: "Üsküdar, İstanbul", hours: "08:00–21:00", lat: 41.0228, lng: 29.0157, isOpen: false },
];

const MAP_PREVIEW_URL =
  "https://maps.googleapis.com/maps/api/staticmap?center=41.0082,28.9784&zoom=13&size=600x200&maptype=roadmap&markers=color:green%7C40.9918,29.0281&markers=color:green%7C41.0439,29.0053&key=YOUR_API_KEY";

export default function PharmacyScreen() {
  const [search, setSearch] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        const raw = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
        if (raw) setRecentSearches(JSON.parse(raw));
      };
      void load();
    }, [])
  );

  const saveSearch = async (query: string) => {
    if (!query.trim()) return;
    const updated = [query, ...recentSearches.filter((s) => s !== query)].slice(0, MAX_RECENT);
    setRecentSearches(updated);
    await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  };

  const removeRecent = async (item: string) => {
    const updated = recentSearches.filter((s) => s !== item);
    setRecentSearches(updated);
    await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  };

  const openUrl = async (url: string) => {
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      Alert.alert("Bağlantı açılamadı", "Harita bağlantısı şu anda açılamıyor.");
      return;
    }
    await Linking.openURL(url);
  };

  const handleSearch = async () => {
    if (!search.trim()) return;
    await saveSearch(search.trim());
    await openUrl(
      `https://www.google.com/maps/search/${encodeURIComponent(search + " eczane")}`
    );
  };

  const handleNearby = async () => {
    await saveSearch("Yakınımdaki eczaneler");
    await openUrl("https://www.google.com/maps/search/eczane/@41.0082,28.9784,14z");
  };

  const filtered = MOCK_PHARMACIES.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.address.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Eczane Bul</Text>
            <Text style={styles.subtitle}>Yakınınızdaki eczaneleri keşfedin</Text>
          </View>
          <View style={styles.headerIcon}>
            <Ionicons name="medical" size={28} color={Colors.primary} />
          </View>
        </View>

        {/* Arama Kutusu */}
        <View style={[styles.searchBox, Shadows.card]}>
          <Ionicons name="search" size={20} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Eczane veya konum ara..."
            placeholderTextColor={Colors.textSecondary}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={() => void handleSearch()}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={20} color={Colors.textSecondary} />
            </Pressable>
          )}
        </View>

        {/* Yakınımdaki Eczaneler Butonu */}
        <Pressable style={[styles.nearbyBtn, Shadows.card]} onPress={() => void handleNearby()}>
          <LinearGradient
            colors={["#16A34A", "#059669"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.nearbyBtnInner}
          >
            <Ionicons name="location" size={22} color="#fff" />
            <Text style={styles.nearbyBtnText}>Yakınımdaki Eczaneleri Bul</Text>
            <Ionicons name="chevron-forward" size={20} color="#fff" />
          </LinearGradient>
        </Pressable>

        {/* Harita Önizleme */}
        <Pressable
          style={[styles.mapPreview, Shadows.card]}
          onPress={() => void openUrl("https://www.google.com/maps/search/eczane/@41.0082,28.9784,14z")}
        >
          <LinearGradient
            colors={["#e8f5e9", "#c8e6c9"]}
            style={styles.mapPlaceholder}
          >
            <Ionicons name="map" size={48} color={Colors.primary} />
            <Text style={styles.mapPlaceholderText}>Haritada Görüntüle</Text>
            <Text style={styles.mapPlaceholderSub}>Google Maps'te aç</Text>
          </LinearGradient>
        </Pressable>

        {/* Son Aramalar */}
        {recentSearches.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Son Aramalar</Text>
            <View style={styles.recentList}>
              {recentSearches.map((item) => (
                <View key={item} style={[styles.recentChip, Shadows.card]}>
                  <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
                  <Pressable
                    style={{ flex: 1 }}
                    onPress={() => {
                      setSearch(item);
                      void openUrl(
                        `https://www.google.com/maps/search/${encodeURIComponent(item + " eczane")}`
                      );
                    }}
                  >
                    <Text style={styles.recentChipText}>{item}</Text>
                  </Pressable>
                  <Pressable onPress={() => void removeRecent(item)} hitSlop={8}>
                    <Ionicons name="close" size={14} color={Colors.textSecondary} />
                  </Pressable>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Eczane Listesi */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {search ? `"${search}" sonuçları` : "Yakın Eczaneler"}
          </Text>
          {filtered.map((p) => (
            <Pressable
              key={p.id}
              style={[styles.card, Shadows.card]}
              onPress={() =>
                void openUrl(
                  `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}&travelmode=driving`
                )
              }
            >
              <View style={[styles.cardIcon, p.isOpen ? styles.cardIconOpen : styles.cardIconClosed]}>
                <Ionicons name="medical" size={22} color={p.isOpen ? Colors.primary : Colors.textSecondary} />
              </View>
              <View style={styles.cardBody}>
                <View style={styles.cardNameRow}>
                  <Text style={styles.cardName}>{p.name}</Text>
                  <View style={[styles.statusBadge, p.isOpen ? styles.statusOpen : styles.statusClosed]}>
                    <Text style={[styles.statusText, p.isOpen ? styles.statusTextOpen : styles.statusTextClosed]}>
                      {p.isOpen ? "Açık" : "Kapalı"}
                    </Text>
                  </View>
                </View>
                <Text style={styles.cardMeta}>{p.address}</Text>
                <View style={styles.cardHoursRow}>
                  <Ionicons name="time-outline" size={12} color={Colors.textSecondary} />
                  <Text style={styles.cardHours}>{p.hours}</Text>
                </View>
              </View>
              <View style={styles.navigateBtn}>
                <Ionicons name="navigate" size={18} color={Colors.primary} />
              </View>
            </Pressable>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: ScreenPadding, paddingBottom: 32, paddingTop: 8 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  headerIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: `${Colors.primary}18`,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 26, fontWeight: "800", color: Colors.text },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: { flex: 1, fontSize: 15, color: Colors.text },
  nearbyBtn: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
  },
  nearbyBtnInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 18,
    gap: 10,
  },
  nearbyBtnText: { flex: 1, fontSize: 16, color: "#FFFFFF", fontWeight: "700" },
  mapPreview: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  mapPlaceholder: {
    height: 140,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  mapPlaceholderText: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.primary,
  },
  mapPlaceholderSub: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  section: { marginBottom: 8 },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 12,
  },
  recentList: { gap: 8, marginBottom: 16 },
  recentChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  recentChipText: { flex: 1, fontSize: 14, color: Colors.text, fontWeight: "500" },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  cardIconOpen: { backgroundColor: `${Colors.primary}18` },
  cardIconClosed: { backgroundColor: "#f1f5f9" },
  cardBody: { flex: 1 },
  cardNameRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  cardName: { fontSize: 15, fontWeight: "700", color: Colors.text },
  statusBadge: {
    borderRadius: 999,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  statusOpen: { backgroundColor: "#dcfce7" },
  statusClosed: { backgroundColor: "#f1f5f9" },
  statusText: { fontSize: 11, fontWeight: "700" },
  statusTextOpen: { color: "#16a34a" },
  statusTextClosed: { color: "#94a3b8" },
  cardMeta: { fontSize: 13, color: Colors.textSecondary, marginTop: 3 },
  cardHoursRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  cardHours: { fontSize: 12, color: Colors.textSecondary, fontWeight: "500" },
  navigateBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: `${Colors.primary}12`,
    alignItems: "center",
    justifyContent: "center",
  },
});
