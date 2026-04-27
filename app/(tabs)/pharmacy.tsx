import { View, Text, StyleSheet, Pressable, ScrollView, Linking, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors, ScreenPadding, Shadows } from "@/constants/theme";

const MOCK_PHARMACIES = [
  {
    id: "1",
    name: "Merkez Eczanesi",
    address: "Kadıköy, İstanbul",
    hours: "08:00–22:00",
    lat: 40.9918,
    lng: 29.0281,
  },
  {
    id: "2",
    name: "Sağlık Eczanesi",
    address: "Beşiktaş, İstanbul",
    hours: "09:00–21:00",
    lat: 41.0439,
    lng: 29.0053,
  },
  {
    id: "3",
    name: "Yeşil Haç Eczanesi",
    address: "Çankaya, Ankara",
    hours: "08:30–20:00",
    lat: 39.9179,
    lng: 32.8627,
  },
];

export default function PharmacyScreen() {
  const openUrl = async (url: string) => {
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      Alert.alert("Bağlantı açılamadı", "Harita bağlantısı şu anda açılamıyor.");
      return;
    }
    await Linking.openURL(url);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Eczane</Text>
        <Text style={styles.subtitle}>
          Yakınınızdaki eczaneleri harita ve liste ile yakında burada görebileceksiniz.
        </Text>

        <Pressable
          style={[styles.nearbyBtn, Shadows.card]}
          onPress={() =>
            void openUrl("https://www.google.com/maps/search/eczane/@41.0082,28.9784,14z")
          }
        >
          <Text style={styles.nearbyBtnText}>📍 Yakınımdaki Eczaneleri Bul</Text>
        </Pressable>

        <Text style={styles.sectionTitle}>Örnek liste</Text>
        {MOCK_PHARMACIES.map((p) => (
          <View key={p.id} style={[styles.card, Shadows.card]}>
            <View style={styles.cardIcon}>
              <Ionicons name="medical" size={22} color={Colors.primary} />
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardName}>{p.name}</Text>
              <Text style={styles.cardMeta}>{p.address}</Text>
              <Text style={styles.cardHours}>{p.hours}</Text>
              <Pressable
                style={styles.routeBtn}
                onPress={() =>
                  void openUrl(
                    `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}&travelmode=driving`
                  )
                }
              >
                <Text style={styles.routeBtnText}>Yol Tarifi Al</Text>
              </Pressable>
            </View>
            <Ionicons name="navigate-outline" size={22} color={Colors.textSecondary} />
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: ScreenPadding,
    paddingBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: 20,
  },
  nearbyBtn: {
    backgroundColor: "#16A34A",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#15803D",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    paddingHorizontal: 14,
    marginBottom: 28,
  },
  nearbyBtnText: {
    fontSize: 17,
    color: "#FFFFFF",
    fontWeight: "700",
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 12,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.background,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: `${Colors.primary}18`,
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: { flex: 1 },
  cardName: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
  },
  cardMeta: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  cardHours: {
    fontSize: 12,
    color: Colors.primary,
    marginTop: 4,
    fontWeight: "500",
  },
  routeBtn: {
    alignSelf: "flex-start",
    marginTop: 10,
    backgroundColor: "#16A34A",
    borderRadius: 9,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  routeBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
});
