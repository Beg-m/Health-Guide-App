import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors, ScreenPadding, Shadows } from "@/constants/theme";

const MOCK_PHARMACIES = [
  { id: "1", name: "Merkez Eczanesi", address: "Kadıköy, İstanbul", hours: "08:00–22:00" },
  { id: "2", name: "Sağlık Eczanesi", address: "Beşiktaş, İstanbul", hours: "09:00–21:00" },
  { id: "3", name: "Yeşil Haç Eczanesi", address: "Çankaya, Ankara", hours: "08:30–20:00" },
];

export default function PharmacyScreen() {
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

        <Pressable style={[styles.mapPlaceholder, Shadows.card]}>
          <Ionicons name="map-outline" size={40} color={Colors.primary} />
          <Text style={styles.mapText}>Harita görünümü (yakında)</Text>
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
  mapPlaceholder: {
    height: 160,
    backgroundColor: Colors.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
    gap: 8,
  },
  mapText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: "500",
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
});
