import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  Platform,
  Dimensions,
  Animated,
  PanResponder,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Video, ResizeMode } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { StoryItem } from "@/constants/blogStories";
import { ScreenPadding } from "@/constants/theme";

const BLOG_GREEN = "#16a34a";
const RING_SIZE = 76;
const AVATAR_INNER = 68;
const STORY_DURATION_MS = 5000;

/** Parent güncellemesini çocuk setState ile aynı döngüde tetiklemeyi önler */
function defer(fn: () => void) {
  queueMicrotask(fn);
}

type Props = {
  stories: StoryItem[];
  showTitle?: boolean;
  /** Blog üst satırında “Hikayeler” yanında kamera (Instagram tarzı) */
  onCameraPress?: () => void;
  /** Hikaye şeridinin başına “+” ile kendi hikayeni ekle */
  onAddStoryPress?: () => void;
};

export function BlogStoryReelsStrip({
  stories,
  showTitle = true,
  onCameraPress,
  onAddStoryPress,
}: Props) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [startIndex, setStartIndex] = useState(0);

  const open = useCallback(
    (s: StoryItem) => {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      const idx = stories.findIndex((x) => x.id === s.id);
      setStartIndex(idx >= 0 ? idx : 0);
      setViewerOpen(true);
    },
    [stories]
  );

  const close = useCallback(() => {
    setViewerOpen(false);
  }, []);

  return (
    <>
      <View style={styles.stripWrap}>
        {showTitle ? (
          onCameraPress ? (
            <View style={styles.storyHeaderRow}>
              <Pressable
                onPress={onCameraPress}
                style={styles.cameraHeaderBtn}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Kamera ile medya ekle"
              >
                <Ionicons name="camera-outline" size={28} color="#16a34a" />
              </Pressable>
              <Text style={styles.stripTitleInline}>Hikayeler</Text>
            </View>
          ) : (
            <Text style={styles.stripTitle}>Hikayeler</Text>
          )
        ) : null}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.stripScroll}
        >
          {onAddStoryPress ? (
            <Pressable
              style={styles.addStoryCell}
              onPress={onAddStoryPress}
              accessibilityRole="button"
              accessibilityLabel="Hikayeni ekle"
            >
              <View style={styles.addStoryRing}>
                <Text style={styles.addStoryPlus}>+</Text>
              </View>
              <Text style={styles.addStoryLabel}>
                Hikayeni{"\n"}Ekle
              </Text>
            </Pressable>
          ) : null}
          {stories.map((item) => (
            <Pressable
              key={item.id}
              style={styles.storyItem}
              onPress={() => open(item)}
              accessibilityRole="button"
              accessibilityLabel={`${item.username} hikayesi`}
            >
              <LinearGradient
                colors={[item.gradientColors[0], item.gradientColors[1], item.gradientColors[2]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.storyRing}
              >
                <View style={styles.storyAvatar}>
                  <Text style={styles.storyInitial} numberOfLines={1}>
                    {item.initial}
                  </Text>
                </View>
              </LinearGradient>
              <Text style={styles.storyUsername} numberOfLines={1}>
                {item.username}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <InstagramStoryViewer
        key={viewerOpen ? `story-${startIndex}` : "story-closed"}
        visible={viewerOpen}
        stories={stories}
        initialIndex={startIndex}
        onClose={close}
      />
    </>
  );
}

const { width: SCREEN_W } = Dimensions.get("window");

type ViewerProps = {
  visible: boolean;
  stories: StoryItem[];
  initialIndex: number;
  onClose: () => void;
};

function InstagramStoryViewer({ visible, stories, initialIndex, onClose }: ViewerProps) {
  const insets = useSafeAreaInsets();
  const safeInitial = Math.min(
    Math.max(0, initialIndex),
    Math.max(0, stories.length - 1)
  );
  const [index, setIndex] = useState(safeInitial);
  const progress = useRef(new Animated.Value(0)).current;
  const indexRef = useRef(safeInitial);
  const touchStart = useRef({ x: 0, y: 0 });

  const topChromeHeight = insets.top + 8 + 3 + 10 + 44 + 8;

  useEffect(() => {
    indexRef.current = index;
  }, [index]);

  /** Süre dolduğunda sonraki kullanıcı; sondaysa kapat */
  useEffect(() => {
    if (!visible || stories.length === 0) {
      progress.stopAnimation();
      progress.setValue(0);
      return;
    }

    progress.setValue(0);
    const anim = Animated.timing(progress, {
      toValue: 1,
      duration: STORY_DURATION_MS,
      useNativeDriver: false,
    });

    anim.start(({ finished }) => {
      if (!finished) return;
      const i = indexRef.current;
      if (i >= stories.length - 1) {
        defer(onClose);
        return;
      }
      setIndex(i + 1);
    });

    return () => {
      anim.stop();
    };
  }, [visible, index, stories.length, onClose, progress]);

  const goNextUser = useCallback(() => {
    progress.stopAnimation();
    setIndex((i) => {
      if (i >= stories.length - 1) {
        defer(onClose);
        return i;
      }
      return i + 1;
    });
  }, [onClose, progress, stories.length]);

  const goPrevUser = useCallback(() => {
    progress.stopAnimation();
    setIndex((i) => (i > 0 ? i - 1 : i));
  }, [progress]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => false,
        onMoveShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponderCapture: (_, g) =>
          g.dy > 10 && g.dy > Math.abs(g.dx) * 0.7,
        onPanResponderGrant: (e) => {
          touchStart.current = {
            x: e.nativeEvent.pageX,
            y: e.nativeEvent.pageY,
          };
        },
        onPanResponderRelease: (e, g) => {
          if (g.dy > 70 && g.dy > Math.abs(g.dx)) {
            if (Platform.OS !== "web") {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            defer(onClose);
            return;
          }
          if (Math.abs(g.dx) < 18 && Math.abs(g.dy) < 18) {
            const x = e.nativeEvent.pageX;
            if (Platform.OS !== "web") {
              Haptics.selectionAsync();
            }
            if (x < SCREEN_W / 2) {
              goPrevUser();
            } else {
              goNextUser();
            }
          }
        },
      }),
    [goNextUser, goPrevUser, onClose]
  );

  const user = stories[index];

  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="fullScreen"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.viewerRoot}>
        {user ? (
          user.mediaUri && user.mediaKind === "video" ? (
            <View style={StyleSheet.absoluteFill}>
              <Video
                source={{ uri: user.mediaUri }}
                style={StyleSheet.absoluteFill}
                resizeMode={ResizeMode.COVER}
                shouldPlay={visible}
                isLooping
                useNativeControls={false}
              />
              <LinearGradient
                colors={["transparent", "rgba(0,0,0,0.55)"]}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
              />
            </View>
          ) : user.mediaUri ? (
            <View style={StyleSheet.absoluteFill}>
              <Image
                source={{ uri: user.mediaUri }}
                style={StyleSheet.absoluteFill}
                resizeMode="cover"
                accessibilityLabel="Hikaye görseli"
              />
              <LinearGradient
                colors={["transparent", "rgba(0,0,0,0.45)"]}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
              />
            </View>
          ) : (
            <LinearGradient
              colors={[user.gradientColors[0], user.gradientColors[1], user.gradientColors[2]]}
              start={{ x: 0.2, y: 0 }}
              end={{ x: 0.8, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          )
        ) : null}

        <View
          style={[
            styles.touchZone,
            {
              top: topChromeHeight,
              bottom: 0,
            },
          ]}
          {...panResponder.panHandlers}
        />

        {user ? (
          <View style={[styles.centerContent, { paddingTop: topChromeHeight }]} pointerEvents="none">
            <View style={styles.bigAvatar}>
              <Text style={styles.bigAvatarInitial}>{user.initial}</Text>
            </View>
            <Text style={styles.centerName}>{user.username}</Text>
            <Text style={styles.centerTip}>{user.tip}</Text>
          </View>
        ) : null}

        <View
          style={[styles.topChrome, { paddingTop: insets.top + 8 }]}
          pointerEvents="box-none"
        >
          <View style={styles.progressRow}>
            {stories.map((s, i) => (
              <View key={s.id} style={styles.progressTrack}>
                {i < index ? <View style={styles.progressFillFull} /> : null}
                {i === index ? (
                  <Animated.View
                    style={[
                      styles.progressFillAnim,
                      {
                        width: progress.interpolate({
                          inputRange: [0, 1],
                          outputRange: ["0%", "100%"],
                        }),
                      },
                    ]}
                  />
                ) : null}
              </View>
            ))}
          </View>

          <View style={styles.topRow}>
            <Text style={styles.progressHint} pointerEvents="none">
              {stories.length > 0
                ? `${index + 1} / ${stories.length} kullanıcı`
                : ""}
            </Text>
            <Pressable
              onPress={() => defer(onClose)}
              hitSlop={12}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel="Kapat"
            >
              <Ionicons name="close" size={28} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  stripWrap: {
    marginBottom: 16,
    marginHorizontal: -ScreenPadding,
  },
  storyHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
    paddingHorizontal: ScreenPadding,
  },
  cameraHeaderBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  stripTitleInline: {
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  stripTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 12,
    paddingHorizontal: ScreenPadding,
  },
  stripScroll: {
    paddingHorizontal: ScreenPadding,
    gap: 14,
    alignItems: "flex-start",
    paddingBottom: 4,
  },
  storyItem: {
    alignItems: "center",
    width: RING_SIZE + 8,
  },
  storyRing: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    padding: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  storyAvatar: {
    width: AVATAR_INNER,
    height: AVATAR_INNER,
    borderRadius: AVATAR_INNER / 2,
    backgroundColor: "rgba(255,255,255,0.95)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.9)",
  },
  storyInitial: {
    fontSize: 22,
    fontWeight: "800",
    color: BLOG_GREEN,
    maxWidth: AVATAR_INNER - 8,
  },
  storyUsername: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: "600",
    color: "#6B7280",
    textAlign: "center",
    maxWidth: RING_SIZE + 12,
  },
  addStoryCell: {
    alignItems: "center",
    width: RING_SIZE + 8,
    marginRight: 2,
  },
  addStoryRing: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 2,
    borderColor: BLOG_GREEN,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  addStoryPlus: {
    fontSize: 34,
    fontWeight: "300",
    color: BLOG_GREEN,
    lineHeight: 38,
  },
  addStoryLabel: {
    marginTop: 6,
    fontSize: 10,
    fontWeight: "700",
    color: "#374151",
    textAlign: "center",
    lineHeight: 13,
    maxWidth: RING_SIZE + 12,
  },
  viewerRoot: {
    flex: 1,
    backgroundColor: "#000000",
  },
  touchZone: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 5,
    backgroundColor: "transparent",
  },
  centerContent: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 4,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  bigAvatar: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.45)",
  },
  bigAvatarInitial: {
    fontSize: 40,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  centerName: {
    marginTop: 20,
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
  },
  centerTip: {
    marginTop: 16,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "500",
    color: "rgba(255,255,255,0.92)",
    textAlign: "center",
  },
  topChrome: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    paddingHorizontal: 12,
  },
  progressRow: {
    flexDirection: "row",
    gap: 4,
    marginBottom: 10,
  },
  progressTrack: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.35)",
    overflow: "hidden",
  },
  progressFillFull: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#FFFFFF",
  },
  progressFillAnim: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "#FFFFFF",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  progressHint: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255,255,255,0.85)",
  },
  closeBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
});
