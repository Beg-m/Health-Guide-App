import { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter, type Href } from "expo-router";
import { Colors, ScreenPadding, Shadows } from "@/constants/theme";

const KEY_HAS_SEEN_ONBOARDING = "hasSeenOnboarding";

type Slide = {
  emoji: string;
  title: string;
  description: string;
};

const SLIDES: Slide[] = [
  {
    emoji: "💊",
    title: "İlaçlarınızı Tanıyın",
    description: "100+ ilaç hakkında sade ve anlaşılır bilgiye tek yerden ulaşın.",
  },
  {
    emoji: "🤖",
    title: "AI Sağlık Asistanı",
    description: "İlaç etkileşimleri, dozaj ve yan etkiler hakkında anında yanıt alın.",
  },
  {
    emoji: "🏥",
    title: "Kişisel Sağlık Profili",
    description:
      "Vegan, diyabetik veya laktozsuz profilinize göre kişiselleştirilmiş öneriler.",
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const listRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);
  const isLast = index === SLIDES.length - 1;

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / width);
    setIndex(Math.max(0, Math.min(SLIDES.length - 1, next)));
  };

  const finish = async () => {
    await AsyncStorage.setItem(KEY_HAS_SEEN_ONBOARDING, "true");
    router.replace("/auth" as Href);
  };

  const next = () => {
    if (isLast) {
      void finish();
      return;
    }
    const target = index + 1;
    listRef.current?.scrollTo({ x: target * width, y: 0, animated: true });
    setIndex(target);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.topBar}>
        {!isLast ? (
          <Pressable onPress={() => void finish()} hitSlop={8}>
            <Text style={styles.skipText}>Atla</Text>
          </Pressable>
        ) : (
          <View />
        )}
      </View>

      <ScrollView
        ref={listRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        bounces={false}
      >
        {SLIDES.map((slide) => (
          <View key={slide.title} style={[styles.slide, { width }]}>
            <View style={[styles.iconWrap, Shadows.card]}>
              <Text style={styles.iconText}>{slide.emoji}</Text>
            </View>
            <Text style={styles.title}>{slide.title}</Text>
            <Text style={styles.description}>{slide.description}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.bottom}>
        <View style={styles.dots}>
          {SLIDES.map((s, i) => (
            <View
              key={s.title}
              style={[styles.dot, i === index && styles.dotActive]}
            />
          ))}
        </View>

        <Pressable style={[styles.cta, Shadows.card]} onPress={next}>
          <Text style={styles.ctaText}>{isLast ? "Başla" : "İleri"}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  topBar: {
    height: 48,
    alignItems: "flex-end",
    justifyContent: "center",
    paddingHorizontal: ScreenPadding,
  },
  skipText: {
    color: Colors.primary,
    fontSize: 15,
    fontWeight: "700",
  },
  slide: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: ScreenPadding,
  },
  iconWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(0,168,107,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },
  iconText: {
    fontSize: 56,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: Colors.text,
    textAlign: "center",
    marginBottom: 14,
  },
  description: {
    fontSize: 17,
    lineHeight: 26,
    color: Colors.textSecondary,
    textAlign: "center",
    maxWidth: 340,
  },
  bottom: {
    paddingHorizontal: ScreenPadding,
    paddingBottom: 18,
    paddingTop: 10,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginBottom: 18,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(0,168,107,0.24)",
  },
  dotActive: {
    width: 18,
    backgroundColor: Colors.primary,
  },
  cta: {
    height: 52,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
});
