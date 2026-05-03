import { useState, useMemo, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  SectionList,
  type SectionList as SectionListType,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  Colors,
  Gradients,
  Radii,
  Shadows,
  ScreenPadding,
  headerTitleStyle,
  medicineAccentColor,
} from "@/constants/theme";
import { FadeInView } from "@/components/FadeInView";
import { PressableScale } from "@/components/PressableScale";
import {
  filterMedicinesBySearch,
  sortMedicinesByName,
  truncateText,
  type MedicineMode,
  type MedicineRecord,
} from "@/constants/medicines";

type MedicineSection = {
  title: string;
  data: MedicineRecord[];
};

function previewUsage(m: MedicineRecord, mode: MedicineMode): string {
  const raw =
    mode === "basic"
      ? (m.basicUsage || m.usage || "").trim() || "—"
      : (m.medicalUsage || m.usage || "").trim() || "—";
  if (mode === "basic") {
    return truncateText(raw, 160);
  }
  return truncateText(raw, 220);
}

/** First grouping key: Turkish uppercase letter, or "#" for non-letters. */
function firstSectionLetter(name: string): string {
  const t = name.trim();
  if (!t) return "#";
  const ch = Array.from(t)[0] ?? "";
  if (/[\p{L}]/u.test(ch)) {
    return ch.toLocaleUpperCase("tr-TR");
  }
  return "#";
}

function buildMedicineSections(medicines: MedicineRecord[]): MedicineSection[] {
  const sorted = sortMedicinesByName(medicines);
  const map = new Map<string, MedicineRecord[]>();
  for (const m of sorted) {
    const letter = firstSectionLetter(m.name);
    const arr = map.get(letter);
    if (arr) arr.push(m);
    else map.set(letter, [m]);
  }
  const titles = Array.from(map.keys()).sort((a, b) => {
    if (a === "#") return 1;
    if (b === "#") return -1;
    return a.localeCompare(b, "tr", { sensitivity: "base" });
  });
  return titles.map((title) => ({ title, data: map.get(title)! }));
}

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<MedicineMode>("basic");
  const listRef = useRef<SectionListType<MedicineRecord, MedicineSection>>(null);

  const filtered = useMemo(() => filterMedicinesBySearch(query), [query]);
  const sections = useMemo(() => buildMedicineSections(filtered), [filtered]);

  const scrollToSection = useCallback((sectionIndex: number) => {
    const list = listRef.current;
    if (!list || sectionIndex < 0) return;
    requestAnimationFrame(() => {
      try {
        list.scrollToLocation({
          sectionIndex,
          itemIndex: 0,
          animated: true,
          viewOffset: 0,
          viewPosition: 0,
        });
      } catch {
        setTimeout(() => {
          try {
            list.scrollToLocation({
              sectionIndex,
              itemIndex: 0,
              animated: true,
            });
          } catch {
            /* layout not ready */
          }
        }, 100);
      }
    });
  }, []);

  const renderSectionHeader = useCallback(
    ({ section }: { section: MedicineSection }) => (
      <LinearGradient
        colors={["#ecfdf5", "#d1fae5"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.sectionHeader}
      >
        <Text style={styles.sectionHeaderText}>{section.title}</Text>
      </LinearGradient>
    ),
    []
  );

  const renderItem = useCallback(
    ({ item: m }: { item: MedicineRecord }) => {
      const ingredient = m.activeIngredient.trim() ? m.activeIngredient : "—";
      const accent = medicineAccentColor(m.id);
      return (
        <PressableScale
          style={[styles.card, Shadows.cardMedium]}
          onPress={() => router.push(`/medicine/${m.id}`)}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.cardName} numberOfLines={3}>
              {m.name}
            </Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
          </View>
          <View style={styles.ingredientPill}>
            <Text style={styles.ingredientPillText} numberOfLines={2}>
              {ingredient}
            </Text>
          </View>
          <Text style={styles.cardLine}>
            <Text style={styles.cardKey}>Kullanım: </Text>
            {previewUsage(m, mode)}
          </Text>
          <View style={[styles.cardAccentBar, { backgroundColor: accent }]} />
        </PressableScale>
      );
    },
    [mode, router]
  );

  const keyExtractor = useCallback((item: MedicineRecord, index: number) => {
    return `${item.id}-${item.name}-${index}`;
  }, []);

  const listEmpty =
    query.trim() && filtered.length === 0 ? (
      <Text style={styles.empty}>Sonuç bulunamadı.</Text>
    ) : null;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <FadeInView style={{ flex: 1 }}>
      <View style={styles.top}>
        <Text style={styles.title}>İlaç Ara</Text>
        <View style={styles.searchRow}>
          <Ionicons name="search" size={20} color={Colors.textSecondary} />
          <TextInput
            style={styles.input}
            placeholder="İlaç adı ile arayın (Türkçe karakter destekli)…"
            placeholderTextColor={Colors.textSecondary}
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery("")} hitSlop={8}>
              <Ionicons name="close-circle" size={20} color={Colors.textSecondary} />
            </Pressable>
          )}
        </View>

        <View style={styles.modeRow}>
          <Text style={styles.modeLabel}>Görünüm:</Text>
          <View style={styles.toggle}>
            <Pressable onPress={() => setMode("basic")} style={styles.toggleBtn}>
              {mode === "basic" ? (
                <LinearGradient
                  colors={[...Gradients.button]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.toggleBtnGrad}
                >
                  <Text style={styles.toggleTextActive}>Basic Mode</Text>
                </LinearGradient>
              ) : (
                <Text style={styles.toggleText}>Basic Mode</Text>
              )}
            </Pressable>
            <Pressable onPress={() => setMode("medical")} style={styles.toggleBtn}>
              {mode === "medical" ? (
                <LinearGradient
                  colors={[...Gradients.button]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.toggleBtnGrad}
                >
                  <Text style={styles.toggleTextActive}>Medical Mode</Text>
                </LinearGradient>
              ) : (
                <Text style={styles.toggleText}>Medical Mode</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>

      {!query.trim() && (
        <Text style={styles.hint}>
          Tüm ilaçlar ada göre A–Z sıralıdır. İsterseniz isim, etken madde veya kullanım metni
          ile arayarak daraltın.
        </Text>
      )}

      <View style={styles.listWrap}>
        <SectionList<MedicineRecord, MedicineSection>
          ref={listRef}
          style={styles.list}
          sections={sections}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          stickySectionHeadersEnabled
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={listEmpty}
        />

        {sections.length > 0 && (
          <View style={styles.alphaIndex} pointerEvents="box-none">
            <View style={styles.alphaIndexInner}>
              {sections.map((s, sectionIndex) => (
                <Pressable
                  key={s.title}
                  onPress={() => scrollToSection(sectionIndex)}
                  hitSlop={{ top: 2, bottom: 2, left: 8, right: 8 }}
                >
                  <Text style={styles.alphaLetter}>{s.title}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </View>
      </FadeInView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  top: {
    paddingHorizontal: ScreenPadding,
    paddingBottom: 12,
  },
  title: {
    fontSize: 24,
    ...headerTitleStyle,
    color: Colors.text,
    marginBottom: 16,
    letterSpacing: 0.45,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    borderRadius: Radii.card,
    paddingHorizontal: ScreenPadding,
    paddingVertical: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    paddingVertical: 4,
  },
  modeRow: {
    marginTop: 16,
  },
  modeLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  toggle: {
    flexDirection: "row",
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  toggleBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    overflow: "hidden",
  },
  toggleBtnGrad: {
    width: "100%",
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 12,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textSecondary,
    paddingVertical: 12,
    textAlign: "center",
  },
  toggleTextActive: {
    color: "#FFFFFF",
  },
  hint: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 8,
    paddingHorizontal: ScreenPadding + 12,
  },
  listWrap: {
    flex: 1,
    position: "relative",
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingLeft: ScreenPadding,
    paddingRight: 32,
    paddingBottom: 24,
  },
  sectionHeader: {
    paddingVertical: 12,
    paddingHorizontal: ScreenPadding,
    marginLeft: -ScreenPadding,
    marginRight: -32,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: `${Colors.primary}33`,
    borderLeftWidth: 5,
    borderLeftColor: Colors.primary,
  },
  sectionHeaderText: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.primaryDark,
    textAlign: "left",
    letterSpacing: 0.55,
  },
  card: {
    backgroundColor: Colors.background,
    borderRadius: Radii.card,
    padding: ScreenPadding,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
    position: "relative",
  },
  cardAccentBar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
    borderTopLeftRadius: Radii.card,
    borderBottomLeftRadius: Radii.card,
  },
  ingredientPill: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(0,168,107,0.12)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 10,
    maxWidth: "100%",
    borderWidth: 1,
    borderColor: "rgba(0,168,107,0.22)",
  },
  ingredientPillText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.primaryDark,
    lineHeight: 18,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
    gap: 8,
  },
  cardName: {
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    color: Colors.text,
  },
  cardLine: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    marginTop: 4,
  },
  cardKey: {
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  empty: {
    textAlign: "center",
    color: Colors.textSecondary,
    marginTop: 32,
    fontSize: 15,
    paddingHorizontal: ScreenPadding,
  },
  alphaIndex: {
    position: "absolute",
    right: 2,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  alphaIndexInner: {
    alignItems: "center",
  },
  alphaLetter: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.textSecondary,
    lineHeight: 14,
    paddingVertical: 0.5,
  },
});
