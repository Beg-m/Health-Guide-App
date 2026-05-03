import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Shadows, ScreenPadding } from "@/constants/theme";
import { getRecipeById } from "@/constants/recipesBlog";

const BLOG_GREEN = "#16a34a";

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const recipe = typeof id === "string" ? getRecipeById(id) : undefined;

  if (!recipe) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>Tarif bulunamadı.</Text>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.errorLink}>Geri dön</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={[styles.topBar, Shadows.card]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.topTitle} numberOfLines={1}>
          Tarif
        </Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.heroPlaceholder, { backgroundColor: `${BLOG_GREEN}18` }]}>
          <Ionicons name="image-outline" size={48} color={BLOG_GREEN} />
          <Text style={styles.heroLabel}>Görsel önizleme</Text>
        </View>

        <Text style={styles.title}>{recipe.title}</Text>
        <Text style={styles.author}>{recipe.author}</Text>

        <View style={styles.metaRow}>
          <View style={styles.metaChip}>
            <Ionicons name="time-outline" size={18} color={BLOG_GREEN} />
            <Text style={styles.metaText}>{recipe.prepMinutes} dk</Text>
          </View>
        </View>

        <View style={styles.tagsRow}>
          {recipe.tags.map((tag) => (
            <View key={tag} style={[styles.tag, { backgroundColor: `${BLOG_GREEN}22` }]}>
              <Text style={[styles.tagText, { color: BLOG_GREEN }]}>{tag}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Özet</Text>
        <Text style={styles.body}>{recipe.summary}</Text>

        <Text style={styles.sectionTitle}>Malzemeler</Text>
        {recipe.ingredients.map((line, i) => (
          <View key={i} style={styles.bulletRow}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.body}>{line}</Text>
          </View>
        ))}

        <Text style={styles.sectionTitle}>Hazırlanış</Text>
        {recipe.steps.map((line, i) => (
          <View key={i} style={styles.stepRow}>
            <Text style={styles.stepNum}>{i + 1}.</Text>
            <Text style={styles.body}>{line}</Text>
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
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: ScreenPadding,
    paddingVertical: 12,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  topTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "700",
    color: Colors.text,
  },
  scroll: {
    paddingBottom: 32,
  },
  heroPlaceholder: {
    height: 200,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  heroLabel: {
    marginTop: 8,
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.text,
    paddingHorizontal: ScreenPadding,
  },
  author: {
    marginTop: 6,
    fontSize: 15,
    color: Colors.textSecondary,
    paddingHorizontal: ScreenPadding,
  },
  metaRow: {
    flexDirection: "row",
    paddingHorizontal: ScreenPadding,
    marginTop: 12,
    gap: 10,
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.card,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  metaText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: ScreenPadding,
    marginTop: 14,
    marginBottom: 8,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  tagText: {
    fontSize: 12,
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
    paddingHorizontal: ScreenPadding,
    marginTop: 20,
    marginBottom: 8,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: Colors.text,
    paddingHorizontal: ScreenPadding,
  },
  bulletRow: {
    flexDirection: "row",
    paddingHorizontal: ScreenPadding,
    gap: 8,
    marginBottom: 6,
  },
  bullet: {
    fontSize: 15,
    color: BLOG_GREEN,
    fontWeight: "700",
    width: 14,
  },
  stepRow: {
    flexDirection: "row",
    paddingHorizontal: ScreenPadding,
    gap: 8,
    marginBottom: 10,
  },
  stepNum: {
    fontSize: 15,
    fontWeight: "700",
    color: BLOG_GREEN,
    minWidth: 22,
  },
  errorBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: ScreenPadding,
  },
  errorText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  errorLink: {
    fontSize: 16,
    fontWeight: "600",
    color: BLOG_GREEN,
  },
});
