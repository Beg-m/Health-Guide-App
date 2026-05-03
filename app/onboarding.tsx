import { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Platform,
  Animated,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, type Href } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import { ScreenPadding } from "@/constants/theme";
import {
  CONDITION_OPTIONS,
  STORAGE_USER_CONDITIONS,
} from "@/constants/onboardingStorage";

const ACCENT_GREEN = "#16a34a";

const SLIDE_GRADIENTS: readonly [
  readonly [string, string],
  readonly [string, string],
  readonly [string, string],
] = [
  ["#16a34a", "#059669"],
  ["#059669", "#0d9488"],
  ["#0d9488", "#0891b2"],
];

const BENEFIT_BADGES = [
  { key: "m", label: "💊 100+ İlaç" },
  { key: "r", label: "🔔 Hatırlatmalar" },
  { key: "a", label: "🤖 AI Asistan" },
] as const;

const FEATURE_PREVIEWS = [
  {
    emoji: "🍽️",
    title: "Sağlıklı Tarifler",
    desc: "Topluluğun tarifleri",
  },
  {
    emoji: "💊",
    title: "İlaç Rehberi",
    desc: "100+ ilaç bilgisi",
  },
  {
    emoji: "🤖",
    title: "AI Asistan",
    desc: "7/24 sağlık rehberi",
  },
] as const;

function BackgroundDecor() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[styles.decorCircle, { top: "8%", left: "-8%", width: 140, height: 140 }]} />
      <View style={[styles.decorCircle, { top: "22%", right: "-5%", width: 96, height: 96 }]} />
      <View style={[styles.decorCircle, { bottom: "18%", left: "5%", width: 200, height: 200 }]} />
      <View style={[styles.decorCircle, { bottom: "8%", right: "-10%", width: 160, height: 160 }]} />
    </View>
  );
}

export default function OnboardingScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const listRef = useRef<ScrollView>(null);
  const floatY = useRef(new Animated.Value(0)).current;
  const [index, setIndex] = useState(0);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [scrollViewportH, setScrollViewportH] = useState(0);

  const slideHeight =
    scrollViewportH > 0
      ? scrollViewportH
      : Math.max(320, height - insets.top - insets.bottom - 180);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatY, {
          toValue: 1,
          duration: 2200,
          useNativeDriver: true,
        }),
        Animated.timing(floatY, {
          toValue: 0,
          duration: 2200,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [floatY]);

  const emojiTranslate = floatY.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });

  const persistConditions = useCallback(async (next: string[]) => {
    await AsyncStorage.setItem(STORAGE_USER_CONDITIONS, JSON.stringify(next));
  }, []);

  const toggleCondition = (label: string) => {
    if (Platform.OS !== "web") {
      Haptics.selectionAsync();
    }
    setSelectedConditions((prev) => {
      const next = prev.includes(label)
        ? prev.filter((x) => x !== label)
        : [...prev, label];
      void persistConditions(next);
      return next;
    });
  };

  const completeOnboarding = async () => {
    await AsyncStorage.setItem("onboardingCompleted", "true");
    await persistConditions(selectedConditions);
    router.replace("/auth" as Href);
  };

  const onSkip = () => {
    void completeOnboarding();
  };

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / width);
    setIndex(Math.max(0, Math.min(2, next)));
  };

  const goNext = () => {
    const target = index + 1;
    if (target > 2) return;
    listRef.current?.scrollTo({ x: target * width, y: 0, animated: true });
    setIndex(target);
  };

  const isLast = index === 2;

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.topBar}>
          {index < 2 ? (
            <Pressable onPress={() => void onSkip()} hitSlop={12} style={styles.skipHit}>
              <Text style={styles.skipText}>Atla</Text>
            </Pressable>
          ) : (
            <View style={styles.skipPlaceholder} />
          )}
        </View>

        <View
          style={styles.scrollMeasure}
          onLayout={(e) => setScrollViewportH(e.nativeEvent.layout.height)}
        >
          <ScrollView
            ref={listRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={onScrollEnd}
            decelerationRate="fast"
            style={{ height: slideHeight }}
          >
            {/* Slide 1 */}
            <LinearGradient
              colors={[...SLIDE_GRADIENTS[0]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.slide, { width, minHeight: slideHeight }]}
            >
              <BackgroundDecor />
              <View style={styles.slideInner}>
                <Animated.View style={{ transform: [{ translateY: emojiTranslate }] }}>
                  <Text style={styles.emojiHero} accessibilityLabel="">
                    💊
                  </Text>
                </Animated.View>
                <View style={styles.badgeRow}>
                  {BENEFIT_BADGES.map((b) => (
                    <View key={b.key} style={styles.benefitBadge}>
                      <Text style={styles.benefitBadgeText}>{b.label}</Text>
                    </View>
                  ))}
                </View>
                <Text style={styles.titleSlide1}>İlaçlarınızı Tanıyın</Text>
                <Text style={styles.subtitleSlide1}>
                  100&apos;den fazla ilaç hakkında sade ve anlaşılır bilgiye ulaşın
                </Text>
              </View>
            </LinearGradient>

            {/* Slide 2 */}
            <LinearGradient
              colors={[...SLIDE_GRADIENTS[1]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.slide, { width, minHeight: slideHeight }]}
            >
              <BackgroundDecor />
              <ScrollView
                style={styles.slide2Scroll}
                contentContainerStyle={styles.slide2ScrollContent}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled
              >
                <Text style={styles.emojiMedium}>🎯</Text>
                <Text style={styles.titleSlide2}>Size Özel Deneyim</Text>
                <Text style={styles.subtitleSlide2}>
                  Sağlık durumunuza göre kişiselleştirilmiş bilgi ve tarifler
                </Text>
                <Text style={styles.chipHint}>Seçimlerinize göre içerikler filtrelenecek</Text>
                <Text style={styles.chipsHeading}>İlgilendiğiniz konular</Text>
                <View style={styles.chipWrap}>
                  {CONDITION_OPTIONS.map((label) => {
                    const on = selectedConditions.includes(label);
                    return (
                      <Pressable
                        key={label}
                        onPress={() => toggleCondition(label)}
                        style={[styles.chip, on ? styles.chipOn : styles.chipOff]}
                      >
                        <Text
                          style={[styles.chipText, on ? styles.chipTextOn : styles.chipTextOff]}
                        >
                          {on ? "✓ " : ""}
                          {label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </ScrollView>
            </LinearGradient>

            {/* Slide 3 */}
            <LinearGradient
              colors={[...SLIDE_GRADIENTS[2]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.slide, { width, minHeight: slideHeight }]}
            >
              <BackgroundDecor />
              <ScrollView
                contentContainerStyle={styles.slide3Scroll}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled
              >
                <Text style={styles.emojiMedium}>🌟</Text>
                <Text style={styles.titleSlide2}>Sağlıklı Yaşama Hazır mısınız?</Text>
                <Text style={styles.subtitleSlide2}>
                  Topluluğumuzla sağlıklı tarifleri keşfedin ve ilaç hatırlatıcınızı kurun
                </Text>
                <View style={styles.previewList}>
                  {FEATURE_PREVIEWS.map((card) => (
                    <View key={card.title} style={styles.previewCard}>
                      <Text style={styles.previewEmoji}>{card.emoji}</Text>
                      <View style={styles.previewTextCol}>
                        <Text style={styles.previewTitle}>{card.title}</Text>
                        <Text style={styles.previewDesc}>{card.desc}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </LinearGradient>
          </ScrollView>
        </View>

        <View style={styles.footer}>
          <View style={styles.dots}>
            {[0, 1, 2].map((i) => (
              <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
            ))}
          </View>

          {isLast ? (
            <Pressable
              style={({ pressed }) => [styles.ctaFinal, pressed && { opacity: 0.94 }]}
              onPress={() => void completeOnboarding()}
            >
              <Text style={styles.ctaFinalText}>Başlayalım!</Text>
            </Pressable>
          ) : (
            <Pressable
              style={({ pressed }) => [styles.ctaSecondary, pressed && { opacity: 0.9 }]}
              onPress={goNext}
            >
              <Text style={styles.ctaSecondaryText}>İleri</Text>
            </Pressable>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0f766e",
  },
  safe: {
    flex: 1,
    backgroundColor: "transparent",
  },
  decorCircle: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    opacity: 0.1,
  },
  topBar: {
    minHeight: 44,
    paddingHorizontal: ScreenPadding,
    justifyContent: "center",
    alignItems: "flex-end",
  },
  skipHit: {
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  skipPlaceholder: {
    height: 36,
  },
  skipText: {
    color: "rgba(255,255,255,0.95)",
    fontSize: 16,
    fontWeight: "700",
  },
  scrollMeasure: {
    flex: 1,
  },
  slide: {
    justifyContent: "center",
    overflow: "hidden",
  },
  slideInner: {
    flex: 1,
    paddingHorizontal: ScreenPadding,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 28,
  },
  emojiHero: {
    fontSize: 80,
    marginBottom: 20,
    textAlign: "center",
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
    marginBottom: 28,
    maxWidth: 400,
  },
  benefitBadge: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: { elevation: 3 },
    }),
  },
  benefitBadgeText: {
    fontSize: 13,
    fontWeight: "700",
    color: ACCENT_GREEN,
    letterSpacing: 0.2,
  },
  titleSlide1: {
    fontSize: 32,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 12,
    letterSpacing: 0.3,
    maxWidth: 360,
  },
  subtitleSlide1: {
    fontSize: 16,
    lineHeight: 24,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
    maxWidth: 340,
    fontWeight: "500",
  },
  slide2Scroll: {
    flex: 1,
    maxHeight: "100%",
  },
  slide2ScrollContent: {
    paddingHorizontal: ScreenPadding,
    paddingVertical: 28,
    alignItems: "center",
    paddingBottom: 48,
  },
  slide3Scroll: {
    paddingHorizontal: ScreenPadding,
    paddingVertical: 24,
    paddingBottom: 40,
    alignItems: "center",
  },
  emojiMedium: {
    fontSize: 56,
    marginBottom: 16,
  },
  titleSlide2: {
    fontSize: 26,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 10,
    letterSpacing: 0.25,
    maxWidth: 360,
  },
  subtitleSlide2: {
    fontSize: 16,
    lineHeight: 24,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
    maxWidth: 340,
    fontWeight: "500",
    marginBottom: 8,
  },
  chipHint: {
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 8,
    fontWeight: "600",
    maxWidth: 320,
  },
  chipsHeading: {
    marginTop: 16,
    marginBottom: 14,
    fontSize: 15,
    fontWeight: "700",
    color: "rgba(255,255,255,0.95)",
    alignSelf: "stretch",
    textAlign: "center",
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
    maxWidth: 400,
    alignSelf: "center",
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 2,
  },
  chipOn: {
    backgroundColor: "#FFFFFF",
    borderColor: "#FFFFFF",
  },
  chipOff: {
    backgroundColor: "transparent",
    borderColor: "rgba(255,255,255,0.9)",
  },
  chipText: {
    fontSize: 14,
    fontWeight: "700",
  },
  chipTextOn: {
    color: ACCENT_GREEN,
  },
  chipTextOff: {
    color: "#FFFFFF",
  },
  previewList: {
    marginTop: 24,
    width: "100%",
    maxWidth: 400,
    gap: 12,
  },
  previewCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 14,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
      },
      android: { elevation: 4 },
    }),
  },
  previewEmoji: {
    fontSize: 32,
  },
  previewTextCol: {
    flex: 1,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 2,
  },
  previewDesc: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "600",
  },
  footer: {
    paddingHorizontal: ScreenPadding,
    paddingTop: 16,
    paddingBottom: 24,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    marginBottom: 20,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.4)",
  },
  dotActive: {
    width: 28,
    backgroundColor: "#FFFFFF",
  },
  ctaFinal: {
    minHeight: 56,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: { elevation: 5 },
    }),
  },
  ctaFinalText: {
    color: ACCENT_GREEN,
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  ctaSecondary: {
    minHeight: 54,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.95)",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 28,
    backgroundColor: "rgba(255,255,255,0.14)",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  ctaSecondaryText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
});
